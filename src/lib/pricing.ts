import type { DocumentType } from "./types";

// All prices in cents
export const DOCUMENT_PRICES: Record<DocumentType, number> = {
  resale_certificate: 25000,
  payoff_statement: 5000,
  governing_documents: 15000,
  lender_questionnaire: 19500,
};

export const RUSH_FEE_CENTS = 5000; // $50, applied once per order

// Payoff statement is capped at $50 by Utah §57-8a-106 — rush fee cannot be added
export const RUSH_EXEMPT_TYPES: DocumentType[] = ["payoff_statement"];

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  resale_certificate: "Resale Certificate",
  payoff_statement: "Payoff Statement",
  governing_documents: "Governing Documents",
  lender_questionnaire: "Lender Questionnaire",
};

export function calculateOrderTotal(
  documentTypes: DocumentType[],
  isRush: boolean
): number {
  const documentTotal = documentTypes.reduce(
    (sum, type) => sum + DOCUMENT_PRICES[type],
    0
  );
  // Rush fee only applies if at least one non-exempt document is in the order
  const hasRushEligible = documentTypes.some(
    (t) => !RUSH_EXEMPT_TYPES.includes(t)
  );
  return documentTotal + (isRush && hasRushEligible ? RUSH_FEE_CENTS : 0);
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
