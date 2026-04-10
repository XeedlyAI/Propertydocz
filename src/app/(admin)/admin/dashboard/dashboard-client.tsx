"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOCUMENT_LABELS, formatCents } from "@/lib/pricing";
import type { DocumentType, RequestStatus } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageKpiTickerResponsive, type KpiCell } from "@/components/shared/PageKpiTicker";
import {
  FadeUp,
  StaggerContainer,
  FadeUpChild,
} from "@/components/shared/PageTransition";
import { AiAdvisory } from "@/components/admin/ai-advisory";
import { RequestPipeline } from "@/components/admin/request-pipeline";
import { PlatformHealth } from "@/components/admin/platform-health";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentRequest {
  id: string;
  created_at: string;
  requester_name: string;
  property_address: string;
  document_types: DocumentType[];
  status: RequestStatus;
  total_price_cents: number;
  bill_to_closing: boolean;
  turnaround: string;
}

interface AssociationHealthItem {
  id: string;
  name: string;
  health: number;
  activeRequests: number;
}

interface StatusConfig {
  dotColors: Record<RequestStatus, string>;
  badgeColors: Record<RequestStatus, string>;
  labels: Record<RequestStatus, string>;
}

interface DashboardClientProps {
  kpiData: {
    revenueThisMonth: number;
    totalRequests: number;
    awaitingData: number;
    pendingReview: number;
    readyForGen: number;
    deliveredThisMonth: number;
  };
  pipelineData: {
    received: number;
    awaitingData: number;
    pendingReview: number;
    readyForGen: number;
    delivered: number;
  };
  healthData: {
    revenueThisMonth: number;
    revenueLastMonth: number;
    avgTurnaroundDays: number | null;
    deliveredCount: number;
    totalCount: number;
  };
  recentRequests: RecentRequest[];
  associationHealth: AssociationHealthItem[];
  statusConfig: StatusConfig;
}

/* ── Helper functions ── */

const ROW_BORDER_COLORS: Record<string, string> = {
  awaiting_data: "border-l-amber-400",
  pending_review: "border-l-purple-400",
  ready_for_generation: "border-l-[#38b6ff]",
  delivered: "border-l-green-500",
  cancelled: "border-l-slate-200",
};

function getRowBorderClass(req: RecentRequest): string {
  if (
    req.turnaround === "rush" &&
    req.status !== "delivered" &&
    req.status !== "cancelled"
  ) {
    return "border-l-red-500";
  }
  return ROW_BORDER_COLORS[req.status] || "border-l-transparent";
}

function getActionButton(status: RequestStatus) {
  switch (status) {
    case "awaiting_data":
      return {
        label: "Send Reminder",
        className:
          "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
      };
    case "pending_review":
      return {
        label: "Review",
        className:
          "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
      };
    case "ready_for_generation":
      return {
        label: "Generate",
        className:
          "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
      };
    default:
      return {
        label: "View",
        className:
          "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
      };
  }
}

function formatAge(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays >= 30) return `${Math.floor(diffDays / 30)}mo`;
  if (diffDays >= 7) return `${Math.floor(diffDays / 7)}w`;
  if (diffDays >= 1) return `${diffDays}d`;
  if (diffHours >= 1) return `${diffHours}h`;
  return "<1h";
}

