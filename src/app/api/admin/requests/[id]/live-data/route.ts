import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile for tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify request belongs to tenant and is in awaiting_data status
    const { data: docRequest } = await supabase
      .from("document_requests")
      .select("id, status, tenant_id")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!docRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      docRequest.status !== "awaiting_data" &&
      docRequest.status !== "ready_for_generation"
    ) {
      return NextResponse.json(
        { error: "Request is not in a data-entry status" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const liveData = body.live_data;

    if (!liveData || typeof liveData !== "object") {
      return NextResponse.json(
        { error: "Invalid live_data" },
        { status: 400 }
      );
    }

    // Update live_data and advance status
    const { error: updateError } = await supabase
      .from("document_requests")
      .update({
        live_data: liveData,
        status: "ready_for_generation",
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update live data:", updateError);
      return NextResponse.json(
        { error: "Failed to save data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Live data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
