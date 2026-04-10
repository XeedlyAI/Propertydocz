import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AssociationDetailClient } from "./association-detail-client";

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

  const serviceClient = await createServiceClient();

  // Fetch all data in parallel
  const [
    { data: tenant },
    { data: governingDocs },
    { count: fieldsPopulated },
    { count: fieldsTotal },
    { data: properties },
    { data: requests },
  ] = await Promise.all([
    serviceClient
      .from("tenants")
      .select("dropbox_access_token, dropbox_refresh_token")
      .eq("id", user.tenantId)
      .single(),
    serviceClient
      .from("governing_documents")
      .select(
        "id, document_name, document_category, file_name, file_path, source, last_synced_at, created_at"
      )
      .eq("association_id", id)
      .order("document_category"),
    serviceClient
      .from("association_field_values")
      .select("id", { count: "exact", head: true })
      .eq("association_id", id)
      .not("value", "is", null),
    serviceClient
      .from("field_definitions")
      .select("id", { count: "exact", head: true })
      .in("tier", ["static", "periodic"]),
    serviceClient
      .from("properties")
      .select("id, address, unit_number, owner_name")
      .eq("association_id", id)
      .order("unit_number"),
    serviceClient
      .from("document_requests")
      .select(
        "id, created_at, requester_name, requester_email, document_types, status, total_price_cents, turnaround, property_address"
      )
      .eq("association_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const isDropboxConnected = !!(
    tenant?.dropbox_access_token && tenant?.dropbox_refresh_token
  );

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
          Manage association details, properties, documents, and settings
        </p>
      </div>

      <AssociationDetailClient
        association={association}
        tenantId={user.tenantId}
        governingDocs={governingDocs || []}
        properties={properties || []}
        requests={requests || []}
        isDropboxConnected={isDropboxConnected}
        fieldsPopulated={fieldsPopulated ?? 0}
        fieldsTotal={fieldsTotal ?? 0}
      />
    </div>
  );
}
