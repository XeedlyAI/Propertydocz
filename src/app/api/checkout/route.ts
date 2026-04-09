import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { orderFormSchema } from "@/lib/schemas";
import { calculateOrderTotal, DOCUMENT_LABELS } from "@/lib/pricing";
import { createCheckoutSession } from "@/lib/stripe";
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email/send";
import { runRequestIntelligence } from "@/lib/services/request-intelligence";
import { findAgentByEmail, recordUsage } from "@/lib/services/usage-tracking";
import {
  calculateOrderPricing,
  type SubscriptionInfo,
} from "@/lib/services/pricing.service";
import type { DocumentType } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const parsed = orderFormSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Use service role client — public requesters have no auth session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the tenant exists
    const tenantId = body.tenant_id;
    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing tenant_id" },
        { status: 400 }
      );
    }

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, stripe_account_id, platform_fee_percent, contact_email")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Invalid tenant" }, { status: 400 });
    }

    // Verify association belongs to tenant
    const { data: association, error: assocError } = await supabase
      .from("associations")
      .select("id")
      .eq("id", data.association_id)
      .eq("tenant_id", tenantId)
      .single();

    if (assocError || !association) {
      return NextResponse.json(
        { error: "Invalid association" },
        { status: 400 }
      );
    }

    // Bill-to-closing only allowed for standalone payoff statement
    if (data.bill_to_closing) {
      const isStandalonePayoff =
        data.document_types.length === 1 &&
        data.document_types[0] === "payoff_statement";
      if (!isStandalonePayoff) {
        return NextResponse.json(
          { error: "Bill to closing is only available for standalone payoff statements" },
          { status: 400 }
        );
      }
    }

    // Calculate base total
    const baseTotalCents = calculateOrderTotal(
      data.document_types,
      data.turnaround === "rush"
    );

    // ── Subscription pricing ──
    const customerId: string | undefined = body.customer_id;
    const subscriptionId: string | undefined = body.subscription_id;

    let subscription: SubscriptionInfo | null = null;
    if (subscriptionId) {
      const { data: sub } = await supabase
        .from("customer_subscription")
        .select(
          "id, tier, status, packages_included, packages_used, overage_discount_percent, billing_cycle_start, billing_cycle_end"
        )
        .eq("id", subscriptionId)
        .single();

      if (sub) {
        subscription = {
          id: sub.id,
          tier: sub.tier,
          status: sub.status,
          packages_included: sub.packages_included,
          packages_used: sub.packages_used,
          overage_discount_percent: sub.overage_discount_percent,
          billing_cycle_start: sub.billing_cycle_start,
          billing_cycle_end: sub.billing_cycle_end,
        };
      }
    }

    const pricing = calculateOrderPricing(baseTotalCents, subscription);
    const totalPriceCents = data.bill_to_closing ? baseTotalCents : pricing.finalPrice;

    // ── Guest customer account creation ──
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && data.requester_email) {
      // Check if account exists by email
      const { data: existing } = await supabase
        .from("customer_account")
        .select("id")
        .eq("email", data.requester_email.toLowerCase().trim())
        .single();

      if (existing) {
        resolvedCustomerId = existing.id;
      } else {
        // Create new customer account for guest
        const { data: newCustomer } = await supabase
          .from("customer_account")
          .insert({
            email: data.requester_email.toLowerCase().trim(),
            full_name: data.requester_name,
            phone: data.requester_phone || null,
            company_name: body.requester_company || null,
            customer_type: data.requester_type === "owner" ? "homeowner" : data.requester_type,
          })
          .select("id")
          .single();

        resolvedCustomerId = newCustomer?.id;
      }
    }

    // Build property address string
    const propertyAddress = data.unit_number
      ? `${data.property_address}, ${data.unit_number}`
      : data.property_address;

    // Insert document request
    const { data: docRequest, error: insertError } = await supabase
      .from("document_requests")
      .insert({
        tenant_id: tenantId,
        association_id: data.association_id,
        document_types: data.document_types,
        requester_name: data.requester_name,
        requester_email: data.requester_email,
        requester_phone: data.requester_phone || null,
        requester_type: data.requester_type,
        property_address: propertyAddress,
        turnaround: data.turnaround,
        rush_notes: data.rush_notes || null,
        total_price_cents: totalPriceCents,
        bill_to_closing: data.bill_to_closing,
        payment_status: data.bill_to_closing
          ? "bill_to_closing"
          : pricing.pricingType === "subscription"
            ? "paid" // Covered by plan = paid
            : "pending",
        status: data.bill_to_closing || pricing.pricingType === "subscription"
          ? "awaiting_data"
          : "received",
        // Subscription fields
        customer_id: resolvedCustomerId || null,
        subscription_id: subscriptionId || null,
        pricing_type: pricing.pricingType,
        discount_applied: pricing.discountAmount,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create document request:", insertError);
      return NextResponse.json(
        { error: "Failed to create order. Please try again." },
        { status: 500 }
      );
    }

    // ── Track subscription usage ──
    if (
      subscriptionId &&
      subscription &&
      (pricing.pricingType === "subscription" || pricing.pricingType === "overage")
    ) {
      // Increment packages_used
      await supabase
        .from("customer_subscription")
        .update({
          packages_used: pricing.packagesUsed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscriptionId);

      // Create usage record
      await supabase.from("customer_subscription_usage").insert({
        subscription_id: subscriptionId,
        document_request_id: docRequest.id,
        billing_cycle_start: subscription.billing_cycle_start,
        was_overage: pricing.pricingType === "overage",
        overage_amount: pricing.pricingType === "overage" ? pricing.finalPrice : 0,
      });
    }

    // ── If order is fully covered by subscription, skip payment ──
    if (pricing.pricingType === "subscription" && !data.bill_to_closing) {
      await sendNotifications(
        docRequest.id,
        data.requester_email,
        data.requester_name,
        propertyAddress,
        data.document_types,
        0, // No charge
        tenant.contact_email,
        tenant.name
      );

      // Run intelligence pipeline
      try {
        await runRequestIntelligence(
          docRequest.id,
          data.association_id,
          tenantId,
          data.document_types
        );
      } catch (err) {
        console.error("Intelligence pipeline failed (subscription):", err);
      }

      return NextResponse.json({
        id: docRequest.id,
        message: "Order submitted — covered by your subscription",
      });
    }

    // If bill-to-closing, skip payment and send notifications
    if (data.bill_to_closing) {
      await sendNotifications(
        docRequest.id,
        data.requester_email,
        data.requester_name,
        propertyAddress,
        data.document_types,
        totalPriceCents,
        tenant.contact_email,
        tenant.name
      );

      try {
        await runRequestIntelligence(
          docRequest.id,
          data.association_id,
          tenantId,
          data.document_types
        );
      } catch (err) {
        console.error("Intelligence pipeline failed (bill-to-closing):", err);
      }

      // Track usage against agent membership
      try {
        const agentId = await findAgentByEmail(data.requester_email, tenantId);
        if (agentId) {
          await recordUsage(agentId, docRequest.id);
        }
      } catch (err) {
        console.error("Usage tracking failed (bill-to-closing):", err);
      }

      return NextResponse.json({
        id: docRequest.id,
        message: "Order submitted successfully",
      });
    }

    // If Stripe Connect is configured, create a checkout session
    if (tenant.stripe_account_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const proto = request.headers.get("x-forwarded-proto") || "https";
        const host = request.headers.get("host") || "localhost:3000";
        const baseUrl = `${proto}://${host}`;

        const docLabels = (data.document_types as DocumentType[])
          .map((dt) => DOCUMENT_LABELS[dt])
          .join(", ");

        const checkoutUrl = await createCheckoutSession({
          tenantStripeAccountId: tenant.stripe_account_id,
          platformFeePercent: tenant.platform_fee_percent || 15,
          totalAmountCents: totalPriceCents,
          requestId: docRequest.id,
          tenantName: tenant.name,
          requesterEmail: data.requester_email,
          documentDescription: docLabels,
          successUrl: `${baseUrl}/success?request_id=${docRequest.id}`,
          cancelUrl: `${baseUrl}?cancelled=true`,
        });

        return NextResponse.json({
          id: docRequest.id,
          checkout_url: checkoutUrl,
          message: "Redirecting to payment",
        });
      } catch (stripeErr) {
        console.error("Stripe checkout creation failed:", stripeErr);
        // Fall through to non-Stripe flow
      }
    }

    // No Stripe — mark as received and send notifications
    await sendNotifications(
      docRequest.id,
      data.requester_email,
      data.requester_name,
      propertyAddress,
      data.document_types,
      totalPriceCents,
      tenant.contact_email,
      tenant.name
    );

    // Run intelligence pipeline
    try {
      await runRequestIntelligence(
        docRequest.id,
        data.association_id,
        tenantId,
        data.document_types
      );
    } catch (err) {
      console.error("Intelligence pipeline failed (no-stripe):", err);
    }

    // Track usage against agent membership
    try {
      const agentId = await findAgentByEmail(data.requester_email, tenantId);
      if (agentId) {
        await recordUsage(agentId, docRequest.id);
      }
    } catch (err) {
      console.error("Usage tracking failed (no-stripe):", err);
    }

    return NextResponse.json({
      id: docRequest.id,
      message: "Order submitted successfully",
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendNotifications(
  requestId: string,
  requesterEmail: string,
  requesterName: string,
  propertyAddress: string,
  documentTypes: string[],
  totalCents: number,
  adminEmail: string | null,
  tenantName: string
) {
  try {
    await sendOrderConfirmation({
      to: requesterEmail,
      requesterName,
      requestId,
      documentTypes,
      totalCents,
      propertyAddress,
      replyTo: adminEmail || undefined,
    });
  } catch (err) {
    console.error("Order confirmation email failed:", err);
  }

  if (adminEmail) {
    try {
      await sendAdminNotification({
        to: adminEmail,
        tenantName,
        requesterName,
        requestId,
        propertyAddress,
        documentTypes,
        reason: "New document order submitted",
      });
    } catch (err) {
      console.error("Admin notification email failed:", err);
    }
  }
}
