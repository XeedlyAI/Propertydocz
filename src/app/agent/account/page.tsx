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
  CreditCard,
  Package,
  User,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { MembershipActions } from "@/components/agent/membership-actions";

export default async function AgentAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, full_name, email, phone, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "agent") redirect("/login");

  // Fetch agent account
  const { data: agentAccount } = await supabase
    .from("agent_accounts")
    .select(
      "id, tier_id, subscription_status, stripe_customer_id, company_name, license_number, current_period_start, current_period_end"
    )
    .eq("user_id", user.id)
    .eq("tenant_id", profile.tenant_id)
    .single();

  // Fetch current tier
  let currentTier = null;
  if (agentAccount?.tier_id) {
    const { data } = await supabase
      .from("membership_tiers")
      .select("*")
      .eq("id", agentAccount.tier_id)
      .single();
    currentTier = data;
  }

  // Fetch all active tiers for comparison
  const { data: allTiers } = await supabase
    .from("membership_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Current period usage
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

  const tiers = allTiers || [];
  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: "Active", color: "text-green-600" },
    past_due: { label: "Past Due", color: "text-amber-600" },
    canceled: { label: "Canceled", color: "text-red-600" },
    none: { label: "No Subscription", color: "text-muted-foreground" },
  };

  const status = STATUS_LABELS[agentAccount?.subscription_status || "none"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">
          Manage your membership and account details
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium">{profile.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{profile.email}</p>
            </div>
            {profile.phone && (
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{profile.phone}</p>
              </div>
            )}
            {agentAccount?.company_name && (
              <div>
                <p className="text-xs text-muted-foreground">Company</p>
                <p className="text-sm font-medium">
                  {agentAccount.company_name}
                </p>
              </div>
            )}
            {agentAccount?.license_number && (
              <div>
                <p className="text-xs text-muted-foreground">License</p>
                <p className="text-sm font-medium">
                  {agentAccount.license_number}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Plan Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4" />
              Current Plan
            </CardTitle>
            <CardDescription>
              <span className={status.color}>{status.label}</span>
              {agentAccount?.current_period_end && agentAccount.subscription_status === "active" && (
                <span className="ml-2 text-muted-foreground">
                  Renews{" "}
                  {new Date(agentAccount.current_period_end).toLocaleDateString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <h3 className="font-semibold">
                  {currentTier?.name || "Pay-Per-Order"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentTier && currentTier.price_cents > 0
                    ? `$${(currentTier.price_cents / 100).toFixed(0)}/month`
                    : "No monthly fee"}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {usageCount}
                    {currentTier && currentTier.included_packages > 0
                      ? ` / ${currentTier.included_packages}`
                      : ""}{" "}
                    packages used
                  </span>
                </div>
                {currentTier && currentTier.overage_discount_percent > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {currentTier.overage_discount_percent}% off overage orders
                  </p>
                )}
              </div>
            </div>

            <MembershipActions
              hasSubscription={!!agentAccount?.stripe_customer_id}
              currentTierSlug={currentTier?.slug || "pay_per_order"}
              subscriptionStatus={agentAccount?.subscription_status || "none"}
            />
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4" />
            Compare Plans
          </CardTitle>
          <CardDescription>
            Upgrade or downgrade your membership anytime
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => {
              const isCurrent = tier.id === agentAccount?.tier_id;
              const features = (tier.features as string[]) || [];

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-lg border p-4 ${
                    isCurrent
                      ? "border-[#38b6ff] bg-[#38b6ff]/5 ring-1 ring-[#38b6ff]"
                      : "border-border"
                  }`}
                >
                  {isCurrent && (
                    <Badge
                      variant="default"
                      className="absolute -top-2 right-3 bg-[#38b6ff] text-white text-[10px]"
                    >
                      CURRENT
                    </Badge>
                  )}
                  <h3 className="font-semibold text-sm">{tier.name}</h3>
                  <p className="mt-1 text-xl font-bold">
                    {tier.price_cents === 0
                      ? "Free"
                      : `$${(tier.price_cents / 100).toFixed(0)}`}
                    {tier.price_cents > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        /mo
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tier.included_packages > 0
                      ? `${tier.included_packages} packages included`
                      : "Pay per document"}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {features.map((f: string) => (
                      <li
                        key={f}
                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
