"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType, RequestStatus } from "@/lib/types";
import { Search } from "lucide-react";

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
  ready_for_generation: "Ready for Gen",
  pending_review: "Pending Review",
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

export function RequestsTable({ requests }: { requests: Request[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");

  const filtered = useMemo(() => {
    return requests.filter((r) => {
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
  }, [requests, search, statusFilter, docTypeFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All Requests</CardTitle>
        {/* Filters */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Requester
                  </th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Property
                  </th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Documents
                  </th>
                  <th className="pb-3 pr-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {new Date(req.created_at).toLocaleDateString()}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="font-medium hover:text-[#38b6ff] transition-colors"
                      >
                        {req.requester_name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {req.requester_email}
                      </div>
                    </td>
                    <td className="py-3 pr-4 max-w-[200px] truncate text-muted-foreground">
                      {req.property_address}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {(req.document_types as DocumentType[]).map((dt) => (
                          <span
                            key={dt}
                            className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {DOCUMENT_LABELS[dt]?.split(" ")[0] || dt}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status as RequestStatus] || "bg-muted text-muted-foreground"}`}
                      >
                        {STATUS_LABELS[req.status as RequestStatus] ||
                          req.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-data font-medium">
                      {req.bill_to_closing
                        ? "BTC"
                        : formatCents(req.total_price_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
