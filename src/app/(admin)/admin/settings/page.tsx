import { getAdminUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings } from "lucide-react";
import { StorageStatus } from "@/components/admin/storage-status";
import { SignatureUpload } from "@/components/admin/signature-upload";
import { StripeConnectStatus } from "@/components/admin/stripe-connect-status";
import { TenantLogoUpload } from "@/components/admin/tenant-logo-upload";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ dropbox?: string; stripe?: string }>;
}) {
  const user = await getAdminUser();
  const params = await searchParams;

  // Check if Dropbox is connected for this tenant
  const serviceClient = await createServiceClient();
  const { data: tenant } = await serviceClient
    .from("tenants")
    .select("dropbox_access_token, dropbox_refresh_token, signature_image_url, signature_font_style, stripe_account_id, logo_url")
    .eq("id", user.tenantId)
    .single();

  const isDropboxConnected = !!(
    tenant?.dropbox_access_token && tenant?.dropbox_refresh_token
  );

  // Map query param to status
  const dropboxStatus =
    params.dropbox === "connected"
      ? ("connected" as const)
      : params.dropbox === "denied"
        ? ("denied" as const)
        : params.dropbox === "error"
          ? ("error" as const)
          : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and tenant configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user.fullName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Email</span>
            <span className="font-data font-medium text-sm">{user.email}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Role</span>
            <span className="inline-flex items-center rounded-full bg-[#38b6ff]/10 px-2 py-0.5 text-xs font-medium text-[#38b6ff] capitalize">
              {user.role.replace("_", " ")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Company</span>
            <span className="font-medium">{user.tenantName}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Subdomain</span>
            <span className="font-data font-medium text-sm">
              {user.tenantSlug}.propertydocz.com
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Company Logo */}
      <TenantLogoUpload
        tenantId={user.tenantId}
        currentLogoUrl={tenant?.logo_url || null}
      />

      {/* Signature Upload */}
      <SignatureUpload
        tenantId={user.tenantId}
        currentSignatureUrl={
          tenant?.signature_image_url
            ? serviceClient.storage
                .from("signatures")
                .getPublicUrl(tenant.signature_image_url).data.publicUrl
            : null
        }
        currentFontStyle={tenant?.signature_font_style || null}
      />

      {/* Document Storage */}
      <StorageStatus
        connectedProvider={isDropboxConnected ? "dropbox" : null}
        isDropboxConnected={isDropboxConnected}
        dropboxStatus={dropboxStatus}
      />

      {/* Stripe Connect */}
      <StripeConnectStatus
        isConnected={!!tenant?.stripe_account_id}
        stripeAccountId={tenant?.stripe_account_id || null}
        status={params.stripe === "connected" ? "connected" : null}
      />

      <Card>
        <CardContent className="py-6 text-center">
          <Settings className="mx-auto size-8 text-muted-foreground/50" />
          <p className="mt-2 text-xs text-muted-foreground">
            Email templates and branding options coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
