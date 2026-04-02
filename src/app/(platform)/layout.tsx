import { PlatformSidebar } from "@/components/platform/sidebar";
import { PlatformTopBar } from "@/components/platform/top-bar";
import { getPlatformUser } from "@/lib/auth";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getPlatformUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PlatformSidebar userName={user.fullName} />
      <div className="flex flex-1 flex-col overflow-hidden pt-14 lg:pt-0">
        <PlatformTopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
