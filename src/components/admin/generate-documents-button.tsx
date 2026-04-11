"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { runPreGenerationCheck } from "@/lib/field-validations";
import type { PreGenCheckResult } from "@/lib/field-validations";
import { getRequiredFields } from "@/lib/document-schemas";
import {
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";

interface GenerationResult {
  document_type: string;
  storage_path: string;
  validation_notes: string;
  warnings: string[];
}

interface GenerateDocumentsButtonProps {
  requestId: string;
  status: string;
  liveData?: Record<string, string>;
  associationRecord?: Record<string, unknown> | null;
  documentTypes?: string[];
}

/** Parse AI warning text (· separated) into individual items */
function parseAiWarnings(text: string): string[] {
  if (!text) return [];
  // Split on · or bullet-style separators
  return text
    .split(/\s*[·•]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Classify an AI warning by severity based on keywords */
function classifyWarning(text: string): "critical" | "warning" | "info" {
  const lower = text.toLowerCase();
  if (
    lower.includes("critical") ||
    lower.includes("does not comply") ||
    lower.includes("prevent validation") ||
    lower.includes("violate")
  ) {
    return "critical";
  }
  if (
    lower.includes("suspicious") ||
    lower.includes("excessive") ||
    lower.includes("inconsistent") ||
    lower.includes("missing") ||
    lower.includes("outdated") ||
    lower.includes("impact") ||
    lower.includes("ambiguity")
  ) {
    return "warning";
  }
  return "info";
}

export function GenerateDocumentsButton({
  requestId,
  status,
  liveData = {},
  associationRecord = null,
  documentTypes = [],
}: GenerateDocumentsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<GenerationResult[] | null>(null);
  const [generationErrors, setGenerationErrors] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);

  // Layer 2: Pre-generation validation state
  const [preGenResult, setPreGenResult] = useState<PreGenCheckResult | null>(null);
  const [preGenChecked, setPreGenChecked] = useState(false);
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false);

  /** Layer 2: Run pre-generation check before allowing generation */
  function handlePreGenCheck() {
    const requiredKeys: string[] = [];
    for (const dt of documentTypes) {
      const fields = getRequiredFields(dt, "per_transaction");
      for (const f of fields) {
        if (!requiredKeys.includes(f.key)) requiredKeys.push(f.key);
      }
    }

    const result = runPreGenerationCheck(
      liveData,
      associationRecord,
      documentTypes[0] || "",
      requiredKeys
    );

    setPreGenResult(result);
    setPreGenChecked(true);
    setWarningsAcknowledged(false);

    // If completely clean, allow generation immediately
    if (result.passed && result.warnings.length === 0) {
      handleGenerate();
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setResults(null);
    setGenerationErrors([]);

    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate documents");
        return;
      }

      if (data.generated && data.generated.length > 0) {
        setResults(data.generated);
      }

      if (data.errors && data.errors.length > 0) {
        setGenerationErrors(data.errors);
      }

      if (data.success) {
        setGenerated(true);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // After generation + refresh, status becomes pending_review.
  if (status === "pending_review" && !generated) {
    return null;
  }

  // Show results after generation
  if (generated && results) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generation Complete</CardTitle>
          <CardDescription>
            Documents have been generated and are ready for review below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((r) => {
              const docLabel = r.document_type.replace(/_/g, " ");
              const aiItems = parseAiWarnings(r.validation_notes);
              const hasIssues = aiItems.length > 0 || r.warnings.length > 0;

              return (
                <div key={r.document_type} className="space-y-2">
                  {/* Document header */}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-[#38b6ff] shrink-0" />
                    <span className="text-sm font-medium capitalize">{docLabel}</span>
                  </div>

                  {/* AI audit results — Layer 3 (formatted as proper list) */}
                  {hasIssues && (
                    <div className="ml-6 rounded-md border border-amber-200 bg-amber-50/50 p-3 space-y-1.5">
                      <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">
                        AI Audit Findings
                      </p>
                      <ul className="space-y-1">
                        {aiItems.map((item, i) => {
                          const severity = classifyWarning(item);
                          return (
                            <li
                              key={i}
                              className={`flex items-start gap-1.5 text-xs leading-relaxed ${
                                severity === "critical"
                                  ? "text-red-600"
                                  : severity === "warning"
                                    ? "text-amber-700"
                                    : "text-slate-600"
                              }`}
                            >
                              {severity === "critical" ? (
                                <XCircle className="size-3 shrink-0 mt-0.5" />
                              ) : severity === "warning" ? (
                                <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                              ) : (
                                <span className="size-3 shrink-0 mt-0.5 text-center">&#8226;</span>
                              )}
                              <span>{item}</span>
                            </li>
                          );
                        })}
                        {r.warnings.map((w, i) => (
                          <li
                            key={`w-${i}`}
                            className="flex items-start gap-1.5 text-xs text-amber-700 leading-relaxed"
                          >
                            <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}

            {generationErrors.length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50/50 p-3 space-y-1">
                <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wide">
                  Generation Errors
                </p>
                {generationErrors.map((e, i) => (
                  <p key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                    <XCircle className="size-3 shrink-0 mt-0.5" />
                    {e}
                  </p>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pre-generation state — show validation or generate button
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generate Documents</CardTitle>
        <CardDescription>
          {preGenChecked
            ? "Review the pre-generation check results before proceeding."
            : "Run a pre-generation check to validate data before generating PDFs."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Step 1: Pre-gen check button (if not yet checked) */}
          {!preGenChecked && (
            <Button
              onClick={handlePreGenCheck}
              disabled={loading}
              className="w-full gap-2 rounded-[6px] bg-[#38b6ff] text-white font-semibold hover:bg-[#1DA8F0] active:bg-[#0A8FD4]"
              size="lg"
            >
              <ShieldCheck className="size-4" />
              Validate &amp; Generate Documents
            </Button>
          )}

          {/* Step 2: Pre-gen check results */}
          {preGenChecked && preGenResult && !loading && !generated && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-700">Pre-Generation Check</p>

              {/* Errors */}
              {preGenResult.errors.length > 0 && (
                <div className="space-y-1">
                  {preGenResult.errors.map((e, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-xs text-red-600">
                      <XCircle className="size-3 shrink-0 mt-0.5" />
                      <span><strong>{e.label}:</strong> {e.message}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {preGenResult.warnings.length > 0 && (
                <div className="space-y-1">
                  {preGenResult.warnings.map((w, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-xs text-amber-600">
                      <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                      <span><strong>{w.label}:</strong> {w.message}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Actions */}
              {preGenResult.errors.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-red-500">Fix the errors above before generating</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setPreGenChecked(false);
                      setPreGenResult(null);
                    }}
                  >
                    Dismiss &amp; Fix
                  </Button>
                </div>
              ) : preGenResult.warnings.length > 0 ? (
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={warningsAcknowledged}
                      onChange={(e) => setWarningsAcknowledged(e.target.checked)}
                      className="mt-0.5 size-3.5 rounded border-border accent-[#38b6ff]"
                    />
                    <span>I&apos;ve reviewed these warnings and the data is correct</span>
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setPreGenChecked(false);
                        setPreGenResult(null);
                      }}
                    >
                      Go Back
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1 bg-[#38b6ff] text-white hover:bg-[#1DA8F0]"
                      disabled={!warningsAcknowledged || loading}
                      onClick={handleGenerate}
                    >
                      {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      Generate Anyway
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="size-6 animate-spin text-[#38b6ff]" />
              <p className="text-sm text-muted-foreground">
                Validating data and generating PDFs...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-l-4 border-l-red-500 bg-white p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
