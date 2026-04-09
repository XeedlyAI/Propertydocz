"use client";

import { CreditCard, AlertTriangle, UserX } from "lucide-react";
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

interface Tier {
  name: string;
  price: string;
  priceCents: number;
  subscribers: number;
  packages: number;
  overageDiscount: string;
  mrr: number;
}

interface Subscriber {
  name: string;
  email: string;
  company: string;
  tier: string;
  status: "active" | "cancelled" | "past_due" | "trial";
  packagesUsed: number;
  packagesIncluded: number;
  overageCount: number;
  mrr: number;
  memberSince: string;
}

interface ChurnEntry {
  name: string;
  tier: string;
  cancellationDate: string;
  lifetimeValue: number;
}

interface AtRiskEntry {
  name: string;
  tier: string;
  lastOrderDate: string;
  daysSinceOrder: number;
}

interface SubscriptionsClientProps {
  tiers: Tier[];
  kpis: {
    totalSubscribers: number;
    mrr: number;
    activeSubscriptions: number;
    freeUsers: number;
    paidUsers: number;
    avgRevenuePerSubscriber: number;
  };
  subscribers: Subscriber[];
  recentChurn: ChurnEntry[];
  atRisk: AtRiskEntry[];
}

const STATUS_CONFIG: Record<
  string,
  { dot: string; badge: string; label: string }
> = {
  active: {
    dot: "bg-[#14b8a6]",
    badge: "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    label: "Active",
  },
  past_due: {
    dot: "bg-[#ef4444]",
    badge: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    label: "Past Due",
  },
  cancelled: {
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    label: "Cancelled",
  },
  trial: {
    dot: "bg-[#38b6ff]",
    badge: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    label: "Trial",
  },
};

