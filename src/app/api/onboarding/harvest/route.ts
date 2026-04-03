import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { harvestAssociationData } from "@/lib/services/onboarding-harvest";

/**
 * POST /api/onboarding/harvest
 *
 * Triggers the onboarding data harvest for an association.
 * Scans the association's Dropbox folder, categorizes documents,
 * extracts data via Claude API, and populates field values.
 *
 * Body: { association_id: string }
 * Auth: tenant_admin or platform_admin
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile with role
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

    // Parse body
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
      .select("id, name, tenant_id, dropbox_folder_path, onboarding_status")
      .eq("id", association_id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!association) {
      return NextResponse.json(
        { error: "Association not found or not in your tenant" },
        { status: 404 }
      );
    }

    if (!association.dropbox_folder_path) {
      return NextResponse.json(
        { error: "No Dropbox folder mapped for this association. Map a folder first." },
        { status: 400 }
      );
    }

    if (association.onboarding_status === "harvesting") {
      return NextResponse.json(
        { error: "Harvest already in progress for this association" },
        { status: 409 }
      );
    }

    // Run harvest
    const report = await harvestAssociationData(
      association_id,
      profile.tenant_id
    );

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Harvest API error:", error);
    return NextResponse.json(
      {
        error: "Harvest failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
