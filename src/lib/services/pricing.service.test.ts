/**
 * Subscription-aware pricing at checkout. The discount here is a FRACTION
 * (0.20 = 20%) because the Stripe webhook copies SUBSCRIPTION_TIERS[tier]
 * .overageDiscount into customer_subscriptions.overage_discount_percent.
 * (The older membership_tiers path stores whole percents and uses
 * calculateOveragePrice — see usage-tracking.test.ts. Two conventions,
 * flagged 2026-09-11.)
 */
import { describe, expect, it } from "vitest";
import { calculateOrderPricing, type SubscriptionInfo } from "./pricing.service";

const sub = (o: Partial<SubscriptionInfo> = {}): SubscriptionInfo => ({
  id: "s1",
  tier: "agent_pro",
  status: "active",
  packages_included: 3,
  packages_used: 0,
  overage_discount_percent: 0.2,
  billing_cycle_start: null,
  billing_cycle_end: null,
  ...o,
});

describe("calculateOrderPricing", () => {
  it("charges standard price with no subscription, a free tier, or an inactive subscription", () => {
    const standard = { originalPrice: 25000, finalPrice: 25000, discountAmount: 0, pricingType: "standard", message: null, packagesUsed: 0, packagesIncluded: 0, coverageStatus: "standard" };
    expect(calculateOrderPricing(25000, null)).toEqual(standard);
    expect(calculateOrderPricing(25000, sub({ tier: "free" }))).toEqual(standard);
    expect(calculateOrderPricing(25000, sub({ status: "past_due" }))).toEqual(standard);
  });

  it("covers the order entirely while packages remain, counting this order", () => {
    expect(calculateOrderPricing(25000, sub({ packages_used: 2 }))).toEqual({
      originalPrice: 25000,
      finalPrice: 0,
      discountAmount: 25000,
      pricingType: "subscription",
      message: "Covered by your Agent Pro plan (3 of 3 this month)",
      packagesUsed: 3,
      packagesIncluded: 3,
      coverageStatus: "covered",
    });
  });

  it("applies the tier's overage discount once the allowance is used up", () => {
    expect(calculateOrderPricing(25000, sub({ packages_used: 3 }))).toEqual({
      originalPrice: 25000,
      finalPrice: 20000,
      discountAmount: 5000,
      pricingType: "overage",
      message: "All 3 packages used. 20% overage discount applied.",
      packagesUsed: 4,
      packagesIncluded: 3,
      coverageStatus: "overage",
    });
    expect(calculateOrderPricing(19500, sub({ tier: "title_partner", packages_included: 25, packages_used: 30, overage_discount_percent: 0.3 }))).toMatchObject({
      finalPrice: 13650,
      discountAmount: 5850,
      message: "All 25 packages used. 30% overage discount applied.",
    });
  });

  it("rounds the discount to whole cents", () => {
    expect(calculateOrderPricing(19501, sub({ packages_used: 3, overage_discount_percent: 0.25 }))).toMatchObject({ discountAmount: 4875, finalPrice: 14626 });
  });
});
