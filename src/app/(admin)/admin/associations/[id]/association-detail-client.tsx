"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/pricing";
import type { RequestStatus } from "@/lib/types";
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  FileText,
  Clock,
  Settings,
  Home,
  Upload,
  Eye,
  Plus,
  Loader2,
  FolderOpen,
  Mail,
  Phone,
  MapPin,
  Users,
  ShieldCheck,
  FileCheck,
  DollarSign,
} from "lucide-react";

// ——————————————————————————————————————————
// Types
// ——————————————————————————————————————————

interface AssociationData {
  id: string;
  name: string;
  legal_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  mailing_address: string | null;
  manager_name: string | null;
  manager_email: string | null;
  manager_phone: string | null;
  total_units: number | null;
  project_type: string | null;
  monthly_assessment_amount: number | null;
  assessment_frequency: string | null;
  annual_budget_amount: number | null;
  reserve_balance: number | null;
  pet_policy: string | null;
  rental_policy: string | null;
  parking_policy: string | null;
  onboarding_status: string | null;
  dropbox_folder_path: string | null;
  fiscal_year_end: string | null;
  board_president_name: string | null;
  board_president_email: string | null;
  board_president_phone: string | null;
  [key: string]: unknown;
}

interface GoverningDoc {
  id: string;
  document_name: string | null;
  document_category: string | null;
  file_name: string | null;
  file_path: string | null;
  source: string | null;
  last_synced_at: string | null;
  created_at: string | null;
}

interface Property {
  id: string;
  address: string | null;
  unit_number: string | null;
  owner_name: string | null;
}

interface DocumentRequest {
  id: string;
  created_at: string;
  requester_name: string;
  requester_email: string;
  document_types: string[];
  status: string;
  total_price_cents: number;
  turnaround: string;
  property_address: string | null;
}

interface AssociationDetailClientProps {
  association: AssociationData;
  tenantId: string;
  governingDocs: GoverningDoc[];
  properties: Property[];
  requests: DocumentRequest[];
  isDropboxConnected: boolean;
  fieldsPopulated: number;
  fieldsTotal: number;
}

// ——————————————————————————————————————————
// Constants
// ——————————————————————————————————————————

const TABS = [
  { key: "overview", label: "Overview", icon: Building2 },
  { key: "properties", label: "Properties", icon: Home },
  { key: "documents", label: "Documents on File", icon: FileText },
  { key: "requests", label: "Request History", icon: Clock },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_COLORS: Record<string, string> = {
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

const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  paid: "Paid",
  awaiting_data: "Awaiting Data",
  ready_for_generation: "Ready for Gen",
  pending_review: "Pending Review",
  approved: "Approved",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const DOC_SLOTS = [
  { category: "ccrs", label: "CC&Rs", icon: ShieldCheck },
  { category: "bylaws", label: "Bylaws", icon: FileCheck },
  { category: "budget", label: "Budget", icon: DollarSign },
  { category: "insurance_cert", label: "Insurance Certificate", icon: ShieldCheck },
  { category: "reserve_analysis", label: "Reserve Study", icon: FileText },
] as const;

// ——————————————————————————————————————————
// Main Component
// ——————————————————————————————————————————

export function AssociationDetailClient({
  association,
  tenantId,
  governingDocs,
  properties,
  requests,
  isDropboxConnected,
  fieldsPopulated,
  fieldsTotal,
}: AssociationDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-[#38b6ff] text-[#38b6ff]"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab
          association={association}
          governingDocs={governingDocs}
          onNavigateToSettings={() => setActiveTab("settings")}
        />
      )}
      {activeTab === "properties" && (
        <PropertiesTab
          associationId={association.id}
          properties={properties}
        />
      )}
      {activeTab === "documents" && (
        <DocumentsTab governingDocs={governingDocs} />
      )}
      {activeTab === "requests" && (
        <RequestHistoryTab requests={requests} />
      )}
      {activeTab === "settings" && (
        <SettingsTab association={association} tenantId={tenantId} />
      )}
    </div>
  );
}

// ——————————————————————————————————————————
// Tab 1: Overview
// ——————————————————————————————————————————

