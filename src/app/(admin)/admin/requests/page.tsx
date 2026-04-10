import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { RequestsTable } from "@/components/admin/requests-table";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageKpiTickerResponsive, type KpiCell } from "@/components/shared/PageKpiTicker";
import { StaggerContainer, FadeUpChild } from "@/components/shared/PageTransition";

function daysBetween(from: string, to: Date): number {
  const diff = to.getTime() - new Date(from).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatAge(days: number): string {
  if (days === 0) return "<1d";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo`;
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ association_id?: string; status?: string }>;
}) {
  const user = await getAdminUser();
  const supabase = await createClient();
  const params = await searchParams;

  const [{ data: requests }, { data: assocRows }] = await Promise.all([
    supabase
      .from("document_requests")
      .select(
        "id, created_at, requester_name, requester_email, property_address, document_types, status, total_price_cents, turnaround, bill_to_closing, payment_status, requester_type, association_id"
      )
      .eq("tenant_id", user.tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("document_requests")
      .select("association_id")
      .eq("tenant_id", user.tenantId)
      .not("association_id", "is", null),
  ]);

  // Deduplicate association IDs
  const uniqueAssocIds = [
    ...new Set(
      (assocRows || [])
        .map((r) => r.association_id as string)
        .filter(Boolean)
    ),
  ];

  // Fetch association names for the filter dropdown
  let associations: { id: string; name: string }[] = [];
  if (uniqueAssocIds.length > 0) {
    const { data: assocData } = await supabase
      .from("associations")
      .select("id, name")
      .in("id", uniqueAssocIds)
      .order("name");
    associations = assocData || [];
  }

  const allRequests = requests || [];
  const now = new Date();

  // KPI computations
  const awaitingData = allRequests.filter((r) => r.status === "awaiting_data");
  const pendingReview = allRequests.filter((r) => r.status === "pending_review");
  const readyForGen = allRequests.filter((r) => r.status === "ready_for_generation");
  const rushOrders = allRequests.filter(
    (r) => r.turnaround === "rush" && r.status !== "delivered" && r.status !== "cancelled"
  );

  // Oldest age for awaiting_data
  const awaitingAges = awaitingData.map((r) => daysBetween(r.created_at, now));
  const oldestAwaiting = awaitingAges.length > 0 ? Math.max(...awaitingAges) : 0;

  // Average age for pending_review
  const pendingAges = pendingReview.map((r) => daysBetween(r.created_at, now));
  const avgPending =
    pendingAges.length > 0
      ? Math.round(pendingAges.reduce((a, b) => a + b, 0) / pendingAges.length)
      : 0;

  const kpis: KpiCell[] = [
    {
      value: awaitingData.length,
      label: "Awaiting Data",
      context: awaitingData.length > 0 ? `oldest: ${formatAge(oldestAwaiting)}` : "none",
      contextColor: "attention",
    },
    {
      value: pendingReview.length,
      label: "Pending Review",
      context: pendingReview.length > 0 ? `avg: ${formatAge(avgPending)}` : "none",
      contextColor: "info",
    },
    {
      value: readyForGen.length,
      label: "Ready to Generate",
      context: readyForGen.length > 0 ? "action required" : "none",
      contextColor: "good",
    },
    {
      value: rushOrders.length,
      label: "Rush Orders",
      context: "SLA: 24h",
      contextColor: "urgent",
    },
  ];

  // Triage counts to pass to client component
  const triageCounts = {
    awaiting_data: awaitingData.length,
    pending_review: pendingReview.length,
    ready_for_generation: readyForGen.length,
    rush: rushOrders.length,
  };

  return (
    <StaggerContainer className="space-y-6">
      <FadeUpChild>
        <PageHeader
          title="Requests"
          subtitle="Manage document requests from all requesters"
        />
      </FadeUpChild>
      <FadeUpChild>
        <PageKpiTickerResponsive cells={kpis} />
      </FadeUpChild>
      <FadeUpChild>
        <RequestsTable
          requests={allRequests}
          triageCounts={triageCounts}
          associations={associations}
          initialAssociationId={params.association_id}
          initialStatus={params.status}
        />
      </FadeUpChild>
    </StaggerContainer>
  );
}
