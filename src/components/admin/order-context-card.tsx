import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCents, DOCUMENT_LABELS } from "@/lib/pricing";
import type { DocumentType } from "@/lib/types";
import { User, Building2, FileText, Zap } from "lucide-react";

interface OrderContextCardProps {
  request: {
    requester_name: string;
    requester_email: string;
    requester_phone: string | null;
    requester_type: string;
    property_address: string;
    turnaround: string;
    bill_to_closing: boolean;
    payment_status: string;
    total_price_cents: number;
    rush_notes: string | null;
    live_data: Record<string, string> | null;
    document_types: string[];
  };
  associationName: string;
}

const TRANSACTION_DISPLAY_KEYS: { key: string; altKey?: string; label: string }[] = [
  { key: "owner_name", altKey: "owner_names", label: "Owner Name" },
  { key: "closing_date", label: "Closing Date" },
  { key: "balance_due", label: "Balance Due" },
  { key: "unit_lot_number", label: "Unit / Lot" },
];

export function OrderContextCard({ request, associationName }: OrderContextCardProps) {
  const liveData = request.live_data || {};

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Order Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Row 1: Requester + Property */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <User className="size-3" />
              Requester
            </div>
            <div className="grid gap-1.5">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{request.requester_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{request.requester_email}</p>
              </div>
              {request.requester_phone && (
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{request.requester_phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium capitalize">
                  {request.requester_type.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Building2 className="size-3" />
              Property
            </div>
            <div className="grid gap-1.5">
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">{request.property_address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Association</p>
                <p className="text-sm font-medium">{associationName}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Row 2: Order Details + Transaction Data */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <FileText className="size-3" />
              Order Details
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Turnaround</p>
                {request.turnaround === "rush" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <Zap className="size-3" />
                    Rush
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    Standard
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="text-sm font-medium capitalize">
                  {request.bill_to_closing
                    ? "Bill to Closing"
                    : request.payment_status.replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-data font-semibold">
                  {request.bill_to_closing ? "BTC" : formatCents(request.total_price_cents)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Documents</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {request.document_types.map((dt) => (
                    <span
                      key={dt}
                      className="inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      {DOCUMENT_LABELS[dt as DocumentType] || dt.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
              {request.rush_notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Rush Notes</p>
                  <p className="text-sm">{request.rush_notes}</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Transaction Data</p>
            <div className="grid gap-1.5">
              {TRANSACTION_DISPLAY_KEYS.map(({ key, altKey, label }) => {
                const val = liveData[key] || (altKey ? liveData[altKey] : "") || "";
                const populated = val.trim().length > 0;
                return (
                  <div
                    key={key}
                    className={`border-l-2 pl-2 ${populated ? "border-green-400" : "border-amber-400"}`}
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {populated ? (
                      <p className="text-sm font-medium">{val}</p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">&mdash;</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
