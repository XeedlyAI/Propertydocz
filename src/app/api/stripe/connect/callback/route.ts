import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/stripe/connect/callback
 * Return URL after Stripe Connect onboarding completes.
 * The account ID was already saved when the link was created.
 *
 * Supports two contexts:
 * 1. Normal tenant settings flow → redirect to /admin/settings
 * 2. Platform wizard flow (wizard=true param) → redirect to /platform/onboard
 */
export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenant_id");
  const isWizard = request.nextUrl.searchParams.get("wizard") === "true";
  const returnStep = request.nextUrl.searchParams.get("return_step") || "1";

  if (isWizard && tenantId) {
    return NextResponse.redirect(
      new URL(
        `/platform/onboard?tenant_id=${tenantId}&step=${returnStep}&stripe_complete=true`,
        request.url
      )
    );
  }

  // Default: redirect to tenant admin settings
  if (tenantId) {
    return NextResponse.redirect(
      new URL("/admin/settings?stripe=connected", request.url)
    );
  }

  return NextResponse.redirect(new URL("/admin/settings", request.url));
}
