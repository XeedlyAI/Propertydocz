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

    if (tenant.stripe_account_id) {
      return NextResponse.json(
        { error: "Stripe already connected" },
        { status: 400 }
      );
    }

    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    const returnUrl = `${baseUrl}/api/stripe/connect/callback?tenant_id=${tenantId}`;
    const refreshUrl = `${baseUrl}/api/stripe/connect?tenant_id=${tenantId}`;

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
  } catch (error) {
    console.error("Stripe connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Stripe Connect" },
      { status: 500 }
    );
  }
}
