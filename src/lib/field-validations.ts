/**
 * Layer 1 & 2: Client-side field validation rules
 *
 * Layer 1 — Inline warnings: fire on blur for individual fields
 * Layer 2 — Pre-generation gate: run ALL rules before advancing status
 *
 * Rules are advisory (warnings) or blocking (errors).
 * Layer 3 (post-generation AI audit) lives in lib/documents/validate.ts.
 */

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

export interface FieldWarning {
  level: "warn" | "error";
  message: string;
}

export interface ValidationContext {
  /** All transaction field values — dollar amounts for currency fields */
  fieldValues: Record<string, string>;
  /** Association record from DB (raw column values) */
  associationRecord: Record<string, unknown> | null;
  /** Document type being edited */
  docType: string;
}

export interface PreGenCheckResult {
  errors: Array<{ field: string; label: string; message: string }>;
  warnings: Array<{ field: string; label: string; message: string }>;
  passed: boolean;
}

type ValidationRule = (
  value: string,
  ctx: ValidationContext
) => FieldWarning | null;

// ════════════════════════════════════════
// Helpers
// ════════════════════════════════════════

function parseDollars(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[$,]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function getMonthlyAssessmentDollars(
  assoc: Record<string, unknown> | null
): number {
  if (!assoc) return 0;
  const raw = assoc.monthly_assessment_amount;
  if (raw === null || raw === undefined) return 0;
  const cents = Number(raw);
  return isNaN(cents) ? 0 : cents / 100;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ════════════════════════════════════════
// Individual Field Rules
// ════════════════════════════════════════

const FIELD_RULES: Record<string, ValidationRule[]> = {
  // ── Late Fees: Utah HB 217 cap ──
  late_fees: [
    (value, ctx) => {
      const amount = parseDollars(value);
      if (amount <= 0) return null;

      // HB 217: late fee cannot exceed the greater of $50 or 10% of past-due amount
      const pastDue = parseDollars(ctx.fieldValues.delinquent_balance || "");
      const cap = Math.max(50, pastDue * 0.1);

      if (amount > cap) {
        return {
          level: "warn",
          message: `$${amount.toFixed(2)} may exceed HB 217 cap of $${cap.toFixed(2)} (greater of $50 or 10% of past-due)`,
        };
      }
      return null;
    },
  ],

  // ── Per Diem Amount ──
  per_diem_amount: [
    (value, ctx) => {
      const amount = parseDollars(value);
      if (amount <= 0) return null;

      const monthly = getMonthlyAssessmentDollars(ctx.associationRecord);
      if (monthly <= 0) return null;

      const expected = monthly / 30;
      // Flag if more than 50% higher than expected
      if (amount > expected * 1.5) {
        return {
          level: "warn",
          message: `$${amount.toFixed(2)}/day seems high for $${monthly.toFixed(2)}/mo assessment (expected ~$${expected.toFixed(2)})`,
        };
      }
      return null;
    },
  ],

  // ── Delinquent Balance ──
  delinquent_balance: [
    (value, ctx) => {
      const amount = parseDollars(value);
      if (amount <= 0) return null;

      const monthly = getMonthlyAssessmentDollars(ctx.associationRecord);
      if (monthly <= 0) return null;

      const months = amount / monthly;
      if (months > 24) {
        return {
          level: "warn",
          message: `$${amount.toLocaleString()} is ${Math.round(months)} months delinquent — verify this amount`,
        };
      }
      return null;
    },
  ],

  // ── Current Balance Due ──
  current_balance_due: [
    (value, ctx) => {
      const amount = parseDollars(value);
      if (amount <= 0) return null;

      const monthly = getMonthlyAssessmentDollars(ctx.associationRecord);
      if (monthly <= 0) return null;

      if (amount > monthly * 12) {
        return {
          level: "warn",
          message: `$${amount.toLocaleString()} exceeds 12 months of assessments — verify`,
        };
      }
      return null;
    },
  ],

  // ── Attorney Fees ──
  attorney_fees: [
    (value) => {
      const amount = parseDollars(value);
      if (amount > 5000) {
        return {
          level: "warn",
          message: `$${amount.toLocaleString()} is unusually high for attorney fees`,
        };
      }
      return null;
    },
  ],

  // ── Other Fees ──
  other_fees: [
    (value) => {
      const amount = parseDollars(value);
      if (amount > 1000) {
        return {
          level: "warn",
          message: `$${amount.toLocaleString()} in other fees — add detail in special notes`,
        };
      }
      return null;
    },
  ],

  // ── Special Assessments Due ──
  special_assessments_due: [
    (value, ctx) => {
      const amount = parseDollars(value);
      if (amount <= 0) return null;

      // Check if association has special assessments planned
      const planned = ctx.associationRecord?.planned_special_assessment;
      if (
        planned === false ||
        planned === "false" ||
        planned === "No" ||
        planned === "no"
      ) {
        return {
          level: "warn",
          message:
            "Association shows no planned special assessments — verify this charge",
        };
      }
      return null;
    },
  ],

  // ── Preparation Date ──
  preparation_date: [
    (value) => {
      if (!value) return null;
      const today = todayStr();
      if (value > today) {
        return {
          level: "warn",
          message: "Preparation date is in the future — should be today or earlier",
        };
      }
      return null;
    },
  ],

  // ── Valid Through Date ──
  valid_through_date: [
    (value) => {
      if (!value) return null;
      const today = todayStr();
      if (value < today) {
        return { level: "error", message: "Valid through date is in the past" };
      }
      return null;
    },
  ],

  // ── Statement Valid Through ──
  statement_valid_through: [
    (value) => {
      if (!value) return null;
      const today = todayStr();
      if (value < today) {
        return { level: "error", message: "Statement valid through date is in the past" };
      }
      return null;
    },
  ],

  // ── Total Due at Closing (manual override check) ──
  total_due_at_closing: [
    (value, ctx) => {
      const entered = parseDollars(value);
      if (entered <= 0) return null;

      // Sum the components
      const components = [
        "current_balance_due",
        "delinquent_balance",
        "late_fees",
        "attorney_fees",
        "special_assessments_due",
        "other_fees",
        "prorated_assessment",
      ];
      const sum = components.reduce(
        (acc, key) => acc + parseDollars(ctx.fieldValues[key] || ""),
        0
      );

      if (sum > 0 && Math.abs(entered - sum) > 0.01) {
        return {
          level: "warn",
          message: `$${entered.toFixed(2)} doesn't match component sum of $${sum.toFixed(2)}`,
        };
      }
      return null;
    },
  ],

  // ── Total Delinquency Amount (lender questionnaire) ──
  total_delinquency_amount: [
    (value, ctx) => {
      const amount = parseDollars(value);
      if (amount <= 0) return null;

      const monthly = getMonthlyAssessmentDollars(ctx.associationRecord);
      const totalUnits = Number(ctx.associationRecord?.total_units || 0);
      if (monthly <= 0 || totalUnits <= 0) return null;

      // Total delinquency exceeding 1 year of a single unit's assessments × 20% of units
      const reasonable = monthly * 12 * totalUnits * 0.2;
      if (amount > reasonable) {
        return {
          level: "warn",
          message: `$${amount.toLocaleString()} seems high for a ${totalUnits}-unit association`,
        };
      }
      return null;
    },
  ],
};

// ════════════════════════════════════════
// Layer 1 API: Single-field validation (for inline warnings)
// ════════════════════════════════════════

/**
 * Validate a single field and return warnings.
 * Called on blur in EditableFieldCell.
 */
export function validateField(
  fieldKey: string,
  value: string,
  ctx: ValidationContext
): FieldWarning[] {
  const rules = FIELD_RULES[fieldKey];
  if (!rules) return [];

  const warnings: FieldWarning[] = [];
  for (const rule of rules) {
    const result = rule(value, ctx);
    if (result) warnings.push(result);
  }
  return warnings;
}

// ════════════════════════════════════════
// Layer 2 API: Pre-generation gate check
// ════════════════════════════════════════

/** Field labels for display in the pre-gen summary */
const FIELD_LABELS: Record<string, string> = {
  late_fees: "Late Fees",
  per_diem_amount: "Per Diem Amount",
  delinquent_balance: "Delinquent Balance",
  current_balance_due: "Current Balance Due",
  attorney_fees: "Attorney Fees",
  other_fees: "Other Fees",
  special_assessments_due: "Special Assessments Due",
  preparation_date: "Preparation Date",
  valid_through_date: "Valid Through Date",
  statement_valid_through: "Statement Valid Through",
  total_due_at_closing: "Total Due at Closing",
  total_delinquency_amount: "Total Delinquency Amount",
  owner_name: "Owner Name",
  owner_names: "Owner Name",
  closing_date: "Closing Date",
  unit_lot_number: "Unit/Lot Number",
  preparer_name: "Preparer Name",
};

/**
 * Run all validation rules across all fields.
 * Called before transitioning awaiting_data → ready_for_generation.
 */
export function runPreGenerationCheck(
  fieldValues: Record<string, string>,
  associationRecord: Record<string, unknown> | null,
  docType: string,
  requiredFieldKeys: string[]
): PreGenCheckResult {
  const ctx: ValidationContext = {
    fieldValues,
    associationRecord,
    docType,
  };

  const errors: PreGenCheckResult["errors"] = [];
  const warnings: PreGenCheckResult["warnings"] = [];

  // 1. Check required fields are populated
  for (const key of requiredFieldKeys) {
    const val = fieldValues[key]?.trim() || "";
    if (!val) {
      errors.push({
        field: key,
        label: FIELD_LABELS[key] || key,
        message: "Required field is empty",
      });
    }
  }

  // 2. Run all field-level validation rules
  for (const [fieldKey, rules] of Object.entries(FIELD_RULES)) {
    const value = fieldValues[fieldKey] || "";
    if (!value) continue; // skip empty fields (caught by required check above)

    for (const rule of rules) {
      const result = rule(value, ctx);
      if (result) {
        const entry = {
          field: fieldKey,
          label: FIELD_LABELS[fieldKey] || fieldKey,
          message: result.message,
        };
        if (result.level === "error") {
          errors.push(entry);
        } else {
          warnings.push(entry);
        }
      }
    }
  }

  // 3. Cross-field checks

  // Date consistency: preparation_date should be <= valid_through dates
  const prepDate = fieldValues.preparation_date || "";
  const validThrough = fieldValues.valid_through_date || "";
  const stmtValidThrough = fieldValues.statement_valid_through || "";

  if (prepDate && validThrough && validThrough < prepDate) {
    errors.push({
      field: "valid_through_date",
      label: "Valid Through Date",
      message: "Valid through date is before preparation date",
    });
  }
  if (prepDate && stmtValidThrough && stmtValidThrough < prepDate) {
    errors.push({
      field: "statement_valid_through",
      label: "Statement Valid Through",
      message: "Statement valid through date is before preparation date",
    });
  }

  return {
    errors,
    warnings,
    passed: errors.length === 0,
  };
}
