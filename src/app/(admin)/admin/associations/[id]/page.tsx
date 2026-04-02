import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { AssociationForm } from "@/components/admin/association-form";
import { AssociationDropboxSection } from "@/components/admin/association-dropbox-section";
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

  // Check if Dropbox is connected for this tenant
  const serviceClient = await createServiceClient();
  const { data: tenant } = await serviceClient
    .from("tenants")
    .select("dropbox_access_token, dropbox_refresh_token")
    .eq("id", user.tenantId)
    .single();

  const isDropboxConnected = !!(
    tenant?.dropbox_access_token && tenant?.dropbox_refresh_token
  );

  // Fetch governing documents for this association
  const { data: governingDocs } = await serviceClient
    .from("governing_documents")
    .select(
      "id, document_name, document_category, file_name, source, last_synced_at"
    )
    .eq("association_id", id)
    .order("document_category");

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

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column: Association form */}
        <div>
          <AssociationForm
            tenantId={user.tenantId}
            association={association}
          />
        </div>

        {/* Right column: Dropbox integration */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Document Sources</h2>
          <AssociationDropboxSection
            associationId={id}
            dropboxFolderPath={association.dropbox_folder_path}
            isDropboxConnected={isDropboxConnected}
            governingDocuments={governingDocs || []}
          />
        </div>
      </div>
    </div>
  );
}
