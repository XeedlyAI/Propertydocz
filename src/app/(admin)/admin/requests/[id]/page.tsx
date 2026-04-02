import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType, RequestStatus } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Building2,
  FileText,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { LiveDataForm } from "@/components/admin/live-data-form";
import { StatusActions } from "@/components/admin/status-actions";
import { GenerateDocumentsButton } from "@/components/admin/generate-documents-button";
import { GeneratedDocumentsCard } from "@/components/admin/generated-documents-card";

const WORKFLOW_STAGES: { key: RequestStatus; label: string }[] = [
  { key: "received", label: "Received" },
  { key: "paid", label: "Paid" },
  { key: "awaiting_data", label: "Awaiting Data" },
  { key: "ready_for_generation", label: "Ready" },
  { key: "pending_review", label: "Review" },
  { key: "approved", label: "Approved" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_LABELS: Record<RequestStatus, string> = {
  received: "Received",
  paid: "Paid",
  awaiting_data: "Awaiting Data",
  ready_for_generation: "Ready for Generation",
  pending_review: "Pending Review",
  approved: "Approved",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUser();
  const supabase = await createClient();

  const { data: request, error } = await supabase
    .from("document_requests")
    .select(
      `*, associations(name, legal_name, address, city, state, zip)`
    )
    .eq("id", id)
    .eq("tenant_id", user.tenantId)
    .single();

  if (error || !request) {
    notFound();
  }

  const currentStageIndex = WORKFLOW_STAGES.findIndex(
    (s) => s.key === request.status
  );
  const isCancelled = request.status === "cancelled";

  const association = Array.isArray(request.associations)
    ? request.associations[0]
    : request.associations;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/requests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Requests
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Request #{id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {new Date(request.created_at).toLocaleString()}
          </p>
        </div>
        <Badge
          variant={isCancelled ? "destructive" : "default"}
          className="text-sm"
        >
          {STATUS_LABELS[request.status as RequestStatus] || request.status}
        </Badge>
      </div>

      {/* Workflow Indicator */}
      {!isCancelled && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-1 overflow-x-auto">
              {WORKFLOW_STAGES.map((stage, i) => {
                const isComplete = i < currentStageIndex;
                const isCurrent = i === currentStageIndex;
                return (
                  <div key={stage.key} className="flex items-center gap-1">
                    {i > 0 && (
                      <div
                        className={`h-px w-4 sm:w-8 ${
                          isComplete ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isComplete
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="size-3" />
                      ) : isCurrent ? (
                        <Clock className="size-3" />
                      ) : null}
                      {stage.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column — Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Requester Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4" />
                Requester
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{request.requester_name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{request.requester_email}</dd>
                </div>
                {request.requester_phone && (
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{request.requester_phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium capitalize">
                    {(request.requester_type as string).replace("_", " ")}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Property & Association */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4" />
                Property &amp; Association
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Property</dt>
                  <dd className="font-medium">{request.property_address}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Association</dt>
                  <dd className="font-medium">
                    {association
                      ? (association as { name: string }).name
                      : "Unknown"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" />
                Documents Requested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(request.document_types as DocumentType[]).map((dt) => (
                  <div
                    key={dt}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">
                      {DOCUMENT_LABELS[dt]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Live Data Input (when awaiting_data) */}
          {request.status === "awaiting_data" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Data Input</CardTitle>
                <CardDescription>
                  Fill in the current data needed for this request. These fields
                  require up-to-date information from your records.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LiveDataForm
                  requestId={request.id}
                  documentTypes={request.document_types as DocumentType[]}
                  missingFields={
                    (request.missing_fields as string[] | null) || []
                  }
                  existingData={
                    (request.live_data as Record<string, string> | null) || {}
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* Generate Documents (when ready_for_generation) */}
          {request.status === "ready_for_generation" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Generate Documents</CardTitle>
                <CardDescription>
                  All data has been collected. Generate PDFs for review using
                  Typst templates and Claude AI validation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GenerateDocumentsButton requestId={request.id} />
              </CardContent>
            </Card>
          )}

          {/* Document Preview (when pending_review or later) */}
          {(request.status === "pending_review" ||
            request.status === "approved" ||
            request.status === "delivered") && (
            <GeneratedDocumentsCard
              requestId={request.id}
              tenantId={user.tenantId}
            />
          )}
        </div>

        {/* Right Column — Summary & Actions */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Turnaround</span>
                <span className="flex items-center gap-1 font-medium">
                  {request.turnaround === "rush" ? (
                    <>
                      <Zap className="size-3 text-amber-500" />
                      Rush
                    </>
                  ) : (
                    "Standard"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-medium capitalize">
                  {request.bill_to_closing
                    ? "Bill to Closing"
                    : (request.payment_status as string).replace("_", " ")}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">
                  {request.bill_to_closing
                    ? "BTC"
                    : formatCents(request.total_price_cents)}
                </span>
              </div>
              {request.rush_notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground">Rush Notes</p>
                    <p className="mt-1">{request.rush_notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusActions
                requestId={request.id}
                currentStatus={request.status as RequestStatus}
              />
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium">Request Created</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {request.status !== "received" && (
                  <div className="flex gap-2">
                    <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">
                        Status: {STATUS_LABELS[request.status as RequestStatus]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
