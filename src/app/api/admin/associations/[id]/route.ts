import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || !["tenant_admin", "platform_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify association belongs to tenant
    const { data: existing } = await supabase
      .from("associations")
      .select("id")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();

    // Don't allow changing tenant_id
    delete body.tenant_id;
    delete body.id;

    const { error: updateError } = await supabase
      .from("associations")
      .update(body)
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update association:", updateError);
      return NextResponse.json(
        { error: "Failed to update association" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update association error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