function OverviewTab({
  association,
  governingDocs,
  onNavigateToSettings,
}: {
  association: AssociationData;
  governingDocs: GoverningDoc[];
  onNavigateToSettings: () => void;
}) {
  const fullAddress = [
    association.address,
    association.city,
    association.state,
    association.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const hasCCRs = governingDocs.some((d) => d.document_category === "ccrs");
  const hasInsurance = governingDocs.some(
    (d) => d.document_category === "insurance_cert"
  );

  const healthChecks = [
    {
      label: "Manager Name",
      ok: !!association.manager_name,
      field: "manager_name",
    },
    {
      label: "Manager Email",
      ok: !!association.manager_email,
      field: "manager_email",
    },
    {
      label: "Manager Phone",
      ok: !!association.manager_phone,
      field: "manager_phone",
    },
    {
      label: "Mailing Address",
      ok: !!association.mailing_address,
      field: "mailing_address",
    },
    {
      label: "Monthly Assessment",
      ok: !!association.monthly_assessment_amount,
      field: "monthly_assessment",
    },
    { label: "CC&Rs on File", ok: hasCCRs, field: "ccrs" },
    {
      label: "Insurance Certificate",
      ok: hasInsurance,
      field: "insurance_cert",
    },
  ];

  const healthScore = Math.round(
    (healthChecks.filter((c) => c.ok).length / healthChecks.length) * 100
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Association Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Association Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailRow
            icon={MapPin}
            label="Address"
            value={fullAddress || "Not set"}
          />
          <DetailRow
            icon={Building2}
            label="Type"
            value={
              association.project_type
                ? association.project_type.charAt(0).toUpperCase() +
                  association.project_type.slice(1)
                : "Not set"
            }
          />
          <DetailRow
            icon={Users}
            label="Total Units"
            value={association.total_units?.toString() || "Not set"}
          />

          <div className="border-t border-border pt-4 mt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Management Contact
            </p>
            <div className="space-y-3">
              <DetailRow
                icon={Users}
                label="Name"
                value={association.manager_name || "Not set"}
              />
              <DetailRow
                icon={Mail}
                label="Email"
                value={association.manager_email || "Not set"}
              />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={association.manager_phone || "Not set"}
              />
            </div>
          </div>

          {(association.board_president_name ||
            association.board_president_email) && (
            <div className="border-t border-border pt-4 mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Board Contact
              </p>
              <div className="space-y-3">
                {association.board_president_name && (
                  <DetailRow
                    icon={Users}
                    label="President"
                    value={association.board_president_name}
                  />
                )}
                {association.board_president_email && (
                  <DetailRow
                    icon={Mail}
                    label="Email"
                    value={association.board_president_email}
                  />
                )}
                {association.board_president_phone && (
                  <DetailRow
                    icon={Phone}
                    label="Phone"
                    value={association.board_president_phone as string}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Health Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Data Health</CardTitle>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                healthScore === 100
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : healthScore >= 70
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {healthScore}%
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthChecks.map((check) => (
              <div
                key={check.field}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {check.ok ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-500" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      check.ok ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {check.label}
                  </span>
                </div>
                {!check.ok && (
                  <button
                    onClick={onNavigateToSettings}
                    className="text-xs text-[#38b6ff] hover:underline"
                  >
                    Add &rarr;
                  </button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  const isEmpty = value === "Not set";
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "text-sm",
            isEmpty ? "text-muted-foreground italic" : "text-foreground"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ——————————————————————————————————————————
// Tab 2: Properties
// ——————————————————————————————————————————

function PropertiesTab({
  associationId,
  properties,
}: {
  associationId: string;
  properties: Property[];
}) {
  if (properties.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Properties</h2>
          <Button size="sm">
            <Plus className="size-4 mr-1" />
            Add Property
          </Button>
        </div>
        <EmptyState
          icon={Home}
          title="No properties yet"
          description="Add properties linked to this association to track unit details and ownership."
          action={
            <Button size="sm">
              <Plus className="size-4 mr-1" />
              Add Property
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Properties ({properties.length})
        </h2>
        <Button size="sm">
          <Plus className="size-4 mr-1" />
          Add Property
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Address
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Unit #
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Owner Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => (
                  <tr
                    key={prop.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">
                      {prop.address || "---"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {prop.unit_number || "---"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {prop.owner_name || "---"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ——————————————————————————————————————————
// Tab 3: Documents on File
// ——————————————————————————————————————————

function DocumentsTab({ governingDocs }: { governingDocs: GoverningDoc[] }) {
  const docsByCategory = new Map<string, GoverningDoc>();
  for (const doc of governingDocs) {
    if (doc.document_category) {
      // Keep the most recent one per category
      if (!docsByCategory.has(doc.document_category)) {
        docsByCategory.set(doc.document_category, doc);
      }
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Documents on File</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOC_SLOTS.map((slot) => {
          const doc = docsByCategory.get(slot.category);
          const Icon = slot.icon;
          return (
            <Card key={slot.category}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-center size-10 rounded-lg shrink-0",
                      doc
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5",
                        doc
                          ? "text-green-600 dark:text-green-400"
                          : "text-slate-400"
                      )}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{slot.label}</p>
                    {doc ? (
                      <>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {doc.file_name || doc.document_name || "Document"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Uploaded{" "}
                          {doc.last_synced_at || doc.created_at
                            ? new Date(
                                (doc.last_synced_at || doc.created_at)!
                              ).toLocaleDateString()
                            : "---"}
                        </p>
                        <button className="inline-flex items-center gap-1 mt-2 text-xs text-[#38b6ff] hover:underline">
                          <Eye className="size-3" />
                          View
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Not uploaded
                        </p>
                        <button className="inline-flex items-center gap-1 mt-2 text-xs text-[#38b6ff] hover:underline">
                          <Upload className="size-3" />
                          Upload
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ——————————————————————————————————————————
// Tab 4: Request History
// ——————————————————————————————————————————

function RequestHistoryTab({ requests }: { requests: DocumentRequest[] }) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No requests yet"
        description="Document requests for this association will appear here."
      />
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Request History ({requests.length})
      </h2>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Requester
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Documents
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {new Date(req.created_at).toLocaleDateString()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/requests/${req.id}`}
                        className="font-medium hover:text-[#38b6ff] transition-colors"
                      >
                        {req.requester_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {req.document_types.map((dt) => (
                          <span
                            key={dt}
                            className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {dt.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()).split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_COLORS[req.status] ||
                            "bg-muted text-muted-foreground"
                        )}
                      >
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {!req.total_price_cents
                        ? "\u2014"
                        : formatCents(req.total_price_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ——————————————————————————————————————————
// Tab 5: Settings
// ——————————————————————————————————————————

function SettingsTab({
  association,
  tenantId,
}: {
  association: AssociationData;
  tenantId: string;
}) {
  const router = useRouter();
  const [monthlyAssessment, setMonthlyAssessment] = useState(
    association.monthly_assessment_amount
      ? (association.monthly_assessment_amount / 100).toString()
      : ""
  );
  const [assessmentFrequency, setAssessmentFrequency] = useState(
    association.assessment_frequency || "monthly"
  );
  const [managerName, setManagerName] = useState(
    association.manager_name || ""
  );
  const [managerEmail, setManagerEmail] = useState(
    association.manager_email || ""
  );
  const [managerPhone, setManagerPhone] = useState(
    association.manager_phone || ""
  );
  const [mailingAddress, setMailingAddress] = useState(
    association.mailing_address || ""
  );
  const [fiscalYearEnd, setFiscalYearEnd] = useState(
    association.fiscal_year_end || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    const payload = {
      monthly_assessment_amount: monthlyAssessment
        ? Math.round(parseFloat(monthlyAssessment) * 100)
        : null,
      assessment_frequency: assessmentFrequency || null,
      manager_name: managerName.trim() || null,
      manager_email: managerEmail.trim() || null,
      manager_phone: managerPhone.trim() || null,
      mailing_address: mailingAddress.trim() || null,
      fiscal_year_end: fiscalYearEnd.trim() || null,
    };

    try {
      const response = await fetch(
        `/api/admin/associations/${association.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save settings");
        return;
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {/* Financial Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-assessment">
                Monthly Assessment ($)
              </Label>
              <Input
                id="settings-assessment"
                type="number"
                step="0.01"
                value={monthlyAssessment}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMonthlyAssessment(e.target.value)
                }
                placeholder="250.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-frequency">Assessment Frequency</Label>
              <select
                id="settings-frequency"
                value={assessmentFrequency}
                onChange={(e) => setAssessmentFrequency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-fiscal">Fiscal Year End</Label>
            <Input
              id="settings-fiscal"
              value={fiscalYearEnd}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFiscalYearEnd(e.target.value)
              }
              placeholder="December 31"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="settings-manager-name">Manager Name</Label>
              <Input
                id="settings-manager-name"
                value={managerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setManagerName(e.target.value)
                }
                placeholder="John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-manager-email">Manager Email</Label>
              <Input
                id="settings-manager-email"
                type="email"
                value={managerEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setManagerEmail(e.target.value)
                }
                placeholder="john@corehoa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-manager-phone">Manager Phone</Label>
              <Input
                id="settings-manager-phone"
                type="tel"
                value={managerPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setManagerPhone(e.target.value)
                }
                placeholder="(801) 555-0100"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-mailing">Mailing Address</Label>
            <Input
              id="settings-mailing"
              value={mailingAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMailingAddress(e.target.value)
              }
              placeholder="P.O. Box 1234, Salt Lake City, UT 84101"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <p className="text-sm text-green-700 dark:text-green-400">
            Settings saved successfully.
          </p>
        </div>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin mr-1" />
            Saving...
          </>
        ) : (
          "Save Settings"
        )}
      </Button>
    </form>
  );
}
