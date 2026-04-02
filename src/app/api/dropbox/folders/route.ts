import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { listFolder, getValidAccessToken } from "@/lib/dropbox";

/**
 * GET /api/dropbox/folders?path=/some/folder
 * Lists folder contents in the tenant's connected Dropbox account.
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

    // Get tenant's Dropbox tokens
    const serviceClient = await createServiceClient();
    const { data: tenant } = await serviceClient
      .from("tenants")
      .select("dropbox_access_token, dropbox_refresh_token")
      .eq("id", profile.tenant_id)
      .single();

    if (!tenant?.dropbox_access_token || !tenant?.dropbox_refresh_token) {
      return NextResponse.json(
        { error: "Dropbox not connected" },
        { status: 400 }
      );
    }

    // Get a valid access token (refreshes if expired)
    const accessToken = await getValidAccessToken(
      serviceClient,
      profile.tenant_id,
      tenant.dropbox_access_token,
      tenant.dropbox_refresh_token
    );

    // List folder contents
    const path = request.nextUrl.searchParams.get("path") || "/";
    const entries = await listFolder(accessToken, path);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Dropbox folders error:", error);
    return NextResponse.json(
      { error: "Failed to list Dropbox folders" },
      { status: 500 }
    );
  }
}
