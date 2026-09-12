/**
 * Subdomain → tenant slug. Every query in the app is scoped by what this
 * returns, so a wrong answer here is a cross-tenant data exposure.
 */
import { describe, expect, it } from "vitest";
import { getTenantSlugFromHost } from "./tenant";
import { getStatusLabel } from "./status-labels";
import { getTierName, getTierPriceLabel, overageDiscountFraction, overageDiscountPercent } from "./subscriptions";

describe("getTenantSlugFromHost", () => {
  it.each([
    ["corehoa.propertydocz.com", "corehoa"],
    ["corehoa.propertydocz.com:3000", "corehoa"],
    ["www.propertydocz.com", null],
    ["propertydocz.com", null],
    ["localhost:3000", null],
    ["127.0.0.1", null],
    ["evil-propertydocz.com", null], // not a subdomain — no dot before the app domain
    ["corehoa.propertydocz.com.attacker.net", null],
    ["a.b.propertydocz.com", "a.b"], // nested labels come back whole; the DB lookup decides
  ])("%s → %s", (host, slug) => {
    expect(getTenantSlugFromHost(host)).toBe(slug);
  });
});

describe("getStatusLabel", () => {
  it("maps every workflow status to its display label and title-cases unknown ones", () => {
    expect(getStatusLabel("awaiting_data")).toBe("Needs Details");
    expect(getStatusLabel("ready_for_generation")).toBe("Ready to Generate");
    expect(getStatusLabel("delivered")).toBe("Delivered");
    expect(getStatusLabel("some_new_state")).toBe("Some New State");
  });
});

describe("overage discount units", () => {
  it("reads whole percents and legacy fractions to the same fraction", () => {
    expect(overageDiscountFraction(20)).toBe(0.2);
    expect(overageDiscountFraction(0.2)).toBe(0.2);
    expect(overageDiscountFraction(1)).toBe(1); // 100% stored as a fraction of 1 — the boundary reads as fraction
    expect(overageDiscountFraction(0)).toBe(0);
    expect(overageDiscountFraction(null)).toBe(0);
    expect(overageDiscountFraction(NaN)).toBe(0);
    expect(overageDiscountPercent(0.25)).toBe(25);
    expect(overageDiscountPercent(30)).toBe(30);
  });
});

describe("subscription tier labels", () => {
  it("names and prices the four tiers", () => {
    expect(getTierName("free")).toBe("Pay-Per-Order");
    expect(getTierPriceLabel("free")).toBe("Free");
    expect(getTierPriceLabel("agent_pro")).toBe("$149/mo");
    expect(getTierPriceLabel("broker_office")).toBe("$399/mo");
    expect(getTierPriceLabel("title_partner")).toBe("$799/mo");
  });
});
