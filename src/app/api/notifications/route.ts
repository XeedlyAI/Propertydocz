import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendAdminNotification, sendDocumentReady } from "@/lib/email/send";

/**
 * POST /api/notifications
 * Send email notifications. Used for manual sends from admin.
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

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, request_id } = body;

    if (!request_id || !type) {
      return NextResponse.json(
        { error: "Missing type or request_id" },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceClient();
    const { data: docRequest } = await serviceClient
      .from("document_requests")
      .select("id, requester_name, requester_email, property_address, document_types, tenant_id")
      .eq("id", request_id)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (!docRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (type === "document_ready") {
      await sendDocumentReady({
        to: docRequest.requester_email,
        requesterName: docRequest.requester_name,
        requestId: request_id,
        propertyAddress: docRequest.property_address,
        documentTypes: docRequest.document_types as string[],
      });
    } else if (type === "admin_notification") {
      const { data: tenant } = await serviceClient
        .from("tenants")
        .select("contact_email, name")
        .eq("id", profile.tenant_id)
        .single();

      if (tenant?.contact_email) {
        await sendAdminNotification({
          to: tenant.contact_email,
          tenantName: tenant.name,
          requesterName: docRequest.requester_name,
          requestId: request_id,
          propertyAddress: docRequest.property_address,
          documentTypes: docRequest.document_types as string[],
          reason: body.reason || "Requires attention",
        });
      }
    } else {
      return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
