"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Bell } from "lucide-react";

export function AdminTopBar() {
  return (
    <div className="hidden lg:flex h-14 items-center justify-end gap-3 border-b border-border bg-background px-6">
      <button
        type="button"
        className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
      </button>
      <div className="h-5 w-px bg-border" />
      <ThemeToggle />
    </div>
  );
}
