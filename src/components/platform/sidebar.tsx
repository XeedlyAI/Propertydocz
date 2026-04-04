"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Building2,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  FileStack,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface PlatformSidebarProps {
  userName: string;
}

const NAV_ITEMS = [
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/tenants", label: "Tenants", icon: Building2 },
  { href: "/platform/agents", label: "Agents", icon: Users },
  { href: "/platform/revenue", label: "Revenue", icon: DollarSign },
  { href: "/platform/settings", label: "Settings", icon: Settings },
];

export function PlatformSidebar({ userName }: PlatformSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-[#1A1D26] border-r border-[#E5E7EB] dark:border-white/8">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[#E5E7EB] dark:border-white/8 px-5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#38b6ff]/15">
          <FileStack className="size-4 text-[#38b6ff]" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          PropertyDocz
        </span>
      </div>

      {/* Platform badge */}
      <div className="border-b border-[#E5E7EB] dark:border-white/8 px-5 py-3">
        <div className="flex items-center gap-1.5">
          <Shield className="size-3.5 text-[#38b6ff]" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#38b6ff]">
            Platform Admin
          </p>
        </div>
        <p className="mt-0.5 text-sm font-medium text-foreground">
          XeedlyAI
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 border-l-2",
                isActive
                  ? "border-[#38b6ff] bg-[#38b6ff]/10 text-[#38b6ff]"
                  : "border-transparent text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#F4F5F7] dark:hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Divider — switch to tenant admin */}
      <div className="px-3 pb-2">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#F4F5F7] dark:hover:bg-white/5 hover:text-foreground transition-colors"
        >
          <LayoutDashboard className="size-3.5" />
          Switch to Tenant Admin
        </Link>
      </div>

      {/* User / Sign Out */}
      <div className="border-t border-[#E5E7EB] dark:border-white/8 p-3">
        <div className="mb-2 flex items-center justify-between px-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#38b6ff]/15 text-xs font-medium text-[#38b6ff]">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <p className="text-sm font-medium truncate text-foreground">
              {userName}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#6B7280] dark:text-[#94A3B8] transition-colors hover:bg-[#F4F5F7] dark:hover:bg-white/5 hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="size-8"
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-[#38b6ff]/15">
              <FileStack className="size-3.5 text-[#38b6ff]" />
            </div>
            <span className="text-sm font-semibold">Platform Admin</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:translate-x-0 lg:shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
