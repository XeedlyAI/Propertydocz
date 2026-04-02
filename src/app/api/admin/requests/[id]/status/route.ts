import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RequestStatus } from "@/lib/types";

// Valid status transitions
const VALID_TRANSITIONS: Record<string, RequestStatus[]> = {
  received: ["paid", "cancelled"],
  paid: ["awaiting_data", "cancelled"],
  awaiting_data: ["ready_for_generation", "cancelled"],
  ready_for_generation: ["pending_review", "cancelled"],
  pending_review: ["approved", "awaiting_data", "cancelled"],
  approved: ["delivered"],
};

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

    // Verify request belongs to tenant
    const { data: docRequest } = await supabase
      .from("document_requests")
      .select("id, status, tenant_id")
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!docRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const nextStatus = body.status as RequestStatus;

    // Validate transition
    const allowedTransitions = VALID_TRANSITIONS[docRequest.status];
    if (!allowedTransitions || !allowedTransitions.includes(nextStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${docRequest.status} to ${nextStatus}`,
        },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = { status: nextStatus };

    if (nextStatus === "approved") {
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
    }

    if (nextStatus === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("document_requests")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update status:", updateError);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
