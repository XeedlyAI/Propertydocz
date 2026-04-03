/**
 * PropertyDocz — Field Registry Types
 *
 * Type definitions for the three-tier data confidence model.
 * Matches the field_definitions, association_field_values,
 * and document_sync_log database tables.
 */

// ========================================
// Enums
// ========================================

/** Data confidence tier — how stable this field's value is */
export type FieldTier = "static" | "periodic" | "transaction";

/** Field value type — determines validation and rendering */
export type FieldValueType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "boolean"
  | "enum"
  | "text_array";

/** Confidence level of a stored field value */
export type FieldConfidence =
  | "verified"
  | "ai_extracted"
  | "stale"
  | "unverified";

/** Source of a field value */
export type FieldSource =
  | "manual"
  | "dropbox_extraction"
  | "onboarding_upload"
  | "admin_confirmed";

/** Association onboarding status */
export type OnboardingStatus = "pending" | "harvesting" | "review" | "complete";

/** Extraction status for synced documents */
export type ExtractionStatus = "pending" | "completed" | "failed";

// ========================================
// Table Types
// ========================================

/** Central field definition from the field_definitions table */
export interface FieldDefinition {
  id: string;
  field_key: string;
  label: string;
  tier: FieldTier;
  value_type: FieldValueType;
  section: string;
  document_types: string[];
  validation_rules: ValidationRules | null;
  staleness_days: number | null;
  extraction_hints: string[] | null;
  display_order: number;
  help_text: string | null;
  created_at: string;
}

/** Validation rules stored as JSON in field_definitions */
export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

/** A stored field value for a specific association */
export interface AssociationFieldValue {
  id: string;
  association_id: string;
  field_key: string;
  value: string | null;
  confidence: FieldConfidence;
  source: string | null;
  source_document: string | null;
  last_verified_at: string | null;
  last_verified_by: string | null;
  previous_value: string | null;
  created_at: string;
  updated_at: string;
}

/** Dropbox sync log entry */
export interface DocumentSyncLog {
  id: string;
  association_id: string;
  dropbox_file_id: string | null;
  dropbox_path: string | null;
  file_name: string | null;
  category: string | null;
  file_hash: string | null;
  last_synced_at: string | null;
  extraction_status: ExtractionStatus;
  extracted_fields: Record<string, string> | null;
  created_at: string;
}

// ========================================
// Composite / Derived Types
// ========================================

/** A field definition enriched with its current value for an association */
export interface FieldWithValue extends FieldDefinition {
  current_value: AssociationFieldValue | null;
  is_stale: boolean;
}

/** AI gap analysis result returned by /api/ai/gap-analysis */
export interface GapAnalysisResult {
  missing_fields: string[];
  stale_fields: string[];
  suspicious_fields: {
    field_key: string;
    current_value: string;
    concern: string;
  }[];
  compliance_flags: string[];
  completeness_score: number;
  recommended_status: "ready_for_review" | "awaiting_data";
  summary: string;
}

// ========================================
// Section metadata for UI grouping
// ========================================

export const FIELD_SECTIONS: Record<string, { label: string; order: number }> = {
  general_info: { label: "General Information", order: 1 },
  management: { label: "Management", order: 2 },
  financials: { label: "Financial Information", order: 3 },
  financials_transaction: { label: "Transaction Financials", order: 4 },
  payment: { label: "Payment Instructions", order: 5 },
  insurance: { label: "Insurance", order: 6 },
  restrictions: { label: "Restrictions & Policies", order: 7 },
  legal: { label: "Legal & Litigation", order: 8 },
  owner_info: { label: "Owner / Property", order: 9 },
  request_info: { label: "Request Information", order: 10 },
  project: { label: "Project Completion & Control", order: 11 },
  ownership: { label: "Ownership Distribution", order: 12 },
  physical: { label: "Environmental & Safety", order: 13 },
  amenities: { label: "Common Area & Services", order: 14 },
  governing_docs: { label: "Document Checklist", order: 15 },
};
