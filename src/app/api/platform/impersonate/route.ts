import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "impersonate_tenant_id";

/**
 * POST /api/platform/impersonate
 * Sets the impersonation cookie so a platform admin can view
 * the /admin/* routes as a specific tenant.
 *
 * Body: { tenant_id: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verify the caller is a platform admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "platform_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const tenantId = body.tenant_id;

  if (!tenantId || typeof tenantId !== "string") {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  // Verify the tenant exists
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Set the impersonation cookie (httpOnly, secure, 24h expiry)
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, tenantId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return NextResponse.json({
    success: true,
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
  });
}

/**
 * DELETE /api/platform/impersonate
 * Clears the impersonation cookie.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({ success: true });
}
