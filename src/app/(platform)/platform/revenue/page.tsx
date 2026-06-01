import { createServiceClient } from "@/lib/supabase/server";
import { getPlatformUser } from "@/lib/auth";
import { PlatformRevenueClient } from "./revenue-client";

export default async function PlatformRevenuePage() {
  await getPlatformUser();
  const serviceClient = await createServiceClient();

  // Tenants with fee info
  const { data: tenants } = await serviceClient
    .from("tenants")
    .select("id, name, slug, platform_fee_percent, stripe_account_id")
    .order("name");

  const allTenants = tenants || [];
  const tenantFeeMap = new Map(
    allTenants.map((t) => [t.id, t.platform_fee_percent || 10])
  );
  const tenantNameMap = new Map(allTenants.map((t) => [t.id, t.name]));

  // All paid requests
  const { data: requests } = await serviceClient
    .from("document_requests")
    .select("tenant_id, total_price_cents, payment_status, created_at")
    .eq("payment_status", "paid");

  const paidReqs = requests || [];

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  // Revenue calculations
  const totalRevenue = paidReqs.reduce(
    (sum, r) => sum + (r.total_price_cents || 0),
    0
  );
  const revenueThisMonth = paidReqs
    .filter((r) => r.created_at >= startOfMonth)
    .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);
  const revenueLastMonth = paidReqs
    .filter((r) => r.created_at >= startOfLastMonth && r.created_at < startOfMonth)
    .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

  const platformCutTotal = paidReqs.reduce((sum, r) => {
    const fee = tenantFeeMap.get(r.tenant_id) || 10;
    return sum + Math.round(((r.total_price_cents || 0) * fee) / 100);
  }, 0);

  const platformCutThisMonth = paidReqs
    .filter((r) => r.created_at >= startOfMonth)
    .reduce((sum, r) => {
      const fee = tenantFeeMap.get(r.tenant_id) || 10;
      return sum + Math.round(((r.total_price_cents || 0) * fee) / 100);
    }, 0);

  // Per-tenant breakdown
  const tenantBreakdown = allTenants.map((t) => {
    const tenantReqs = paidReqs.filter((r) => r.tenant_id === t.id);
    const revenue = tenantReqs.reduce(
      (sum, r) => sum + (r.total_price_cents || 0),
      0
    );
    const thisMonth = tenantReqs
      .filter((r) => r.created_at >= startOfMonth)
      .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);
    const fee = t.platform_fee_percent || 10;
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      fee,
      hasStripe: !!t.stripe_account_id,
      totalRevenue: revenue,
      thisMonth,
      platformCut: Math.round((revenue * fee) / 100),
      platformCutThisMonth: Math.round((thisMonth * fee) / 100),
      requestCount: tenantReqs.length,
    };
  });

  tenantBreakdown.sort((a, b) => b.totalRevenue - a.totalRevenue);

  // ── Settlement data ──

  // Fetch all settlements
  const { data: settlements } = await serviceClient
    .from("monthly_settlement")
    .select("*")
    .order("period_start", { ascending: false })
    .limit(50);

  const allSettlements = (settlements || []).map((s) => ({
    id: s.id,
    tenantId: s.tenant_id,
    tenantName: tenantNameMap.get(s.tenant_id) || "Unknown",
    periodStart: s.period_start,
    periodEnd: s.period_end,
    totalDocsFulfilled: s.total_documents_fulfilled,
    ppoOrders: s.ppo_orders,
    ppoGrossRevenue: Number(s.ppo_gross_revenue),
    ppoTenantShare: Number(s.ppo_tenant_share),
    ppoPlatformShare: Number(s.ppo_platform_share),
    subFulfillments: s.sub_fulfillments,
    subFulfillmentFees: Number(s.sub_fulfillment_fees),
    totalTenantEarnings: Number(s.total_tenant_earnings),
    totalPlatformEarnings: Number(s.total_platform_earnings),
    status: s.status as string,
    paidAt: s.paid_at,
  }));

  // Fetch accrued ledger entries for current month (all tenants)
  const { data: accruedEntries } = await serviceClient
    .from("fulfillment_ledger")
    .select("tenant_id, revenue_type, order_amount, tenant_share, platform_share, document_count")
    .eq("settlement_status", "accrued")
    .gte("created_at", startOfMonth);

  const accrued = accruedEntries || [];

  // Accrued totals
  const accruedPpo = accrued.filter((e) => e.revenue_type !== "subscription_fulfillment");
  const accruedSub = accrued.filter((e) => e.revenue_type === "subscription_fulfillment");

  const accruedPpoTenantShare = accruedPpo.reduce((s, e) => s + Number(e.tenant_share || 0), 0);
  const accruedPpoPlatformShare = accruedPpo.reduce((s, e) => s + Number(e.platform_share || 0), 0);
  const accruedSubFees = accruedSub.reduce((s, e) => s + Number(e.tenant_share || 0), 0);
  const accruedTotalTenantPayouts = accrued.reduce((s, e) => s + Number(e.tenant_share || 0), 0);
  const accruedTotalPlatformRevenue = accrued.reduce((s, e) => s + Number(e.platform_share || 0), 0);

  // Subscription MRR (from customer_subscription table)
  const { data: activeSubs } = await serviceClient
    .from("customer_subscription")
    .select("monthly_price")
    .eq("status", "active");

  const subscriptionMrr = (activeSubs || []).reduce(
    (sum, s) => sum + Number(s.monthly_price || 0),
    0
  );

  // Settlement status counts
  const pendingSettlements = allSettlements.filter((s) => s.status === "pending").length;
  const failedSettlements = allSettlements.filter((s) => s.status === "failed").length;

  // P&L breakdown (current month)
  const pnl = {
    subscriptionMrr: subscriptionMrr / 100,
    ppoPlatformShare: accruedPpoPlatformShare,
    subFulfillmentCost: accruedSubFees,
    netPlatformRevenue: (subscriptionMrr / 100) + accruedPpoPlatformShare - accruedSubFees,
  };

  return (
    <PlatformRevenueClient
      kpis={{
        totalRevenue,
        revenueThisMonth,
        revenueLastMonth,
        platformCutTotal,
        platformCutThisMonth,
        totalOrders: paidReqs.length,
      }}
      tenantBreakdown={tenantBreakdown}
      settlements={allSettlements}
      accruingTotals={{
        tenantPayouts: accruedTotalTenantPayouts,
        platformRevenue: accruedTotalPlatformRevenue,
        subFulfillmentCost: accruedSubFees,
        pendingSettlements,
        failedSettlements,
      }}
      pnl={pnl}
    />
  );
}
