import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { RequestsTable } from "@/components/admin/requests-table";

export default async function RequestsPage() {
  const user = await getAdminUser();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("document_requests")
    .select(
      "id, created_at, requester_name, requester_email, property_address, document_types, status, total_price_cents, turnaround, bill_to_closing, payment_status, requester_type"
    )
    .eq("tenant_id", user.tenantId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Requests</h1>
        <p className="text-sm text-muted-foreground">
          Manage document requests from all requesters
        </p>
      </div>
      <RequestsTable requests={requests || []} />
    </div>
  );
}
