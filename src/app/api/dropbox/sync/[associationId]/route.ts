import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { detectDocCategory } from "@/lib/dropbox";
import {
  getTenantStorageCredentials,
  getStorageAdapter,
  persistRefreshedToken,
  DropboxAdapter,
} from "@/lib/services/storage-providers";

const SUPPORTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".rtf"];

/**
 * POST /api/dropbox/sync/[associationId]
 * Syncs governing documents from Dropbox to Supabase Storage.
 * Downloads files from the association's mapped Dropbox folder,
 * uploads to Supabase Storage, and creates/updates governing_documents records.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  try {
    const { associationId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch association with its Dropbox folder path
    const serviceClient = await createServiceClient();
    const { data: association } = await serviceClient
      .from("associations")
      .select("id, name, dropbox_folder_path, tenant_id")
      .eq("id", associationId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!association) {
      return NextResponse.json(
        { error: "Association not found" },
        { status: 404 }
      );
    }

    if (!association.dropbox_folder_path) {
      return NextResponse.json(
        { error: "No Dropbox folder mapped for this association" },
        { status: 400 }
      );
    }

    // Get tenant's storage credentials via abstraction
    const storageCreds = await getTenantStorageCredentials(
      serviceClient,
      profile.tenant_id
    );

    if (!storageCreds) {
      return NextResponse.json(
        { error: "No storage provider connected" },
        { status: 400 }
      );
    }

    const adapter = getStorageAdapter(
      storageCreds.provider,
      storageCreds.accessToken,
      storageCreds.refreshToken
    );

    // Validate and persist refreshed token for Dropbox
    if (adapter instanceof DropboxAdapter) {
      await adapter.getValidToken();
      if (adapter.currentAccessToken !== storageCreds.accessToken) {
        await persistRefreshedToken(
          serviceClient,
          profile.tenant_id,
          adapter.currentAccessToken,
          storageCreds.connectionId
        );
      }
    }

    // List all files in the mapped folder
    const allFiles = await adapter.listFiles(association.dropbox_folder_path);
    const files = allFiles.filter(
      (f) =>
        !f.is_folder &&
        SUPPORTED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: "No supported documents found in the mapped folder",
      });
    }

    // Get existing governing_documents for this association to check for updates
    const { data: existingDocs } = await serviceClient
      .from("governing_documents")
      .select("id, dropbox_path, file_name")
      .eq("association_id", associationId);

    const existingByPath = new Map(
      (existingDocs || []).map((d) => [d.dropbox_path, d])
    );

    let synced = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Download file from storage
        const { buffer, name } = await adapter.downloadFile(file.path);

        // Upload to Supabase Storage
        const storagePath = `governing-docs/${profile.tenant_id}/${associationId}/${name}`;
        const { error: uploadError } = await serviceClient.storage
          .from("documents")
          .upload(storagePath, buffer, {
            contentType: getContentType(name),
            upsert: true,
          });

        if (uploadError) {
          errors.push(`Upload failed for ${name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = serviceClient.storage.from("documents").getPublicUrl(storagePath);

        // Detect document category from filename
        const category = detectDocCategory(name);

        // Check if this file already exists
        const existing = existingByPath.get(file.path);

        if (existing) {
          // Update existing record
          await serviceClient
            .from("governing_documents")
            .update({
              file_url: publicUrl,
              file_name: name,
              document_category: category,
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // Create new record
          await serviceClient.from("governing_documents").insert({
            association_id: associationId,
            tenant_id: profile.tenant_id,
            document_name: name.replace(/\.[^/.]+$/, ""), // Strip extension
            document_category: category,
            file_url: publicUrl,
            file_name: name,
            source: storageCreds.provider,
            dropbox_path: file.path,
            last_synced_at: new Date().toISOString(),
          });
        }

        synced++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`Failed to sync ${file.name}: ${msg}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      total: files.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Dropbox sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync documents" },
      { status: 500 }
    );
  }
}

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "rtf":
      return "application/rtf";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}
