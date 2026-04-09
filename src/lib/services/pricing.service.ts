/**
 * PropertyDocz — Subscription-Aware Pricing Service
 *
 * Calculates order pricing based on customer subscription status.
 * Handles three scenarios: standard (no sub), subscription (covered), overage (discounted).
 */

import { getTierName, type SubscriptionTier } from "@/lib/subscriptions";

export interface SubscriptionInfo {
  id: string;
  tier: SubscriptionTier;
  status: string;
  packages_included: number;
  packages_used: number;
  overage_discount_percent: number;
  billing_cycle_start: string | null;
  billing_cycle_end: string | null;
}

export interface PricingResult {
  originalPrice: number; // cents
  finalPrice: number; // cents
  discountAmount: number; // cents
  pricingType: "standard" | "subscription" | "overage";
  message: string | null;
  packagesUsed: number;
  packagesIncluded: number;
  coverageStatus: "covered" | "overage" | "standard";
}

/**
 * Calculate order pricing based on subscription status.
 *
 * @param basePriceCents - the total order price in cents before any subscription adjustments
 * @param subscription - the customer's active subscription (null if none/free)
 */
export function calculateOrderPricing(
  basePriceCents: number,
  subscription: SubscriptionInfo | null
): PricingResult {
  // No subscription or free tier → standard pricing
  if (!subscription || subscription.tier === "free" || subscription.status !== "active") {
    return {
      originalPrice: basePriceCents,
      finalPrice: basePriceCents,
      discountAmount: 0,
      pricingType: "standard",
      message: null,
      packagesUsed: 0,
      packagesIncluded: 0,
      coverageStatus: "standard",
    };
  }

  const remaining = subscription.packages_included - subscription.packages_used;
  const tierName = getTierName(subscription.tier);

  // Has packages remaining — order is fully covered
  if (remaining > 0) {
    return {
      originalPrice: basePriceCents,
      finalPrice: 0,
      discountAmount: basePriceCents,
      pricingType: "subscription",
      message: `Covered by your ${tierName} plan (${subscription.packages_used + 1} of ${subscription.packages_included} this month)`,
      packagesUsed: subscription.packages_used + 1,
      packagesIncluded: subscription.packages_included,
      coverageStatus: "covered",
    };
  }

  // At limit — apply overage discount
  const discountRate = subscription.overage_discount_percent;
  const discountAmount = Math.round(basePriceCents * discountRate);
  const finalPrice = basePriceCents - discountAmount;

  return {
    originalPrice: basePriceCents,
    finalPrice,
    discountAmount,
    pricingType: "overage",
    message: `All ${subscription.packages_included} packages used. ${Math.round(discountRate * 100)}% overage discount applied.`,
    packagesUsed: subscription.packages_used + 1,
    packagesIncluded: subscription.packages_included,
    coverageStatus: "overage",
  };
}
