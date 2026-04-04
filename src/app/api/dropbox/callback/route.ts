import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/dropbox";

/**
 * GET /api/dropbox/callback
 * Handles the OAuth callback from Dropbox. Exchanges the authorization code
 * for tokens and saves them to the tenant record.
 *
 * Supports two contexts:
 * 1. Normal tenant settings flow → redirect to /admin/settings
 * 2. Platform wizard flow (state.wizard=true) → redirect to /platform/onboard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");

    // Decode state first to determine redirect target
    let tenantId: string | null = null;
    let isWizard = false;
    let returnStep = "2";

    if (stateParam) {
      try {
        const stateData = JSON.parse(
          Buffer.from(stateParam, "base64url").toString()
        );
        tenantId = stateData.tenant_id || null;
        isWizard = !!stateData.wizard;
        returnStep = stateData.return_step || "2";
      } catch {
        // Invalid state — fall through to error
      }
    }

    // Build redirect URLs based on context
    function getRedirectUrl(status: "connected" | "denied" | "error") {
      if (isWizard && tenantId) {
        return new URL(
          `/platform/onboard?tenant_id=${tenantId}&step=${returnStep}&dropbox=${status}`,
          request.url
        );
      }
      return new URL(`/admin/settings?dropbox=${status}`, request.url);
    }

    // User denied access
    if (error) {
      return NextResponse.redirect(getRedirectUrl("denied"));
    }

    if (!code || !stateParam || !tenantId) {
      return NextResponse.redirect(getRedirectUrl("error"));
    }

    // Exchange the code for tokens — redirect_uri must match what /auth sent
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    const redirectUri = `${proto}://${host}/api/dropbox/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // Save tokens to the tenant record using service client (bypasses RLS)
    const serviceClient = await createServiceClient();
    const { error: updateError } = await serviceClient
      .from("tenants")
      .update({
        dropbox_access_token: tokens.access_token,
        dropbox_refresh_token: tokens.refresh_token,
      })
      .eq("id", tenantId);

    if (updateError) {
      console.error("Failed to save Dropbox tokens:", updateError);
      return NextResponse.redirect(getRedirectUrl("error"));
    }

    return NextResponse.redirect(getRedirectUrl("connected"));
  } catch (error) {
    console.error("Dropbox callback error:", error);
    return NextResponse.redirect(
      new URL("/admin/settings?dropbox=error", request.url)
    );
  }
}
