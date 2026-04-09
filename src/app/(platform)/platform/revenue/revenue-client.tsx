"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  PageKpiTickerResponsive,
  type KpiCell,
} from "@/components/shared/PageKpiTicker";
import {
  StaggerContainer,
  FadeUpChild,
} from "@/components/shared/PageTransition";
import { formatCents } from "@/lib/pricing";

// ── Types ──

interface TenantBreakdown {
  id: string;
  name: string;
  slug: string;
  fee: number;
  hasStripe: boolean;
  totalRevenue: number;
  thisMonth: number;
  platformCut: number;
  platformCutThisMonth: number;
  requestCount: number;
}

interface SettlementRow {
  id: string;
  tenantId: string;
  tenantName: string;
  periodStart: string;
  periodEnd: string;
  totalDocsFulfilled: number;
  ppoOrders: number;
  ppoGrossRevenue: number;
  ppoTenantShare: number;
  ppoPlatformShare: number;
  subFulfillments: number;
  subFulfillmentFees: number;
  totalTenantEarnings: number;
  totalPlatformEarnings: number;
  status: string;
  paidAt: string | null;
}

interface PlatformRevenueClientProps {
  kpis: {
    totalRevenue: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    platformCutTotal: number;
    platformCutThisMonth: number;
    totalOrders: number;
  };
  tenantBreakdown: TenantBreakdown[];
  settlements: SettlementRow[];
  accruingTotals: {
    tenantPayouts: number;
    platformRevenue: number;
    subFulfillmentCost: number;
    pendingSettlements: number;
    failedSettlements: number;
  };
  pnl: {
    subscriptionMrr: number;
    ppoPlatformShare: number;
    subFulfillmentCost: number;
    netPlatformRevenue: number;
  };
}

// ── Helpers ──

