import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/stripe/connect/callback
 * Return URL after Stripe Connect onboarding completes.
 * The account ID was already saved when the link was created.
 * Redirect to the appropriate settings page.
 */
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenant_id");

  // Redirect back to settings
  if (tenantId) {
    return NextResponse.redirect(
      new URL("/admin/settings?stripe=connected", request.url)
    );
  }

  return NextResponse.redirect(new URL("/admin/settings", request.url));
}
