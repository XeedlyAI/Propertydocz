// Typed field schemas for each document type used in document generation

export interface DocumentField {
  key: string;
  label: string;
  source: "association" | "per_transaction";
  required: boolean;
  dataType: "text" | "currency" | "date" | "boolean" | "percentage";
}

export interface DocumentSchema {
  type: string;
  label: string;
  upload_only?: boolean;
  fields: DocumentField[];
}

// ---------------------------------------------------------------------------
// Shared field definitions
// ---------------------------------------------------------------------------

const ASSOCIATION_CORE_FIELDS: DocumentField[] = [
  { key: "association_name", label: "Association Name", source: "association", required: false, dataType: "text" },
  { key: "association_address", label: "Association Address", source: "association", required: false, dataType: "text" },
  { key: "monthly_assessment", label: "Monthly Assessment", source: "association", required: false, dataType: "currency" },
  { key: "assessment_frequency", label: "Assessment Frequency", source: "association", required: false, dataType: "text" },
  { key: "special_assessments_planned", label: "Special Assessments Planned", source: "association", required: false, dataType: "boolean" },
  { key: "special_assessment_details", label: "Special Assessment Details", source: "association", required: false, dataType: "text" },
  { key: "transfer_fee", label: "Transfer Fee", source: "association", required: false, dataType: "currency" },
  { key: "capital_contribution", label: "Capital Contribution", source: "association", required: false, dataType: "currency" },
  { key: "in_litigation", label: "In Litigation", source: "association", required: false, dataType: "boolean" },
  { key: "litigation_details", label: "Litigation Details", source: "association", required: false, dataType: "text" },
  { key: "master_policy_carrier", label: "Master Policy Carrier", source: "association", required: false, dataType: "text" },
  { key: "master_policy_expiration", label: "Master Policy Expiration", source: "association", required: false, dataType: "date" },
  { key: "general_liability", label: "General Liability", source: "association", required: false, dataType: "currency" },
  { key: "fidelity_bond", label: "Fidelity Bond", source: "association", required: false, dataType: "currency" },
  { key: "reserve_balance", label: "Reserve Balance", source: "association", required: false, dataType: "currency" },
  { key: "percent_funded", label: "Percent Funded", source: "association", required: false, dataType: "percentage" },
  { key: "reserve_study_date", label: "Reserve Study Date", source: "association", required: false, dataType: "date" },
  { key: "right_of_first_refusal", label: "Right of First Refusal", source: "association", required: false, dataType: "text" },
  { key: "rental_policy", label: "Rental Policy", source: "association", required: false, dataType: "text" },
  { key: "pet_policy", label: "Pet Policy", source: "association", required: false, dataType: "text" },
  { key: "parking_policy", label: "Parking Policy", source: "association", required: false, dataType: "text" },
  { key: "age_restrictions", label: "Age Restrictions", source: "association", required: false, dataType: "text" },
  { key: "total_units", label: "Total Units", source: "association", required: false, dataType: "text" },
  { key: "percent_owner_occupied", label: "Percent Owner Occupied", source: "association", required: false, dataType: "percentage" },
];

// ---------------------------------------------------------------------------
// Document schemas
// ---------------------------------------------------------------------------

