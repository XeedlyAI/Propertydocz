"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FolderSync,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════

interface SyncFieldUpdate {
  field_key: string;
  new_value: string;
  previous_value?: string;
  source_document: string;
  change_type: "new" | "updated";
}

interface SyncResult {
  association_id: string;
  sync_started_at: string;
  sync_completed_at: string;
  files_total: number;
  files_new: number;
  files_modified: number;
  files_unchanged: number;
  files_deleted: number;
  files_failed: number;
  fields_updated: SyncFieldUpdate[];
  errors: Array<{ file: string; error: string }>;
}

interface SyncStatusResponse {
  has_dropbox_folder: boolean;
  last_sync_date: string | null;
  document_count: number;
  completed_count: number;
  failed_count: number;
  fields_extracted: number;
  documents: SyncDocument[];
}

interface SyncDocument {
  id: string;
  file_name: string;
  category: string;
  last_synced_at: string;
  extraction_status: string;
  fields_count: number;
  extracted_fields: Record<string, string> | null;
}

interface DocumentSyncCardProps {
  associationId: string;
  isDropboxConnected: boolean;
  hasDropboxFolder: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  ccrs: "CC&Rs",
  ccr_amendments: "CCR Amendments",
  bylaws: "Bylaws",
  articles_of_incorporation: "Articles of Incorporation",
  rules_and_regulations: "Rules & Regulations",
  budget: "Budget",
  financial_statement: "Financial Statement",
  reserve_study: "Reserve Study",
  insurance_cert: "Insurance Certificate",
  minutes: "Meeting Minutes",
  plat_map: "Plat Map",
  management_agreement: "Management Agreement",
  other: "Other",
};

// ════════════════════════════════════════
// Component
// ════════════════════════════════════════

