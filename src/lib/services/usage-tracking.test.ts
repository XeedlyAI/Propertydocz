/**
 * Overage pricing on the membership_tiers path, where the discount is a
 * WHOLE PERCENT (20 = 20%). Contrast calculateOrderPricing, which takes a
 * fraction. Both pinned as written; reconciling the units is a follow-up.
 */
import { describe, expect, it } from "vitest";
import { calculateOveragePrice } from "./usage-tracking";

describe("calculateOveragePrice", () => {
  it("applies a whole-percent discount and rounds to cents", () => {
    expect(calculateOveragePrice(25000, 20)).toBe(20000);
    expect(calculateOveragePrice(19500, 30)).toBe(13650);
    expect(calculateOveragePrice(19501, 25)).toBe(14626);
  });

  it("returns the base price for zero or negative discounts", () => {
    expect(calculateOveragePrice(25000, 0)).toBe(25000);
    expect(calculateOveragePrice(25000, -5)).toBe(25000);
  });
});
