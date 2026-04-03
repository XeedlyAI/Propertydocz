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

interface GeneratedDocumentsCardProps {
  requestId: string;
}

export async function GeneratedDocumentsCard({
  requestId,
}: GeneratedDocumentsCardProps) {
  const supabase = await createClient();

  // generated_documents has no tenant_id column — filter by document_request_id only.
  // RLS on document_requests already scopes to the current tenant.
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
                    {doc.file_name} &middot;{" "}
                    {new Date(doc.created_at).toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Method: {doc.generation_method}
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
          );
        })}
      </CardContent>
    </Card>
  );
}
