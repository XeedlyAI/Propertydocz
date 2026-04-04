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
import {
  Loader2,
  CheckCircle2,
  XCircle,
  CloudOff,
  HardDrive,
} from "lucide-react";

interface StorageStatusProps {
  /** Which provider is currently connected, if any */
  connectedProvider: "dropbox" | null;
  /** Whether a Dropbox connection exists */
  isDropboxConnected: boolean;
  /** Flash status from query params */
  dropboxStatus: "connected" | "denied" | "error" | null;
}

const PROVIDERS = [
  {
    key: "dropbox" as const,
    name: "Dropbox",
    description: "Most popular for HOA document management",
    available: true,
    icon: (
      <svg viewBox="0 0 43 40" className="size-5" fill="currentColor">
        <path d="M12.5 0L0 8.1l8.6 6.9 12.5-8.1L12.5 0zm17.6 0L21.5 6.9l8.6 8.1 12.4-6.9L30.1 0zM0 21.9l12.5 8.1 8.6-6.9-12.5-8.1L0 21.9zm30.1 1.2l-8.6 6.9 8.6 8.1 12.4-8.1-12.4-6.9zM21.1 24.4l-8.6 6.9-3.9-2.5v2.8l12.5 7.5 12.5-7.5v-2.8l-3.9 2.5-8.6-6.9z" />
      </svg>
    ),
  },
  {
    key: "google_drive" as const,
    name: "Google Drive",
    description: "Coming soon",
    available: false,
    icon: (
      <svg viewBox="0 0 87.3 78" className="size-5" fill="currentColor">
        <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z" opacity="0.4" />
        <path d="M43.65 25.15L29.9 1.35c-1.35.8-2.5 1.9-3.3 3.3L1.2 52.2c-.8 1.4-1.2 2.95-1.2 4.5h27.5l16.15-31.55z" opacity="0.6" />
        <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8L52.5 66.85l7.3 9.95 13.75 0z" opacity="0.8" />
        <path d="M43.65 25.15L57.4 1.35C56.05.55 54.5 0 52.8 0H34.5c-1.7 0-3.25.55-4.6 1.35l13.75 23.8z" />
        <path d="M59.8 53H27.5l-13.75 23.8c1.35.8 2.9 1.2 4.6 1.2h49.85c1.7 0 3.25-.4 4.6-1.2L59.8 53z" opacity="0.8" />
        <path d="M73.4 26.5L60.1 4.65c-.8-1.4-1.95-2.5-3.3-3.3L43.05 25.15 59.2 53h28.1c0-1.55-.4-3.1-1.2-4.5L73.4 26.5z" opacity="0.6" />
      </svg>
    ),
  },
  {
    key: "onedrive" as const,
    name: "OneDrive",
    description: "Coming soon",
    available: false,
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M10.55 4.5c-2.27 0-4.3 1.24-5.35 3.15A5.5 5.5 0 000 13c0 3.04 2.46 5.5 5.5 5.5h13c3.04 0 5.5-2.46 5.5-5.5 0-2.74-2-5.02-4.63-5.44A6.5 6.5 0 0010.55 4.5z" opacity="0.6" />
      </svg>
    ),
  },
];

export function StorageStatus({
  connectedProvider,
  isDropboxConnected,
  dropboxStatus,
}: StorageStatusProps) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (
      !confirm(
        "Are you sure you want to disconnect your storage? Existing synced documents will remain, but no new syncs will be possible."
      )
    ) {
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
          <HardDrive className="size-4" />
          Document Storage
        </CardTitle>
        <CardDescription>
          Connect your cloud storage to sync HOA governing documents for your
          associations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status banners */}
        {dropboxStatus === "connected" && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            Dropbox connected successfully!
          </div>
        )}
        {dropboxStatus === "denied" && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            <XCircle className="size-4 shrink-0" />
            Dropbox authorization was denied.
          </div>
        )}
        {dropboxStatus === "error" && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <XCircle className="size-4 shrink-0" />
            Failed to connect Dropbox. Please try again.
          </div>
        )}

        {/* Provider list */}
        <div className="space-y-2">
          {PROVIDERS.map((provider) => {
            const isConnected =
              provider.key === "dropbox" && isDropboxConnected;
            const isCurrentProvider = connectedProvider === provider.key;

            return (
              <div
                key={provider.key}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  isConnected
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10"
                    : provider.available
                      ? "border-border"
                      : "border-border/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg ${
                      isConnected
                        ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {provider.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{provider.name}</p>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/30 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-2.5" />
                          Connected
                        </span>
                      )}
                      {!provider.available && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {provider.description}
                    </p>
                  </div>
                </div>

                <div>
                  {isConnected ? (
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
                  ) : provider.available ? (
                    <a
                      href="/api/dropbox/auth"
                      className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-[#38b6ff] hover:bg-[#1DA8F0] active:bg-[#0A8FD4] text-white transition-colors"
                    >
                      Connect
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
