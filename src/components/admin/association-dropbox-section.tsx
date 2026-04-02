"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DropboxFolderBrowser } from "@/components/admin/dropbox-folder-browser";
import { DropboxSyncButton } from "@/components/admin/dropbox-sync-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText } from "lucide-react";

interface GoverningDocument {
  id: string;
  document_name: string;
  document_category: string;
  file_name: string;
  source: string;
  last_synced_at: string | null;
}

interface AssociationDropboxSectionProps {
  associationId: string;
  dropboxFolderPath: string | null;
  isDropboxConnected: boolean;
  governingDocuments: GoverningDocument[];
}

const CATEGORY_LABELS: Record<string, string> = {
  ccrs: "CC&Rs",
  bylaws: "Bylaws",
  articles: "Articles of Incorporation",
  rules: "Rules & Regulations",
  budget: "Budget",
  financial_statement: "Financial Statement",
  reserve_analysis: "Reserve Analysis",
  insurance_cert: "Insurance Certificate",
  minutes: "Meeting Minutes",
  plat: "Plat / Survey",
  amendment: "Amendment",
};

export function AssociationDropboxSection({
  associationId,
  dropboxFolderPath,
  isDropboxConnected,
  governingDocuments,
}: AssociationDropboxSectionProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleFolderSelect = useCallback(
    async (path: string) => {
      setSaving(true);
      try {
        await fetch(`/api/admin/associations/${associationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dropbox_folder_path: path }),
        });
        router.refresh();
      } catch {
        // ignore
      } finally {
        setSaving(false);
      }
    },
    [associationId, router]
  );

  return (
    <div className="space-y-4">
      {/* Folder Browser */}
      <DropboxFolderBrowser
        currentPath={dropboxFolderPath}
        onSelect={handleFolderSelect}
        isConnected={isDropboxConnected}
      />

      {saving && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Saving folder mapping...
        </p>
      )}

      {/* Sync Button */}
      {isDropboxConnected && (
        <DropboxSyncButton
          associationId={associationId}
          hasFolder={!!dropboxFolderPath}
        />
      )}

      {/* Governing Documents List */}
      {governingDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Governing Documents ({governingDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[#E5E7EB] dark:divide-white/8">
              {governingDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="size-4 text-[#38b6ff] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.document_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[doc.document_category] ||
                          doc.document_category}
                        {doc.source === "dropbox" && " · via Dropbox"}
                      </p>
                    </div>
                  </div>
                  {doc.last_synced_at && (
                    <span className="text-xs text-muted-foreground font-data shrink-0 ml-2">
                      {new Date(doc.last_synced_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
