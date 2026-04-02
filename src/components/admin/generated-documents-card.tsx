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
import { FileText, Download, AlertTriangle } from "lucide-react";

interface GeneratedDocumentsCardProps {
  requestId: string;
  tenantId: string;
}

export async function GeneratedDocumentsCard({
  requestId,
  tenantId,
}: GeneratedDocumentsCardProps) {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("generated_documents")
    .select("*")
    .eq("document_request_id", requestId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Generated Documents</CardTitle>
        <CardDescription>
          Review the generated documents before approving delivery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => {
          const docType = doc.document_type as DocumentType;
          const warnings = (doc.validation_warnings as string[]) || [];
          const sizeKb = doc.file_size_bytes
            ? Math.round(doc.file_size_bytes / 1024)
            : 0;

          return (
            <div
              key={doc.id}
              className="flex items-start justify-between rounded-lg border p-3"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md bg-primary/10 p-2">
                  <FileText className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {DOCUMENT_LABELS[docType] || docType}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sizeKb} KB &middot;{" "}
                    {new Date(doc.created_at).toLocaleString()}
                  </p>
                  {doc.validation_notes && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {doc.validation_notes as string}
                    </p>
                  )}
                  {warnings.length > 0 && (
                    <div className="mt-1 flex items-start gap-1">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-500" />
                      <div className="space-y-0.5">
                        {warnings.map((w, i) => (
                          <p key={i} className="text-xs text-amber-600">
                            {w}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">
                <Download className="mr-1 size-3" />
                PDF
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
