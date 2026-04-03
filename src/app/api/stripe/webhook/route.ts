import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email/send";

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for payment confirmations.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not set");
      return NextResponse.json({ received: true });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid signature";
      console.error("Webhook signature verification failed:", msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const serviceClient = await createServiceClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const requestId = session.metadata?.request_id;

        if (!requestId) break;

        // Update payment status and advance workflow
        const { data: docRequest } = await serviceClient
          .from("document_requests")
          .select("id, status, tenant_id, requester_name, requester_email, document_types, total_price_cents, property_address")
          .eq("id", requestId)
          .single();

        if (docRequest) {
          await serviceClient
            .from("document_requests")
            .update({
              payment_status: "paid",
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : null,
              status:
                docRequest.status === "received" ? "awaiting_data" : docRequest.status,
            })
            .eq("id", requestId);

          // Send confirmation email to requester
          try {
            await sendOrderConfirmation({
              to: docRequest.requester_email,
              requesterName: docRequest.requester_name,
              requestId: requestId,
              documentTypes: docRequest.document_types as string[],
              totalCents: docRequest.total_price_cents,
              propertyAddress: docRequest.property_address,
            });
          } catch (emailErr) {
            console.error("Failed to send order confirmation:", emailErr);
          }

          // Notify tenant admin
          try {
            const { data: tenant } = await serviceClient
              .from("tenants")
              .select("contact_email, name")
              .eq("id", docRequest.tenant_id)
              .single();

            if (tenant?.contact_email) {
              await sendAdminNotification({
                to: tenant.contact_email,
                tenantName: tenant.name,
                requesterName: docRequest.requester_name,
                requestId: requestId,
                propertyAddress: docRequest.property_address,
                documentTypes: docRequest.document_types as string[],
                reason: "New paid order requires your attention",
              });
            }
          } catch (emailErr) {
            console.error("Failed to send admin notification:", emailErr);
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : null;

        if (paymentIntentId) {
          await serviceClient
            .from("document_requests")
            .update({ payment_status: "refunded" })
            .eq("stripe_payment_intent_id", paymentIntentId);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
