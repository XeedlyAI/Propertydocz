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
// Helpers
// ════════════════════════════════════════

const OWNER_ALTERNATES: Record<string, string> = {
  owner_name: "owner_names",
  owner_names: "owner_name",
};

/** Keys already captured in the top-level Transaction Details form */
const TOP_LEVEL_TRANSACTION_KEYS = new Set([
  "owner_name",
  "owner_names",
  "unit_lot_number",
  "closing_date",
  "balance_due",
  "special_notes",
  "property_address",
]);

function getTransactionValue(
  liveData: Record<string, string>,
  fieldKey: string
): string {
  const direct = liveData[fieldKey];
  if (direct && direct.trim()) return direct;
  const alt = OWNER_ALTERNATES[fieldKey];
  if (alt) {
    const altVal = liveData[alt];
    if (altVal && altVal.trim()) return altVal;
  }
  return "";
}

function getAssociationValue(
  record: Record<string, unknown> | null,
  field: DocumentField
): string {
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
      // DB stores cents — divide by 100 for display
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
      } catch {
        return raw;
      }
    }
    default:
      return raw;
  }
}

/** Convert cents from DB to dollar string for pre-populating an input */
function centsToInputValue(raw: string): string {
  if (!raw) return "";
  const num = Number(raw);
  if (isNaN(num)) return raw;
  return (num / 100).toFixed(2);
}

/** Convert dollar string from input to cents for saving to DB */
function inputValueToCents(val: string): string {
  const cleaned = val.replace(/[$,]/g, "").trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return val;
  return String(Math.round(num * 100));
}

function placeholderForField(field: DocumentField): string {
  switch (field.dataType) {
    case "currency":
      return "0.00";
    case "date":
      return "";
    default:
      return `Enter ${field.label.toLowerCase()}`;
  }
}

const INPUT_CLASS =
  "border-0 border-b border-slate-200 rounded-none bg-transparent focus:border-[#38b6ff] focus:outline-none px-0 py-1 text-sm text-slate-900 w-full";

// ════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════

/** Read-only cell for association data */
function FieldCell({
  label,
  value,
  missing,
  dataType,
}: {
  label: string;
  value: string;
  missing: boolean;
  dataType: DocumentField["dataType"];
}) {
  const accent = missing
    ? "border-l-2 border-amber-400 pl-2"
    : "border-l-2 border-green-400 pl-2";

  return (
    <div className={accent}>
      <p className="text-xs text-slate-500">{label}</p>
      {missing ? (
        <p className="text-sm text-slate-400 italic">&mdash;</p>
      ) : (
        <p className="text-sm font-medium text-slate-900">
          {formatDisplayValue(value, dataType)}
        </p>
      )}
    </div>
  );
}

