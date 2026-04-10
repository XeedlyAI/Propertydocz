"use client";

import { useState, useMemo } from "react";
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
import {
  Loader2,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import type { RequestStatus } from "@/lib/types";

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface AssociationFieldValue {
  id: string;
  association_id: string;
  field_key: string;
  value: string | null;
  confidence: string | null;
  source: string | null;
  source_document: string | null;
  last_verified_at: string | null;
  last_verified_by: string | null;
  previous_value: string | null;
}

interface TransactionDataFormProps {
  requestId: string;
  existingData: Record<string, string>;
  associationFieldValues: AssociationFieldValue[];
  status: RequestStatus;
}

// The 5 transaction fields
const TRANSACTION_FIELDS = [
  { key: "owner_name", label: "Owner Name", type: "text" as const },
  { key: "unit_lot_number", label: "Unit/Lot Number", type: "text" as const },
  { key: "closing_date", label: "Closing Date", type: "date" as const },
  { key: "balance_due", label: "Balance Due", type: "text" as const },
  { key: "special_notes", label: "Special Notes", type: "textarea" as const },
];

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function TransactionDataForm({
  requestId,
  existingData,
  associationFieldValues,
  status,
}: TransactionDataFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of TRANSACTION_FIELDS) {
      initial[field.key] = existingData[field.key] ?? "";
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshotOpen, setSnapshotOpen] = useState(false);

  // Fields pre-populated from the order form start as read-only
  const ORDER_PREPOPULATED_KEYS = ["owner_name", "closing_date"];
  const [lockedFields, setLockedFields] = useState<Set<string>>(() => {
    const locked = new Set<string>();
    for (const key of ORDER_PREPOPULATED_KEYS) {
      if (existingData[key]?.trim()) locked.add(key);
    }
    return locked;
  });

  // Status indicator counts
  const stats = useMemo(() => {
    const populated = associationFieldValues.filter(
      (fv) => fv.value && fv.value.trim().length > 0
    ).length;
    const needAttention = associationFieldValues.filter(
      (fv) => !fv.value || fv.value.trim().length === 0
    ).length;
    return { populated, needAttention };
  }, [associationFieldValues]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: formData }),
      });
      if (!res.ok) throw new Error("Save failed");
      router.refresh();
    } catch (err) {
      console.error("Failed to save transaction data:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/analyze`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Refresh failed");
      router.refresh();
    } catch (err) {
      console.error("Failed to refresh from Dropbox:", err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Transaction Fields */}
      <Card className="rounded-xl border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {TRANSACTION_FIELDS.map((field) => {
            const isLocked = lockedFields.has(field.key);

            if (isLocked) {
              return (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="flex-1 truncate">
                      {field.type === "date" && formData[field.key]
                        ? new Date(formData[field.key] + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : formData[field.key] || "\u2014"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setLockedFields((prev) => {
                          const next = new Set(prev);
                          next.delete(field.key);
                          return next;
                        })
                      }
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-slate-200 hover:text-foreground transition-colors"
                      title={`Edit ${field.label.toLowerCase()}`}
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            return field.type === "textarea" ? (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  {field.label}
                </label>
                <Textarea
                  value={formData[field.key]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  rows={3}
                />
              </div>
            ) : (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  {field.label}
                </label>
                <Input
                  type={field.type}
                  value={formData[field.key]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              </div>
            );
          })}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#38b6ff] hover:bg-[#38b6ff]/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save Transaction Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Status indicator line */}
      <div className="flex items-center gap-2 px-1 text-sm">
        {stats.populated > 0 && (
          <span className="inline-flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            {stats.populated} fields populated
          </span>
        )}
        {stats.populated > 0 && stats.needAttention > 0 && (
          <span className="text-slate-300">&middot;</span>
        )}
        {stats.needAttention > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-600">
            <AlertTriangle className="size-3.5" />
            {stats.needAttention} need attention
          </span>
        )}
      </div>

      {/* Association Data Snapshot (collapsible) */}
      <Card className="rounded-xl border border-slate-200">
        <CardHeader className="pb-0">
          <button
            type="button"
            onClick={() => setSnapshotOpen(!snapshotOpen)}
            className="flex w-full items-center justify-between text-left"
          >
            <CardTitle className="text-base">
              Association Data Snapshot
            </CardTitle>
            {snapshotOpen ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>

        {snapshotOpen && (
          <CardContent className="pt-4 space-y-3">
            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="mb-2"
            >
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 size-3.5" />
                  Refresh from Dropbox
                </>
              )}
            </Button>

            {/* Read-only field values */}
            {associationFieldValues.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No association data available yet.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {associationFieldValues.map((fv) => (
                  <div
                    key={fv.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <p className="text-xs text-muted-foreground truncate">
                      {fv.field_key.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-medium truncate">
                      {fv.value && fv.value.trim() ? fv.value : (
                        <span className="text-amber-500 italic">Missing</span>
                      )}
                    </p>
                    {fv.source && (
                      <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                        Source: {fv.source}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
