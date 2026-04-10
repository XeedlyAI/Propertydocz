"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDocumentSchema } from "@/lib/document-schemas";
import type { DocumentField } from "@/lib/document-schemas";
import { ChevronDown, ChevronRight, Upload, ExternalLink, Check } from "lucide-react";

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface DocumentFieldsViewProps {
  documentTypes: string[];
  liveData: Record<string, string>;
  associationRecord: Record<string, unknown> | null;
  associationId: string | null;
  requestId: string;
  requestStatus: string;
}

// ════════════════════════════════════════
// Constants & Helpers
// ════════════════════════════════════════

const OWNER_ALTERNATES: Record<string, string> = {
  owner_name: "owner_names",
  owner_names: "owner_name",
};

const TOP_LEVEL_TRANSACTION_KEYS = new Set([
  "owner_name", "owner_names", "unit_lot_number", "closing_date",
  "balance_due", "special_notes", "property_address",
]);

/** Fields that sum to total_due_at_closing */
const TOTAL_DUE_COMPONENTS = [
  "current_balance_due", "delinquent_balance", "late_fees",
  "attorney_fees", "special_assessments_due", "other_fees", "prorated_assessment",
];

function getTransactionValue(liveData: Record<string, string>, fieldKey: string): string {
  const direct = liveData[fieldKey];
  if (direct && direct.trim()) return direct;
  const alt = OWNER_ALTERNATES[fieldKey];
  if (alt) {
    const altVal = liveData[alt];
    if (altVal && altVal.trim()) return altVal;
  }
  return "";
}

function getAssociationValue(record: Record<string, unknown> | null, field: DocumentField): string {
  if (!record) return "";
  const col = field.columnName || field.key;
  const val = record[col];
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/** Format a raw DB value for READ-ONLY display */
function formatDisplayValue(raw: string, dataType: DocumentField["dataType"]): string {
  if (!raw) return "";
  switch (dataType) {
    case "currency": {
      const num = Number(raw);
      if (isNaN(num)) return raw;
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num / 100);
    }
    case "boolean": {
      const lower = raw.toLowerCase();
      if (lower === "true" || lower === "yes" || lower === "1") return "Yes";
      if (lower === "false" || lower === "no" || lower === "0") return "No";
      return raw;
    }
    case "percentage": {
      const n = Number(raw);
      if (isNaN(n)) return raw.includes("%") ? raw : `${raw}%`;
      return `${n}%`;
    }
    case "date": {
      try {
        const d = new Date(raw.includes("T") ? raw : raw + "T00:00:00");
        if (isNaN(d.getTime())) return raw;
        return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      } catch { return raw; }
    }
    default:
      return raw;
  }
}

/** DB cents → dollar string for input pre-population */
function centsToInputValue(raw: string): string {
  if (!raw) return "";
  const num = Number(raw);
  if (isNaN(num)) return raw;
  return (num / 100).toFixed(2);
}

/** Dollar string from input → cents for DB save */
function inputValueToCents(val: string): string {
  const cleaned = val.replace(/[$,]/g, "").trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return val;
  return String(Math.round(num * 100));
}

