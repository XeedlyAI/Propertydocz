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
 * POST /api/platform/onboard/associations
 * Create an association for any tenant (platform admin only).
 * Used by the onboarding wizard.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { tenant_id, name, address, city, state, zip } = body;

    if (!tenant_id || !name?.trim()) {
      return NextResponse.json(
        { error: "tenant_id and name are required" },
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

    const { data: association, error: insertError } = await serviceClient
      .from("associations")
      .insert({
        tenant_id,
        name: name.trim(),
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
      })
      .select("id, name")
      .single();

    if (insertError) {
      console.error("Failed to create association:", insertError);
      return NextResponse.json(
        { error: "Failed to create association" },
        { status: 500 }
      );
    }

    return NextResponse.json({ association }, { status: 201 });
  } catch (error) {
    console.error("Onboard association error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
