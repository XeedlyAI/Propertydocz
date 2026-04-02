"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  FileStack,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface SidebarProps {
  tenantName: string;
  userName: string;
}

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/requests", label: "Requests", icon: FileText },
  { href: "/admin/associations", label: "Associations", icon: Building2 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ tenantName, userName }: SidebarProps) {
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
    <div className="flex h-full flex-col bg-[#0C0F14]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/6 px-5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#38b6ff]/15">
          <FileStack className="size-4 text-[#38b6ff]" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">
          PropertyDocz
        </span>
      </div>

      {/* Tenant name */}
      <div className="border-b border-white/6 px-5 py-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
          Management Company
        </p>
        <p className="mt-0.5 text-sm font-medium truncate text-white/80">
          {tenantName}
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "border-l-2 border-[#38b6ff] bg-[#38b6ff]/8 text-[#38b6ff] ml-0"
                  : "border-l-2 border-transparent text-white/50 hover:bg-white/5 hover:text-white/80 ml-0"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Sign Out */}
      <div className="border-t border-white/6 p-3">
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
            <p className="text-sm font-medium truncate text-white/80">
              {userName}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white/60"
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
            <span className="text-sm font-semibold">{tenantName}</span>
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

      {/* Sidebar panel — always dark */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 transition-transform duration-200 ease-out lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
