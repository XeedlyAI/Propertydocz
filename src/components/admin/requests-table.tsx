"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

const STATUS_VARIANTS: Record<
  RequestStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  received: "outline",
  paid: "secondary",
  awaiting_data: "default",
  ready_for_generation: "secondary",
  pending_review: "default",
  approved: "secondary",
  delivered: "secondary",
  cancelled: "destructive",
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
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
            className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
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
            className="h-8 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
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
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">
                    Requester
                  </th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">
                    Property
                  </th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">
                    Documents
                  </th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="hover:underline"
                      >
                        {new Date(req.created_at).toLocaleDateString()}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="font-medium hover:underline"
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
                          <Badge
                            key={dt}
                            variant="outline"
                            className="text-xs"
                          >
                            {DOCUMENT_LABELS[dt]?.split(" ")[0] || dt}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={
                          STATUS_VARIANTS[req.status as RequestStatus] ||
                          "outline"
                        }
                      >
                        {STATUS_LABELS[req.status as RequestStatus] ||
                          req.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-medium">
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
