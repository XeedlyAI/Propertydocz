import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface AdminUser {
  id: string;
  email: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  fullName: string;
  role: string;
  /** True when a platform admin is viewing this tenant via impersonation */
  isImpersonating: boolean;
}

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string;
  role: "platform_admin";
}

/**
 * Get the current authenticated admin user with their tenant info.
 *
 * For platform admins: checks the `impersonate_tenant_id` cookie first.
 * If set, loads that tenant instead of the user's own tenant_id.
 *
 * Redirects to /login if not authenticated or missing profile.
 */
export async function getAdminUser(): Promise<AdminUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, tenant_id, tenants(id, name, slug)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // Platform admins can impersonate any tenant via cookie
  const isPlatformAdmin = profile.role === "platform_admin";
  let isImpersonating = false;

  if (isPlatformAdmin) {
    const cookieStore = await cookies();
    const impersonateTenantId = cookieStore.get("impersonate_tenant_id")?.value;

    if (impersonateTenantId) {
      // Load the impersonated tenant directly
      const { data: impersonatedTenant } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("id", impersonateTenantId)
        .single();

      if (impersonatedTenant) {
        return {
          id: profile.id,
          email: user.email || "",
          tenantId: impersonatedTenant.id,
          tenantName: impersonatedTenant.name,
          tenantSlug: impersonatedTenant.slug,
          fullName: profile.full_name,
          role: profile.role,
          isImpersonating: true,
        };
      }
      // If impersonated tenant not found, fall through to normal flow
    }
  }

  // Regular flow: use the user's own tenant
  if (!profile.tenant_id) {
    redirect("/login");
  }

  // Supabase returns joined data; handle both array and object forms
  const tenant = Array.isArray(profile.tenants)
    ? profile.tenants[0]
    : profile.tenants;

  if (!tenant) {
    redirect("/login");
  }

  return {
    id: profile.id,
    email: user.email || "",
    tenantId: profile.tenant_id,
    tenantName: (tenant as { id: string; name: string; slug: string }).name,
    tenantSlug: (tenant as { id: string; name: string; slug: string }).slug,
    fullName: profile.full_name,
    role: profile.role,
    isImpersonating,
  };
}

/**
 * Get the current authenticated platform admin user.
 * Redirects non-platform-admins to /admin/dashboard and
 * unauthenticated users to /login.
 */
export async function getPlatformUser(): Promise<PlatformUser> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "platform_admin") {
    redirect("/admin/dashboard");
  }

  return {
    id: profile.id,
    email: user.email || "",
    fullName: profile.full_name,
    role: "platform_admin",
  };
}
