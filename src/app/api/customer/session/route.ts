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
    .select("id, email, full_name, phone, company_name, customer_type, organization_id")
    .eq("user_id", userId)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "No customer account found" }, { status: 404 });
  }

  // Fetch active individual subscription
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

  // If no individual subscription, check for organization subscription
  // (Broker Office / Title Partner shared pool)
  let orgSubscription = null;
  let orgName = null;

  if (!subscription && customer.organization_id) {
    // Find the org's active subscription via the org owner
    const { data: orgMembers } = await supabase
      .from("customer_account")
      .select("id")
      .eq("organization_id", customer.organization_id);

    if (orgMembers && orgMembers.length > 0) {
      const memberIds = orgMembers.map((m) => m.id);

      const { data: orgSub } = await supabase
        .from("customer_subscription")
        .select(
          "id, tier, status, packages_included, packages_used, overage_discount_percent, billing_cycle_end"
        )
        .in("customer_id", memberIds)
        .in("status", ["active", "trialing"])
        .in("tier", ["broker_office", "title_partner"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (orgSub) {
        orgSubscription = orgSub;

        // Fetch org name
        const { data: org } = await supabase
          .from("organization")
          .select("name")
          .eq("id", customer.organization_id)
          .single();

        orgName = org?.name || null;
      }
    }
  }

  const activeSub = subscription || orgSubscription;
  const isOrgSubscription = !subscription && !!orgSubscription;

  return NextResponse.json({
    customerId: customer.id,
    userId,
    name: customer.full_name,
    email: customer.email,
    phone: customer.phone || "",
    company: customer.company_name || "",
    customerType: customer.customer_type || "agent",
    organizationId: customer.organization_id || null,
    organizationName: orgName,
    subscriptionId: activeSub?.id || null,
    subscriptionTier: activeSub?.tier || null,
    subscriptionStatus: activeSub?.status || null,
    packagesUsed: activeSub?.packages_used || 0,
    packagesIncluded: activeSub?.packages_included || 0,
    overageDiscount: activeSub?.overage_discount_percent || 0,
    billingCycleEnd: activeSub?.billing_cycle_end || null,
    isOrgSubscription,
  });
}
