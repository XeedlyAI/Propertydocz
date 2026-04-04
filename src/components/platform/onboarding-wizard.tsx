"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Info,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WizardProps {
  platformUserId: string;
}

interface AssociationEntry {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface WizardData {
  // Step 1: Company Info
  companyName: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  primaryColor: string;

  // Step 2: Revenue Config
  platformFeePercent: string;

  // Step 3: Storage — deferred (OAuth redirect needed)
  storageProvider: "dropbox" | "google_drive" | "onedrive" | "none";

  // Step 4: Admin User
  createAdmin: boolean;
  adminName: string;
  adminEmail: string;
  adminPassword: string;

  // Step 5: Associations
  associations: AssociationEntry[];
}

// ─── Steps ──────────────────────────────────────────────────────────────────

const STEPS = [
  { key: "company", label: "Company Info", icon: Building2 },
  { key: "revenue", label: "Revenue", icon: DollarSign },
  { key: "storage", label: "Storage", icon: HardDrive },
  { key: "admin", label: "Admin User", icon: UserPlus },
  { key: "associations", label: "Associations", icon: Map },
  { key: "harvest", label: "Data Harvest", icon: Sparkles },
  { key: "review", label: "Review", icon: CheckCircle2 },
] as const;

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
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [data, setData] = useState<WizardData>({
    companyName: "",
    slug: "",
    contactEmail: "",
    contactPhone: "",
    primaryColor: "#38b6ff",
    platformFeePercent: "15",
    storageProvider: "none",
    createAdmin: true,
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    associations: [{ name: "", address: "", city: "", state: "", zip: "" }],
  });

  const updateData = useCallback(
    (updates: Partial<WizardData>) => {
      setData((prev) => ({ ...prev, ...updates }));
      setStepErrors({});
      setError("");
    },
    []
  );

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
        if (data.createAdmin) {
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

  function goNext() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  // ── Submit (Create Everything) ──────────────────────────────────────────

  async function handleComplete() {
    setSubmitting(true);
    setError("");

    try {
      // 1. Create tenant + admin user
      const tenantPayload: Record<string, unknown> = {
        name: data.companyName.trim(),
        slug: data.slug.trim().toLowerCase(),
        contact_email: data.contactEmail.trim() || null,
        contact_phone: data.contactPhone.trim() || null,
        platform_fee_percent: parseFloat(data.platformFeePercent) || 15,
      };

      if (data.createAdmin && data.adminEmail.trim() && data.adminPassword) {
        tenantPayload.admin_email = data.adminEmail.trim();
        tenantPayload.admin_password = data.adminPassword;
        tenantPayload.admin_name = data.adminName.trim() || undefined;
      }

      const tenantRes = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenantPayload),
      });

      const tenantData = await tenantRes.json();

      if (!tenantRes.ok) {
        setError(tenantData.error || "Failed to create tenant");
        setSubmitting(false);
        return;
      }

      const tenantId = tenantData.tenant.id;
      setCreatedTenantId(tenantId);

