"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

interface GenerationResult {
  document_type: string;
  storage_path: string;
  validation_notes: string;
  warnings: string[];
}

interface GenerateDocumentsButtonProps {
  requestId: string;
}

export function GenerateDocumentsButton({
  requestId,
}: GenerateDocumentsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<GenerationResult[] | null>(null);
  const [generationErrors, setGenerationErrors] = useState<string[]>([]);

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

      // If successful, reload to show updated status
      if (data.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
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

      {loading && (
        <p className="text-center text-xs text-muted-foreground">
          Validating data and generating PDFs. This may take a moment...
        </p>
      )}

      {results && results.length > 0 && (
        <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-green-700">
            <CheckCircle2 className="size-4" />
            Documents generated successfully
          </div>
          {results.map((r) => (
            <div key={r.document_type} className="text-xs text-green-600">
              <span className="font-medium">
                {r.document_type.replace(/_/g, " ")}
              </span>
              {r.warnings.length > 0 && (
                <ul className="mt-1 ml-4 list-disc text-amber-600">
                  {r.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {generationErrors.length > 0 && (
        <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3">
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
