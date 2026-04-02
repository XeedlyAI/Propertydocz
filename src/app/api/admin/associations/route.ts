import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    if (!profile || !["tenant_admin", "platform_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Ensure tenant_id matches user's tenant
    if (body.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Association name is required" },
        { status: 400 }
      );
    }

    const { data: association, error: insertError } = await supabase
      .from("associations")
      .insert(body)
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create association:", insertError);
      return NextResponse.json(
        { error: "Failed to create association" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: association.id });
  } catch (error) {
    console.error("Create association error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
