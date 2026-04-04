import { createServiceClient } from "@/lib/supabase/server";
import { getPlatformUser } from "@/lib/auth";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import { notFound } from "next/navigation";
import { TenantForm } from "@/components/platform/tenant-form";
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
  Wand2,
} from "lucide-react";
import Link from "next/link";
import type { DocumentType, RequestStatus } from "@/lib/types";

const STATUS_COLORS: Record<RequestStatus, string> = {
  received: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  paid: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  awaiting_data: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  ready_for_generation: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  pending_review: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  approved: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  delivered: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
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

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getPlatformUser();

  const serviceClient = await createServiceClient();

  // Tenant
  const { data: tenant, error } = await serviceClient
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !tenant) {
    notFound();
  }

  // Associations
  const { data: associations } = await serviceClient
    .from("associations")
    .select("id, name, address, city, state, total_units")
    .eq("tenant_id", id)
    .order("name");

  // Requests
  const { data: requests } = await serviceClient
    .from("document_requests")
    .select(
      "id, created_at, requester_name, property_address, document_types, status, total_price_cents, payment_status"
    )
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  // Admin users
  const { data: admins } = await serviceClient
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("tenant_id", id)
    .order("role");

  // Revenue
  const allReqs = requests || [];
  const paidReqs = allReqs.filter((r) => r.payment_status === "paid");
  const totalRevenue = paidReqs.reduce(
    (sum, r) => sum + (r.total_price_cents || 0),
    0
  );
  const fee = tenant.platform_fee_percent || 15;
  const platformCut = Math.round((totalRevenue * fee) / 100);
  const tenantCut = totalRevenue - platformCut;

  const hasStripe = !!tenant.stripe_account_id;
  const hasDropbox = !!tenant.dropbox_access_token;

  return (
    <div className="space-y-6">
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

      {/* Revenue Summary Cards */}
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
            {paidReqs.length} paid requests
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

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Edit form */}
        <div>
          <TenantForm tenant={tenant} />
        </div>

        {/* Right: Info panels */}
        <div className="space-y-4">
          {/* Admin Users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admin Users</CardTitle>
            </CardHeader>
            <CardContent>
              {(admins || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No admin users yet.
                </p>
              ) : (
                <div className="divide-y divide-[#E5E7EB] dark:divide-white/8">
                  {(admins || []).map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {admin.full_name}
                        </p>
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

          {/* Associations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4 text-[#38b6ff]" />
                Associations ({(associations || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(associations || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No associations yet.
                </p>
              ) : (
                <div className="divide-y divide-[#E5E7EB] dark:divide-white/8">
                  {(associations || []).map((assoc) => (
                    <div
                      key={assoc.id}
                      className="py-2.5 first:pt-0 last:pb-0"
                    >
                      <p className="text-sm font-medium">{assoc.name}</p>
                      {assoc.address && (
                        <p className="text-xs text-muted-foreground">
                          {assoc.address}
                          {assoc.city && `, ${assoc.city}`}
                          {assoc.state && ` ${assoc.state}`}
                        </p>
                      )}
                      {assoc.total_units && (
                        <p className="text-xs text-muted-foreground font-data">
                          {assoc.total_units} units
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Stripe Connect</span>
                {hasStripe ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    Connected
                  </span>
                ) : (
                  <Link
                    href={`/platform/onboard?tenant_id=${tenant.id}&step=1`}
                    className="text-xs font-medium text-[#38b6ff] hover:underline"
                  >
                    Connect Stripe →
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Document Storage</span>
                {hasDropbox ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    Connected
                  </span>
                ) : (
                  <Link
                    href={`/platform/onboard?tenant_id=${tenant.id}&step=2`}
                    className="text-xs font-medium text-[#38b6ff] hover:underline"
                  >
                    Connect Storage →
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Continue Onboarding */}
          {(!hasStripe || !hasDropbox || (associations || []).length === 0 || (admins || []).length === 0) && (
            <Link
              href={`/platform/onboard?tenant_id=${tenant.id}`}
              className="flex items-center gap-2 rounded-lg border border-[#38b6ff]/30 bg-[#38b6ff]/5 px-4 py-3 text-sm font-medium text-[#38b6ff] hover:bg-[#38b6ff]/10 transition-colors"
            >
              <Wand2 className="size-4" />
              Continue Onboarding Wizard
            </Link>
          )}
        </div>
      </div>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4 text-[#38b6ff]" />
            Request History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allReqs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No requests yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allReqs.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        {req.requester_name}
                      </td>
                      <td className="py-3 pr-4 max-w-[180px] truncate text-muted-foreground">
                        {req.property_address}
                      </td>
                      <td className="py-3 pr-4">
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
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status as RequestStatus] || "bg-muted text-muted-foreground"}`}
                        >
                          {STATUS_LABELS[req.status as RequestStatus] ||
                            req.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-data font-medium">
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
    </div>
  );
}
