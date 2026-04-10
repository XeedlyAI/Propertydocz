"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType, RequestStatus, Turnaround } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageKpiTickerResponsive, type KpiCell } from "@/components/shared/PageKpiTicker";
import {
  FadeUp,
  StaggerContainer,
  FadeUpChild,
} from "@/components/shared/PageTransition";
import { TenantHealth } from "@/components/platform/tenant-health";
import { PlatformAlerts } from "@/components/platform/platform-alerts";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ── Helpers ── */

function formatAge(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

/* ── Row border-left accent by status ── */

const STATUS_BORDER_COLOR: Record<RequestStatus, string> = {
  received: "border-l-slate-400",
  paid: "border-l-blue-400",
  awaiting_data: "border-l-amber-400",
  pending_review: "border-l-purple-400",
  ready_for_generation: "border-l-[#38b6ff]",
  approved: "border-l-teal-400",
  delivered: "border-l-green-500",
  cancelled: "border-l-slate-200",
};

/* ── Types ── */

interface TenantRevenue {
  id: string;
  name: string;
  slug: string;
  fee: number;
  revenue: number;
  count: number;
  platformCut: number;
  tenantCut: number;
}

interface RecentRequest {
  id: string;
  created_at: string;
  tenant_id: string;
  association_id: string | null;
  turnaround: Turnaround;
  requester_name: string;
  property_address: string;
  document_types: DocumentType[];
  status: RequestStatus;
  total_price_cents: number;
}

interface TenantHealthItem {
  id: string;
  name: string;
  slug: string;
  requestsThisMonth: number;
  deliveredThisMonth: number;
  avgTurnaroundDays: number | null;
  status: "healthy" | "attention" | "inactive";
}

interface PlatformAlert {
  type: "urgent" | "warning" | "info" | "positive";
  title: string;
  detail: string;
}

interface TriageCounts {
  awaiting_data: number;
  pending_review: number;
  ready_for_generation: number;
  rush: number;
}

interface StatusConfig {
  dotColors: Record<RequestStatus, string>;
  badgeColors: Record<RequestStatus, string>;
  labels: Record<RequestStatus, string>;
}

/* ── Props ── */

interface DashboardClientProps {
  kpiCells: KpiCell[];
  tenantRevenues: TenantRevenue[];
  recentRequests: RecentRequest[];
  tenantNameMap: Record<string, string>;
  associationMap: Record<string, string>;
  triageCounts: TriageCounts;
  tenantHealthItems: TenantHealthItem[];
  platformAlerts: PlatformAlert[];
  statusConfig: StatusConfig;
}

/* ── Component ── */

export function PlatformDashboardClient({
  kpiCells,
  tenantRevenues,
  recentRequests,
  tenantNameMap,
  associationMap,
  triageCounts,
  tenantHealthItems,
  platformAlerts,
  statusConfig,
}: DashboardClientProps) {
  const displayRequests = recentRequests.slice(0, 8);

  return (
    <StaggerContainer className="space-y-6" staggerDelay={0.1}>
      {/* Page Header */}
      <FadeUpChild>
        <PageHeader
          title="Platform Dashboard"
          subtitle="Cross-tenant overview for XeedlyAI"
        />
      </FadeUpChild>

      {/* KPI Ticker */}
      <FadeUpChild>
        <PageKpiTickerResponsive cells={kpiCells} />
      </FadeUpChild>

      {/* Cross-Tenant Triage Strip */}
      <FadeUp>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/platform/tenants"
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
          >
            Awaiting Data
            <span className="inline-flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold font-mono min-w-[20px] h-5 px-1.5">
              {triageCounts.awaiting_data}
            </span>
          </Link>
          <Link
            href="/platform/tenants"
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
          >
            Pending Review
            <span className="inline-flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-xs font-semibold font-mono min-w-[20px] h-5 px-1.5">
              {triageCounts.pending_review}
            </span>
          </Link>
          <Link
            href="/platform/tenants"
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
          >
            Ready to Generate
            <span className="inline-flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 text-xs font-semibold font-mono min-w-[20px] h-5 px-1.5">
              {triageCounts.ready_for_generation}
            </span>
          </Link>
          <Link
            href="/platform/tenants"
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
          >
            Rush
            <span className="inline-flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold font-mono min-w-[20px] h-5 px-1.5">
              {triageCounts.rush}
            </span>
          </Link>
        </div>
      </FadeUp>

      {/* Revenue by Tenant */}
      <FadeUpChild>
        <RevenueByTenantCard tenants={tenantRevenues} />
      </FadeUpChild>

      {/* Health + Alerts Row */}
      <FadeUpChild>
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="dash-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tenant Health</CardTitle>
            </CardHeader>
            <CardContent>
              <TenantHealthClickable tenants={tenantHealthItems} />
            </CardContent>
          </Card>

          <Card className="dash-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Platform Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <PlatformAlerts alerts={platformAlerts} />
            </CardContent>
          </Card>
        </div>
      </FadeUpChild>

      {/* Recent Requests */}
      <FadeUpChild>
        <Card className="dash-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Recent Requests (All Tenants)
              </CardTitle>
              <Link
                href="/platform/revenue"
                className="text-xs text-[#8b5cf6] hover:text-[#7c3aed] transition-colors"
              >
                Revenue details →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {displayRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No requests yet.
              </p>
            ) : (
              <>
                <div className="table-scroll-mobile">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="hidden sm:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Date
                        </th>
                        <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Tenant
                        </th>
                        <th className="hidden lg:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Association
                        </th>
                        <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Requester
                        </th>
                        <th className="hidden md:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Property
                        </th>
                        <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Documents
                        </th>
                        <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Status
                        </th>
                        <th className="hidden sm:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Total
                        </th>
                        <th className="pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRequests.map((req) => {
                        const isRush =
                          req.turnaround === "rush" &&
                          req.status !== "delivered" &&
                          req.status !== "cancelled";
                        const borderClass = isRush
                          ? "border-l-red-500"
                          : STATUS_BORDER_COLOR[req.status] || "border-l-slate-200";

                        return (
                          <tr
                            key={req.id}
                            className={cn(
                              "border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] border-l-[3px]",
                              borderClass
                            )}
                          >
                            <td className="hidden sm:table-cell py-3 pr-4">
                              <div className="text-muted-foreground">
                                {new Date(req.created_at).toLocaleDateString()}
                              </div>
                              <div className="font-mono text-xs text-slate-400">
                                {formatAge(req.created_at)}
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <Link
                                href={`/platform/tenants/${req.tenant_id}`}
                                className="text-xs font-medium text-[#38b6ff] hover:underline transition-colors"
                              >
                                {tenantNameMap[req.tenant_id] || "Unknown"}
                              </Link>
                            </td>
                            <td className="hidden lg:table-cell py-3 pr-4 text-xs text-muted-foreground">
                              {req.association_id && associationMap[req.association_id]
                                ? associationMap[req.association_id]
                                : "\u2014"}
                            </td>
                            <td className="py-3 pr-4 font-medium">
                              {req.requester_name}
                            </td>
                            <td
                              className="hidden md:table-cell py-3 pr-4 max-w-[180px] truncate text-muted-foreground"
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
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                                  statusConfig.badgeColors[req.status] ||
                                    "bg-muted text-muted-foreground"
                                )}
                              >
                                <span
                                  className={cn(
                                    "size-1.5 rounded-full",
                                    statusConfig.dotColors[req.status] ||
                                      "bg-slate-400"
                                  )}
                                />
                                {statusConfig.labels[req.status] || req.status}
                              </span>
                            </td>
                            <td className="hidden sm:table-cell py-3 pr-4 text-right font-mono font-medium">
                              {formatCents(req.total_price_cents)}
                            </td>
                            <td className="py-3">
                              <span className="text-xs text-[#38b6ff] cursor-default">
                                View →
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {recentRequests.length > 8 && (
                  <div className="mt-3 text-center">
                    <Link
                      href="/platform/revenue"
                      className="text-xs text-[#38b6ff] hover:underline transition-colors"
                    >
                      View all {recentRequests.length} requests →
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </FadeUpChild>
    </StaggerContainer>
  );
}

/* ── Tenant Health (Clickable Rows) ── */

const HEALTH_STATUS_CONFIG = {
  healthy: { dot: "bg-[#14b8a6]", label: "Healthy" },
  attention: { dot: "bg-[#f59e0b]", label: "Attention" },
  inactive: { dot: "bg-slate-400", label: "Inactive" },
};

function TenantHealthClickable({ tenants }: { tenants: TenantHealthItem[] }) {
  if (tenants.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No tenants yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tenants.map((t) => {
        const config = HEALTH_STATUS_CONFIG[t.status];
        const completionRate =
          t.requestsThisMonth > 0
            ? Math.round((t.deliveredThisMonth / t.requestsThisMonth) * 100)
            : 0;

        return (
          <Link
            key={t.id}
            href={`/platform/tenants/${t.id}`}
            className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className={cn("size-2 rounded-full shrink-0", config.dot)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{t.name}</p>
                <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                <span className="font-mono">{t.requestsThisMonth}</span>{" "}
                requests
                <span>
                  <span className="font-mono">{completionRate}</span>% delivered
                </span>
                {t.avgTurnaroundDays !== null && (
                  <span>{t.avgTurnaroundDays.toFixed(1)}d avg</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ── Revenue by Tenant (Collapsible) ── */

function RevenueByTenantCard({ tenants }: { tenants: TenantRevenue[] }) {
  const [expandedTenant, setExpandedTenant] = useState<string | null>(
    tenants.length === 1 ? tenants[0].id : null
  );

  return (
    <Card className="dash-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Revenue by Tenant</CardTitle>
          <Link
            href="/platform/revenue"
            className="text-xs text-[#8b5cf6] hover:text-[#7c3aed] transition-colors"
          >
            Full report →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {tenants.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No tenants yet.{" "}
            <Link
              href="/platform/tenants/new"
              className="text-[#8b5cf6] hover:underline"
            >
              Add your first tenant
            </Link>
          </p>
        ) : tenants.length === 1 ? (
          /* Single tenant — show table directly */
          <RevenueTable tenants={tenants} />
        ) : (
          /* Multiple tenants — collapsible groups */
          <div className="space-y-2">
            {tenants.map((t) => {
              const isExpanded = expandedTenant === t.id;
              return (
                <div key={t.id} className="rounded-lg border border-border/50">
                  <button
                    onClick={() =>
                      setExpandedTenant(isExpanded ? null : t.id)
                    }
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {t.name}
                      </span>
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {t.fee}% fee
                      </span>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <span className="font-mono text-sm font-medium">
                        {formatCents(t.revenue)}
                      </span>
                      <span className="font-mono text-sm text-[#8b5cf6]">
                        {formatCents(t.platformCut)}
                      </span>
                      <svg
                        className={cn(
                          "size-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 px-4 py-3">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="font-mono text-lg font-semibold">
                                {t.count}
                              </p>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                Orders
                              </p>
                            </div>
                            <div>
                              <p className="font-mono text-lg font-semibold text-[#8b5cf6]">
                                {formatCents(t.platformCut)}
                              </p>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                Platform Cut
                              </p>
                            </div>
                            <div>
                              <p className="font-mono text-lg font-semibold">
                                {formatCents(t.tenantCut)}
                              </p>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                Tenant Cut
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <Link
                              href={`/platform/tenants/${t.id}`}
                              className="text-xs text-[#8b5cf6] hover:underline"
                            >
                              View tenant details →
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Simple Revenue Table (for single-tenant view) ── */

function RevenueTable({ tenants }: { tenants: TenantRevenue[] }) {
  return (
    <div className="table-scroll-mobile">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tenant
            </th>
            <th className="hidden sm:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
            <th className="hidden sm:table-cell pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tenant Cut
            </th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
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
              <td className="py-3 pr-4 text-right font-mono">{t.count}</td>
              <td className="py-3 pr-4 text-right font-mono font-medium">
                {formatCents(t.revenue)}
              </td>
              <td className="py-3 pr-4 text-right font-mono text-[#8b5cf6]">
                {formatCents(t.platformCut)}
              </td>
              <td className="hidden sm:table-cell py-3 text-right font-mono">
                {formatCents(t.tenantCut)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
