"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RequestStatus } from "@/lib/types";
import {
  Loader2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Send,
} from "lucide-react";

// Valid status transitions
const NEXT_STATUS: Partial<Record<RequestStatus, { status: RequestStatus; label: string; icon: typeof ArrowRight; variant?: "default" | "destructive" }[]>> = {
  received: [
    { status: "paid", label: "Mark as Paid", icon: ArrowRight },
    { status: "cancelled", label: "Cancel", icon: XCircle, variant: "destructive" },
  ],
  paid: [
    { status: "awaiting_data", label: "Move to Awaiting Data", icon: ArrowRight },
    { status: "cancelled", label: "Cancel", icon: XCircle, variant: "destructive" },
  ],
  awaiting_data: [
    // Live data form handles advancing to ready_for_generation
    { status: "cancelled", label: "Cancel", icon: XCircle, variant: "destructive" },
  ],
  ready_for_generation: [
    { status: "pending_review", label: "Move to Review", icon: ArrowRight },
    { status: "cancelled", label: "Cancel", icon: XCircle, variant: "destructive" },
  ],
  pending_review: [
    { status: "approved", label: "Approve", icon: CheckCircle2 },
    { status: "awaiting_data", label: "Request Changes", icon: ArrowRight },
    { status: "cancelled", label: "Cancel", icon: XCircle, variant: "destructive" },
  ],
  approved: [
    { status: "delivered", label: "Mark as Delivered", icon: Send },
  ],
};

interface StatusActionsProps {
  requestId: string;
  currentStatus: RequestStatus;
}

export function StatusActions({ requestId, currentStatus }: StatusActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const actions = NEXT_STATUS[currentStatus];

  if (!actions || actions.length === 0) {
    if (currentStatus === "delivered") {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="size-4" />
          This request has been delivered.
        </div>
      );
    }
    if (currentStatus === "cancelled") {
      return (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="size-4" />
          This request has been cancelled.
        </div>
      );
    }
    return null;
  }

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

  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <Button
          key={action.status}
          variant={action.variant || "default"}
          size="sm"
          className="w-full justify-start gap-2"
          disabled={loading !== null}
          onClick={() => handleTransition(action.status)}
        >
          {loading === action.status ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <action.icon className="size-4" />
          )}
          {action.label}
        </Button>
      ))}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
