import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { upsertFieldValue, confirmFieldValue, bulkConfirmFields } from "@/lib/services/association-data";

/**
 * PUT /api/requests/[id]/fields
 *
 * Update a single field value on a request's live_data.
 * Optionally syncs to association_field_values for Tier 1/2 fields.
 *
 * Body: { field_key, value, confirm? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;

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

    const serviceClient = await createServiceClient();

    // Fetch the request
    const { data: docRequest } = await serviceClient
      .from("document_requests")
      .select("id, association_id, tenant_id, live_data")
      .eq("id", requestId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!docRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const body = await request.json();
    const { field_key, value, confirm } = body;

    if (!field_key) {
      return NextResponse.json({ error: "field_key is required" }, { status: 400 });
    }

    // Update live_data on the request
    const liveData = (docRequest.live_data as Record<string, string>) || {};
    liveData[field_key] = value ?? "";

    await serviceClient
      .from("document_requests")
      .update({ live_data: liveData })
      .eq("id", requestId);

    // If confirm is true, also sync to association_field_values
    if (confirm && value) {
      try {
        await upsertFieldValue(
          docRequest.association_id,
          field_key,
          value,
          "admin_confirmed"
        );
        await confirmFieldValue(docRequest.association_id, field_key, user.id);
      } catch (err) {
        console.error("Field sync to association failed:", err);
        // Non-blocking — live_data is already saved
      }
    }

    return NextResponse.json({ success: true, field_key, value });
  } catch (error) {
    console.error("Field update error:", error);
    return NextResponse.json({ error: "Failed to update field" }, { status: 500 });
  }
}

/**
 * POST /api/requests/[id]/fields
 *
 * Bulk confirm multiple fields as verified.
 *
 * Body: { field_keys: string[] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;

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

    const serviceClient = await createServiceClient();

    const { data: docRequest } = await serviceClient
      .from("document_requests")
      .select("id, association_id, tenant_id")
      .eq("id", requestId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!docRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const body = await request.json();
    const { field_keys } = body;

    if (!Array.isArray(field_keys) || field_keys.length === 0) {
      return NextResponse.json({ error: "field_keys array is required" }, { status: 400 });
    }

    await bulkConfirmFields(docRequest.association_id, field_keys, user.id);

    return NextResponse.json({ success: true, confirmed: field_keys.length });
  } catch (error) {
    console.error("Bulk confirm error:", error);
    return NextResponse.json({ error: "Failed to confirm fields" }, { status: 500 });
  }
}
