"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentType } from "@/lib/types";
import { Loader2 } from "lucide-react";

// Default fields to collect per document type when missing_fields is empty
const DEFAULT_FIELDS: Record<DocumentType, { key: string; label: string; type: "text" | "number" | "textarea" }[]> = {
  resale_certificate: [
    { key: "current_balance_due", label: "Current Balance Due ($)", type: "number" },
    { key: "outstanding_violations", label: "Outstanding Violations", type: "textarea" },
    { key: "special_assessments_due", label: "Special Assessments Currently Due ($)", type: "number" },
    { key: "transfer_fee_due", label: "Transfer Fee Due at Closing ($)", type: "number" },
    { key: "other_fees", label: "Other Fees (move-in deposit, key fees, etc.)", type: "textarea" },
    { key: "prorated_assessment", label: "Prorated Assessment Through Closing ($)", type: "number" },
    { key: "account_status", label: "Account Status (current, delinquent, collections)", type: "text" },
    { key: "unit_restrictions", label: "Unit-Specific Restrictions or Encumbrances", type: "textarea" },
  ],
  payoff_statement: [
    { key: "assessments_through_date", label: "Assessments Through Good-Through Date ($)", type: "number" },
    { key: "past_due_balance", label: "Past Due Balance ($)", type: "number" },
    { key: "late_fees", label: "Late Fees ($)", type: "number" },
    { key: "interest_accrued", label: "Interest Accrued ($)", type: "number" },
    { key: "special_assessments_due", label: "Special Assessments Due ($)", type: "number" },
    { key: "legal_collection_fees", label: "Legal/Collection Fees ($)", type: "number" },
    { key: "fines_violation_fees", label: "Fines/Violation Fees ($)", type: "number" },
    { key: "other_charges", label: "Other Charges (itemized)", type: "textarea" },
    { key: "per_diem_rate", label: "Per Diem Rate ($)", type: "number" },
    { key: "good_through_date", label: "Good-Through Date", type: "text" },
    { key: "closing_date", label: "Closing Date", type: "text" },
  ],
  governing_documents: [
    { key: "notes", label: "Notes (missing documents, special instructions)", type: "textarea" },
  ],
  lender_questionnaire: [
    { key: "units_delinquent_60_days", label: "Units Delinquent 60+ Days (count)", type: "number" },
    { key: "units_delinquent_pct", label: "Delinquent Percentage (%)", type: "number" },
    { key: "owner_occupied_count", label: "Owner-Occupied Units (count)", type: "number" },
    { key: "second_home_count", label: "Second Home Units (count)", type: "number" },
    { key: "investor_owned_count", label: "Investor-Owned/Rented Units (count)", type: "number" },
    { key: "current_reserve_balance", label: "Current Reserve Balance ($)", type: "number" },
    { key: "additional_notes", label: "Additional Notes", type: "textarea" },
  ],
};

interface LiveDataFormProps {
  requestId: string;
  documentTypes: DocumentType[];
  missingFields: string[];
  existingData: Record<string, string>;
}

export function LiveDataForm({
  requestId,
  documentTypes,
  missingFields,
  existingData,
}: LiveDataFormProps) {
  // Build field list from missing_fields or default fields for each doc type
  const fields = missingFields.length > 0
    ? missingFields.map((f) => ({ key: f, label: f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), type: "text" as const }))
    : documentTypes.flatMap((dt) => DEFAULT_FIELDS[dt] || []);

  // Deduplicate by key
  const uniqueFields = Array.from(
    new Map(fields.map((f) => [f.key, f])).values()
  );

  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    uniqueFields.forEach((f) => {
      initial[f.key] = existingData[f.key] || "";
    });
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/requests/${requestId}/live-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ live_data: formData }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save data");
        return;
      }

      // Refresh the page to show updated status
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (uniqueFields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No additional data fields required for this request.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {uniqueFields.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          {field.type === "textarea" ? (
            <Textarea
              id={field.key}
              value={formData[field.key]}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          ) : (
            <Input
              id={field.key}
              type={field.type}
              value={formData[field.key]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
              placeholder={`Enter ${field.label.toLowerCase()}`}
              step={field.type === "number" ? "0.01" : undefined}
            />
          )}
        </div>
      ))}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Data & Advance to Generation"
        )}
      </Button>
    </form>
  );
}
