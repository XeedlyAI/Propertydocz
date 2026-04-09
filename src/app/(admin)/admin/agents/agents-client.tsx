"use client";

import { useState } from "react";
import { Users, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  PageKpiTickerResponsive,
  type KpiCell,
} from "@/components/shared/PageKpiTicker";
import {
  StaggerContainer,
  FadeUpChild,
} from "@/components/shared/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType } from "@/lib/types";

interface AgentRow {
  name: string;
  email: string;
  requesterType: string;
  totalOrders: number;
  revenue: number;
  lastOrderDate: string;
  avgOrderValue: number;
  docTypes: DocumentType[];
}

interface AgentsClientProps {
  agents: AgentRow[];
  kpis: {
    totalAgents: number;
    activeAgents: number;
    avgOrdersPerAgent: number;
    topAgentOrders: number;
    newThisMonth: number;
    repeatRate: number;
  };
}

export function AgentsClient({ agents, kpis }: AgentsClientProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState<"orders" | "revenue" | "lastOrder" | "name">("orders");

  // Unique types for filter
  const types = Array.from(
    new Set(agents.map((a) => a.requesterType).filter((c) => c !== "—"))
  ).sort();

  // Filter + sort
  const filtered = agents
    .filter((a) => {
      const q = search.toLowerCase();
      if (q && !a.name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q) && !a.requesterType.toLowerCase().includes(q)) {
        return false;
      }
      if (filterType !== "all" && a.requesterType !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return b.revenue - a.revenue;
        case "lastOrder":
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.totalOrders - a.totalOrders;
      }
    });

  const kpiCells: KpiCell[] = [
    {
      value: kpis.totalAgents,
      label: "Total Agents",
      context: "All time",
      contextColor: "muted",
    },
    {
      value: kpis.activeAgents,
      label: "Active (30d)",
      context: kpis.totalAgents > 0 ? `${Math.round((kpis.activeAgents / kpis.totalAgents) * 100)}% of total` : "—",
      contextColor: "good",
    },
    {
      value: kpis.avgOrdersPerAgent,
      label: "Avg Orders/Agent",
      decimals: 1,
      contextColor: "muted",
    },
    {
      value: kpis.topAgentOrders,
      label: "Top Agent Orders",
      context: "Highest volume",
      contextColor: "info",
    },
    {
      value: kpis.newThisMonth,
      label: "New This Month",
      context: kpis.newThisMonth > 0 ? "Growing" : "—",
      contextColor: kpis.newThisMonth > 0 ? "good" : "muted",
    },
    {
      value: kpis.repeatRate,
      label: "Repeat Rate",
      suffix: "%",
      context: kpis.repeatRate >= 50 ? "Strong retention" : "Room to grow",
      contextColor: kpis.repeatRate >= 50 ? "good" : "attention",
    },
  ];

  return (
    <StaggerContainer className="space-y-6" staggerDelay={0.1}>
      <FadeUpChild>
        <PageHeader
          title="Agents"
          subtitle="Real estate agents who order documents through your portal"
        />
      </FadeUpChild>

      <FadeUpChild>
        <PageKpiTickerResponsive cells={kpiCells} />
      </FadeUpChild>

      <FadeUpChild>
        <Card className="dash-card">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Agent Directory</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-full sm:w-52 rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#38b6ff]/30"
                  />
                </div>
                {types.length > 0 && (
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38b6ff]/30"
                  >
                    <option value="all">All Types</option>
                    {types.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#38b6ff]/30"
                >
                  <option value="orders">Sort: Orders</option>
                  <option value="revenue">Sort: Revenue</option>
                  <option value="lastOrder">Sort: Recent</option>
                  <option value="name">Sort: Name</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {agents.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No agent data yet"
                description="Agent profiles are automatically created from document requests."
              />
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No agents match your search.
              </p>
            ) : (
              <div className="table-scroll-mobile">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Name
                      </th>
                      <th className="hidden md:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Email
                      </th>
                      <th className="hidden sm:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Type
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Orders
                      </th>
                      <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Revenue
                      </th>
                      <th className="hidden sm:table-cell pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Avg Value
                      </th>
                      <th className="hidden lg:table-cell pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Last Order
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((agent, i) => {
                      const daysSinceOrder = Math.round(
                        (Date.now() - new Date(agent.lastOrderDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      const isInactive = daysSinceOrder > 60;

                      return (
                        <tr
                          key={agent.email || i}
                          className="border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-2 rounded-full shrink-0 ${
                                  isInactive ? "bg-gray-300" : "bg-[#14b8a6]"
                                }`}
                              />
                              <span className="font-medium truncate max-w-[180px]" title={agent.name}>
                                {agent.name}
                              </span>
                            </div>
                          </td>
                          <td
                            className="hidden md:table-cell py-3 pr-4 text-muted-foreground truncate max-w-[200px]"
                            title={agent.email}
                          >
                            {agent.email}
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4 text-muted-foreground truncate max-w-[150px]" title={agent.requesterType}>
                            {agent.requesterType}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono font-medium">
                            {agent.totalOrders}
                          </td>
                          <td className="py-3 pr-4 text-right font-mono font-medium">
                            {formatCents(agent.revenue)}
                          </td>
                          <td className="hidden sm:table-cell py-3 pr-4 text-right font-mono text-muted-foreground">
                            {formatCents(agent.avgOrderValue)}
                          </td>
                          <td className="hidden lg:table-cell py-3 text-right text-muted-foreground">
                            {new Date(agent.lastOrderDate).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeUpChild>
    </StaggerContainer>
  );
}
