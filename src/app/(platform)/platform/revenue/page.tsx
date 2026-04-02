import { createServiceClient } from "@/lib/supabase/server";
import { getPlatformUser } from "@/lib/auth";
import { formatCents } from "@/lib/pricing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function PlatformRevenuePage() {
  await getPlatformUser();
  const serviceClient = await createServiceClient();

  // Tenants with fee info
  const { data: tenants } = await serviceClient
    .from("tenants")
    .select("id, name, slug, platform_fee_percent")
    .order("name");

  const allTenants = tenants || [];
  const tenantFeeMap = new Map(
    allTenants.map((t) => [t.id, t.platform_fee_percent || 15])
  );

  // All paid requests
  const { data: requests } = await serviceClient
    .from("document_requests")
    .select("tenant_id, total_price_cents, payment_status, created_at")
    .eq("payment_status", "paid");

  const paidReqs = requests || [];

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

  // Revenue calculations
  const totalRevenue = paidReqs.reduce(
    (sum, r) => sum + (r.total_price_cents || 0),
    0
  );
  const revenueThisMonth = paidReqs
    .filter((r) => r.created_at >= startOfMonth)
    .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);
  const revenueLastMonth = paidReqs
    .filter(
      (r) => r.created_at >= startOfLastMonth && r.created_at < startOfMonth
    )
    .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

  const platformCutTotal = paidReqs.reduce((sum, r) => {
    const fee = tenantFeeMap.get(r.tenant_id) || 15;
    return sum + Math.round(((r.total_price_cents || 0) * fee) / 100);
  }, 0);

  const platformCutThisMonth = paidReqs
    .filter((r) => r.created_at >= startOfMonth)
    .reduce((sum, r) => {
      const fee = tenantFeeMap.get(r.tenant_id) || 15;
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
    const fee = t.platform_fee_percent || 15;
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      fee,
      totalRevenue: revenue,
      thisMonth,
      platformCut: Math.round((revenue * fee) / 100),
      platformCutThisMonth: Math.round((thisMonth * fee) / 100),
      requestCount: tenantReqs.length,
    };
  });

  // Sort by revenue descending
  tenantBreakdown.sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
        <p className="text-sm text-muted-foreground">
          Platform revenue reporting and tenant breakdown
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="dark-accent-card rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              Platform Revenue
            </p>
            <DollarSign className="size-4 text-[#38b6ff]" />
          </div>
          <p className="mt-2 font-data text-2xl font-bold text-white">
            {formatCents(platformCutTotal)}
          </p>
          <p className="mt-1 text-xs text-white/40">All time</p>
        </div>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                This Month
              </p>
              <TrendingUp className="size-4 text-[#38b6ff]" />
            </div>
            <p className="mt-2 font-data text-2xl font-bold text-[#38b6ff]">
              {formatCents(platformCutThisMonth)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              of {formatCents(revenueThisMonth)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Last Month
              </p>
            </div>
            <p className="mt-2 font-data text-2xl font-bold">
              {formatCents(revenueLastMonth)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Gross Revenue
              </p>
              <ArrowUpRight className="size-4 text-emerald-500" />
            </div>
            <p className="mt-2 font-data text-2xl font-bold">
              {formatCents(totalRevenue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {paidReqs.length} total orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Tenant Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          {tenantBreakdown.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No revenue data yet.
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
                      Fee
                    </th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Orders
                    </th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Gross Revenue
                    </th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      This Month
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
                  {tenantBreakdown.map((t) => (
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
                        {t.fee}%
                      </td>
                      <td className="py-3 pr-4 text-right font-data">
                        {t.requestCount}
                      </td>
                      <td className="py-3 pr-4 text-right font-data font-medium">
                        {formatCents(t.totalRevenue)}
                      </td>
                      <td className="py-3 pr-4 text-right font-data">
                        {formatCents(t.thisMonth)}
                      </td>
                      <td className="py-3 pr-4 text-right font-data text-[#38b6ff]">
                        {formatCents(t.platformCut)}
                      </td>
                      <td className="py-3 text-right font-data">
                        {formatCents(t.totalRevenue - t.platformCut)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border font-medium">
                    <td className="pt-3 pr-4">Totals</td>
                    <td className="pt-3 pr-4" />
                    <td className="pt-3 pr-4 text-right font-data">
                      {paidReqs.length}
                    </td>
                    <td className="pt-3 pr-4 text-right font-data">
                      {formatCents(totalRevenue)}
                    </td>
                    <td className="pt-3 pr-4 text-right font-data">
                      {formatCents(revenueThisMonth)}
                    </td>
                    <td className="pt-3 pr-4 text-right font-data text-[#38b6ff]">
                      {formatCents(platformCutTotal)}
                    </td>
                    <td className="pt-3 text-right font-data">
                      {formatCents(totalRevenue - platformCutTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