      // 2. Update branding (primary_color) if non-default
      if (data.primaryColor && data.primaryColor !== "#38b6ff") {
        await fetch(`/api/platform/tenants/${tenantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.companyName.trim(),
            slug: data.slug.trim().toLowerCase(),
            primary_color: data.primaryColor,
          }),
        });
      }

      // 3. Create associations
      const validAssociations = data.associations.filter((a) =>
        a.name.trim()
      );

      for (const assoc of validAssociations) {
        await fetch("/api/platform/onboard/associations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            name: assoc.name.trim(),
            address: assoc.address.trim() || null,
            city: assoc.city.trim() || null,
            state: assoc.state.trim() || null,
            zip: assoc.zip.trim() || null,
          }),
        });
      }

      // Done — redirect to the tenant detail page
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
        return <StepCompanyInfo data={data} errors={stepErrors} updateData={updateData} />;
      case 1:
        return <StepRevenue data={data} errors={stepErrors} updateData={updateData} />;
      case 2:
        return <StepStorage data={data} updateData={updateData} />;
      case 3:
        return <StepAdminUser data={data} errors={stepErrors} updateData={updateData} />;
      case 4:
        return <StepAssociations data={data} errors={stepErrors} updateData={updateData} />;
      case 5:
        return <StepHarvest data={data} />;
      case 6:
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
                  if (i < currentStep) setCurrentStep(i);
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
                <Icon className="size-3.5" />
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
          disabled={currentStep === 0}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext}>
            Next
            <ChevronRight className="size-4" />
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
                Creating Tenant...
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

/** Step 1: Company Info */
function StepCompanyInfo({ data, errors = {}, updateData }: StepProps) {
  function handleNameChange(value: string) {
    const updates: Partial<WizardData> = { companyName: value };
    // Auto-generate slug from name if slug hasn't been manually edited
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

/** Step 2: Revenue Config */
function StepRevenue({ data, errors = {}, updateData }: StepProps) {
  const feeNum = parseFloat(data.platformFeePercent) || 0;
  const tenantKeeps = (100 - feeNum).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="size-4 text-[#38b6ff]" />
          Revenue Split
        </CardTitle>
        <CardDescription>
          Set the platform fee percentage. This is the cut XeedlyAI keeps from
          each transaction.
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

        {/* Visual breakdown */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium mb-3">
            For every $100 in document fees:
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">XeedlyAI (Platform)</span>
              <span className="font-data font-semibold text-[#38b6ff]">
                ${feeNum.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tenant (Management Co.)</span>
              <span className="font-data font-semibold text-emerald-600 dark:text-emerald-400">
                ${tenantKeeps}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          <span>
            Document prices are set globally. The fee percentage only affects how
            revenue is split between the platform and the tenant.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Step 3: Document Storage */
function StepStorage({ data, updateData }: StepProps) {
  const providers = [
    { value: "dropbox" as const, label: "Dropbox", description: "Most common for HOA managers" },
    { value: "google_drive" as const, label: "Google Drive", description: "Coming soon" },
    { value: "onedrive" as const, label: "OneDrive", description: "Coming soon" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HardDrive className="size-4 text-[#38b6ff]" />
          Document Storage
        </CardTitle>
        <CardDescription>
          Where does this company store their HOA documents? The tenant admin
          will connect their account from their Settings page after setup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {providers.map((p) => {
            const isSelected = data.storageProvider === p.value;
            const isAvailable = p.value === "dropbox";
            return (
              <label
                key={p.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
                  isSelected
                    ? "border-[#38b6ff] bg-[#38b6ff]/5 ring-1 ring-[#38b6ff]/20"
                    : "border-border hover:bg-muted/50"
                } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="radio"
                  name="storageProvider"
                  value={p.value}
                  checked={isSelected}
                  onChange={() => {
                    if (isAvailable) updateData({ storageProvider: p.value });
                  }}
                  disabled={!isAvailable}
                  className="size-4 accent-[#38b6ff]"
                />
                <div>
                  <span className="text-sm font-medium">{p.label}</span>
                  <p className="text-xs text-muted-foreground">
                    {p.description}
                  </p>
                </div>
              </label>
            );
          })}

          <label
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all ${
              data.storageProvider === "none"
                ? "border-[#38b6ff] bg-[#38b6ff]/5 ring-1 ring-[#38b6ff]/20"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <input
              type="radio"
              name="storageProvider"
              value="none"
              checked={data.storageProvider === "none"}
              onChange={() => updateData({ storageProvider: "none" })}
              className="size-4 accent-[#38b6ff]"
            />
            <div>
              <span className="text-sm font-medium">Skip for now</span>
              <p className="text-xs text-muted-foreground">
                Connect storage later from the tenant&apos;s Settings page
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
          <Info className="size-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Storage connection requires OAuth authorization. The tenant admin
            will need to connect their {data.storageProvider === "none" ? "storage" : data.storageProvider === "dropbox" ? "Dropbox" : "storage"} account
            from <strong>Settings → Document Storage</strong> after their
            account is created.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Step 4: Admin User */
function StepAdminUser({ data, errors = {}, updateData }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4 text-[#38b6ff]" />
          Admin User
        </CardTitle>
        <CardDescription>
          Create a login for the tenant&apos;s primary administrator. They will
          use this to access the admin dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {!data.createAdmin && (
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

/** Step 5: Associations */
function StepAssociations({ data, errors = {}, updateData }: StepProps) {
  function addRow() {
    updateData({
      associations: [
        ...data.associations,
        { name: "", address: "", city: "", state: "", zip: "" },
      ],
    });
  }

  function removeRow(index: number) {
    if (data.associations.length <= 1) return;
    updateData({
      associations: data.associations.filter((_, i) => i !== index),
    });
  }

  function updateRow(index: number, field: keyof AssociationEntry, value: string) {
    const updated = data.associations.map((a, i) =>
      i === index ? { ...a, [field]: value } : a
    );
    updateData({ associations: updated });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Map className="size-4 text-[#38b6ff]" />
          Associations
        </CardTitle>
        <CardDescription>
          Add the HOA communities this company manages. You can add more later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.associations.map((assoc, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Association {i + 1}
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
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
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
              </div>
            </div>
          </div>
        ))}

        {errors.associations && (
          <p className="text-xs text-destructive">{errors.associations}</p>
        )}

        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="size-4" />
          Add Association
        </Button>
      </CardContent>
    </Card>
  );
}

/** Step 6: Data Harvest */
function StepHarvest({ data }: { data: WizardData }) {
  const hasStorage = data.storageProvider !== "none";
  const associationCount = data.associations.filter((a) => a.name.trim()).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-[#38b6ff]" />
          AI Data Harvest
        </CardTitle>
        <CardDescription>
          After setup, PropertyDocz can scan the tenant&apos;s documents and
          automatically extract association data using AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasStorage ? (
          <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 p-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="text-sm text-emerald-700 dark:text-emerald-300">
                <p className="font-medium">Storage provider selected: Dropbox</p>
                <p className="mt-1 text-xs">
                  Once the tenant admin connects their Dropbox account and maps
                  folders to associations, you can trigger the AI harvest from
                  each association&apos;s detail page.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-start gap-2">
              <Info className="size-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium">No storage provider selected</p>
                <p className="mt-1 text-xs">
                  The AI harvest requires a connected storage provider. The
                  tenant admin can connect Dropbox from their Settings page, then
                  trigger the harvest from each association.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border p-4 text-sm space-y-2">
          <p className="font-medium">Harvest pipeline overview:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
            <li>Tenant admin connects storage and maps folders to associations</li>
            <li>AI scans documents and categorizes them (CC&Rs, budgets, insurance, etc.)</li>
            <li>AI extracts key data fields from each document</li>
            <li>Extracted data populates association profiles</li>
            <li>Admin reviews and confirms extracted data</li>
          </ol>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Map className="size-4" />
            <span>{associationCount} association{associationCount !== 1 ? "s" : ""} to onboard</span>
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

/** Step 7: Review & Complete */
function StepReview({ data }: { data: WizardData }) {
  const validAssociations = data.associations.filter((a) => a.name.trim());

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-4 text-[#38b6ff]" />
            Review & Complete
          </CardTitle>
          <CardDescription>
            Confirm the details below and click &quot;Complete Setup&quot; to
            create the tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Company
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{data.companyName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subdomain</span>
                <span className="font-data font-medium">
                  {data.slug || "—"}.propertydocz.com
                </span>
              </div>
              {data.contactEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-data">{data.contactEmail}</span>
                </div>
              )}
              {data.contactPhone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-data">{data.contactPhone}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Brand Color</span>
                <div className="flex items-center gap-2">
                  <div
                    className="size-4 rounded border"
                    style={{ backgroundColor: data.primaryColor }}
                  />
                  <span className="font-data text-xs">{data.primaryColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Revenue
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee</span>
              <span className="font-data font-medium">
                {data.platformFeePercent}%
              </span>
            </div>
          </div>

          {/* Storage */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Storage
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium capitalize">
                {data.storageProvider === "none"
                  ? "Configure later"
                  : data.storageProvider.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Admin User */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Admin User
            </h4>
            {data.createAdmin ? (
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">
                    {data.adminName || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-data">{data.adminEmail}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No admin user — will create later
              </p>
            )}
          </div>

          {/* Associations */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Associations ({validAssociations.length})
            </h4>
            {validAssociations.length > 0 ? (
              <div className="space-y-1">
                {validAssociations.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-xs text-muted-foreground font-data">
                      {[a.city, a.state].filter(Boolean).join(", ") || "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No associations — will add later
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
