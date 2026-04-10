import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CreditCard,
  Package,
  TrendingUp,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default async function AgentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "agent") redirect("/login");

  // Fetch agent account with tier info
  const { data: agentAccount } = await supabase
    .from("agent_accounts")
    .select(
      "id, tier_id, subscription_status, current_period_start, current_period_end, company_name"
    )
    .eq("user_id", user.id)
    .eq("tenant_id", profile.tenant_id)
    .single();

  // Fetch tier details
  let tier = null;
  if (agentAccount?.tier_id) {
    const { data: tierData } = await supabase
      .from("membership_tiers")
      .select("name, slug, price_cents, included_packages, overage_discount_percent")
      .eq("id", agentAccount.tier_id)
      .single();
    tier = tierData;
  }

  // Fetch recent orders by this agent (matched by requester email)
  const { data: recentOrders } = await supabase
    .from("document_requests")
    .select(
      "id, requester_name, property_address, document_types, status, created_at, total_price_cents, turnaround"
    )
    .eq("requester_email", user.email)
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Calculate usage this period
  let usageCount = 0;
  if (agentAccount?.current_period_start && agentAccount?.current_period_end) {
    const { count } = await supabase
      .from("document_usage")
      .select("id", { count: "exact", head: true })
      .eq("agent_account_id", agentAccount.id)
      .gte("period_start", agentAccount.current_period_start)
      .lte("period_end", agentAccount.current_period_end);
    usageCount = count || 0;
  }

  const orders = recentOrders || [];
  const includedPackages = tier?.included_packages || 0;
  const remaining = Math.max(0, includedPackages - usageCount);

  /** Agent-facing status display — intentionally simplified labels */
  const STATUS_DISPLAY: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    received: { label: "Received", variant: "secondary" },
    awaiting_data: { label: "Processing", variant: "secondary" },
    ready_for_generation: { label: "Processing", variant: "secondary" },
    pending_review: { label: "Under Review", variant: "default" },
    approved: { label: "Approved", variant: "default" },
    delivered: { label: "Delivered", variant: "outline" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {profile.full_name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {agentAccount?.company_name
            ? `${agentAccount.company_name} | `
            : ""}
          {tier?.name || "Pay-Per-Order"} Plan
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Membership Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CreditCard className="size-4" />
              Membership
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{tier?.name || "Free"}</div>
            {tier && tier.price_cents > 0 ? (
              <p className="text-xs text-muted-foreground">
                ${(tier.price_cents / 100).toFixed(0)}/mo
                {agentAccount?.subscription_status === "active" && (
                  <span className="ml-1 text-green-600">Active</span>
                )}
                {agentAccount?.subscription_status === "past_due" && (
                  <span className="ml-1 text-amber-600">Past Due</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No monthly fee
              </p>
            )}
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="size-4" />
              Packages Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {usageCount}
              {includedPackages > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {includedPackages}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {includedPackages > 0
                ? `${remaining} remaining this period`
                : "Pay per document"}
            </p>
            {includedPackages > 0 && (
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-[#38b6ff] transition-all"
                  style={{
                    width: `${Math.min(100, (usageCount / includedPackages) * 100)}%`,
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Savings Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="size-4" />
              Overage Discount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {tier?.overage_discount_percent
                ? `${tier.overage_discount_percent}% off`
                : "Standard"}
            </div>
            <p className="text-xs text-muted-foreground">
              {tier?.overage_discount_percent
                ? "Applied to additional orders"
                : "Upgrade for discounts"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Order + Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Order */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="size-4 text-[#38b6ff]" />
              Quick Order
            </CardTitle>
            <CardDescription>
              Start a new document request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/"
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  New Document Order
                </span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
            {tier && tier.slug !== "pay_per_order" && tier.slug !== "title_partner" && (
              <Link
                href="/agent/account"
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Upgrade Plan</span>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto size-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No orders yet. Start by ordering your first document.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const statusInfo = STATUS_DISPLAY[order.status] || {
                    label: order.status,
                    variant: "secondary" as const,
                  };
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {order.property_address}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}{" "}
                          {order.turnaround === "rush" && (
                            <span className="text-amber-600 font-medium">
                              RUSH
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          ${((order.total_price_cents || 0) / 100).toFixed(2)}
                        </span>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {orders.length >= 5 && (
                  <Link
                    href="/agent/orders"
                    className="block text-center text-sm text-[#38b6ff] hover:underline"
                  >
                    View all orders
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
