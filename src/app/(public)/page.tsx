import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { getTenantSlugFromHost } from "@/lib/tenant";
import { OrderForm } from "@/components/forms/order-form";
import { FileText } from "lucide-react";

export default async function OrderPage() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const tenantSlug = getTenantSlugFromHost(host);

  // No tenant subdomain — show the main site landing
  if (!tenantSlug) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold tracking-tight">PropertyDocz</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          HOA Document Ordering &amp; Fulfillment Platform
        </p>
      </main>
    );
  }

  const supabase = await createServiceClient();

  // Fetch tenant by slug
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug, logo_url, primary_color, contact_email, contact_phone")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
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

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <FileText className="size-6 text-primary" />
        </div>
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
      />
    </main>
  );
}
