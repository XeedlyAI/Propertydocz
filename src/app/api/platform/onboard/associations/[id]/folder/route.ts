import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * PUT /api/platform/onboard/associations/[id]/folder
 * Update the dropbox_folder_path for an association during onboarding.
 * Platform admin only.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
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

    if (profile?.role !== "platform_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { tenant_id, dropbox_folder_path } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { error: "tenant_id is required" },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceClient();

    // Verify association belongs to tenant
    const { data: assoc } = await serviceClient
      .from("associations")
      .select("id, tenant_id")
      .eq("id", id)
      .single();

    if (!assoc || assoc.tenant_id !== tenant_id) {
      return NextResponse.json(
        { error: "Association not found" },
        { status: 404 }
      );
    }

    const { error: updateError } = await serviceClient
      .from("associations")
      .update({ dropbox_folder_path: dropbox_folder_path || null })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update folder path:", updateError);
      return NextResponse.json(
        { error: "Failed to update" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Folder mapping error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
