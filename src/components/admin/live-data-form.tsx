"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DocumentType } from "@/lib/types";
import type {
  FieldDefinition,
  AssociationFieldValue,
  FieldTier,
  FieldConfidence,
  GapAnalysisResult,
} from "@/lib/types/fields";
import { FIELD_SECTIONS } from "@/lib/types/fields";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  Minus,
  ChevronDown,
  ChevronRight,
  Shield,
  Clock,
  Save,
  RefreshCw,
} from "lucide-react";

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

/** Visual state for a field row */
type FieldDisplayState = "verified" | "needs_verification" | "needs_input" | "optional_empty";

interface FieldDisplayInfo {
  definition: FieldDefinition;
  associationValue: AssociationFieldValue | null;
  liveValue: string;
  displayState: FieldDisplayState;
  isMissing: boolean;
  isStale: boolean;
  isSuspicious: boolean;
  suspiciousConcern?: string;
}

interface SectionGroup {
  key: string;
  label: string;
  order: number;
  fields: FieldDisplayInfo[];
  verifiedCount: number;
  needsVerificationCount: number;
  needsInputCount: number;
}

interface LiveDataFormProps {
  requestId: string;
  documentTypes: DocumentType[];
  existingData: Record<string, string>;
  fieldDefinitions: SerializedFieldDefinition[];
  associationFieldValues: SerializedAssociationFieldValue[];
  gapAnalysis: GapAnalysisResult | null;
  missingFields: string[];
}

/** Serializable versions (dates as strings from server) */
export interface SerializedFieldDefinition {
  id: string;
  field_key: string;
  label: string;
  tier: string;
  value_type: string;
  section: string;
  document_types: string[];
  validation_rules: { required?: boolean; min?: number; max?: number; pattern?: string } | null;
  staleness_days: number | null;
  extraction_hints: string[] | null;
  display_order: number;
  help_text: string | null;
}

export interface SerializedAssociationFieldValue {
  id: string;
  association_id: string;
  field_key: string;
  value: string | null;
  confidence: string;
  source: string | null;
  source_document: string | null;
  last_verified_at: string | null;
  last_verified_by: string | null;
  previous_value: string | null;
}

// ════════════════════════════════════════
// Display state logic
// ════════════════════════════════════════

function getFieldDisplayState(
  def: SerializedFieldDefinition,
  assocValue: SerializedAssociationFieldValue | null,
  liveValue: string,
  missingFields: string[],
  staleFields: string[],
): FieldDisplayState {
  const isMissing = missingFields.includes(def.field_key);
  const isStale = staleFields.includes(def.field_key);
  const hasValue = liveValue.trim() !== "";
  const hasAssocValue = assocValue?.value != null && assocValue.value.trim() !== "";

  // If the field has no value anywhere and is in missing_fields → needs_input (red)
  if (!hasValue && !hasAssocValue && isMissing) return "needs_input";

  // If the field has no value anywhere and is optional → optional_empty (gray)
  if (!hasValue && !hasAssocValue) return "optional_empty";

  // From here, the field has a value (either in form or association)

  // If it's stale → needs_verification (yellow)
  if (isStale) return "needs_verification";

  // If association value exists but confidence is not verified → needs_verification (yellow)
  if (assocValue && assocValue.confidence !== "verified" && def.tier !== "transaction") {
    return "needs_verification";
  }

  // Tier 1 (static) with a verified association value → verified (green)
  if (def.tier === "static" && assocValue?.confidence === "verified") return "verified";

  // Tier 1 (static) with a value but no association record → needs_verification
  // (value exists from form but hasn't been confirmed at association level)
  if (def.tier === "static" && hasValue && !assocValue) return "needs_verification";

  // Tier 2 (periodic) with recent verified value → verified (green)
  if (def.tier === "periodic" && assocValue?.confidence === "verified" && !isStale) return "verified";

  // Tier 2 (periodic) with value but not verified → needs_verification (yellow)
  if (def.tier === "periodic" && hasValue) return "needs_verification";

  // Tier 3 (transaction) always needs fresh input unless admin entered it
  if (def.tier === "transaction") {
    return hasValue ? "needs_verification" : "needs_input";
  }

  return hasValue ? "verified" : "optional_empty";
}

