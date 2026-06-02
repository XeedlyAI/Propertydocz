"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDocumentSchema } from "@/lib/document-schemas";
import type { DocumentField } from "@/lib/document-schemas";
import { validateField } from "@/lib/field-validations";
import { runPreGenerationCheck } from "@/lib/field-validations";
import type { FieldWarning, ValidationContext, PreGenCheckResult } from "@/lib/field-validations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Upload, ExternalLink, Check, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

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
  onDocReady?: (docType: string, isReady: boolean) => void;
}

// ════════════════════════════════════════
// Constants & Helpers
// ════════════════════════════════════════

const OWNER_ALTERNATES: Record<string, string> = {
  owner_name: "owner_names",
  owner_names: "owner_name",
};

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
  field, value, autoLabel, showSaved, warnings, onChange, onBlur,
}: {
  field: DocumentField;
  value: string;
  autoLabel?: string;
  showSaved: boolean;
  warnings: FieldWarning[];
  onChange: (val: string) => void;
  onBlur: () => void;
}) {
  const hasValue = value.trim().length > 0;
  const hasError = warnings.some((w) => w.level === "error");
  const hasWarn = warnings.some((w) => w.level === "warn");
  const accent = hasError
    ? "border-l-2 border-red-400 pl-2"
    : hasWarn
      ? "border-l-2 border-amber-400 pl-2"
      : hasValue
        ? "border-l-2 border-green-400 pl-2"
        : "border-l-2 border-amber-400 pl-2";

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
      {/* Inline warnings — Layer 1 */}
      {warnings.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {warnings.map((w, i) => (
            <p
              key={i}
              className={`flex items-start gap-1 text-[11px] leading-tight ${
                w.level === "error" ? "text-red-500" : "text-amber-600"
              }`}
            >
              <AlertTriangle className="size-3 shrink-0 mt-0.5" />
              {w.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════

export function DocumentFieldsView({
  documentTypes, liveData, associationRecord, associationId, requestId, requestStatus,
  onDocReady,
}: DocumentFieldsViewProps) {
  const router = useRouter();
  const handleFieldSaved = useCallback(() => { router.refresh(); }, [router]);

  if (!documentTypes || documentTypes.length === 0) return null;

  const sections: React.ReactNode[] = [];

  for (const docType of documentTypes) {
    const schema = getDocumentSchema(docType);
    if (!schema) continue;

    if (schema.upload_only) {
      sections.push(
        <Card key={docType} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{schema.label}</h3>
              <span className="text-xs font-mono font-medium text-slate-400">Upload only</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              <Upload className="size-4" />
              Upload only — no generated fields required
            </div>
          </CardContent>
        </Card>
      );
      continue;
    }

    // No deduplication — each document gets ALL its fields
    const allAssocFields = schema.fields.filter((f) => f.source === "association");
    const allTransFields = schema.fields.filter((f) => f.source === "per_transaction");

    const allAssocPopulated = allAssocFields.every((f) =>
      getAssociationValue(associationRecord, f).length > 0
    );

    sections.push(
      <DocumentSection
        key={docType}
        docType={docType}
        schema={schema}
        associationFields={allAssocFields}
        transactionFields={allTransFields}
        allAssocPopulated={allAssocPopulated}
        liveData={liveData}
        associationRecord={associationRecord}
        associationId={associationId}
        requestId={requestId}
        onFieldSaved={handleFieldSaved}
        onDocReady={onDocReady}
      />
    );
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-6">
      {sections}
    </div>
  );
}

// ════════════════════════════════════════
// Per-document section — manages shared field state
// ════════════════════════════════════════

function DocumentSection({
  docType, schema, associationFields, transactionFields, allAssocPopulated,
  liveData, associationRecord, associationId, requestId, onFieldSaved, onDocReady,
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
  onFieldSaved: () => void;
  onDocReady?: (docType: string, isReady: boolean) => void;
}) {
  const [assocOpen, setAssocOpen] = useState(!allAssocPopulated);

  // All transaction fields visible (no TOP_LEVEL_TRANSACTION_KEYS filter)
  const visibleFields = transactionFields;

  // ── Shared field state (dollar values for currency, raw for others) ──
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of transactionFields) {
      const dbVal = getTransactionValue(liveData, f.key);
      if (f.dataType === "currency") {
        init[f.key] = dbVal ? centsToInputValue(dbVal) : "";
      } else {
        init[f.key] = dbVal;
      }
    }
    return init;
  });

  // Track saved state for checkmark indicator
  const [savedIndicators, setSavedIndicators] = useState<Record<string, boolean>>({});
  // Track what's been saved to DB (to avoid redundant blur saves)
  const [savedDbValues, setSavedDbValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of transactionFields) {
      init[f.key] = getTransactionValue(liveData, f.key);
    }
    return init;
  });

  // Track if user has manually edited total_due_at_closing
  const [totalManuallyOverridden, setTotalManuallyOverridden] = useState(false);

  // Per-document check state
  const [docStatus, setDocStatus] = useState<"needs_work" | "checking" | "has_issues" | "complete">("needs_work");
  const [checkResult, setCheckResult] = useState<PreGenCheckResult | null>(null);
  const [warningsAcked, setWarningsAcked] = useState(false);

  // ── Completion counter ──
  const totalFields = associationFields.length + visibleFields.length;
  const populatedAssoc = associationFields.filter(f => getAssociationValue(associationRecord, f).length > 0).length;
  const populatedTrans = visibleFields.filter(f => (fieldValues[f.key] ?? "").trim().length > 0).length;
  const populatedCount = populatedAssoc + populatedTrans;

  // ── Layer 1: Compute inline warnings for all fields ──
  const validationCtx: ValidationContext = useMemo(
    () => ({ fieldValues, associationRecord, docType }),
    [fieldValues, associationRecord, docType]
  );

  const fieldWarnings = useMemo(() => {
    const map: Record<string, FieldWarning[]> = {};
    for (const f of visibleFields) {
      const val = fieldValues[f.key] ?? "";
      if (val.trim()) {
        map[f.key] = validateField(f.key, val, validationCtx);
      } else {
        map[f.key] = [];
      }
    }
    return map;
  }, [visibleFields, fieldValues, validationCtx]);

  // ── Auto-populate preparation_date + derived date fields on mount ──
  const autoPopulatedRef = useRef(false);
  useEffect(() => {
    if (autoPopulatedRef.current) return;
    autoPopulatedRef.current = true;

    const updates: Record<string, string> = {};
    const dbSaves: Array<{ key: string; value: string }> = [];

    // preparation_date -> today if empty
    if (!fieldValues.preparation_date && visibleFields.some((f) => f.key === "preparation_date")) {
      const today = todayISO();
      updates.preparation_date = today;
      dbSaves.push({ key: "preparation_date", value: today });
    }

    const prepDate = updates.preparation_date || fieldValues.preparation_date;

    // valid_through_date (resale) -> prep + 30 days
    if (prepDate && !fieldValues.valid_through_date && visibleFields.some((f) => f.key === "valid_through_date")) {
      const vtd = addDays(prepDate, 30);
      updates.valid_through_date = vtd;
      dbSaves.push({ key: "valid_through_date", value: vtd });
    }

    // statement_valid_through (payoff) -> prep + 30 days
    if (prepDate && !fieldValues.statement_valid_through && visibleFields.some((f) => f.key === "statement_valid_through")) {
      const svt = addDays(prepDate, 30);
      updates.statement_valid_through = svt;
      dbSaves.push({ key: "statement_valid_through", value: svt });
    }

    // per_diem_amount -> monthly_assessment_amount / 30
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

  // ── Auto-calculate total_due_at_closing for payoff_statement ──
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
      if (visibleFields.some((f) => f.key === "valid_through_date")) {
        const current = prev.valid_through_date || "";
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

    if (dbValue === (savedDbValues[key] ?? "")) return;

    try {
      await fetch(`/api/requests/${requestId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field_key: key, value: dbValue, confirm: false }),
      });
      setSavedDbValues((prev) => ({ ...prev, [key]: dbValue }));
      setSavedIndicators((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => setSavedIndicators((prev) => ({ ...prev, [key]: false })), 2000);
      onFieldSaved();
    } catch (err) {
      console.error("Failed to save field:", err);
    }
  }, [fieldValues, savedDbValues, requestId, onFieldSaved]);

  // ── Check Completeness handler ──
  function handleCheckCompleteness() {
    setDocStatus("checking");
    const requiredKeys = [...associationFields, ...visibleFields]
      .filter(f => f.required)
      .map(f => f.key);

    const mergedValues: Record<string, string> = {};
    for (const f of associationFields) {
      mergedValues[f.key] = getAssociationValue(associationRecord, f);
    }
    for (const f of visibleFields) {
      const val = fieldValues[f.key] ?? "";
      mergedValues[f.key] = f.dataType === "currency" ? inputValueToCents(val) : val;
    }

    const result = runPreGenerationCheck(mergedValues, associationRecord, docType, requiredKeys);
    setCheckResult(result);
    setWarningsAcked(false);

    if (result.passed && result.warnings.length === 0) {
      setDocStatus("complete");
      onDocReady?.(docType, true);
    } else {
      setDocStatus("has_issues");
      onDocReady?.(docType, false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">{schema!.label}</h3>
          <span className={`text-xs font-mono font-medium ${populatedCount === totalFields ? "text-green-600" : "text-slate-400"}`}>
            {populatedCount}/{totalFields} fields
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
                    warnings={fieldWarnings[field.key] || []}
                    onChange={(v) => handleChange(field.key, v)}
                    onBlur={() => handleBlur(field.key, field.dataType)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Per-document check results + action buttons */}
        <div className="mt-4 space-y-3">
          {/* Check result display */}
          {checkResult && docStatus === "has_issues" && (
            <div className="rounded-lg border border-slate-200 p-3 space-y-2">
              {checkResult.errors.map((e, i) => (
                <p key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                  <XCircle className="size-3 shrink-0 mt-0.5" />
                  <span><strong>{e.label}:</strong> {e.message}</span>
                </p>
              ))}
              {checkResult.warnings.map((w, i) => (
                <p key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                  <span><strong>{w.label}:</strong> {w.message}</span>
                </p>
              ))}
              {checkResult.errors.length === 0 && checkResult.warnings.length > 0 && (
                <label className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground">
                  <input type="checkbox" checked={warningsAcked} onChange={e => setWarningsAcked(e.target.checked)} className="mt-0.5 size-3.5 rounded border-border accent-[#38b6ff]" />
                  <span>I&apos;ve reviewed these warnings and the data is correct</span>
                </label>
              )}
            </div>
          )}

          {docStatus === "complete" && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <CheckCircle2 className="size-3.5" />
              Ready for generation
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCheckResult(null);
                setDocStatus("needs_work");
                onDocReady?.(docType, false);
                handleCheckCompleteness();
              }}
            >
              {docStatus === "needs_work" ? "Check Completeness" : "Re-check"}
            </Button>
            {docStatus === "has_issues" && checkResult && checkResult.errors.length === 0 && (
              <Button
                size="sm"
                className="bg-[#38b6ff] text-white hover:bg-[#1DA8F0]"
                disabled={!warningsAcked}
                onClick={() => {
                  setDocStatus("complete");
                  onDocReady?.(docType, true);
                }}
              >
                Mark Ready
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
