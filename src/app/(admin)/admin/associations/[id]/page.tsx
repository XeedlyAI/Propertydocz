import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { AssociationForm } from "@/components/admin/association-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AssociationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAdminUser();
  const supabase = await createClient();

  const { data: association, error } = await supabase
    .from("associations")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", user.tenantId)
    .single();

  if (error || !association) {
    notFound();
  }

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
          {association.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Edit association details
        </p>
      </div>

      <AssociationForm
        tenantId={user.tenantId}
        association={association}
      />
    </div>
  );
}
