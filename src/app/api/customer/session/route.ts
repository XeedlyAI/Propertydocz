import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/customer/session?userId=...
 *
 * Returns customer account + subscription info for a signed-in user.
 * Called after successful auth to populate the order form.
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Fetch customer account by user_id
  const { data: customer } = await supabase
    .from("customer_account")
    .select("id, email, full_name, phone, company_name, customer_type")
    .eq("user_id", userId)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "No customer account found" }, { status: 404 });
  }

  // Fetch active subscription
  const { data: subscription } = await supabase
    .from("customer_subscription")
    .select(
      "id, tier, status, packages_included, packages_used, overage_discount_percent, billing_cycle_end"
    )
    .eq("customer_id", customer.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    customerId: customer.id,
    userId,
    name: customer.full_name,
    email: customer.email,
    phone: customer.phone || "",
    company: customer.company_name || "",
    customerType: customer.customer_type || "agent",
    subscriptionId: subscription?.id || null,
    subscriptionTier: subscription?.tier || null,
    subscriptionStatus: subscription?.status || null,
    packagesUsed: subscription?.packages_used || 0,
    packagesIncluded: subscription?.packages_included || 0,
    overageDiscount: subscription?.overage_discount_percent || 0,
    billingCycleEnd: subscription?.billing_cycle_end || null,
  });
}
