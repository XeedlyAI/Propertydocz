import { createServiceClient } from "@/lib/supabase/server";
import { getPlatformUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, Package } from "lucide-react";

export default async function PlatformAgentsPage() {
  await getPlatformUser();
  const serviceClient = await createServiceClient();

  // All agent accounts with profile and tier info
  const { data: agents } = await serviceClient
    .from("agent_accounts")
    .select(
      "id, subscription_status, company_name, created_at, current_period_start, current_period_end, user_id, tier_id, tenant_id"
    )
    .order("created_at", { ascending: false });

  // Fetch related data
  const userIds = [...new Set((agents || []).map((a) => a.user_id))];
  const tierIds = [...new Set((agents || []).map((a) => a.tier_id))];
  const tenantIds = [...new Set((agents || []).map((a) => a.tenant_id))];

  const [profilesRes, tiersRes, tenantsRes] = await Promise.all([
    userIds.length > 0
      ? serviceClient
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds)
      : { data: [] },
    tierIds.length > 0
      ? serviceClient
          .from("membership_tiers")
          .select("id, name, slug, price_cents")
          .in("id", tierIds)
      : { data: [] },
    tenantIds.length > 0
      ? serviceClient
          .from("tenants")
          .select("id, name")
          .in("id", tenantIds)
      : { data: [] },
  ]);

  const profiles = new Map(
    (profilesRes.data || []).map((p) => [p.id, p])
  );
  const tiers = new Map(
    (tiersRes.data || []).map((t) => [t.id, t])
  );
  const tenants = new Map(
    (tenantsRes.data || []).map((t) => [t.id, t])
  );

  // Usage counts
  const { data: usageCounts } = await serviceClient
    .from("document_usage")
    .select("agent_account_id");

  const usageMap = new Map<string, number>();
  for (const u of usageCounts || []) {
    usageMap.set(
      u.agent_account_id,
      (usageMap.get(u.agent_account_id) || 0) + 1
    );
  }

  const allAgents = agents || [];

  // Stats
  const totalAgents = allAgents.length;
  const activeSubscriptions = allAgents.filter(
    (a) => a.subscription_status === "active"
  ).length;
  const totalUsage = Array.from(usageMap.values()).reduce(
    (sum, c) => sum + c,
    0
  );

  const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    past_due: "destructive",
    canceled: "secondary",
    none: "outline",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agent Accounts</h1>
        <p className="text-sm text-muted-foreground">
          View and manage agent memberships across all tenants
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="size-4" />
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAgents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CreditCard className="size-4" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeSubscriptions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="size-4" />
              Total Packages Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUsage}</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Table */}
      <Card>
        <CardContent className="pt-6">
          {allAgents.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No agent accounts yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Agent
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Tenant
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Plan
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">
                      Usage
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allAgents.map((agent) => {
                    const profile = profiles.get(agent.user_id);
                    const tier = tiers.get(agent.tier_id);
                    const tenant = tenants.get(agent.tenant_id);
                    const usage = usageMap.get(agent.id) || 0;

                    return (
                      <tr
                        key={agent.id}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 pr-4">
                          <p className="font-medium">
                            {profile?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {profile?.email}
                          </p>
                          {agent.company_name && (
                            <p className="text-xs text-muted-foreground">
                              {agent.company_name}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {tenant?.name || "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-medium">
                            {tier?.name || "—"}
                          </span>
                          {tier && tier.price_cents > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ${(tier.price_cents / 100).toFixed(0)}/mo
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={
                              STATUS_COLORS[
                                agent.subscription_status || "none"
                              ] || "outline"
                            }
                          >
                            {agent.subscription_status || "none"}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right font-data">
                          {usage}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(agent.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
