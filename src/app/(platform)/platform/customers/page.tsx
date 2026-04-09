import { getPlatformUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  SUBSCRIPTION_TIERS,
  TIER_ORDER,
  type SubscriptionTier,
  type CustomerType,
} from "@/lib/subscriptions";
import { CustomersClient } from "./customers-client";

export default async function PlatformCustomersPage() {
  await getPlatformUser();
  const supabase = await createServiceClient();

  // ── Fetch all customer accounts ──
  const { data: customers } = await supabase
    .from("customer_account")
    .select("id, email, full_name, phone, company_name, customer_type, license_number, organization_id, created_at")
    .order("created_at", { ascending: false });

  const allCustomers = customers || [];

  // ── Fetch all subscriptions ──
  const { data: subscriptions } = await supabase
    .from("customer_subscription")
    .select("id, customer_id, tier, status, packages_included, packages_used, monthly_price, billing_cycle_start, billing_cycle_end, cancelled_at, created_at")
    .order("created_at", { ascending: false });

  const allSubscriptions = subscriptions || [];

  // Build subscription lookup by customer_id (latest sub per customer)
  const subByCustomer = new Map<string, (typeof allSubscriptions)[number]>();
  for (const sub of allSubscriptions) {
    if (!subByCustomer.has(sub.customer_id)) {
      subByCustomer.set(sub.customer_id, sub);
    }
  }

  // ── Fetch document request stats per customer ──
  const { data: requests } = await supabase
    .from("document_requests")
    .select("id, customer_id, total_price_cents, payment_status, created_at")
    .not("customer_id", "is", null);

  const allRequests = requests || [];

  // Aggregate per customer
  const customerOrders = new Map<string, { count: number; revenue: number; lastOrder: string }>();
  for (const req of allRequests) {
    if (!req.customer_id) continue;
    const existing = customerOrders.get(req.customer_id);
    const rev = req.payment_status === "paid" ? (req.total_price_cents || 0) : 0;
    if (existing) {
      existing.count += 1;
      existing.revenue += rev;
      if (req.created_at > existing.lastOrder) existing.lastOrder = req.created_at;
    } else {
      customerOrders.set(req.customer_id, {
        count: 1,
        revenue: rev,
        lastOrder: req.created_at,
      });
    }
  }

  // Also count orders from document_requests where customer_id is null but email matches
  // This captures legacy/guest orders
  const { data: allDocRequests } = await supabase
    .from("document_requests")
    .select("requester_email, total_price_cents, payment_status, created_at")
    .is("customer_id", null);

  const legacyOrders = new Map<string, { count: number; revenue: number; lastOrder: string }>();
  for (const req of allDocRequests || []) {
    const email = (req.requester_email || "").toLowerCase();
    if (!email) continue;
    const rev = req.payment_status === "paid" ? (req.total_price_cents || 0) : 0;
    const existing = legacyOrders.get(email);
    if (existing) {
      existing.count += 1;
      existing.revenue += rev;
      if (req.created_at > existing.lastOrder) existing.lastOrder = req.created_at;
    } else {
      legacyOrders.set(email, { count: 1, revenue: rev, lastOrder: req.created_at });
    }
  }

  // ── Build customer rows ──
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  interface CustomerRow {
    id: string;
    name: string;
    email: string;
    company: string;
    customerType: CustomerType;
    licenseNumber: string;
    tier: SubscriptionTier;
    subscriptionStatus: string;
    orders: number;
    revenue: number;
    packagesUsed: number;
    packagesIncluded: number;
    lastOrderDate: string;
    memberSince: string;
    isAtRisk: boolean;
  }

  const customerRows: CustomerRow[] = allCustomers.map((c) => {
    const sub = subByCustomer.get(c.id);
    const linked = customerOrders.get(c.id);
    const legacy = legacyOrders.get((c.email || "").toLowerCase());

    const orders = (linked?.count || 0) + (legacy?.count || 0);
    const revenue = (linked?.revenue || 0) + (legacy?.revenue || 0);
    const lastOrder = [linked?.lastOrder, legacy?.lastOrder]
      .filter(Boolean)
      .sort()
      .pop() || "";

    const tier = (sub?.tier || "free") as SubscriptionTier;
    const subStatus = sub?.status || "active";
    const hasSubscription = tier !== "free";
    const isAtRisk = hasSubscription && subStatus === "active" && lastOrder !== "" && lastOrder < thirtyDaysAgo;

    return {
      id: c.id,
      name: c.full_name,
      email: c.email,
      company: c.company_name || "",
      customerType: (c.customer_type || "other") as CustomerType,
      licenseNumber: c.license_number || "",
      tier,
      subscriptionStatus: subStatus,
      orders,
      revenue,
      packagesUsed: sub?.packages_used || 0,
      packagesIncluded: sub?.packages_included || 0,
      lastOrderDate: lastOrder,
      memberSince: c.created_at,
      isAtRisk,
    };
  });

  // ── Compute KPIs ──
  const totalCustomers = customerRows.length;
  const subscribers = customerRows.filter((c) => c.tier !== "free").length;
  const mrr = allSubscriptions
    .filter((s) => s.status === "active" && s.monthly_price > 0)
    .reduce((sum, s) => sum + Number(s.monthly_price), 0);
  const active30d = customerRows.filter(
    (c) => c.lastOrderDate && c.lastOrderDate >= thirtyDaysAgo
  ).length;
  const freeCount = customerRows.filter((c) => c.tier === "free").length;
  const paidCount = customerRows.filter((c) => c.tier !== "free").length;
  const totalRevenue = customerRows.reduce((s, c) => s + c.revenue, 0);
  const avgRevPerCustomer = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

  // ── Tier summary ──
  const tierSummary = TIER_ORDER.map((tierKey) => {
    const config = SUBSCRIPTION_TIERS[tierKey];
    const tiered = tierKey === "free"
      ? customerRows.filter((c) => c.tier === "free")
      : customerRows.filter((c) => c.tier === tierKey);
    const tierMrr = tierKey === "free"
      ? 0
      : allSubscriptions
          .filter((s) => s.tier === tierKey && s.status === "active")
          .reduce((sum, s) => sum + Number(s.monthly_price), 0);

    return {
      tier: tierKey,
      name: config.name,
      price: tierKey === "free" ? "Free" : `$${config.price}/mo`,
      count: tiered.length,
      mrr: tierMrr,
    };
  });

  // ── Churn & at-risk ──
  const recentChurn = customerRows
    .filter((c) => c.subscriptionStatus === "cancelled")
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      tier: c.tier,
      revenue: c.revenue,
    }));

  const atRisk = customerRows
    .filter((c) => c.isAtRisk)
    .slice(0, 5)
    .map((c) => {
      const daysSince = c.lastOrderDate
        ? Math.round((now.getTime() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return {
        name: c.name,
        tier: c.tier,
        lastOrderDate: c.lastOrderDate,
        daysSinceOrder: daysSince,
      };
    });

  // ── Upgrade opportunities ──
  // Free customers with 3+ orders are good upgrade candidates
  const upgradeOpportunities = customerRows
    .filter((c) => c.tier === "free" && c.orders >= 3)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      email: c.email,
      orders: c.orders,
      revenue: c.revenue,
      potentialSavings: Math.round(c.revenue * 0.20), // estimate 20% savings
    }));

  // Subscribers using >80% of packages are candidates for tier upgrade
  const tierUpgradeCandidates = customerRows
    .filter((c) => {
      if (c.tier === "free" || c.tier === "title_partner") return false;
      if (c.packagesIncluded === 0) return false;
      return (c.packagesUsed / c.packagesIncluded) >= 0.80;
    })
    .slice(0, 5)
    .map((c) => ({
      name: c.name,
      currentTier: c.tier,
      packagesUsed: c.packagesUsed,
      packagesIncluded: c.packagesIncluded,
    }));

  // ── Subscription health metrics ──
  const totalPackagesUsed = allSubscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.packages_used || 0), 0);
  const totalPackagesIncluded = allSubscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.packages_included || 0), 0);
  const avgUsagePct = totalPackagesIncluded > 0
    ? Math.round((totalPackagesUsed / totalPackagesIncluded) * 100)
    : 0;
  const pastDueCount = allSubscriptions.filter((s) => s.status === "past_due").length;

  return (
    <CustomersClient
      customers={customerRows}
      kpis={{
        totalCustomers,
        subscribers,
        mrr,
        active30d,
        freeCount,
        paidCount,
        avgRevPerCustomer,
      }}
      tierSummary={tierSummary}
      recentChurn={recentChurn}
      atRisk={atRisk}
      upgradeOpportunities={upgradeOpportunities}
      tierUpgradeCandidates={tierUpgradeCandidates}
      subscriptionHealth={{
        avgUsagePct,
        totalPackagesUsed,
        totalPackagesIncluded,
        pastDueCount,
      }}
    />
  );
}
