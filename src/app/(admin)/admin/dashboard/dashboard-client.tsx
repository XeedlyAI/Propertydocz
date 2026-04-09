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

interface RecentRequest {
  id: string;
  created_at: string;
  requester_name: string;
  property_address: string;
  document_types: DocumentType[];
  status: RequestStatus;
  total_price_cents: number;
  bill_to_closing: boolean;
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
  statusConfig: StatusConfig;
}

export function DashboardClient({
  kpiData,
  pipelineData,
  healthData,
  recentRequests,
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
            {recentRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No document requests yet.
              </p>
            ) : (
              <div className="table-scroll-mobile">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="hidden sm:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Date
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
                      <th className="hidden sm:table-cell pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                      >
                        <td className="hidden sm:table-cell py-3 pr-4">
                          <Link
                            href={`/admin/requests/${req.id}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {new Date(req.created_at).toLocaleDateString()}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/admin/requests/${req.id}`}
                            className="font-medium hover:text-[#38b6ff] transition-colors"
                          >
                            {req.requester_name}
                          </Link>
                        </td>
                        <td
                          className="py-3 pr-4 max-w-[200px] truncate text-muted-foreground"
                          title={req.property_address}
                        >
                          {req.property_address}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {req.document_types.map((dt) => (
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
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.badgeColors[req.status] || "bg-muted text-muted-foreground"}`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${statusConfig.dotColors[req.status] || "bg-slate-400"}`}
                            />
                            {statusConfig.labels[req.status] || req.status}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell py-3 text-right font-mono font-medium">
                          {req.bill_to_closing
                            ? "BTC"
                            : formatCents(req.total_price_cents)}
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
