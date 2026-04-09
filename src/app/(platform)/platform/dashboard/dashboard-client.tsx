"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType, RequestStatus } from "@/lib/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageKpiTickerResponsive, type KpiCell } from "@/components/shared/PageKpiTicker";
import {
  FadeUp,
  StaggerContainer,
  FadeUpChild,
} from "@/components/shared/PageTransition";
import { TenantHealth } from "@/components/platform/tenant-health";
import { PlatformAlerts } from "@/components/platform/platform-alerts";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

interface CronRun {
  id: string;
  job_name: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  records_processed: number | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
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
  tenantHealthItems: TenantHealthItem[];
  platformAlerts: PlatformAlert[];
  cronRuns: CronRun[];
  statusConfig: StatusConfig;
}

/* ── Component ── */

export function PlatformDashboardClient({
  kpiCells,
  tenantRevenues,
  recentRequests,
  tenantNameMap,
  tenantHealthItems,
  platformAlerts,
  cronRuns,
  statusConfig,
}: DashboardClientProps) {
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
              <TenantHealth tenants={tenantHealthItems} />
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
            {recentRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No requests yet.
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
                        Tenant
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
                        <td className="hidden sm:table-cell py-3 pr-4 text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/platform/tenants/${req.tenant_id}`}
                            className="text-xs font-medium hover:text-[#8b5cf6] transition-colors"
                          >
                            {tenantNameMap[req.tenant_id] || "Unknown"}
                          </Link>
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
                        <td className="hidden sm:table-cell py-3 text-right font-mono font-medium">
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
      </FadeUpChild>

      {/* Cron Job History */}
      <FadeUpChild>
        <Card className="dash-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-[#8b5cf6]" />
              Background Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cronRuns.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No cron runs recorded yet.
              </p>
            ) : (
              <div className="table-scroll-mobile">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Job
                      </th>
                      <th className="hidden sm:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Started
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Duration
                      </th>
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="hidden sm:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Records
                      </th>
                      <th className="hidden md:table-cell pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cronRuns.map((run) => {
                      const duration =
                        run.finished_at && run.started_at
                          ? `${((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000).toFixed(1)}s`
                          : "—";
                      const metadata = (run.metadata || {}) as Record<
                        string,
                        unknown
                      >;
                      const detailParts: string[] = [];
                      if (metadata.emails_sent)
                        detailParts.push(`${metadata.emails_sent} emails`);
                      if (metadata.tenants_affected)
                        detailParts.push(
                          `${metadata.tenants_affected} tenants`
                        );
                      if (metadata.expired_accounts)
                        detailParts.push(
                          `${metadata.expired_accounts} expired`
                        );
                      if (metadata.old_cron_runs_deleted)
                        detailParts.push(
                          `${metadata.old_cron_runs_deleted} cleaned`
                        );

                      return (
                        <tr
                          key={run.id}
                          className="border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                        >
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium font-mono">
                              {run.job_name}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4 text-muted-foreground font-mono text-xs">
                            {new Date(run.started_at).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                            {duration}
                          </td>
                          <td className="py-3 pr-4">
                            {run.status === "success" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 text-xs font-medium text-teal-600 dark:text-teal-400">
                                <span className="size-1.5 rounded-full bg-[#14b8a6]" />
                                Success
                              </span>
                            ) : run.status === "error" ? (
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400"
                                title={run.error_message || undefined}
                              >
                                <span className="size-1.5 rounded-full bg-[#ef4444]" />
                                Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                                <Loader2 className="size-3 animate-spin" />
                                Running
                              </span>
                            )}
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4 text-right font-mono text-xs">
                            {run.records_processed ?? 0}
                          </td>
                          <td className="hidden md:table-cell py-3 text-xs text-muted-foreground">
                            {run.error_message ? (
                              <span className="text-[#ef4444]">
                                {run.error_message.slice(0, 60)}
                              </span>
                            ) : (
                              detailParts.join(", ") || "—"
                            )}
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
