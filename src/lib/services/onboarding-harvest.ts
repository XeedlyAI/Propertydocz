/**
 * PropertyDocz — Onboarding Harvest Pipeline
 *
 * Orchestrates the full data harvest for one association:
 * 1. Scan Dropbox folder
 * 2. Categorize documents
 * 3. Extract data via Claude API
 * 4. Populate association_field_values
 * 5. Generate harvest report
 */

import { createServiceClient } from "@/lib/supabase/server";
import {
  getValidAccessToken,
  listFolder,
  downloadFile,
  type DropboxEntry,
} from "@/lib/dropbox";
import {
  categorizeDocuments,
  type CategorizationResult,
} from "./document-categorizer";
import {
  extractFromDocument,
  getDocumentText,
  type ExtractionResult,
} from "./document-extractor";
import { upsertFieldValue } from "./association-data";
import { getFieldsByTier, getAllFields } from "./field-registry";

/** Supported file extensions for harvest */
const SUPPORTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".rtf"];

/** Harvest report — summary of the full onboarding harvest for an association */
export interface HarvestReport {
  association_id: string;
  documents_found: number;
  documents_processed: number;
  documents_failed: number;
  documents_skipped_ocr: number;
  fields_extracted: number;
  fields_by_tier: { static: number; periodic: number; transaction: number };
  fields_missing: string[];
  changes_detected: Array<{
    field_key: string;
    new_value: string;
    previous_value: string;
    source_document: string;
  }>;
  errors: Array<{ file: string; error: string }>;
  completeness_score: number;
  categorization: CategorizationResult[];
}

/**
 * Run the full onboarding harvest for an association.
 *
 * Flow:
 * 1. Set onboarding_status to 'harvesting'
 * 2. List files from Dropbox
 * 3. Categorize files
 * 4. Extract data from each file (rate-limited)
 * 5. Upsert extracted values
 * 6. Log to document_sync_log
 * 7. Generate harvest report
 * 8. Set onboarding_status to 'review'
 */
