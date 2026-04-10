"use client";

import { useState } from "react";
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

  // Fields pre-populated from the order form start as read-only
  const ORDER_PREPOPULATED_KEYS = ["owner_name", "closing_date"];
  const [lockedFields, setLockedFields] = useState<Set<string>>(() => {
    const locked = new Set<string>();
    for (const key of ORDER_PREPOPULATED_KEYS) {
      if (existingData[key]?.trim()) locked.add(key);
    }
    return locked;
  });

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
    </div>
  );
}
