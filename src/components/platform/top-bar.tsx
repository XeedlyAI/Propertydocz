"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Shield } from "lucide-react";

export function PlatformTopBar() {
  return (
    <div className="hidden lg:flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-2">
        <Shield className="size-4 text-[#38b6ff]" />
        <span className="text-xs font-medium uppercase tracking-wider text-[#38b6ff]">
          Platform Admin
        </span>
      </div>
      <ThemeToggle />
    </div>
  );
}
