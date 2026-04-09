import { getAdminUser } from "@/lib/auth";
import { SubscriptionsClient } from "./subscriptions-client";

// Subscription tiers - these will be wired to Stripe later
const TIERS = [
  {
    name: "Pay-Per-Order",
    price: "Free",
    priceCents: 0,
    subscribers: 0,
    packages: 0,
    overageDiscount: "0%",
    mrr: 0,
  },
  {
    name: "Agent Pro",
    price: "$149/mo",
    priceCents: 14900,
    subscribers: 0,
    packages: 3,
    overageDiscount: "20%",
    mrr: 0,
  },
  {
    name: "Broker Office",
    price: "$399/mo",
    priceCents: 39900,
    subscribers: 0,
    packages: 10,
    overageDiscount: "25%",
    mrr: 0,
  },
  {
    name: "Title Partner",
    price: "$799/mo",
    priceCents: 79900,
    subscribers: 0,
    packages: 25,
    overageDiscount: "30%",
    mrr: 0,
  },
];

export default async function SubscriptionsPage() {
  const user = await getAdminUser();

  // TODO: When Stripe subscriptions are wired, fetch real data here:
  // - Query subscriptions table for this tenant
  // - Group by tier, calculate MRR, usage, status
  // - Identify at-risk (no orders in 30+ days) and churned subscribers

  // For now, pass empty/placeholder data
  const totalMRR = TIERS.reduce((s, t) => s + t.mrr, 0);
  const totalSubscribers = TIERS.reduce((s, t) => s + t.subscribers, 0);
  const paidSubscribers = TIERS.filter((t) => t.priceCents > 0).reduce(
    (s, t) => s + t.subscribers,
    0
  );
  const freeUsers = TIERS.find((t) => t.priceCents === 0)?.subscribers || 0;

  return (
    <SubscriptionsClient
      tiers={TIERS}
      kpis={{
        totalSubscribers,
        mrr: totalMRR,
        activeSubscriptions: paidSubscribers,
        freeUsers,
        paidUsers: paidSubscribers,
        avgRevenuePerSubscriber:
          paidSubscribers > 0 ? Math.round(totalMRR / paidSubscribers) : 0,
      }}
      subscribers={[]}
      recentChurn={[]}
      atRisk={[]}
    />
  );
}
