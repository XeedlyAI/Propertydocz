import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDropboxAuthUrl } from "@/lib/dropbox";

/**
 * GET /api/dropbox/auth
 * Initiates the Dropbox OAuth flow by redirecting the user to Dropbox authorization.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant_id for state verification
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build redirect URI (same origin + callback path)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/dropbox/callback`;

    // State encodes the tenant_id so the callback can verify ownership
    const state = Buffer.from(
      JSON.stringify({ tenant_id: profile.tenant_id })
    ).toString("base64url");

    const authUrl = getDropboxAuthUrl(redirectUri, state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Dropbox auth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Dropbox authorization" },
      { status: 500 }
    );
  }
}
