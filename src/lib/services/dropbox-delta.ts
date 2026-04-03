/**
 * PropertyDocz — Dropbox Delta Check
 *
 * Checks for new or modified documents in an association's Dropbox folder
 * since the last sync. If found, categorizes and extracts data to update
 * association_field_values before gap analysis runs.
 */

import { createServiceClient } from "@/lib/supabase/server";
import {
  getValidAccessToken,
  listFolder,
  downloadFile,
  type DropboxEntry,
} from "@/lib/dropbox";
import { categorizeDocuments } from "./document-categorizer";
import {
  extractFromDocument,
  getDocumentText,
} from "./document-extractor";
import { upsertFieldValue } from "./association-data";

/** Result of a delta check */
export interface DeltaResult {
  new_documents: number;
  modified_documents: number;
  fields_updated: Array<{
    field_key: string;
    new_value: string;
    previous_value?: string;
    source_document: string;
  }>;
  no_changes: boolean;
}

const SUPPORTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".rtf"];

/**
 * Check for new or modified documents in the association's Dropbox folder
 * and extract data from any changes found.
 *
 * Fails gracefully — returns no_changes: true if Dropbox isn't connected
 * or any step fails.
 */
export async function checkForNewDocuments(
  associationId: string,
  tenantId: string
): Promise<DeltaResult> {
  const emptyResult: DeltaResult = {
    new_documents: 0,
    modified_documents: 0,
    fields_updated: [],
    no_changes: true,
  };

  try {
    const supabase = await createServiceClient();

    // Get association's Dropbox folder
    const { data: association } = await supabase
      .from("associations")
      .select("name, dropbox_folder_path")
      .eq("id", associationId)
      .single();

    if (!association?.dropbox_folder_path) {
      return emptyResult; // No folder mapped — skip gracefully
    }

    // Get tenant's Dropbox credentials
    const { data: tenant } = await supabase
      .from("tenants")
      .select("dropbox_access_token, dropbox_refresh_token")
      .eq("id", tenantId)
      .single();

    if (!tenant?.dropbox_access_token || !tenant?.dropbox_refresh_token) {
      return emptyResult; // Dropbox not connected — skip gracefully
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(
      supabase,
      tenantId,
      tenant.dropbox_access_token,
      tenant.dropbox_refresh_token
    );

    // List files in folder
    const entries = await listFolder(accessToken, association.dropbox_folder_path);
    const files = entries.filter(
      (e: DropboxEntry) =>
        e[".tag"] === "file" &&
        SUPPORTED_EXTENSIONS.some((ext) => e.name.toLowerCase().endsWith(ext))
    );

    if (files.length === 0) {
      return emptyResult;
    }

    // Get existing sync log entries for comparison
    const { data: syncLogs } = await supabase
      .from("document_sync_log")
      .select("dropbox_file_id, file_hash, file_name")
      .eq("association_id", associationId);

    const syncMap = new Map<string, { file_hash: string | null; file_name: string | null }>();
    for (const log of syncLogs || []) {
      if (log.dropbox_file_id) {
        syncMap.set(log.dropbox_file_id, {
          file_hash: log.file_hash,
          file_name: log.file_name,
        });
      }
    }

    // Identify new and modified files
    const newFiles: DropboxEntry[] = [];
    const modifiedFiles: DropboxEntry[] = [];

    for (const file of files) {
      const existing = syncMap.get(file.id);
      if (!existing) {
        newFiles.push(file);
      } else if (
        file.server_modified &&
        existing.file_hash !== file.server_modified
      ) {
        modifiedFiles.push(file);
      }
    }

    if (newFiles.length === 0 && modifiedFiles.length === 0) {
      return emptyResult;
    }

    // Process changed files
    const changedFiles = [...newFiles, ...modifiedFiles];
    const result: DeltaResult = {
      new_documents: newFiles.length,
      modified_documents: modifiedFiles.length,
      fields_updated: [],
      no_changes: false,
    };

    // Categorize the changed files
    const filenames = changedFiles.map((f) => f.name);
    const categorization = await categorizeDocuments(filenames);
    const categoryMap = new Map<string, string>();
    for (const cat of categorization) {
      categoryMap.set(cat.filename, cat.category);
    }

    // Get existing field values for change detection
    const { data: existingValues } = await supabase
      .from("association_field_values")
      .select("field_key, value")
      .eq("association_id", associationId);

    const existingMap: Record<string, string> = {};
    for (const v of existingValues || []) {
      if (v.value) existingMap[v.field_key] = v.value;
    }

    // Extract data from each changed file
    for (const file of changedFiles) {
      const category = categoryMap.get(file.name) ?? "other";
      if (category === "other" || category === "plat_map") continue;

      try {
        const { buffer, name } = await downloadFile(accessToken, file.path_lower);
        const { text } = await getDocumentText(buffer, name);

        if (!text) continue;

        const extraction = await extractFromDocument(
          text,
          category,
          association.name,
          existingMap
        );

        // Upsert extracted values
        for (const [fieldKey, value] of Object.entries(extraction.extracted)) {
          const previous = existingMap[fieldKey];
          await upsertFieldValue(
            associationId,
            fieldKey,
            value,
            "dropbox_extraction",
            name
          );

          result.fields_updated.push({
            field_key: fieldKey,
            new_value: value,
            previous_value: previous,
            source_document: name,
          });

          existingMap[fieldKey] = value;
        }

        // Log to document_sync_log
        await supabase.from("document_sync_log").upsert(
          {
            association_id: associationId,
            dropbox_file_id: file.id,
            dropbox_path: file.path_lower,
            file_name: file.name,
            category,
            file_hash: file.server_modified || null,
            last_synced_at: new Date().toISOString(),
            extraction_status: "completed",
            extracted_fields: extraction.extracted,
          },
          { onConflict: "association_id,dropbox_file_id" }
        );

        // Rate limit
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Delta extraction failed for ${file.name}:`, error);
        // Continue with other files
      }
    }

    return result;
  } catch (error) {
    console.error("Dropbox delta check failed:", error);
    return emptyResult; // Fail gracefully
  }
}
