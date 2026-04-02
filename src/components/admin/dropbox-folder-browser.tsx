"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Check,
} from "lucide-react";

interface DropboxEntry {
  ".tag": "file" | "folder";
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
}

interface DropboxFolderBrowserProps {
  currentPath: string | null;
  onSelect: (path: string) => void;
  isConnected: boolean;
}

export function DropboxFolderBrowser({
  currentPath,
  onSelect,
  isConnected,
}: DropboxFolderBrowserProps) {
  const [browsePath, setBrowsePath] = useState("/");
  const [entries, setEntries] = useState<DropboxEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [browsing, setBrowsing] = useState(false);

  const loadFolder = useCallback(async (path: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/dropbox/folders?path=${encodeURIComponent(path)}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load folder");
      }
      const data = await res.json();
      setEntries(data.entries || []);
      setBrowsePath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folder");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (browsing && isConnected) {
      loadFolder(browsePath);
    }
  }, [browsing, isConnected, browsePath, loadFolder]);

  function handleStartBrowse() {
    setBrowsing(true);
    loadFolder(currentPath || "/");
  }

  function navigateUp() {
    const parts = browsePath.split("/").filter(Boolean);
    parts.pop();
    const parentPath = parts.length === 0 ? "/" : "/" + parts.join("/");
    loadFolder(parentPath);
  }

  function handleSelectFolder() {
    onSelect(browsePath);
    setBrowsing(false);
  }

  const folders = entries.filter((e) => e[".tag"] === "folder");
  const breadcrumbs = browsePath === "/" ? [] : browsePath.split("/").filter(Boolean);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dropbox Folder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect Dropbox in{" "}
            <a
              href="/admin/settings"
              className="text-[#38b6ff] hover:underline"
            >
              Settings
            </a>{" "}
            to map a governing documents folder.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>Dropbox Folder</span>
          {currentPath && !browsing && (
            <span className="text-xs font-normal font-data text-muted-foreground">
              {currentPath}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current mapping status */}
        {!browsing && (
          <div className="space-y-3">
            {currentPath ? (
              <div className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] dark:border-white/8 bg-muted/30 px-3 py-2">
                <FolderOpen className="size-4 text-[#38b6ff]" />
                <span className="text-sm font-medium truncate flex-1">
                  {currentPath}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No folder mapped. Select a folder from Dropbox to sync governing documents.
              </p>
            )}
            <Button
              size="sm"
              variant={currentPath ? "outline" : "default"}
              onClick={handleStartBrowse}
              className={
                !currentPath
                  ? "bg-[#38b6ff] hover:bg-[#1DA8F0] active:bg-[#0A8FD4] text-white"
                  : ""
              }
            >
              <Folder className="size-3.5" />
              {currentPath ? "Change Folder" : "Select Folder"}
            </Button>
          </div>
        )}

        {/* Folder browser */}
        {browsing && (
          <div className="space-y-3">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto">
              <button
                onClick={() => loadFolder("/")}
                className="hover:text-foreground shrink-0"
              >
                Dropbox
              </button>
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1 shrink-0">
                  <ChevronRight className="size-3" />
                  <button
                    onClick={() =>
                      loadFolder(
                        "/" + breadcrumbs.slice(0, i + 1).join("/")
                      )
                    }
                    className="hover:text-foreground"
                  >
                    {crumb}
                  </button>
                </span>
              ))}
            </div>

            {/* Folder list */}
            <div className="max-h-60 overflow-y-auto rounded-lg border border-[#E5E7EB] dark:border-white/8">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-destructive">
                  {error}
                </div>
              ) : (
                <>
                  {browsePath !== "/" && (
                    <button
                      onClick={navigateUp}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors border-b border-[#E5E7EB] dark:border-white/8"
                    >
                      <ArrowLeft className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Back</span>
                    </button>
                  )}
                  {folders.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {browsePath === "/"
                        ? "No folders found"
                        : "No subfolders in this directory"}
                    </div>
                  ) : (
                    folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => loadFolder(folder.path_lower)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors border-b border-[#E5E7EB] dark:border-white/8 last:border-b-0"
                      >
                        <Folder className="size-4 text-[#38b6ff]" />
                        <span className="truncate">{folder.name}</span>
                        <ChevronRight className="size-3.5 ml-auto text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </>
              )}
            </div>

            {/* Current selection + actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground truncate">
                Selected: <span className="font-data font-medium">{browsePath}</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBrowsing(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSelectFolder}
                  className="bg-[#38b6ff] hover:bg-[#1DA8F0] active:bg-[#0A8FD4] text-white"
                >
                  <Check className="size-3.5" />
                  Select This Folder
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