// ════════════════════════════════════════
// Style maps
// ════════════════════════════════════════

const STATE_STYLES: Record<FieldDisplayState, {
  border: string;
  bg: string;
  icon: typeof CheckCircle2;
  iconColor: string;
  label: string;
}> = {
  verified: {
    border: "border-green-200 dark:border-green-800",
    bg: "bg-green-50/50 dark:bg-green-900/10",
    icon: CheckCircle2,
    iconColor: "text-green-600 dark:text-green-400",
    label: "Verified",
  },
  needs_verification: {
    border: "border-yellow-200 dark:border-yellow-800",
    bg: "bg-yellow-50/50 dark:bg-yellow-900/10",
    icon: AlertTriangle,
    iconColor: "text-yellow-600 dark:text-yellow-400",
    label: "Needs Verification",
  },
  needs_input: {
    border: "border-red-200 dark:border-red-800",
    bg: "bg-red-50/50 dark:bg-red-900/10",
    icon: CircleDot,
    iconColor: "text-red-600 dark:text-red-400",
    label: "Needs Input",
  },
  optional_empty: {
    border: "border-gray-200 dark:border-gray-700",
    bg: "bg-gray-50/30 dark:bg-gray-800/20",
    icon: Minus,
    iconColor: "text-gray-400 dark:text-gray-500",
    label: "Optional",
  },
};

