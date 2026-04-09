import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import type { DocumentType } from "@/lib/types";
import { LendersClient } from "./lenders-client";

interface LenderRow {
  name: string;
  email: string;
  company: string;
  totalOrders: number;
  lenderQuestionnaires: number;
  revenue: number;
  lastOrderDate: string;
}

export default async function LendersPage() {
  const user = await getAdminUser();
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("document_requests")
    .select(
      "id, created_at, requester_name, requester_email, requester_type, document_types, total_price_cents, payment_status"
    )
    .eq("tenant_id", user.tenantId)
    .order("created_at", { ascending: false });

  const allRequests = requests || [];

  // Filter to requesters who have ordered at least one lender questionnaire
  const lenderMap = new Map<
    string,
    {
      name: string;
      email: string;
      rType: string;
      orders: number;
      lqCount: number;
      revenue: number;
      lastOrder: string;
    }
  >();

  for (const req of allRequests) {
    const docTypes = (req.document_types || []) as DocumentType[];
    const hasLQ = docTypes.includes("lender_questionnaire");
    const key = (req.requester_email || req.requester_name || "unknown").toLowerCase();

    const existing = lenderMap.get(key);
    const paidCents =
      req.payment_status === "paid" ? req.total_price_cents || 0 : 0;

    if (existing) {
      existing.orders += 1;
      existing.revenue += paidCents;
      if (hasLQ) existing.lqCount += 1;
      if (req.created_at > existing.lastOrder) {
        existing.lastOrder = req.created_at;
      }
      if (!existing.name && req.requester_name) existing.name = req.requester_name;
      if (!existing.rType && req.requester_type) existing.rType = req.requester_type;
    } else if (hasLQ) {
      // Only create entry if they've ordered at least one LQ
      lenderMap.set(key, {
        name: req.requester_name || "",
        email: req.requester_email || "",
        rType: req.requester_type || "",
        orders: 1,
        lqCount: 1,
        revenue: paidCents,
        lastOrder: req.created_at,
      });
    }
  }

  // Also add subsequent non-LQ orders for known lenders
  for (const req of allRequests) {
    const key = (req.requester_email || req.requester_name || "unknown").toLowerCase();
    const existing = lenderMap.get(key);
    if (!existing) continue;
    // Already counted in the first pass
  }

  const lenders: LenderRow[] = Array.from(lenderMap.values())
    .map((l) => ({
      name: l.name || l.email,
      email: l.email,
      company: l.rType || "—",
      totalOrders: l.orders,
      lenderQuestionnaires: l.lqCount,
      revenue: l.revenue,
      lastOrderDate: l.lastOrder,
    }))
    .sort((a, b) => b.totalOrders - a.totalOrders);

  // KPIs
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const activeLenders = lenders.filter((l) => l.lastOrderDate >= thirtyDaysAgo).length;
  const lqThisMonth = allRequests.filter(
    (r) =>
      r.created_at >= startOfMonth &&
      ((r.document_types || []) as DocumentType[]).includes("lender_questionnaire")
  ).length;

  const deliveredWithTime = allRequests
    .filter((r) => ((r.document_types || []) as DocumentType[]).includes("lender_questionnaire"))
    .length;

  const totalLenderRevenue = lenders.reduce((s, l) => s + l.revenue, 0);

  // New lenders this month
  const emailsSeenBefore = new Set<string>();
  const sortedByDate = [...allRequests].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  let newThisMonth = 0;
  for (const req of sortedByDate) {
    const docTypes = (req.document_types || []) as DocumentType[];
    if (!docTypes.includes("lender_questionnaire")) continue;
    const key = (req.requester_email || req.requester_name || "").toLowerCase();
    if (!key) continue;
    if (!emailsSeenBefore.has(key)) {
      emailsSeenBefore.add(key);
      if (req.created_at >= startOfMonth) newThisMonth++;
    }
  }

  return (
    <LendersClient
      lenders={lenders}
      kpis={{
        totalLenders: lenders.length,
        activeLenders,
        lqThisMonth,
        avgTurnaround: 0,
        revenueFromLenders: totalLenderRevenue,
        newThisMonth,
      }}
    />
  );
}
