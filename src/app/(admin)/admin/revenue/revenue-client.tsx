"use client";

import { useState } from "react";
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
import { ChevronDown, ChevronUp } from "lucide-react";
import type { DocumentType } from "@/lib/types";

// ── Types ──

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

interface SettlementHistory {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalDocsFulfilled: number;
  ppoOrders: number;
  ppoGrossRevenue: number;
  ppoTenantShare: number;
  subFulfillments: number;
  subFulfillmentFees: number;
  totalTenantEarnings: number;
  status: string;
  paidAt: string | null;
}

interface LedgerEntry {
  id: string;
  date: string;
  requestId: string;
  docType: string;
  docCount: number;
  revenueType: string;
  orderAmount: number;
  tenantShare: number;
  status: string;
}

interface SettlementData {
  accruing: {
    ppoOrders: number;
    ppoGross: number;
    ppoTenantShare: number;
    subFulfillments: number;
    subFees: number;
    totalEarnings: number;
    nextSettlement: string;
  };
  history: SettlementHistory[];
  ledger: LedgerEntry[];
}

interface RevenueClientProps {
  kpis: {
    revenueMTD: number;
    revenueLastMonth: number;
    momGrowth: number;
    avgOrderValue: number;
    ordersMTD: number;
    topDocTypeLabel: string;
    topDocTypeRevenue: number;
  };
  docTypeRevenue: DocTypeRevenue[];
  rushStats: { count: number; revenue: number };
  monthlyRevenue: MonthlyRevenue[];
  topClients: TopClient[];
  settlementData?: SettlementData;
}

// ── Revenue Type Badges ──

