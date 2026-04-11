"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { runPreGenerationCheck } from "@/lib/field-validations";
import type { PreGenCheckResult } from "@/lib/field-validations";
import { getRequiredFields } from "@/lib/document-schemas";
import type { RequestStatus } from "@/lib/types";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  Download,
  Sparkles,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

interface StatusActionsProps {
  requestId: string;
  currentStatus: RequestStatus;
  hasGeneratedDocuments?: boolean;
  liveData?: Record<string, string>;
  associationRecord?: Record<string, unknown> | null;
  documentTypes?: string[];
}

export function StatusActions({
  requestId,
  currentStatus,
  hasGeneratedDocuments = false,
  liveData = {},
  associationRecord = null,
  documentTypes = [],
}: StatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [complianceConfirmed, setComplianceConfirmed] = useState(false);

  // Layer 2: Pre-generation gate check state
  const [preGenResult, setPreGenResult] = useState<PreGenCheckResult | null>(null);
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);

  async function handleTransition(nextStatus: RequestStatus) {
    setLoading(nextStatus);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/requests/${requestId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update status");
        return;
      }

      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  /** Layer 2: Run pre-generation check before advancing to ready_for_generation */
  function handlePreGenCheck() {
    // Collect all required field keys from the document schemas
    const requiredKeys: string[] = [];
    for (const dt of documentTypes) {
      const fields = getRequiredFields(dt, "per_transaction");
      for (const f of fields) {
        if (!requiredKeys.includes(f.key)) requiredKeys.push(f.key);
      }
    }

    // Build field values from liveData (convert currency cents to dollars for validation)
    const fieldValues: Record<string, string> = { ...liveData };

    const result = runPreGenerationCheck(
      fieldValues,
      associationRecord,
      documentTypes[0] || "",
      requiredKeys
    );

    setPreGenResult(result);
    setWarningsAcknowledged(false);

    // If no errors and no warnings, advance immediately
    if (result.passed && result.warnings.length === 0) {
      handleTransition("ready_for_generation");
    }
  }

  async function handlePlaceholderAction(actionKey: string) {
    setLoading(actionKey);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(null);
    router.refresh();
  }

  function scrollToGenerateButton() {
    const el = document.querySelector("[data-generate-documents]");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // Terminal states
  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <XCircle className="size-4" />
        This request has been cancelled.
      </div>
    );
  }

  // Check if minimum data is present for pre-gen check
  const hasOwner = !!(liveData.owner_name || liveData.owner_names);
  const hasClosing = !!liveData.closing_date;
  const canRunPreGen = hasOwner && hasClosing;

  return (
    <div className="space-y-3">
      {/* ───── received ───── */}
      {currentStatus === "received" && (
        <Button
          size="sm"
          className="w-full justify-start gap-2 bg-[#38b6ff] text-white hover:bg-[#1DA8F0]"
          disabled={loading !== null}
          onClick={() => handleTransition("paid")}
        >
          {loading === "paid" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          Mark as Paid
        </Button>
      )}

      {/* ───── paid ───── */}
      {currentStatus === "paid" && (
        <Button
          size="sm"
          className="w-full justify-start gap-2 bg-[#38b6ff] text-white hover:bg-[#1DA8F0]"
          disabled={loading !== null}
          onClick={() => handleTransition("awaiting_data")}
        >
          {loading === "awaiting_data" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          Move to Awaiting Data
        </Button>
      )}

      {/* ───── awaiting_data ───── */}
      {currentStatus === "awaiting_data" && (
        <div className="space-y-3">
          {/* Pre-gen check button */}
          {!preGenResult && (
            <>
              <Button
                size="sm"
                className="w-full justify-start gap-2 bg-[#38b6ff] text-white hover:bg-[#1DA8F0]"
                disabled={loading !== null || !canRunPreGen}
                onClick={handlePreGenCheck}
              >
                {loading === "ready_for_generation" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                Mark Ready for Generation
              </Button>
              {!canRunPreGen && (
                <p className="text-xs text-slate-400">
                  Enter owner name and closing date above to unlock
                </p>
              )}
            </>
          )}

          {/* Layer 2: Pre-generation check results */}
          {preGenResult && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-700">Pre-Generation Check</p>

              {/* Errors (blocking) */}
              {preGenResult.errors.length > 0 && (
                <div className="space-y-1">
                  {preGenResult.errors.map((e, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                      <XCircle className="size-3 shrink-0 mt-0.5" />
                      <span><strong>{e.label}:</strong> {e.message}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Warnings (acknowledgeable) */}
              {preGenResult.warnings.length > 0 && (
                <div className="space-y-1">
                  {preGenResult.warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
                      <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                      <span><strong>{w.label}:</strong> {w.message}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* All clear */}
              {preGenResult.errors.length === 0 && preGenResult.warnings.length === 0 && (
                <p className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="size-3" />
                  All checks passed
                </p>
              )}

              {/* Actions based on result */}
              {preGenResult.errors.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-red-500">Fix the errors above before proceeding</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setPreGenResult(null)}
                  >
                    Dismiss &amp; Fix
                  </Button>
                </div>
              ) : preGenResult.warnings.length > 0 ? (
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={warningsAcknowledged}
                      onChange={(e) => setWarningsAcknowledged(e.target.checked)}
                      className="mt-0.5 size-3.5 rounded border-border accent-[#38b6ff]"
                    />
                    <span>I&apos;ve reviewed these warnings and the data is correct</span>
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreGenResult(null)}
                    >
                      Go Back
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#38b6ff] text-white hover:bg-[#1DA8F0]"
                      disabled={!warningsAcknowledged || loading !== null}
                      onClick={() => handleTransition("ready_for_generation")}
                    >
                      {loading === "ready_for_generation" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Proceed Anyway"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* No errors or warnings — auto-advancing (already triggered) */
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <Loader2 className="size-3 animate-spin" />
                  Advancing...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───── ready_for_generation ───── */}
      {currentStatus === "ready_for_generation" && (
        <div className="space-y-3">
          <label className="flex items-start gap-2 cursor-pointer text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={complianceConfirmed}
              onChange={(e) => setComplianceConfirmed(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border accent-[#38b6ff]"
            />
            <span>
              I confirm all data has been verified and is accurate for document
              generation
            </span>
          </label>
          <Button
            className="w-full gap-2 bg-[#38b6ff] text-white text-base font-bold shadow-lg hover:bg-[#1DA8F0] active:bg-[#0A8FD4] py-6 disabled:opacity-50"
            disabled={loading !== null || !complianceConfirmed}
            onClick={scrollToGenerateButton}
          >
            <Sparkles className="size-5" />
            Generate Documents
          </Button>
        </div>
      )}

      {/* ───── pending_review ───── */}
      {currentStatus === "pending_review" && (
        <>
          <Button
            size="sm"
            className="w-full justify-start gap-2 bg-[#38b6ff] text-white hover:bg-[#1DA8F0]"
            disabled={loading !== null}
            onClick={() => handleTransition("approved")}
          >
            {loading === "approved" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {"Approve \u2192 Ready for Delivery"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={loading !== null}
            onClick={() => handleTransition("awaiting_data")}
          >
            {loading === "awaiting_data" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Request Changes
          </Button>
        </>
      )}

      {/* ───── approved ───── */}
      {currentStatus === "approved" && (
        <>
          <Button
            size="sm"
            className="w-full justify-start gap-2 bg-[#38b6ff] text-white hover:bg-[#1DA8F0]"
            disabled={loading !== null}
            onClick={() => handleTransition("delivered")}
          >
            {loading === "delivered" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Deliver to Requester
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={!hasGeneratedDocuments}
            onClick={() => {
              const el = document.querySelector("[data-generated-documents]");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <Download className="size-4" />
            Download PDF
          </Button>
        </>
      )}

      {/* ───── delivered ───── */}
      {currentStatus === "delivered" && (
        <>
          <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
            <CheckCircle2 className="size-4" />
            This request has been delivered.
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={loading !== null}
            onClick={() => handlePlaceholderAction("resend_delivery")}
          >
            {loading === "resend_delivery" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Resend Delivery
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={!hasGeneratedDocuments}
            onClick={() => {
              const el = document.querySelector("[data-generated-documents]");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <Download className="size-4" />
            Download PDF
          </Button>
        </>
      )}

      {/* ───── Cancel (all non-terminal statuses except delivered) ───── */}
      {currentStatus !== "delivered" && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-red-500 text-red-500 hover:bg-red-50"
            disabled={loading !== null}
            onClick={() => handleTransition("cancelled")}
          >
            {loading === "cancelled" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            Cancel Request
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