const TIER_LABELS: Record<string, string> = {
  static: "Static",
  periodic: "Periodic",
  transaction: "Per-Transaction",
};

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function LiveDataForm({
  requestId,
  documentTypes,
  existingData,
  fieldDefinitions,
  associationFieldValues,
  gapAnalysis,
  missingFields,
}: LiveDataFormProps) {
  const router = useRouter();

  // Build lookup maps
  const assocValueMap = useMemo(() => {
    const map = new Map<string, SerializedAssociationFieldValue>();
    for (const v of associationFieldValues) {
      map.set(v.field_key, v);
    }
    return map;
  }, [associationFieldValues]);

  const staleFields = useMemo(
    () => gapAnalysis?.stale_fields ?? [],
    [gapAnalysis]
  );

  const suspiciousMap = useMemo(() => {
    const map = new Map<string, string>();
    if (gapAnalysis?.suspicious_fields) {
      for (const sf of gapAnalysis.suspicious_fields) {
        map.set(sf.field_key, sf.concern);
      }
    }
    return map;
  }, [gapAnalysis]);

  // Form state — initialize from existingData (live_data), falling back to
  // association field values. This ensures fields populated during onboarding
  // or via Dropbox sync show their real values even if auto-fill hasn't run
  // on this specific request yet.
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    // Build a quick lookup for association values
    const assocMap = new Map<string, string>();
    for (const v of associationFieldValues) {
      if (v.value) assocMap.set(v.field_key, v.value);
    }

    const initial: Record<string, string> = {};
    for (const def of fieldDefinitions) {
      if (existingData[def.field_key]) {
        // Priority 1: live_data on the request (admin edits, auto-fill output)
        initial[def.field_key] = existingData[def.field_key];
      } else if (def.tier !== "transaction" && assocMap.has(def.field_key)) {
        // Priority 2: association field values (for static/periodic fields)
        initial[def.field_key] = assocMap.get(def.field_key)!;
      } else if (def.field_key === "preparation_date") {
        // Auto-fill preparation_date with today's date
        initial[def.field_key] = new Date().toISOString().split("T")[0];
      } else {
        initial[def.field_key] = "";
      }
    }
    return initial;
  });

  // Track which fields have been locally edited
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

  // Track which fields have been confirmed this session
  const [confirmedFields, setConfirmedFields] = useState<Set<string>>(new Set());

  // Collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Loading states
  const [savingField, setSavingField] = useState<string | null>(null);
  const [confirmingField, setConfirmingField] = useState<string | null>(null);
  const [bulkConfirming, setBulkConfirming] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Build sections ──────────────────────────

  const sections = useMemo((): SectionGroup[] => {
    const sectionMap = new Map<string, FieldDisplayInfo[]>();

    for (const def of fieldDefinitions) {
      const assocValue = assocValueMap.get(def.field_key) ?? null;
      const liveValue = formData[def.field_key] ?? "";
      const isConfirmedThisSession = confirmedFields.has(def.field_key);

      let displayState = getFieldDisplayState(
        def,
        assocValue,
        liveValue,
        missingFields,
        staleFields
      );

      // Override to verified if confirmed this session
      if (isConfirmedThisSession && displayState === "needs_verification") {
        displayState = "verified";
      }

      const info: FieldDisplayInfo = {
        definition: def as unknown as FieldDefinition,
        associationValue: assocValue as unknown as AssociationFieldValue | null,
        liveValue,
        displayState,
        isMissing: missingFields.includes(def.field_key),
        isStale: staleFields.includes(def.field_key),
        isSuspicious: suspiciousMap.has(def.field_key),
        suspiciousConcern: suspiciousMap.get(def.field_key),
      };

      const sectionKey = def.section || "general_info";
      if (!sectionMap.has(sectionKey)) {
        sectionMap.set(sectionKey, []);
      }
      sectionMap.get(sectionKey)!.push(info);
    }

    return Array.from(sectionMap.entries())
      .map(([key, fields]) => ({
        key,
        label: FIELD_SECTIONS[key]?.label ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        order: FIELD_SECTIONS[key]?.order ?? 99,
        fields: fields.sort((a, b) => a.definition.display_order - b.definition.display_order),
        verifiedCount: fields.filter((f) => f.displayState === "verified").length,
        needsVerificationCount: fields.filter((f) => f.displayState === "needs_verification").length,
        needsInputCount: fields.filter((f) => f.displayState === "needs_input").length,
      }))
      .sort((a, b) => a.order - b.order);
  }, [fieldDefinitions, formData, assocValueMap, missingFields, staleFields, suspiciousMap, confirmedFields]);

  // ── Summary counts ──────────────────────────

  const totalFields = fieldDefinitions.length;
  const verifiedCount = sections.reduce((sum, s) => sum + s.verifiedCount, 0);
  const needsVerificationCount = sections.reduce((sum, s) => sum + s.needsVerificationCount, 0);
  const needsInputCount = sections.reduce((sum, s) => sum + s.needsInputCount, 0);
  const filledCount = Object.values(formData).filter((v) => v.trim() !== "").length;

  // ── Handlers ────────────────────────────────

  const handleFieldChange = useCallback((fieldKey: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
    setDirtyFields((prev) => new Set(prev).add(fieldKey));
  }, []);

  const toggleSection = useCallback((sectionKey: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionKey)) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  }, []);

  // Save a single field (updates live_data + optionally syncs)
  const handleSaveField = useCallback(async (fieldKey: string, confirm: boolean) => {
    if (confirm) {
      setConfirmingField(fieldKey);
    } else {
      setSavingField(fieldKey);
    }
    setError(null);

    try {
      const res = await fetch(`/api/requests/${requestId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_key: fieldKey,
          value: formData[fieldKey] ?? "",
          confirm,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save field");
        return;
      }

      setDirtyFields((prev) => {
        const next = new Set(prev);
        next.delete(fieldKey);
        return next;
      });

      if (confirm) {
        setConfirmedFields((prev) => new Set(prev).add(fieldKey));
      }
    } catch {
      setError("Network error saving field");
    } finally {
      setSavingField(null);
      setConfirmingField(null);
    }
  }, [requestId, formData]);

  // Bulk confirm all "needs_verification" fields
  const handleBulkConfirm = useCallback(async () => {
    const toConfirm = sections
      .flatMap((s) => s.fields)
      .filter((f) => f.displayState === "needs_verification" && f.liveValue.trim() !== "")
      .map((f) => f.definition.field_key);

    if (toConfirm.length === 0) return;

    setBulkConfirming(true);
    setError(null);

    try {
      const res = await fetch(`/api/requests/${requestId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field_keys: toConfirm }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to confirm fields");
        return;
      }

      setConfirmedFields((prev) => {
        const next = new Set(prev);
        for (const key of toConfirm) next.add(key);
        return next;
      });
    } catch {
      setError("Network error confirming fields");
    } finally {
      setBulkConfirming(false);
    }
  }, [requestId, sections]);

  // Save all and advance to ready_for_generation
  const handleSaveAll = useCallback(async () => {
    setSavingAll(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/requests/${requestId}/live-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ live_data: formData }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save data");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error saving data");
    } finally {
      setSavingAll(false);
    }
  }, [requestId, formData, router]);

  // Re-analyze
  const handleReanalyze = useCallback(async () => {
    setReanalyzing(true);
    setError(null);

    try {
      const res = await fetch(`/api/requests/${requestId}/analyze`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Analysis failed");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setReanalyzing(false);
    }
  }, [requestId, router]);

  // ── Render ──────────────────────────────────

  if (fieldDefinitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No field definitions found for these document types.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══ Summary Bar ═══ */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Counts */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium">
                {filledCount}/{totalFields} fields filled
              </span>
              {verifiedCount > 0 && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="size-3.5" />
                  {verifiedCount} verified
                </span>
              )}
              {needsVerificationCount > 0 && (
                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="size-3.5" />
                  {needsVerificationCount} need verification
                </span>
              )}
              {needsInputCount > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <CircleDot className="size-3.5" />
                  {needsInputCount} need input
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {needsVerificationCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={bulkConfirming}
                  onClick={handleBulkConfirm}
                >
                  {bulkConfirming ? (
                    <Loader2 className="size-3 animate-spin mr-1" />
                  ) : (
                    <Shield className="size-3 mr-1" />
                  )}
                  Confirm All Verified
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={reanalyzing}
                onClick={handleReanalyze}
              >
                {reanalyzing ? (
                  <Loader2 className="size-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="size-3 mr-1" />
                )}
                Re-analyze
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#38b6ff] transition-all"
              style={{ width: `${totalFields > 0 ? (filledCount / totalFields) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ═══ Field Sections ═══ */}
      {sections.map((section) => {
        const isCollapsed = collapsedSections.has(section.key);

        return (
          <Card key={section.key}>
            <CardHeader
              className="py-3 cursor-pointer select-none hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection(section.key)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                  {section.label}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {section.verifiedCount > 0 && (
                    <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="size-3" />
                      {section.verifiedCount}
                    </span>
                  )}
                  {section.needsVerificationCount > 0 && (
                    <span className="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400">
                      <AlertTriangle className="size-3" />
                      {section.needsVerificationCount}
                    </span>
                  )}
                  {section.needsInputCount > 0 && (
                    <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400">
                      <CircleDot className="size-3" />
                      {section.needsInputCount}
                    </span>
                  )}
                  <span>{section.fields.length} fields</span>
                </div>
              </div>
            </CardHeader>

            {!isCollapsed && (
              <CardContent className="pt-0 space-y-2">
                {section.fields.map((field) => (
                  <FieldRow
                    key={field.definition.field_key}
                    field={field}
                    value={formData[field.definition.field_key] ?? ""}
                    isDirty={dirtyFields.has(field.definition.field_key)}
                    isSaving={savingField === field.definition.field_key}
                    isConfirming={confirmingField === field.definition.field_key}
                    onChange={handleFieldChange}
                    onSave={handleSaveField}
                  />
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* ═══ Error ═══ */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* ═══ Save All & Advance ═══ */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Saving advances this request to &quot;Ready for Generation&quot;.
        </p>
        <Button
          onClick={handleSaveAll}
          disabled={savingAll}
          className="sm:w-auto"
        >
          {savingAll ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save All &amp; Advance to Generation
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Field Row sub-component
// ════════════════════════════════════════

function FieldRow({
  field,
  value,
  isDirty,
  isSaving,
  isConfirming,
  onChange,
  onSave,
}: {
  field: FieldDisplayInfo;
  value: string;
  isDirty: boolean;
  isSaving: boolean;
  isConfirming: boolean;
  onChange: (key: string, value: string) => void;
  onSave: (key: string, confirm: boolean) => void;
}) {
  const def = field.definition;
  const style = STATE_STYLES[field.displayState];
  const Icon = style.icon;

  const isCurrency = def.value_type === "currency";
  // Currency fields use text input (so we can show $1,234.56 formatting)
  const inputType = def.value_type === "number"
    ? "number"
    : def.value_type === "date"
      ? "date"
      : "text";

  const isTextarea = def.value_type === "text_array" || (def.help_text?.includes("list") ?? false);
  const showConfirm = field.displayState === "needs_verification" && value.trim() !== "";

  // Format currency for display (but store raw value)
  const displayValue = isCurrency ? formatCurrencyDisplay(value) : value;

  // Placeholder: use a generic prompt, NOT the field label
  const placeholder = isCurrency
    ? "$0.00"
    : def.value_type === "date"
      ? "YYYY-MM-DD"
      : def.value_type === "number"
        ? "0"
        : "Enter value...";

  return (
    <div className={`rounded-lg border p-3 transition-colors ${style.border} ${style.bg}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
        {/* Label + metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={`size-3.5 shrink-0 ${style.iconColor}`} />
            <label
              htmlFor={def.field_key}
              className="text-sm font-medium leading-tight"
            >
              {def.label}
            </label>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground whitespace-nowrap">
              {TIER_LABELS[def.tier] ?? def.tier}
            </span>
          </div>

          {/* Help text */}
          {def.help_text && (
            <p className="text-xs text-muted-foreground mt-0.5 pl-5.5">
              {def.help_text}
            </p>
          )}

          {/* Suspicious concern */}
          {field.isSuspicious && field.suspiciousConcern && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 pl-5.5 flex items-center gap-1">
              <AlertTriangle className="size-3 shrink-0" />
              {field.suspiciousConcern}
            </p>
          )}

          {/* Source metadata */}
          {field.associationValue && (
            <div className="flex items-center gap-2 mt-1 pl-5.5 text-[10px] text-muted-foreground">
              {field.associationValue.source && (
                <span>Source: {field.associationValue.source.replace(/_/g, " ")}</span>
              )}
              {field.associationValue.last_verified_at && (
                <span className="flex items-center gap-0.5">
                  <Clock className="size-2.5" />
                  {new Date(field.associationValue.last_verified_at).toLocaleDateString()}
                </span>
              )}
              {field.isStale && (
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">Stale</span>
              )}
            </div>
          )}
        </div>

        {/* Input + actions */}
        <div className="flex items-start gap-2 sm:w-64 md:w-80">
          {isTextarea ? (
            <Textarea
              id={def.field_key}
              value={value}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onChange(def.field_key, e.target.value)
              }
              placeholder={placeholder}
              rows={2}
              className="text-sm min-h-[60px]"
            />
          ) : isCurrency ? (
            <Input
              id={def.field_key}
              type="text"
              value={displayValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                // Strip formatting, keep raw value for storage
                const raw = e.target.value.replace(/[^0-9.\-]/g, "");
                onChange(def.field_key, raw);
              }}
              onBlur={() => {
                // Re-format on blur
                if (value.trim()) {
                  const formatted = formatCurrencyRaw(value);
                  if (formatted !== value) {
                    onChange(def.field_key, formatted);
                  }
                }
              }}
              placeholder={placeholder}
              className="text-sm"
            />
          ) : (
            <Input
              id={def.field_key}
              type={inputType}
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onChange(def.field_key, e.target.value)
              }
              placeholder={placeholder}
              step={inputType === "number" ? "0.01" : undefined}
              className="text-sm"
            />
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-1 shrink-0">
            {isDirty && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={isSaving}
                onClick={() => onSave(def.field_key, false)}
                title="Save field"
              >
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
              </Button>
            )}
            {showConfirm && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                disabled={isConfirming}
                onClick={() => onSave(def.field_key, true)}
                title="Confirm as verified"
              >
                {isConfirming ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Currency formatting helpers
// ════════════════════════════════════════

/**
 * Format a value for display in currency fields.
 * Handles values that are already formatted ($1,234.56) or raw (1234.56).
 */
function formatCurrencyDisplay(value: string): string {
  if (!value || value.trim() === "") return "";

  // If already has $ sign, return as-is (already formatted from DB)
  if (value.startsWith("$")) return value;

  // Try to parse as number and format
  const num = parseFloat(value.replace(/[^0-9.\-]/g, ""));
  if (isNaN(num)) return value;

  return "$" + num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Normalize a raw currency input to a clean numeric string.
 * Used on blur to clean up user input.
 */
function formatCurrencyRaw(value: string): string {
  if (!value || value.trim() === "") return "";

  // Strip everything except digits, dots, minus
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return value;

  return num.toFixed(2);
}
