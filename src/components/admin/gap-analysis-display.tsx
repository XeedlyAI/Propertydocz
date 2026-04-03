"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  RefreshCw,
  Loader2,
  CheckCircle2,
  BarChart3,
} from "lucide-react";

interface SuspiciousField {
  field_key: string;
  current_value: string;
  concern: string;
}

interface GapAnalysisData {
  missing_fields: string[];
  stale_fields: string[];
  suspicious_fields: SuspiciousField[];
  compliance_flags: string[];
  completeness_score: number;
  recommended_status: string;
  summary: string;
}

interface GapAnalysisDisplayProps {
  requestId: string;
  gapAnalysis: GapAnalysisData | null;
  completenessScore: number | null;
  fieldsTotal: number;
  fieldsFilled: number;
}

export function GapAnalysisDisplay({
  requestId,
  gapAnalysis,
  completenessScore,
  fieldsTotal,
  fieldsFilled,
}: GapAnalysisDisplayProps) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReanalyze() {
    setAnalyzing(true);
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
      setAnalyzing(false);
    }
  }

  const score = completenessScore ?? gapAnalysis?.completeness_score ?? 0;
  const missingCount = gapAnalysis?.missing_fields?.length ?? 0;
  const staleCount = gapAnalysis?.stale_fields?.length ?? 0;
  const suspiciousCount = gapAnalysis?.suspicious_fields?.length ?? 0;
  const complianceCount = gapAnalysis?.compliance_flags?.length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="size-4 text-[#38b6ff]" />
            Data Completeness
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={analyzing}
            onClick={handleReanalyze}
          >
            {analyzing ? (
              <Loader2 className="size-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="size-3 mr-1" />
            )}
            Re-analyze
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              <span className="font-semibold">{fieldsFilled}</span> of{" "}
              <span className="font-semibold">{fieldsTotal}</span> fields
              {missingCount > 0 && (
                <span className="text-red-600 dark:text-red-400 ml-1">
                  &middot; {missingCount} need data
                </span>
              )}
              {staleCount > 0 && (
                <span className="text-yellow-600 dark:text-yellow-400 ml-1">
                  &middot; {staleCount} need verification
                </span>
              )}
            </span>
            <span className="font-data font-semibold text-sm">{score}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                score >= 90
                  ? "bg-green-500"
                  : score >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Summary text */}
        {gapAnalysis?.summary && (
          <p className="text-xs text-muted-foreground">
            {gapAnalysis.summary}
          </p>
        )}

        {/* Suspicious fields */}
        {suspiciousCount > 0 && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3 space-y-1.5">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="size-3.5" />
              AI flagged {suspiciousCount} concern{suspiciousCount !== 1 ? "s" : ""}:
            </p>
            {gapAnalysis!.suspicious_fields.map((sf, i) => (
              <p key={i} className="text-xs text-amber-600 dark:text-amber-400 pl-5">
                &bull; <span className="font-medium">{formatFieldKey(sf.field_key)}</span>{" "}
                ({sf.current_value}) &mdash; {sf.concern}
              </p>
            ))}
          </div>
        )}

        {/* Compliance flags */}
        {complianceCount > 0 && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-3 space-y-1.5">
            <p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
              <ShieldAlert className="size-3.5" />
              Compliance:
            </p>
            {gapAnalysis!.compliance_flags.map((flag, i) => (
              <p key={i} className="text-xs text-red-600 dark:text-red-400 pl-5">
                &bull; {flag}
              </p>
            ))}
          </div>
        )}

        {/* Stale fields */}
        {staleCount > 0 && (
          <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10 p-3 space-y-1.5">
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
              <Clock className="size-3.5" />
              {staleCount} field{staleCount !== 1 ? "s" : ""} need verification:
            </p>
            {gapAnalysis!.stale_fields.map((key, i) => (
              <p key={i} className="text-xs text-yellow-600 dark:text-yellow-400 pl-5">
                &bull; {formatFieldKey(key)}
              </p>
            ))}
          </div>
        )}

        {/* All clear */}
        {gapAnalysis &&
          missingCount === 0 &&
          staleCount === 0 &&
          suspiciousCount === 0 &&
          complianceCount === 0 && (
            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
              <CheckCircle2 className="size-3.5" />
              All fields look good — ready for generation
            </div>
          )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Convert field_key to human-readable label */
function formatFieldKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
