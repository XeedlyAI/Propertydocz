import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  createSubscriptionCheckout,
  createBillingPortalSession,
  updateSubscription,
} from "@/lib/stripe";

/**
 * POST /api/agent/subscription
 * Actions: "checkout" (new subscription), "portal" (manage billing), "change" (upgrade/downgrade)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "agent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const serviceClient = await createServiceClient();

    // Fetch agent account
    const { data: agentAccount } = await serviceClient
      .from("agent_accounts")
      .select("id, tier_id, stripe_customer_id, stripe_subscription_id, subscription_status")
      .eq("user_id", user.id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!agentAccount) {
      return NextResponse.json(
        { error: "Agent account not found" },
        { status: 404 }
      );
    }

    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "localhost:3000";
    const baseUrl = `${proto}://${host}`;

    // === CHECKOUT: Create new subscription ===
    if (action === "checkout") {
      const { tier_slug } = body;

      if (!tier_slug) {
        return NextResponse.json(
          { error: "Missing tier_slug" },
          { status: 400 }
        );
      }

      // Look up the tier
      const { data: tier } = await serviceClient
        .from("membership_tiers")
        .select("id, slug, price_cents, stripe_price_id")
        .eq("slug", tier_slug)
        .eq("is_active", true)
        .single();

      if (!tier) {
        return NextResponse.json(
          { error: "Invalid tier" },
          { status: 400 }
        );
      }

      if (!tier.stripe_price_id) {
        return NextResponse.json(
          { error: "This tier is not available for subscription yet. Contact support." },
          { status: 400 }
        );
      }

      if (tier.price_cents === 0) {
        // Free tier — just update the account
        await serviceClient
          .from("agent_accounts")
          .update({
            tier_id: tier.id,
            subscription_status: "active",
          })
          .eq("id", agentAccount.id);

        return NextResponse.json({ success: true, message: "Switched to free tier" });
      }

      const { url, customerId } = await createSubscriptionCheckout({
        stripePriceId: tier.stripe_price_id,
        agentEmail: user.email || "",
        agentAccountId: agentAccount.id,
        stripeCustomerId: agentAccount.stripe_customer_id || undefined,
        successUrl: `${baseUrl}/agent/dashboard?subscription=success`,
        cancelUrl: `${baseUrl}/agent/account?subscription=cancelled`,
      });

      // Save customer ID if new
      if (!agentAccount.stripe_customer_id) {
        await serviceClient
          .from("agent_accounts")
          .update({ stripe_customer_id: customerId })
          .eq("id", agentAccount.id);
      }

      return NextResponse.json({ url });
    }

    // === PORTAL: Open Stripe billing portal ===
    if (action === "portal") {
      if (!agentAccount.stripe_customer_id) {
        return NextResponse.json(
          { error: "No billing account found. Subscribe to a plan first." },
          { status: 400 }
        );
      }

      const url = await createBillingPortalSession(
        agentAccount.stripe_customer_id,
        `${baseUrl}/agent/account`
      );

      return NextResponse.json({ url });
    }

    // === CHANGE: Upgrade or downgrade subscription ===
    if (action === "change") {
      const { tier_slug } = body;

      if (!agentAccount.stripe_subscription_id) {
        return NextResponse.json(
          { error: "No active subscription to change" },
          { status: 400 }
        );
      }

      const { data: newTier } = await serviceClient
        .from("membership_tiers")
        .select("id, slug, stripe_price_id, price_cents")
        .eq("slug", tier_slug)
        .eq("is_active", true)
        .single();

      if (!newTier || !newTier.stripe_price_id) {
        return NextResponse.json(
          { error: "Invalid tier" },
          { status: 400 }
        );
      }

      // If downgrading to free, cancel subscription
      if (newTier.price_cents === 0) {
        const { getStripe } = await import("@/lib/stripe");
        const stripe = getStripe();
        await stripe.subscriptions.update(agentAccount.stripe_subscription_id, {
          cancel_at_period_end: true,
        });

        // Update tier immediately — subscription stays active until period end
        await serviceClient
          .from("agent_accounts")
          .update({ tier_id: newTier.id })
          .eq("id", agentAccount.id);

        return NextResponse.json({
          success: true,
          message: "Subscription will cancel at end of billing period",
        });
      }

      await updateSubscription(
        agentAccount.stripe_subscription_id,
        newTier.stripe_price_id
      );

      // Update tier
      await serviceClient
        .from("agent_accounts")
        .update({ tier_id: newTier.id })
        .eq("id", agentAccount.id);

      return NextResponse.json({
        success: true,
        message: `Subscription updated to ${newTier.slug}`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Subscription error:", error);
    const message =
      error instanceof Error ? error.message : "Subscription operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
