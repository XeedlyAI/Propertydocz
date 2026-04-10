"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType, RequestStatus } from "@/lib/types";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Request {
  id: string;
  created_at: string;
  requester_name: string;
  requester_email: string;
  property_address: string | null;
  document_types: string[];
  status: string;
  total_price_cents: number;
  turnaround: string;
  bill_to_closing: boolean;
  payment_status: string;
  requester_type: string;
}

interface TriageCounts {
  awaiting_data: number;
  pending_review: number;
  ready_for_generation: number;
  rush: number;
}

const STATUS_COLORS: Record<RequestStatus, string> = {
  received: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  paid: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  awaiting_data:
    "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  ready_for_generation:
    "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  pending_review:
    "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  approved:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  delivered:
    "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  received: "Received",
  paid: "Paid",
  awaiting_data: "Awaiting Data",
  ready_for_generation: "Ready",
  pending_review: "Review",
  approved: "Approved",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ALL_STATUSES: RequestStatus[] = [
  "received",
  "paid",
  "awaiting_data",
  "ready_for_generation",
  "pending_review",
  "approved",
  "delivered",
  "cancelled",
];

const ALL_DOC_TYPES: DocumentType[] = [
  "resale_certificate",
  "payoff_statement",
  "governing_documents",
  "lender_questionnaire",
];

type TriageFilter =
  | "all"
  | "awaiting_data"
  | "pending_review"
  | "ready_for_generation"
  | "rush";

const ROW_BORDER_COLORS: Record<string, string> = {
  awaiting_data: "border-l-amber-400",
  pending_review: "border-l-purple-400",
  ready_for_generation: "border-l-[#38b6ff]",
  delivered: "border-l-green-500",
  cancelled: "border-l-slate-200",
};

function getRowBorderClass(req: Request): string {
  if (
    req.turnaround === "rush" &&
    req.status !== "delivered" &&
    req.status !== "cancelled"
  ) {
    return "border-l-red-500";
  }
  return ROW_BORDER_COLORS[req.status] || "border-l-transparent";
}

function getActionButton(req: Request) {
  switch (req.status) {
    case "awaiting_data":
      return {
        label: "Send Reminder",
        shortLabel: null,
        className:
          "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
      };
    case "pending_review":
      return {
        label: "Review",
        shortLabel: null,
        className:
          "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
      };
    case "ready_for_generation":
      return {
        label: "Generate",
        shortLabel: null,
        className:
          "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
      };
    default:
      return {
        label: "View",
        shortLabel: null,
        className:
          "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
      };
  }
}

function formatAge(createdAt: string): string {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 30) return `${Math.floor(diffDays / 30)}mo`;
  if (diffDays >= 7) return `${Math.floor(diffDays / 7)}w`;
  if (diffDays >= 1) return `${diffDays}d`;
  if (diffHours >= 1) return `${diffHours}h`;
  return "<1h";
}

function formatTotal(req: Request): string {
  if (req.bill_to_closing) return "BTC";
  if (!req.total_price_cents) return "\u2014";
  return formatCents(req.total_price_cents);
}

