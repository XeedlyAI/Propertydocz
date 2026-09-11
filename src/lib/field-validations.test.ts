/**
 * Layers 1 and 2 of the validation system. Several of these rules are Utah
 * statute (HB 217 late-fee cap); the rest are the sanity margins an admin
 * sees before a document can be generated.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runPreGenerationCheck, validateField, type ValidationContext } from "./field-validations";

const ctx = (fieldValues: Record<string, string> = {}, associationRecord: Record<string, unknown> | null = null, docType = "payoff_statement"): ValidationContext => ({
  fieldValues,
  associationRecord,
  docType,
});

describe("validateField — late_fees (HB 217)", () => {
  it("allows a late fee up to the greater of $50 or 10% of the past-due balance", () => {
    expect(validateField("late_fees", "$50.00", ctx({ delinquent_balance: "$100" }))).toEqual([]);
    expect(validateField("late_fees", "$120", ctx({ delinquent_balance: "$1,200.00" }))).toEqual([]);
  });

  it("warns when the fee exceeds the cap, naming the cap", () => {
    const w = validateField("late_fees", "$75", ctx({ delinquent_balance: "$300" }));
    expect(w).toEqual([{ level: "warn", message: "$75.00 may exceed HB 217 cap of $50.00 (greater of $50 or 10% of past-due)" }]);
    expect(validateField("late_fees", "$130", ctx({ delinquent_balance: "$1,200" }))[0].message).toContain("cap of $120.00");
  });

  it("ignores zero, blank, and non-numeric entries", () => {
    expect(validateField("late_fees", "", ctx())).toEqual([]);
    expect(validateField("late_fees", "n/a", ctx())).toEqual([]);
    expect(validateField("late_fees", "$0", ctx())).toEqual([]);
  });
});

describe("validateField — assessment-relative margins", () => {
  const assoc = { monthly_assessment_amount: 30000 }; // $300/mo, stored in cents

  it("flags a per-diem more than 50% above monthly/30", () => {
    expect(validateField("per_diem_amount", "$10", ctx({}, assoc))).toEqual([]); // expected ~$10
    expect(validateField("per_diem_amount", "$16", ctx({}, assoc))[0].message).toBe("$16.00/day seems high for $300.00/mo assessment (expected ~$10.00)");
    expect(validateField("per_diem_amount", "$99", ctx({}, null))).toEqual([]); // no association → no baseline
  });

  it("flags a delinquent balance over 24 months and a current balance over 12 months", () => {
    expect(validateField("delinquent_balance", "$7,200", ctx({}, assoc))).toEqual([]); // 24 months exactly
    expect(validateField("delinquent_balance", "$7,500", ctx({}, assoc))[0].message).toBe("$7,500 is 25 months delinquent — verify this amount");
    expect(validateField("current_balance_due", "$3,600", ctx({}, assoc))).toEqual([]);
    expect(validateField("current_balance_due", "$3,601", ctx({}, assoc))[0].message).toBe("$3,601 exceeds 12 months of assessments — verify");
  });

  it("flags high attorney and other fees at their thresholds", () => {
    expect(validateField("attorney_fees", "$5,000", ctx())).toEqual([]);
    expect(validateField("attorney_fees", "$5,000.01", ctx())[0].level).toBe("warn");
    expect(validateField("other_fees", "$1,000", ctx())).toEqual([]);
    expect(validateField("other_fees", "$1,001", ctx())[0].message).toContain("add detail in special notes");
  });

  it("questions a special assessment the association says it has not planned", () => {
    for (const planned of [false, "false", "No", "no"]) {
      expect(validateField("special_assessments_due", "$500", ctx({}, { planned_special_assessment: planned }))[0].level).toBe("warn");
    }
    expect(validateField("special_assessments_due", "$500", ctx({}, { planned_special_assessment: true }))).toEqual([]);
  });

  it("flags total delinquency beyond 20% of units × a year of assessments", () => {
    const a = { monthly_assessment_amount: 30000, total_units: 100 }; // reasonable = 300×12×100×0.2 = 72,000
    expect(validateField("total_delinquency_amount", "$72,000", ctx({}, a))).toEqual([]);
    expect(validateField("total_delinquency_amount", "$72,001", ctx({}, a))[0].message).toBe("$72,001 seems high for a 100-unit association");
  });
});

describe("validateField — dates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("warns on a future preparation date and errors on an expired valid-through date", () => {
    expect(validateField("preparation_date", "2026-09-10", ctx())).toEqual([]);
    expect(validateField("preparation_date", "2026-09-11", ctx())[0]).toMatchObject({ level: "warn" });
    expect(validateField("valid_through_date", "2026-09-10", ctx())).toEqual([]);
    expect(validateField("valid_through_date", "2026-09-09", ctx())).toEqual([{ level: "error", message: "Valid through date is in the past" }]);
    expect(validateField("statement_valid_through", "2026-01-01", ctx())[0].level).toBe("error");
  });
});

describe("validateField — total due at closing", () => {
  it("warns when the entered total disagrees with the component sum by more than a cent", () => {
    const parts = { current_balance_due: "$300", delinquent_balance: "$600", late_fees: "$50", other_fees: "$25.50" }; // 975.50
    expect(validateField("total_due_at_closing", "$975.50", ctx(parts))).toEqual([]);
    expect(validateField("total_due_at_closing", "$975.51", ctx(parts))).toEqual([]); // within tolerance
    expect(validateField("total_due_at_closing", "$1,000", ctx(parts))[0].message).toBe("$1000.00 doesn't match component sum of $975.50");
    expect(validateField("total_due_at_closing", "$1,000", ctx({}))).toEqual([]); // nothing to compare
  });

  it("returns nothing for a field with no rules", () => {
    expect(validateField("owner_name", "Jane Doe", ctx())).toEqual([]);
  });
});

describe("runPreGenerationCheck", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-10T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("blocks on empty required fields and on error-level rules, collects warnings, and reports pass/fail", () => {
    const r = runPreGenerationCheck(
      { association_name: "Lakeside HOA", preparation_date: "2026-09-10", valid_through_date: "2026-09-01", late_fees: "$75", delinquent_balance: "$300", owner_name: "  " },
      null,
      "payoff_statement",
      ["association_name", "owner_name", "property_address"],
    );
    expect(r.passed).toBe(false);
    expect(r.errors.map((e) => [e.field, e.label, e.message])).toEqual([
      ["owner_name", "Owner Name", "Required field is empty"],
      ["property_address", "property_address", "Required field is empty"],
      ["valid_through_date", "Valid Through Date", "Valid through date is in the past"],
      ["valid_through_date", "Valid Through Date", "Valid through date is before preparation date"],
    ]);
    expect(r.warnings.map((w) => w.field)).toEqual(["late_fees"]);
  });

  it("passes a clean payoff statement, warnings allowed", () => {
    const r = runPreGenerationCheck(
      { association_name: "Lakeside HOA", property_address: "1 Main St", preparation_date: "2026-09-10", statement_valid_through: "2026-10-10", attorney_fees: "$6,000" },
      null,
      "payoff_statement",
      ["association_name", "property_address", "preparation_date"],
    );
    expect(r.passed).toBe(true);
    expect(r.errors).toEqual([]);
    expect(r.warnings).toEqual([{ field: "attorney_fees", label: "Attorney Fees", message: "$6,000 is unusually high for attorney fees" }]);
  });

  it("errors when a statement valid-through date precedes the preparation date", () => {
    const r = runPreGenerationCheck({ preparation_date: "2026-09-10", statement_valid_through: "2026-09-12" }, null, "payoff_statement", []);
    expect(r.passed).toBe(true);
    const bad = runPreGenerationCheck({ preparation_date: "2026-09-10", statement_valid_through: "2026-09-10" }, null, "payoff_statement", []);
    expect(bad.passed).toBe(true); // equal dates are fine
    const worse = runPreGenerationCheck({ preparation_date: "2026-09-12", statement_valid_through: "2026-09-11" }, null, "payoff_statement", []);
    expect(worse.errors.map((e) => e.message)).toEqual(["Statement valid through date is before preparation date"]);
  });
});
