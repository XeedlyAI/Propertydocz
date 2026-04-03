import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { orderFormSchema } from "@/lib/schemas";
import { calculateOrderTotal, DOCUMENT_LABELS } from "@/lib/pricing";
import { createCheckoutSession } from "@/lib/stripe";
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email/send";
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

    // Calculate total
    const totalPriceCents = calculateOrderTotal(
      data.document_types,
      data.turnaround === "rush"
    );

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
        payment_status: data.bill_to_closing ? "bill_to_closing" : "pending",
        status: "received",
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
