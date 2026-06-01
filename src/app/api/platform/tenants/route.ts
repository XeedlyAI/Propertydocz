import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Verify the current user is a platform_admin.
 */
async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "platform_admin") return null;
  return { userId: user.id, email: user.email };
}

/**
 * GET /api/platform/tenants
 * List all tenants with request counts and revenue.
 */
export async function GET() {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();

    const { data: tenants } = await serviceClient
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    // Get request counts and revenue per tenant
    const { data: requests } = await serviceClient
      .from("document_requests")
      .select("tenant_id, total_price_cents, payment_status");

    const tenantStats = new Map<
      string,
      { requestCount: number; revenue: number }
    >();

    for (const req of requests || []) {
      const existing = tenantStats.get(req.tenant_id) || {
        requestCount: 0,
        revenue: 0,
      };
      existing.requestCount++;
      if (req.payment_status === "paid") {
        existing.revenue += req.total_price_cents || 0;
      }
      tenantStats.set(req.tenant_id, existing);
    }

    const enriched = (tenants || []).map((t) => {
      const stats = tenantStats.get(t.id) || { requestCount: 0, revenue: 0 };
      return {
        ...t,
        request_count: stats.requestCount,
        total_revenue: stats.revenue,
      };
    });

    return NextResponse.json({ tenants: enriched });
  } catch (error) {
    console.error("Platform tenants list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/platform/tenants
 * Create a new tenant. Optionally create an admin user.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      contact_email,
      contact_phone,
      platform_fee_percent,
      admin_email,
      admin_password,
      admin_name,
    } = body;

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceClient();

    // Check slug uniqueness
    const { data: existing } = await serviceClient
      .from("tenants")
      .select("id")
      .eq("slug", slug.trim().toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Slug already taken" },
        { status: 409 }
      );
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await serviceClient
      .from("tenants")
      .insert({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        contact_email: contact_email?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        platform_fee_percent: platform_fee_percent ?? 10,
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error("Tenant creation error:", tenantError);
      return NextResponse.json(
        { error: "Failed to create tenant" },
        { status: 500 }
      );
    }

    // Optionally create admin user for this tenant
    let adminUser = null;
    if (admin_email?.trim() && admin_password) {
      const { data: authUser, error: authError } =
        await serviceClient.auth.admin.createUser({
          email: admin_email.trim(),
          password: admin_password,
          email_confirm: true,
        });

      if (authError || !authUser.user) {
        console.error("Admin user creation error:", authError);
        // Tenant was created, just couldn't create user
        return NextResponse.json({
          tenant,
          warning: `Tenant created but admin user failed: ${authError?.message}`,
        });
      }

      // Create profile
      const { error: profileError } = await serviceClient
        .from("profiles")
        .insert({
          id: authUser.user.id,
          tenant_id: tenant.id,
          full_name: admin_name?.trim() || admin_email.trim(),
          email: admin_email.trim(),
          role: "tenant_admin",
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      adminUser = {
        id: authUser.user.id,
        email: admin_email.trim(),
      };
    }

    return NextResponse.json({ tenant, adminUser }, { status: 201 });
  } catch (error) {
    console.error("Platform tenant creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
