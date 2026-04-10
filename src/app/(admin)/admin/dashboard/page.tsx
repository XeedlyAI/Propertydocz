import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import { getStatusLabel } from "@/lib/status-labels";
import type { DocumentType, RequestStatus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AiAdvisory } from "@/components/admin/ai-advisory";
import { DashboardClient } from "./dashboard-client";

const STATUS_DOT_COLOR: Record<RequestStatus, string> = {
  received: "bg-slate-400",
  paid: "bg-blue-400",
  awaiting_data: "bg-[#f59e0b]",
  ready_for_generation: "bg-[#38b6ff]",
  pending_review: "bg-[#f59e0b]",
  approved: "bg-[#14b8a6]",
  delivered: "bg-[#14b8a6]",
  cancelled: "bg-[#ef4444]",
};

const STATUS_BADGE: Record<RequestStatus, string> = {
  received:
    "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300",
  paid: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  awaiting_data:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ready_for_generation:
    "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  pending_review:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  approved:
    "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  delivered:
    "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};


export default async function DashboardPage() {
  const user = await getAdminUser();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("document_requests")
    .select(
      "id, created_at, updated_at, requester_name, requester_email, property_address, document_types, status, total_price_cents, turnaround, bill_to_closing, payment_status, association_id"
    )
    .eq("tenant_id", user.tenantId)
    .order("created_at", { ascending: false });

  const allRequests = requests || [];

  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();
  const startOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  ).toISOString();

  // KPI metrics
  const totalRequests = allRequests.length;
  const awaitingData = allRequests.filter(
    (r) => r.status === "awaiting_data"
  ).length;
  const pendingReview = allRequests.filter(
    (r) => r.status === "pending_review"
  ).length;
  const readyForGen = allRequests.filter(
    (r) => r.status === "ready_for_generation"
  ).length;
  const deliveredThisMonth = allRequests.filter(
    (r) => r.status === "delivered" && r.created_at >= startOfMonth
  ).length;
  const revenueThisMonth = allRequests
    .filter(
      (r) => r.payment_status === "paid" && r.created_at >= startOfMonth
    )
    .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

  // Pipeline counts
  const received = allRequests.filter((r) => r.status === "received").length;
  const delivered = allRequests.filter((r) => r.status === "delivered").length;

  // Revenue last month
  const revenueLastMonth = allRequests
    .filter(
      (r) =>
        r.payment_status === "paid" &&
        r.created_at >= startOfLastMonth &&
        r.created_at < startOfMonth
    )
    .reduce((sum, r) => sum + (r.total_price_cents || 0), 0);

  // Average turnaround
  const deliveredWithTime = allRequests
    .filter((r) => r.status === "delivered" && r.updated_at)
    .map((r) => {
      const created = new Date(r.created_at).getTime();
      const deliveredAt = new Date(r.updated_at!).getTime();
      return (deliveredAt - created) / (1000 * 60 * 60 * 24);
    });
  const avgTurnaround =
    deliveredWithTime.length > 0
      ? deliveredWithTime.reduce((a, b) => a + b, 0) /
        deliveredWithTime.length
      : null;

  const recentRequests = allRequests.slice(0, 20);

  // --- Association Health Data ---
  const { data: associations } = await supabase
    .from("associations")
    .select(
      "id, name, manager_name, mailing_address, monthly_assessment_amount"
    )
    .eq("tenant_id", user.tenantId)
    .order("name");

  const assocIds = (associations || []).map((a) => a.id);

  let govDocCounts: Record<string, number> = {};
  let assocRequestCounts: Record<string, number> = {};

  if (assocIds.length > 0) {
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

    // Active request counts per association
    const activeReqs = allRequests.filter(
      (r) => r.status !== "delivered" && r.status !== "cancelled" && r.association_id
    );
    for (const req of activeReqs) {
      if (req.association_id) {
        assocRequestCounts[req.association_id] =
          (assocRequestCounts[req.association_id] || 0) + 1;
      }
    }
  }

  const enrichedAssociations = (associations || []).map((a) => {
    const govDocCount = govDocCounts[a.id] || 0;
    let filled = 0;
    if (a.manager_name && a.manager_name.trim()) filled++;
    if (a.mailing_address && a.mailing_address.trim()) filled++;
    if (a.monthly_assessment_amount && a.monthly_assessment_amount > 0) filled++;
    if (govDocCount > 0) filled++;
    const health = Math.round((filled / 4) * 100);

    return {
      id: a.id,
      name: a.name,
      health,
      activeRequests: assocRequestCounts[a.id] || 0,
    };
  });

  return (
    <DashboardClient
      kpiData={{
        revenueThisMonth,
        totalRequests,
        awaitingData,
        pendingReview,
        readyForGen,
        deliveredThisMonth,
      }}
      pipelineData={{
        received,
        awaitingData,
        pendingReview,
        readyForGen,
        delivered,
      }}
      healthData={{
        revenueThisMonth,
        revenueLastMonth,
        avgTurnaroundDays: avgTurnaround,
        deliveredCount: delivered,
        totalCount: totalRequests,
      }}
      recentRequests={recentRequests.map((req) => ({
        id: req.id,
        created_at: req.created_at,
        requester_name: req.requester_name,
        property_address: req.property_address,
        document_types: req.document_types as DocumentType[],
        status: req.status as RequestStatus,
        total_price_cents: req.total_price_cents,
        bill_to_closing: req.bill_to_closing,
        turnaround: req.turnaround as string,
      }))}
      associationHealth={enrichedAssociations}
      statusConfig={{
        dotColors: STATUS_DOT_COLOR,
        badgeColors: STATUS_BADGE,
        labels: Object.fromEntries(
          (["received", "paid", "awaiting_data", "ready_for_generation", "pending_review", "approved", "delivered", "cancelled"] as const).map(
            (s) => [s, getStatusLabel(s)]
          )
        ) as Record<RequestStatus, string>,
      }}
    />
  );
}
