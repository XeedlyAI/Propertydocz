"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DocumentFieldsView } from "./document-fields-view";
import { getDocumentSchema } from "@/lib/document-schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface DocumentWorkAreaProps {
  documentTypes: string[];
  liveData: Record<string, string>;
  associationRecord: Record<string, unknown> | null;
  associationId: string | null;
  requestId: string;
  requestStatus: string;
}

interface GenerationResult {
  document_type: string;
  storage_path: string;
  validation_notes: string;
  warnings: string[];
}

/** Parse AI warning text (dot/bullet separated) into individual items */
function parseAiWarnings(text: string): string[] {
  if (!text) return [];
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

export function DocumentWorkArea({
  documentTypes,
  liveData,
  associationRecord,
  associationId,
  requestId,
  requestStatus,
}: DocumentWorkAreaProps) {
  const router = useRouter();

  // Per-document readiness tracking
  const [docReadiness, setDocReadiness] = useState<Record<string, boolean>>({});

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [results, setResults] = useState<GenerationResult[] | null>(null);
  const [generationErrors, setGenerationErrors] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);

  const handleDocReady = useCallback((docType: string, isReady: boolean) => {
    setDocReadiness((prev) => ({ ...prev, [docType]: isReady }));
  }, []);

  // Compute if all non-upload-only docs are ready
  const nonUploadDocs = documentTypes.filter((dt) => {
    const schema = getDocumentSchema(dt);
    return schema && !schema.upload_only;
  });
  const allReady = nonUploadDocs.length > 0 && nonUploadDocs.every((dt) => docReadiness[dt]);

  async function handleGenerateAll() {
    setGenerating(true);
    setGenError("");
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
        setGenError(data.error || "Failed to generate documents");
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
      setGenError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Document Fields */}
      <DocumentFieldsView
        documentTypes={documentTypes}
        liveData={liveData}
        associationRecord={associationRecord}
        associationId={associationId}
        requestId={requestId}
        requestStatus={requestStatus}
        onDocReady={handleDocReady}
      />

      {/* Generate All button */}
      {allReady && !generated && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleGenerateAll}
              disabled={generating}
              className="w-full gap-2 rounded-[6px] bg-[#38b6ff] text-white font-semibold hover:bg-[#1DA8F0] active:bg-[#0A8FD4] py-6 text-base"
              size="lg"
            >
              {generating ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Sparkles className="size-5" />
              )}
              {generating ? "Generating..." : "Generate All Documents"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {generating && (
        <div className="flex flex-col items-center gap-2 py-4">
          <Loader2 className="size-6 animate-spin text-[#38b6ff]" />
          <p className="text-sm text-muted-foreground">
            Validating data and generating PDFs...
          </p>
        </div>
      )}

      {/* Generation error */}
      {genError && (
        <div className="rounded-lg border border-l-4 border-l-red-500 bg-white p-3">
          <p className="text-sm text-red-600">{genError}</p>
        </div>
      )}

      {/* Generation results */}
      {generated && results && (
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
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#38b6ff] shrink-0" />
                      <span className="text-sm font-medium capitalize">{docLabel}</span>
                    </div>

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
      )}
    </div>
  );
}
