import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email/send";
import { runRequestIntelligence } from "@/lib/services/request-intelligence";
import { findAgentByEmail, recordUsage } from "@/lib/services/usage-tracking";

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

        // Handle subscription checkout (customer subscription)
        if (session.mode === "subscription" && session.metadata?.customer_account_id) {
          const customerAccountId = session.metadata.customer_account_id;
          const tier = session.metadata.tier || "agent_pro";
          const stripeSubId =
            typeof session.subscription === "string"
              ? session.subscription
              : null;
          const stripeCustomerId =
            typeof session.customer === "string"
              ? session.customer
              : null;

          if (stripeSubId) {
            const sub = await stripe.subscriptions.retrieve(stripeSubId) as unknown as {
              current_period_start: number;
              current_period_end: number;
            };

            const { SUBSCRIPTION_TIERS } = await import("@/lib/subscriptions");
            const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];

            // Create customer_subscription record
            await serviceClient.from("customer_subscription").insert({
              customer_id: customerAccountId,
              tier,
              status: "active",
              stripe_subscription_id: stripeSubId,
              stripe_customer_id: stripeCustomerId,
              billing_cycle_start: new Date(sub.current_period_start * 1000).toISOString().split("T")[0],
              billing_cycle_end: new Date(sub.current_period_end * 1000).toISOString().split("T")[0],
              packages_included: tierConfig?.packagesPerMonth || 0,
              packages_used: 0,
              overage_discount_percent: tierConfig?.overageDiscount || 0,
              monthly_price: tierConfig?.priceCents || 0,
            });
          }
          break;
        }

        // Handle legacy agent membership subscription
        if (session.mode === "subscription" && session.metadata?.agent_account_id) {
          const agentAccountId = session.metadata.agent_account_id;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : null;

          if (subscriptionId) {
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

          // Track usage against agent membership (if requester is an agent)
          try {
            const agentId = await findAgentByEmail(
              docRequest.requester_email,
              docRequest.tenant_id
            );
            if (agentId) {
              await recordUsage(agentId, requestId);
            }
          } catch (err) {
            console.error("Usage tracking failed:", err);
            // Non-blocking
          }
        }
        break;
      }

      // === SUBSCRIPTION LIFECYCLE ===
      case "customer.subscription.updated": {
        const sub = event.data.object as unknown as {
          id: string;
          metadata?: Record<string, string>;
          status: string;
          current_period_start: number;
          current_period_end: number;
        };

        // Handle customer_subscription updates
        const csCustomerAccountId = sub.metadata?.customer_account_id;
        if (csCustomerAccountId) {
          const newTier = sub.metadata?.tier;
          const { SUBSCRIPTION_TIERS } = await import("@/lib/subscriptions");
          const tierConfig = newTier ? SUBSCRIPTION_TIERS[newTier as keyof typeof SUBSCRIPTION_TIERS] : null;

          await serviceClient
            .from("customer_subscription")
            .update({
              status: sub.status === "active" ? "active" : sub.status,
              tier: newTier || undefined,
              billing_cycle_start: new Date(sub.current_period_start * 1000).toISOString().split("T")[0],
              billing_cycle_end: new Date(sub.current_period_end * 1000).toISOString().split("T")[0],
              packages_included: tierConfig?.packagesPerMonth || undefined,
              overage_discount_percent: tierConfig?.overageDiscount || undefined,
              monthly_price: tierConfig?.priceCents || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", sub.id);
          break;
        }

        // Legacy agent_accounts handling
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
          id: string;
          metadata?: Record<string, string>;
        };

        // Handle customer_subscription deletion
        const csCustomerId = sub.metadata?.customer_account_id;
        if (csCustomerId) {
          await serviceClient
            .from("customer_subscription")
            .update({
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", sub.id);
          break;
        }

        // Legacy agent_accounts handling
        const agentAccountId = sub.metadata?.agent_account_id;
        if (agentAccountId) {
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

      case "invoice.paid": {
        // Subscription renewal — reset usage for customer_subscription
        const invoice = event.data.object as unknown as {
          subscription: string | null;
          billing_reason: string;
        };

        if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
          const stripeSub = await stripe.subscriptions.retrieve(invoice.subscription) as unknown as {
            current_period_start: number;
            current_period_end: number;
            metadata?: Record<string, string>;
          };

          if (stripeSub.metadata?.customer_account_id) {
            await serviceClient
              .from("customer_subscription")
              .update({
                packages_used: 0,
                billing_cycle_start: new Date(stripeSub.current_period_start * 1000).toISOString().split("T")[0],
                billing_cycle_end: new Date(stripeSub.current_period_end * 1000).toISOString().split("T")[0],
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", invoice.subscription);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as {
          subscription: string | null;
        };
        const subId = invoice.subscription || null;

        if (subId) {
          // Update customer_subscription
          await serviceClient
            .from("customer_subscription")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subId);

          // Legacy: update agent_accounts
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
