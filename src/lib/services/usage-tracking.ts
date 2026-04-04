/**
 * PropertyDocz — Usage Tracking Service
 *
 * Tracks document package usage against membership tier limits.
 * Determines if an order is included or overage, and calculates
 * discounted pricing for overage orders.
 */

import { createServiceClient } from "@/lib/supabase/server";

export interface UsageStatus {
  agent_account_id: string;
  tier_slug: string;
  included_packages: number;
  used_this_period: number;
  remaining: number;
  is_included: boolean;
  overage_discount_percent: number;
  period_start: string;
  period_end: string;
}

/**
 * Check an agent's usage for the current billing period.
 * Returns whether the next order would be included or overage.
 */
export async function checkAgentUsage(
  agentAccountId: string
): Promise<UsageStatus | null> {
  const supabase = await createServiceClient();

  // Fetch agent account with tier
  const { data: agent } = await supabase
    .from("agent_accounts")
    .select(
      "id, tier_id, current_period_start, current_period_end, subscription_status"
    )
    .eq("id", agentAccountId)
    .single();

  if (!agent) return null;

  // Fetch tier details
  const { data: tier } = await supabase
    .from("membership_tiers")
    .select("slug, included_packages, overage_discount_percent")
    .eq("id", agent.tier_id)
    .single();

  if (!tier) return null;

  // For free tier or no active period, everything is standard pricing
  if (!agent.current_period_start || !agent.current_period_end) {
    return {
      agent_account_id: agentAccountId,
      tier_slug: tier.slug,
      included_packages: tier.included_packages,
      used_this_period: 0,
      remaining: tier.included_packages,
      is_included: tier.included_packages > 0,
      overage_discount_percent: tier.overage_discount_percent,
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
    };
  }

  // Count usage in current period
  const { count } = await supabase
    .from("document_usage")
    .select("id", { count: "exact", head: true })
    .eq("agent_account_id", agentAccountId)
    .gte("period_start", agent.current_period_start)
    .lte("period_end", agent.current_period_end);

  const used = count || 0;
  const remaining = Math.max(0, tier.included_packages - used);

  return {
    agent_account_id: agentAccountId,
    tier_slug: tier.slug,
    included_packages: tier.included_packages,
    used_this_period: used,
    remaining,
    is_included: remaining > 0,
    overage_discount_percent: tier.overage_discount_percent,
    period_start: agent.current_period_start,
    period_end: agent.current_period_end,
  };
}

/**
 * Record usage for a document request.
 * Should be called after a document request is created and paid.
 */
export async function recordUsage(
  agentAccountId: string,
  requestId: string
): Promise<{ is_included: boolean; discount_percent: number } | null> {
  const usage = await checkAgentUsage(agentAccountId);
  if (!usage) return null;

  const supabase = await createServiceClient();

  const { error } = await supabase.from("document_usage").insert({
    agent_account_id: agentAccountId,
    request_id: requestId,
    period_start: usage.period_start,
    period_end: usage.period_end,
    is_included: usage.is_included,
    overage_discount_percent: usage.is_included
      ? 0
      : usage.overage_discount_percent,
  });

  if (error) {
    // Might be a duplicate — that's OK
    if (error.code === "23505") {
      console.warn("Usage already recorded for request:", requestId);
      return { is_included: usage.is_included, discount_percent: 0 };
    }
    console.error("Failed to record usage:", error);
    return null;
  }

  return {
    is_included: usage.is_included,
    discount_percent: usage.is_included ? 0 : usage.overage_discount_percent,
  };
}

/**
 * Calculate the discounted price for an overage order.
 */
export function calculateOveragePrice(
  basePriceCents: number,
  discountPercent: number
): number {
  if (discountPercent <= 0) return basePriceCents;
  return Math.round(basePriceCents * (1 - discountPercent / 100));
}

/**
 * Find agent account by user email and tenant.
 * Used in checkout to link orders to agent accounts.
 */
export async function findAgentByEmail(
  email: string,
  tenantId: string
): Promise<string | null> {
  const supabase = await createServiceClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .eq("tenant_id", tenantId)
    .eq("role", "agent")
    .single();

  if (!profile) return null;

  const { data: agent } = await supabase
    .from("agent_accounts")
    .select("id")
    .eq("user_id", profile.id)
    .eq("tenant_id", tenantId)
    .single();

  return agent?.id || null;
}
