import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType, RequestStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle2, DollarSign } from "lucide-react";
import Link from "next/link";

const STATUS_VARIANTS: Record<
  RequestStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  received: "outline",
  paid: "secondary",
  awaiting_data: "default",
  ready_for_generation: "secondary",
  pending_review: "default",
  approved: "secondary",
  delivered: "secondary",
  cancelled: "destructive",
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

  // Get all requests for this tenant
  const { data: requests } = await supabase
    .from("document_requests")
    .select("id, created_at, requester_name, requester_email, property_address, document_types, status, total_price_cents, turnaround, bill_to_closing, payment_status")
    .eq("tenant_id", user.tenantId)
    .order("created_at", { ascending: false });

  const allRequests = requests || [];

  // Calculate stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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
      (r) =>
        r.payment_status === "paid" &&
        r.created_at >= startOfMonth
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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting Data
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{awaitingData}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <Clock className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered (Month)
            </CardTitle>
            <CheckCircle2 className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Revenue This Month
          </CardTitle>
          <DollarSign className="size-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCents(revenueThisMonth)}</div>
        </CardContent>
      </Card>

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
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Requester
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Property
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Documents
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => (
                    <tr key={req.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/requests/${req.id}`}
                          className="hover:underline"
                        >
                          {new Date(req.created_at).toLocaleDateString()}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/requests/${req.id}`}
                          className="hover:underline"
                        >
                          {req.requester_name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 max-w-[200px] truncate">
                        {req.property_address}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {(req.document_types as DocumentType[]).map((dt) => (
                            <Badge key={dt} variant="outline" className="text-xs">
                              {DOCUMENT_LABELS[dt]?.split(" ")[0] || dt}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={
                            STATUS_VARIANTS[req.status as RequestStatus] ||
                            "outline"
                          }
                        >
                          {STATUS_LABELS[req.status as RequestStatus] ||
                            req.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-medium">
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
