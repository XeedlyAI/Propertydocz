"use client";

import { useState } from "react";
import { Landmark, Search } from "lucide-react";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCents } from "@/lib/pricing";

interface LenderRow {
  name: string;
  email: string;
  company: string;
  totalOrders: number;
  lenderQuestionnaires: number;
  revenue: number;
  lastOrderDate: string;
}

interface LendersClientProps {
  lenders: LenderRow[];
  kpis: {
    totalLenders: number;
    activeLenders: number;
    lqThisMonth: number;
    avgTurnaround: number;
    revenueFromLenders: number;
    newThisMonth: number;
  };
}

export function LendersClient({ lenders, kpis }: LendersClientProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"orders" | "revenue" | "lastOrder" | "name">("orders");

  const filtered = lenders
    .filter((l) => {
      const q = search.toLowerCase();
      if (
        q &&
        !l.name.toLowerCase().includes(q) &&
        !l.email.toLowerCase().includes(q) &&
        !l.company.toLowerCase().includes(q)
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return b.revenue - a.revenue;
        case "lastOrder":
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.totalOrders - a.totalOrders;
      }
    });

  const kpiCells: KpiCell[] = [
    {
      value: kpis.totalLenders,
      label: "Total Lenders",
      context: "All time",
      contextColor: "muted",
    },
    {
      value: kpis.activeLenders,
      label: "Active (30d)",
      context:
        kpis.totalLenders > 0
          ? `${Math.round((kpis.activeLenders / kpis.totalLenders) * 100)}% of total`
          : "—",
      contextColor: "good",
    },
    {
      value: kpis.lqThisMonth,
      label: "Lender Q's (MTD)",
      context: "This month",
      contextColor: "info",
    },
    {
      value: kpis.revenueFromLenders / 100,
      label: "Revenue from Lenders",
      prefix: "$",
      decimals: 2,
      contextColor: "muted",
    },
    {
      value: kpis.newThisMonth,
      label: "New This Month",
      context: kpis.newThisMonth > 0 ? "Growing" : "—",
      contextColor: kpis.newThisMonth > 0 ? "good" : "muted",
    },
  ];

  return (
    <StaggerContainer className="space-y-6" staggerDelay={0.1}>
      <FadeUpChild>
        <PageHeader
          title="Lenders"
          subtitle="Lender contacts who order lender questionnaires"
        />
      </FadeUpChild>

      <FadeUpChild>
        <PageKpiTickerResponsive cells={kpiCells} />
      </FadeUpChild>

      <FadeUpChild>
        <Card className="dash-card">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Lender Directory</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search lenders..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-full sm:w-52 rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#38b6ff]/30"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38b6ff]/30"
                >
                  <option value="orders">Sort: Orders</option>
                  <option value="revenue">Sort: Revenue</option>
                  <option value="lastOrder">Sort: Recent</option>
                  <option value="name">Sort: Name</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {lenders.length === 0 ? (
              <EmptyState
                icon={Landmark}
                title="No lender data yet"
                description="Lender profiles are automatically created when lender questionnaires are ordered."
              />
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No lenders match your search.
              </p>
            ) : (
              <div className="table-scroll-mobile">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
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
                        Lender Q&apos;s
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
                    {filtered.map((lender, i) => {
                      const daysSinceOrder = Math.round(
                        (Date.now() - new Date(lender.lastOrderDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      const isInactive = daysSinceOrder > 60;

                      return (
                        <tr
                          key={lender.email || i}
                          className="border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-2 rounded-full shrink-0 ${
                                  isInactive ? "bg-gray-300" : "bg-[#14b8a6]"
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-[180px]" title={lender.name}>
                                  {lender.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[180px] md:hidden" title={lender.email}>
                                  {lender.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4 text-muted-foreground truncate max-w-[150px]" title={lender.company}>
                            {lender.company}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono font-medium">
                            {lender.totalOrders}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono font-medium text-[#38b6ff]">
                            {lender.lenderQuestionnaires}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono font-medium">
                            {formatCents(lender.revenue)}
                          </td>
                          <td className="hidden sm:table-cell py-3 text-right text-muted-foreground">
                            {new Date(lender.lastOrderDate).toLocaleDateString()}
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
      </FadeUpChild>
    </StaggerContainer>
  );
}
