"use client";

import { DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DocRecord {
  id: string;
  document_request_id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  file_type: string;
  generation_method: string;
  generated_at: string;
  created_at: string;
}

interface DocumentAccordionProps {
  documentTypes: string[];
  requestId: string;
  requestStatus: string;
  generatedDocuments: DocRecord[];
}

function getSubStatus(
  docType: string,
  requestStatus: string,
  generatedDocuments: DocRecord[]
): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  if (requestStatus === "delivered") {
    return { label: "Delivered", variant: "default" };
  }
  const hasDoc = generatedDocuments.some((d) => d.document_type === docType);
  if (hasDoc) {
    return { label: "Generated", variant: "default" };
  }
  if (requestStatus === "awaiting_data" || requestStatus === "ready_for_generation") {
    return { label: "In progress", variant: "secondary" };
  }
  return { label: "Not started", variant: "outline" };
}

export function DocumentAccordion({
  documentTypes,
  requestId,
  requestStatus,
  generatedDocuments,
}: DocumentAccordionProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState<string | null>(null);

  async function handleGenerate(docType: string) {
    setGenerating(docType);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          document_types: [docType],
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Generation failed");
      }
      router.refresh();
    } catch (err) {
      console.error("Document generation error:", err);
    } finally {
      setGenerating(null);
    }
  }

  return (
    <Accordion multiple className="space-y-2">
      {documentTypes.map((dt) => {
        const label = DOCUMENT_LABELS[dt as DocumentType] || dt;
        const subStatus = getSubStatus(dt, requestStatus, generatedDocuments);
        const docsForType = generatedDocuments
          .filter((d) => d.document_type === dt)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        const canGenerate =
          requestStatus === "ready_for_generation" ||
          requestStatus === "pending_review";

        return (
          <AccordionItem
            key={dt}
            value={dt}
            className="rounded-lg border px-4"
          >
            <AccordionTrigger className="hover:no-underline">
              <div className="flex w-full items-center justify-between pr-2">
                <span className="text-sm font-medium">{label}</span>
                <Badge variant={subStatus.variant} className="text-xs">
                  {subStatus.label}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              {/* Generated documents for this type */}
              {docsForType.length > 0 && (
                <div className="space-y-2">
                  {docsForType.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className={`flex items-start justify-between rounded-lg border border-l-4 p-3 ${
                        idx === 0
                          ? "border-l-[#38b6ff]"
                          : "border-l-muted opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-primary/10 p-2">
                          <FileText className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {doc.file_name}
                            {idx === 0 && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[10px] py-0"
                              >
                                Current
                              </Badge>
                            )}
                            {idx > 0 && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[10px] py-0 text-muted-foreground"
                              >
                                v{docsForType.length - idx}
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleString()} &middot;{" "}
                            {doc.generation_method}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-accent"
                        >
                          <Download className="mr-1 size-3" />
                          PDF
                        </Badge>
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Generate button */}
              {canGenerate && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={generating === dt}
                  onClick={() => handleGenerate(dt)}
                  className="w-full"
                >
                  {generating === dt ? (
                    <>
                      <Loader2 className="mr-2 size-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 size-3" />
                      Generate {label}
                    </>
                  )}
                </Button>
              )}

              {/* Empty state */}
              {docsForType.length === 0 && !canGenerate && (
                <p className="text-sm text-muted-foreground">
                  No documents generated yet for this type.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