function RevenueTypeBadge({ type }: { type: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pay_per_order: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-600 dark:text-blue-400",
      label: "PPO",
    },
    overage: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-600 dark:text-amber-400",
      label: "Overage",
    },
    subscription_fulfillment: {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-600 dark:text-purple-400",
      label: "Subscription",
    },
  };

  const c = config[type] || config.pay_per_order;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function SettlementStatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; label: string }> = {
    accruing: { dot: "bg-[#38b6ff]", label: "Accruing" },
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

// ── Format dollar amount ──

function formatDollars(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Main Component ──

export function RevenueClient({
  kpis,
  docTypeRevenue,
  rushStats,
  monthlyRevenue,
  topClients,
  settlementData,
}: RevenueClientProps) {
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<string>("all");

  const sd = settlementData;

  const kpiCells: KpiCell[] = [
    {
      value: kpis.revenueMTD / 100,
      label: "Revenue (MTD)",
      prefix: "$",
      decimals: 2,
      contextColor: "muted",
    },
    {
      value: sd ? sd.accruing.totalEarnings : kpis.revenueMTD / 200,
      label: "Your Share (MTD)",
      prefix: "$",
      decimals: 2,
      context: sd ? "50/50 split + fulfillment fees" : "Estimated",
      contextColor: "good",
    },
    {
      value: kpis.momGrowth,
      label: "MoM Growth",
      suffix: "%",
      context: kpis.momGrowth >= 0 ? "Growing" : "Declining",
      contextColor: kpis.momGrowth >= 0 ? "good" : "urgent",
    },
    {
      value: kpis.avgOrderValue / 100,
      label: "Avg Order Value",
      prefix: "$",
      decimals: 2,
      contextColor: "muted",
    },
    {
      value: kpis.ordersMTD,
      label: "Orders (MTD)",
      context: "This month",
      contextColor: "info",
    },
    {
      value: sd ? sd.accruing.subFees : 0,
      label: "Fulfillment Fees",
      prefix: "$",
      decimals: 2,
      context: sd ? `${sd.accruing.subFulfillments} sub docs @ $10` : "No sub orders",
      contextColor: "info",
    },
    {
      value: sd?.history.length
        ? sd.history[0].totalTenantEarnings
        : 0,
      label: "Last Settlement",
      prefix: "$",
      decimals: 2,
      context: sd?.history.length
        ? `${new Date(sd.history[0].periodStart).toLocaleDateString("en-US", { month: "short" })} ${new Date(sd.history[0].periodStart).getFullYear()}`
        : "No settlements yet",
      contextColor: "muted",
    },
  ];

  const maxDocRevenue = Math.max(...docTypeRevenue.map((d) => d.revenue), 1);

  // Filter ledger
  const filteredLedger = sd
    ? sd.ledger.filter((e) => ledgerFilter === "all" || e.revenueType === ledgerFilter)
    : [];

  return (
    <StaggerContainer className="space-y-6" staggerDelay={0.1}>
      <FadeUpChild>
        <PageHeader
          title="Revenue"
          subtitle="Document revenue analytics, settlements, and fulfillment ledger"
        />
      </FadeUpChild>

      <FadeUpChild>
        <PageKpiTickerResponsive cells={kpiCells} />
      </FadeUpChild>

      {/* ── Settlement History ── */}
      {sd && (
        <FadeUpChild>
          <Card className="dash-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Settlement History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current month — accruing */}
              <div className="rounded-xl border border-[#38b6ff]/20 bg-[#38b6ff]/[0.03] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Settlement date: {sd.accruing.nextSettlement}
                    </p>
                  </div>
                  <SettlementStatusBadge status="accruing" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pay-per-order</span>
                    <span>
                      <span className="text-muted-foreground">{sd.accruing.ppoOrders} orders</span>
                      <span className="mx-2 text-muted-foreground/50">|</span>
                      <span className="font-mono text-muted-foreground">{formatDollars(sd.accruing.ppoGross)} gross</span>
                      <span className="mx-2 text-muted-foreground/50">|</span>
                      <span className="font-mono font-medium">{formatDollars(sd.accruing.ppoTenantShare)}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subscription fulfillment</span>
                    <span>
                      <span className="text-muted-foreground">{sd.accruing.subFulfillments} docs fulfilled</span>
                      <span className="mx-2 text-muted-foreground/50">|</span>
                      <span className="font-mono font-medium">{formatDollars(sd.accruing.subFees)}</span>
                    </span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
                    <span className="font-medium text-foreground">Your earnings this month</span>
                    <span className="font-mono text-lg font-bold text-[#38b6ff]">
                      {formatDollars(sd.accruing.totalEarnings)}
                    </span>
                  </div>
                </div>

                {/* Accruing progress bar */}
                {sd.accruing.totalEarnings > 0 && (
                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#38b6ff] transition-all"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDollars(sd.accruing.totalEarnings)} accruing
                    </p>
                  </div>
                )}
              </div>

              {/* Past settlements */}
              {sd.history.map((s) => {
                const monthLabel = new Date(s.periodStart).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });

                return (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-5 ${
                      s.status === "failed"
                        ? "border-l-[3px] border-l-[#ef4444] border-t-border border-r-border border-b-border"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-foreground">{monthLabel}</p>
                      <SettlementStatusBadge status={s.status} />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pay-per-order</span>
                        <span>
                          <span className="text-muted-foreground">{s.ppoOrders} orders</span>
                          <span className="mx-2 text-muted-foreground/50">|</span>
                          <span className="font-mono text-muted-foreground">{formatDollars(s.ppoGrossRevenue)} gross</span>
                          <span className="mx-2 text-muted-foreground/50">|</span>
                          <span className="font-mono font-medium">{formatDollars(s.ppoTenantShare)}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subscription fulfillment</span>
                        <span>
                          <span className="text-muted-foreground">{s.subFulfillments} docs</span>
                          <span className="mx-2 text-muted-foreground/50">|</span>
                          <span className="font-mono font-medium">{formatDollars(s.subFulfillmentFees)}</span>
                        </span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
                        <span className="font-medium">Your earnings</span>
                        <span className="font-mono text-base font-bold">{formatDollars(s.totalTenantEarnings)}</span>
                      </div>
                      {s.paidAt && (
                        <p className="text-[11px] text-muted-foreground">
                          Paid on {new Date(s.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {sd.history.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No past settlements yet. Your first settlement will process on{" "}
                  {sd.accruing.nextSettlement}.
                </p>
              )}
            </CardContent>
          </Card>
        </FadeUpChild>
      )}

      {/* Revenue by Doc Type + Monthly Trend */}
      <FadeUpChild>
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Revenue by Document Type — 3/5 */}
          <Card className="dash-card lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Revenue by Document Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {docTypeRevenue.map((dt) => (
                <div key={dt.type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">{dt.label}</span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCents(dt.revenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#38b6ff] transition-all duration-500"
                        style={{
                          width: `${Math.max((dt.revenue / maxDocRevenue) * 100, 2)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">
                      {dt.count} orders
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[11px] text-muted-foreground">
                    <span>Avg: {formatCents(dt.avgPrice)}</span>
                    <span>{dt.pctOfTotal}% of total</span>
                  </div>
                </div>
              ))}

              {/* Rush order premium */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rush Order Premium</span>
                  <span className="font-mono font-medium text-foreground">
                    {formatCents(rushStats.revenue)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {rushStats.count} rush orders x $50 fee
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue Trend — 2/5 */}
          <Card className="dash-card lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyRevenue.filter((m) => m.orders > 0).length < 2 ? (
                <p className="text-sm text-muted-foreground py-4">
                  Insufficient data for trends. Revenue tracking begins when
                  orders are paid.
                </p>
              ) : (
                <div className="space-y-3">
                  {monthlyRevenue.map((m, i) => {
                    const prevRevenue = i > 0 ? monthlyRevenue[i - 1].revenue : null;
                    const trend =
                      prevRevenue !== null && prevRevenue > 0
                        ? m.revenue >= prevRevenue
                          ? "up"
                          : "down"
                        : "";

                    return (
                      <div
                        key={m.month}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground w-16">
                          {m.month}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {m.orders} orders
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-medium">
                            {formatCents(m.revenue)}
                          </span>
                          {trend && (
                            <span
                              className={
                                trend === "up"
                                  ? "text-[#14b8a6] text-xs"
                                  : "text-[#ef4444] text-xs"
                              }
                            >
                              {trend === "up" ? "\u2191" : "\u2193"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeUpChild>

      {/* ── Fulfillment Ledger ── */}
      {sd && sd.ledger.length > 0 && (
        <FadeUpChild>
          <Card className="dash-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Fulfillment Ledger</CardTitle>
                <button
                  onClick={() => setShowLedger(!showLedger)}
                  className="flex items-center gap-1 text-xs text-[#38b6ff] hover:underline transition-colors"
                >
                  {showLedger ? "Hide" : "Show"} details
                  {showLedger ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
              </div>
            </CardHeader>
            {showLedger && (
              <CardContent>
                {/* Filter */}
                <div className="flex gap-2 mb-4">
                  <select
                    value={ledgerFilter}
                    onChange={(e) => setLedgerFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#38b6ff]/30"
                  >
                    <option value="all">All Types</option>
                    <option value="pay_per_order">Pay-per-order</option>
                    <option value="overage">Overage</option>
                    <option value="subscription_fulfillment">Subscription</option>
                  </select>
                </div>

                <div className="table-scroll-mobile">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Date
                        </th>
                        <th className="hidden sm:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Ref
                        </th>
                        <th className="hidden md:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Documents
                        </th>
                        <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Type
                        </th>
                        <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Order Amt
                        </th>
                        <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Your Share
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLedger.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                        >
                          <td className="py-3 pr-4 text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4">
                            <span className="font-mono text-xs">
                              #{entry.requestId.slice(0, 8).toUpperCase()}
                            </span>
                          </td>
                          <td className="hidden md:table-cell py-3 pr-4 text-muted-foreground truncate max-w-[200px]" title={entry.docType}>
                            {entry.docType}
                          </td>
                          <td className="py-3 pr-4">
                            <RevenueTypeBadge type={entry.revenueType} />
                          </td>
                          <td className="py-3 pr-4 text-right font-mono">
                            {entry.orderAmount > 0 ? formatDollars(entry.orderAmount) : "$0.00"}
                          </td>
                          <td className="py-3 text-right font-mono font-medium text-[#38b6ff]">
                            {formatDollars(entry.tenantShare)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        </FadeUpChild>
      )}

      {/* Top Clients by Revenue */}
      <FadeUpChild>
        <Card className="dash-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Top Clients by Revenue</CardTitle>
              <Link
                href="/admin/agents"
                className="text-xs text-[#38b6ff] hover:underline transition-colors"
              >
                View all &rarr;
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {topClients.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No revenue data yet.
              </p>
            ) : (
              <div className="table-scroll-mobile">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 w-8 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        #
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Name
                      </th>
                      <th className="hidden sm:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Company
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Orders
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Revenue
                      </th>
                      <th className="hidden sm:table-cell pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Last Order
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topClients.map((client) => (
                      <tr
                        key={client.rank}
                        className="border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                      >
                        <td className="py-3 pr-4 font-mono text-muted-foreground">
                          {client.rank}
                        </td>
                        <td className="py-3 pr-4 font-medium truncate max-w-[180px]" title={client.name}>
                          {client.name}
                        </td>
                        <td className="hidden sm:table-cell py-3 pr-4 text-muted-foreground truncate max-w-[150px]" title={client.company}>
                          {client.company}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono font-medium">
                          {client.orders}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono font-medium">
                          {formatCents(client.revenue)}
                        </td>
                        <td className="hidden sm:table-cell py-3 text-right text-muted-foreground">
                          {new Date(client.lastOrder).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeUpChild>
    </StaggerContainer>
  );
}
