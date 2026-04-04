"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Building2,
  DollarSign,
  HardDrive,
  UserPlus,
  Map,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Info,
  CreditCard,
  Upload,
  FileSpreadsheet,
  X,
  Folder,
  ArrowLeft,
  Check,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WizardProps {
  platformUserId: string;
}

interface AssociationEntry {
  id?: string; // DB id after saving
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  unit_count: string;
  type: string;
  dropbox_folder_path?: string | null;
}

interface WizardData {
  // Step 1: Company Info
  companyName: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  primaryColor: string;

  // Step 2: Revenue & Payments
  platformFeePercent: string;
  stripeStatus: "none" | "pending" | "connected";
  stripeAccountId: string | null;

  // Step 3: Storage
  storageProvider: "dropbox" | "google_drive" | "onedrive" | "none";
  storageConnected: boolean;

  // Step 4: Admin User
  createAdmin: boolean;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminCreated: boolean;

  // Step 5: Associations
  associations: AssociationEntry[];

  // Step 6: Folder Mappings (managed via associations[].dropbox_folder_path)
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = [
  { key: "company", label: "Company Info", icon: Building2 },
  { key: "revenue", label: "Revenue & Payments", icon: DollarSign },
  { key: "storage", label: "Storage", icon: HardDrive },
  { key: "admin", label: "Admin User", icon: UserPlus },
  { key: "associations", label: "Associations", icon: Map },
  { key: "folders", label: "Map Folders", icon: FolderOpen },
  { key: "harvest", label: "Data Harvest", icon: Sparkles },
  { key: "review", label: "Review", icon: CheckCircle2 },
] as const;

const BLANK_ASSOC: AssociationEntry = {
  name: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  unit_count: "",
  type: "",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

// ─── Main Wizard Component ──────────────────────────────────────────────────

export function OnboardingWizard({ platformUserId }: WizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Restore from URL params
  const urlTenantId = searchParams.get("tenant_id");
  const urlStep = searchParams.get("step");

  const [tenantId, setTenantId] = useState<string | null>(urlTenantId);
  const [currentStep, setCurrentStep] = useState(
    urlStep ? Math.min(parseInt(urlStep), STEPS.length - 1) : 0
  );
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [showCsvImport, setShowCsvImport] = useState(false);

  const [data, setData] = useState<WizardData>({
    companyName: "",
    slug: "",
    contactEmail: "",
    contactPhone: "",
    primaryColor: "#38b6ff",
    platformFeePercent: "15",
    stripeStatus: "none",
    stripeAccountId: null,
    storageProvider: "none",
    storageConnected: false,
    createAdmin: true,
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminCreated: false,
    associations: [{ ...BLANK_ASSOC }],
  });

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }));
    setStepErrors({});
    setError("");
  }, []);

  // ── URL Sync ──────────────────────────────────────────────────────────────

  function updateUrl(tid: string | null, step: number) {
    const params = new URLSearchParams();
    if (tid) params.set("tenant_id", tid);
    params.set("step", String(step));
    router.replace(`/platform/onboard?${params.toString()}`, { scroll: false });
  }

  // ── Resume from URL tenant_id ─────────────────────────────────────────────

  useEffect(() => {
    if (urlTenantId && !data.companyName) {
      fetchTenantState(urlTenantId);
    }
    // Check for Stripe callback
    if (searchParams.get("stripe_complete") === "true" && urlTenantId) {
      updateData({ stripeStatus: "connected" });
    }
    // Check for Dropbox callback
    if (searchParams.get("dropbox") === "connected" && urlTenantId) {
      updateData({ storageConnected: true, storageProvider: "dropbox" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchTenantState(tid: string) {
    try {
      const res = await fetch(`/api/platform/tenants/${tid}`);
      if (!res.ok) return;
      const { tenant, associations, admins } = await res.json();

      const assocEntries: AssociationEntry[] =
        associations?.length > 0
          ? associations.map((a: Record<string, unknown>) => ({
              id: a.id as string,
              name: (a.name as string) || "",
              address: (a.address as string) || "",
              city: (a.city as string) || "",
              state: (a.state as string) || "",
              zip: (a.zip as string) || "",
              unit_count: a.total_units ? String(a.total_units) : "",
              type: (a.project_type as string) || "",
              dropbox_folder_path: (a.dropbox_folder_path as string) || null,
            }))
          : [{ ...BLANK_ASSOC }];

      setData((prev) => ({
        ...prev,
        companyName: tenant.name || "",
        slug: tenant.slug || "",
        contactEmail: tenant.contact_email || "",
        contactPhone: tenant.contact_phone || "",
        primaryColor: tenant.primary_color || "#38b6ff",
        platformFeePercent: String(tenant.platform_fee_percent ?? 15),
        stripeStatus: tenant.stripe_account_id ? "connected" : "none",
        stripeAccountId: tenant.stripe_account_id || null,
        storageConnected: !!tenant.dropbox_access_token,
        storageProvider: tenant.dropbox_access_token ? "dropbox" : "none",
        adminCreated: (admins?.length || 0) > 0,
        associations: assocEntries,
      }));

      // Determine which step to resume at
      if (urlStep) return; // User explicitly chose a step
      let resumeStep = 0;
      if (tenant.name) resumeStep = 1;
      if (tenant.platform_fee_percent != null) resumeStep = 2;
      if (tenant.dropbox_access_token) resumeStep = 3;
      if ((admins?.length || 0) > 0) resumeStep = 4;
      if (associations?.length > 0) resumeStep = 5;
      setCurrentStep(resumeStep);
    } catch {
      // Ignore — will start fresh
    }
  }

  // ── Step Validation ─────────────────────────────────────────────────────

  function validateStep(step: number): boolean {
    const errs: Record<string, string> = {};

    switch (step) {
      case 0: // Company Info
        if (!data.companyName.trim()) errs.companyName = "Required";
        if (!data.slug.trim()) errs.slug = "Required";
        else if (!/^[a-z0-9-]+$/.test(data.slug))
          errs.slug = "Only lowercase letters, numbers, and hyphens";
        break;

      case 1: // Revenue
        {
          const fee = parseFloat(data.platformFeePercent);
          if (isNaN(fee) || fee < 0 || fee > 100)
            errs.platformFeePercent = "Must be 0–100";
        }
        break;

      case 3: // Admin User
        if (data.createAdmin && !data.adminCreated) {
          if (!data.adminEmail.trim()) errs.adminEmail = "Required";
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail))
            errs.adminEmail = "Invalid email";
          if (!data.adminPassword) errs.adminPassword = "Required";
          else if (data.adminPassword.length < 8)
            errs.adminPassword = "Min 8 characters";
        }
        break;

      case 4: // Associations
        {
          const hasValid = data.associations.some((a) => a.name.trim());
          if (!hasValid) errs.associations = "Add at least one association";
        }
        break;
    }

    setStepErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Step Transitions ────────────────────────────────────────────────────

  async function goNext() {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    setError("");

    try {
      // Step 0 → create or update tenant
      if (currentStep === 0) {
        if (!tenantId) {
          // Create tenant
          const payload: Record<string, unknown> = {
            name: data.companyName.trim(),
            slug: data.slug.trim().toLowerCase(),
            contact_email: data.contactEmail.trim() || null,
            contact_phone: data.contactPhone.trim() || null,
            platform_fee_percent: parseFloat(data.platformFeePercent) || 15,
          };

          const res = await fetch("/api/platform/tenants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const result = await res.json();

          if (!res.ok) {
            setError(result.error || "Failed to create tenant");
            setSaving(false);
            return;
          }

          setTenantId(result.tenant.id);
          updateUrl(result.tenant.id, currentStep + 1);
        } else {
          // Update existing tenant
          await fetch(`/api/platform/tenants/${tenantId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.companyName.trim(),
              slug: data.slug.trim().toLowerCase(),
              contact_email: data.contactEmail.trim() || null,
              contact_phone: data.contactPhone.trim() || null,
              primary_color: data.primaryColor,
            }),
          });
          updateUrl(tenantId, currentStep + 1);
        }
      }

      // Step 1 → update fee + branding
      if (currentStep === 1 && tenantId) {
        await fetch(`/api/platform/tenants/${tenantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.companyName.trim(),
            slug: data.slug.trim().toLowerCase(),
            platform_fee_percent: parseFloat(data.platformFeePercent) || 15,
            primary_color: data.primaryColor,
          }),
        });
        updateUrl(tenantId, currentStep + 1);
      }

      // Step 3 → create admin user if needed
      if (currentStep === 3 && tenantId && data.createAdmin && !data.adminCreated) {
        if (data.adminEmail.trim() && data.adminPassword) {
          const res = await fetch("/api/platform/onboard/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenant_id: tenantId,
              email: data.adminEmail.trim(),
              password: data.adminPassword,
              name: data.adminName.trim() || undefined,
            }),
          });
          if (res.ok) {
            updateData({ adminCreated: true });
          } else {
            const result = await res.json();
            setError(result.error || "Failed to create admin user");
            setSaving(false);
            return;
          }
        }
        updateUrl(tenantId, currentStep + 1);
      }

      // Step 4 → save associations
      if (currentStep === 4 && tenantId) {
        const validAssocs = data.associations.filter((a) => a.name.trim());
        const unsaved = validAssocs.filter((a) => !a.id);

        for (const assoc of unsaved) {
          const res = await fetch("/api/platform/onboard/associations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenant_id: tenantId,
              name: assoc.name.trim(),
              address: assoc.address.trim() || null,
              city: assoc.city.trim() || null,
              state: assoc.state.trim() || null,
              zip: assoc.zip.trim() || null,
              total_units: assoc.unit_count ? parseInt(assoc.unit_count) : null,
              project_type: assoc.type || null,
            }),
          });
          if (res.ok) {
            const result = await res.json();
            assoc.id = result.association.id;
          }
        }

        // Update state with IDs
        updateData({ associations: [...data.associations] });
        updateUrl(tenantId, currentStep + 1);
      }

      // Skip folder mapping step if no storage connected
      let nextStep = currentStep + 1;
      if (nextStep === 5 && !data.storageConnected) {
        nextStep = 6; // Skip to harvest
      }

      setCurrentStep(nextStep);
      if (tenantId) updateUrl(tenantId, nextStep);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    let prevStep = currentStep - 1;
    // Skip folder mapping step backwards if no storage
    if (prevStep === 5 && !data.storageConnected) {
      prevStep = 4;
    }
    setCurrentStep(prevStep);
    if (tenantId) updateUrl(tenantId, prevStep);
  }

  // ── Final Complete ────────────────────────────────────────────────────────

  async function handleComplete() {
    setSubmitting(true);
    setError("");

    try {
      // Final branding update
      if (tenantId) {
        await fetch(`/api/platform/tenants/${tenantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.companyName.trim(),
            slug: data.slug.trim().toLowerCase(),
            primary_color: data.primaryColor,
            platform_fee_percent: parseFloat(data.platformFeePercent) || 15,
          }),
        });
      }

      router.push(`/platform/tenants/${tenantId}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step Renderers ──────────────────────────────────────────────────────

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <StepCompanyInfo
            data={data}
            errors={stepErrors}
            updateData={updateData}
          />
        );
      case 1:
        return (
          <StepRevenue
            data={data}
            errors={stepErrors}
            updateData={updateData}
            tenantId={tenantId}
          />
        );
      case 2:
        return (
          <StepStorage
            data={data}
            updateData={updateData}
            tenantId={tenantId}
          />
        );
      case 3:
        return (
          <StepAdminUser
            data={data}
            errors={stepErrors}
            updateData={updateData}
          />
        );
      case 4:
        return (
          <StepAssociations
            data={data}
            errors={stepErrors}
            updateData={updateData}
            tenantId={tenantId}
            showCsvImport={showCsvImport}
            setShowCsvImport={setShowCsvImport}
          />
        );
      case 5:
        return (
          <StepFolderMapping
            data={data}
            updateData={updateData}
            tenantId={tenantId}
          />
        );
      case 6:
        return <StepHarvest data={data} />;
      case 7:
        return <StepReview data={data} />;
      default:
        return null;
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          return (
            <div key={step.key} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (i < currentStep) {
                    // Skip folder mapping if going back and no storage
                    if (i === 5 && !data.storageConnected) return;
                    setCurrentStep(i);
                    if (tenantId) updateUrl(tenantId, i);
                  }
                }}
                disabled={i > currentStep}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-[#38b6ff] text-white"
                    : isCompleted
                      ? "bg-[#38b6ff]/10 text-[#38b6ff] hover:bg-[#38b6ff]/20 cursor-pointer"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <Icon className="size-3.5" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" />
              )}
            </div>
          );
        })}
      </div>

      {/* Tenant ID indicator */}
      {tenantId && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          Tenant created — changes are saved as you go
        </div>
      )}

      {/* Step Content */}
      {renderStep()}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 0 || saving}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="size-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleComplete}
            disabled={submitting}
            className="bg-[#38b6ff] text-white hover:bg-[#1DA8F0]"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Finishing...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Complete Setup
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Step Components ────────────────────────────────────────────────────────