/** Editable cell for transaction data — always editable, blur-to-save */
function EditableFieldCell({
  field,
  currentValue,
  requestId,
  onSaved,
}: {
  field: DocumentField;
  currentValue: string;
  requestId: string;
  onSaved: () => void;
}) {
  // For currency, convert DB cents → dollars for the input
  const initialInputValue =
    field.dataType === "currency" && currentValue
      ? centsToInputValue(currentValue)
      : currentValue;

  const [localValue, setLocalValue] = useState(initialInputValue);
  const savedRef = useRef(currentValue); // tracks the DB value (cents for currency)
  const [showSaved, setShowSaved] = useState(false);

  const handleBlur = useCallback(async () => {
    const trimmed = localValue.trim();
    // Convert input back to DB format for saving
    const dbValue =
      field.dataType === "currency" ? inputValueToCents(trimmed) : trimmed;

    if (dbValue === savedRef.current) return;
    try {
      await fetch(`/api/requests/${requestId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_key: field.key,
          value: dbValue,
          confirm: false,
        }),
      });
      savedRef.current = dbValue;
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      onSaved();
    } catch (err) {
      console.error("Failed to save field:", err);
    }
  }, [localValue, requestId, field.key, field.dataType, onSaved]);

  const hasValue = localValue.trim().length > 0;
  const accent = hasValue
    ? "border-l-2 border-green-400 pl-2"
    : "border-l-2 border-amber-400 pl-2";

  return (
    <div className={accent}>
      <div className="flex items-center gap-1">
        <p className="text-xs text-slate-500">{field.label}</p>
        {showSaved && (
          <span className="flex items-center gap-0.5 text-[10px] text-green-500 animate-in fade-in">
            <Check className="size-2.5" />
            Saved
          </span>
        )}
      </div>
      {field.dataType === "currency" ? (
        <div className="flex items-center">
          <span className="text-sm text-slate-400 pr-0.5">$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder={placeholderForField(field)}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            className={INPUT_CLASS}
          />
        </div>
      ) : (
        <input
          type={field.dataType === "date" ? "date" : "text"}
          placeholder={placeholderForField(field)}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
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
  documentTypes,
  liveData,
  associationRecord,
  associationId,
  requestId,
  requestStatus,
}: DocumentFieldsViewProps) {
  const router = useRouter();

  const renderedTransactionKeys = useRef(new Set<string>());
  const renderedAssociationKeys = useRef(new Set<string>());

  // Reset on each render
  renderedTransactionKeys.current = new Set<string>();
  renderedAssociationKeys.current = new Set<string>();

  const handleFieldSaved = useCallback(() => {
    router.refresh();
  }, [router]);

  if (!documentTypes || documentTypes.length === 0) return null;

  const sections: React.ReactNode[] = [];

  for (const docType of documentTypes) {
    const schema = getDocumentSchema(docType);
    if (!schema) continue;

    if (schema.upload_only) {
      sections.push(
        <div key={docType} className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">
            {schema.label}
          </h3>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            <Upload className="size-4" />
            Upload only — no generated fields required
          </div>
        </div>
      );
      continue;
    }

    const associationFields = schema.fields.filter(
      (f) => f.source === "association"
    );
    const transactionFields = schema.fields.filter(
      (f) => f.source === "per_transaction"
    );

    const allAssocPopulated = associationFields.every((f) => {
      if (renderedAssociationKeys.current.has(f.key)) return true;
      return getAssociationValue(associationRecord, f).length > 0;
    });

    sections.push(
      <DocumentSection
        key={docType}
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
      <h2 className="text-base font-semibold text-slate-900">
        Document Field Requirements
      </h2>
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
// Per-document section
// ════════════════════════════════════════

function DocumentSection({
  schema,
  associationFields,
  transactionFields,
  allAssocPopulated,
  liveData,
  associationRecord,
  associationId,
  requestId,
  renderedAssociationKeys,
  renderedTransactionKeys,
  onFieldSaved,
}: {
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

  // Filter transaction fields to exclude top-level form keys
  const visibleTransactionFields = transactionFields.filter(
    (f) => !TOP_LEVEL_TRANSACTION_KEYS.has(f.key)
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">
        {schema!.label} — Required Data
      </h3>

      {/* Association Data sub-section */}
      {associationFields.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAssocOpen(!assocOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              {assocOpen ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              Association Data
            </button>
            {associationId && (
              <Link
                href={`/admin/associations/${associationId}?tab=settings`}
                className="inline-flex items-center gap-1 text-[10px] text-[#38b6ff] hover:underline"
              >
                Edit in Association
                <ExternalLink className="size-2.5" />
              </Link>
            )}
          </div>

          {assocOpen && (
            <div className="grid gap-3 sm:grid-cols-2">
              {associationFields.map((field) => {
                if (renderedAssociationKeys.current.has(field.key)) {
                  return null;
                }
                renderedAssociationKeys.current.add(field.key);

                const value = getAssociationValue(
                  associationRecord,
                  field
                );
                return (
                  <FieldCell
                    key={field.key}
                    label={field.label}
                    value={value}
                    missing={!value}
                    dataType={field.dataType}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Transaction Data sub-section */}
      {visibleTransactionFields.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Transaction Data</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleTransactionFields.map((field) => {
              if (renderedTransactionKeys.current.has(field.key)) {
                return null;
              }
              renderedTransactionKeys.current.add(field.key);

              const value = getTransactionValue(liveData, field.key);
              return (
                <EditableFieldCell
                  key={field.key}
                  field={field}
                  currentValue={value}
                  requestId={requestId}
                  onSaved={onFieldSaved}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
