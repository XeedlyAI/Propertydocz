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
import { Loader2, CheckCircle2, XCircle, CloudOff } from "lucide-react";

interface DropboxStatusProps {
  isConnected: boolean;
  status: "connected" | "denied" | "error" | null;
}

export function DropboxStatus({ isConnected, status }: DropboxStatusProps) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect Dropbox? Existing synced documents will remain, but no new syncs will be possible.")) {
      return;
    }

    setDisconnecting(true);
    try {
      const res = await fetch("/api/dropbox/disconnect", { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <svg
            viewBox="0 0 43 40"
            className="size-5"
            fill="currentColor"
          >
            <path d="M12.5 0L0 8.1l8.6 6.9 12.5-8.1L12.5 0zm17.6 0L21.5 6.9l8.6 8.1 12.4-6.9L30.1 0zM0 21.9l12.5 8.1 8.6-6.9-12.5-8.1L0 21.9zm30.1 1.2l-8.6 6.9 8.6 8.1 12.4-8.1-12.4-6.9zM21.1 24.4l-8.6 6.9-3.9-2.5v2.8l12.5 7.5 12.5-7.5v-2.8l-3.9 2.5-8.6-6.9z" />
          </svg>
          Dropbox Integration
        </CardTitle>
        <CardDescription>
          Connect your Dropbox account to sync governing documents for your associations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status banner */}
        {status === "connected" && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            Dropbox connected successfully!
          </div>
        )}
        {status === "denied" && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            <XCircle className="size-4 shrink-0" />
            Dropbox authorization was denied.
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <XCircle className="size-4 shrink-0" />
            Failed to connect Dropbox. Please try again.
          </div>
        )}

        {/* Connection state */}
        {isConnected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Connected</p>
                <p className="text-xs text-muted-foreground">
                  Dropbox is linked to your account
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-destructive hover:text-destructive"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <CloudOff className="size-3.5" />
                  Disconnect
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                <CloudOff className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Not Connected</p>
                <p className="text-xs text-muted-foreground">
                  Link your Dropbox to sync governing documents
                </p>
              </div>
            </div>
            <a
              href="/api/dropbox/auth"
              className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-[#38b6ff] hover:bg-[#1DA8F0] active:bg-[#0A8FD4] text-white transition-colors"
            >
              Connect Dropbox
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
