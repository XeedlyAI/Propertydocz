import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDropboxAuthUrl } from "@/lib/dropbox";

/**
 * GET /api/platform/onboard/storage/auth?tenant_id=xxx&return_step=2
 * Initiates Dropbox OAuth on behalf of a tenant during platform onboarding.
 * Platform admin only.
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

    // Verify platform admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "platform_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = request.nextUrl.searchParams.get("tenant_id");
    const returnStep = request.nextUrl.searchParams.get("return_step") || "2";

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenant_id is required" },
        { status: 400 }
      );
    }

    // Build redirect URI — use the same callback as normal Dropbox OAuth
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    const redirectUri = `${proto}://${host}/api/dropbox/callback`;

    // Encode tenant_id + wizard context in the OAuth state
    const state = Buffer.from(
      JSON.stringify({
        tenant_id: tenantId,
        wizard: true,
        return_step: returnStep,
      })
    ).toString("base64url");

    const authUrl = getDropboxAuthUrl(redirectUri, state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Onboard storage auth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate storage authorization" },
      { status: 500 }
    );
  }
}
