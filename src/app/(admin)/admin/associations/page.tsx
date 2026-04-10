import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { AssociationsClient } from "./associations-client";

export default async function AssociationsPage() {
  const user = await getAdminUser();
  const supabase = await createClient();

  // Fetch associations with health-relevant fields
  const { data: associations } = await supabase
    .from("associations")
    .select(
      "id, name, legal_name, address, city, state, zip, total_units, project_type, manager_name, mailing_address, monthly_assessment"
    )
    .eq("tenant_id", user.tenantId)
    .order("name");

  const assocIds = (associations || []).map((a) => a.id);

  // Parallel queries for counts and related data
  let propertyCounts: Record<string, number> = {};
  let govDocCounts: Record<string, number> = {};
  let requestCounts: Record<string, number> = {};
  let revenueCounts: Record<string, number> = {};
  let totalActiveRequests = 0;
  let totalPendingRevenue = 0;

  if (assocIds.length > 0) {
    // Property counts
    const { data: properties } = await supabase
      .from("properties")
      .select("association_id")
      .in("association_id", assocIds);

    if (properties) {
      propertyCounts = properties.reduce(
        (acc, p) => {
          acc[p.association_id] = (acc[p.association_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    // Governing documents counts per association
    const { data: govDocs } = await supabase
      .from("governing_documents")
      .select("association_id")
      .in("association_id", assocIds);

    if (govDocs) {
      govDocCounts = govDocs.reduce(
        (acc, d) => {
          acc[d.association_id] = (acc[d.association_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
    }

    // Active document requests (not delivered or cancelled)
    const { data: activeRequests } = await supabase
      .from("document_requests")
      .select("association_id, total_price_cents, status")
      .eq("tenant_id", user.tenantId)
      .not("status", "in", '("delivered","cancelled")');

    if (activeRequests) {
      totalActiveRequests = activeRequests.length;
      totalPendingRevenue = activeRequests.reduce(
        (sum, r) => sum + (r.total_price_cents || 0),
        0
      );

      // Per-association active request counts and revenue
      for (const req of activeRequests) {
        if (req.association_id) {
          requestCounts[req.association_id] =
            (requestCounts[req.association_id] || 0) + 1;
          revenueCounts[req.association_id] =
            (revenueCounts[req.association_id] || 0) +
            (req.total_price_cents || 0);
        }
      }
    }
  }

  // Compute health per association
  const totalUnits = (associations || []).reduce(
    (sum, a) => sum + (a.total_units || 0),
    0
  );

  const needsAttentionCount = (associations || []).filter((a) => {
    const health = computeHealth(a, govDocCounts[a.id] || 0);
    return health < 70;
  }).length;

  // Build enriched data for client
  const enrichedAssociations = (associations || []).map((a) => {
    const govDocCount = govDocCounts[a.id] || 0;
    const health = computeHealth(a, govDocCount);
    const missingFields = getMissingFields(a, govDocCount);

    return {
      id: a.id,
      name: a.name,
      address: a.address,
      city: a.city,
      state: a.state,
      zip: a.zip,
      totalUnits: a.total_units,
      projectType: a.project_type,
      propertyCount: propertyCounts[a.id] || 0,
      health,
      missingFields,
      activeRequests: requestCounts[a.id] || 0,
      pendingRevenue: revenueCounts[a.id] || 0,
    };
  });

  // KPI cells
  const kpiCells = [
    {
      value: (associations || []).length,
      label: "Total Associations",
      context: `${totalUnits.toLocaleString()} units`,
      contextColor: "info" as const,
    },
    {
      value: needsAttentionCount,
      label: "Needs Attention",
      context: "data incomplete",
      contextColor: "attention" as const,
    },
    {
      value: totalActiveRequests,
      label: "Active Requests",
      contextColor: "good" as const,
    },
    {
      value: totalPendingRevenue / 100,
      label: "Pending Revenue",
      prefix: "$",
      decimals: 2,
      contextColor: "info" as const,
    },
  ];

  if (!associations || associations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Associations"
          subtitle={`Manage HOA communities for ${user.tenantName}`}
        />
        <Card className="dash-card">
          <CardContent className="py-4">
            <EmptyState
              icon={Building2}
              title="No associations yet"
              description="Add your first HOA community to get started."
              action={
                <Link href="/admin/associations/new">
                  <Button
                    size="sm"
                    className="rounded-[6px] bg-[#38b6ff] text-white font-medium hover:bg-[#1DA8F0] min-h-[44px]"
                  >
                    <Plus className="size-4" />
                    Add Association
                  </Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AssociationsClient
      associations={enrichedAssociations}
      kpiCells={kpiCells}
      tenantId={user.tenantId}
      tenantName={user.tenantName}
    />
  );
}

function computeHealth(
  assoc: {
    manager_name: string | null;
    mailing_address: string | null;
    monthly_assessment: number | null;
  },
  govDocCount: number
): number {
  let filled = 0;
  if (assoc.manager_name && assoc.manager_name.trim()) filled++;
  if (assoc.mailing_address && assoc.mailing_address.trim()) filled++;
  if (assoc.monthly_assessment && assoc.monthly_assessment > 0) filled++;
  if (govDocCount > 0) filled++;
  return Math.round((filled / 4) * 100);
}

function getMissingFields(
  assoc: {
    manager_name: string | null;
    mailing_address: string | null;
    monthly_assessment: number | null;
  },
  govDocCount: number
): string[] {
  const missing: string[] = [];
  if (!assoc.manager_name || !assoc.manager_name.trim())
    missing.push("management contact");
  if (!assoc.mailing_address || !assoc.mailing_address.trim())
    missing.push("mailing address");
  if (!assoc.monthly_assessment || assoc.monthly_assessment <= 0)
    missing.push("assessment");
  if (govDocCount === 0) missing.push("CC&Rs");
  return missing;
}
