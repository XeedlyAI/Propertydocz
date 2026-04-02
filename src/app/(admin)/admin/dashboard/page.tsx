import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType, RequestStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

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

export default async function DashboardPage() {
  const user = await getAdminUser();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("document_requests")
    .select(
      "id, created_at, requester_name, requester_email, property_address, document_types, status, total_price_cents, turnaround, bill_to_closing, payment_status"
    )
    .eq("tenant_id", user.tenantId)
    .order("created_at", { ascending: false });

  const allRequests = requests || [];

  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  const totalRequests = allRequests.length;
  const awaitingData = allRequests.filter(
    (r) => r.status === "awaiting_data"
  ).length;
  const pendingReview = allRequests.filter(
    (r) => r.status === "pending_review"
  ).length;
  const deliveredThisMonth = allRequests.filter(
    (r) => r.status === "delivered" && r.created_at >= startOfMonth
  ).length;
  const revenueThisMonth = allRequests
    .filter(
      (r) => r.payment_status === "paid" && r.created_at >= startOfMonth
    )
    .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

  const recentRequests = allRequests.slice(0, 20);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your document requests
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Revenue — Dark Accent Card */}
        <div className="dark-accent-card rounded-xl p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-white/50">
              Revenue
            </p>
            <DollarSign className="size-4 text-[#38b6ff]" />
          </div>
          <p className="mt-2 font-data text-2xl font-bold text-white">
            {formatCents(revenueThisMonth)}
          </p>
          <p className="mt-1 text-xs text-white/40">This month</p>
        </div>

        {/* Total Requests */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Requests
              </p>
              <FileText className="size-4 text-[#38b6ff]" />
            </div>
            <p className="mt-2 font-data text-2xl font-bold">{totalRequests}</p>
            <p className="mt-1 text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        {/* Awaiting Data */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Awaiting Data
              </p>
              <AlertCircle className="size-4 text-amber-500" />
            </div>
            <p className="mt-2 font-data text-2xl font-bold">{awaitingData}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        {/* Pending Review */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Pending Review
              </p>
              <Clock className="size-4 text-violet-500" />
            </div>
            <p className="mt-2 font-data text-2xl font-bold">
              {pendingReview}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Ready to review</p>
          </CardContent>
        </Card>

        {/* Delivered */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Delivered
              </p>
              <CheckCircle2 className="size-4 text-green-500" />
            </div>
            <p className="mt-2 font-data text-2xl font-bold">
              {deliveredThisMonth}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No document requests yet.
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
                  {recentRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50"
                    >
                      <td className="py-3 pr-4">
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
                      <td className="py-3 pr-4 max-w-[200px] truncate text-muted-foreground">
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
    </div>
  );
}
