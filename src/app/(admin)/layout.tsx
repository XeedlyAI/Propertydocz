import { AdminSidebar } from "@/components/admin/sidebar";
import { getAdminUser } from "@/lib/auth";
import { AdminTopBar } from "@/components/admin/top-bar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getAdminUser() redirects to /login if not authenticated
  const user = await getAdminUser();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar tenantName={user.tenantName} userName={user.fullName} />
      <main className="flex-1 pt-14 lg:pt-0">
        <AdminTopBar />
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