interface StepProps {
  data: WizardData;
  errors?: Record<string, string>;
  updateData: (updates: Partial<WizardData>) => void;
}

// ── Step 1: Company Info ────────────────────────────────────────────────────

function StepCompanyInfo({ data, errors = {}, updateData }: StepProps) {
  function handleNameChange(value: string) {
    const updates: Partial<WizardData> = { companyName: value };
    if (!data.slug || data.slug === slugify(data.companyName)) {
      updates.slug = slugify(value);
    }
    updateData(updates);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="size-4 text-[#38b6ff]" />
          Company Details
        </CardTitle>
        <CardDescription>
          Basic information about the management company
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={data.companyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleNameChange(e.target.value)
              }
              placeholder="Core HOA Management"
              aria-invalid={!!errors.companyName}
            />
            {errors.companyName && (
              <p className="text-xs text-destructive">{errors.companyName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Subdomain *</Label>
            <div className="flex items-center gap-0">
              <Input
                id="slug"
                value={data.slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData({ slug: slugify(e.target.value) })
                }
                placeholder="corehoa"
                className="rounded-r-none"
                aria-invalid={!!errors.slug}
              />
              <span className="inline-flex h-9 items-center rounded-r-lg border border-l-0 border-border bg-muted px-3 text-xs text-muted-foreground font-data">
                .propertydocz.com
              </span>
            </div>
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={data.contactEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ contactEmail: e.target.value })
              }
              placeholder="admin@corehoa.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={data.contactPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ contactPhone: e.target.value })
              }
              placeholder="(801) 555-0100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryColor">Brand Color</Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={data.primaryColor}
              onChange={(e) => updateData({ primaryColor: e.target.value })}
              className="h-9 w-12 cursor-pointer rounded border border-border"
            />
            <Input
              id="primaryColor"
              value={data.primaryColor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData({ primaryColor: e.target.value })
              }
              placeholder="#38b6ff"
              className="max-w-32 font-data"
            />
            <span className="text-xs text-muted-foreground">
              Used on the public order form
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Step 2: Revenue & Payments ──────────────────────────────────────────────

function StepRevenue({
  data,
  errors = {},
  updateData,
  tenantId,
}: StepProps & { tenantId: string | null }) {
  const [connectingStripe, setConnectingStripe] = useState(false);
  const feeNum = parseFloat(data.platformFeePercent) || 0;
  const tenantKeeps = (100 - feeNum).toFixed(1);

  async function handleStripeConnect() {
    if (!tenantId) return;
    setConnectingStripe(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const result = await res.json();
      if (res.ok && result.url) {
        // Save step context so we can resume
        window.location.href = result.url;
      } else {
        updateData({ stripeStatus: "none" });
      }
    } catch {
      // ignore
    } finally {
      setConnectingStripe(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4 text-[#38b6ff]" />
            Revenue Split
          </CardTitle>
          <CardDescription>
            Set the platform fee percentage for this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="feePercent">Platform Fee Percentage</Label>
            <div className="flex items-center gap-3">
              <Input
                id="feePercent"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={data.platformFeePercent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData({ platformFeePercent: e.target.value })
                }
                className="w-24 font-data"
                aria-invalid={!!errors.platformFeePercent}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            {errors.platformFeePercent && (
              <p className="text-xs text-destructive">
                {errors.platformFeePercent}
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium mb-3">
              For every $100 in document fees:
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  XeedlyAI (Platform)
                </span>
                <span className="font-data font-semibold text-[#38b6ff]">
                  ${feeNum.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Tenant (Management Co.)
                </span>
                <span className="font-data font-semibold text-emerald-600 dark:text-emerald-400">
                  ${tenantKeeps}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Connect */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4 text-[#38b6ff]" />
            Stripe Connect
          </CardTitle>
          <CardDescription>
            Connect a Stripe account so the tenant can receive payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.stripeStatus === "connected" ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              Stripe account connected
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {data.stripeStatus === "pending"
                      ? "Stripe onboarding in progress"
                      : "No Stripe account connected"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {!tenantId
                      ? "Create the tenant first (complete Step 1) to connect Stripe."
                      : "Opens Stripe Express onboarding in a new flow."}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleStripeConnect}
                  disabled={!tenantId || connectingStripe}
                  className="bg-[#38b6ff] hover:bg-[#1DA8F0] text-white"
                >
                  {connectingStripe ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="size-3.5" />
                      Connect Stripe
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="size-3.5 mt-0.5 shrink-0" />
                <span>
                  You can skip this step — Stripe can be connected later. But
                  payment processing won&apos;t work until it&apos;s connected.
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Step 3: Document Storage ────────────────────────────────────────────────

function StepStorage({
  data,
  updateData,
  tenantId,
}: StepProps & { tenantId: string | null }) {
  const [connecting, setConnecting] = useState(false);

  function handleDropboxConnect() {
    if (!tenantId) return;
    setConnecting(true);
    // Redirect to OAuth with tenant_id in state
    // The callback will save tokens to this tenant and redirect back
    window.location.href = `/api/platform/onboard/storage/auth?tenant_id=${tenantId}&return_step=2`;
  }

  const providers = [
    {
      value: "dropbox" as const,
      label: "Dropbox",
      description: "Most popular for HOA document management",
      available: true,
    },
    {
      value: "google_drive" as const,
      label: "Google Drive",
      description: "Coming soon",
      available: false,
    },
    {
      value: "onedrive" as const,
      label: "OneDrive",
      description: "Coming soon",
      available: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HardDrive className="size-4 text-[#38b6ff]" />
          Document Storage
        </CardTitle>
        <CardDescription>
          Connect the tenant&apos;s cloud storage to sync governing documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.storageConnected ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            Dropbox connected successfully
          </div>
        ) : (
          <div className="space-y-2">
            {providers.map((p) => {
              const isSelected = data.storageProvider === p.value;
              return (
                <div
                  key={p.value}
                  className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                    isSelected
                      ? "border-[#38b6ff] bg-[#38b6ff]/5 ring-1 ring-[#38b6ff]/20"
                      : "border-border"
                  } ${!p.available ? "opacity-50" : ""}`}
                >
                  <label
                    className={`flex items-center gap-3 flex-1 ${
                      p.available ? "cursor-pointer" : "cursor-not-allowed"
                    }`}
                  >
                    <input
                      type="radio"
                      name="storageProvider"
                      value={p.value}
                      checked={isSelected}
                      onChange={() => {
                        if (p.available) updateData({ storageProvider: p.value });
                      }}
                      disabled={!p.available}
                      className="size-4 accent-[#38b6ff]"
                    />
                    <div>
                      <span className="text-sm font-medium">{p.label}</span>
                      {!p.available && (
                        <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Coming soon
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                  </label>
                  {p.available && isSelected && (
                    <Button
                      size="sm"
                      onClick={handleDropboxConnect}
                      disabled={!tenantId || connecting}
                      className="bg-[#38b6ff] hover:bg-[#1DA8F0] text-white shrink-0"
                    >
                      {connecting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!data.storageConnected && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            <span>
              {!tenantId
                ? "Create the tenant first (complete Step 1) to connect storage."
                : "You can skip this step and connect storage later from the tenant's Settings page."}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Step 4: Admin User ──────────────────────────────────────────────────────

function StepAdminUser({ data, errors = {}, updateData }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4 text-[#38b6ff]" />
          Admin User
        </CardTitle>
        <CardDescription>
          Create a login for the tenant&apos;s primary administrator.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.adminCreated ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            Admin user created ({data.adminEmail})
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.createAdmin}
                onChange={(e) => updateData({ createAdmin: e.target.checked })}
                className="rounded border-border"
              />
              Create admin user for this tenant
            </label>

            {data.createAdmin && (
              <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Full Name</Label>
                  <Input
                    id="adminName"
                    value={data.adminName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateData({ adminName: e.target.value })
                    }
                    placeholder="John Smith"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={data.adminEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateData({ adminEmail: e.target.value })
                      }
                      placeholder="john@corehoa.com"
                      aria-invalid={!!errors.adminEmail}
                    />
                    {errors.adminEmail && (
                      <p className="text-xs text-destructive">
                        {errors.adminEmail}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Temporary Password *</Label>
                    <Input
                      id="adminPassword"
                      type="text"
                      value={data.adminPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateData({ adminPassword: e.target.value })
                      }
                      placeholder="TempPass123!"
                      aria-invalid={!!errors.adminPassword}
                    />
                    {errors.adminPassword && (
                      <p className="text-xs text-destructive">
                        {errors.adminPassword}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  The admin should change this password after first login.
                </p>
              </div>
            )}
          </>
        )}

        {!data.createAdmin && !data.adminCreated && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            <span>
              You can create admin users later from the tenant detail page.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Step 5: Associations ────────────────────────────────────────────────────

function StepAssociations({
  data,
  errors = {},
  updateData,
  tenantId,
  showCsvImport,
  setShowCsvImport,
}: StepProps & {
  tenantId: string | null;
  showCsvImport: boolean;
  setShowCsvImport: (v: boolean) => void;
}) {
  function addRow() {
    updateData({
      associations: [...data.associations, { ...BLANK_ASSOC }],
    });
  }

  function removeRow(index: number) {
    if (data.associations.length <= 1) return;
    updateData({
      associations: data.associations.filter((_, i) => i !== index),
    });
  }

  function updateRow(
    index: number,
    field: keyof AssociationEntry,
    value: string
  ) {
    const updated = data.associations.map((a, i) =>
      i === index ? { ...a, [field]: value } : a
    );
    updateData({ associations: updated });
  }

  const savedCount = data.associations.filter((a) => a.id).length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="size-4 text-[#38b6ff]" />
            Associations
          </CardTitle>
          <CardDescription>
            Add HOA communities this company manages. You can add more later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CSV import + manual add buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
            >
              <Plus className="size-4" />
              Add Manually
            </Button>
            {tenantId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCsvImport(true)}
              >
                <Upload className="size-4" />
                Import CSV
              </Button>
            )}
          </div>

          {savedCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              {savedCount} association{savedCount !== 1 ? "s" : ""} already
              saved
            </div>
          )}

          {/* Association forms */}
          {data.associations.map((assoc, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {assoc.id ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-emerald-500" />
                      Saved
                    </span>
                  ) : (
                    `New — Association ${i + 1}`
                  )}
                </span>
                {data.associations.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(i)}
                    className="h-7 px-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Name *</Label>
                    <Input
                      value={assoc.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateRow(i, "name", e.target.value)
                      }
                      placeholder="Sunset Ridge HOA"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Address</Label>
                    <Input
                      value={assoc.address}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateRow(i, "address", e.target.value)
                      }
                      placeholder="123 Main Street"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">City</Label>
                    <Input
                      value={assoc.city}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateRow(i, "city", e.target.value)
                      }
                      placeholder="Salt Lake City"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">State</Label>
                    <Input
                      value={assoc.state}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateRow(i, "state", e.target.value)
                      }
                      placeholder="UT"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ZIP</Label>
                    <Input
                      value={assoc.zip}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateRow(i, "zip", e.target.value)
                      }
                      placeholder="84101"
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Units</Label>
                    <Input
                      value={assoc.unit_count}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateRow(i, "unit_count", e.target.value)
                      }
                      placeholder="120"
                      type="number"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <select
                    value={assoc.type}
                    onChange={(e) => updateRow(i, "type", e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors dark:bg-input/30"
                  >
                    <option value="">Select type...</option>
                    <option value="condo">Condo</option>
                    <option value="townhome">Townhome</option>
                    <option value="pud">PUD</option>
                    <option value="co-op">Co-op</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {errors.associations && (
            <p className="text-xs text-destructive">{errors.associations}</p>
          )}
        </CardContent>
      </Card>

      {/* CSV Import Modal */}
      {showCsvImport && tenantId && (
        <WizardCsvImport
          tenantId={tenantId}
          onClose={() => setShowCsvImport(false)}
          onImported={(imported) => {
            const newAssocs = imported.map((a) => ({
              id: a.id,
              name: a.name || "",
              address: a.address || "",
              city: a.city || "",
              state: a.state || "",
              zip: a.zip || "",
              unit_count: a.unit_count || "",
              type: a.type || "",
            }));
            // Merge: keep existing entries, add new imported ones
            const existing = data.associations.filter(
              (a) => a.name.trim() || a.id
            );
            updateData({ associations: [...existing, ...newAssocs] });
            setShowCsvImport(false);
          }}
        />
      )}
    </>
  );
}

// ── Step 6: Map Folders ─────────────────────────────────────────────────────

interface DropboxEntry {
  ".tag": "file" | "folder";
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
}

function StepFolderMapping({
  data,
  updateData,
  tenantId,
}: StepProps & { tenantId: string | null }) {
  const [browsingIndex, setBrowsingIndex] = useState<number | null>(null);
  const [browsePath, setBrowsePath] = useState("/");
  const [entries, setEntries] = useState<DropboxEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [folderError, setFolderError] = useState("");

  const savedAssociations = data.associations.filter((a) => a.id);

  async function loadFolder(path: string) {
    setLoading(true);
    setFolderError("");
    try {
      const url = tenantId
        ? `/api/dropbox/folders?path=${encodeURIComponent(path)}&tenant_id=${tenantId}`
        : `/api/dropbox/folders?path=${encodeURIComponent(path)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to load folders");
      }
      const d = await res.json();
      setEntries(d.entries || []);
      setBrowsePath(path);
    } catch (err) {
      setFolderError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  function startBrowse(index: number) {
    setBrowsingIndex(index);
    const current = savedAssociations[index]?.dropbox_folder_path;
    loadFolder(current || "/");
  }

  async function selectFolder(index: number) {
    const assoc = savedAssociations[index];
    if (!assoc?.id || !tenantId) return;

    // Save to DB
    await fetch(`/api/platform/onboard/associations/${assoc.id}/folder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: tenantId,
        dropbox_folder_path: browsePath,
      }),
    });

    // Update local state
    const updated = data.associations.map((a) =>
      a.id === assoc.id ? { ...a, dropbox_folder_path: browsePath } : a
    );
    updateData({ associations: updated });
    setBrowsingIndex(null);
  }

  async function clearMapping(index: number) {
    const assoc = savedAssociations[index];
    if (!assoc?.id || !tenantId) return;

    await fetch(`/api/platform/onboard/associations/${assoc.id}/folder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: tenantId,
        dropbox_folder_path: null,
      }),
    });

    const updated = data.associations.map((a) =>
      a.id === assoc.id ? { ...a, dropbox_folder_path: null } : a
    );
    updateData({ associations: updated });
  }

  const folders = entries.filter((e) => e[".tag"] === "folder");
  const breadcrumbs =
    browsePath === "/" ? [] : browsePath.split("/").filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderOpen className="size-4 text-[#38b6ff]" />
          Map Folders to Associations
        </CardTitle>
        <CardDescription>
          Link each association to its Dropbox folder for document syncing.
          You can skip any and map them later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedAssociations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No saved associations to map. Go back to add some.
          </p>
        ) : (
          savedAssociations.map((assoc, i) => (
            <div key={assoc.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{assoc.name}</p>
                  {assoc.city && (
                    <p className="text-xs text-muted-foreground">
                      {[assoc.city, assoc.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {browsingIndex === i ? (
                /* Inline folder browser */
                <div className="space-y-3 rounded-lg bg-muted/30 p-3">
                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto">
                    <button
                      onClick={() => loadFolder("/")}
                      className="hover:text-foreground shrink-0"
                    >
                      Dropbox
                    </button>
                    {breadcrumbs.map((crumb, ci) => (
                      <span
                        key={ci}
                        className="flex items-center gap-1 shrink-0"
                      >
                        <ChevronRight className="size-3" />
                        <button
                          onClick={() =>
                            loadFolder(
                              "/" + breadcrumbs.slice(0, ci + 1).join("/")
                            )
                          }
                          className="hover:text-foreground"
                        >
                          {crumb}
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Folder list */}
                  <div className="max-h-48 overflow-y-auto rounded-lg border bg-background">
                    {loading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : folderError ? (
                      <div className="p-3 text-center text-xs text-destructive">
                        {folderError}
                      </div>
                    ) : (
                      <>
                        {browsePath !== "/" && (
                          <button
                            onClick={() => {
                              const parts = browsePath
                                .split("/")
                                .filter(Boolean);
                              parts.pop();
                              loadFolder(
                                parts.length === 0
                                  ? "/"
                                  : "/" + parts.join("/")
                              );
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 border-b"
                          >
                            <ArrowLeft className="size-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Back</span>
                          </button>
                        )}
                        {folders.length === 0 ? (
                          <div className="p-3 text-center text-xs text-muted-foreground">
                            No subfolders
                          </div>
                        ) : (
                          folders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => loadFolder(folder.path_lower)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 border-b last:border-0"
                            >
                              <Folder className="size-3.5 text-[#38b6ff]" />
                              <span className="truncate">{folder.name}</span>
                              <ChevronRight className="size-3 ml-auto text-muted-foreground" />
                            </button>
                          ))
                        )}
                      </>
                    )}
                  </div>

                  {/* Select / Cancel */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground truncate font-data">
                      {browsePath}
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBrowsingIndex(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => selectFolder(i)}
                        className="bg-[#38b6ff] hover:bg-[#1DA8F0] text-white"
                      >
                        <Check className="size-3.5" />
                        Select
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Current mapping display */
                <div className="flex items-center justify-between gap-2">
                  {assoc.dropbox_folder_path ? (
                    <div className="flex items-center gap-2 text-xs">
                      <Folder className="size-3.5 text-[#38b6ff]" />
                      <span className="font-data">
                        {assoc.dropbox_folder_path}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No folder mapped
                    </span>
                  )}
                  <div className="flex gap-2 shrink-0">
                    {assoc.dropbox_folder_path && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => clearMapping(i)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Clear
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startBrowse(i)}
                      className="h-7 text-xs"
                    >
                      <Folder className="size-3" />
                      Browse
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ── Step 7: Data Harvest ────────────────────────────────────────────────────

function StepHarvest({ data }: { data: WizardData }) {
  const hasStorage = data.storageConnected;
  const associationCount = data.associations.filter(
    (a) => a.name.trim()
  ).length;
  const mappedCount = data.associations.filter(
    (a) => a.dropbox_folder_path
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-[#38b6ff]" />
          AI Data Harvest
        </CardTitle>
        <CardDescription>
          After setup, PropertyDocz can scan documents and automatically extract
          association data using AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasStorage && mappedCount > 0 ? (
          <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="text-sm text-emerald-700 dark:text-emerald-300">
                <p className="font-medium">
                  Ready to harvest — {mappedCount} folder
                  {mappedCount !== 1 ? "s" : ""} mapped
                </p>
                <p className="mt-1 text-xs">
                  You can trigger the AI harvest from each association&apos;s
                  detail page after completing setup.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-start gap-2">
              <Info className="size-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium">
                  {!hasStorage
                    ? "No storage connected"
                    : "No folders mapped yet"}
                </p>
                <p className="mt-1 text-xs">
                  {!hasStorage
                    ? "Connect storage and map folders to enable AI harvesting."
                    : "Map Dropbox folders to associations to enable AI harvesting."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border p-4 text-sm space-y-2">
          <p className="font-medium">Harvest pipeline overview:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
            <li>
              Storage connected and folders mapped to associations
            </li>
            <li>
              AI scans documents and categorizes them (CC&Rs, budgets, insurance,
              etc.)
            </li>
            <li>AI extracts key data fields from each document</li>
            <li>Extracted data populates association profiles</li>
            <li>Admin reviews and confirms extracted data</li>
          </ol>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Map className="size-4" />
            <span>
              {associationCount} association
              {associationCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="size-4" />
            <span>{mappedCount} mapped</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="size-4" />
            <span>{hasStorage ? "Dropbox" : "No storage"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Step 8: Review & Complete ───────────────────────────────────────────────

function StepReview({ data }: { data: WizardData }) {
  const validAssociations = data.associations.filter((a) => a.name.trim());
  const mappedCount = validAssociations.filter(
    (a) => a.dropbox_folder_path
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="size-4 text-[#38b6ff]" />
          Review & Complete
        </CardTitle>
        <CardDescription>
          Confirm the details below. Everything has been saved progressively —
          click &quot;Complete Setup&quot; to finish.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Company */}
        <ReviewSection title="Company">
          <ReviewRow label="Name" value={data.companyName || "—"} />
          <ReviewRow
            label="Subdomain"
            value={`${data.slug || "—"}.propertydocz.com`}
            mono
          />
          {data.contactEmail && (
            <ReviewRow label="Email" value={data.contactEmail} mono />
          )}
          {data.contactPhone && (
            <ReviewRow label="Phone" value={data.contactPhone} mono />
          )}
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Brand Color</span>
            <div className="flex items-center gap-2">
              <div
                className="size-4 rounded border"
                style={{ backgroundColor: data.primaryColor }}
              />
              <span className="font-data text-xs">{data.primaryColor}</span>
            </div>
          </div>
        </ReviewSection>

        {/* Revenue & Payments */}
        <ReviewSection title="Revenue & Payments">
          <ReviewRow
            label="Platform Fee"
            value={`${data.platformFeePercent}%`}
            mono
          />
          <ReviewRow
            label="Stripe"
            value={
              data.stripeStatus === "connected"
                ? "Connected ✓"
                : "Not connected"
            }
          />
        </ReviewSection>

        {/* Storage */}
        <ReviewSection title="Storage">
          <ReviewRow
            label="Provider"
            value={
              data.storageConnected
                ? "Dropbox ✓"
                : data.storageProvider === "none"
                  ? "Configure later"
                  : data.storageProvider.replace("_", " ")
            }
          />
        </ReviewSection>

        {/* Admin User */}
        <ReviewSection title="Admin User">
          {data.adminCreated ? (
            <>
              {data.adminName && (
                <ReviewRow label="Name" value={data.adminName} />
              )}
              <ReviewRow label="Email" value={data.adminEmail} mono />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No admin user — will create later
            </p>
          )}
        </ReviewSection>

        {/* Associations */}
        <ReviewSection
          title={`Associations (${validAssociations.length})`}
        >
          {validAssociations.length > 0 ? (
            <div className="space-y-1">
              {validAssociations.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium">{a.name}</span>
                  <div className="flex items-center gap-3">
                    {a.dropbox_folder_path && (
                      <span className="text-[10px] text-muted-foreground font-data">
                        📁 mapped
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-data">
                      {[a.city, a.state].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No associations — will add later
            </p>
          )}
          {mappedCount > 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              {mappedCount} folder{mappedCount !== 1 ? "s" : ""} mapped for
              harvest
            </p>
          )}
        </ReviewSection>
      </CardContent>
    </Card>
  );
}

// ─── Shared review helpers ──────────────────────────────────────────────────

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h4>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${mono ? "font-data" : ""}`}>{value}</span>
    </div>
  );
}

// ─── Wizard CSV Import ──────────────────────────────────────────────────────

interface WizardCsvImportProps {
  tenantId: string;
  onClose: () => void;
  onImported: (
    imported: {
      id: string;
      name: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      unit_count?: string;
      type?: string;
    }[]
  ) => void;
}

function WizardCsvImport({ tenantId, onClose, onImported }: WizardCsvImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<
    {
      name: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      unit_count?: string;
      type?: string;
    }[]
  >([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    setResultMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setParseError("No valid rows found");
          return;
        }
        setRows(parsed);
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Failed to parse CSV"
        );
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    const imported: {
      id: string;
      name: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      unit_count?: string;
      type?: string;
    }[] = [];
    let failed = 0;

    for (const row of rows) {
      try {
        const res = await fetch("/api/platform/onboard/associations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            name: row.name,
            address: row.address || null,
            city: row.city || null,
            state: row.state || null,
            zip: row.zip || null,
            total_units: row.unit_count ? parseInt(row.unit_count) : null,
            project_type: row.type || null,
          }),
        });
        if (res.ok) {
          const result = await res.json();
          imported.push({
            id: result.association.id,
            name: row.name,
            address: row.address,
            city: row.city,
            state: row.state,
            zip: row.zip,
            unit_count: row.unit_count,
            type: row.type,
          });
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    setImporting(false);
    if (imported.length > 0) {
      setResultMsg(
        `Imported ${imported.length}${failed > 0 ? `, ${failed} failed` : ""}`
      );
      setTimeout(() => onImported(imported), 800);
    } else {
      setResultMsg(`All ${failed} rows failed to import.`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="size-4 text-[#38b6ff]" />
            Import Associations from CSV
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Upload a CSV with these columns:</p>
            <code className="block text-xs bg-muted px-2 py-1 rounded">
              name, address, city, state, zip, unit_count, type
            </code>
            <p className="text-xs">
              Only <strong>name</strong> is required. Type: condo, townhome,
              pud, co-op.
            </p>
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4 mr-2" />
              {fileName || "Choose CSV file"}
            </Button>
          </div>

          {parseError && (
            <p className="text-sm text-red-600">{parseError}</p>
          )}

          {rows.length > 0 && !resultMsg && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {rows.length} association{rows.length !== 1 ? "s" : ""} found:
              </p>
              <div className="max-h-48 overflow-auto rounded border">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Name
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium">
                        City
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium">
                        Units
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((row, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">{row.name}</td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          {row.city || "—"}
                        </td>
                        <td className="px-2 py-1.5 text-muted-foreground">
                          {row.unit_count || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                className="w-full bg-[#38b6ff] hover:bg-[#38b6ff]/90"
                disabled={importing}
                onClick={handleImport}
              >
                {importing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="size-4 mr-2" />
                    Import {rows.length} Association
                    {rows.length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          )}

          {resultMsg && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-500" />
              {resultMsg}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── CSV Parser ─────────────────────────────────────────────────────────────

function parseCSV(
  text: string
): {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  unit_count?: string;
  type?: string;
}[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = splitCSVLine(lines[0]).map((h) =>
    h.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_")
  );

  const colMap: Record<string, string> = {};
  for (let i = 0; i < header.length; i++) {
    const h = header[i];
    if (h.includes("name")) colMap.name = String(i);
    else if (h.includes("address") && !h.includes("city"))
      colMap.address = String(i);
    else if (h.includes("city")) colMap.city = String(i);
    else if (h.includes("state")) colMap.state = String(i);
    else if (h.includes("zip") || h.includes("postal"))
      colMap.zip = String(i);
    else if (h.includes("unit") || h.includes("count"))
      colMap.unit_count = String(i);
    else if (h.includes("type")) colMap.type = String(i);
  }

  if (!colMap.name) {
    throw new Error(
      'CSV must have a "name" column. Found: ' + header.join(", ")
    );
  }

  const rows: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    unit_count?: string;
    type?: string;
  }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    const name = values[parseInt(colMap.name)]?.trim();
    if (!name) continue;

    rows.push({
      name,
      address: colMap.address
        ? values[parseInt(colMap.address)]?.trim()
        : undefined,
      city: colMap.city ? values[parseInt(colMap.city)]?.trim() : undefined,
      state: colMap.state ? values[parseInt(colMap.state)]?.trim() : undefined,
      zip: colMap.zip ? values[parseInt(colMap.zip)]?.trim() : undefined,
      unit_count: colMap.unit_count
        ? values[parseInt(colMap.unit_count)]?.trim()
        : undefined,
      type: colMap.type ? values[parseInt(colMap.type)]?.trim() : undefined,
    });
  }

  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map((s) => s.replace(/^"|"$/g, "").trim());
}
