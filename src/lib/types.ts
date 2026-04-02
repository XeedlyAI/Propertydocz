// Document types available for ordering
export type DocumentType =
  | "resale_certificate"
  | "payoff_statement"
  | "governing_documents"
  | "lender_questionnaire";

// Turnaround options
export type Turnaround = "standard" | "rush";

// Requester types
export type RequesterType =
  | "agent"
  | "lender"
  | "owner"
  | "title_company"
  | "other";

// Document request workflow statuses
export type RequestStatus =
  | "received"
  | "paid"
  | "awaiting_data"
  | "ready_for_generation"
  | "pending_review"
  | "approved"
  | "delivered"
  | "cancelled";

// Payment statuses
export type PaymentStatus =
  | "pending"
  | "paid"
  | "refunded"
  | "bill_to_closing";

// User roles
export type UserRole = "platform_admin" | "tenant_admin" | "tenant_staff";

// Project types for associations
export type ProjectType = "condo" | "townhome" | "pud" | "co-op";

// Assessment frequency
export type AssessmentFrequency = "monthly" | "quarterly" | "annually";

// Governing document categories
export type GoverningDocCategory =
  | "ccrs"
  | "bylaws"
  | "articles"
  | "rules"
  | "budget"
  | "financial_statement"
  | "reserve_analysis"
  | "insurance_cert"
  | "minutes"
  | "plat"
  | "amendment";

// Document generation methods
export type GenerationMethod = "typst" | "ai_assisted";

// Document source
export type DocumentSource = "dropbox" | "upload";