export function RequestsTable({
  requests,
  triageCounts,
}: {
  requests: Request[];
  triageCounts: TriageCounts;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");
  const [triageFilter, setTriageFilter] = useState<TriageFilter>("all");

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (triageFilter !== "all") {
        if (triageFilter === "rush") {
          if (
            !(
              r.turnaround === "rush" &&
              r.status !== "delivered" &&
              r.status !== "cancelled"
            )
          )
            return false;
        } else if (r.status !== triageFilter) {
          return false;
        }
      }
      if (statusFilter && r.status !== statusFilter) return false;
      if (
        docTypeFilter &&
        !(r.document_types as string[]).includes(docTypeFilter)
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = r.requester_name.toLowerCase().includes(q);
        const matchesAddress = (r.property_address || "")
          .toLowerCase()
          .includes(q);
        const matchesEmail = r.requester_email.toLowerCase().includes(q);
        if (!matchesName && !matchesAddress && !matchesEmail) return false;
      }
      return true;
    });
  }, [requests, search, statusFilter, docTypeFilter, triageFilter]);

  const triagePills: { key: TriageFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: requests.length },
    {
      key: "awaiting_data",
      label: "Awaiting Data",
      count: triageCounts.awaiting_data,
    },
    {
      key: "pending_review",
      label: "Pending Review",
      count: triageCounts.pending_review,
    },
    {
      key: "ready_for_generation",
      label: "Ready",
      count: triageCounts.ready_for_generation,
    },
    { key: "rush", label: "Rush", count: triageCounts.rush },
  ];

  return (
    <div className="space-y-4">
      {/* Triage Filter Strip */}
      <div className="flex flex-wrap gap-2">
        {triagePills.map((pill) => (
          <button
            key={pill.key}
            onClick={() => setTriageFilter(pill.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              triageFilter === pill.key
                ? "bg-[#38b6ff] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            )}
          >
            {pill.label}
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-1.5 text-xs font-semibold min-w-[20px]",
                triageFilter === pill.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              )}
            >
              {pill.count}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Requests</CardTitle>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or address..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-[#38b6ff] focus-visible:ring-2 focus-visible:ring-[#38b6ff]/20 dark:bg-input/30"
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-[#38b6ff] focus-visible:ring-2 focus-visible:ring-[#38b6ff]/20 dark:bg-input/30"
            >
              <option value="">All Doc Types</option>
              {ALL_DOC_TYPES.map((dt) => (
                <option key={dt} value={dt}>
                  {DOCUMENT_LABELS[dt]}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {requests.length === 0
                ? "No requests yet."
                : "No requests match your filters."}
            </p>
          ) : (
            <>
              {/* ───── Mobile: Card layout (below md) ───── */}
              <div className="md:hidden space-y-3">
                {filtered.map((req) => {
                  const action = getActionButton(req);
                  return (
                    <Link
                      key={req.id}
                      href={`/admin/requests/${req.id}`}
                      className={cn(
                        "block rounded-xl border border-border/50 p-3 transition-colors hover:bg-muted/50 border-l-[3px]",
                        getRowBorderClass(req)
                      )}
                    >
                      {/* Line 1: Name + Status + Total */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate flex-1">
                          {req.requester_name}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                            STATUS_COLORS[
                              req.status as RequestStatus
                            ] || "bg-muted text-muted-foreground"
                          )}
                        >
                          {STATUS_LABELS[req.status as RequestStatus] ||
                            req.status}
                        </span>
                        <span className="font-mono text-sm font-medium shrink-0 w-16 text-right">
                          {formatTotal(req)}
                        </span>
                      </div>
                      {/* Line 2: Property + Age */}
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {req.property_address || "No address"}
                        </span>
                        <span className="font-mono text-xs text-slate-400 shrink-0">
                          {formatAge(req.created_at)}
                        </span>
                      </div>
                      {/* Action button */}
                      <div className="mt-2">
                        <span
                          className={cn(
                            "inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                            action.className
                          )}
                        >
                          {action.label}
                          <ChevronRight className="size-3" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* ───── Desktop: Table layout (md and up) ───── */}
              <div className="hidden md:block overflow-hidden rounded-xl">
                <table className="w-full text-sm table-fixed">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-24">
                        Date
                      </th>
                      <th className="pb-3 pr-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-[180px]">
                        Requester
                      </th>
                      <th className="pb-3 pr-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Property
                      </th>
                      <th className="pb-3 pr-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-[140px] hidden lg:table-cell">
                        Documents
                      </th>
                      <th className="pb-3 pr-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-24">
                        Status
                      </th>
                      <th className="pb-3 pr-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground w-20">
                        Total
                      </th>
                      <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground w-28">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((req) => {
                      const action = getActionButton(req);
                      return (
                        <tr
                          key={req.id}
                          className={cn(
                            "border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50 border-l-[3px]",
                            getRowBorderClass(req)
                          )}
                        >
                          {/* Date + Age merged */}
                          <td className="py-3 pr-3 w-24">
                            <Link
                              href={`/admin/requests/${req.id}`}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <div className="text-sm">
                                {new Date(
                                  req.created_at
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="font-mono text-xs text-slate-400">
                                {formatAge(req.created_at)}
                              </div>
                            </Link>
                          </td>
                          {/* Requester: name + email */}
                          <td className="py-3 pr-3 w-[180px]">
                            <Link
                              href={`/admin/requests/${req.id}`}
                              className="font-medium hover:text-[#38b6ff] transition-colors block truncate"
                            >
                              {req.requester_name}
                            </Link>
                            <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                              {req.requester_email}
                            </div>
                          </td>
                          {/* Property */}
                          <td className="py-3 pr-3">
                            <span className="text-muted-foreground truncate block max-w-[180px]">
                              {req.property_address || "\u2014"}
                            </span>
                          </td>
                          {/* Documents — hidden below lg */}
                          <td className="py-3 pr-3 w-[140px] hidden lg:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {(req.document_types as DocumentType[]).map(
                                (dt) => (
                                  <span
                                    key={dt}
                                    className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                                  >
                                    {DOCUMENT_LABELS[dt]?.split(" ")[0] || dt}
                                  </span>
                                )
                              )}
                            </div>
                          </td>
                          {/* Status */}
                          <td className="py-3 pr-3 w-24">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                STATUS_COLORS[
                                  req.status as RequestStatus
                                ] || "bg-muted text-muted-foreground"
                              )}
                            >
                              {STATUS_LABELS[req.status as RequestStatus] ||
                                req.status}
                            </span>
                          </td>
                          {/* Total */}
                          <td className="py-3 pr-3 text-right font-mono text-sm w-20">
                            {formatTotal(req)}
                          </td>
                          {/* Action */}
                          <td className="py-3 text-right w-28">
                            <Link
                              href={`/admin/requests/${req.id}`}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                                action.className
                              )}
                            >
                              {action.label}
                              <ChevronRight className="size-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
