/**
 * PropertyDocz — Auto-Fill Service
 *
 * Populates a document request's live_data with known values from
 * the association's field values. Tier 1 (static) fields are pulled
 * directly; Tier 2 (periodic) fields are included with staleness
 * metadata; Tier 3 (transaction) fields are left for manual input.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { getFieldsForDocumentType } from "./field-registry";
import { getAssociationFieldValues } from "./association-data";
import type { FieldDefinition, AssociationFieldValue } from "@/lib/types/fields";

/** Result of the auto-fill operation */
export interface AutoFillResult {
  fields_filled: number;
  fields_total: number;
  filled_fields: Array<{
    field_key: string;
    value: string;
    tier: "static" | "periodic" | "transaction";
    confidence: string;
    stale: boolean;
    days_since_verified?: number;
  }>;
  empty_fields: Array<{
    field_key: string;
    tier: "static" | "periodic" | "transaction";
    reason: "no_data" | "transaction_specific";
  }>;
  stale_fields: Array<{
    field_key: string;
    value: string;
    days_since_verified: number;
    staleness_threshold: number;
  }>;
}

/**
 * Auto-fill a document request with known association data.
 *
 * 1. Fetches field definitions for the document type
 * 2. Fetches current association field values
 * 3. Merges into live_data (without overwriting existing requester data)
 * 4. Updates the request record
 * 5. Returns metadata about what was filled
 */
export async function autoFillRequest(
  requestId: string,
  associationId: string,
  documentType: string
): Promise<AutoFillResult> {
  const supabase = await createServiceClient();

  // 1. Get field definitions for this document type
  const fieldDefs = await getFieldsForDocumentType(documentType);

  // 2. Get current association field values
  const fieldValues = await getAssociationFieldValues(associationId);
  const valueMap = new Map<string, AssociationFieldValue>();
  for (const v of fieldValues) {
    valueMap.set(v.field_key, v);
  }

  // 3. Build staleness map from field definitions
  const stalenessMap = new Map<string, number>();
  for (const def of fieldDefs) {
    if (def.staleness_days) {
      stalenessMap.set(def.field_key, def.staleness_days);
    }
  }

  // 4. Get existing live_data from the request (requester-provided data)
  const { data: request } = await supabase
    .from("document_requests")
    .select("live_data, property_address, requester_name, requester_email, requester_type")
    .eq("id", requestId)
    .single();

  const existingLiveData = (request?.live_data as Record<string, string>) || {};

  // 5. Build merged live_data and result metadata
  const mergedData: Record<string, string> = { ...existingLiveData };
  const result: AutoFillResult = {
    fields_filled: 0,
    fields_total: fieldDefs.length,
    filled_fields: [],
    empty_fields: [],
    stale_fields: [],
  };

  const now = Date.now();

  for (const def of fieldDefs) {
    const fieldValue = valueMap.get(def.field_key);
    const tier = def.tier as "static" | "periodic" | "transaction";

    // Skip if requester already provided this value
    if (existingLiveData[def.field_key]) {
      result.fields_filled++;
      result.filled_fields.push({
        field_key: def.field_key,
        value: existingLiveData[def.field_key],
        tier,
        confidence: "manual",
        stale: false,
      });
      continue;
    }

    // Transaction-specific fields: leave empty
    if (tier === "transaction") {
      // But check for requester info from the request record itself
      const requestFieldValue = getRequestFieldValue(def.field_key, request);
      if (requestFieldValue) {
        mergedData[def.field_key] = requestFieldValue;
        result.fields_filled++;
        result.filled_fields.push({
          field_key: def.field_key,
          value: requestFieldValue,
          tier,
          confidence: "from_request",
          stale: false,
        });
        continue;
      }

      result.empty_fields.push({
        field_key: def.field_key,
        tier,
        reason: "transaction_specific",
      });
      continue;
    }

    // Static and periodic fields: pull from association data
    if (fieldValue?.value) {
      mergedData[def.field_key] = fieldValue.value;
      result.fields_filled++;

      // Check staleness for periodic fields
      let isStale = false;
      let daysSinceVerified: number | undefined;
      const stalenessDays = stalenessMap.get(def.field_key);

      if (tier === "periodic" && stalenessDays && fieldValue.last_verified_at) {
        const verifiedAt = new Date(fieldValue.last_verified_at).getTime();
        daysSinceVerified = Math.floor((now - verifiedAt) / (24 * 60 * 60 * 1000));
        isStale = daysSinceVerified > stalenessDays;

        if (isStale) {
          result.stale_fields.push({
            field_key: def.field_key,
            value: fieldValue.value,
            days_since_verified: daysSinceVerified,
            staleness_threshold: stalenessDays,
          });
        }
      } else if (tier === "periodic" && stalenessDays && !fieldValue.last_verified_at) {
        isStale = true;
        result.stale_fields.push({
          field_key: def.field_key,
          value: fieldValue.value,
          days_since_verified: 999,
          staleness_threshold: stalenessDays,
        });
      }

      result.filled_fields.push({
        field_key: def.field_key,
        value: fieldValue.value,
        tier,
        confidence: fieldValue.confidence,
        stale: isStale,
        days_since_verified: daysSinceVerified,
      });
    } else {
      result.empty_fields.push({
        field_key: def.field_key,
        tier,
        reason: "no_data",
      });
    }
  }

  // 6. Save merged live_data to the request
  await supabase
    .from("document_requests")
    .update({ live_data: mergedData })
    .eq("id", requestId);

  return result;
}

/**
 * Extract known transaction fields from the request record itself.
 * Maps request columns to field_definitions field_keys.
 */
function getRequestFieldValue(
  fieldKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any
): string | null {
  if (!request) return null;

  switch (fieldKey) {
    case "property_address":
      return request.property_address || null;
    case "requester_name":
      return request.requester_name || null;
    case "requester_type":
      return request.requester_type || null;
    default:
      return null;
  }
}
