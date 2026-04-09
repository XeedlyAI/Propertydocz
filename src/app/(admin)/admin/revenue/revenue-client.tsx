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
import type { DocumentType } from "@/lib/types";

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
}

export function RevenueClient({
  kpis,
  docTypeRevenue,
  rushStats,
  monthlyRevenue,
  topClients,
}: RevenueClientProps) {
  const kpiCells: KpiCell[] = [
    {
      value: kpis.revenueMTD / 100,
      label: "Revenue (MTD)",
      prefix: "$",
      decimals: 2,
      contextColor: "muted",
    },
    {
      value: kpis.revenueLastMonth / 100,
      label: "Revenue (Last Month)",
      prefix: "$",
      decimals: 2,
      contextColor: "muted",
    },
    {
      value: kpis.momGrowth,
      label: "MoM Growth",
      suffix: "%",
      context: kpis.momGrowth >= 0 ? "↑ Growing" : "↓ Declining",
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
      value: kpis.topDocTypeRevenue / 100,
      label: "Top Doc Revenue",
      prefix: "$",
      decimals: 2,
      context: kpis.topDocTypeLabel,
      contextColor: "info",
    },
  ];

  const maxDocRevenue = Math.max(...docTypeRevenue.map((d) => d.revenue), 1);

  return (
    <StaggerContainer className="space-y-6" staggerDelay={0.1}>
      <FadeUpChild>
        <PageHeader
          title="Revenue"
          subtitle="Document revenue analytics and trends"
        />
      </FadeUpChild>

      <FadeUpChild>
        <PageKpiTickerResponsive cells={kpiCells} />
      </FadeUpChild>

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
                  {rushStats.count} rush orders × $50 fee
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
                          ? "↑"
                          : "↓"
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
                                trend === "↑"
                                  ? "text-[#14b8a6] text-xs"
                                  : "text-[#ef4444] text-xs"
                              }
                            >
                              {trend}
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
                View all →
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
