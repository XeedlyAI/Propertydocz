import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

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
  return { userId: user.id };
}

/**
 * GET /api/platform/tenants/[id]
 * Get a single tenant with full details, associations, and revenue.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const serviceClient = await createServiceClient();

    // Tenant details
    const { data: tenant, error } = await serviceClient
      .from("tenants")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Associations
    const { data: associations } = await serviceClient
      .from("associations")
      .select("id, name, address, city, state, zip, total_units, project_type, dropbox_folder_path")
      .eq("tenant_id", id)
      .order("name");

    // Requests + revenue
    const { data: requests } = await serviceClient
      .from("document_requests")
      .select(
        "id, created_at, requester_name, property_address, document_types, status, total_price_cents, payment_status"
      )
      .eq("tenant_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    const allReqs = requests || [];
    const paidReqs = allReqs.filter((r) => r.payment_status === "paid");
    const totalRevenue = paidReqs.reduce(
      (sum, r) => sum + (r.total_price_cents || 0),
      0
    );
    const fee = tenant.platform_fee_percent || 10;
    const platformCut = Math.round((totalRevenue * fee) / 100);

    // Admin users for this tenant
    const { data: admins } = await serviceClient
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("tenant_id", id)
      .order("role");

    return NextResponse.json({
      tenant,
      associations: associations || [],
      requests: allReqs,
      admins: admins || [],
      revenue: {
        total: totalRevenue,
        platformCut,
        tenantCut: totalRevenue - platformCut,
        requestCount: paidReqs.length,
      },
    });
  } catch (error) {
    console.error("Platform tenant detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/platform/tenants/[id]
 * Update tenant details.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Only allow specific fields to be updated
    const allowedFields = [
      "name",
      "slug",
      "contact_email",
      "contact_phone",
      "platform_fee_percent",
      "logo_url",
      "primary_color",
    ];

    const update: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        update[key] = body[key];
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();

    // If updating slug, check uniqueness
    if (update.slug) {
      const { data: existing } = await serviceClient
        .from("tenants")
        .select("id")
        .eq("slug", (update.slug as string).toLowerCase())
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
      }
      update.slug = (update.slug as string).toLowerCase();
    }

    const { error: updateError } = await serviceClient
      .from("tenants")
      .update(update)
      .eq("id", id);

    if (updateError) {
      console.error("Tenant update error:", updateError);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Platform tenant update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
