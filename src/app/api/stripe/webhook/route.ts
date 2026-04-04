import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email/send";
import { runRequestIntelligence } from "@/lib/services/request-intelligence";

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

        // Handle subscription checkout (agent membership)
        if (session.mode === "subscription" && session.metadata?.agent_account_id) {
          const agentAccountId = session.metadata.agent_account_id;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : null;

          if (subscriptionId) {
            // Fetch subscription details for period dates
            const sub = await stripe.subscriptions.retrieve(subscriptionId) as unknown as {
              current_period_start: number;
              current_period_end: number;
            };

            await serviceClient
              .from("agent_accounts")
              .update({
                stripe_subscription_id: subscriptionId,
                stripe_customer_id:
                  typeof session.customer === "string"
                    ? session.customer
                    : undefined,
                subscription_status: "active",
                current_period_start: new Date(
                  sub.current_period_start * 1000
                ).toISOString(),
                current_period_end: new Date(
                  sub.current_period_end * 1000
                ).toISOString(),
              })
              .eq("id", agentAccountId);
          }
          break;
        }

        // Handle one-time payment checkout (document order)
        const requestId = session.metadata?.request_id;

        if (!requestId) break;

        // Update payment status and advance workflow
        const { data: docRequest } = await serviceClient
          .from("document_requests")
          .select("id, status, tenant_id, association_id, requester_name, requester_email, document_types, total_price_cents, property_address")
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
            // Fetch tenant contact for reply-to
            const { data: tenantForReply } = await serviceClient
              .from("tenants")
              .select("contact_email")
              .eq("id", docRequest.tenant_id)
              .single();

            await sendOrderConfirmation({
              to: docRequest.requester_email,
              requesterName: docRequest.requester_name,
              requestId: requestId,
              documentTypes: docRequest.document_types as string[],
              totalCents: docRequest.total_price_cents,
              propertyAddress: docRequest.property_address,
              replyTo: tenantForReply?.contact_email || undefined,
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

          // Run intelligence pipeline (auto-fill, sync, gap analysis)
          try {
            if (docRequest.association_id) {
              await runRequestIntelligence(
                requestId,
                docRequest.association_id,
                docRequest.tenant_id,
                docRequest.document_types as string[]
              );
            }
          } catch (err) {
            console.error("Intelligence pipeline failed (webhook):", err);
            // Non-blocking — request stays in awaiting_data
          }
        }
        break;
      }

      // === SUBSCRIPTION LIFECYCLE ===
      case "customer.subscription.updated": {
        const sub = event.data.object as unknown as {
          metadata?: Record<string, string>;
          status: string;
          current_period_start: number;
          current_period_end: number;
        };
        const agentAccountId = sub.metadata?.agent_account_id;

        if (agentAccountId) {
          await serviceClient
            .from("agent_accounts")
            .update({
              subscription_status: sub.status === "active" ? "active" : sub.status,
              current_period_start: new Date(
                sub.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                sub.current_period_end * 1000
              ).toISOString(),
            })
            .eq("id", agentAccountId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as unknown as {
          metadata?: Record<string, string>;
        };
        const agentAccountId = sub.metadata?.agent_account_id;

        if (agentAccountId) {
          // Revert to free tier
          const { data: freeTier } = await serviceClient
            .from("membership_tiers")
            .select("id")
            .eq("slug", "pay_per_order")
            .single();

          await serviceClient
            .from("agent_accounts")
            .update({
              subscription_status: "canceled",
              stripe_subscription_id: null,
              tier_id: freeTier?.id || undefined,
            })
            .eq("id", agentAccountId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as {
          subscription: string | null;
        };
        const subId = invoice.subscription || null;

        if (subId) {
          await serviceClient
            .from("agent_accounts")
            .update({ subscription_status: "past_due" })
            .eq("stripe_subscription_id", subId);
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
