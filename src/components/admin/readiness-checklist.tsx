"use client";

import { DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface FieldValue {
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

interface ReadinessChecklistProps {
  liveData: Record<string, string>;
  associationFieldValues: FieldValue[];
  documentTypes: string[];
  requestStatus: string;
}

interface CheckItem {
  label: string;
  ok: boolean;
  actionLabel?: string;
  targetId?: string;
}

export function ReadinessChecklist({
  liveData,
  associationFieldValues,
  documentTypes,
  requestStatus,
}: ReadinessChecklistProps) {
  // Only show in pre-generation phases
  const showStatuses = ["paid", "awaiting_data", "ready_for_generation"];
  if (!showStatuses.includes(requestStatus)) {
    return null;
  }

  const items: CheckItem[] = [];

  // 1. Transaction details confirmed
  const hasOwner = !!(liveData.owner_names || liveData.owner_name);
  const hasClosing = !!liveData.closing_date;
  const transactionOk = hasOwner && hasClosing;
  items.push({
    label: "Transaction details confirmed",
    ok: transactionOk,
    actionLabel: transactionOk ? undefined : "Enter transaction details",
    targetId: "transaction-data",
  });

  // 2. Association data current (verified within 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const hasRecentVerification = associationFieldValues.some((fv) => {
    if (!fv.last_verified_at) return false;
    return new Date(fv.last_verified_at) >= sevenDaysAgo;
  });
  items.push({
    label: "Association data current",
    ok: hasRecentVerification,
    actionLabel: hasRecentVerification ? undefined : "Refresh from Dropbox",
    targetId: "association-data",
  });

  // 3. Per-document template readiness
  for (const dt of documentTypes) {
    const label = DOCUMENT_LABELS[dt as DocumentType] || dt;
    items.push({
      label: `${label} template ready`,
      ok: true, // templates always exist for now
    });
  }

  const allGreen = items.every((item) => item.ok);

  return (
    <Card
      className={
        allGreen ? "" : "border-l-4 border-l-amber-400"
      }
    >
      <CardContent className="py-3 px-4">
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {item.ok ? (
                <CheckCircle2 className="size-4 shrink-0 text-green-500" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 text-amber-500" />
              )}
              <span className={item.ok ? "text-muted-foreground" : "font-medium"}>
                {item.ok ? item.label : (item.actionLabel || item.label)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
