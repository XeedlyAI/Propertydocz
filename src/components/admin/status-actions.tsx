"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { RequestStatus } from "@/lib/types";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  Download,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

interface StatusActionsProps {
  requestId: string;
  currentStatus: RequestStatus;
  hasGeneratedDocuments?: boolean;
}

export function StatusActions({
  requestId,
  currentStatus,
  hasGeneratedDocuments = false,
}: StatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  async function handlePlaceholderAction(actionKey: string) {
    setLoading(actionKey);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(null);
    router.refresh();
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
            {"Approve → Ready for Delivery"}
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

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
