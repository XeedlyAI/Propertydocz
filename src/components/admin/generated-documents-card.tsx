import { createClient } from "@/lib/supabase/server";
import { DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { ArchivedDocumentsToggle } from "./archived-documents-toggle";

interface GeneratedDocumentsCardProps {
  requestId: string;
}

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

export async function GeneratedDocumentsCard({
  requestId,
}: GeneratedDocumentsCardProps) {
  const supabase = await createClient();

  const { data: documents, error } = await supabase
    .from("generated_documents")
    .select("id, document_request_id, document_type, file_url, file_name, file_type, generation_method, generated_at, created_at")
    .eq("document_request_id", requestId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching generated documents:", error);
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generated Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[100px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
            <div className="text-center">
              <FileText className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No documents generated yet
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group documents by type, latest first (already sorted by created_at desc)
  const grouped = new Map<string, DocRecord[]>();
  for (const doc of documents as DocRecord[]) {
    const existing = grouped.get(doc.document_type) || [];
    existing.push(doc);
    grouped.set(doc.document_type, existing);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generated Documents</CardTitle>
        <CardDescription>
          Review the generated documents before approving delivery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from(grouped.entries()).map(([docType, docs]) => {
          const latest = docs[0];
          const archived = docs.slice(1);
          const label = DOCUMENT_LABELS[docType as DocumentType] || docType;

          return (
            <div key={docType} className="space-y-2">
              {/* Current version */}
              <div className="flex items-start justify-between rounded-lg border border-l-4 border-l-[#38b6ff] p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-2">
                    <FileText className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {label}
                      <Badge variant="outline" className="ml-2 text-[10px] py-0">
                        Current
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {latest.file_name} &middot;{" "}
                      {new Date(latest.created_at).toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Method: {latest.generation_method}
                    </p>
                  </div>
                </div>
                <a
                  href={latest.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                    <Download className="mr-1 size-3" />
                    PDF
                  </Badge>
                </a>
              </div>

              {/* Archived versions */}
              {archived.length > 0 && (
                <ArchivedDocumentsToggle count={archived.length}>
                  {archived.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-start justify-between rounded-lg border border-l-4 border-l-muted p-3 opacity-60"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-md bg-muted p-2">
                          <FileText className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {label}
                            <Badge variant="outline" className="ml-2 text-[10px] py-0 text-muted-foreground">
                              Archived
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.file_name} &middot;{" "}
                            {new Date(doc.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Badge variant="secondary" className="cursor-pointer hover:bg-accent">
                          <Download className="mr-1 size-3" />
                          PDF
                        </Badge>
                      </a>
                    </div>
                  ))}
                </ArchivedDocumentsToggle>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
