"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DOCUMENT_PRICES,
  DOCUMENT_LABELS,
  RUSH_FEE_CENTS,
  calculateOrderTotal,
  formatCents,
} from "@/lib/pricing";
import type { DocumentType, RequesterType, Turnaround } from "@/lib/types";
import {
  FileText,
  Clock,
  Zap,
  User,
  Building2,
  Loader2,
} from "lucide-react";

interface Association {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

interface OrderFormProps {
  tenantId: string;
  tenantName: string;
  associations: Association[];
}

const DOCUMENT_TYPES: DocumentType[] = [
  "resale_certificate",
  "payoff_statement",
  "governing_documents",
  "lender_questionnaire",
];

const REQUESTER_TYPE_LABELS: Record<RequesterType, string> = {
  agent: "Real Estate Agent",
  lender: "Lender",
  owner: "Property Owner",
  title_company: "Title Company",
  other: "Other",
};

const DOCUMENT_DESCRIPTIONS: Record<DocumentType, string> = {
  resale_certificate: "Required for property sales — includes assessments, violations, insurance, and compliance details",
  payoff_statement: "Current balance and payoff amounts for a unit",
  governing_documents: "CC&Rs, bylaws, budgets, insurance certs, minutes, and more",
  lender_questionnaire: "Fannie Mae 1076 + Addendum 1076A + Addendum II",
};

export function OrderForm({
  tenantId,
  tenantName,
  associations,
}: OrderFormProps) {
  const router = useRouter();

  const [associationId, setAssociationId] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<DocumentType[]>([]);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [requesterType, setRequesterType] = useState<RequesterType>("agent");
  const [turnaround, setTurnaround] = useState<Turnaround>("standard");
  const [rushNotes, setRushNotes] = useState("");
  const [billToClosing, setBillToClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isStandalonePayoff =
    selectedDocs.length === 1 && selectedDocs[0] === "payoff_statement";
  const showBillToClosing = isStandalonePayoff;
  const totalCents = calculateOrderTotal(selectedDocs, turnaround === "rush");

  function toggleDoc(doc: DocumentType) {
    setSelectedDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
    if (doc !== "payoff_statement" || selectedDocs.length !== 1) {
      setBillToClosing(false);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!associationId) newErrors.association = "Please select an association";
    if (selectedDocs.length === 0)
      newErrors.documents = "Select at least one document type";
    if (!propertyAddress.trim())
      newErrors.propertyAddress = "Property address is required";
    if (!requesterName.trim()) newErrors.requesterName = "Name is required";
    if (!requesterEmail.trim()) {
      newErrors.requesterEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
      newErrors.requesterEmail = "Enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          association_id: associationId,
          document_types: selectedDocs,
          property_address: propertyAddress,
          unit_number: unitNumber || undefined,
          requester_name: requesterName,
          requester_email: requesterEmail,
          requester_phone: requesterPhone || undefined,
          requester_type: requesterType,
          turnaround,
          rush_notes: turnaround === "rush" ? rushNotes : undefined,
          bill_to_closing: billToClosing,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ submit: data.error || "Something went wrong" });
        return;
      }

      const data = await response.json();
      router.push(`/success?request_id=${data.id}`);
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Association Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Association
          </CardTitle>
          <CardDescription>
            Select the HOA community for this document request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={associationId}
            onChange={(e) => setAssociationId(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            aria-invalid={!!errors.association}
          >
            <option value="">Select an association...</option>
            {associations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.city && a.state ? ` — ${a.city}, ${a.state}` : ""}
              </option>
            ))}
          </select>
          {errors.association && (
            <p className="mt-1.5 text-sm text-destructive">
              {errors.association}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Document Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Documents Requested
          </CardTitle>
          <CardDescription>
            Select the documents you need. Prices shown per document.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DOCUMENT_TYPES.map((doc) => {
            const isSelected = selectedDocs.includes(doc);
            return (
              <label
                key={doc}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleDoc(doc)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {DOCUMENT_LABELS[doc]}
                    </span>
                    <Badge variant="secondary">
                      {formatCents(DOCUMENT_PRICES[doc])}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {DOCUMENT_DESCRIPTIONS[doc]}
                  </p>
                </div>
              </label>
            );
          })}
          {errors.documents && (
            <p className="text-sm text-destructive">{errors.documents}</p>
          )}
        </CardContent>
      </Card>

      {/* Property Address */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyAddress">Property Address</Label>
            <Input
              id="propertyAddress"
              placeholder="123 Main Street"
              value={propertyAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPropertyAddress(e.target.value)
              }
              aria-invalid={!!errors.propertyAddress}
            />
            {errors.propertyAddress && (
              <p className="text-sm text-destructive">
                {errors.propertyAddress}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitNumber">Unit / Lot Number (optional)</Label>
            <Input
              id="unitNumber"
              placeholder="Unit 101"
              value={unitNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUnitNumber(e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Requester Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Your Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requesterName">Full Name</Label>
              <Input
                id="requesterName"
                placeholder="Jane Smith"
                value={requesterName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRequesterName(e.target.value)
                }
                aria-invalid={!!errors.requesterName}
              />
              {errors.requesterName && (
                <p className="text-sm text-destructive">
                  {errors.requesterName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="requesterEmail">Email</Label>
              <Input
                id="requesterEmail"
                type="email"
                placeholder="jane@example.com"
                value={requesterEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRequesterEmail(e.target.value)
                }
                aria-invalid={!!errors.requesterEmail}
              />
              {errors.requesterEmail && (
                <p className="text-sm text-destructive">
                  {errors.requesterEmail}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requesterPhone">Phone (optional)</Label>
              <Input
                id="requesterPhone"
                type="tel"
                placeholder="(801) 555-0100"
                value={requesterPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRequesterPhone(e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requesterType">I am a...</Label>
              <select
                id="requesterType"
                value={requesterType}
                onChange={(e) =>
                  setRequesterType(e.target.value as RequesterType)
                }
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {(
                  Object.entries(REQUESTER_TYPE_LABELS) as [
                    RequesterType,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Turnaround */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Turnaround Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                turnaround === "standard"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="turnaround"
                value="standard"
                checked={turnaround === "standard"}
                onChange={() => setTurnaround("standard")}
                className="size-4 accent-primary"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Standard</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  3-5 business days
                </p>
              </div>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                turnaround === "rush"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="turnaround"
                value="rush"
                checked={turnaround === "rush"}
                onChange={() => setTurnaround("rush")}
                className="size-4 accent-primary"
              />
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-amber-500" />
                  <span className="text-sm font-medium">Rush</span>
                  <Badge variant="outline" className="text-xs">
                    +{formatCents(RUSH_FEE_CENTS)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  1-2 business days
                </p>
              </div>
            </label>
          </div>

          {turnaround === "rush" && (
            <div className="space-y-2">
              <Label htmlFor="rushNotes">
                Rush Notes (closing date, urgency details)
              </Label>
              <Textarea
                id="rushNotes"
                placeholder="e.g., Closing date is April 15, 2025. Need documents by April 10."
                value={rushNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRushNotes(e.target.value)
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bill to Closing */}
      {showBillToClosing && (
        <Card>
          <CardContent className="pt-4">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={billToClosing}
                onCheckedChange={(checked) =>
                  setBillToClosing(checked as boolean)
                }
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium">Bill to Closing</span>
                <p className="mt-1 text-xs text-muted-foreground">
                  The payoff statement fee will be collected at closing instead
                  of now. Available for standalone payoff statements only.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>
            Review your order before submitting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No documents selected yet.
            </p>
          ) : (
            <>
              {selectedDocs.map((doc) => (
                <div key={doc} className="flex items-center justify-between">
                  <span className="text-sm">{DOCUMENT_LABELS[doc]}</span>
                  <span className="text-sm font-medium">
                    {formatCents(DOCUMENT_PRICES[doc])}
                  </span>
                </div>
              ))}
              {turnaround === "rush" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rush Processing</span>
                  <span className="text-sm font-medium">
                    {formatCents(RUSH_FEE_CENTS)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-base font-semibold">
                  {billToClosing ? "Bill to Closing" : formatCents(totalCents)}
                </span>
              </div>
              {billToClosing && (
                <p className="text-xs text-muted-foreground">
                  Fee will be collected at closing. No payment required now.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      {errors.submit && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{errors.submit}</p>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={submitting || selectedDocs.length === 0}
        className="w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Submitting...
          </>
        ) : billToClosing ? (
          "Submit Order (Bill to Closing)"
        ) : (
          `Submit Order — ${formatCents(totalCents)}`
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Managed by {tenantName} via PropertyDocz
      </p>
    </form>
  );
}