function formatDollars(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SettlementStatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; label: string }> = {
    pending: { dot: "bg-[#f59e0b]", label: "Pending" },
    processing: { dot: "bg-[#38b6ff]", label: "Processing" },
    paid: { dot: "bg-[#14b8a6]", label: "Paid" },
    failed: { dot: "bg-[#ef4444]", label: "Failed" },
  };
  const c = config[status] || config.pending;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${c.dot}`} />
      <span className="text-xs font-medium">{c.label}</span>
    </span>
  );
}

// ── Main Component ──

export function PlatformRevenueClient({
  kpis,
  tenantBreakdown,
  settlements,
  accruingTotals,
  pnl,
}: PlatformRevenueClientProps) {
  const kpiCells: KpiCell[] = [
    {
      value: kpis.platformCutThisMonth / 100,
      label: "Platform Revenue (MTD)",
      prefix: "$",
      decimals: 2,
      context: `of ${formatCents(kpis.revenueThisMonth)} gross`,
      contextColor: "good",
    },
    {
      value: accruingTotals.tenantPayouts,
      label: "Tenant Payouts (MTD)",
      prefix: "$",
      decimals: 2,
      context: "Accruing for settlement",
      contextColor: "info",
    },
    {
      value: pnl.subscriptionMrr,
      label: "Subscription MRR",
      prefix: "$",
      decimals: 2,
      context: "Monthly recurring",
      contextColor: "good",
    },
    {
      value: accruingTotals.subFulfillmentCost,
      label: "Fulfillment Costs",
      prefix: "$",
      decimals: 2,
      context: "$10/doc to tenants",
      contextColor: "attention",
    },
    {
      value: accruingTotals.pendingSettlements,
      label: "Pending Settlements",
      context: accruingTotals.pendingSettlements === 0 ? "All clear" : "Awaiting transfer",
      contextColor: accruingTotals.pendingSettlements === 0 ? "good" : "attention",
    },
    {
      value: accruingTotals.failedSettlements,
      label: "Failed Settlements",
      context: accruingTotals.failedSettlements === 0 ? "None" : "Need retry",
      contextColor: accruingTotals.failedSettlements === 0 ? "good" : "urgent",
    },
  ];

  return (
    <StaggerContainer className="space-y-6" staggerDelay={0.1}>
      <FadeUpChild>
        <PageHeader
          title="Revenue & Settlements"
          subtitle="Platform revenue, tenant payouts, and settlement tracking"
        />
      </FadeUpChild>

      <FadeUpChild>
        <PageKpiTickerResponsive cells={kpiCells} />
      </FadeUpChild>

      {/* P&L Breakdown */}
      <FadeUpChild>
        <Card className="dash-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Platform Revenue Breakdown (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subscription MRR</span>
                <span className="font-mono font-medium text-[#14b8a6]">
                  {formatDollars(pnl.subscriptionMrr)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">PPO Platform Share (50%)</span>
                <span className="font-mono font-medium text-[#38b6ff]">
                  {formatDollars(pnl.ppoPlatformShare)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subscription Fulfillment Cost ($10/doc)</span>
                <span className="font-mono font-medium text-[#ef4444]">
                  -{formatDollars(pnl.subFulfillmentCost)}
                </span>
              </div>
              <div className="pt-3 mt-3 border-t-2 border-border flex items-center justify-between">
                <span className="font-semibold text-foreground">Net Platform Revenue</span>
                <span className={`font-mono text-lg font-bold ${pnl.netPlatformRevenue >= 0 ? "text-[#14b8a6]" : "text-[#ef4444]"}`}>
                  {formatDollars(pnl.netPlatformRevenue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeUpChild>

      {/* Monthly Settlements Table */}
      {settlements.length > 0 && (
        <FadeUpChild>
          <Card className="dash-card">
            <CardHeader>
              <CardTitle className="text-base">Monthly Settlements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="table-scroll-mobile">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Tenant
                      </th>
                      <th className="hidden sm:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Period
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Docs
                      </th>
                      <th className="hidden md:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        PPO Share
                      </th>
                      <th className="hidden md:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Sub Fees
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Total
                      </th>
                      <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((s) => (
                      <tr
                        key={s.id}
                        className={`border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
                          s.status === "failed"
                            ? "border-l-[3px] border-l-[#ef4444]"
                            : ""
                        }`}
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/platform/tenants/${s.tenantId}`}
                            className="font-medium hover:text-[#8b5cf6] transition-colors"
                          >
                            {s.tenantName}
                          </Link>
                        </td>
                        <td className="hidden sm:table-cell py-3 pr-4 text-muted-foreground font-mono text-xs">
                          {new Date(s.periodStart).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono">
                          {s.totalDocsFulfilled}
                        </td>
                        <td className="hidden md:table-cell py-3 pr-4 text-right font-mono">
                          {formatDollars(s.ppoTenantShare)}
                        </td>
                        <td className="hidden md:table-cell py-3 pr-4 text-right font-mono">
                          {formatDollars(s.subFulfillmentFees)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono font-medium">
                          {formatDollars(s.totalTenantEarnings)}
                        </td>
                        <td className="py-3 text-right">
                          <SettlementStatusBadge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </FadeUpChild>
      )}

      {/* Revenue by Tenant */}
      <FadeUpChild>
        <Card className="dash-card">
          <CardHeader>
            <CardTitle className="text-base">Revenue by Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            {tenantBreakdown.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No revenue data yet.
              </p>
            ) : (
              <div className="table-scroll-mobile">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Tenant
                      </th>
                      <th className="hidden sm:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Fee
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Orders
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Gross
                      </th>
                      <th className="hidden md:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        This Month
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Platform Cut
                      </th>
                      <th className="hidden sm:table-cell pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Tenant Cut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantBreakdown.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/platform/tenants/${t.id}`}
                            className="font-medium hover:text-[#8b5cf6] transition-colors"
                          >
                            {t.name}
                          </Link>
                          <p className="text-xs text-muted-foreground font-mono">
                            {t.slug}.propertydocz.com
                          </p>
                        </td>
                        <td className="hidden sm:table-cell py-3 pr-4 text-right font-mono">
                          {t.fee}%
                        </td>
                        <td className="py-3 pr-4 text-right font-mono">
                          {t.requestCount}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono font-medium">
                          {formatCents(t.totalRevenue)}
                        </td>
                        <td className="hidden md:table-cell py-3 pr-4 text-right font-mono">
                          {formatCents(t.thisMonth)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-[#8b5cf6]">
                          {formatCents(t.platformCut)}
                        </td>
                        <td className="hidden sm:table-cell py-3 text-right font-mono">
                          {formatCents(t.totalRevenue - t.platformCut)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border font-medium">
                      <td className="pt-3 pr-4">Totals</td>
                      <td className="hidden sm:table-cell pt-3 pr-4" />
                      <td className="pt-3 pr-4 text-right font-mono">
                        {kpis.totalOrders}
                      </td>
                      <td className="pt-3 pr-4 text-right font-mono">
                        {formatCents(kpis.totalRevenue)}
                      </td>
                      <td className="hidden md:table-cell pt-3 pr-4 text-right font-mono">
                        {formatCents(kpis.revenueThisMonth)}
                      </td>
                      <td className="pt-3 pr-4 text-right font-mono text-[#8b5cf6]">
                        {formatCents(kpis.platformCutTotal)}
                      </td>
                      <td className="hidden sm:table-cell pt-3 text-right font-mono">
                        {formatCents(kpis.totalRevenue - kpis.platformCutTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeUpChild>
    </StaggerContainer>
  );
}
