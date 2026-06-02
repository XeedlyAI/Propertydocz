import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getStatusLabel } from "@/lib/status-labels";
import type { RequestStatus } from "@/lib/types";
import {
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { OrderContextCard } from "@/components/admin/order-context-card";
import { DocumentWorkArea } from "@/components/admin/document-work-area";
import { StatusActions } from "@/components/admin/status-actions";
import { GeneratedDocumentsCard } from "@/components/admin/generated-documents-card";
import { CancelRequestButton } from "@/components/admin/cancel-request-button";

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

  // Fetch generated docs
  const generatedDocsResult = await supabase
    .from("generated_documents")
    .select("id, document_request_id, document_type, file_url, file_name, file_type, generation_method, generated_at, created_at")
    .eq("document_request_id", id)
    .order("created_at", { ascending: false });

  const generatedDocuments = generatedDocsResult.data ?? [];
  const hasGeneratedDocuments = generatedDocuments.length > 0;

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

      {/* Early status actions (received, paid only) */}
      {(request.status === "received" || request.status === "paid") && (
        <StatusActions requestId={request.id} currentStatus={request.status as RequestStatus} />
      )}

      {/* Order Context — always visible */}
      <OrderContextCard
        request={{
          requester_name: request.requester_name,
          requester_email: request.requester_email,
          requester_phone: request.requester_phone,
          requester_type: request.requester_type as string,
          property_address: request.property_address,
          turnaround: request.turnaround as string,
          bill_to_closing: request.bill_to_closing,
          payment_status: request.payment_status as string,
          total_price_cents: request.total_price_cents,
          rush_notes: request.rush_notes,
          live_data: (request.live_data as Record<string, string> | null) || {},
          document_types: request.document_types as string[],
        }}
        associationName={association ? (association as { name: string }).name : "Unknown"}
      />

      {/* Document Work Area (awaiting_data or ready_for_generation) */}
      {(request.status === "awaiting_data" || request.status === "ready_for_generation") && (
        <DocumentWorkArea
          documentTypes={request.document_types as string[]}
          liveData={(request.live_data as Record<string, string> | null) || {}}
          associationRecord={association as Record<string, unknown> | null}
          associationId={request.association_id as string | null}
          requestId={request.id}
          requestStatus={request.status as string}
        />
      )}

      {/* Post-generation actions (pending_review, approved, delivered) */}
      {(request.status === "pending_review" || request.status === "approved" || request.status === "delivered") && (
        <StatusActions requestId={request.id} currentStatus={request.status as RequestStatus} hasGeneratedDocuments={hasGeneratedDocuments} />
      )}

      {/* Generated Documents Card */}
      {(request.status === "pending_review" || request.status === "approved" || request.status === "delivered") && (
        <div data-generated-documents>
          <GeneratedDocumentsCard requestId={request.id} />
        </div>
      )}

      {/* Activity Log (collapsible) */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
          Activity Log
        </summary>
        <div className="mt-3 space-y-3 text-sm pl-6">
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
      </details>

      {/* Cancel Request — small text link */}
      {request.status !== "delivered" && request.status !== "cancelled" && (
        <CancelRequestButton requestId={request.id} />
      )}
    </div>
  );
}
