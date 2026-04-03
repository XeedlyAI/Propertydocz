/**
 * PropertyDocz — Association Data Service
 *
 * CRUD operations for association_field_values — the table that stores
 * the current known value of every field for each association.
 * Includes staleness detection and bulk operations.
 */

import { createServiceClient } from "@/lib/supabase/server";
import type { AssociationFieldValue } from "@/lib/types/fields";

/**
 * Get all current field values for an association.
 */
export async function getAssociationFieldValues(
  associationId: string
): Promise<AssociationFieldValue[]> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("association_field_values")
    .select("*")
    .eq("association_id", associationId)
    .order("field_key");

  if (error) {
    console.error("Failed to fetch association field values:", error);
    return [];
  }

  return (data ?? []) as AssociationFieldValue[];
}

/**
 * Get a single field value for an association.
 */
export async function getAssociationFieldValue(
  associationId: string,
  fieldKey: string
): Promise<AssociationFieldValue | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("association_field_values")
    .select("*")
    .eq("association_id", associationId)
    .eq("field_key", fieldKey)
    .single();

  if (error) {
    return null;
  }

  return data as AssociationFieldValue;
}

/**
 * Upsert (insert or update) a field value for an association.
 * Stores the previous value for comparison when AI updates occur.
 */
export async function upsertFieldValue(
  associationId: string,
  fieldKey: string,
  value: string,
  source: string,
  sourceDocument?: string
): Promise<void> {
  const supabase = await createServiceClient();

  // Fetch the existing value to preserve as previous_value
  const existing = await getAssociationFieldValue(associationId, fieldKey);
  const previousValue = existing?.value ?? null;

  const { error } = await supabase
    .from("association_field_values")
    .upsert(
      {
        association_id: associationId,
        field_key: fieldKey,
        value,
        confidence: source === "manual" || source === "admin_confirmed"
          ? "verified"
          : "ai_extracted",
        source,
        source_document: sourceDocument ?? null,
        previous_value: previousValue !== value ? previousValue : existing?.previous_value ?? null,
        last_verified_at: source === "manual" || source === "admin_confirmed"
          ? new Date().toISOString()
          : existing?.last_verified_at ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "association_id,field_key" }
    );

  if (error) {
    console.error(`Failed to upsert field value ${fieldKey}:`, error);
    throw new Error(`Failed to save field value: ${error.message}`);
  }
}

/**
 * Confirm a field value as current/verified.
 * Updates last_verified_at and last_verified_by, sets confidence to 'verified'.
 */
export async function confirmFieldValue(
  associationId: string,
  fieldKey: string,
  userId: string
): Promise<void> {
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("association_field_values")
    .update({
      confidence: "verified",
      last_verified_at: new Date().toISOString(),
      last_verified_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("association_id", associationId)
    .eq("field_key", fieldKey);

  if (error) {
    console.error(`Failed to confirm field value ${fieldKey}:`, error);
    throw new Error(`Failed to confirm field: ${error.message}`);
  }
}

/**
 * Bulk confirm multiple field values as current/verified.
 * Used for the "Confirm All Verified" one-click action.
 */
export async function bulkConfirmFields(
  associationId: string,
  fieldKeys: string[],
  userId: string
): Promise<void> {
  if (fieldKeys.length === 0) return;

  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("association_field_values")
    .update({
      confidence: "verified",
      last_verified_at: new Date().toISOString(),
      last_verified_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("association_id", associationId)
    .in("field_key", fieldKeys);

  if (error) {
    console.error("Failed to bulk confirm fields:", error);
    throw new Error(`Failed to bulk confirm: ${error.message}`);
  }
}

/**
 * Get fields that are past their staleness window.
 * Joins with field_definitions to check staleness_days against last_verified_at.
 *
 * Returns field values where:
 * - The field has a staleness_days defined (periodic tier)
 * - last_verified_at is older than staleness_days ago (or null)
 */
export async function getStaleFields(
  associationId: string
): Promise<AssociationFieldValue[]> {
  const supabase = await createServiceClient();

  // Fetch all field values for this association
  const { data: values, error: valuesError } = await supabase
    .from("association_field_values")
    .select("*")
    .eq("association_id", associationId);

  if (valuesError || !values) {
    console.error("Failed to fetch field values for staleness check:", valuesError);
    return [];
  }

  // Fetch field definitions with staleness_days
  const { data: definitions, error: defsError } = await supabase
    .from("field_definitions")
    .select("field_key, staleness_days")
    .not("staleness_days", "is", null);

  if (defsError || !definitions) {
    console.error("Failed to fetch field definitions for staleness check:", defsError);
    return [];
  }

  // Build a map of field_key → staleness_days
  const stalenessMap = new Map<string, number>();
  for (const def of definitions) {
    if (def.staleness_days) {
      stalenessMap.set(def.field_key, def.staleness_days);
    }
  }

  const now = Date.now();
  const staleValues: AssociationFieldValue[] = [];

  for (const val of values as AssociationFieldValue[]) {
    const stalenessDays = stalenessMap.get(val.field_key);
    if (stalenessDays === undefined) continue; // Not a periodic field

    if (!val.last_verified_at) {
      // Never verified — definitely stale
      staleValues.push(val);
      continue;
    }

    const verifiedAt = new Date(val.last_verified_at).getTime();
    const staleAfterMs = stalenessDays * 24 * 60 * 60 * 1000;

    if (now - verifiedAt > staleAfterMs) {
      staleValues.push(val);
    }
  }

  return staleValues;
}

/**
 * Get all field values for an association as a flat key→value map.
 * Useful for merging into document generation data.
 */
export async function getAssociationFieldMap(
  associationId: string
): Promise<Record<string, string>> {
  const values = await getAssociationFieldValues(associationId);
  const map: Record<string, string> = {};
  for (const v of values) {
    if (v.value !== null) {
      map[v.field_key] = v.value;
    }
  }
  return map;
}
