/**
 * PropertyDocz — Dropbox Continuous Sync Service
 *
 * The single source of truth for syncing Dropbox documents for an association.
 * Replaces the delta check from Phase C with a full sync implementation that:
 *
 * - Detects new, modified, and deleted files
 * - Categorizes and extracts data from changed files
 * - Updates association_field_values with extracted data
 * - Maintains document_sync_log for change tracking
 *
 * Every sync caller (onboarding harvest, request creation, manual trigger)
 * should funnel through this service.
 */

import { createServiceClient } from "@/lib/supabase/server";
import {
  getTenantStorageCredentials,
  getStorageAdapter,
  persistRefreshedToken,
  DropboxAdapter,
} from "./storage-providers";
import type { StorageFile } from "./storage-providers";
import { categorizeDocuments } from "./document-categorizer";
import {
  extractFromDocument,
  getDocumentText,
} from "./document-extractor";
import { upsertFieldValue } from "./association-data";

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

export interface SyncFieldUpdate {
  field_key: string;
  new_value: string;
  previous_value?: string;
  source_document: string;
  change_type: "new" | "updated";
}

export interface SyncResult {
  association_id: string;
  sync_started_at: string;
  sync_completed_at: string;
  files_total: number;
  files_new: number;
  files_modified: number;
  files_unchanged: number;
  files_deleted: number;
  files_failed: number;
  fields_updated: SyncFieldUpdate[];
  errors: Array<{ file: string; error: string }>;
}

interface SyncLogEntry {
  dropbox_file_id: string | null;
  dropbox_path: string | null;
  file_name: string | null;
  file_hash: string | null;
  file_modified_at: string | null;
  extraction_status: string | null;
  extracted_fields: Record<string, string> | null;
  deleted_at: string | null;
}

const SUPPORTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".rtf"];

// ════════════════════════════════════════
// Main sync function
// ════════════════════════════════════════

/**
 * Sync an association's Dropbox folder — detect new, modified, and deleted
 * files, extract data, and update association_field_values.
 *
 * @param associationId  The association to sync
 * @param tenantId       The owning tenant (for Dropbox creds)
 * @param options.forceFullSync  If true, re-process ALL files regardless of hash
 */