export function SubscriptionsClient({
  tiers,
  kpis,
  subscribers,
  recentChurn,
  atRisk,
}: SubscriptionsClientProps) {
  const kpiCells: KpiCell[] = [
    {
      value: kpis.totalSubscribers,
      label: "Total Subscribers",
      contextColor: "muted",
    },
    {
      value: kpis.mrr / 100,
      label: "MRR",
      prefix: "$",
      decimals: 2,
      context: kpis.mrr > 0 ? "Monthly recurring" : "Connect Stripe",
      contextColor: kpis.mrr > 0 ? "good" : "attention",
    },
    {
      value: kpis.activeSubscriptions,
      label: "Active Subscriptions",
      context: "Paid tiers",
      contextColor: "info",
    },
    {
      value: kpis.freeUsers,
      label: "Free Tier",
      context: "Pay-per-order",
      contextColor: "muted",
    },
    {
      value: kpis.paidUsers,
      label: "Paid Tiers",
      context: kpis.totalSubscribers > 0
        ? `${Math.round((kpis.paidUsers / Math.max(kpis.totalSubscribers, 1)) * 100)}% conversion`
        : "—",
      contextColor: "info",
    },
    {
      value: kpis.avgRevenuePerSubscriber / 100,
      label: "Avg Rev/Subscriber",
      prefix: "$",
      decimals: 2,
      contextColor: "muted",
    },
  ];

  const hasData = kpis.totalSubscribers > 0;

  return (
    <StaggerContainer className="space-y-6" staggerDelay={0.1}>
      <FadeUpChild>
        <PageHeader
          title="Subscriptions"
          subtitle="Membership tiers, usage, and recurring revenue"
        />
      </FadeUpChild>

      <FadeUpChild>
        <PageKpiTickerResponsive cells={kpiCells} />
      </FadeUpChild>

      {/* Tier Overview Cards */}
      <FadeUpChild>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier) => (
            <Card key={tier.name} className="dash-card">
              <CardContent className="p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {tier.name}
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-foreground">
                  {tier.price}
                </p>
                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subscribers</span>
                    <span className="font-mono font-medium text-foreground">
                      {tier.subscribers}
                    </span>
                  </div>
                  {tier.packages > 0 && (
                    <div className="flex justify-between">
                      <span>Packages/mo</span>
                      <span className="font-mono font-medium text-foreground">
                        {tier.packages}
                      </span>
                    </div>
                  )}
                  {tier.priceCents > 0 && (
                    <div className="flex justify-between">
                      <span>Overage discount</span>
                      <span className="font-mono font-medium text-foreground">
                        {tier.overageDiscount}
                      </span>
                    </div>
                  )}
                  <div className="pt-1.5 mt-1.5 border-t border-border flex justify-between">
                    <span>MRR</span>
                    <span className="font-mono font-medium text-[#38b6ff]">
                      ${(tier.mrr / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </FadeUpChild>

      {/* Subscriber List */}
      <FadeUpChild>
        <Card className="dash-card">
          <CardHeader>
            <CardTitle className="text-base">Subscriber List</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <EmptyState
                icon={CreditCard}
                title="No subscription data yet"
                description="Connect Stripe to sync subscription data. Membership tracking will appear here automatically."
              />
            ) : subscribers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No subscribers to display.
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
                        Tier
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="hidden md:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Usage
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        MRR
                      </th>
                      <th className="hidden lg:table-cell pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Member Since
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub, i) => {
                      const statusConfig = STATUS_CONFIG[sub.status] || STATUS_CONFIG.active;
                      const usagePct =
                        sub.packagesIncluded > 0
                          ? (sub.packagesUsed / sub.packagesIncluded) * 100
                          : 0;
                      const usageColor =
                        usagePct > 100
                          ? "bg-[#ef4444]"
                          : usagePct > 80
                            ? "bg-[#f59e0b]"
                            : "bg-[#38b6ff]";

                      return (
                        <tr
                          key={i}
                          className={`border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] ${
                            sub.status === "past_due"
                              ? "border-l-[3px] border-l-[#ef4444]"
                              : ""
                          }`}
                        >
                          <td className="py-3 pr-4">
                            <p className="font-medium truncate max-w-[180px]">{sub.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {sub.company}
                            </p>
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4">
                            <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {sub.tier}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.badge}`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${statusConfig.dot}`}
                              />
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="hidden md:table-cell py-3 pr-4">
                            {sub.packagesIncluded > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${usageColor}`}
                                    style={{
                                      width: `${Math.min(usagePct, 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground">
                                  {sub.packagesUsed}/{sub.packagesIncluded}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono font-medium">
                            ${(sub.mrr / 100).toFixed(2)}
                          </td>
                          <td className="hidden lg:table-cell py-3 text-right text-muted-foreground">
                            {new Date(sub.memberSince).toLocaleDateString()}
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

      {/* Churn & Health */}
      <FadeUpChild>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Churn */}
          <Card className="dash-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Churn</CardTitle>
            </CardHeader>
            <CardContent>
              {recentChurn.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-[#14b8a6]/20 bg-[#14b8a6]/5 px-4 py-3 text-sm text-[#14b8a6]">
                  No cancellations this month
                </div>
              ) : (
                <div className="space-y-2">
                  {recentChurn.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-l-[3px] border-l-[#ef4444] rounded-r-lg bg-red-50/50 dark:bg-red-900/10 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.tier} • Cancelled{" "}
                          {new Date(entry.cancellationDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-mono text-sm text-muted-foreground">
                        LTV ${(entry.lifetimeValue / 100).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* At-Risk Subscribers */}
          <Card className="dash-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">At-Risk Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              {atRisk.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-[#14b8a6]/20 bg-[#14b8a6]/5 px-4 py-3 text-sm text-[#14b8a6]">
                  {hasData
                    ? "All subscribers are actively ordering"
                    : "No subscription data yet"}
                </div>
              ) : (
                <div className="space-y-2">
                  {atRisk.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-l-[3px] border-l-[#f59e0b] rounded-r-lg bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.tier} • Last order{" "}
                          {new Date(entry.lastOrderDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-[#f59e0b]">
                        {entry.daysSinceOrder}d inactive
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FadeUpChild>
    </StaggerContainer>
  );
}
