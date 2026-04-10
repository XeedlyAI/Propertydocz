"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import { getTierName, getTierPriceLabel, SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscriptions";
import type { DocumentType } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  LogOut,
  Settings,
  Loader2,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileStack,
} from "lucide-react";

interface AccountClientProps {
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string;
    customerType: string;
    memberSince: string;
  };
  subscription: {
    id: string;
    tier: string;
    status: string;
    packagesIncluded: number;
    packagesUsed: number;
    monthlyPrice: number;
    billingCycleEnd: string | null;
    overageDiscount: number;
    stripeCustomerId: string | null;
  } | null;
  stats: {
    totalOrders: number;
    totalSpent: number;
    memberSince: string;
  };
  recentOrders: {
    id: string;
    propertyAddress: string;
    documentTypes: string[];
    totalCents: number;
    paymentStatus: string;
    pricingType: string;
    status: string;
    createdAt: string;
  }[];
}

/** Customer-facing status display — intentionally simplified labels */
const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  received: { label: "Received", color: "text-muted-foreground" },
  paid: { label: "Paid", color: "text-[#38b6ff]" },
  awaiting_data: { label: "Processing", color: "text-[#f59e0b]" },
  ready_for_generation: { label: "Processing", color: "text-[#f59e0b]" },
  pending_review: { label: "In Review", color: "text-[#f59e0b]" },
  approved: { label: "Approved", color: "text-[#14b8a6]" },
  delivered: { label: "Delivered", color: "text-[#14b8a6]" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground" },
};

export function AccountClient({
  customer,
  subscription,
  stats,
  recentOrders,
}: AccountClientProps) {
  const router = useRouter();
  const [managingBilling, setManagingBilling] = useState(false);

  const tier = (subscription?.tier || "free") as SubscriptionTier;
  const hasSub = subscription && tier !== "free";
  const usagePct = subscription && subscription.packagesIncluded > 0
    ? (subscription.packagesUsed / subscription.packagesIncluded) * 100
    : 0;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleManageBilling() {
    if (!subscription?.stripeCustomerId) return;
    setManagingBilling(true);
    try {
      const res = await fetch("/api/stripe/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripeCustomerId: subscription.stripeCustomerId,
        }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch {
      // Silent fail
    } finally {
      setManagingBilling(false);
    }
  }

  // Determine next upgrade tier
  const tierOrder: SubscriptionTier[] = ["free", "agent_pro", "broker_office", "title_partner"];
  const currentIdx = tierOrder.indexOf(tier);
  const nextTier = currentIdx < tierOrder.length - 1 ? tierOrder[currentIdx + 1] : null;
  const nextTierConfig = nextTier ? SUBSCRIPTION_TIERS[nextTier] : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#38b6ff]/10">
            <FileStack className="size-5 text-[#38b6ff]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">My Account</h1>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground">
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>

      <div className="space-y-6">
        {/* Subscription Card */}
        <Card className="dash-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Current Plan
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {getTierName(tier)}
                </p>
              </div>
              {hasSub && subscription?.stripeCustomerId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={managingBilling}
                  className="gap-1.5"
                >
                  {managingBilling ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Settings className="size-3.5" />
                  )}
                  Manage
                </Button>
              )}
            </div>

            {hasSub && (
              <div className="mt-4 space-y-3">
                {/* Usage bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Packages</span>
                    <span className="font-mono font-medium text-foreground">
                      {subscription.packagesUsed} of {subscription.packagesIncluded} used
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usagePct > 100 ? "bg-[#ef4444]" : usagePct > 80 ? "bg-[#f59e0b]" : "bg-[#38b6ff]"
                      }`}
                      style={{ width: `${Math.min(usagePct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {subscription.billingCycleEnd && (
                    <span>
                      Resets: {new Date(subscription.billingCycleEnd).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                    </span>
                  )}
                  <span className="font-mono font-medium text-foreground">
                    {getTierPriceLabel(tier)}
                  </span>
                </div>

                {subscription.status === "past_due" && (
                  <div className="flex items-center gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 px-3 py-2 text-xs text-[#ef4444]">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    Payment past due. Please update your payment method.
                  </div>
                )}
              </div>
            )}

            {!hasSub && (
              <p className="mt-2 text-sm text-muted-foreground">
                Standard pay-per-order pricing. Subscribe to save up to 30%.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="dash-card">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Total Orders
              </p>
              <p className="mt-1 font-mono text-xl font-bold">{stats.totalOrders}</p>
            </CardContent>
          </Card>
          <Card className="dash-card">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Total Spent
              </p>
              <p className="mt-1 font-mono text-xl font-bold">{formatCents(stats.totalSpent)}</p>
            </CardContent>
          </Card>
          <Card className="dash-card">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Member Since
              </p>
              <p className="mt-1 font-mono text-lg font-bold">
                {new Date(stats.memberSince).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="dash-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No orders yet.
              </p>
            ) : (
              <div className="space-y-1">
                {recentOrders.map((order) => {
                  const status = STATUS_DISPLAY[order.status] || STATUS_DISPLAY.received;
                  const docs = (order.documentTypes as DocumentType[])
                    .map((dt) => DOCUMENT_LABELS[dt] || dt)
                    .join(", ");

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {order.propertyAddress}
                          </p>
                          <span className={`text-[10px] font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                          {docs}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-mono text-sm font-medium">
                          {order.pricingType === "subscription"
                            ? "$0.00"
                            : formatCents(order.totalCents)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade Prompt */}
        {nextTierConfig && (
          <Card className="dash-card border-l-[3px]" style={{ borderLeftColor: "#38b6ff" }}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="size-5 shrink-0 text-[#38b6ff] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Upgrade to {nextTierConfig.name} (${nextTierConfig.price}/mo)
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Get {nextTierConfig.packagesPerMonth} packages/month and {Math.round(nextTierConfig.overageDiscount * 100)}% off overage orders.
                  </p>
                </div>
                <a
                  href="/pricing"
                  className="flex items-center gap-1 text-sm font-medium shrink-0"
                  style={{ color: "#38b6ff" }}
                >
                  See Plans
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
