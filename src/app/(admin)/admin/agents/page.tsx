import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth";
import type { DocumentType, RequesterType } from "@/lib/types";
import { AgentsClient } from "./agents-client";

export interface AgentRow {
  name: string;
  email: string;
  requesterType: string;
  totalOrders: number;
  revenue: number;
  lastOrderDate: string;
  avgOrderValue: number;
  docTypes: DocumentType[];
}

export default async function AgentsPage() {
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

  // Group by requester email to build agent profiles
  const agentMap = new Map<
    string,
    {
      name: string;
      email: string;
      requesterType: string;
      orders: number;
      revenue: number;
      lastOrder: string;
      docTypes: Set<DocumentType>;
      totalCents: number;
    }
  >();

  for (const req of allRequests) {
    const key = (req.requester_email || req.requester_name || "unknown").toLowerCase();
    const existing = agentMap.get(key);

    const paidCents =
      req.payment_status === "paid" ? req.total_price_cents || 0 : 0;
    const docTypes = (req.document_types || []) as DocumentType[];

    if (existing) {
      existing.orders += 1;
      existing.revenue += paidCents;
      existing.totalCents += req.total_price_cents || 0;
      if (req.created_at > existing.lastOrder) {
        existing.lastOrder = req.created_at;
      }
      if (!existing.name && req.requester_name) existing.name = req.requester_name;
      if (!existing.requesterType && req.requester_type) existing.requesterType = req.requester_type;
      docTypes.forEach((dt) => existing.docTypes.add(dt));
    } else {
      agentMap.set(key, {
        name: req.requester_name || "",
        email: req.requester_email || "",
        requesterType: req.requester_type || "",
        orders: 1,
        revenue: paidCents,
        lastOrder: req.created_at,
        docTypes: new Set(docTypes),
        totalCents: req.total_price_cents || 0,
      });
    }
  }

  const agents: AgentRow[] = Array.from(agentMap.values()).map((a) => ({
    name: a.name || a.email,
    email: a.email,
    requesterType: a.requesterType || "—",
    totalOrders: a.orders,
    revenue: a.revenue,
    lastOrderDate: a.lastOrder,
    avgOrderValue: a.orders > 0 ? Math.round(a.totalCents / a.orders) : 0,
    docTypes: Array.from(a.docTypes),
  }));

  agents.sort((a, b) => b.totalOrders - a.totalOrders);

  // KPIs
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const activeAgents = agents.filter((a) => a.lastOrderDate >= thirtyDaysAgo).length;
  const avgOrdersPerAgent =
    agents.length > 0
      ? Math.round((agents.reduce((s, a) => s + a.totalOrders, 0) / agents.length) * 10) / 10
      : 0;
  const topAgentOrders = agents.length > 0 ? agents[0].totalOrders : 0;

  // New this month
  const emailsSeenBefore = new Set<string>();
  const sortedByDate = [...allRequests].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  let newThisMonth = 0;
  for (const req of sortedByDate) {
    const key = (req.requester_email || req.requester_name || "").toLowerCase();
    if (!key) continue;
    if (!emailsSeenBefore.has(key)) {
      emailsSeenBefore.add(key);
      if (req.created_at >= startOfMonth) newThisMonth++;
    }
  }

  const repeatRate =
    agents.length > 0
      ? Math.round(
          (agents.filter((a) => a.totalOrders > 1).length / agents.length) * 100
        )
      : 0;

  return (
    <AgentsClient
      agents={agents}
      kpis={{
        totalAgents: agents.length,
        activeAgents,
        avgOrdersPerAgent,
        topAgentOrders,
        newThisMonth,
        repeatRate,
      }}
    />
  );
}
