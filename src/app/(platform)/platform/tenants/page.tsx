import { createServiceClient } from "@/lib/supabase/server";
import { getPlatformUser } from "@/lib/auth";
import { formatCents } from "@/lib/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Plus,
  CheckCircle2,
  XCircle,
  Wand2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

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

export default async function PlatformTenantsPage() {
  await getPlatformUser();
  const serviceClient = await createServiceClient();

  // All tenants
  const { data: tenants } = await serviceClient
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });

  // Request counts + revenue per tenant
  const { data: requests } = await serviceClient
    .from("document_requests")
    .select("tenant_id, total_price_cents, payment_status");

  // Admin counts per tenant
  const { data: profiles } = await serviceClient
    .from("profiles")
    .select("tenant_id")
    .in("role", ["tenant_admin", "tenant_staff"]);

  // Association counts per tenant
  const { data: associations } = await serviceClient
    .from("associations")
    .select("tenant_id");

  const tenantStats = new Map<
    string,
    { requestCount: number; revenue: number }
  >();
  for (const req of requests || []) {
    const existing = tenantStats.get(req.tenant_id) || {
      requestCount: 0,
      revenue: 0,
    };
    existing.requestCount++;
    if (req.payment_status === "paid") {
      existing.revenue += req.total_price_cents || 0;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Manage HOA management companies on the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/platform/onboard"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-[#38b6ff] text-[#38b6ff] hover:bg-[#38b6ff]/10 transition-colors"
          >
            <Wand2 className="size-4" />
            Onboard Wizard
          </Link>
          <Link
            href="/platform/tenants/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-[#38b6ff] hover:bg-[#1DA8F0] active:bg-[#0A8FD4] text-white transition-colors"
          >
            <Plus className="size-4" />
            Add Tenant
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-[#38b6ff]" />
            All Tenants ({allTenants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allTenants.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No tenants yet. Add your first management company.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Company
                    </th>
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Subdomain
                    </th>
                    <th className="pb-3 pr-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Onboarding
                    </th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Requests
                    </th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Revenue
                    </th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Fee %
                    </th>
                    <th className="pb-3 pr-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Stripe
                    </th>
                    <th className="pb-3 pr-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Storage
                    </th>
                    <th className="pb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allTenants.map((t) => {
                    const stats = tenantStats.get(t.id) || {
                      requestCount: 0,
                      revenue: 0,
                    };
                    const hasStripe = !!t.stripe_account_id;
                    const hasDropbox = !!t.dropbox_access_token;
                    const onboarding = getOnboardingStatus({
                      ...t,
                      adminCount: adminCounts.get(t.id) || 0,
                      associationCount: assocCounts.get(t.id) || 0,
                    });

                    return (
                      <tr
                        key={t.id}
                        className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/platform/tenants/${t.id}`}
                            className="font-medium hover:text-[#38b6ff] transition-colors"
                          >
                            {t.name}
                          </Link>
                          {t.contact_email && (
                            <p className="text-xs text-muted-foreground">
                              {t.contact_email}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-data text-xs text-muted-foreground">
                            {t.slug}.propertydocz.com
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {onboarding.isComplete ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3" />
                              Complete
                            </span>
                          ) : (
                            <Link
                              href={`/platform/tenants/${t.id}`}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
                              title={`${onboarding.completed}/${onboarding.total} steps complete`}
                            >
                              <AlertCircle className="size-3" />
                              {onboarding.completed}/{onboarding.total}
                            </Link>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right font-data">
                          {stats.requestCount}
                        </td>
                        <td className="py-3 pr-4 text-right font-data font-medium">
                          {formatCents(stats.revenue)}
                        </td>
                        <td className="py-3 pr-4 text-right font-data">
                          {t.platform_fee_percent ?? 15}%
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {hasStripe ? (
                            <CheckCircle2 className="mx-auto size-4 text-emerald-500" />
                          ) : (
                            <XCircle className="mx-auto size-4 text-muted-foreground/40" />
                          )}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {hasDropbox ? (
                            <CheckCircle2 className="mx-auto size-4 text-emerald-500" />
                          ) : (
                            <XCircle className="mx-auto size-4 text-muted-foreground/40" />
                          )}
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">
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
    </div>
  );
}
