/**
 * Order pricing — the numbers on the public order form and the Stripe
 * checkout. Prices and the rush rule come from CLAUDE.md ("Document Types &
 * Pricing"); the payoff exemption is Utah §57-8a-106.
 */
import { describe, expect, it } from "vitest";
import { calculateOrderTotal, DOCUMENT_PRICES, formatCents, RUSH_FEE_CENTS } from "./pricing";

describe("calculateOrderTotal", () => {
  it("prices each document as published", () => {
    expect(calculateOrderTotal(["resale_certificate"], false)).toBe(25000);
    expect(calculateOrderTotal(["payoff_statement"], false)).toBe(5000);
    expect(calculateOrderTotal(["governing_documents"], false)).toBe(15000);
    expect(calculateOrderTotal(["lender_questionnaire"], false)).toBe(19500);
    expect(calculateOrderTotal(["resale_certificate", "governing_documents", "lender_questionnaire", "payoff_statement"], false)).toBe(64500);
  });

  it("adds the rush fee once per order, however many documents", () => {
    expect(calculateOrderTotal(["resale_certificate"], true)).toBe(25000 + RUSH_FEE_CENTS);
    expect(calculateOrderTotal(["resale_certificate", "governing_documents"], true)).toBe(40000 + RUSH_FEE_CENTS);
  });

  it("never adds rush to a standalone payoff statement (fee capped by §57-8a-106)", () => {
    expect(calculateOrderTotal(["payoff_statement"], true)).toBe(5000);
  });

  it("adds rush when a payoff statement rides with a rush-eligible document", () => {
    expect(calculateOrderTotal(["payoff_statement", "resale_certificate"], true)).toBe(30000 + RUSH_FEE_CENTS);
  });

  it("is zero for an empty order", () => {
    expect(calculateOrderTotal([], true)).toBe(0);
  });

  it("keeps the price table and the rush fee at the published values", () => {
    expect(DOCUMENT_PRICES).toEqual({ resale_certificate: 25000, payoff_statement: 5000, governing_documents: 15000, lender_questionnaire: 19500 });
    expect(RUSH_FEE_CENTS).toBe(5000);
  });
});

describe("formatCents", () => {
  it("renders cents as dollars with two decimals", () => {
    expect(formatCents(25000)).toBe("$250.00");
    expect(formatCents(5)).toBe("$0.05");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(123456)).toBe("$1234.56");
  });
});
