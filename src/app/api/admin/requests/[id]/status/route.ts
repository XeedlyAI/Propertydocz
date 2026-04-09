import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendAdminNotification, sendDocumentReady } from "@/lib/email/send";
import { createFulfillmentLedgerEntry } from "@/lib/services/fulfillment.service";
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
      .select("id, status, tenant_id, requester_name, requester_email, property_address, document_types, total_price_cents, customer_id, pricing_type")
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

    // Send email notifications for key transitions
    try {
      if (nextStatus === "awaiting_data") {
        // Notify admin that data is needed
        const serviceClient = await createServiceClient();
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
            requestId: id,
            propertyAddress: docRequest.property_address,
            documentTypes: docRequest.document_types as string[],
            reason: "Live data input needed",
          });
        }
      }

      if (nextStatus === "delivered") {
        // Fetch generated documents and create signed download URLs
        const serviceClient = await createServiceClient();
        const { data: generatedDocs } = await serviceClient
          .from("generated_documents")
          .select("document_type, file_url, file_name")
          .eq("document_request_id", id);

        const downloadLinks: { label: string; url: string }[] = [];
        if (generatedDocs && generatedDocs.length > 0) {
          for (const doc of generatedDocs) {
            // Extract storage path from the public URL to create a signed URL
            const publicUrlBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents/`;
            const storagePath = doc.file_url?.startsWith(publicUrlBase)
              ? doc.file_url.slice(publicUrlBase.length)
              : null;

            if (storagePath) {
              const { data: signedData } = await serviceClient.storage
                .from("documents")
                .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

              if (signedData?.signedUrl) {
                const { DOCUMENT_LABELS } = await import("@/lib/pricing");
                const label = DOCUMENT_LABELS[doc.document_type as keyof typeof DOCUMENT_LABELS] || doc.file_name || doc.document_type;
                downloadLinks.push({ label, url: signedData.signedUrl });
              }
            }
          }
        }

        // Get tenant contact for reply-to
        const { data: tenantForReply } = await serviceClient
          .from("tenants")
          .select("contact_email")
          .eq("id", profile.tenant_id)
          .single();

        // Notify requester with download links
        await sendDocumentReady({
          to: docRequest.requester_email,
          requesterName: docRequest.requester_name,
          requestId: id,
          propertyAddress: docRequest.property_address,
          documentTypes: docRequest.document_types as string[],
          downloadLinks,
          replyTo: tenantForReply?.contact_email || undefined,
        });
      }
    } catch (emailErr) {
      console.error("Email notification failed (non-blocking):", emailErr);
    }

    // Create fulfillment ledger entry when delivered
    if (nextStatus === "delivered") {
      try {
        const serviceClient = await createServiceClient();
        await createFulfillmentLedgerEntry(serviceClient, {
          id,
          tenant_id: profile.tenant_id,
          customer_id: docRequest.customer_id || null,
          document_types: docRequest.document_types as string[],
          total_price_cents: docRequest.total_price_cents || 0,
          pricing_type: docRequest.pricing_type || "standard",
        });
      } catch (ledgerErr) {
        console.error("Fulfillment ledger creation failed (non-blocking):", ledgerErr);
      }
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
