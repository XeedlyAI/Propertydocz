/**
 * PropertyDocz — Request Intelligence Pipeline
 *
 * Orchestrates auto-fill, delta check, and gap analysis when a new
 * document request is created. Called after checkout/payment to
 * intelligently populate the request and determine its initial status.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { autoFillRequest, type AutoFillResult } from "./auto-fill";
import { syncAssociationDocuments, type SyncResult } from "./dropbox-sync";
import { analyzeRequestGaps } from "./gap-analysis";
import { getFieldsForDocumentType } from "./field-registry";
import { getAssociationFieldValues } from "./association-data";
import type { GapAnalysisResult } from "@/lib/types/fields";

/** Result of the full intelligence pipeline */
export interface IntelligenceResult {
  autoFill: AutoFillResult | null;
  sync: SyncResult | null;
  gapAnalysis: GapAnalysisResult | null;
  finalStatus: string;
  error?: string;
}

/**
 * Run the full intelligence pipeline on a document request.
 *
 * Flow:
 * 1. Auto-fill request with known association data
 * 2. Check Dropbox for new documents (delta)
 * 3. If delta found new data, re-run auto-fill
 * 4. Run AI gap analysis
 * 5. Set request status based on gap analysis result
 *
 * Fails gracefully — if any step errors, the request stays in
 * awaiting_data and the admin handles it manually.
 */
export async function runRequestIntelligence(
  requestId: string,
  associationId: string,
  tenantId: string,
  documentTypes: string[]
): Promise<IntelligenceResult> {
  const result: IntelligenceResult = {
    autoFill: null,
    sync: null,
    gapAnalysis: null,
    finalStatus: "awaiting_data",
  };

  const supabase = await createServiceClient();

  try {
    // Use the first document type for field lookups
    // (most requests have one primary doc type)
    const primaryDocType = documentTypes[0];

    // Step 1: Auto-fill with known association data
    try {
      result.autoFill = await autoFillRequest(
        requestId,
        associationId,
        primaryDocType
      );
    } catch (error) {
      console.error("Auto-fill failed:", error);
    }

    // Step 2: Sync Dropbox documents (replaces delta check)
    try {
      result.sync = await syncAssociationDocuments(associationId, tenantId);
    } catch (error) {
      console.error("Dropbox sync failed:", error);
    }

    // Step 3: If sync found new data, re-run auto-fill to pick up new values
    if (result.sync && result.sync.fields_updated.length > 0) {
      try {
        result.autoFill = await autoFillRequest(
          requestId,
          associationId,
          primaryDocType
        );
      } catch (error) {
        console.error("Auto-fill re-run failed:", error);
      }
    }

    // Step 4: Run AI gap analysis
    try {
      // Get the latest live_data from the request
      const { data: request } = await supabase
        .from("document_requests")
        .select("live_data")
        .eq("id", requestId)
        .single();

      const liveData = (request?.live_data as Record<string, string>) || {};

      // Get field definitions and association values for the analysis
      const fieldDefs = await getFieldsForDocumentType(primaryDocType);
      const fieldValues = await getAssociationFieldValues(associationId);

      result.gapAnalysis = await analyzeRequestGaps(
        requestId,
        primaryDocType,
        liveData,
        fieldDefs,
        fieldValues
      );
    } catch (error) {
      console.error("Gap analysis failed:", error);
    }

    // Step 5: Set status based on gap analysis
    if (result.gapAnalysis) {
      result.finalStatus =
        result.gapAnalysis.recommended_status === "ready_for_review"
          ? "pending_review"
          : "awaiting_data";
    }

    // Update the request status
    await supabase
      .from("document_requests")
      .update({ status: result.finalStatus })
      .eq("id", requestId);
  } catch (error) {
    console.error("Request intelligence pipeline failed:", error);
    result.error = error instanceof Error ? error.message : "Unknown error";

    // Ensure status is at least awaiting_data
    try {
      await supabase
        .from("document_requests")
        .update({ status: "awaiting_data" })
        .eq("id", requestId);
    } catch {
      // Last resort — don't let a status update failure break everything
    }
  }

  return result;
}
