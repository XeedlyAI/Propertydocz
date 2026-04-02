"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminTopBar() {
  return (
    <div className="hidden lg:flex h-14 items-center justify-end gap-2 border-b border-border bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
      >
        <Bell className="size-4" />
      </Button>
      <ThemeToggle />
    </div>
  );
}
