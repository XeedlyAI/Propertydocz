import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface AdminUser {
  id: string;
  email: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  fullName: string;
  role: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string;
  role: "platform_admin";
}

/**
 * Get the current authenticated admin user with their tenant info.
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

  if (!profile || !profile.tenant_id) {
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
