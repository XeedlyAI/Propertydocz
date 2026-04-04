import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Verify the current user is a platform_admin.
 */
async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "platform_admin") return null;
  return { userId: user.id };
}

/**
 * POST /api/platform/onboard/admin
 * Create an admin user for a tenant during onboarding.
 * Platform admin only.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { tenant_id, email, password, name } = body;

    if (!tenant_id || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "tenant_id, email, and password are required" },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceClient();

    // Verify tenant exists
    const { data: tenant } = await serviceClient
      .from("tenants")
      .select("id")
      .eq("id", tenant_id)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Create auth user
    const { data: authUser, error: authError } =
      await serviceClient.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
      });

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Create profile
    const { error: profileError } = await serviceClient
      .from("profiles")
      .insert({
        id: authUser.user.id,
        tenant_id,
        full_name: name?.trim() || email.trim(),
        email: email.trim(),
        role: "tenant_admin",
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        { error: "User created but profile failed: " + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: authUser.user.id,
          email: email.trim(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Onboard admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
