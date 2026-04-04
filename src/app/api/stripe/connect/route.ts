import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createConnectOnboardingLink } from "@/lib/stripe";

/**
 * POST /api/stripe/connect
 * Initiates Stripe Connect Express onboarding for a tenant.
 * Can be called by platform_admin (with tenant_id in body) or tenant_admin.
 */
export async function POST(request: NextRequest) {
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
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Platform admin can specify tenant_id; tenant admin uses own
    const tenantId =
      profile.role === "platform_admin" && body.tenant_id
        ? body.tenant_id
        : profile.tenant_id;

    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();
    const { data: tenant } = await serviceClient
      .from("tenants")
      .select("id, name, stripe_account_id")
      .eq("id", tenantId)
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // If account already exists, check if onboarding is complete.
    // If complete, block re-onboarding. If incomplete, generate a new link.
    if (tenant.stripe_account_id) {
      try {
        const stripe = (await import("@/lib/stripe")).getStripe();
        const account = await stripe.accounts.retrieve(tenant.stripe_account_id);

        if (account.details_submitted) {
          return NextResponse.json(
            { error: "Stripe account already connected and verified" },
            { status: 400 }
          );
        }

        // Incomplete onboarding — generate a new account link
        const proto = request.headers.get("x-forwarded-proto") || "https";
        const host = request.headers.get("host") || "localhost:3000";
        const baseUrl = `${proto}://${host}`;

        const link = await stripe.accountLinks.create({
          account: tenant.stripe_account_id,
          return_url: `${baseUrl}/api/stripe/connect/callback?tenant_id=${tenantId}`,
          refresh_url: `${baseUrl}/admin/settings?stripe_refresh=true`,
          type: "account_onboarding",
        });

        return NextResponse.json({ url: link.url });
      } catch (err) {
        console.error("Error checking existing Stripe account:", err);
        // Account may have been deleted on Stripe side — clear it and proceed
        await serviceClient
          .from("tenants")
          .update({ stripe_account_id: null })
          .eq("id", tenantId);
      }
    }

    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    const returnUrl = `${baseUrl}/api/stripe/connect/callback?tenant_id=${tenantId}`;
    // refreshUrl must be a user-facing page (not an API endpoint) so the user
    // can restart onboarding if Stripe redirects them back early.
    const refreshUrl = `${baseUrl}/admin/settings?stripe_refresh=true`;

    const { accountId, url } = await createConnectOnboardingLink(
      tenantId,
      tenant.name,
      returnUrl,
      refreshUrl
    );

    // Save account ID immediately
    await serviceClient
      .from("tenants")
      .update({ stripe_account_id: accountId })
      .eq("id", tenantId);

    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error("Stripe connect error:", error);

    // Surface the actual Stripe error message for debugging
    let message = "Failed to initiate Stripe Connect";
    if (error instanceof Error) {
      message = error.message;
    }
    // Stripe SDK errors have a `type` and `raw` property
    if (
      typeof error === "object" &&
      error !== null &&
      "type" in error &&
      typeof (error as Record<string, unknown>).type === "string"
    ) {
      const stripeErr = error as { type: string; message?: string };
      message = stripeErr.message || `Stripe error: ${stripeErr.type}`;
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
