import { createClient } from "@/lib/supabase/server";
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
    // Distribute revenue proportionally across doc types in the order
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

  // Top doc type for KPI
  const topDocType = docTypeRevenue.reduce(
    (best, dt) => (dt.revenue > best.revenue ? dt : best),
    docTypeRevenue[0]
  );

  // Rush order stats
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
    />
  );
}
