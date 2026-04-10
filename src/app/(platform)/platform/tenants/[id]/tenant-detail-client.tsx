"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TenantForm } from "@/components/platform/tenant-form";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  DollarSign,
  FileText,
  Settings,
  Zap,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Wand2,
} from "lucide-react";
import type { DocumentType, RequestStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TenantData {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  platform_fee_percent: number | null;
  logo_url: string | null;
  primary_color: string | null;
  stripe_account_id: string | null;
  dropbox_access_token: string | null;
  created_at: string;
  [key: string]: unknown;
}

interface Admin {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Association {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  total_units: number | null;
  project_type: string | null;
  manager_name: string | null;
  mailing_address: string | null;
  monthly_assessment_amount: number | null;
}

interface Request {
  id: string;
  created_at: string;
  association_id: string | null;
  requester_name: string;
  requester_email: string | null;
  property_address: string;
  document_types: DocumentType[];
  status: string;
  total_price_cents: number;
  payment_status: string;
  turnaround: string | null;
}

interface TenantDetailClientProps {
  tenant: TenantData;
  admins: Admin[];
  associations: Association[];
  requests: Request[];
  govDocCounts: Record<string, number>;
  activeRequestCountsByAssoc: Record<string, number>;
  totalRevenue: number;
  platformCut: number;
  tenantCut: number;
  fee: number;
  paidRequestCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<RequestStatus, string> = {
  received: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  paid: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  awaiting_data:
    "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  ready_for_generation:
    "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  pending_review:
    "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  approved:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  delivered:
    "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  cancelled:
    "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  received: "Received",
  paid: "Paid",
  awaiting_data: "Awaiting Data",
  ready_for_generation: "Ready for Gen",
  pending_review: "Pending Review",
  approved: "Approved",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const BORDER_COLORS: Record<string, string> = {
  awaiting_data: "border-l-amber-400",
  pending_review: "border-l-purple-400",
  ready_for_generation: "border-l-[#38b6ff]",
  delivered: "border-l-green-500",
  cancelled: "border-l-slate-200",
};

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "requests", label: "Request History", icon: FileText },
  { key: "associations", label: "Associations", icon: Building2 },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "integrations", label: "Integrations", icon: Zap },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function computeHealth(
  assoc: Association,
  govDocCount: number
): number {
  let filled = 0;
  if (assoc.manager_name?.trim()) filled++;
  if (assoc.mailing_address?.trim()) filled++;
  if ((assoc.monthly_assessment_amount ?? 0) > 0) filled++;
  if (govDocCount > 0) filled++;
  return Math.round((filled / 4) * 100);
}

function healthColor(pct: number): string {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-400";
  return "bg-red-400";
}

function healthBorderColor(pct: number): string {
  if (pct >= 75) return "border-l-green-500";
  if (pct >= 50) return "border-l-amber-400";
  return "border-l-red-400";
}

function healthStatusLabel(pct: number): {
  label: string;
  color: string;
} {
  if (pct >= 75)
    return {
      label: "Ready",
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    };
  if (pct >= 50)
    return {
      label: "Needs Data",
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    };
  return {
    label: "Incomplete",
    color: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  };
}

function getRowBorderColor(req: Request): string {
  // Rush overrides (if not delivered/cancelled)
  if (
    req.turnaround === "rush" &&
    req.status !== "delivered" &&
    req.status !== "cancelled"
  ) {
    return "border-l-red-500";
  }
  return BORDER_COLORS[req.status] || "border-l-transparent";
}

const ROWS_PER_PAGE = 20;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TenantDetailClient({
  tenant,
  admins,
  associations,
  requests,
  govDocCounts,
  activeRequestCountsByAssoc,
  totalRevenue,
  platformCut,
  tenantCut,
  fee,
  paidRequestCount,
}: TenantDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const hasStripe = !!tenant.stripe_account_id;
  const hasDropbox = !!tenant.dropbox_access_token;

  // Build association lookup
  const assocMap = useMemo(() => {
    const map: Record<string, Association> = {};
    for (const a of associations) map[a.id] = a;
    return map;
  }, [associations]);

  return (
    <div className="space-y-6">
      {/* ---- HEADER ---- */}
      <Link
        href="/platform/tenants"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Tenants
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground font-data">
            {tenant.slug}.propertydocz.com
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {hasStripe ? (
              <CheckCircle2 className="size-4 text-emerald-500" />
            ) : (
              <XCircle className="size-4 text-muted-foreground/40" />
            )}
            <span className="text-xs text-muted-foreground">Stripe</span>
          </div>
          <div className="flex items-center gap-1.5">
            {hasDropbox ? (
              <CheckCircle2 className="size-4 text-emerald-500" />
            ) : (
              <XCircle className="size-4 text-muted-foreground/40" />
            )}
            <span className="text-xs text-muted-foreground">Dropbox</span>
          </div>
        </div>
      </div>

      {/* Continue Onboarding banner — only show if <4/5 steps done AND tenant >24h old, only on overview/settings tabs */}
      {(() => {
        const onboardingSteps = [hasStripe, hasDropbox, associations.length > 0, admins.length > 0, true /* tenant exists */];
        const completedCount = onboardingSteps.filter(Boolean).length;
        const tenantAgeHours = (Date.now() - new Date(tenant.created_at).getTime()) / (1000 * 60 * 60);
        const showBanner = completedCount < 4 && tenantAgeHours > 24 && (activeTab === "overview" || activeTab === "settings");
        return showBanner ? (
          <Link
            href={`/platform/onboard?tenant_id=${tenant.id}`}
            className="flex items-center gap-2 rounded-lg border border-[#38b6ff]/30 bg-[#38b6ff]/5 px-4 py-3 text-sm font-medium text-[#38b6ff] hover:bg-[#38b6ff]/10 transition-colors"
          >
            <Wand2 className="size-4" />
            Continue Onboarding Wizard ({completedCount}/5 complete)
          </Link>
        ) : null;
      })()}

      {/* ---- TABS ---- */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-1 pb-3 pt-1 text-sm transition-colors ${
                  isActive
                    ? "border-[#38b6ff] text-[#38b6ff] font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ---- TAB CONTENT ---- */}
      {activeTab === "overview" && (
        <OverviewTab
          requests={requests}
          associations={associations}
          govDocCounts={govDocCounts}
          activeRequestCountsByAssoc={activeRequestCountsByAssoc}
          assocMap={assocMap}
          totalRevenue={totalRevenue}
          platformCut={platformCut}
          tenantCut={tenantCut}
          fee={fee}
          paidRequestCount={paidRequestCount}
        />
      )}
      {activeTab === "requests" && (
        <RequestHistoryTab
          requests={requests}
          assocMap={assocMap}
        />
      )}
      {activeTab === "associations" && (
        <AssociationsTab
          associations={associations}
          govDocCounts={govDocCounts}
          activeRequestCountsByAssoc={activeRequestCountsByAssoc}
        />
      )}
      {activeTab === "settings" && (
        <SettingsTab
          tenant={tenant}
          admins={admins}
          fee={fee}
        />
      )}
      {activeTab === "integrations" && (
        <IntegrationsTab tenant={tenant} />
      )}
    </div>
  );
}

// ===========================================================================
// TAB 1 — Overview
// ===========================================================================

function OverviewTab({
  requests,
  associations,
  govDocCounts,
  activeRequestCountsByAssoc,
  assocMap,
  totalRevenue,
  platformCut,
  tenantCut,
  fee,
  paidRequestCount,
}: {
  requests: Request[];
  associations: Association[];
  govDocCounts: Record<string, number>;
  activeRequestCountsByAssoc: Record<string, number>;
  assocMap: Record<string, Association>;
  totalRevenue: number;
  platformCut: number;
  tenantCut: number;
  fee: number;
  paidRequestCount: number;
}) {
  // Active requests (not delivered/cancelled)
  const activeRequests = useMemo(
    () =>
      requests.filter(
        (r) => r.status !== "delivered" && r.status !== "cancelled"
      ),
    [requests]
  );

  // Stats calculations
  const stats = useMemo(() => {
    const nonCancelled = requests.filter((r) => r.status !== "cancelled");
    const delivered = requests.filter((r) => r.status === "delivered");
    const deliveryRate =
      nonCancelled.length > 0
        ? Math.round((delivered.length / nonCancelled.length) * 100)
        : 0;

    // Avg turnaround for delivered requests
    let avgTurnaround = 0;
    if (delivered.length > 0) {
      const totalDays = delivered.reduce((sum, r) => {
        const created = new Date(r.created_at);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + diffDays;
      }, 0);
      avgTurnaround = Math.round(totalDays / delivered.length);
    }

    // Requests MTD
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const requestsMTD = requests.filter(
      (r) => new Date(r.created_at) >= monthStart
    ).length;

    return { deliveryRate, avgTurnaround, requestsMTD };
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* Revenue KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dark-accent-card rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              Total Revenue
            </p>
            <DollarSign className="size-4 text-[#38b6ff]" />
          </div>
          <p className="mt-2 font-data text-2xl font-bold text-white">
            {formatCents(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {paidRequestCount} paid requests
          </p>
        </div>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Platform Cut ({fee}%)
              </p>
            </div>
            <p className="mt-2 font-data text-2xl font-bold text-[#38b6ff]">
              {formatCents(platformCut)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tenant Cut ({100 - fee}%)
              </p>
            </div>
            <p className="mt-2 font-data text-2xl font-bold">
              {formatCents(tenantCut)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Associations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="size-4 text-[#38b6ff]" />
              Associations
              <span className="ml-1 inline-flex items-center rounded-full bg-[#38b6ff]/10 px-2 py-0.5 text-xs font-data font-medium text-[#38b6ff]">
                {associations.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {associations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No associations yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Association
                      </th>
                      <th className="pb-2 pr-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Health
                      </th>
                      <th className="pb-2 pr-3 text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                        Active
                      </th>
                      <th className="pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground" />
                    </tr>
                  </thead>
                  <tbody>
                    {associations.map((assoc) => {
                      const health = computeHealth(
                        assoc,
                        govDocCounts[assoc.id] || 0
                      );
                      return (
                        <tr
                          key={assoc.id}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="py-2.5 pr-3 font-medium">
                            {assoc.name}
                          </td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${healthColor(health)}`}
                                  style={{ width: `${health}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground font-data">
                                {health}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-right font-data">
                            {activeRequestCountsByAssoc[assoc.id] || 0}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="text-xs text-[#38b6ff]">
                              View &rarr;
                            </span>
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

        {/* Right: Active Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="size-4 text-[#38b6ff]" />
              Active Requests
              <span className="ml-1 inline-flex items-center rounded-full bg-[#38b6ff]/10 px-2 py-0.5 text-xs font-data font-medium text-[#38b6ff]">
                {activeRequests.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active requests
              </p>
            ) : (
              <div className="space-y-0 divide-y divide-border/50">
                {activeRequests.slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className={`flex items-center gap-3 border-l-[3px] py-2.5 pl-3 ${getRowBorderColor(req)}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          {formatAge(req.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">
                        {req.requester_name}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status as RequestStatus] || "bg-muted text-muted-foreground"}`}
                    >
                      {STATUS_LABELS[req.status as RequestStatus] || req.status}
                    </span>
                    <span className="shrink-0 font-mono text-sm font-medium">
                      {formatCents(req.total_price_cents)}
                    </span>
                    <span className="shrink-0 text-xs text-[#38b6ff]">
                      View →
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compact stats row */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Delivery Rate:
              </span>
              <span className="font-data text-sm font-semibold">
                {stats.deliveryRate}%
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Avg Turnaround:
              </span>
              <span className="font-data text-sm font-semibold">
                {stats.avgTurnaround}d
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Requests MTD:
              </span>
              <span className="font-data text-sm font-semibold">
                {stats.requestsMTD}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===========================================================================
// TAB 2 — Request History
// ===========================================================================

function RequestHistoryTab({
  requests,
  assocMap,
}: {
  requests: Request[];
  assocMap: Record<string, Association>;
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assocFilter, setAssocFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  // Unique associations present in requests
  const requestAssociations = useMemo(() => {
    const ids = new Set<string>();
    for (const r of requests) {
      if (r.association_id && assocMap[r.association_id]) {
        ids.add(r.association_id);
      }
    }
    return Array.from(ids).map((id) => ({
      id,
      name: assocMap[id].name,
    }));
  }, [requests, assocMap]);

  // Filtered requests
  const filtered = useMemo(() => {
    let result = requests;
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (assocFilter !== "all") {
      result = result.filter((r) => r.association_id === assocFilter);
    }
    return result;
  }, [requests, statusFilter, assocFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageRequests = filtered.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE
  );

  // Reset page when filters change
  const handleStatusFilter = (val: string) => {
    setStatusFilter(val);
    setPage(0);
  };
  const handleAssocFilter = (val: string) => {
    setAssocFilter(val);
    setPage(0);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={assocFilter}
          onChange={(e) => handleAssocFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="all">All Associations</option>
          {requestAssociations.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <span className="flex items-center text-xs text-muted-foreground ml-auto">
          {filtered.length} request{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No requests match the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-28">
                      Date
                    </th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-36">
                      Association
                    </th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-40">
                      Requester
                    </th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Property
                    </th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell w-28">
                      Documents
                    </th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-28">
                      Status
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground w-24">
                      Total
                    </th>
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-16">
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRequests.map((req) => (
                    <tr
                      key={req.id}
                      className={`border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50 border-l-[3px] ${getRowBorderColor(req)}`}
                    >
                      <td className="px-3 py-3 w-28">
                        <div className="text-muted-foreground text-sm">
                          {new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                        <div className="font-mono text-xs text-slate-400">
                          {formatAge(req.created_at)}
                        </div>
                      </td>
                      <td className="px-3 py-3 w-36 truncate text-muted-foreground">
                        {req.association_id && assocMap[req.association_id]
                          ? assocMap[req.association_id].name
                          : "—"}
                      </td>
                      <td className="px-3 py-3 w-40">
                        <div className="font-medium truncate">{req.requester_name}</div>
                        {req.requester_email && (
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {req.requester_email}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="block max-w-[160px] truncate text-muted-foreground">
                          {req.property_address}
                        </span>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell w-28">
                        <div className="flex flex-wrap gap-1">
                          {(req.document_types as DocumentType[]).map((dt) => (
                            <span
                              key={dt}
                              className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {DOCUMENT_LABELS[dt]?.split(" ")[0] || dt}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3 w-28">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status as RequestStatus] || "bg-muted text-muted-foreground"}`}
                        >
                          {STATUS_LABELS[req.status as RequestStatus] ||
                            req.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-sm font-medium w-24">
                        {req.total_price_cents ? formatCents(req.total_price_cents) : "—"}
                      </td>
                      <td className="px-3 py-3 w-16">
                        <span className="text-xs text-[#38b6ff]">View →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="size-4" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// TAB 3 — Associations
// ===========================================================================

function AssociationsTab({
  associations,
  govDocCounts,
  activeRequestCountsByAssoc,
}: {
  associations: Association[];
  govDocCounts: Record<string, number>;
  activeRequestCountsByAssoc: Record<string, number>;
}) {
  const PROJECT_TYPE_COLORS: Record<string, string> = {
    condo: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    townhome:
      "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    pud: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    "co-op":
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  if (associations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="mx-auto size-8 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">
            No associations yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Association
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                  Units
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Data Health
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground text-right">
                  Active Requests
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {associations.map((assoc) => {
                const health = computeHealth(
                  assoc,
                  govDocCounts[assoc.id] || 0
                );
                const status = healthStatusLabel(health);
                return (
                  <tr
                    key={assoc.id}
                    className={`border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50 border-l-[3px] ${healthBorderColor(health)}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{assoc.name}</div>
                      {assoc.address && (
                        <div className="text-xs text-muted-foreground">
                          {assoc.address}
                          {assoc.city && `, ${assoc.city}`}
                          {assoc.state && ` ${assoc.state}`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {assoc.project_type ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PROJECT_TYPE_COLORS[assoc.project_type] || "bg-muted text-muted-foreground"}`}
                        >
                          {assoc.project_type}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-data">
                      {assoc.total_units || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${healthColor(health)}`}
                            style={{ width: `${health}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-data">
                          {health}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-data">
                      {activeRequestCountsByAssoc[assoc.id] || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================================================================
// TAB 4 — Settings
// ===========================================================================

function SettingsTab({
  tenant,
  admins,
  fee,
}: {
  tenant: TenantData;
  admins: Admin[];
  fee: number;
}) {
  return (
    <div className="space-y-6">
      {/* TenantForm (company details, revenue split, branding) */}
      <TenantForm tenant={tenant} />

      {/* Admin Users */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admin Users</CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No admin users yet.
            </p>
          ) : (
            <div className="divide-y divide-[#E5E7EB] dark:divide-white/8">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">{admin.full_name}</p>
                    <p className="text-xs text-muted-foreground font-data">
                      {admin.email}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[#38b6ff]/10 px-2 py-0.5 text-[10px] font-medium text-[#38b6ff] capitalize">
                    {admin.role.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===========================================================================
// TAB 5 — Integrations
// ===========================================================================

function IntegrationsTab({ tenant }: { tenant: TenantData }) {
  const hasStripe = !!tenant.stripe_account_id;
  const hasDropbox = !!tenant.dropbox_access_token;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Stripe Connect
            {hasStripe ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="size-3" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="size-3" />
                Not Connected
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasStripe ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Account ID</p>
              <p className="text-sm font-data">{tenant.stripe_account_id}</p>
            </div>
          ) : (
            <Link
              href={`/platform/onboard?tenant_id=${tenant.id}&step=1`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#38b6ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#38b6ff]/90 transition-colors"
            >
              Connect Stripe
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Document Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Document Storage
            {hasDropbox ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="size-3" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="size-3" />
                Not Connected
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasDropbox ? (
            <p className="text-sm text-muted-foreground">
              Dropbox connected
            </p>
          ) : (
            <Link
              href={`/platform/onboard?tenant_id=${tenant.id}&step=2`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#38b6ff] px-4 py-2 text-sm font-medium text-white hover:bg-[#38b6ff]/90 transition-colors"
            >
              Connect Dropbox
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