export async function syncAssociationDocuments(
  associationId: string,
  tenantId: string,
  options?: { forceFullSync?: boolean }
): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const force = options?.forceFullSync ?? false;

  const result: SyncResult = {
    association_id: associationId,
    sync_started_at: startedAt,
    sync_completed_at: startedAt,
    files_total: 0,
    files_new: 0,
    files_modified: 0,
    files_unchanged: 0,
    files_deleted: 0,
    files_failed: 0,
    fields_updated: [],
    errors: [],
  };

  try {
    const supabase = await createServiceClient();

    // ── 1. Get association info ────────────────
    const { data: association } = await supabase
      .from("associations")
      .select("name, dropbox_folder_path")
      .eq("id", associationId)
      .single();

    if (!association?.dropbox_folder_path) {
      result.sync_completed_at = new Date().toISOString();
      return result; // No folder mapped — nothing to sync
    }

    // ── 2. Get tenant's storage credentials ────
    const storageCreds = await getTenantStorageCredentials(supabase, tenantId);

    if (!storageCreds) {
      result.sync_completed_at = new Date().toISOString();
      return result; // No storage connected
    }

    // ── 3. Get storage adapter with valid credentials ─
    const adapter = getStorageAdapter(
      storageCreds.provider,
      storageCreds.accessToken,
      storageCreds.refreshToken
    );

    // For Dropbox, validate and persist refreshed token
    if (adapter instanceof DropboxAdapter) {
      await adapter.getValidToken();
      if (adapter.currentAccessToken !== storageCreds.accessToken) {
        await persistRefreshedToken(
          supabase,
          tenantId,
          adapter.currentAccessToken,
          storageCreds.connectionId
        );
      }
    }

    // ── 4. List all files in storage folder ────
    const allFiles = await adapter.listFiles(association.dropbox_folder_path);
    const dropboxFiles = allFiles.filter(
      (f: StorageFile) =>
        !f.is_folder &&
        SUPPORTED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    result.files_total = dropboxFiles.length;

    // ── 5. Get existing sync log entries ───────
    const { data: syncLogs } = await supabase
      .from("document_sync_log")
      .select(
        "dropbox_file_id, dropbox_path, file_name, file_hash, file_modified_at, extraction_status, extracted_fields, deleted_at"
      )
      .eq("association_id", associationId);

    const syncMap = new Map<string, SyncLogEntry>();
    for (const log of (syncLogs || []) as SyncLogEntry[]) {
      if (log.dropbox_file_id) {
        syncMap.set(log.dropbox_file_id, log);
      }
    }

    // ── 6. Classify files ──────────────────────
    const newFiles: StorageFile[] = [];
    const modifiedFiles: StorageFile[] = [];
    const unchangedFiles: StorageFile[] = [];

    const storageFileIds = new Set<string>();

    for (const file of dropboxFiles) {
      storageFileIds.add(file.id);
      const existing = syncMap.get(file.id);

      if (!existing || existing.deleted_at) {
        newFiles.push(file);
      } else if (force) {
        modifiedFiles.push(file);
      } else if (
        file.modified_at &&
        existing.file_modified_at !== file.modified_at
      ) {
        modifiedFiles.push(file);
      } else if (
        file.modified_at &&
        existing.file_hash &&
        existing.file_hash !== file.modified_at
      ) {
        // Legacy comparison (file_hash stored server_modified in Phase C)
        modifiedFiles.push(file);
      } else {
        unchangedFiles.push(file);
      }
    }

    result.files_new = newFiles.length;
    result.files_modified = modifiedFiles.length;
    result.files_unchanged = unchangedFiles.length;

    // ── 7. Detect deleted files ────────────────
    for (const [fileId, logEntry] of syncMap.entries()) {
      if (!storageFileIds.has(fileId) && !logEntry.deleted_at) {
        // File was in sync log but no longer in Dropbox
        result.files_deleted++;
        try {
          await supabase
            .from("document_sync_log")
            .update({ deleted_at: new Date().toISOString() })
            .eq("association_id", associationId)
            .eq("dropbox_file_id", fileId);
        } catch (err) {
          console.error(`Failed to mark file ${fileId} as deleted:`, err);
        }
      }
    }

    // If nothing to process, return early
    const filesToProcess = [...newFiles, ...modifiedFiles];
    if (filesToProcess.length === 0) {
      result.sync_completed_at = new Date().toISOString();
      return result;
    }

    // ── 8. Categorize changed files ────────────
    const filenames = filesToProcess.map((f) => f.name);
    const categorization = await categorizeDocuments(filenames);
    const categoryMap = new Map<string, string>();
    for (const cat of categorization) {
      categoryMap.set(cat.filename, cat.category);
    }

    // ── 9. Get existing field values for change detection ──
    const { data: existingValues } = await supabase
      .from("association_field_values")
      .select("field_key, value")
      .eq("association_id", associationId);

    const existingMap: Record<string, string> = {};
    for (const v of existingValues || []) {
      if (v.value) existingMap[v.field_key] = v.value;
    }

    // ── 10. Process each changed file ──────────

    for (const file of filesToProcess) {
      const category = categoryMap.get(file.name) ?? "other";

      // Skip non-extractable categories
      if (category === "other" || category === "plat_map") {
        // Still log it to sync log
        await upsertSyncLog(supabase, associationId, file, category, "completed", null);
        continue;
      }

      try {
        // Download from storage provider
        const { buffer, name } = await adapter.downloadFile(file.path);

        // Extract text
        const { text, requiresOCR } = await getDocumentText(buffer, name);

        if (requiresOCR) {
          result.files_failed++;
          result.errors.push({
            file: name,
            error: "Image-only PDF — requires OCR (not yet supported)",
          });
          await upsertSyncLog(supabase, associationId, file, category, "failed", null);
          continue;
        }

        if (!text) {
          result.files_failed++;
          result.errors.push({
            file: name,
            error: "Could not extract text from document",
          });
          await upsertSyncLog(supabase, associationId, file, category, "failed", null);
          continue;
        }

        // Run AI extraction
        const extraction = await extractFromDocument(
          text,
          category,
          association.name,
          existingMap
        );

        // Upsert extracted values to association_field_values
        for (const [fieldKey, value] of Object.entries(extraction.extracted)) {
          const previous = existingMap[fieldKey];
          await upsertFieldValue(
            associationId,
            fieldKey,
            value,
            "dropbox_extraction",
            name
          );

          const changeType: "new" | "updated" = previous ? "updated" : "new";
          result.fields_updated.push({
            field_key: fieldKey,
            new_value: value,
            previous_value: previous,
            source_document: name,
            change_type: changeType,
          });

          // Update our local map for subsequent extractions
          existingMap[fieldKey] = value;
        }

        // Log to document_sync_log
        await upsertSyncLog(
          supabase,
          associationId,
          file,
          category,
          "completed",
          extraction.extracted
        );

        // Rate limiting — 1 second between Claude API calls
        await delay(1000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        result.files_failed++;
        result.errors.push({ file: file.name, error: msg });
        await upsertSyncLog(supabase, associationId, file, category, "failed", null);
      }
    }

    // Adjust counts: files_failed came from new or modified
    // The total processed = new + modified, minus the ones that failed
    // But we keep the original classification counts intact

    result.sync_completed_at = new Date().toISOString();
  } catch (error) {
    console.error("Dropbox sync failed:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    result.errors.push({ file: "_sync_pipeline", error: msg });
    result.sync_completed_at = new Date().toISOString();
  }

  return result;
}

// ════════════════════════════════════════
// Helpers
// ════════════════════════════════════════

/**
 * Upsert a sync log entry for a processed file.
 * Accepts the generic StorageFile type.
 */
async function upsertSyncLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  associationId: string,
  file: StorageFile,
  category: string,
  status: "completed" | "failed",
  extractedFields: Record<string, string> | null
): Promise<void> {
  try {
    await supabase.from("document_sync_log").upsert(
      {
        association_id: associationId,
        dropbox_file_id: file.id,
        dropbox_path: file.path,
        file_name: file.name,
        category,
        file_hash: file.modified_at || null,
        file_modified_at: file.modified_at || null,
        last_synced_at: new Date().toISOString(),
        extraction_status: status,
        extracted_fields: extractedFields,
        deleted_at: null, // Clear deleted_at if file reappears
      },
      { onConflict: "association_id,dropbox_file_id" }
    );
  } catch (error) {
    console.error("Failed to upsert sync log:", error);
  }
}

/** Simple delay for rate limiting */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
