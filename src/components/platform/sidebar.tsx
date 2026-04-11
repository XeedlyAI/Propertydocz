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
  Wand2,
  ArrowRightLeft,
  ChevronDown,
  Loader2,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

interface PlatformSidebarProps {
  userName: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const PLATFORM_ITEMS: NavItem[] = [
  { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/platform/tenants", label: "Tenants", icon: Building2 },
  { href: "/platform/onboard", label: "Onboard", icon: Wand2 },
  { href: "/platform/customers", label: "Customers", icon: Users },
  { href: "/platform/revenue", label: "Revenue", icon: DollarSign },
];

const SYSTEM_ITEMS: NavItem[] = [
  { href: "/platform/settings", label: "Settings", icon: Settings },
];

const PURPLE = "#8b5cf6";
const BLUE = "#38b6ff";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

function TenantSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  // Fetch tenants when dropdown opens
  useEffect(() => {
    if (!open || tenants.length > 0) return;

    setLoading(true);
    fetch("/api/platform/tenants")
      .then((r) => r.json())
      .then((data) => {
        if (data.tenants) {
          setTenants(
            data.tenants.map((t: { id: string; name: string; slug: string }) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, tenants.length]);

  async function handleSelect(tenant: Tenant) {
    setSwitching(tenant.id);
    try {
      const res = await fetch("/api/platform/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenant.id }),
      });

      if (res.ok) {
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setSwitching(null);
    }
  }

  return (
    <div className="px-3 pb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#38b6ff]/5 hover:text-[#38b6ff] transition-colors"
      >
        <span className="flex items-center gap-2">
          <ArrowRightLeft className="size-3.5" />
          Switch to Tenant
        </span>
        <ChevronDown
          className={cn(
            "size-3 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="mt-1 rounded-lg border border-[#E5E7EB] dark:border-white/10 bg-white dark:bg-[#1a1d24] shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Loading...
            </div>
          ) : tenants.length === 0 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">
              No tenants found
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto py-1">
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelect(t)}
                  disabled={switching !== null}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-[#38b6ff]/5 transition-colors disabled:opacity-50"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Building2 className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium text-foreground">
                      {t.name}
                    </span>
                  </span>
                  {switching === t.id && (
                    <Loader2 className="size-3 shrink-0 animate-spin text-[#38b6ff]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

  function NavLink({ item, accent = BLUE }: { item: NavItem; accent?: string }) {
    const isActive =
      pathname === item.href || pathname.startsWith(item.href + "/");
    const isPurple = accent === PURPLE;
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 border-l-[3px]",
          isActive
            ? isPurple
              ? "border-[#8b5cf6] bg-[#8b5cf6]/10 text-[#8b5cf6]"
              : "border-[#38b6ff] bg-[#38b6ff]/10 text-[#38b6ff]"
            : isPurple
              ? "border-transparent text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#8b5cf6]/5 hover:text-foreground"
              : "border-transparent text-[#6B7280] dark:text-[#94A3B8] hover:bg-[#38b6ff]/5 hover:text-foreground"
        )}
      >
        <item.icon className="size-[18px]" />
        {item.label}
      </Link>
    );
  }

  function NavGroup({
    label,
    items,
    accent = BLUE,
  }: {
    label: string;
    items: NavItem[];
    accent?: string;
  }) {
    return (
      <div className="space-y-0.5">
        <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/50">
          {label}
        </p>
        {items.map((item) => (
          <NavLink key={item.href} item={item} accent={accent} />
        ))}
      </div>
    );
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white dark:bg-[#0C0F14] border-r border-[#E5E7EB] dark:border-white/8">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[#E5E7EB] dark:border-white/8 px-5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#8b5cf6]/15">
          <FileStack className="size-4 text-[#8b5cf6]" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">
          PropertyDocz
        </span>
      </div>

      {/* Platform badge */}
      <div className="border-b border-[#E5E7EB] dark:border-white/8 px-5 py-3">
        <div className="flex items-center gap-1.5">
          <Shield className="size-3.5 text-[#8b5cf6]" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-[#8b5cf6]">
            Platform Admin
          </p>
        </div>
        <p className="mt-0.5 text-sm font-medium text-foreground">XeedlyAI</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col px-3 py-3 gap-4 overflow-y-auto">
        <NavGroup label="Platform" items={PLATFORM_ITEMS} accent={PURPLE} />

        {/* Spacer pushes System to bottom */}
        <div className="flex-1" />

        <NavGroup label="System" items={SYSTEM_ITEMS} />
      </nav>

      {/* Switch to Tenant Admin */}
      <TenantSwitcher />

      {/* User / Sign Out */}
      <div className="border-t border-[#E5E7EB] dark:border-white/8 p-3">
        <div className="mb-2 flex items-center justify-between px-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#8b5cf6]/15 text-xs font-medium text-[#8b5cf6]">
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
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#6B7280] dark:text-[#94A3B8] transition-colors hover:bg-[#8b5cf6]/5 hover:text-foreground"
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
            <div className="flex size-6 items-center justify-center rounded-md bg-[#8b5cf6]/15">
              <FileStack className="size-3.5 text-[#8b5cf6]" />
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
