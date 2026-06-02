"use client";

import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";

interface CancelRequestButtonProps {
  requestId: string;
}

export function CancelRequestButton({ requestId }: CancelRequestButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/requests/${requestId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to cancel request");
        return;
      }

      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <div className="pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-xs text-red-500 hover:text-red-700 hover:underline"
        >
          Cancel this request
        </button>
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-slate-100 space-y-2">
      <p className="text-xs text-red-600">Are you sure you want to cancel this request? This cannot be undone.</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700"
        >
          {loading ? <Loader2 className="size-3 animate-spin" /> : <XCircle className="size-3" />}
          Yes, cancel
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Never mind
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
