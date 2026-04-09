/**
 * PropertyDocz — Subscription Tier Configuration
 *
 * Central source of truth for subscription tiers, pricing, and features.
 * All prices in dollars (display) — stored as cents where needed.
 */

export type SubscriptionTier = "free" | "agent_pro" | "broker_office" | "title_partner";

export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing";

export type CustomerType = "agent" | "lender" | "title_company" | "homeowner" | "other";

export interface TierConfig {
  name: string;
  tier: SubscriptionTier;
  price: number; // monthly price in dollars
  priceCents: number; // monthly price in cents
  packagesPerMonth: number;
  overageDiscount: number; // decimal, e.g. 0.20 = 20%
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    name: "Pay-Per-Order",
    tier: "free",
    price: 0,
    priceCents: 0,
    packagesPerMonth: 0,
    overageDiscount: 0,
    features: ["Basic ordering", "Digital delivery"],
  },
  agent_pro: {
    name: "Agent Pro",
    tier: "agent_pro",
    price: 149,
    priceCents: 14900,
    packagesPerMonth: 3,
    overageDiscount: 0.20,
    features: [
      "3 document packages/mo",
      "20% off overage",
      "Priority processing",
      "Order history",
      "Usage dashboard",
    ],
  },
  broker_office: {
    name: "Broker Office",
    tier: "broker_office",
    price: 399,
    priceCents: 39900,
    packagesPerMonth: 10,
    overageDiscount: 0.25,
    features: [
      "10 document packages/mo",
      "25% off overage",
      "Multiple users",
      "Office-wide tracking",
      "Priority processing",
    ],
  },
  title_partner: {
    name: "Title Partner",
    tier: "title_partner",
    price: 799,
    priceCents: 79900,
    packagesPerMonth: 25,
    overageDiscount: 0.30,
    features: [
      "25 document packages/mo",
      "30% off overage",
      "API access",
      "Bulk ordering",
      "Dedicated support",
    ],
  },
};

export const TIER_ORDER: SubscriptionTier[] = [
  "free",
  "agent_pro",
  "broker_office",
  "title_partner",
];

/** Get display name for a tier slug */
export function getTierName(tier: SubscriptionTier): string {
  return SUBSCRIPTION_TIERS[tier]?.name ?? "Unknown";
}

/** Get formatted price string */
export function getTierPriceLabel(tier: SubscriptionTier): string {
  const config = SUBSCRIPTION_TIERS[tier];
  if (!config || config.price === 0) return "Free";
  return `$${config.price}/mo`;
}

/** Customer type display labels */
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  agent: "Agent",
  lender: "Lender",
  title_company: "Title Co.",
  homeowner: "Homeowner",
  other: "Other",
};

/** Customer type badge colors (Tailwind classes) */
export const CUSTOMER_TYPE_COLORS: Record<CustomerType, { bg: string; text: string }> = {
  agent: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  lender: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
  },
  title_company: {
    bg: "bg-teal-50 dark:bg-teal-900/20",
    text: "text-teal-600 dark:text-teal-400",
  },
  homeowner: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
  },
  other: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-500 dark:text-gray-500",
  },
};

/** Tier badge colors */
export const TIER_COLORS: Record<SubscriptionTier, { bg: string; text: string }> = {
  free: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
  },
  agent_pro: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
  },
  broker_office: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  title_partner: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
  },
};

/** Subscription status config */
export const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { dot: string; label: string }
> = {
  active: { dot: "bg-[#14b8a6]", label: "Active" },
  past_due: { dot: "bg-[#ef4444]", label: "Past Due" },
  cancelled: { dot: "bg-gray-400", label: "Cancelled" },
  trialing: { dot: "bg-[#8b5cf6]", label: "Trial" },
};
