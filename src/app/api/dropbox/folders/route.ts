import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getTenantStorageCredentials,
  getStorageAdapter,
  persistRefreshedToken,
  DropboxAdapter,
} from "@/lib/services/storage-providers";

/**
 * GET /api/dropbox/folders?path=/some/folder
 * Lists folder contents in the tenant's connected storage account.
 * Used by the folder browser component.
 */
export async function GET(request: NextRequest) {
  try {
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

    // Get tenant's storage credentials via the abstraction
    const serviceClient = await createServiceClient();
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

    // List folder contents
    const path = request.nextUrl.searchParams.get("path") || "/";
    const files = await adapter.listFiles(path);

    // Return in a format compatible with the existing folder browser component
    const entries = files.map((f) => ({
      ".tag": f.is_folder ? "folder" : "file",
      name: f.name,
      path_lower: f.path,
      path_display: f.path,
      id: f.id,
      size: f.size,
      server_modified: f.modified_at,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Storage folders error:", error);
    return NextResponse.json(
      { error: "Failed to list folders" },
      { status: 500 }
    );
  }
}
