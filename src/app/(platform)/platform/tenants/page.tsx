import { createServiceClient } from "@/lib/supabase/server";
import { getPlatformUser } from "@/lib/auth";
import { formatCents } from "@/lib/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Plus,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  PageKpiTickerResponsive,
  type KpiCell,
} from "@/components/shared/PageKpiTicker";
import {
  FadeUp,
  StaggerContainer,
  FadeUpChild,
} from "@/components/shared/PageTransition";

/** Calculate onboarding checklist for a tenant */
function getOnboardingStatus(tenant: {
  id: string;
  stripe_account_id: string | null;
  dropbox_access_token: string | null;
  logo_url: string | null;
  primary_color: string | null;
  adminCount: number;
  associationCount: number;
}) {
  const checks = {
    hasAdmin: tenant.adminCount > 0,
    hasStripe: !!tenant.stripe_account_id,
    hasStorage: !!tenant.dropbox_access_token,
    hasAssociations: tenant.associationCount > 0,
    hasBranding: !!(tenant.logo_url || tenant.primary_color),
  };

  const completed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const isComplete = completed === total;

  return { checks, completed, total, isComplete };
}

/** Calculate tenant health score (0-100)
 * Weights: onboarding 40%, associations 20%, delivery >20% = 20%, Stripe 20%
 * Stripe not connected surfaces as warning badge, not score-killer */
function getTenantHealthScore(tenant: {
  onboardingComplete: boolean;
  hasStripe: boolean;
  hasAssociations: boolean;
  deliveryRate: number; // 0-1
}): number {
  let score = 0;
  if (tenant.onboardingComplete) score += 40;
  if (tenant.hasAssociations) score += 20;
  if (tenant.deliveryRate > 0.2) score += 20;
  if (tenant.hasStripe) score += 20;
  return score;
}

