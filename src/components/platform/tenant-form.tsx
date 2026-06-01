"use client";

import { useState } from "react";
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
import { Loader2, CheckCircle2, UserPlus } from "lucide-react";

interface TenantData {
  id?: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  platform_fee_percent: number | null;
  logo_url: string | null;
  primary_color: string | null;
  [key: string]: unknown;
}

interface TenantFormProps {
  tenant: TenantData | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function TenantForm({ tenant }: TenantFormProps) {
  const router = useRouter();
  const isEditing = !!tenant?.id;

  const [name, setName] = useState(tenant?.name || "");
  const [slug, setSlug] = useState(tenant?.slug || "");
  const [contactEmail, setContactEmail] = useState(
    tenant?.contact_email || ""
  );
  const [contactPhone, setContactPhone] = useState(
    tenant?.contact_phone || ""
  );
  const [feePercent, setFeePercent] = useState(
    (tenant?.platform_fee_percent ?? 10).toString()
  );
  const [logoUrl, setLogoUrl] = useState(tenant?.logo_url || "");
  const [primaryColor, setPrimaryColor] = useState(
    tenant?.primary_color || "#38b6ff"
  );

  // Admin user fields (new tenant only)
  const [createAdmin, setCreateAdmin] = useState(!isEditing);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!isEditing && !slug) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Company name is required");
      return;
    }
    if (!slug.trim()) {
      setError("Subdomain slug is required");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (isEditing) {
        const res = await fetch(`/api/platform/tenants/${tenant!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim().toLowerCase(),
            contact_email: contactEmail.trim() || null,
            contact_phone: contactPhone.trim() || null,
            platform_fee_percent: parseFloat(feePercent) || 10,
            logo_url: logoUrl.trim() || null,
            primary_color: primaryColor.trim() || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to update");
          return;
        }

        setSuccess("Tenant updated successfully");
        router.refresh();
      } else {
        const payload: Record<string, unknown> = {
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim() || null,
          platform_fee_percent: parseFloat(feePercent) || 10,
        };

        if (createAdmin && adminEmail.trim() && adminPassword) {
          payload.admin_email = adminEmail.trim();
          payload.admin_password = adminPassword;
          payload.admin_name = adminName.trim() || undefined;
        }

        const res = await fetch("/api/platform/tenants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to create tenant");
          return;
        }

        if (data.warning) {
          setSuccess(data.warning);
        }

        router.push(`/platform/tenants/${data.tenant.id}`);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleNameChange(e.target.value)
                }
                placeholder="Core HOA Management"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Subdomain Slug *</Label>
              <div className="flex items-center gap-0">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSlug(slugify(e.target.value))
                  }
                  placeholder="corehoa"
                  className="rounded-r-none"
                  required
                />
                <span className="inline-flex h-9 items-center rounded-r-lg border border-l-0 border-border bg-muted px-3 text-xs text-muted-foreground font-data">
                  .propertydocz.com
                </span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setContactEmail(e.target.value)
                }
                placeholder="admin@corehoa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setContactPhone(e.target.value)
                }
                placeholder="(801) 555-0100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Split */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Split</CardTitle>
          <CardDescription>
            Platform fee is the percentage XeedlyAI keeps from each transaction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="feePercent">Platform Fee Percentage</Label>
            <div className="flex items-center gap-3">
              <Input
                id="feePercent"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={feePercent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFeePercent(e.target.value)
                }
                className="w-24 font-data"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tenant keeps {(100 - (parseFloat(feePercent) || 0)).toFixed(1)}%
              of each order
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLogoUrl(e.target.value)
                  }
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-border"
                  />
                  <Input
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPrimaryColor(e.target.value)
                    }
                    placeholder="#38b6ff"
                    className="font-data"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin User (new tenant only) */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="size-4 text-[#38b6ff]" />
              Admin User
            </CardTitle>
            <CardDescription>
              Optionally create an admin account for this tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createAdmin}
                onChange={(e) => setCreateAdmin(e.target.checked)}
                className="rounded border-border"
              />
              Create admin user for this tenant
            </label>

            {createAdmin && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Full Name</Label>
                  <Input
                    id="adminName"
                    value={adminName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAdminName(e.target.value)
                    }
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAdminEmail(e.target.value)
                    }
                    placeholder="john@corehoa.com"
                    required={createAdmin}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Temp Password *</Label>
                  <Input
                    id="adminPassword"
                    type="text"
                    value={adminPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAdminPassword(e.target.value)
                    }
                    placeholder="TempPass123!"
                    required={createAdmin}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {isEditing ? "Saving..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Tenant"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/platform/tenants")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
