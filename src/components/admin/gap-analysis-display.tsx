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
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  RefreshCw,
  Loader2,
  CheckCircle2,
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

  const staleCount = gapAnalysis?.stale_fields?.length ?? 0;
  const suspiciousCount = gapAnalysis?.suspicious_fields?.length ?? 0;
  const complianceCount = gapAnalysis?.compliance_flags?.length ?? 0;

  const hasIssues = staleCount > 0 || suspiciousCount > 0 || complianceCount > 0;

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            disabled={analyzing}
            onClick={handleReanalyze}
          >
            {analyzing ? (
              <Loader2 className="size-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="size-3 mr-1" />
            )}
            Refresh from Dropbox
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        {/* Suspicious fields — inline amber warnings */}
        {suspiciousCount > 0 &&
          gapAnalysis!.suspicious_fields.map((sf, i) => (
            <p key={i} className="text-xs text-amber-600 flex items-start gap-1.5">
              <AlertTriangle className="size-3 mt-0.5 shrink-0" />
              <span>
                <span className="font-medium">{formatFieldKey(sf.field_key)}</span>{" "}
                ({sf.current_value}) — {sf.concern}
              </span>
            </p>
          ))}

        {/* Compliance flags — inline red warnings */}
        {complianceCount > 0 &&
          gapAnalysis!.compliance_flags.map((flag, i) => (
            <p key={i} className="text-xs text-red-600 flex items-start gap-1.5">
              <ShieldAlert className="size-3 mt-0.5 shrink-0" />
              <span>{flag}</span>
            </p>
          ))}

        {/* Stale count as badge */}
        {staleCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="size-3 text-yellow-600" />
            <Badge variant="outline" className="text-[10px] py-0 border-yellow-300 text-yellow-700 bg-yellow-50">
              {staleCount} stale field{staleCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}

        {/* All clear */}
        {gapAnalysis && !hasIssues && (
          <div className="flex items-center gap-1.5 text-xs text-green-700">
            <CheckCircle2 className="size-3" />
            All fields look good
          </div>
        )}

        {!gapAnalysis && (
          <p className="text-xs text-muted-foreground">
            No analysis available yet
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600">{error}</p>
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
