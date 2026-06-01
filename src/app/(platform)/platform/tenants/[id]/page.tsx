import { createServiceClient } from "@/lib/supabase/server";
import { getPlatformUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { TenantDetailClient } from "./tenant-detail-client";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getPlatformUser();

  const serviceClient = await createServiceClient();

  // Fetch tenant
  const { data: tenant, error } = await serviceClient
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !tenant) {
    notFound();
  }

  // Parallel fetch: admins, associations, all requests
  const [{ data: admins }, { data: associations }, { data: requests }] =
    await Promise.all([
      serviceClient
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("tenant_id", id)
        .order("role"),

      serviceClient
        .from("associations")
        .select(
          "id, name, address, city, state, zip, total_units, project_type, manager_name, mailing_address, monthly_assessment_amount"
        )
        .eq("tenant_id", id)
        .order("name"),

      serviceClient
        .from("document_requests")
        .select(
          "id, created_at, association_id, requester_name, requester_email, property_address, document_types, status, total_price_cents, payment_status, turnaround"
        )
        .eq("tenant_id", id)
        .order("created_at", { ascending: false }),
    ]);

  // Fetch governing document counts per association
  const assocIds = (associations || []).map((a) => a.id);
  let govDocCounts: Record<string, number> = {};

  if (assocIds.length > 0) {
    const { data: govDocsData } = await serviceClient
      .from("governing_documents")
      .select("id, association_id")
      .in("association_id", assocIds);

    if (govDocsData) {
      govDocCounts = govDocsData.reduce(
        (acc, doc) => {
          acc[doc.association_id] = (acc[doc.association_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }
  }

  // Active request counts per association
  const allRequests = requests || [];
  const activeRequestCountsByAssoc: Record<string, number> = {};
  for (const req of allRequests) {
    if (
      req.association_id &&
      req.status !== "delivered" &&
      req.status !== "cancelled"
    ) {
      activeRequestCountsByAssoc[req.association_id] =
        (activeRequestCountsByAssoc[req.association_id] || 0) + 1;
    }
  }

  // Revenue calculations
  const paidReqs = allRequests.filter((r) => r.payment_status === "paid");
  const totalRevenue = paidReqs.reduce(
    (sum, r) => sum + (r.total_price_cents || 0),
    0
  );
  const fee = tenant.platform_fee_percent || 10;
  const platformCut = Math.round((totalRevenue * fee) / 100);
  const tenantCut = totalRevenue - platformCut;

  return (
    <TenantDetailClient
      tenant={tenant}
      admins={admins || []}
      associations={associations || []}
      requests={allRequests}
      govDocCounts={govDocCounts}
      activeRequestCountsByAssoc={activeRequestCountsByAssoc}
      totalRevenue={totalRevenue}
      platformCut={platformCut}
      tenantCut={tenantCut}
      fee={fee}
      paidRequestCount={paidReqs.length}
    />
  );
}
