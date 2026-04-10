"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Check } from "lucide-react";
import type { RequestStatus } from "@/lib/types";

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface TransactionDataFormProps {
  requestId: string;
  existingData: Record<string, string>;
  associationFieldValues: Array<{
    id: string;
    field_key: string;
    value: string | null;
  }>;
  status: RequestStatus;
}

// The 5 core transaction fields
const TRANSACTION_FIELDS = [
  { key: "owner_name", label: "Owner Name", type: "text" as const },
  { key: "unit_lot_number", label: "Unit/Lot Number", type: "text" as const },
  { key: "closing_date", label: "Closing Date", type: "date" as const },
  { key: "balance_due", label: "Balance Due", type: "currency" as const },
  { key: "special_notes", label: "Special Notes", type: "textarea" as const },
];

const INPUT_CLASS =
  "border-0 border-b border-slate-200 rounded-none bg-transparent focus:border-[#38b6ff] focus:outline-none px-0 py-1 text-sm text-slate-900 w-full";

const TEXTAREA_CLASS =
  "border-0 border-b border-slate-200 rounded-none bg-transparent focus:border-[#38b6ff] focus:outline-none px-0 py-1 text-sm text-slate-900 w-full resize-none";

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
      if (field.type === "currency") {
        // Convert cents from DB → dollars for display
        const raw = existingData[field.key] ?? "";
        const num = Number(raw);
        initial[field.key] = raw && !isNaN(num) ? (num / 100).toFixed(2) : raw;
      } else {
        initial[field.key] = existingData[field.key] ?? "";
      }
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});
  const savedValuesRef = useRef<Record<string, string>>({ ...formData });

  // Auto-populate preparation_date and calculated date fields
  useEffect(() => {
    // This is for the top-level form — no auto-date fields here,
    // but ensure closing_date is properly set
  }, []);

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /** Save a single field on blur */
  const handleFieldBlur = useCallback(
    async (key: string) => {
      const currentVal = formData[key]?.trim() ?? "";
      if (currentVal === (savedValuesRef.current[key] ?? "")) return;

      // For currency, convert dollars → cents for DB
      const field = TRANSACTION_FIELDS.find((f) => f.key === key);
      let dbValue = currentVal;
      if (field?.type === "currency" && currentVal) {
        const cleaned = currentVal.replace(/[$,]/g, "");
        const num = parseFloat(cleaned);
        if (!isNaN(num)) {
          dbValue = String(Math.round(num * 100));
        }
      }

      try {
        await fetch(`/api/requests/${requestId}/fields`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field_key: key, value: dbValue, confirm: false }),
        });
        savedValuesRef.current[key] = currentVal;
        setSavedFields((prev) => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setSavedFields((prev) => ({ ...prev, [key]: false }));
        }, 2000);
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    },
    [formData, requestId]
  );

  /** Save all fields at once */
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Convert currency fields to cents before saving
      const dbData: Record<string, string> = {};
      for (const field of TRANSACTION_FIELDS) {
        const val = formData[field.key]?.trim() ?? "";
        if (field.type === "currency" && val) {
          const cleaned = val.replace(/[$,]/g, "");
          const num = parseFloat(cleaned);
          dbData[field.key] = !isNaN(num) ? String(Math.round(num * 100)) : val;
        } else {
          dbData[field.key] = val;
        }
      }

      const res = await fetch(`/api/requests/${requestId}/fields`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: dbData }),
      });
      if (!res.ok) throw new Error("Save failed");
      // Update saved refs
      for (const key of Object.keys(formData)) {
        savedValuesRef.current[key] = formData[key];
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to save transaction data:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transaction Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {TRANSACTION_FIELDS.map((field) => {
            const value = formData[field.key] ?? "";
            const hasValue = value.trim().length > 0;
            const isSaved = savedFields[field.key];

            return (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500">
                    {field.label}
                  </label>
                  {isSaved && (
                    <span className="flex items-center gap-0.5 text-[10px] text-green-500">
                      <Check className="size-2.5" />
                      Saved
                    </span>
                  )}
                </div>
                {field.type === "textarea" ? (
                  <textarea
                    value={value}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    onBlur={() => handleFieldBlur(field.key)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    rows={2}
                    className={TEXTAREA_CLASS}
                  />
                ) : field.type === "currency" ? (
                  <div className="flex items-center">
                    <span className="text-sm text-slate-400 pr-0.5">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      onBlur={() => handleFieldBlur(field.key)}
                      placeholder="0.00"
                      className={INPUT_CLASS}
                    />
                  </div>
                ) : (
                  <input
                    type={field.type}
                    value={value}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    onBlur={() => handleFieldBlur(field.key)}
                    placeholder={
                      field.type === "date" ? "" : `Enter ${field.label.toLowerCase()}`
                    }
                    className={INPUT_CLASS}
                  />
                )}
              </div>
            );
          })}

          <Button
            onClick={handleSaveAll}
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
    </div>
  );
}
