import type { DocumentType } from "./types";

// All prices in cents
export const DOCUMENT_PRICES: Record<DocumentType, number> = {
  resale_certificate: 9900,
  payoff_statement: 1500,
  governing_documents: 3500,
  lender_questionnaire: 9500,
};

export const RUSH_FEE_CENTS = 5000; // $50, applied once per order

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
  return documentTotal + (isRush ? RUSH_FEE_CENTS : 0);
}

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
