import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { orderFormSchema } from "@/lib/schemas";
import { calculateOrderTotal } from "@/lib/pricing";

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
      .select("id")
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
