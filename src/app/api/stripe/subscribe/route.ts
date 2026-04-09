import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscriptions";

/**
 * Stripe Price ID mapping — set these in environment variables.
 * Create products + prices in the Stripe Dashboard first.
 */
const STRIPE_PRICE_IDS: Partial<Record<SubscriptionTier, string>> = {
  agent_pro: process.env.STRIPE_PRICE_AGENT_PRO || "",
  broker_office: process.env.STRIPE_PRICE_BROKER_OFFICE || "",
  title_partner: process.env.STRIPE_PRICE_TITLE_PARTNER || "",
};

/**
 * POST /api/stripe/subscribe
 *
 * Creates a Stripe Checkout Session for a subscription.
 * Body: { tier: SubscriptionTier, customerId: string }
 *
 * Returns: { checkoutUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, customerId } = body as {
      tier: SubscriptionTier;
      customerId: string;
    };

    // Validate tier
    if (!tier || !SUBSCRIPTION_TIERS[tier] || tier === "free") {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const stripePriceId = STRIPE_PRICE_IDS[tier];
    if (!stripePriceId) {
      return NextResponse.json(
        { error: "Stripe pricing not configured for this tier. Contact support." },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Fetch customer account
    const { data: customer } = await supabase
      .from("customer_account")
      .select("id, email, full_name")
      .eq("id", customerId)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check for existing active subscription
    const { data: existingSub } = await supabase
      .from("customer_subscription")
      .select("id, tier, status, stripe_customer_id")
      .eq("customer_id", customerId)
      .eq("status", "active")
      .single();

    const stripe = getStripe();

    // Get or create Stripe Customer
    let stripeCustomerId = existingSub?.stripe_customer_id;

    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.full_name,
        metadata: { customer_account_id: customerId },
      });
      stripeCustomerId = stripeCustomer.id;
    }

    // Build URLs
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "propertydocz.com";
    const baseUrl = `${proto}://${host}`;

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      metadata: {
        customer_account_id: customerId,
        tier,
      },
      subscription_data: {
        metadata: {
          customer_account_id: customerId,
          tier,
        },
      },
      success_url: `${baseUrl}/account?subscribed=true`,
      cancel_url: `${baseUrl}/pricing?cancelled=true`,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to create subscription checkout" },
      { status: 500 }
    );
  }
}
