import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { AccountClient } from "./account-client";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const service = await createServiceClient();

  // Fetch customer account
  const { data: customer } = await service
    .from("customer_account")
    .select("id, email, full_name, phone, company_name, customer_type, created_at")
    .eq("user_id", user.id)
    .single();

  if (!customer) {
    // Auth user exists but no customer account — redirect to home
    redirect("/");
  }

  // Fetch active subscription
  const { data: subscription } = await service
    .from("customer_subscription")
    .select(
      "id, tier, status, packages_included, packages_used, monthly_price, billing_cycle_start, billing_cycle_end, overage_discount_percent, stripe_customer_id, created_at"
    )
    .eq("customer_id", customer.id)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch recent orders
  const { data: orders } = await service
    .from("document_requests")
    .select(
      "id, property_address, document_types, total_price_cents, payment_status, pricing_type, status, created_at"
    )
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Aggregate stats
  const { data: allOrders } = await service
    .from("document_requests")
    .select("total_price_cents, payment_status")
    .eq("customer_id", customer.id);

  const totalOrders = allOrders?.length || 0;
  const totalSpent = (allOrders || [])
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + (o.total_price_cents || 0), 0);

  return (
    <AccountClient
      customer={{
        name: customer.full_name,
        email: customer.email,
        phone: customer.phone || "",
        company: customer.company_name || "",
        customerType: customer.customer_type,
        memberSince: customer.created_at,
      }}
      subscription={
        subscription
          ? {
              id: subscription.id,
              tier: subscription.tier,
              status: subscription.status,
              packagesIncluded: subscription.packages_included,
              packagesUsed: subscription.packages_used,
              monthlyPrice: subscription.monthly_price,
              billingCycleEnd: subscription.billing_cycle_end,
              overageDiscount: subscription.overage_discount_percent,
              stripeCustomerId: subscription.stripe_customer_id,
            }
          : null
      }
      stats={{
        totalOrders,
        totalSpent,
        memberSince: customer.created_at,
      }}
      recentOrders={(orders || []).map((o) => ({
        id: o.id,
        propertyAddress: o.property_address,
        documentTypes: o.document_types as string[],
        totalCents: o.total_price_cents,
        paymentStatus: o.payment_status,
        pricingType: o.pricing_type || "standard",
        status: o.status,
        createdAt: o.created_at,
      }))}
    />
  );
}
