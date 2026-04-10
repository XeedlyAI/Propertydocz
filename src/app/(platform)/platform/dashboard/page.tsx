import { createServiceClient } from "@/lib/supabase/server";
import { getPlatformUser } from "@/lib/auth";
import { formatCents } from "@/lib/pricing";
import type { DocumentType, RequestStatus, Turnaround } from "@/lib/types";
import type { KpiCell } from "@/components/shared/PageKpiTicker";
import { PlatformDashboardClient } from "./dashboard-client";

const STATUS_DOT_COLOR: Record<RequestStatus, string> = {
  received: "bg-slate-400",
  paid: "bg-blue-400",
  awaiting_data: "bg-[#f59e0b]",
  ready_for_generation: "bg-[#38b6ff]",
  pending_review: "bg-[#f59e0b]",
  approved: "bg-[#14b8a6]",
  delivered: "bg-[#14b8a6]",
  cancelled: "bg-[#ef4444]",
};

const STATUS_BADGE: Record<RequestStatus, string> = {
  received:
    "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300",
  paid: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  awaiting_data:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ready_for_generation:
    "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  pending_review:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:
    "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  delivered:
    "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  received: "Received",
  paid: "Paid",
  awaiting_data: "Awaiting Data",
  ready_for_generation: "Ready for Gen",
  pending_review: "Pending Review",
  approved: "Approved",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function PlatformDashboardPage() {
  await getPlatformUser();
  const serviceClient = await createServiceClient();

  // All tenants
  const { data: tenants, count: tenantCount } = await serviceClient
    .from("tenants")
    .select("id, name, slug, platform_fee_percent", { count: "exact" });

  const allTenants = tenants || [];
  const tenantNameMap: Record<string, string> = {};
  const tenantFeeMap = new Map<string, number>();
  for (const t of allTenants) {
    tenantNameMap[t.id] = t.name;
    tenantFeeMap.set(t.id, t.platform_fee_percent || 15);
  }

  // All requests (cross-tenant) — include association_id and turnaround
  const { data: requests } = await serviceClient
    .from("document_requests")
    .select(
      "id, created_at, updated_at, tenant_id, association_id, turnaround, requester_name, requester_email, property_address, document_types, status, total_price_cents, payment_status"
    )
    .order("created_at", { ascending: false });

  // Fetch association names for all tenants
  const { data: associationsData } = await serviceClient
    .from("associations")
    .select("id, name, tenant_id");

  const associationMap: Record<string, string> = {};
  for (const a of associationsData || []) {
    associationMap[a.id] = a.name;
  }

  const allRequests = requests || [];

  // Compute triage counts across all tenants
  const activeStatuses = new Set<RequestStatus>(["delivered", "cancelled"]);
  const triageCounts = {
    awaiting_data: allRequests.filter((r) => r.status === "awaiting_data").length,
    pending_review: allRequests.filter((r) => r.status === "pending_review").length,
    ready_for_generation: allRequests.filter((r) => r.status === "ready_for_generation").length,
    rush: allRequests.filter(
      (r) => (r.turnaround as Turnaround) === "rush" && !activeStatuses.has(r.status as RequestStatus)
    ).length,
  };
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();
  const startOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  ).toISOString();

  // Core stats
  const totalRequests = allRequests.length;
  const requestsThisMonth = allRequests.filter(
    (r) => r.created_at >= startOfMonth
  ).length;
  const requestsLastMonth = allRequests.filter(
    (r) => r.created_at >= startOfLastMonth && r.created_at < startOfMonth
  ).length;

  const paidRequests = allRequests.filter((r) => r.payment_status === "paid");
  const totalRevenue = paidRequests.reduce(
    (sum, r) => sum + (r.total_price_cents || 0),
    0
  );
  const revenueThisMonth = paidRequests
    .filter((r) => r.created_at >= startOfMonth)
    .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);
  const revenueLastMonth = paidRequests
    .filter(
      (r) => r.created_at >= startOfLastMonth && r.created_at < startOfMonth
    )
    .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

  const platformCutThisMonth = paidRequests
    .filter((r) => r.created_at >= startOfMonth)
    .reduce((sum, r) => {
      const fee = tenantFeeMap.get(r.tenant_id) || 15;
      return sum + Math.round(((r.total_price_cents || 0) * fee) / 100);
    }, 0);

  const platformCutTotal = paidRequests.reduce((sum, r) => {
    const fee = tenantFeeMap.get(r.tenant_id) || 15;
    return sum + Math.round(((r.total_price_cents || 0) * fee) / 100);
  }, 0);

  // Avg fee %
  const avgFeePercent =
    allTenants.length > 0
      ? allTenants.reduce(
          (sum, t) => sum + (t.platform_fee_percent || 15),
          0
        ) / allTenants.length
      : 15;

  // Revenue by tenant
  const tenantRevenueMap = new Map<
    string,
    { revenue: number; count: number }
  >();
  for (const req of paidRequests) {
    const existing = tenantRevenueMap.get(req.tenant_id) || {
      revenue: 0,
      count: 0,
    };
    existing.revenue += req.total_price_cents || 0;
    existing.count++;
    tenantRevenueMap.set(req.tenant_id, existing);
  }

  const tenantRevenues = allTenants.map((t) => {
    const stats = tenantRevenueMap.get(t.id) || { revenue: 0, count: 0 };
    const fee = t.platform_fee_percent || 15;
    const platformCut = Math.round((stats.revenue * fee) / 100);
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      fee,
      revenue: stats.revenue,
      count: stats.count,
      platformCut,
      tenantCut: stats.revenue - platformCut,
    };
  });

  // Tenant health computation
  const tenantHealthItems = allTenants.map((t) => {
    const tenantReqs = allRequests.filter((r) => r.tenant_id === t.id);
    const thisMonthReqs = tenantReqs.filter(
      (r) => r.created_at >= startOfMonth
    );
    const deliveredThisMonth = thisMonthReqs.filter(
      (r) => r.status === "delivered"
    ).length;

    // Avg turnaround for this tenant
    const deliveredWithTime = tenantReqs
      .filter((r) => r.status === "delivered" && r.updated_at)
      .map((r) => {
        const created = new Date(r.created_at).getTime();
        const delivered = new Date(r.updated_at!).getTime();
        return (delivered - created) / (1000 * 60 * 60 * 24);
      });
    const avgTurnaround =
      deliveredWithTime.length > 0
        ? deliveredWithTime.reduce((a, b) => a + b, 0) /
          deliveredWithTime.length
        : null;

    const completionRate =
      thisMonthReqs.length > 0
        ? deliveredThisMonth / thisMonthReqs.length
        : 0;

    let status: "healthy" | "attention" | "inactive" = "healthy";
    if (thisMonthReqs.length === 0) {
      status = "inactive";
    } else if (completionRate < 0.5 || (avgTurnaround !== null && avgTurnaround > 7)) {
      status = "attention";
    }

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      requestsThisMonth: thisMonthReqs.length,
      deliveredThisMonth,
      avgTurnaroundDays: avgTurnaround
        ? parseFloat(avgTurnaround.toFixed(1))
        : null,
      status,
    };
  });

  // Platform alerts
  const platformAlerts: Array<{
    type: "urgent" | "warning" | "info" | "positive";
    title: string;
    detail: string;
  }> = [];

  // Check for tenants with low completion rates
  const lowCompletionTenants = tenantHealthItems.filter(
    (t) => t.status === "attention" && t.requestsThisMonth > 0
  );
  if (lowCompletionTenants.length > 0) {
    platformAlerts.push({
      type: "warning",
      title: `${lowCompletionTenants.length} tenant${lowCompletionTenants.length > 1 ? "s" : ""} need${lowCompletionTenants.length === 1 ? "s" : ""} attention`,
      detail: `${lowCompletionTenants.map((t) => t.name).join(", ")} — low completion rate or slow turnaround this month.`,
    });
  }

  // Check for inactive tenants
  const inactiveTenants = tenantHealthItems.filter(
    (t) => t.status === "inactive"
  );
  if (inactiveTenants.length > 0) {
    platformAlerts.push({
      type: "info",
      title: `${inactiveTenants.length} inactive tenant${inactiveTenants.length > 1 ? "s" : ""}`,
      detail: `${inactiveTenants.map((t) => t.name).join(", ")} — no requests this month.`,
    });
  }

  // Revenue trend
  if (revenueThisMonth > revenueLastMonth && revenueLastMonth > 0) {
    const pct = Math.round(
      ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
    );
    platformAlerts.push({
      type: "positive",
      title: `Revenue up ${pct}% this month`,
      detail: `${formatCents(revenueThisMonth)} this month vs ${formatCents(revenueLastMonth)} last month.`,
    });
  } else if (revenueThisMonth < revenueLastMonth && revenueLastMonth > 0) {
    const pct = Math.round(
      ((revenueLastMonth - revenueThisMonth) / revenueLastMonth) * 100
    );
    platformAlerts.push({
      type: "warning",
      title: `Revenue down ${pct}% this month`,
      detail: `${formatCents(revenueThisMonth)} this month vs ${formatCents(revenueLastMonth)} last month.`,
    });
  }

  // If no alerts, add an all-clear
  if (platformAlerts.length === 0) {
    platformAlerts.push({
      type: "positive",
      title: "All systems healthy",
      detail: "No issues detected across tenants.",
    });
  }

  // KPI cells
  const revenueDelta =
    revenueLastMonth > 0
      ? Math.round(
          ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        )
      : 0;
  const requestsDelta =
    requestsLastMonth > 0
      ? Math.round(
          ((requestsThisMonth - requestsLastMonth) / requestsLastMonth) * 100
        )
      : 0;

  const kpiCells: Array<{
    value: number;
    label: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    context?: string;
    contextColor?: "good" | "attention" | "urgent" | "info" | "muted";
  }> = [
    {
      value: platformCutThisMonth / 100,
      label: "Platform Cut (MTD)",
      prefix: "$",
      decimals: 2,
      context:
        platformCutThisMonth > 0
          ? `of ${formatCents(revenueThisMonth)} total`
          : "No revenue yet",
      contextColor: "info",
    },
    {
      value: revenueThisMonth / 100,
      label: "Total Revenue (MTD)",
      prefix: "$",
      decimals: 2,
      context:
        revenueDelta !== 0
          ? `${revenueDelta > 0 ? "+" : ""}${revenueDelta}% vs last month`
          : "This month",
      contextColor: revenueDelta >= 0 ? "good" : "attention",
    },
    {
      value: tenantCount || 0,
      label: "Active Tenants",
      context: `${tenantCount || 0} total`,
      contextColor: "muted",
    },
    {
      value: requestsThisMonth,
      label: "Requests (MTD)",
      context:
        requestsDelta !== 0
          ? `${requestsDelta > 0 ? "+" : ""}${requestsDelta}% vs last month`
          : `${totalRequests} all time`,
      contextColor: requestsDelta >= 0 ? "good" : "attention",
    },
    {
      value: avgFeePercent,
      label: "Avg Fee %",
      suffix: "%",
      decimals: 1,
      context: "Across all tenants",
      contextColor: "muted",
    },
    {
      value: totalRevenue / 100,
      label: "All-Time Revenue",
      prefix: "$",
      decimals: 2,
      context: `${formatCents(platformCutTotal)} platform cut`,
      contextColor: "info",
    },
  ];

  const recentRequests = allRequests.slice(0, 25);

  return (
    <PlatformDashboardClient
      kpiCells={kpiCells}
      tenantRevenues={tenantRevenues}
      recentRequests={recentRequests.map((req) => ({
        id: req.id,
        created_at: req.created_at,
        tenant_id: req.tenant_id,
        association_id: req.association_id,
        turnaround: (req.turnaround as Turnaround) || "standard",
        requester_name: req.requester_name,
        property_address: req.property_address,
        document_types: req.document_types as DocumentType[],
        status: req.status as RequestStatus,
        total_price_cents: req.total_price_cents || 0,
      }))}
      tenantNameMap={tenantNameMap}
      associationMap={associationMap}
      triageCounts={triageCounts}
      tenantHealthItems={tenantHealthItems}
      platformAlerts={platformAlerts}
      statusConfig={{
        dotColors: STATUS_DOT_COLOR,
        badgeColors: STATUS_BADGE,
        labels: STATUS_LABELS,
      }}
    />
  );
}
