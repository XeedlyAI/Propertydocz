"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Settings, ArrowUpRight } from "lucide-react";

interface MembershipActionsProps {
  hasSubscription: boolean;
  currentTierSlug: string;
  subscriptionStatus: string;
}

export function MembershipActions({
  hasSubscription,
  currentTierSlug,
  subscriptionStatus,
}: MembershipActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleAction(action: string, tierSlug?: string) {
    setLoading(action);
    setError("");

    try {
      const response = await fetch("/api/agent/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, tier_slug: tierSlug }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Operation failed");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        window.location.reload();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* Subscribe button for free tier users */}
        {currentTierSlug === "pay_per_order" && (
          <Button
            size="sm"
            className="rounded-[6px] bg-[#38b6ff] text-white font-semibold hover:bg-[#1DA8F0]"
            disabled={loading !== null}
            onClick={() => handleAction("checkout", "agent_pro")}
          >
            {loading === "checkout" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ArrowUpRight className="mr-2 size-4" />
            )}
            Upgrade to Agent Pro
          </Button>
        )}

        {/* Manage billing for active subscribers */}
        {hasSubscription && subscriptionStatus === "active" && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-[6px]"
            disabled={loading !== null}
            onClick={() => handleAction("portal")}
          >
            {loading === "portal" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Settings className="mr-2 size-4" />
            )}
            Manage Billing
          </Button>
        )}

        {/* Resubscribe for canceled users */}
        {subscriptionStatus === "canceled" && (
          <Button
            size="sm"
            className="rounded-[6px] bg-[#38b6ff] text-white font-semibold hover:bg-[#1DA8F0]"
            disabled={loading !== null}
            onClick={() => handleAction("checkout", currentTierSlug)}
          >
            {loading === "checkout" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 size-4" />
            )}
            Resubscribe
          </Button>
        )}

        {/* Past due — go to billing portal */}
        {subscriptionStatus === "past_due" && (
          <Button
            size="sm"
            variant="destructive"
            className="rounded-[6px]"
            disabled={loading !== null}
            onClick={() => handleAction("portal")}
          >
            {loading === "portal" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 size-4" />
            )}
            Update Payment Method
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