export function DocumentSyncCard({
  associationId,
  isDropboxConnected,
  hasDropboxFolder,
}: DocumentSyncCardProps) {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch sync status on mount
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/associations/${associationId}/sync`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Silently fail — status card will show a safe default
    } finally {
      setLoading(false);
    }
  }, [associationId]);

  useEffect(() => {
    if (isDropboxConnected && hasDropboxFolder) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [isDropboxConnected, hasDropboxFolder, fetchStatus]);

  // Trigger sync
  const handleSync = useCallback(
    async (force: boolean) => {
      setSyncing(true);
      setSyncResult(null);
      setError(null);

      try {
        const res = await fetch(`/api/associations/${associationId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Sync failed");
          return;
        }

        const result: SyncResult = await res.json();
        setSyncResult(result);

        // Refresh status
        await fetchStatus();
      } catch {
        setError("Network error during sync");
      } finally {
        setSyncing(false);
      }
    },
    [associationId, fetchStatus]
  );

  // ── Not connected state ──────────────
  if (!isDropboxConnected || !hasDropboxFolder) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderSync className="size-4 text-muted-foreground" />
            Document Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {!isDropboxConnected
              ? "Connect Dropbox in Settings to enable automatic document sync."
              : "Map a Dropbox folder to this association to enable document sync."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Loading state ────────────────────
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderSync className="size-4 text-[#38b6ff]" />
            Document Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading sync status...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderSync className="size-4 text-[#38b6ff]" />
          Document Sync
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Syncing state ── */}
        {syncing && (
          <div className="rounded-lg border border-[#38b6ff]/30 bg-[#38b6ff]/5 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin text-[#38b6ff]" />
              <span className="font-medium">Syncing documents...</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 pl-6">
              Processing files from Dropbox. This may take a minute.
            </p>
          </div>
        )}

        {/* ── Sync result (after completion) ── */}
        {syncResult && !syncing && (
          <SyncResultBanner result={syncResult} onDismiss={() => setSyncResult(null)} />
        )}

        {/* ── Status summary ── */}
        {!syncing && !syncResult && status && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last synced</span>
              <span className="font-medium">
                {status.last_sync_date
                  ? formatRelativeTime(status.last_sync_date)
                  : "Never"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Documents tracked</span>
              <span className="font-medium">{status.document_count} files</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Fields kept current</span>
              <span className="font-medium">{status.fields_extracted}</span>
            </div>
            {status.failed_count > 0 && (
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                <span>Failed extractions</span>
                <span className="font-medium">{status.failed_count}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* ── Actions ── */}
        {!syncing && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleSync(false)}
            >
              <RefreshCw className="size-3 mr-1" />
              Sync Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => handleSync(true)}
            >
              <FolderSync className="size-3 mr-1" />
              Full Re-sync
            </Button>
            {status && status.document_count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowLog(!showLog)}
              >
                {showLog ? (
                  <ChevronDown className="size-3 mr-1" />
                ) : (
                  <ChevronRight className="size-3 mr-1" />
                )}
                View Log
              </Button>
            )}
          </div>
        )}

        {/* ── Sync log ── */}
        {showLog && status && (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium">Document</th>
                    <th className="text-left px-3 py-2 font-medium">Category</th>
                    <th className="text-left px-3 py-2 font-medium">Last Synced</th>
                    <th className="text-left px-3 py-2 font-medium">Status</th>
                    <th className="text-right px-3 py-2 font-medium">Fields</th>
                  </tr>
                </thead>
                <tbody>
                  {status.documents.map((doc) => (
                    <SyncLogRow
                      key={doc.id}
                      doc={doc}
                      isExpanded={expandedDoc === doc.id}
                      onToggle={() =>
                        setExpandedDoc(expandedDoc === doc.id ? null : doc.id)
                      }
                    />
                  ))}
                  {status.documents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                        No documents synced yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════

function SyncResultBanner({
  result,
  onDismiss,
}: {
  result: SyncResult;
  onDismiss: () => void;
}) {
  const hasChanges =
    result.files_new > 0 || result.files_modified > 0 || result.fields_updated.length > 0;

  return (
    <div
      className={`rounded-lg border p-4 ${
        result.files_failed > 0
          ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10"
          : "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1.5">
            {result.files_failed > 0 ? (
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
            )}
            Sync Complete
          </p>

          {hasChanges ? (
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>
                {result.files_new > 0 &&
                  `${result.files_new} new file${result.files_new !== 1 ? "s" : ""} processed`}
                {result.files_new > 0 && result.files_modified > 0 && ", "}
                {result.files_modified > 0 &&
                  `${result.files_modified} file${result.files_modified !== 1 ? "s" : ""} updated`}
              </p>

              {result.fields_updated.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {result.fields_updated.length} field value
                    {result.fields_updated.length !== 1 ? "s" : ""} updated:
                  </p>
                  {result.fields_updated.slice(0, 6).map((update, i) => (
                    <p key={i} className="pl-2 flex items-center gap-1">
                      <span className="text-foreground font-medium">
                        {formatFieldKey(update.field_key)}:
                      </span>
                      {update.previous_value ? (
                        <>
                          <span className="line-through text-muted-foreground">
                            {truncate(update.previous_value, 20)}
                          </span>
                          <ArrowRight className="size-2.5" />
                          <span>{truncate(update.new_value, 20)}</span>
                        </>
                      ) : (
                        <span>{truncate(update.new_value, 30)}</span>
                      )}
                      <span className="text-muted-foreground">
                        ({update.source_document})
                      </span>
                    </p>
                  ))}
                  {result.fields_updated.length > 6 && (
                    <p className="pl-2 text-muted-foreground">
                      + {result.fields_updated.length - 6} more
                    </p>
                  )}
                </div>
              )}

              {result.files_failed > 0 && (
                <p className="text-amber-600 dark:text-amber-400">
                  {result.files_failed} file{result.files_failed !== 1 ? "s" : ""} failed
                  {result.errors.length > 0 && `: ${result.errors[0].error}`}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No changes detected. All documents are up to date.
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs shrink-0"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

function SyncLogRow({
  doc,
  isExpanded,
  onToggle,
}: {
  doc: SyncDocument;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const statusIcon =
    doc.extraction_status === "completed" ? (
      <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400" />
    ) : doc.extraction_status === "failed" ? (
      <XCircle className="size-3.5 text-red-600 dark:text-red-400" />
    ) : (
      <Clock className="size-3.5 text-yellow-600 dark:text-yellow-400" />
    );

  const statusLabel =
    doc.extraction_status === "completed"
      ? "Complete"
      : doc.extraction_status === "failed"
        ? "Failed"
        : "Pending";

  const hasFields = doc.fields_count > 0;

  return (
    <>
      <tr
        className={`border-b last:border-b-0 hover:bg-muted/30 transition-colors ${
          hasFields ? "cursor-pointer" : ""
        }`}
        onClick={hasFields ? onToggle : undefined}
      >
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            {hasFields && (
              isExpanded ? (
                <ChevronDown className="size-3 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="size-3 text-muted-foreground shrink-0" />
              )
            )}
            <FileText className="size-3 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[200px]" title={doc.file_name}>
              {doc.file_name}
            </span>
          </div>
        </td>
        <td className="px-3 py-2 text-muted-foreground">
          {CATEGORY_LABELS[doc.category] ?? doc.category}
        </td>
        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
          {doc.last_synced_at
            ? new Date(doc.last_synced_at).toLocaleDateString()
            : "—"}
        </td>
        <td className="px-3 py-2">
          <span className="flex items-center gap-1">
            {statusIcon}
            {statusLabel}
          </span>
        </td>
        <td className="px-3 py-2 text-right">
          {doc.fields_count > 0 ? `${doc.fields_count} fields` : "—"}
        </td>
      </tr>

      {/* Expanded fields view */}
      {isExpanded && doc.extracted_fields && (
        <tr>
          <td colSpan={5} className="px-3 py-2 bg-muted/20">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
              {Object.entries(doc.extracted_fields).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-muted-foreground">
                    {formatFieldKey(key)}
                  </span>
                  <span className="font-medium truncate" title={String(value)}>
                    {truncate(String(value), 40)}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ════════════════════════════════════════
// Utilities
// ════════════════════════════════════════

function formatFieldKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return "just now";

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
