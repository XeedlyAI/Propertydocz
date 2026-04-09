import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/customer/lookup?email=...
 *
 * Checks if a customer account exists for the given email.
 * Returns minimal info — enough to prompt sign-in or account creation.
 * Does NOT return sensitive data.
 */
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ exists: false });
  }

  const supabase = await createServiceClient();

  // Look up customer account
  const { data: customer } = await supabase
    .from("customer_account")
    .select("id, user_id, customer_type")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!customer) {
    return NextResponse.json({ exists: false });
  }

  const hasPassword = !!customer.user_id;

  // Check for active subscription
  let hasSubscription = false;
  let subscriptionTier: string | null = null;

  if (customer.id) {
    const { data: sub } = await supabase
      .from("customer_subscription")
      .select("tier, status")
      .eq("customer_id", customer.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (sub && sub.tier !== "free") {
      hasSubscription = true;
      subscriptionTier = sub.tier;
    }
  }

  // Build hint message
  let hint = "";
  if (hasPassword && hasSubscription) {
    hint = `Sign in to use your ${subscriptionTier === "agent_pro" ? "Agent Pro" : subscriptionTier === "broker_office" ? "Broker Office" : subscriptionTier === "title_partner" ? "Title Partner" : ""} subscription`;
  } else if (hasPassword) {
    hint = "Sign in to access your order history";
  } else {
    hint = "Create a password to manage your account";
  }

  return NextResponse.json({
    exists: true,
    hasPassword,
    hasSubscription,
    subscriptionTier,
    hint,
  });
}
