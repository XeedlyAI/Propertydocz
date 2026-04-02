import { createServiceClient } from "@/lib/supabase/server";
import { getPlatformUser } from "@/lib/auth";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType, RequestStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  FileText,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<RequestStatus, string> = {
  received: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  paid: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  awaiting_data: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  ready_for_generation: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  pending_review: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  delivered: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
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
  const tenantNameMap = new Map(allTenants.map((t) => [t.id, t.name]));
  const tenantFeeMap = new Map(
    allTenants.map((t) => [t.id, t.platform_fee_percent || 15])
  );

  // All requests (cross-tenant)
  const { data: requests } = await serviceClient
    .from("document_requests")
    .select(
      "id, created_at, tenant_id, requester_name, requester_email, property_address, document_types, status, total_price_cents, payment_status"
    )
    .order("created_at", { ascending: false });

  const allRequests = requests || [];
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // Stats
  const totalRequests = allRequests.length;
  const requestsThisMonth = allRequests.filter(
    (r) => r.created_at >= startOfMonth
  ).length;

  const activeTenantIds = new Set(
    allRequests
      .filter((r) => r.created_at >= startOfMonth)
      .map((r) => r.tenant_id)
  );

  const paidRequests = allRequests.filter((r) => r.payment_status === "paid");
  const totalRevenue = paidRequests.reduce(
    (sum, r) => sum + (r.total_price_cents || 0),
    0
  );
  const revenueThisMonth = paidRequests
    .filter((r) => r.created_at >= startOfMonth)
    .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

  const platformCutTotal = paidRequests.reduce((sum, r) => {
    const fee = tenantFeeMap.get(r.tenant_id) || 15;
    return sum + Math.round(((r.total_price_cents || 0) * fee) / 100);
  }, 0);

  const platformCutThisMonth = paidRequests
    .filter((r) => r.created_at >= startOfMonth)
    .reduce((sum, r) => {
      const fee = tenantFeeMap.get(r.tenant_id) || 15;
      return sum + Math.round(((r.total_price_cents || 0) * fee) / 100);
    }, 0);

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

  const recentRequests = allRequests.slice(0, 25);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Platform Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Cross-tenant overview for XeedlyAI
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Platform Revenue — Dark Accent Card */}
        <div className="dark-accent-card rounded-xl p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              Platform Cut
            </p>
            <DollarSign className="size-4 text-[#38b6ff]" />
          </div>
          <p className="mt-2 font-data text-2xl font-bold text-white">
            {formatCents(platformCutThisMonth)}
          </p>
          <p className="mt-1 text-xs text-white/40">This month</p>
        </div>

        {/* Total Revenue */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Revenue
              </p>
              <TrendingUp className="size-4 text-[#38b6ff]" />
            </div>
            <p className="mt-2 font-data text-2xl font-bold">
              {formatCents(revenueThisMonth)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        {/* Total Tenants */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tenants
              </p>
              <Building2 className="size-4 text-[#38b6ff]" />
            </div>
            <p className="mt-2 font-data text-2xl font-bold">
              {tenantCount || 0}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeTenantIds.size} active this month
            </p>
          </CardContent>
        </Card>

        {/* Total Requests */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Requests
              </p>
              <FileText className="size-4 text-[#38b6ff]" />
            </div>
            <p className="mt-2 font-data text-2xl font-bold">
              {totalRequests}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {requestsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        {/* All-Time Platform Cut */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                All-Time Cut
              </p>
              <Users className="size-4 text-[#38b6ff]" />
            </div>
            <p className="mt-2 font-data text-2xl font-bold">
              {formatCents(platformCutTotal)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              of {formatCents(totalRevenue)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Tenant */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          {allTenants.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No tenants yet.{" "}
              <Link
                href="/platform/tenants/new"
                className="text-[#38b6ff] hover:underline"
              >
                Add your first tenant
              </Link>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Tenant
                    </th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Fee %
                    </th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Requests
                    </th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Revenue
                    </th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Platform Cut
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Tenant Cut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allTenants.map((t) => {
                    const stats = tenantRevenueMap.get(t.id) || {
                      revenue: 0,
                      count: 0,
                    };
                    const fee = t.platform_fee_percent || 15;
                    const cut = Math.round((stats.revenue * fee) / 100);
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/platform/tenants/${t.id}`}
                            className="font-medium hover:text-[#38b6ff] transition-colors"
                          >
                            {t.name}
                          </Link>
                          <p className="text-xs text-muted-foreground font-data">
                            {t.slug}.propertydocz.com
                          </p>
                        </td>
                        <td className="py-3 pr-4 text-right font-data">
                          {fee}%
                        </td>
                        <td className="py-3 pr-4 text-right font-data">
                          {stats.count}
                        </td>
                        <td className="py-3 pr-4 text-right font-data font-medium">
                          {formatCents(stats.revenue)}
                        </td>
                        <td className="py-3 pr-4 text-right font-data text-[#38b6ff]">
                          {formatCents(cut)}
                        </td>
                        <td className="py-3 text-right font-data">
                          {formatCents(stats.revenue - cut)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests (All Tenants) */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests (All Tenants)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No requests yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Tenant
                    </th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Requester
                    </th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Property
                    </th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Documents
                    </th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/platform/tenants/${req.tenant_id}`}
                          className="text-xs font-medium hover:text-[#38b6ff] transition-colors"
                        >
                          {tenantNameMap.get(req.tenant_id) || "Unknown"}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        {req.requester_name}
                      </td>
                      <td className="py-3 pr-4 max-w-[180px] truncate text-muted-foreground">
                        {req.property_address}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {(req.document_types as DocumentType[]).map((dt) => (
                            <span
                              key={dt}
                              className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {DOCUMENT_LABELS[dt]?.split(" ")[0] || dt}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status as RequestStatus] || "bg-muted text-muted-foreground"}`}
                        >
                          {STATUS_LABELS[req.status as RequestStatus] ||
                            req.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-data font-medium">
                        {formatCents(req.total_price_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
