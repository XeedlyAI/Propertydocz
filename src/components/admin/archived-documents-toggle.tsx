"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ArchivedDocumentsToggleProps {
  count: number;
  children: React.ReactNode;
}

export function ArchivedDocumentsToggle({
  count,
  children,
}: ArchivedDocumentsToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pl-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
        {open ? "Hide" : "Show"} archived ({count})
      </button>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
}
