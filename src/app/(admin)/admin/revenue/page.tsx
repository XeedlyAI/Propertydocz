import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { formatCents, DOCUMENT_LABELS, DOCUMENT_PRICES, RUSH_FEE_CENTS } from "@/lib/pricing";
import type { DocumentType } from "@/lib/types";
import { RevenueClient } from "./revenue-client";

interface DocTypeRevenue {
  type: DocumentType;
  label: string;
  count: number;
  revenue: number;
  avgPrice: number;
  pctOfTotal: number;
}

interface MonthlyRevenue {
  month: string;
  orders: number;
  revenue: number;
}

interface TopClient {
  rank: number;
  name: string;
  company: string;
  orders: number;
  revenue: number;
  lastOrder: string;
}

export default async function RevenuePage() {
  const user = await getAdminUser();
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const { data: requests } = await supabase
    .from("document_requests")
    .select(
      "id, created_at, requester_name, requester_email, requester_type, document_types, total_price_cents, payment_status, turnaround"
    )
    .eq("tenant_id", user.tenantId)
    .order("created_at", { ascending: false });

  const allRequests = requests || [];
  const paidRequests = allRequests.filter((r) => r.payment_status === "paid");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  // Revenue MTD + last month
  const revenueMTD = paidRequests
    .filter((r) => r.created_at >= startOfMonth)
    .reduce((s, r) => s + (r.total_price_cents || 0), 0);

  const revenueLastMonth = paidRequests
    .filter((r) => r.created_at >= startOfLastMonth && r.created_at < startOfMonth)
    .reduce((s, r) => s + (r.total_price_cents || 0), 0);

  const momGrowth =
    revenueLastMonth > 0
      ? Math.round(((revenueMTD - revenueLastMonth) / revenueLastMonth) * 100)
      : revenueMTD > 0
        ? 100
        : 0;

  const ordersMTD = paidRequests.filter((r) => r.created_at >= startOfMonth).length;
  const avgOrderValue =
    paidRequests.length > 0
      ? Math.round(paidRequests.reduce((s, r) => s + (r.total_price_cents || 0), 0) / paidRequests.length)
      : 0;

  // Revenue by document type
  const docTypeMap = new Map<DocumentType, { count: number; revenue: number }>();
  const allDocTypes: DocumentType[] = [
    "resale_certificate",
    "payoff_statement",
    "lender_questionnaire",
    "governing_documents",
  ];

  for (const dt of allDocTypes) {
    docTypeMap.set(dt, { count: 0, revenue: 0 });
  }

  for (const req of paidRequests) {
    const docTypes = (req.document_types || []) as DocumentType[];
    const perDoc =
      docTypes.length > 0
        ? Math.round((req.total_price_cents || 0) / docTypes.length)
        : 0;

    for (const dt of docTypes) {
      const entry = docTypeMap.get(dt) || { count: 0, revenue: 0 };
      entry.count += 1;
      entry.revenue += perDoc;
      docTypeMap.set(dt, entry);
    }
  }

  const totalDocRevenue = Array.from(docTypeMap.values()).reduce(
    (s, e) => s + e.revenue,
    0
  );

  const docTypeRevenue: DocTypeRevenue[] = allDocTypes.map((dt) => {
    const entry = docTypeMap.get(dt)!;
    return {
      type: dt,
      label: DOCUMENT_LABELS[dt] || dt,
      count: entry.count,
      revenue: entry.revenue,
      avgPrice: entry.count > 0 ? Math.round(entry.revenue / entry.count) : 0,
      pctOfTotal: totalDocRevenue > 0 ? Math.round((entry.revenue / totalDocRevenue) * 100) : 0,
    };
  });

  const topDocType = docTypeRevenue.reduce(
    (best, dt) => (dt.revenue > best.revenue ? dt : best),
    docTypeRevenue[0]
  );

  const rushOrders = paidRequests.filter((r) => r.turnaround === "rush");
  const rushRevenue = rushOrders.length * RUSH_FEE_CENTS;

  // Monthly revenue (last 6 months)
  const monthlyRevenue: MonthlyRevenue[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = d.toISOString();
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();

    const monthOrders = paidRequests.filter(
      (r) => r.created_at >= monthStart && r.created_at < nextMonth
    );

    monthlyRevenue.push({
      month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      orders: monthOrders.length,
      revenue: monthOrders.reduce((s, r) => s + (r.total_price_cents || 0), 0),
    });
  }

  // Top clients by revenue
  const clientMap = new Map<string, { name: string; company: string; orders: number; revenue: number; lastOrder: string }>();
  for (const req of paidRequests) {
    const key = (req.requester_email || req.requester_name || "unknown").toLowerCase();
    const existing = clientMap.get(key);
    if (existing) {
      existing.orders += 1;
      existing.revenue += req.total_price_cents || 0;
      if (req.created_at > existing.lastOrder) existing.lastOrder = req.created_at;
    } else {
      clientMap.set(key, {
        name: req.requester_name || req.requester_email || "Unknown",
        company: req.requester_type || "—",
        orders: 1,
        revenue: req.total_price_cents || 0,
        lastOrder: req.created_at,
      });
    }
  }

  const topClients: TopClient[] = Array.from(clientMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((c, i) => ({ rank: i + 1, ...c }));

  // ── Settlement data ──

  // Fetch fulfillment ledger entries for this tenant
  const { data: ledgerEntries } = await serviceClient
    .from("fulfillment_ledger")
    .select("id, revenue_type, document_type, document_count, order_amount, tenant_share, platform_share, settlement_status, created_at, document_request_id")
    .eq("tenant_id", user.tenantId)
    .order("created_at", { ascending: false })
    .limit(100);

  const allLedger = ledgerEntries || [];

  // MTD settlement data (accruing)
  const mtdLedger = allLedger.filter((e) => e.created_at >= startOfMonth);
  const mtdPpoEntries = mtdLedger.filter((e) => e.revenue_type !== "subscription_fulfillment");
  const mtdSubEntries = mtdLedger.filter((e) => e.revenue_type === "subscription_fulfillment");
  const mtdPpoTenantShare = mtdPpoEntries.reduce((s, e) => s + Number(e.tenant_share || 0), 0);
  const mtdPpoGross = mtdPpoEntries.reduce((s, e) => s + Number(e.order_amount || 0), 0);
  const mtdSubFees = mtdSubEntries.reduce((s, e) => s + Number(e.tenant_share || 0), 0);
  const mtdTotalEarnings = mtdLedger.reduce((s, e) => s + Number(e.tenant_share || 0), 0);

  // Fetch monthly settlements for this tenant
  const { data: settlements } = await serviceClient
    .from("monthly_settlement")
    .select("*")
    .eq("tenant_id", user.tenantId)
    .order("period_start", { ascending: false })
    .limit(12);

  const allSettlements = (settlements || []).map((s) => ({
    id: s.id,
    periodStart: s.period_start,
    periodEnd: s.period_end,
    totalDocsFulfilled: s.total_documents_fulfilled,
    ppoOrders: s.ppo_orders,
    ppoGrossRevenue: Number(s.ppo_gross_revenue),
    ppoTenantShare: Number(s.ppo_tenant_share),
    subFulfillments: s.sub_fulfillments,
    subFulfillmentFees: Number(s.sub_fulfillment_fees),
    totalTenantEarnings: Number(s.total_tenant_earnings),
    status: s.status as string,
    paidAt: s.paid_at,
  }));

  // Format ledger for client
  const ledgerForClient = allLedger.slice(0, 50).map((e) => ({
    id: e.id,
    date: e.created_at,
    requestId: e.document_request_id,
    docType: e.document_type,
    docCount: e.document_count,
    revenueType: e.revenue_type as string,
    orderAmount: Number(e.order_amount),
    tenantShare: Number(e.tenant_share),
    status: e.settlement_status as string,
  }));

  // Calculate next settlement date
  const nextSettlement = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextSettlementStr = nextSettlement.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <RevenueClient
      kpis={{
        revenueMTD,
        revenueLastMonth,
        momGrowth,
        avgOrderValue,
        ordersMTD,
        topDocTypeLabel: topDocType?.label || "—",
        topDocTypeRevenue: topDocType?.revenue || 0,
      }}
      docTypeRevenue={docTypeRevenue}
      rushStats={{ count: rushOrders.length, revenue: rushRevenue }}
      monthlyRevenue={monthlyRevenue}
      topClients={topClients}
      settlementData={{
        accruing: {
          ppoOrders: mtdPpoEntries.length,
          ppoGross: mtdPpoGross,
          ppoTenantShare: mtdPpoTenantShare,
          subFulfillments: mtdSubEntries.length,
          subFees: mtdSubFees,
          totalEarnings: mtdTotalEarnings,
          nextSettlement: nextSettlementStr,
        },
        history: allSettlements,
        ledger: ledgerForClient,
      }}
    />
  );
}
