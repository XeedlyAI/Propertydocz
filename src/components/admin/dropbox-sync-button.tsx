"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface DropboxSyncButtonProps {
  associationId: string;
  hasFolder: boolean;
}

export function DropboxSyncButton({
  associationId,
  hasFolder,
}: DropboxSyncButtonProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    synced: number;
    errors?: string[];
  } | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);

    try {
      const res = await fetch(`/api/dropbox/sync/${associationId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, synced: 0, errors: [data.error] });
        return;
      }

      setResult({
        success: true,
        synced: data.synced,
        errors: data.errors,
      });

      // Refresh the page to show new documents
      router.refresh();
    } catch {
      setResult({
        success: false,
        synced: 0,
        errors: ["Network error. Please try again."],
      });
    } finally {
      setSyncing(false);
    }
  }

  if (!hasFolder) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleSync}
        disabled={syncing}
      >
        {syncing ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="size-3.5" />
            Sync from Dropbox
          </>
        )}
      </Button>

      {result && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            result.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "border-destructive/50 bg-destructive/10 text-destructive"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
          )}
          <div>
            {result.success ? (
              <p>
                Synced {result.synced} document{result.synced !== 1 ? "s" : ""}{" "}
                from Dropbox.
              </p>
            ) : (
              <p>{result.errors?.[0] || "Sync failed"}</p>
            )}
            {result.errors && result.errors.length > 0 && result.success && (
              <p className="mt-1 text-xs opacity-80">
                {result.errors.length} warning{result.errors.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
