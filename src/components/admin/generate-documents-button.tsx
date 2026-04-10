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
import { Loader2, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

interface GenerationResult {
  document_type: string;
  storage_path: string;
  validation_notes: string;
  warnings: string[];
}

interface GenerateDocumentsButtonProps {
  requestId: string;
  status: string;
}

export function GenerateDocumentsButton({
  requestId,
  status,
}: GenerateDocumentsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<GenerationResult[] | null>(null);
  const [generationErrors, setGenerationErrors] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);

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

      // Use router.refresh() to re-fetch server components without losing
      // client state — the success banner persists while the page updates
      // to show pending_review status and generated documents.
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
  // If we didn't just generate (no client-side results), don't render anything —
  // the GeneratedDocumentsCard handles the pending_review display.
  if (status === "pending_review" && !generated) {
    return null;
  }

  // Show the generate card when ready, or results after generation
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {generated ? "Generation Complete" : "Generate Documents"}
        </CardTitle>
        <CardDescription>
          {generated
            ? "Documents have been generated and are ready for review below."
            : "All data has been collected. Generate PDFs for review using Typst templates and Claude AI validation."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {!generated && (
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full gap-2 rounded-[6px] bg-[#38b6ff] text-white font-semibold hover:bg-[#1DA8F0] active:bg-[#0A8FD4]"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4 text-white" />
                  Generate Documents
                </>
              )}
            </Button>
          )}

          {loading && (
            <p className="text-center text-xs text-muted-foreground">
              Validating data and generating PDFs. This may take a moment...
            </p>
          )}

          {results && results.length > 0 && (
            <div className="rounded-lg border border-l-4 border-l-[#38b6ff] bg-white p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className="size-4 text-[#38b6ff]" />
                Documents generated successfully
              </div>
              {results.map((r) => (
                <div key={r.document_type} className="text-xs text-muted-foreground">
                  <span className="font-medium">
                    {r.document_type.replace(/_/g, " ")}
                  </span>
                  {r.warnings.length > 0 && (
                    <span className="text-amber-600 ml-1">
                      {r.warnings.map((w, i) => (
                        <span key={i}> &middot; {w}</span>
                      ))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {generationErrors.length > 0 && (
            <div className="rounded-lg border border-l-4 border-l-amber-400 bg-white p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <AlertTriangle className="size-4" />
                Some documents had issues
              </div>
              {generationErrors.map((e, i) => (
                <p key={i} className="text-xs text-amber-600">
                  {e}
                </p>
              ))}
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
