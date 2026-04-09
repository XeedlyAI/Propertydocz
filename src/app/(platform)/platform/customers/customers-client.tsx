"use client";

import { useState } from "react";
import { Users, Search, AlertTriangle, UserX, X, TrendingUp, ArrowUpRight, CreditCard, Activity } from "lucide-react";
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
import { formatCents } from "@/lib/pricing";
import {
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TYPE_COLORS,
  TIER_COLORS,
  getTierName,
  type SubscriptionTier,
  type CustomerType,
} from "@/lib/subscriptions";

// ── Types ──

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  company: string;
  customerType: CustomerType;
  licenseNumber: string;
  tier: SubscriptionTier;
  subscriptionStatus: string;
  orders: number;
  revenue: number;
  packagesUsed: number;
  packagesIncluded: number;
  lastOrderDate: string;
  memberSince: string;
  isAtRisk: boolean;
}

interface TierSummary {
  tier: string;
  name: string;
  price: string;
  count: number;
  mrr: number;
}

interface ChurnEntry {
  name: string;
  tier: SubscriptionTier;
  revenue: number;
}

interface AtRiskEntry {
  name: string;
  tier: SubscriptionTier;
  lastOrderDate: string;
  daysSinceOrder: number;
}

interface UpgradeOpportunity {
  name: string;
  email: string;
  orders: number;
  revenue: number;
  potentialSavings: number;
}

interface TierUpgradeCandidate {
  name: string;
  currentTier: SubscriptionTier;
  packagesUsed: number;
  packagesIncluded: number;
}

interface SubscriptionHealth {
  avgUsagePct: number;
  totalPackagesUsed: number;
  totalPackagesIncluded: number;
  pastDueCount: number;
}

interface CustomersClientProps {
  customers: CustomerRow[];
  kpis: {
    totalCustomers: number;
    subscribers: number;
    mrr: number;
    active30d: number;
    freeCount: number;
    paidCount: number;
    avgRevPerCustomer: number;
  };
  tierSummary: TierSummary[];
  recentChurn: ChurnEntry[];
  atRisk: AtRiskEntry[];
  upgradeOpportunities?: UpgradeOpportunity[];
  tierUpgradeCandidates?: TierUpgradeCandidate[];
  subscriptionHealth?: SubscriptionHealth;
}

// ── Detail Panel ──

