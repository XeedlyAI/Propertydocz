"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Check,
  Pencil,
  FileText,
  Sparkles,
} from "lucide-react";

/** Field data passed from the server component */
interface FieldData {
  field_key: string;
  label: string;
  tier: string;
  value_type: string;
  help_text: string | null;
  value: string | null;
  confidence: string | null;
  source: string | null;
  source_document: string | null;
  previous_value: string | null;
  last_verified_at: string | null;
}

interface SectionData {
  key: string;
  label: string;
  order: number;
  fields: FieldData[];
}

interface SummaryData {
  total: number;
  populated: number;
  verified: number;
  aiExtracted: number;
  missing: number;
}

interface OnboardingReviewClientProps {
  associationId: string;
  associationName: string;
  onboardingStatus: string | null;
  sections: SectionData[];
  summary: SummaryData;
}

export function OnboardingReviewClient({
  associationId,
  associationName,
  onboardingStatus,
  sections,
  summary,
}: OnboardingReviewClientProps) {
  const router = useRouter();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save a field value (manual entry or edit)
  const saveField = useCallback(
    async (fieldKey: string, value: string) => {
      setSaving(fieldKey);
      setError(null);
      try {
        const res = await fetch("/api/onboarding/field", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            association_id: associationId,
            field_key: fieldKey,
            value,
            source: "manual",
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to save");
          return;
        }
        setEditingField(null);
        router.refresh();
      } catch {
        setError("Network error");
      } finally {
        setSaving(null);
      }
    },
    [associationId, router]
  );

  // Confirm a single AI-extracted field
  const confirmField = useCallback(
    async (fieldKey: string) => {
      setSaving(fieldKey);
      setError(null);
      try {
        const res = await fetch("/api/onboarding/field", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            association_id: associationId,
            field_key: fieldKey,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to confirm");
          return;
        }
        router.refresh();
      } catch {
        setError("Network error");
      } finally {
        setSaving(null);
      }
    },
    [associationId, router]
  );

  // Confirm all and complete onboarding
  const confirmAllAndComplete = useCallback(async () => {
    setConfirmingAll(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ association_id: associationId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to complete onboarding");
        return;
      }
      router.refresh();
      router.push(`/admin/associations/${associationId}`);
    } catch {
      setError("Network error");
    } finally {
      setConfirmingAll(false);
    }
  }, [associationId, router]);

  const completenessPercent =
    summary.total > 0
      ? Math.round((summary.populated / summary.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <Card className="border-[#38b6ff]/30 bg-[#38b6ff]/5 dark:bg-[#38b6ff]/10">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold">
                {summary.populated} of {summary.total} fields complete
              </p>
              <p className="text-sm text-muted-foreground">
                {summary.verified} verified &middot; {summary.aiExtracted}{" "}
                from documents &middot; {summary.missing} need input
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Completeness bar */}
              <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#38b6ff] rounded-full transition-all"
                  style={{ width: `${completenessPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium">{completenessPercent}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section cards */}
      {sections.map((section) => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle className="text-base">{section.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {section.fields.map((field) => (
                <div
                  key={field.field_key}
                  className={`py-3 first:pt-0 last:pb-0 ${
                    !field.value
                      ? "bg-red-50/50 dark:bg-red-900/10 -mx-6 px-6 border-l-2 border-red-400"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Field info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ConfidenceIndicator confidence={field.confidence} />
                        <span className="text-sm font-medium">
                          {field.label}
                        </span>
                        {field.tier === "periodic" && (
                          <span className="text-[10px] text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded">
                            periodic
                          </span>
                        )}
                      </div>

                      {/* Value display or edit */}
                      {editingField === field.field_key ? (
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            className="h-8 bg-[#38b6ff] hover:bg-[#38b6ff]/90"
                            disabled={saving === field.field_key}
                            onClick={() =>
                              saveField(field.field_key, editValue)
                            }
                          >
                            {saving === field.field_key ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => setEditingField(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : field.value ? (
                        <div className="mt-1">
                          <p className="text-sm text-foreground">
                            {field.value}
                          </p>
                          {field.source_document && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <FileText className="size-3" />
                              From: {field.source_document}
                            </p>
                          )}
                          {field.previous_value &&
                            field.previous_value !== field.value && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                Previous: {field.previous_value}
                              </p>
                            )}
                          {field.last_verified_at && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Last verified:{" "}
                              {new Date(
                                field.last_verified_at
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Enter value manually..."
                              value={
                                editingField === field.field_key
                                  ? editValue
                                  : ""
                              }
                              onChange={(e) => {
                                setEditingField(field.field_key);
                                setEditValue(e.target.value);
                              }}
                              onFocus={() => {
                                setEditingField(field.field_key);
                                setEditValue("");
                              }}
                              className="h-8 text-sm border-red-300 dark:border-red-700"
                            />
                            {editingField === field.field_key && editValue && (
                              <Button
                                size="sm"
                                className="h-8 bg-[#38b6ff] hover:bg-[#38b6ff]/90"
                                disabled={saving === field.field_key}
                                onClick={() =>
                                  saveField(field.field_key, editValue)
                                }
                              >
                                {saving === field.field_key ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  "Save"
                                )}
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-red-500 mt-1">
                            Not found in documents — enter manually
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {field.value && (
                      <div className="flex items-center gap-1 shrink-0">
                        {field.confidence === "ai_extracted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20"
                            disabled={saving === field.field_key}
                            onClick={() => confirmField(field.field_key)}
                          >
                            {saving === field.field_key ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Check className="size-3" />
                            )}
                            Confirm
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            setEditingField(field.field_key);
                            setEditValue(field.value || "");
                          }}
                        >
                          <Pencil className="size-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Complete onboarding button */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t py-4 -mx-6 px-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {summary.aiExtracted > 0 && (
            <span className="flex items-center gap-1">
              <Sparkles className="size-3.5 text-[#38b6ff]" />
              {summary.aiExtracted} AI-extracted fields need confirmation
            </span>
          )}
        </div>
        <Button
          onClick={confirmAllAndComplete}
          disabled={confirmingAll}
          className="bg-[#38b6ff] hover:bg-[#38b6ff]/90"
          size="lg"
        >
          {confirmingAll ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4 mr-2" />
              Confirm All & Complete Onboarding
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          {error}
        </p>
      )}
    </div>
  );
}

/** Colored dot indicating field confidence */
function ConfidenceIndicator({
  confidence,
}: {
  confidence: string | null;
}) {
  if (confidence === "verified") {
    return <CheckCircle2 className="size-4 text-green-500 shrink-0" />;
  }
  if (confidence === "ai_extracted") {
    return <AlertCircle className="size-4 text-yellow-500 shrink-0" />;
  }
  if (confidence === "stale") {
    return <AlertCircle className="size-4 text-orange-500 shrink-0" />;
  }
  // Missing or unverified
  return <XCircle className="size-4 text-red-400 shrink-0" />;
}
