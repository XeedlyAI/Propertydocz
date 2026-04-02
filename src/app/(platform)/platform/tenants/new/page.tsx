import { getPlatformUser } from "@/lib/auth";
import { TenantForm } from "@/components/platform/tenant-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewTenantPage() {
  await getPlatformUser();

  return (
    <div className="space-y-6">
      <Link
        href="/platform/tenants"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Tenants
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Tenant</h1>
        <p className="text-sm text-muted-foreground">
          Onboard a new HOA management company
        </p>
      </div>

      <TenantForm tenant={null} />
    </div>
  );
}
