import { getAdminUser } from "@/lib/auth";
import { AssociationForm } from "@/components/admin/association-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewAssociationPage() {
  const user = await getAdminUser();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/associations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Associations
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          New Association
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a new HOA community to your management portfolio
        </p>
      </div>

      <AssociationForm tenantId={user.tenantId} association={null} />
    </div>
  );
}
