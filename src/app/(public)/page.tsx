import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { getTenantSlugFromHost } from "@/lib/tenant";
import { OrderForm } from "@/components/forms/order-form";
import { FileStack } from "lucide-react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { HomePage } from "@/components/marketing/home-page";

export default async function PublicPage() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const tenantSlug = getTenantSlugFromHost(host);

  // No tenant subdomain — show the marketing site
  if (!tenantSlug) {
    return (
      <MarketingLayout>
        <HomePage />
      </MarketingLayout>
    );
  }

  const supabase = await createServiceClient();

  // Fetch tenant by slug
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select(
      "id, name, slug, logo_url, primary_color, contact_email, contact_phone"
    )
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
        <h1 className="text-2xl font-bold">Portal Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          The portal &ldquo;{tenantSlug}&rdquo; does not exist. Please check the
          URL and try again.
        </p>
      </main>
    );
  }

  // Fetch associations for this tenant
  const { data: associations } = await supabase
    .from("associations")
    .select("id, name, address, city, state, zip")
    .eq("tenant_id", tenant.id)
    .order("name");

  // Use tenant brand color or default blue
  const brandColor = tenant.primary_color || "#38b6ff";

  return (
    <main
      className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12"
      style={{ "--brand-color": brandColor } as React.CSSProperties}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        {tenant.logo_url ? (
          <div className="mx-auto mb-4 flex h-16 items-center justify-center">
            <img
              src={tenant.logo_url}
              alt={`${tenant.name} logo`}
              className="h-12 w-auto max-w-[200px] object-contain sm:h-16"
            />
          </div>
        ) : (
          <div
            className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <FileStack className="size-6" style={{ color: brandColor }} />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {tenant.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Order HOA documents for your property transaction
        </p>
      </div>

      <OrderForm
        tenantId={tenant.id}
        tenantName={tenant.name}
        associations={associations || []}
        brandColor={brandColor}
      />
    </main>
  );
}
