import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import { getStatusLabel } from "@/lib/status-labels";
import type { DocumentType, RequestStatus } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Building2,
  FileText,
  Zap,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { TransactionDataForm } from "@/components/admin/transaction-data-form";
import { DocumentFieldsView } from "@/components/admin/document-fields-view";
import { StatusActions } from "@/components/admin/status-actions";
import { GenerateDocumentsButton } from "@/components/admin/generate-documents-button";
import { GeneratedDocumentsCard } from "@/components/admin/generated-documents-card";
import { DocumentAccordion } from "@/components/admin/document-accordion";
import { ReadinessChecklist } from "@/components/admin/readiness-checklist";
import { getAssociationFieldValues } from "@/lib/services/association-data";

const WORKFLOW_STAGES: { key: RequestStatus; label: string }[] = [
  { key: "received", label: getStatusLabel("received") },
  { key: "paid", label: getStatusLabel("paid") },
  { key: "awaiting_data", label: getStatusLabel("awaiting_data") },
  { key: "ready_for_generation", label: "Ready" },
  { key: "pending_review", label: "Review" },
  { key: "approved", label: getStatusLabel("approved") },
  { key: "delivered", label: getStatusLabel("delivered") },
];

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
      `*, associations(*)`
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

  // Fetch association field values and generated docs in parallel
  const [associationFieldValues, generatedDocsResult] = await Promise.all([
    request.association_id
      ? getAssociationFieldValues(request.association_id)
      : Promise.resolve([]),
    supabase
      .from("generated_documents")
      .select("id, document_request_id, document_type, file_url, file_name, file_type, generation_method, generated_at, created_at")
      .eq("document_request_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const generatedDocuments = generatedDocsResult.data ?? [];
  const hasGeneratedDocuments = generatedDocuments.length > 0;

  // Serialize for client component (strip any non-serializable data)
  const serializedFieldValues = associationFieldValues.map((fv) => ({
    id: fv.id,
    association_id: fv.association_id,
    field_key: fv.field_key,
    value: fv.value,
    confidence: fv.confidence,
    source: fv.source,
    source_document: fv.source_document,
    last_verified_at: fv.last_verified_at,
    last_verified_by: fv.last_verified_by,
    previous_value: fv.previous_value,
  }));

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
            Request <span className="font-data">#{id.slice(0, 8)}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {new Date(request.created_at).toLocaleString()}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            isCancelled
              ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              : "bg-[#38b6ff]/10 text-[#38b6ff]"
          }`}
        >
          {getStatusLabel(request.status)}
        </span>
      </div>

      {/* Status Bar */}
      {!isCancelled && (
        <div className="rounded-xl border border-slate-200 p-4">
          {/* Segmented bar */}
          <div className="flex gap-1">
            {WORKFLOW_STAGES.map((stage, i) => {
              const isComplete = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              return (
                <div
                  key={stage.key}
                  className={`relative h-2 flex-1 rounded-full transition-colors ${
                    isComplete
                      ? "bg-[#38b6ff]"
                      : isCurrent
                        ? "bg-[#38b6ff]"
                        : "bg-slate-100"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
          {/* Labels below */}
          <div className="mt-2 flex gap-1">
            {WORKFLOW_STAGES.map((stage, i) => {
              const isComplete = i < currentStageIndex;
              const isCurrent = i === currentStageIndex;
              return (
                <span
                  key={stage.key}
                  className={`flex-1 text-center text-[10px] sm:text-xs font-medium ${
                    isCurrent
                      ? "text-[#38b6ff]"
                      : isComplete
                        ? "text-[#38b6ff]/70"
                        : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Left Column — Info */}
        <div className="space-y-6">
          {/* Readiness Checklist */}
          <ReadinessChecklist
            liveData={(request.live_data as Record<string, string> | null) || {}}
            associationFieldValues={serializedFieldValues}
            documentTypes={request.document_types as string[]}
            requestStatus={request.status as string}
          />

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

          {/* Documents Accordion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4" />
                Documents Requested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentAccordion
                documentTypes={request.document_types as string[]}
                requestId={request.id}
                requestStatus={request.status as string}
                generatedDocuments={generatedDocuments}
              />
            </CardContent>
          </Card>

          {/* Transaction Data Form + Document Fields (when awaiting_data or ready_for_generation) */}
          {(request.status === "awaiting_data" ||
            request.status === "ready_for_generation") && (
            <>
              <TransactionDataForm
                requestId={request.id}
                existingData={
                  (request.live_data as Record<string, string> | null) || {}
                }
                associationFieldValues={serializedFieldValues}
                status={request.status as RequestStatus}
              />
              <DocumentFieldsView
                documentTypes={request.document_types as string[]}
                liveData={
                  (request.live_data as Record<string, string> | null) || {}
                }
                associationRecord={association as Record<string, unknown> | null}
                associationId={request.association_id as string | null}
                requestId={request.id}
                requestStatus={request.status as string}
              />
            </>
          )}

          {/* Generate Documents — renders in ready_for_generation AND pending_review
              so the client component can persist its success banner after generation
              triggers a router.refresh() that changes status to pending_review */}
          {(request.status === "ready_for_generation" ||
            request.status === "pending_review") && (
            <div data-generate-documents>
              <GenerateDocumentsButton
                requestId={request.id}
                status={request.status}
              />
            </div>
          )}

          {/* Document Preview (when pending_review or later) */}
          {(request.status === "pending_review" ||
            request.status === "approved" ||
            request.status === "delivered") && (
            <div data-generated-documents>
              <GeneratedDocumentsCard
                requestId={request.id}
              />
            </div>
          )}
        </div>

        {/* Right Column — Summary & Actions */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
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
              <div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium capitalize">
                    {request.bill_to_closing
                      ? "Bill to Closing"
                      : (request.payment_status as string).replace("_", " ")}
                  </span>
                </div>
                {!request.bill_to_closing &&
                  (request.payment_status as string) === "pending" && (
                    <button
                      type="button"
                      className="mt-1 text-sm text-[#38b6ff] hover:underline"
                    >
                      Send Payment Link
                    </button>
                  )}
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-data font-semibold">
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
                hasGeneratedDocuments={hasGeneratedDocuments}
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
                      {new Date(request.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(request.created_at).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                      {" "}
                      <span className="text-muted-foreground/70">&middot; {request.requester_name ?? "System"}</span>
                    </p>
                  </div>
                </div>
                {request.status !== "received" && (
                  <div className="flex gap-2">
                    <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="font-medium">
                        Status: {getStatusLabel(request.status)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.updated_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(request.updated_at).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                        {" "}
                        <span className="text-muted-foreground/70">&middot; System</span>
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