function CustomerDetailPanel({
  customer,
  onClose,
}: {
  customer: CustomerRow;
  onClose: () => void;
}) {
  const typeColors = CUSTOMER_TYPE_COLORS[customer.customerType] || CUSTOMER_TYPE_COLORS.other;
  const tierColors = TIER_COLORS[customer.tier] || TIER_COLORS.free;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-background border-l border-border shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="text-lg font-semibold">Customer Detail</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Customer Info
            </h3>
            <div className="space-y-2">
              <p className="text-lg font-semibold">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
              {customer.company && (
                <p className="text-sm text-muted-foreground">{customer.company}</p>
              )}
              {customer.licenseNumber && (
                <p className="text-sm text-muted-foreground">
                  License: <span className="font-mono">{customer.licenseNumber}</span>
                </p>
              )}
              <div className="flex gap-2">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors.bg} ${typeColors.text}`}>
                  {CUSTOMER_TYPE_LABELS[customer.customerType] || customer.customerType}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tierColors.bg} ${tierColors.text}`}>
                  {getTierName(customer.tier)}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Subscription
            </h3>
            <Card className="dash-card">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tier</span>
                  <span className="font-medium">{getTierName(customer.tier)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">{customer.subscriptionStatus}</span>
                </div>
                {customer.packagesIncluded > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage</span>
                      <span className="font-mono font-medium">
                        {customer.packagesUsed}/{customer.packagesIncluded}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#8b5cf6]"
                        style={{
                          width: `${Math.min((customer.packagesUsed / customer.packagesIncluded) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Revenue
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Card className="dash-card">
                <CardContent className="p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Total Orders
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold">{customer.orders}</p>
                </CardContent>
              </Card>
              <Card className="dash-card">
                <CardContent className="p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Lifetime Revenue
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold">
                    {formatCents(customer.revenue)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Activity
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-mono">
                  {new Date(customer.memberSince).toLocaleDateString()}
                </span>
              </div>
              {customer.lastOrderDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last order</span>
                  <span className="font-mono">
                    {new Date(customer.lastOrderDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──

export function CustomersClient({
  customers,
  kpis,
  tierSummary,
  recentChurn,
  atRisk,
  upgradeOpportunities = [],
  tierUpgradeCandidates = [],
  subscriptionHealth,
}: CustomersClientProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"orders" | "revenue" | "recent" | "name">("orders");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

  // ── Filter + sort ──
  const filtered = customers
    .filter((c) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (
          !c.name.toLowerCase().includes(q) &&
          !c.email.toLowerCase().includes(q) &&
          !c.company.toLowerCase().includes(q)
        )
          return false;
      }
      // Type
      if (typeFilter !== "all" && c.customerType !== typeFilter) return false;
      // Tier
      if (tierFilter !== "all" && c.tier !== tierFilter) return false;
      // Status
      if (statusFilter === "active" && c.subscriptionStatus !== "active") return false;
      if (statusFilter === "at_risk" && !c.isAtRisk) return false;
      if (statusFilter === "churned" && c.subscriptionStatus !== "cancelled") return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "revenue":
          return b.revenue - a.revenue;
        case "recent":
          return (
            new Date(b.lastOrderDate || 0).getTime() -
            new Date(a.lastOrderDate || 0).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.orders - a.orders;
      }
    });

  // ── KPI cells ──
  const kpiCells: KpiCell[] = [
    {
      value: kpis.totalCustomers,
      label: "Total Customers",
      context: "All time",
      contextColor: "muted",
    },
    {
      value: kpis.subscribers,
      label: "Subscribers",
      context: kpis.totalCustomers > 0
        ? `${Math.round((kpis.subscribers / kpis.totalCustomers) * 100)}% of total`
        : "—",
      contextColor: "info",
    },
    {
      value: kpis.mrr / 100,
      label: "MRR",
      prefix: "$",
      decimals: 2,
      context: kpis.mrr > 0 ? "Monthly recurring" : "No subscriptions yet",
      contextColor: kpis.mrr > 0 ? "good" : "attention",
    },
    {
      value: kpis.active30d,
      label: "Active (30d)",
      context: kpis.totalCustomers > 0
        ? `${Math.round((kpis.active30d / kpis.totalCustomers) * 100)}% active`
        : "—",
      contextColor: "good",
    },
    {
      value: kpis.freeCount,
      label: "Free Tier",
      context: "Pay-per-order",
      contextColor: "muted",
    },
    {
      value: kpis.paidCount,
      label: "Paid Tiers",
      context: kpis.totalCustomers > 0
        ? `${Math.round((kpis.paidCount / Math.max(kpis.totalCustomers, 1)) * 100)}% conversion`
        : "—",
      contextColor: "info",
    },
    {
      value: kpis.avgRevPerCustomer / 100,
      label: "Avg Rev/Customer",
      prefix: "$",
      decimals: 2,
      contextColor: "muted",
    },
  ];

  return (
    <>
      <StaggerContainer className="space-y-6" staggerDelay={0.1}>
        <FadeUpChild>
          <PageHeader
            title="Customers"
            subtitle="Unified customer management across all tenants"
          />
        </FadeUpChild>

        <FadeUpChild>
          <PageKpiTickerResponsive cells={kpiCells} />
        </FadeUpChild>

        {/* Tier Summary Cards */}
        <FadeUpChild>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {tierSummary.map((t) => (
              <Card key={t.tier} className="dash-card">
                <CardContent className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t.name}
                  </p>
                  <p className="mt-1 font-mono text-xl font-bold text-foreground">
                    {t.price}
                  </p>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Customers</span>
                      <span className="font-mono font-medium text-foreground">
                        {t.count}
                      </span>
                    </div>
                    <div className="pt-1.5 mt-1.5 border-t border-border flex justify-between">
                      <span>MRR</span>
                      <span className="font-mono font-medium text-[#8b5cf6]">
                        ${(t.mrr / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeUpChild>

        {/* Filter Bar + Customer Table */}
        <FadeUpChild>
          <Card className="dash-card">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Customer Directory</CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-9 w-full sm:w-48 rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30"
                    />
                  </div>
                  {/* Type filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30"
                  >
                    <option value="all">All Types</option>
                    <option value="agent">Agents</option>
                    <option value="lender">Lenders</option>
                    <option value="title_company">Title Companies</option>
                    <option value="homeowner">Homeowners</option>
                    <option value="other">Other</option>
                  </select>
                  {/* Tier filter */}
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30"
                  >
                    <option value="all">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="agent_pro">Agent Pro</option>
                    <option value="broker_office">Broker Office</option>
                    <option value="title_partner">Title Partner</option>
                  </select>
                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="at_risk">At Risk</option>
                    <option value="churned">Churned</option>
                  </select>
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30"
                  >
                    <option value="orders">Sort: Orders</option>
                    <option value="revenue">Sort: Revenue</option>
                    <option value="recent">Sort: Recent</option>
                    <option value="name">Sort: Name</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {customers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No customers yet"
                  description="Customer accounts are created when orders are placed or users sign up for subscriptions."
                />
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No customers match your filters.
                </p>
              ) : (
                <div className="table-scroll-mobile">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Name
                        </th>
                        <th className="hidden sm:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Type
                        </th>
                        <th className="hidden md:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Tier
                        </th>
                        <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Orders
                        </th>
                        <th className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Revenue
                        </th>
                        <th className="hidden lg:table-cell pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Usage
                        </th>
                        <th className="hidden sm:table-cell pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Last Order
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((customer) => {
                        const typeColors =
                          CUSTOMER_TYPE_COLORS[customer.customerType] ||
                          CUSTOMER_TYPE_COLORS.other;
                        const tierColors =
                          TIER_COLORS[customer.tier] || TIER_COLORS.free;
                        const usagePct =
                          customer.packagesIncluded > 0
                            ? (customer.packagesUsed / customer.packagesIncluded) * 100
                            : 0;

                        // Status determination
                        let statusDot = "bg-[#14b8a6]"; // active
                        if (customer.subscriptionStatus === "cancelled") statusDot = "bg-gray-400";
                        else if (customer.subscriptionStatus === "past_due") statusDot = "bg-[#ef4444]";
                        else if (customer.isAtRisk) statusDot = "bg-[#f59e0b]";

                        return (
                          <tr
                            key={customer.id}
                            onClick={() => setSelectedCustomer(customer)}
                            className={`border-b border-border/50 last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer ${
                              customer.subscriptionStatus === "past_due"
                                ? "border-l-[3px] border-l-[#ef4444]"
                                : customer.isAtRisk
                                  ? "border-l-[3px] border-l-[#f59e0b]"
                                  : ""
                            }`}
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`size-2 rounded-full shrink-0 ${statusDot}`}
                                />
                                <div className="min-w-0">
                                  <p
                                    className="font-medium truncate max-w-[180px]"
                                    title={customer.name}
                                  >
                                    {customer.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={customer.email}>
                                    {customer.email}
                                  </p>
                                  {customer.company && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[150px] md:hidden">
                                      {customer.company}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="hidden sm:table-cell py-3 pr-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors.bg} ${typeColors.text}`}
                              >
                                {CUSTOMER_TYPE_LABELS[customer.customerType] || customer.customerType}
                              </span>
                            </td>
                            <td className="hidden md:table-cell py-3 pr-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tierColors.bg} ${tierColors.text}`}
                              >
                                {getTierName(customer.tier)}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right font-mono font-medium">
                              {customer.orders}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono font-medium">
                              {formatCents(customer.revenue)}
                            </td>
                            <td className="hidden lg:table-cell py-3 pr-4">
                              {customer.packagesIncluded > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-14 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        usagePct > 100
                                          ? "bg-[#ef4444]"
                                          : usagePct > 80
                                            ? "bg-[#f59e0b]"
                                            : "bg-[#8b5cf6]"
                                      }`}
                                      style={{
                                        width: `${Math.min(usagePct, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-mono text-muted-foreground">
                                    {customer.packagesUsed}/{customer.packagesIncluded}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="hidden sm:table-cell py-3 text-right text-muted-foreground">
                              {customer.lastOrderDate
                                ? new Date(customer.lastOrderDate).toLocaleDateString()
                                : "—"}
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

        {/* Subscription Health & Analytics */}
        {subscriptionHealth && (
          <FadeUpChild>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="dash-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="size-4 text-[#8b5cf6]" />
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Platform Usage
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          subscriptionHealth.avgUsagePct > 90
                            ? "bg-[#ef4444]"
                            : subscriptionHealth.avgUsagePct > 70
                              ? "bg-[#f59e0b]"
                              : "bg-[#8b5cf6]"
                        }`}
                        style={{ width: `${Math.min(subscriptionHealth.avgUsagePct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="font-mono">{subscriptionHealth.totalPackagesUsed}/{subscriptionHealth.totalPackagesIncluded}</span>
                      <span className="font-mono font-medium text-foreground">{subscriptionHealth.avgUsagePct}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dash-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="size-4 text-[#ef4444]" />
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Past Due
                    </p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-foreground">
                    {subscriptionHealth.pastDueCount}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {subscriptionHealth.pastDueCount === 0 ? "All payments current" : "Need payment update"}
                  </p>
                </CardContent>
              </Card>

              <Card className="dash-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="size-4 text-[#14b8a6]" />
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Upgrade Leads
                    </p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-foreground">
                    {upgradeOpportunities.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Free users with 3+ orders
                  </p>
                </CardContent>
              </Card>

              <Card className="dash-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowUpRight className="size-4 text-[#f59e0b]" />
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Tier Upgrades
                    </p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-foreground">
                    {tierUpgradeCandidates.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Using &gt;80% of packages
                  </p>
                </CardContent>
              </Card>
            </div>
          </FadeUpChild>
        )}

        {/* Upgrade Opportunities */}
        {(upgradeOpportunities.length > 0 || tierUpgradeCandidates.length > 0) && (
          <FadeUpChild>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Free-to-Paid Opportunities */}
              {upgradeOpportunities.length > 0 && (
                <Card className="dash-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-[#14b8a6]" />
                      <CardTitle className="text-base">Upgrade Opportunities</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Free customers who order frequently — prime subscription candidates
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {upgradeOpportunities.map((opp, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between border-l-[3px] border-l-[#14b8a6] rounded-r-lg bg-teal-50/50 dark:bg-teal-900/10 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{opp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {opp.orders} orders • {formatCents(opp.revenue)} spent
                            </p>
                          </div>
                          <span className="text-xs font-medium text-[#14b8a6]">
                            ~{formatCents(opp.potentialSavings)} savings
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tier Upgrade Candidates */}
              {tierUpgradeCandidates.length > 0 && (
                <Card className="dash-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="size-4 text-[#f59e0b]" />
                      <CardTitle className="text-base">Tier Upgrade Candidates</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Subscribers using most of their packages — may benefit from a higher tier
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {tierUpgradeCandidates.map((cand, i) => {
                        const usagePct = cand.packagesIncluded > 0
                          ? Math.round((cand.packagesUsed / cand.packagesIncluded) * 100)
                          : 0;
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between border-l-[3px] border-l-[#f59e0b] rounded-r-lg bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium">{cand.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {getTierName(cand.currentTier)} • {cand.packagesUsed}/{cand.packagesIncluded} packages
                              </p>
                            </div>
                            <span className="text-xs font-mono font-medium text-[#f59e0b]">
                              {usagePct}% used
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </FadeUpChild>
        )}

        {/* Churn & Health */}
        <FadeUpChild>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Churn */}
            <Card className="dash-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <UserX className="size-4 text-muted-foreground" />
                  <CardTitle className="text-base">Recent Churn</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {recentChurn.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-[#14b8a6]/20 bg-[#14b8a6]/5 px-4 py-3 text-sm text-[#14b8a6]">
                    No cancellations
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentChurn.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-l-[3px] border-l-[#ef4444] rounded-r-lg bg-red-50/50 dark:bg-red-900/10 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getTierName(entry.tier)}
                          </p>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          LTV {formatCents(entry.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* At-Risk */}
            <Card className="dash-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-muted-foreground" />
                  <CardTitle className="text-base">At-Risk Subscribers</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {atRisk.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-[#14b8a6]/20 bg-[#14b8a6]/5 px-4 py-3 text-sm text-[#14b8a6]">
                    {customers.length > 0
                      ? "All subscribers are actively ordering"
                      : "No customer data yet"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {atRisk.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-l-[3px] border-l-[#f59e0b] rounded-r-lg bg-amber-50/50 dark:bg-amber-900/10 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {getTierName(entry.tier)} • Last order{" "}
                            {new Date(entry.lastOrderDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-[#f59e0b]">
                          {entry.daysSinceOrder}d inactive
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </FadeUpChild>
      </StaggerContainer>

      {/* Detail Panel */}
      {selectedCustomer && (
        <CustomerDetailPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </>
  );
}
