import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { bulkConfirmFields } from "@/lib/services/association-data";

/**
 * POST /api/onboarding/complete
 * Confirm all AI-extracted fields as verified and set onboarding_status to 'complete'.
 *
 * Body: { association_id: string }
 */
export async function POST(request: NextRequest) {
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
    const { association_id } = body;

    if (!association_id) {
      return NextResponse.json(
        { error: "association_id is required" },
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

    // Get all AI-extracted fields that haven't been verified yet
    const { data: unverified } = await serviceClient
      .from("association_field_values")
      .select("field_key")
      .eq("association_id", association_id)
      .neq("confidence", "verified")
      .not("value", "is", null);

    if (unverified && unverified.length > 0) {
      const fieldKeys = unverified.map((v) => v.field_key);
      await bulkConfirmFields(association_id, fieldKeys, user.id);
    }

    // Set onboarding_status to 'complete'
    await serviceClient
      .from("associations")
      .update({ onboarding_status: "complete" })
      .eq("id", association_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
