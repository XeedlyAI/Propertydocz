import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileStack, LayoutDashboard, FileText, User, LogOut } from "lucide-react";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Registration page doesn't need the layout chrome
  // (it's public and has its own layout)

  if (!user) {
    return <>{children}</>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // Only agents use this layout; admins get redirected
  if (profile?.role !== "agent") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/agent/dashboard" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#38b6ff]/10">
              <FileStack className="size-4 text-[#38b6ff]" />
            </div>
            <span className="text-sm font-semibold">PropertyDocz</span>
          </Link>

          <nav className="flex items-center gap-1">
            <Link
              href="/agent/dashboard"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
            <Link
              href="/agent/orders"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <FileText className="size-4" />
              Orders
            </Link>
            <Link
              href="/agent/account"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <User className="size-4" />
              Account
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {profile?.full_name}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <LogOut className="size-3" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