export default async function PlatformTenantsPage() {
  await getPlatformUser();
  const serviceClient = await createServiceClient();

  // All tenants
  const { data: tenants } = await serviceClient
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  // Request counts + revenue per tenant (with status for delivery rate)
  const { data: requests } = await serviceClient
    .from("document_requests")
    .select("tenant_id, total_price_cents, payment_status, status, created_at");

  // Admin counts per tenant
  const { data: profiles } = await serviceClient
    .from("profiles")
    .select("tenant_id")
    .in("role", ["tenant_admin", "tenant_staff"]);

  // Association counts per tenant
  const { data: associations } = await serviceClient
    .from("associations")
    .select("tenant_id");

  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  const tenantStats = new Map<
    string,
    { requestCount: number; revenue: number; deliveredCount: number; requestsMtd: number; revenueMtd: number }
  >();
  for (const req of requests || []) {
    const existing = tenantStats.get(req.tenant_id) || {
      requestCount: 0,
      revenue: 0,
      deliveredCount: 0,
      requestsMtd: 0,
      revenueMtd: 0,
    };
    existing.requestCount++;
    if (req.status === "delivered") existing.deliveredCount++;
    if (req.payment_status === "paid") {
      existing.revenue += req.total_price_cents || 0;
    }
    if (req.created_at >= startOfMonth) {
      existing.requestsMtd++;
      if (req.payment_status === "paid") {
        existing.revenueMtd += req.total_price_cents || 0;
      }
    }
    tenantStats.set(req.tenant_id, existing);
  }

  const adminCounts = new Map<string, number>();
  for (const p of profiles || []) {
    if (p.tenant_id) {
      adminCounts.set(p.tenant_id, (adminCounts.get(p.tenant_id) || 0) + 1);
    }
  }

  const assocCounts = new Map<string, number>();
  for (const a of associations || []) {
    assocCounts.set(a.tenant_id, (assocCounts.get(a.tenant_id) || 0) + 1);
  }

  const allTenants = tenants || [];

  // Compute KPI data
  const totalTenants = allTenants.length;
  let totalPlatformRevenueMtd = 0;
  let totalRequestsMtd = 0;
  for (const t of allTenants) {
    const stats = tenantStats.get(t.id);
    if (stats) {
      const fee = t.platform_fee_percent || 10;
      totalPlatformRevenueMtd += Math.round((stats.revenueMtd * fee) / 100);
      totalRequestsMtd += stats.requestsMtd;
    }
  }

  const kpiCells: KpiCell[] = [
    {
      value: totalTenants,
      label: "Total Tenants",
      context: `${totalTenants} on platform`,
      contextColor: "info" as const,
    },
    {
      value: totalPlatformRevenueMtd / 100,
      label: "Platform Revenue (MTD)",
      prefix: "$",
      decimals: 2,
      context: "Platform cut this month",
      contextColor: "good" as const,
    },
    {
      value: totalRequestsMtd,
      label: "Requests (MTD)",
      context: "Across all tenants",
      contextColor: "info" as const,
    },
  ];

  return (
    <StaggerContainer className="space-y-6" staggerDelay={0.1}>
      <FadeUpChild>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Tenants</h1>
            <p className="text-sm text-muted-foreground">
              Manage HOA management companies on the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/platform/onboard"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition-colors min-h-[44px]"
            >
              <Wand2 className="size-4" />
              Onboard Wizard
            </Link>
            <Link
              href="/platform/tenants/new"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-[#8b5cf6] hover:bg-[#7c3aed] active:bg-[#6d28d9] text-white transition-colors min-h-[44px]"
            >
              <Plus className="size-4" />
              Add Tenant
            </Link>
          </div>
        </div>
      </FadeUpChild>

      {/* KPI Ticker */}
      <FadeUpChild>
        <PageKpiTickerResponsive cells={kpiCells} />
      </FadeUpChild>

      <FadeUp>
        <Card className="dash-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-[#8b5cf6]" />
              All Tenants ({allTenants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allTenants.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No tenants yet"
                description="Add your first management company to get started."
                action={
                  <Link
                    href="/platform/tenants/new"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-[#8b5cf6] hover:bg-[#7c3aed] text-white transition-colors min-h-[44px]"
                  >
                    <Plus className="size-4" />
                    Add Tenant
                  </Link>
                }
              />
            ) : (
              <div className="table-scroll-mobile">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Company
                      </th>
                      <th className="hidden md:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Subdomain
                      </th>
                      <th className="pb-3 pr-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Health
                      </th>
                      <th className="pb-3 pr-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Onboarding
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Requests
                      </th>
                      <th className="hidden sm:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Revenue
                      </th>
                      <th className="hidden lg:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Fee %
                      </th>
                      <th className="hidden lg:table-cell pb-3 pr-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Stripe
                      </th>
                      <th className="hidden lg:table-cell pb-3 pr-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Storage
                      </th>
                      <th className="hidden md:table-cell pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTenants.map((t) => {
                      const stats = tenantStats.get(t.id) || {
                        requestCount: 0,
                        revenue: 0,
                        deliveredCount: 0,
                        requestsMtd: 0,
                        revenueMtd: 0,
                      };
                      const hasStripe = !!t.stripe_account_id;
                      const hasDropbox = !!t.dropbox_access_token;
                      const associationCount = assocCounts.get(t.id) || 0;
                      const onboarding = getOnboardingStatus({
                        ...t,
                        adminCount: adminCounts.get(t.id) || 0,
                        associationCount,
                      });

                      const deliveryRate =
                        stats.requestCount > 0
                          ? stats.deliveredCount / stats.requestCount
                          : 0;

                      const healthScore = getTenantHealthScore({
                        onboardingComplete: onboarding.isComplete,
                        hasStripe,
                        hasAssociations: associationCount > 0,
                        deliveryRate,
                      });

                      const healthColor =
                        healthScore >= 80
                          ? "bg-green-500"
                          : healthScore >= 50
                            ? "bg-amber-400"
                            : "bg-red-500";

                      const healthTrackColor =
                        healthScore >= 80
                          ? "bg-green-100 dark:bg-green-900/30"
                          : healthScore >= 50
                            ? "bg-amber-100 dark:bg-amber-900/30"
                            : "bg-red-100 dark:bg-red-900/30";

                      return (
                        <tr
                          key={t.id}
                          className="border-b border-border/50 last:border-0 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 group"
                        >
                          <td className="py-3 pr-4">
                            <Link
                              href={`/platform/tenants/${t.id}`}
                              className="font-medium group-hover:text-[#8b5cf6] transition-colors"
                            >
                              {t.name}
                            </Link>
                            {t.contact_email && (
                              <p className="text-xs text-muted-foreground">
                                {t.contact_email}
                              </p>
                            )}
                          </td>
                          <td className="hidden md:table-cell py-3 pr-4">
                            <span className="font-mono text-xs text-muted-foreground">
                              {t.slug}.propertydocz.com
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2 justify-center">
                              <div className={`h-1.5 w-12 rounded-full ${healthTrackColor}`}>
                                <div
                                  className={`h-full rounded-full ${healthColor} transition-all`}
                                  style={{ width: `${healthScore}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs text-muted-foreground">
                                {healthScore}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            {onboarding.isComplete ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                                <span className="size-1.5 rounded-full bg-[#14b8a6]" />
                                Complete
                              </span>
                            ) : (
                              <Link
                                href={`/platform/tenants/${t.id}`}
                                className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                                title={`${onboarding.completed}/${onboarding.total} steps complete`}
                              >
                                <span className="size-1.5 rounded-full bg-[#f59e0b]" />
                                {onboarding.completed}/{onboarding.total}
                              </Link>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono">
                            {stats.requestCount}
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4 text-right font-mono font-medium">
                            {formatCents(stats.revenue)}
                          </td>
                          <td className="hidden lg:table-cell py-3 pr-4 text-right font-mono">
                            {t.platform_fee_percent ?? 10}%
                          </td>
                          <td className="hidden lg:table-cell py-3 pr-4 text-center">
                            {hasStripe ? (
                              <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                                Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                                Not connected
                              </span>
                            )}
                          </td>
                          <td className="hidden lg:table-cell py-3 pr-4 text-center">
                            {hasDropbox ? (
                              <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                                Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                                Not connected
                              </span>
                            )}
                          </td>
                          <td className="hidden md:table-cell py-3 text-muted-foreground text-xs">
                            {new Date(t.created_at).toLocaleDateString()}
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
      </FadeUp>
    </StaggerContainer>
  );
}
