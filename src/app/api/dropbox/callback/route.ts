import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens } from "@/lib/dropbox";

/**
 * GET /api/dropbox/callback
 * Handles the OAuth callback from Dropbox. Exchanges the authorization code
 * for tokens and saves them to the tenant record.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");
    const error = searchParams.get("error");

    // User denied access
    if (error) {
      return NextResponse.redirect(
        new URL("/admin/settings?dropbox=denied", request.url)
      );
    }

    if (!code || !stateParam) {
      return NextResponse.redirect(
        new URL("/admin/settings?dropbox=error", request.url)
      );
    }

    // Decode state to get tenant_id
    let tenantId: string;
    try {
      const stateData = JSON.parse(
        Buffer.from(stateParam, "base64url").toString()
      );
      tenantId = stateData.tenant_id;
    } catch {
      return NextResponse.redirect(
        new URL("/admin/settings?dropbox=error", request.url)
      );
    }

    if (!tenantId) {
      return NextResponse.redirect(
        new URL("/admin/settings?dropbox=error", request.url)
      );
    }

    // Exchange the code for tokens
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/dropbox/callback`;
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
      return NextResponse.redirect(
        new URL("/admin/settings?dropbox=error", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/admin/settings?dropbox=connected", request.url)
    );
  } catch (error) {
    console.error("Dropbox callback error:", error);
    return NextResponse.redirect(
      new URL("/admin/settings?dropbox=error", request.url)
    );
  }
}