export async function harvestAssociationData(
  associationId: string,
  tenantId: string
): Promise<HarvestReport> {
  const supabase = await createServiceClient();

  // Initialize report
  const report: HarvestReport = {
    association_id: associationId,
    documents_found: 0,
    documents_processed: 0,
    documents_failed: 0,
    documents_skipped_ocr: 0,
    fields_extracted: 0,
    fields_by_tier: { static: 0, periodic: 0, transaction: 0 },
    fields_missing: [],
    changes_detected: [],
    errors: [],
    completeness_score: 0,
    categorization: [],
  };

  try {
    // 1. Set onboarding_status to 'harvesting'
    await supabase
      .from("associations")
      .update({ onboarding_status: "harvesting" })
      .eq("id", associationId);

    // 2. Get tenant's Dropbox credentials
    const { data: tenant } = await supabase
      .from("tenants")
      .select("dropbox_access_token, dropbox_refresh_token")
      .eq("id", tenantId)
      .single();

    if (!tenant?.dropbox_access_token || !tenant?.dropbox_refresh_token) {
      throw new Error("Dropbox not connected for this tenant");
    }

    // 3. Get association's Dropbox folder path and name
    const { data: association } = await supabase
      .from("associations")
      .select("name, dropbox_folder_path")
      .eq("id", associationId)
      .single();

    if (!association?.dropbox_folder_path) {
      throw new Error("No Dropbox folder mapped for this association");
    }

    // 4. Get a valid access token
    const accessToken = await getValidAccessToken(
      supabase,
      tenantId,
      tenant.dropbox_access_token,
      tenant.dropbox_refresh_token
    );

    // 5. List all files in the folder
    const entries = await listFolder(accessToken, association.dropbox_folder_path);
    const files = entries.filter(
      (e: DropboxEntry) =>
        e[".tag"] === "file" &&
        SUPPORTED_EXTENSIONS.some((ext) => e.name.toLowerCase().endsWith(ext))
    );

    report.documents_found = files.length;

    if (files.length === 0) {
      await supabase
        .from("associations")
        .update({ onboarding_status: "review" })
        .eq("id", associationId);
      return report;
    }

    // 6. Categorize files
    const filenames = files.map((f: DropboxEntry) => f.name);
    const categorization = await categorizeDocuments(filenames);
    report.categorization = categorization;

    // Build a filename → category map
    const categoryMap = new Map<string, string>();
    for (const cat of categorization) {
      categoryMap.set(cat.filename, cat.category);
    }

    // 7. Get existing field values for change detection
    const { data: existingValues } = await supabase
      .from("association_field_values")
      .select("field_key, value")
      .eq("association_id", associationId);

    const existingMap: Record<string, string> = {};
    for (const v of existingValues || []) {
      if (v.value) existingMap[v.field_key] = v.value;
    }

    // 8. Process each file sequentially (rate-limited)
    for (const file of files) {
      const category = categoryMap.get(file.name) ?? "other";

      // Skip 'other' and 'plat_map' — nothing to extract
      if (category === "other" || category === "plat_map") {
        continue;
      }

      try {
        // Download file from Dropbox
        const { buffer, name } = await downloadFile(accessToken, file.path_lower);

        // Extract text
        const { text, requiresOCR } = await getDocumentText(buffer, name);

        if (requiresOCR) {
          report.documents_skipped_ocr++;
          report.errors.push({
            file: name,
            error: "Image-only PDF — requires OCR (not yet supported)",
          });

          // Log to document_sync_log
          await logDocumentSync(supabase, associationId, file, category, "failed", null);
          continue;
        }

        if (!text) {
          report.documents_failed++;
          report.errors.push({
            file: name,
            error: "Could not extract text from document",
          });
          await logDocumentSync(supabase, associationId, file, category, "failed", null);
          continue;
        }

        // Run AI extraction
        const extraction = await extractFromDocument(
          text,
          category,
          association.name,
          existingMap
        );

        // Upsert extracted values
        const extractedKeys = Object.keys(extraction.extracted);
        for (const fieldKey of extractedKeys) {
          const value = extraction.extracted[fieldKey];
          await upsertFieldValue(
            associationId,
            fieldKey,
            value,
            "onboarding_upload",
            name
          );
          report.fields_extracted++;

          // Update our local map for subsequent extractions
          existingMap[fieldKey] = value;
        }

        // Track changes
        for (const change of extraction.changes) {
          report.changes_detected.push({
            field_key: change.field_key,
            new_value: change.new_value,
            previous_value: change.previous_value,
            source_document: name,
          });
        }

        // Log to document_sync_log
        await logDocumentSync(
          supabase,
          associationId,
          file,
          category,
          "completed",
          extraction
        );

        report.documents_processed++;

        // Rate limiting — wait 1 second between API calls
        await delay(1000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        report.documents_failed++;
        report.errors.push({ file: file.name, error: msg });
        await logDocumentSync(supabase, associationId, file, category, "failed", null);
      }
    }

    // 9. Calculate completeness score and missing fields
    await calculateCompleteness(supabase, associationId, report);

    // 10. Set onboarding_status to 'review'
    await supabase
      .from("associations")
      .update({ onboarding_status: "review" })
      .eq("id", associationId);
  } catch (error) {
    // On fatal error, set status back to 'pending'
    await supabase
      .from("associations")
      .update({ onboarding_status: "pending" })
      .eq("id", associationId);

    const msg = error instanceof Error ? error.message : "Unknown error";
    report.errors.push({ file: "_pipeline", error: msg });
  }

  return report;
}

/**
 * Log a processed document to the document_sync_log table.
 */
async function logDocumentSync(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  associationId: string,
  file: DropboxEntry,
  category: string,
  status: "completed" | "failed",
  extraction: ExtractionResult | null
): Promise<void> {
  try {
    await supabase.from("document_sync_log").upsert(
      {
        association_id: associationId,
        dropbox_file_id: file.id,
        dropbox_path: file.path_lower,
        file_name: file.name,
        category,
        file_hash: file.server_modified || null,
        last_synced_at: new Date().toISOString(),
        extraction_status: status,
        extracted_fields: extraction?.extracted || null,
      },
      { onConflict: "association_id,dropbox_file_id" }
    );
  } catch (error) {
    console.error("Failed to log document sync:", error);
  }
}

/**
 * Calculate completeness score based on fields extracted
 * vs total extractable (static + periodic) fields.
 */
async function calculateCompleteness(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  associationId: string,
  report: HarvestReport
): Promise<void> {
  try {
    // Get all field definitions
    const allFields = await getAllFields();
    const staticFields = allFields.filter((f) => f.tier === "static");
    const periodicFields = allFields.filter((f) => f.tier === "periodic");

    // Get current field values
    const { data: currentValues } = await supabase
      .from("association_field_values")
      .select("field_key")
      .eq("association_id", associationId)
      .not("value", "is", null);

    const populatedKeys = new Set(
      (currentValues || []).map((v: { field_key: string }) => v.field_key)
    );

    // Count populated by tier
    for (const field of staticFields) {
      if (populatedKeys.has(field.field_key)) {
        report.fields_by_tier.static++;
      }
    }
    for (const field of periodicFields) {
      if (populatedKeys.has(field.field_key)) {
        report.fields_by_tier.periodic++;
      }
    }

    // Determine missing fields (static + periodic only — transaction are per-request)
    const extractableFields = [...staticFields, ...periodicFields];
    report.fields_missing = extractableFields
      .filter((f) => !populatedKeys.has(f.field_key))
      .map((f) => f.field_key);

    // Completeness = populated / total extractable * 100
    const totalExtractable = extractableFields.length;
    const totalPopulated =
      report.fields_by_tier.static + report.fields_by_tier.periodic;
    report.completeness_score =
      totalExtractable > 0
        ? Math.round((totalPopulated / totalExtractable) * 100)
        : 0;
  } catch (error) {
    console.error("Failed to calculate completeness:", error);
  }
}

/** Simple delay helper for rate limiting */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
