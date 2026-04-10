"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getDocumentSchema } from "@/lib/document-schemas";
import type { DocumentField } from "@/lib/document-schemas";
import { ChevronDown, ChevronRight, Upload } from "lucide-react";

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface DocumentFieldsViewProps {
  documentTypes: string[];
  liveData: Record<string, string>;
  associationFieldValues: Array<{
    field_key: string;
    value: string | null;
    confidence: string | null;
    source: string | null;
    last_verified_at: string | null;
  }>;
  requestId: string;
  requestStatus: string;
}

// ════════════════════════════════════════
// Helpers
// ════════════════════════════════════════

/** Owner name fields use both owner_name and owner_names across the app */
const OWNER_ALTERNATES: Record<string, string> = {
  owner_name: "owner_names",
  owner_names: "owner_name",
};

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
  fieldValues: DocumentFieldsViewProps["associationFieldValues"],
  fieldKey: string
): string {
  const match = fieldValues.find((fv) => fv.field_key === fieldKey);
  return match?.value?.trim() ? match.value : "";
}

function inputTypeForField(field: DocumentField): string {
  switch (field.dataType) {
    case "date":
      return "date";
    case "currency":
      return "text";
    default:
      return "text";
  }
}

function placeholderForField(field: DocumentField): string {
  switch (field.dataType) {
    case "currency":
      return "$0.00";
    case "date":
      return "";
    default:
      return `Enter ${field.label.toLowerCase()}`;
  }
}

// ════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════

function FieldCell({
  label,
  value,
  missing,
}: {
  label: string;
  value: string;
  missing: boolean;
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
        <p className="text-sm font-medium text-slate-900">{value}</p>
      )}
    </div>
  );
}

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
  const [localValue, setLocalValue] = useState(currentValue);
  const savedRef = useRef(currentValue);

  const handleBlur = useCallback(async () => {
    const trimmed = localValue.trim();
    if (trimmed === savedRef.current) return;
    try {
      await fetch(`/api/requests/${requestId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_key: field.key,
          value: trimmed,
          confirm: false,
        }),
      });
      savedRef.current = trimmed;
      onSaved();
    } catch (err) {
      console.error("Failed to save field:", err);
    }
  }, [localValue, requestId, field.key, onSaved]);

  const hasValue = currentValue.trim().length > 0;
  const accent = hasValue
    ? "border-l-2 border-green-400 pl-2"
    : "border-l-2 border-amber-400 pl-2";

  if (hasValue) {
    return (
      <div className={accent}>
        <p className="text-xs text-slate-500">{field.label}</p>
        <p className="text-sm font-medium text-slate-900">{currentValue}</p>
      </div>
    );
  }

  return (
    <div className={accent}>
      <p className="text-xs text-slate-500">{field.label}</p>
      <input
        type={inputTypeForField(field)}
        placeholder={placeholderForField(field)}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className="w-full border-0 border-b border-amber-300 bg-transparent text-sm focus:border-[#38b6ff] focus:outline-none"
      />
    </div>
  );
}

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════

export function DocumentFieldsView({
  documentTypes,
  liveData,
  associationFieldValues,
  requestId,
  requestStatus,
}: DocumentFieldsViewProps) {
  const router = useRouter();

  // Track which fields have already been rendered (for deduplication across doc types)
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

    // Upload-only document type
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

    // Check if all association fields have values (to auto-collapse)
    const allAssocPopulated = associationFields.every((f) => {
      if (renderedAssociationKeys.current.has(f.key)) return true;
      return getAssociationValue(associationFieldValues, f.key).length > 0;
    });

    sections.push(
      <DocumentSection
        key={docType}
        schema={schema}
        associationFields={associationFields}
        transactionFields={transactionFields}
        allAssocPopulated={allAssocPopulated}
        liveData={liveData}
        associationFieldValues={associationFieldValues}
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
  associationFieldValues,
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
  associationFieldValues: DocumentFieldsViewProps["associationFieldValues"];
  requestId: string;
  renderedAssociationKeys: React.MutableRefObject<Set<string>>;
  renderedTransactionKeys: React.MutableRefObject<Set<string>>;
  onFieldSaved: () => void;
}) {
  const [assocOpen, setAssocOpen] = useState(!allAssocPopulated);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">
        {schema!.label} — Required Data
      </h3>

      {/* Association Data sub-section */}
      {associationFields.length > 0 && (
        <div className="space-y-2">
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

          {assocOpen && (
            <div className="grid gap-3 sm:grid-cols-2">
              {associationFields.map((field) => {
                // Deduplication: if already rendered for a prior doc type, show "(see above)"
                if (renderedAssociationKeys.current.has(field.key)) {
                  return (
                    <div
                      key={field.key}
                      className="border-l-2 border-slate-200 pl-2"
                    >
                      <p className="text-xs text-slate-500">{field.label}</p>
                      <p className="text-xs text-slate-400 italic">
                        (see above)
                      </p>
                    </div>
                  );
                }
                renderedAssociationKeys.current.add(field.key);

                const value = getAssociationValue(
                  associationFieldValues,
                  field.key
                );
                return (
                  <FieldCell
                    key={field.key}
                    label={field.label}
                    value={value}
                    missing={!value}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Transaction Data sub-section */}
      {transactionFields.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Transaction Data</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {transactionFields.map((field) => {
              // Deduplication
              if (renderedTransactionKeys.current.has(field.key)) {
                return (
                  <div
                    key={field.key}
                    className="border-l-2 border-slate-200 pl-2"
                  >
                    <p className="text-xs text-slate-500">{field.label}</p>
                    <p className="text-xs text-slate-400 italic">
                      (see above)
                    </p>
                  </div>
                );
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
