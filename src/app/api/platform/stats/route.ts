import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/platform/stats
 * Platform-wide statistics. Requires platform_admin role.
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "platform_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();

    // Fetch all tenants
    const { data: tenants, count: tenantCount } = await serviceClient
      .from("tenants")
      .select("id, name, platform_fee_percent", { count: "exact" });

    // Fetch all requests
    const { data: requests } = await serviceClient
      .from("document_requests")
      .select("id, tenant_id, total_price_cents, payment_status, status, created_at");

    const allRequests = requests || [];
    const allTenants = tenants || [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Active tenants this month (tenants with requests this month)
    const activeTenantIds = new Set(
      allRequests
        .filter((r) => r.created_at >= startOfMonth)
        .map((r) => r.tenant_id)
    );

    // Revenue calculations
    const paidRequests = allRequests.filter((r) => r.payment_status === "paid");
    const totalRevenue = paidRequests.reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

    const paidThisMonth = paidRequests.filter((r) => r.created_at >= startOfMonth);
    const revenueThisMonth = paidThisMonth.reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

    // Build fee lookup
    const feeLookup = new Map(allTenants.map((t) => [t.id, t.platform_fee_percent || 15]));

    // Platform cut calculation
    const platformCutTotal = paidRequests.reduce((sum, r) => {
      const fee = feeLookup.get(r.tenant_id) || 15;
      return sum + Math.round((r.total_price_cents || 0) * fee / 100);
    }, 0);

    const platformCutThisMonth = paidThisMonth.reduce((sum, r) => {
      const fee = feeLookup.get(r.tenant_id) || 15;
      return sum + Math.round((r.total_price_cents || 0) * fee / 100);
    }, 0);

    // Per-tenant revenue breakdown
    const tenantRevenue = allTenants.map((t) => {
      const tenantRequests = paidRequests.filter((r) => r.tenant_id === t.id);
      const revenue = tenantRequests.reduce((sum, r) => sum + (r.total_price_cents || 0), 0);
      const fee = t.platform_fee_percent || 15;
      const platformCut = Math.round(revenue * fee / 100);
      return {
        id: t.id,
        name: t.name,
        requestCount: tenantRequests.length,
        totalRevenue: revenue,
        platformCut,
        tenantCut: revenue - platformCut,
        feePercent: fee,
      };
    });

    return NextResponse.json({
      totalTenants: tenantCount || 0,
      activeTenants: activeTenantIds.size,
      totalRequests: allRequests.length,
      requestsThisMonth: allRequests.filter((r) => r.created_at >= startOfMonth).length,
      totalRevenue,
      revenueThisMonth,
      platformCutTotal,
      platformCutThisMonth,
      tenantCutTotal: totalRevenue - platformCutTotal,
      tenantCutThisMonth: revenueThisMonth - platformCutThisMonth,
      tenantRevenue,
    });
  } catch (error) {
    console.error("Platform stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