export function DashboardClient({
  kpiData,
  pipelineData,
  healthData,
  recentRequests,
  associationHealth,
  statusConfig,
}: DashboardClientProps) {
  const kpiCells: KpiCell[] = [
    {
      value: kpiData.revenueThisMonth / 100,
      label: "Revenue (MTD)",
      prefix: "$",
      decimals: 2,
      context: `$${(kpiData.revenueThisMonth / 100).toLocaleString()} this month`,
      contextColor: "muted",
    },
    {
      value: kpiData.totalRequests,
      label: "Total Requests",
      context: "All time",
      contextColor: "muted",
    },
    {
      value: kpiData.awaitingData,
      label: "Awaiting Data",
      context: "Need attention",
      contextColor: "attention",
      href: "/admin/requests?status=awaiting_data",
    },
    {
      value: kpiData.pendingReview,
      label: "Pending Review",
      context: "Ready to review",
      contextColor: "attention",
      href: "/admin/requests?status=pending_review",
    },
    {
      value: kpiData.readyForGen,
      label: "Ready for Gen",
      context: "Pending",
      contextColor: "info",
      href: "/admin/requests?status=ready_for_generation",
    },
    {
      value: kpiData.deliveredThisMonth,
      label: "Delivered",
      context: "This month",
      contextColor: "good",
    },
  ];

  const pipelineStages = [
    { label: "Received", count: pipelineData.received, color: "slate" },
    { label: "Awaiting Data", count: pipelineData.awaitingData, color: "amber" },
    { label: "Pending Review", count: pipelineData.pendingReview, color: "violet" },
    { label: "Ready for Gen", count: pipelineData.readyForGen, color: "sky" },
    { label: "Delivered", count: pipelineData.delivered, color: "teal" },
  ];

  // Triage counts
  const rushCount = recentRequests.filter(
    (r) =>
      r.turnaround === "rush" &&
      r.status !== "delivered" &&
      r.status !== "cancelled"
  ).length;

  const triagePills = [
    {
      label: "Awaiting Data",
      count: kpiData.awaitingData,
      href: "/admin/requests?status=awaiting_data",
    },
    {
      label: "Pending Review",
      count: kpiData.pendingReview,
      href: "/admin/requests?status=pending_review",
    },
    {
      label: "Ready to Generate",
      count: kpiData.readyForGen,
      href: "/admin/requests?status=ready_for_generation",
    },
    {
      label: "Rush",
      count: rushCount,
      href: "/admin/requests",
    },
  ];

  // Association health summary
  const assocNeedingAttention = associationHealth.filter(
    (a) => a.health < 80
  ).length;

  // Show only 5 most recent requests
  const displayRequests = recentRequests.slice(0, 5);

  return (
    <StaggerContainer className="space-y-6" staggerDelay={0.1}>
      {/* Page Header */}
      <FadeUpChild>
        <PageHeader
          title="Dashboard"
          subtitle="Overview of your document requests"
        />
      </FadeUpChild>

      {/* KPI Ticker */}
      <FadeUpChild>
        <PageKpiTickerResponsive cells={kpiCells} />
      </FadeUpChild>

      {/* Needs Attention Triage Strip */}
      <FadeUpChild>
        <div className="flex flex-wrap gap-2">
          {triagePills.map((pill) => (
            <Link
              key={pill.label}
              href={pill.href}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {pill.label}
              <span className="inline-flex items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-semibold min-w-[20px] text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {pill.count}
              </span>
            </Link>
          ))}
        </div>
      </FadeUpChild>

      {/* AI Assistant */}
      <FadeUpChild>
        <AiAdvisory />
      </FadeUpChild>

      {/* Charts Row */}
      <FadeUpChild>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Request Pipeline */}
          <Card className="dash-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestPipeline stages={pipelineStages} />
            </CardContent>
          </Card>

          {/* Platform Health */}
          <Card className="dash-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Platform Health</CardTitle>
            </CardHeader>
            <CardContent>
              <PlatformHealth {...healthData} />
            </CardContent>
          </Card>
        </div>
      </FadeUpChild>

      {/* Association Health Panel */}
      {associationHealth.length > 0 && (
        <FadeUpChild>
          <Card className="rounded-xl border border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Association Health</CardTitle>
                <Link
                  href="/admin/associations"
                  className="text-xs text-[#38b6ff] hover:text-[#1DA8F0] transition-colors"
                >
                  View all →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {associationHealth.map((assoc) => {
                  const barColor =
                    assoc.health >= 80
                      ? "bg-green-500"
                      : assoc.health >= 50
                        ? "bg-amber-500"
                        : "bg-red-500";
                  return (
                    <div
                      key={assoc.id}
                      className="flex items-center gap-3"
                    >
                      <span className="text-sm font-semibold truncate min-w-0 flex-1 max-w-[200px]">
                        {assoc.name}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 min-w-[80px]">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            barColor
                          )}
                          style={{ width: `${assoc.health}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground w-10 text-right shrink-0">
                        {assoc.health}%
                      </span>
                      {assoc.activeRequests > 0 && (
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 text-xs font-medium shrink-0">
                          {assoc.activeRequests}
                        </span>
                      )}
                      <Link
                        href={`/admin/associations/${assoc.id}`}
                        className="text-sm text-[#38b6ff] hover:text-[#1DA8F0] transition-colors shrink-0"
                      >
                        View →
                      </Link>
                    </div>
                  );
                })}
              </div>
              {/* Summary line */}
              <div className="mt-4 pt-3 border-t border-border/50">
                {assocNeedingAttention === 0 ? (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    All associations ready
                  </p>
                ) : (
                  <Link
                    href="/admin/associations"
                    className="text-sm text-amber-600 dark:text-amber-400 font-medium hover:underline"
                  >
                    {assocNeedingAttention} association{assocNeedingAttention !== 1 ? "s" : ""} need{assocNeedingAttention === 1 ? "s" : ""} attention
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeUpChild>
      )}

      {/* Recent Requests Table */}
      <FadeUpChild>
        <Card className="dash-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Requests</CardTitle>
              <Link
                href="/admin/requests"
                className="text-xs text-brand-400 hover:text-brand-500 transition-colors"
              >
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {displayRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No document requests yet.
              </p>
            ) : (
              <div className="table-scroll-mobile">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground w-24">
                        Date
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Requester
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Property
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="hidden sm:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Total
                      </th>
                      <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground w-28">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayRequests.map((req) => {
                      const action = getActionButton(req.status);
                      return (
                        <tr
                          key={req.id}
                          className={cn(
                            "border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] border-l-[3px]",
                            getRowBorderClass(req)
                          )}
                        >
                          <td className="py-3 pr-4 w-24">
                            <Link
                              href={`/admin/requests/${req.id}`}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <div className="text-sm">
                                {new Date(req.created_at).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </div>
                              <div className="font-mono text-xs text-slate-400">
                                {formatAge(req.created_at)}
                              </div>
                            </Link>
                          </td>
                          <td className="py-3 pr-4">
                            <Link
                              href={`/admin/requests/${req.id}`}
                              className="font-semibold hover:text-[#38b6ff] transition-colors"
                            >
                              {req.requester_name}
                            </Link>
                            <div className="font-mono text-xs text-slate-400">
                              #{req.id.slice(0, 8)}
                            </div>
                          </td>
                          <td
                            className="py-3 pr-4 max-w-[200px] truncate text-muted-foreground"
                            title={req.property_address}
                          >
                            {req.property_address}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.badgeColors[req.status] || "bg-muted text-muted-foreground"}`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${statusConfig.dotColors[req.status] || "bg-slate-400"}`}
                              />
                              {statusConfig.labels[req.status] || req.status}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4 text-right font-mono font-medium">
                            {req.bill_to_closing
                              ? "BTC"
                              : formatCents(req.total_price_cents)}
                          </td>
                          <td className="py-3 text-right w-28">
                            <Link
                              href={`/admin/requests/${req.id}`}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                action.className
                              )}
                            >
                              {action.label}
                              <ChevronRight className="size-3" />
                            </Link>
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
