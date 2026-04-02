import { AdminSidebar } from "@/components/admin/sidebar";
import { getAdminUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getAdminUser() redirects to /login if not authenticated
  const user = await getAdminUser();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar tenantName={user.tenantName} userName={user.fullName} />
      <main className="flex-1 pt-14 lg:pt-0">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