export const DOCUMENT_SCHEMAS: Record<string, DocumentSchema> = {
  resale_certificate: {
    type: "resale_certificate",
    label: "Resale Certificate",
    fields: [
      ...ASSOCIATION_CORE_FIELDS,
      // Per-transaction fields
      { key: "owner_names", label: "Owner Name(s)", source: "per_transaction", required: true, dataType: "text" },
      { key: "property_address", label: "Property Address", source: "per_transaction", required: true, dataType: "text" },
      { key: "unit_lot_number", label: "Unit / Lot Number", source: "per_transaction", required: false, dataType: "text" },
      { key: "closing_date", label: "Closing Date", source: "per_transaction", required: true, dataType: "date" },
      { key: "balance_due", label: "Balance Due", source: "per_transaction", required: false, dataType: "currency" },
      { key: "special_assessments_due", label: "Special Assessments Due", source: "per_transaction", required: false, dataType: "currency" },
      { key: "violations", label: "Violations", source: "per_transaction", required: false, dataType: "text" },
      { key: "preparation_date", label: "Preparation Date", source: "per_transaction", required: true, dataType: "date" },
      { key: "valid_through_date", label: "Valid Through Date", source: "per_transaction", required: true, dataType: "date" },
      { key: "preparer_name", label: "Preparer Name", source: "per_transaction", required: true, dataType: "text" },
      { key: "preparer_title", label: "Preparer Title", source: "per_transaction", required: false, dataType: "text" },
    ],
  },

  payoff_statement: {
    type: "payoff_statement",
    label: "Payoff Statement",
    fields: [
      // Association fields (subset)
      { key: "association_name", label: "Association Name", source: "association", required: false, dataType: "text" },
      { key: "transfer_fee", label: "Transfer Fee", source: "association", required: false, dataType: "currency" },
      { key: "payment_mail_address", label: "Payment Mail Address", source: "association", required: false, dataType: "text" },
      // Per-transaction fields
      { key: "owner_names", label: "Owner Name(s)", source: "per_transaction", required: true, dataType: "text" },
      { key: "property_address", label: "Property Address", source: "per_transaction", required: true, dataType: "text" },
      { key: "unit_lot_number", label: "Unit / Lot Number", source: "per_transaction", required: false, dataType: "text" },
      { key: "closing_date", label: "Closing Date", source: "per_transaction", required: true, dataType: "date" },
      { key: "current_balance_due", label: "Current Balance Due", source: "per_transaction", required: true, dataType: "currency" },
      { key: "delinquent_balance", label: "Delinquent Balance", source: "per_transaction", required: false, dataType: "currency" },
      { key: "late_fees", label: "Late Fees", source: "per_transaction", required: false, dataType: "currency" },
      { key: "attorney_fees", label: "Attorney Fees", source: "per_transaction", required: false, dataType: "currency" },
      { key: "special_assessments_due", label: "Special Assessments Due", source: "per_transaction", required: false, dataType: "currency" },
      { key: "other_fees", label: "Other Fees", source: "per_transaction", required: false, dataType: "currency" },
      { key: "prorated_assessment", label: "Prorated Assessment", source: "per_transaction", required: false, dataType: "currency" },
      { key: "total_due_at_closing", label: "Total Due at Closing", source: "per_transaction", required: true, dataType: "currency" },
      { key: "per_diem_amount", label: "Per Diem Amount", source: "per_transaction", required: false, dataType: "currency" },
      { key: "statement_valid_through", label: "Statement Valid Through", source: "per_transaction", required: false, dataType: "date" },
      { key: "preparation_date", label: "Preparation Date", source: "per_transaction", required: true, dataType: "date" },
      { key: "preparer_name", label: "Preparer Name", source: "per_transaction", required: true, dataType: "text" },
    ],
  },

  lender_questionnaire: {
    type: "lender_questionnaire",
    label: "Lender Questionnaire",
    fields: [
      ...ASSOCIATION_CORE_FIELDS,
      // Per-transaction fields
      { key: "units_delinquent_over_60", label: "Units Delinquent Over 60 Days", source: "per_transaction", required: false, dataType: "text" },
      { key: "total_delinquency_amount", label: "Total Delinquency Amount", source: "per_transaction", required: false, dataType: "currency" },
      { key: "preparation_date", label: "Preparation Date", source: "per_transaction", required: true, dataType: "date" },
      { key: "preparer_name", label: "Preparer Name", source: "per_transaction", required: true, dataType: "text" },
      { key: "preparer_title", label: "Preparer Title", source: "per_transaction", required: false, dataType: "text" },
    ],
  },

  governing_documents: {
    type: "governing_documents",
    label: "Governing Documents",
    upload_only: true,
    fields: [],
  },

  status_letter: {
    type: "status_letter",
    label: "Status Letter",
    fields: [
      // Association fields (subset)
      { key: "association_name", label: "Association Name", source: "association", required: false, dataType: "text" },
      { key: "monthly_assessment", label: "Monthly Assessment", source: "association", required: false, dataType: "currency" },
      { key: "transfer_fee", label: "Transfer Fee", source: "association", required: false, dataType: "currency" },
      { key: "capital_contribution", label: "Capital Contribution", source: "association", required: false, dataType: "currency" },
      { key: "special_assessments_planned", label: "Special Assessments Planned", source: "association", required: false, dataType: "boolean" },
      // Per-transaction fields
      { key: "owner_names", label: "Owner Name(s)", source: "per_transaction", required: true, dataType: "text" },
      { key: "property_address", label: "Property Address", source: "per_transaction", required: true, dataType: "text" },
      { key: "closing_date", label: "Closing Date", source: "per_transaction", required: false, dataType: "date" },
      { key: "preparation_date", label: "Preparation Date", source: "per_transaction", required: true, dataType: "date" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Look up a document schema by type key.
 * Returns null if the type is not recognized.
 */
export function getDocumentSchema(documentType: string): DocumentSchema | null {
  return DOCUMENT_SCHEMAS[documentType] ?? null;
}

/**
 * Return only the required fields for a given document type filtered by source.
 * Useful for building validation rules or highlighting mandatory inputs.
 */
export function getRequiredFields(
  documentType: string,
  source: "association" | "per_transaction",
): DocumentField[] {
  const schema = getDocumentSchema(documentType);
  if (!schema) return [];
  return schema.fields.filter((f) => f.required && f.source === source);
}
