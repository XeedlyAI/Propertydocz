import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { upsertFieldValue, confirmFieldValue } from "@/lib/services/association-data";

/**
 * PUT /api/onboarding/field
 * Save or update a field value during onboarding review.
 *
 * Body: { association_id, field_key, value, source }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      !["tenant_admin", "platform_admin"].includes(profile.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { association_id, field_key, value, source } = body;

    if (!association_id || !field_key || value === undefined) {
      return NextResponse.json(
        { error: "association_id, field_key, and value are required" },
        { status: 400 }
      );
    }

    // Verify association belongs to user's tenant
    const serviceClient = await createServiceClient();
    const { data: association } = await serviceClient
      .from("associations")
      .select("id")
      .eq("id", association_id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!association) {
      return NextResponse.json(
        { error: "Association not found" },
        { status: 404 }
      );
    }

    await upsertFieldValue(
      association_id,
      field_key,
      value,
      source || "manual"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Field update error:", error);
    return NextResponse.json(
      { error: "Failed to update field" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/onboarding/field
 * Confirm a single AI-extracted field as verified.
 *
 * Body: { association_id, field_key }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      !["tenant_admin", "platform_admin"].includes(profile.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { association_id, field_key } = body;

    if (!association_id || !field_key) {
      return NextResponse.json(
        { error: "association_id and field_key are required" },
        { status: 400 }
      );
    }

    // Verify association belongs to user's tenant
    const serviceClient = await createServiceClient();
    const { data: association } = await serviceClient
      .from("associations")
      .select("id")
      .eq("id", association_id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!association) {
      return NextResponse.json(
        { error: "Association not found" },
        { status: 404 }
      );
    }

    await confirmFieldValue(association_id, field_key, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Field confirm error:", error);
    return NextResponse.json(
      { error: "Failed to confirm field" },
      { status: 500 }
    );
  }
}