/** Parse a dollar input string to a numeric dollar amount (NOT cents) */
function parseDollarInput(val: string): number {
  const cleaned = val.replace(/[$,]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const INPUT_CLASS =
  "border-0 border-b border-slate-200 rounded-none bg-transparent focus:border-[#38b6ff] focus:outline-none px-0 py-1 text-sm text-slate-900 w-full";

// ════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════

function FieldCell({
  label, value, missing, dataType,
}: {
  label: string; value: string; missing: boolean; dataType: DocumentField["dataType"];
}) {
  const accent = missing ? "border-l-2 border-amber-400 pl-2" : "border-l-2 border-green-400 pl-2";
  return (
    <div className={accent}>
      <p className="text-xs text-slate-500">{label}</p>
      {missing ? (
        <p className="text-sm text-slate-400 italic">&mdash;</p>
      ) : (
        <p className="text-sm font-medium text-slate-900">{formatDisplayValue(value, dataType)}</p>
      )}
    </div>
  );
}

/** Controlled editable field cell — state managed by parent */
function EditableFieldCell({
  field, value, autoLabel, showSaved, onChange, onBlur,
}: {
  field: DocumentField;
  value: string;
  autoLabel?: string;
  showSaved: boolean;
  onChange: (val: string) => void;
  onBlur: () => void;
}) {
  const hasValue = value.trim().length > 0;
  const accent = hasValue ? "border-l-2 border-green-400 pl-2" : "border-l-2 border-amber-400 pl-2";

  return (
    <div className={accent}>
      <div className="flex items-center gap-1">
        <p className="text-xs text-slate-500">{field.label}</p>
        {autoLabel && <span className="text-[10px] text-slate-400">({autoLabel})</span>}
        {showSaved && (
          <span className="flex items-center gap-0.5 text-[10px] text-green-500">
            <Check className="size-2.5" /> Saved
          </span>
        )}
      </div>
      {field.dataType === "currency" ? (
        <div className="flex items-center">
          <span className="text-sm text-slate-400 pr-0.5">$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={INPUT_CLASS}
          />
        </div>
      ) : (
        <input
          type={field.dataType === "date" ? "date" : "text"}
          placeholder={field.dataType === "date" ? "" : `Enter ${field.label.toLowerCase()}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={INPUT_CLASS}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════

export function DocumentFieldsView({
  documentTypes, liveData, associationRecord, associationId, requestId, requestStatus,
}: DocumentFieldsViewProps) {
  const router = useRouter();

  const renderedTransactionKeys = useRef(new Set<string>());
  const renderedAssociationKeys = useRef(new Set<string>());
  renderedTransactionKeys.current = new Set<string>();
  renderedAssociationKeys.current = new Set<string>();

  const handleFieldSaved = useCallback(() => { router.refresh(); }, [router]);

  if (!documentTypes || documentTypes.length === 0) return null;

  const sections: React.ReactNode[] = [];

  for (const docType of documentTypes) {
    const schema = getDocumentSchema(docType);
    if (!schema) continue;

    if (schema.upload_only) {
      sections.push(
        <div key={docType} className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">{schema.label}</h3>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <Upload className="size-4" />
            Upload only — no generated fields required
          </div>
        </div>
      );
      continue;
    }

    const associationFields = schema.fields.filter((f) => f.source === "association");
    const transactionFields = schema.fields.filter((f) => f.source === "per_transaction");

    const allAssocPopulated = associationFields.every((f) => {
      if (renderedAssociationKeys.current.has(f.key)) return true;
      return getAssociationValue(associationRecord, f).length > 0;
    });

    sections.push(
      <DocumentSection
        key={docType}
        docType={docType}
        schema={schema}
        associationFields={associationFields}
        transactionFields={transactionFields}
        allAssocPopulated={allAssocPopulated}
        liveData={liveData}
        associationRecord={associationRecord}
        associationId={associationId}
        requestId={requestId}
        renderedAssociationKeys={renderedAssociationKeys}
        renderedTransactionKeys={renderedTransactionKeys}
        onFieldSaved={handleFieldSaved}
      />
    );
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-slate-900">Document Field Requirements</h2>
      <div className="space-y-6">
        {sections.map((section, i) => (
          <div key={i}>
            {i > 0 && <hr className="mb-6 border-slate-200" />}
            {section}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Per-document section — manages shared field state
// ════════════════════════════════════════

function DocumentSection({
  docType, schema, associationFields, transactionFields, allAssocPopulated,
  liveData, associationRecord, associationId, requestId,
  renderedAssociationKeys, renderedTransactionKeys, onFieldSaved,
}: {
  docType: string;
  schema: ReturnType<typeof getDocumentSchema> & {};
  associationFields: DocumentField[];
  transactionFields: DocumentField[];
  allAssocPopulated: boolean;
  liveData: Record<string, string>;
  associationRecord: Record<string, unknown> | null;
  associationId: string | null;
  requestId: string;
  renderedAssociationKeys: React.MutableRefObject<Set<string>>;
  renderedTransactionKeys: React.MutableRefObject<Set<string>>;
  onFieldSaved: () => void;
}) {
  const [assocOpen, setAssocOpen] = useState(!allAssocPopulated);

  // Visible transaction fields (excluding top-level form fields)
  const visibleFields = transactionFields.filter((f) => !TOP_LEVEL_TRANSACTION_KEYS.has(f.key));

  // ── Shared field state (dollar values for currency, raw for others) ──
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of visibleFields) {
      const dbVal = getTransactionValue(liveData, f.key);
      if (f.dataType === "currency") {
        init[f.key] = dbVal ? centsToInputValue(dbVal) : "";
      } else {
        init[f.key] = dbVal;
      }
    }
    return init;
  });

  // Track saved state for ✓ indicator
  const [savedIndicators, setSavedIndicators] = useState<Record<string, boolean>>({});
  const savedDbRef = useRef<Record<string, string>>(
    visibleFields.reduce<Record<string, string>>((acc, f) => {
      acc[f.key] = getTransactionValue(liveData, f.key);
      return acc;
    }, {})
  );

  // Initialize savedDbRef properly
  useEffect(() => {
    const init: Record<string, string> = {};
    for (const f of visibleFields) {
      init[f.key] = getTransactionValue(liveData, f.key);
    }
    savedDbRef.current = init;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track if user has manually edited total_due_at_closing
  const [totalManuallyOverridden, setTotalManuallyOverridden] = useState(false);

  // ── Fix 3: Auto-populate preparation_date + derived date fields on mount ──
  const autoPopulatedRef = useRef(false);
  useEffect(() => {
    if (autoPopulatedRef.current) return;
    autoPopulatedRef.current = true;

    const updates: Record<string, string> = {};
    const dbSaves: Array<{ key: string; value: string }> = [];

    // preparation_date → today if empty
    if (!fieldValues.preparation_date && visibleFields.some((f) => f.key === "preparation_date")) {
      const today = todayISO();
      updates.preparation_date = today;
      dbSaves.push({ key: "preparation_date", value: today });
    }

    const prepDate = updates.preparation_date || fieldValues.preparation_date;

    // valid_through_date (resale) → prep + 30 days
    if (prepDate && !fieldValues.valid_through_date && visibleFields.some((f) => f.key === "valid_through_date")) {
      const vtd = addDays(prepDate, 30);
      updates.valid_through_date = vtd;
      dbSaves.push({ key: "valid_through_date", value: vtd });
    }

    // statement_valid_through (payoff) → prep + 30 days
    if (prepDate && !fieldValues.statement_valid_through && visibleFields.some((f) => f.key === "statement_valid_through")) {
      const svt = addDays(prepDate, 30);
      updates.statement_valid_through = svt;
      dbSaves.push({ key: "statement_valid_through", value: svt });
    }

    // per_diem_amount → monthly_assessment_amount / 30
    if (!fieldValues.per_diem_amount && visibleFields.some((f) => f.key === "per_diem_amount") && associationRecord) {
      const monthlyRaw = associationRecord.monthly_assessment_amount;
      if (monthlyRaw !== null && monthlyRaw !== undefined) {
        const monthlyCents = Number(monthlyRaw);
        if (!isNaN(monthlyCents) && monthlyCents > 0) {
          const perDiemDollars = (monthlyCents / 100 / 30).toFixed(2);
          const perDiemCents = String(Math.round(monthlyCents / 30));
          updates.per_diem_amount = perDiemDollars;
          dbSaves.push({ key: "per_diem_amount", value: perDiemCents });
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      setFieldValues((prev) => ({ ...prev, ...updates }));
      // Save auto-populated values to DB
      for (const save of dbSaves) {
        fetch(`/api/requests/${requestId}/fields`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field_key: save.key, value: save.value, confirm: false }),
        }).catch((err) => console.error("Auto-save failed:", err));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fix 1: Auto-calculate total_due_at_closing for payoff_statement ──
  const isPayoff = docType === "payoff_statement";
  useEffect(() => {
    if (!isPayoff || totalManuallyOverridden) return;
    if (!visibleFields.some((f) => f.key === "total_due_at_closing")) return;

    let sum = 0;
    for (const key of TOTAL_DUE_COMPONENTS) {
      const val = fieldValues[key] ?? "";
      sum += parseDollarInput(val);
    }

    const sumStr = sum > 0 ? sum.toFixed(2) : "";
    setFieldValues((prev) => {
      if (prev.total_due_at_closing === sumStr) return prev;
      return { ...prev, total_due_at_closing: sumStr };
    });
  }, [
    isPayoff, totalManuallyOverridden,
    fieldValues.current_balance_due, fieldValues.delinquent_balance,
    fieldValues.late_fees, fieldValues.attorney_fees,
    fieldValues.special_assessments_due, fieldValues.other_fees,
    fieldValues.prorated_assessment,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    visibleFields.length,
  ]);

  // ── Recalculate valid_through dates when preparation_date changes ──
  useEffect(() => {
    if (!fieldValues.preparation_date) return;
    const newDate = addDays(fieldValues.preparation_date, 30);

    setFieldValues((prev) => {
      const updates: Record<string, string> = {};
      // Only auto-update if the field exists and hasn't been manually set to something different
      if (visibleFields.some((f) => f.key === "valid_through_date")) {
        const current = prev.valid_through_date || "";
        // Auto-update if empty or if it was previously an auto-calculated value
        if (!current || current === addDays(prev.preparation_date || todayISO(), 30)) {
          updates.valid_through_date = newDate;
        }
      }
      if (visibleFields.some((f) => f.key === "statement_valid_through")) {
        const current = prev.statement_valid_through || "";
        if (!current || current === addDays(prev.preparation_date || todayISO(), 30)) {
          updates.statement_valid_through = newDate;
        }
      }
      if (Object.keys(updates).length === 0) return prev;
      return { ...prev, ...updates };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldValues.preparation_date]);

  // ── Handlers ──
  const handleChange = useCallback((key: string, val: string) => {
    if (key === "total_due_at_closing") {
      setTotalManuallyOverridden(true);
    }
    setFieldValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleBlur = useCallback(async (key: string, dataType: string) => {
    const inputVal = fieldValues[key]?.trim() ?? "";
    const dbValue = dataType === "currency" ? inputValueToCents(inputVal) : inputVal;

    const prevDb = (savedDbRef.current as Record<string, string>)?.[key] ?? "";
    if (dbValue === prevDb) return;

    try {
      await fetch(`/api/requests/${requestId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field_key: key, value: dbValue, confirm: false }),
      });
      if (typeof savedDbRef.current === "object") {
        (savedDbRef.current as Record<string, string>)[key] = dbValue;
      }
      setSavedIndicators((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSavedIndicators((prev) => ({ ...prev, [key]: false })), 2000);
      onFieldSaved();
    } catch (err) {
      console.error("Failed to save field:", err);
    }
  }, [fieldValues, requestId, onFieldSaved]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">
        {schema!.label} — Required Data
      </h3>

      {/* Association Data */}
      {associationFields.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAssocOpen(!assocOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              {assocOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              Association Data
            </button>
            {associationId && (
              <Link
                href={`/admin/associations/${associationId}?tab=settings`}
                className="inline-flex items-center gap-1 text-[10px] text-[#38b6ff] hover:underline"
              >
                Edit in Association <ExternalLink className="size-2.5" />
              </Link>
            )}
          </div>

          {assocOpen && (
            <div className="grid gap-3 sm:grid-cols-2">
              {associationFields.map((field) => {
                if (renderedAssociationKeys.current.has(field.key)) return null;
                renderedAssociationKeys.current.add(field.key);
                const value = getAssociationValue(associationRecord, field);
                return (
                  <FieldCell key={field.key} label={field.label} value={value} missing={!value} dataType={field.dataType} />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Transaction Data */}
      {visibleFields.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Transaction Data</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleFields.map((field) => {
              if (renderedTransactionKeys.current.has(field.key)) return null;
              renderedTransactionKeys.current.add(field.key);

              const val = fieldValues[field.key] ?? "";
              const autoLabel =
                field.key === "total_due_at_closing" && !totalManuallyOverridden
                  ? "auto-calculated"
                  : field.key === "per_diem_amount" && !getTransactionValue(liveData, "per_diem_amount")
                    ? "auto-calculated"
                    : field.key === "preparation_date" && !getTransactionValue(liveData, "preparation_date")
                      ? "auto-today"
                      : field.key === "valid_through_date" && !getTransactionValue(liveData, "valid_through_date")
                        ? "auto +30 days"
                        : field.key === "statement_valid_through" && !getTransactionValue(liveData, "statement_valid_through")
                          ? "auto +30 days"
                          : undefined;

              return (
                <EditableFieldCell
                  key={field.key}
                  field={field}
                  value={val}
                  autoLabel={autoLabel}
                  showSaved={!!savedIndicators[field.key]}
                  onChange={(v) => handleChange(field.key, v)}
                  onBlur={() => handleBlur(field.key, field.dataType)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
