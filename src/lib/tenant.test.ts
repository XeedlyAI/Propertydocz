/**
 * Subdomain → tenant slug. Every query in the app is scoped by what this
 * returns, so a wrong answer here is a cross-tenant data exposure.
 */
import { describe, expect, it } from "vitest";
import { getTenantSlugFromHost } from "./tenant";
import { getStatusLabel } from "./status-labels";
import { getTierName, getTierPriceLabel } from "./subscriptions";

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

describe("subscription tier labels", () => {
  it("names and prices the four tiers", () => {
    expect(getTierName("free")).toBe("Pay-Per-Order");
    expect(getTierPriceLabel("free")).toBe("Free");
    expect(getTierPriceLabel("agent_pro")).toBe("$149/mo");
    expect(getTierPriceLabel("broker_office")).toBe("$399/mo");
    expect(getTierPriceLabel("title_partner")).toBe("$799/mo");
  });
});
