"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, CreditCard, CheckCircle2, ExternalLink } from "lucide-react";

interface StripeConnectStatusProps {
  isConnected: boolean;
  stripeAccountId: string | null;
  status: "connected" | null;
}

export function StripeConnectStatus({
  isConnected,
  stripeAccountId,
  status,
}: StripeConnectStatusProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to initiate Stripe Connect");
        return;
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4" />
          Stripe Connect
        </CardTitle>
        <CardDescription>
          Connect your Stripe account to receive payments from document orders.
          Payments are automatically split between your account and the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected || status === "connected" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="size-4" />
              Stripe account connected
            </div>
            {stripeAccountId && (
              <p className="text-xs text-muted-foreground font-data">
                Account: {stripeAccountId}
              </p>
            )}
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[#38b6ff] hover:underline"
            >
              Open Stripe Dashboard
              <ExternalLink className="size-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <Button
              onClick={handleConnect}
              disabled={loading}
              size="sm"
            >
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 size-4" />
              )}
              Connect Stripe Account
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
