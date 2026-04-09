import { NextRequest, NextResponse } from "next/server";
import { createBillingPortalSession } from "@/lib/stripe";

/**
 * POST /api/stripe/billing-portal
 *
 * Creates a Stripe Billing Portal session for subscription management.
 * Body: { stripeCustomerId: string }
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stripeCustomerId } = body;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "Missing Stripe customer ID" },
        { status: 400 }
      );
    }

    const proto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || "propertydocz.com";
    const returnUrl = `${proto}://${host}/account`;

    const url = await createBillingPortalSession(stripeCustomerId, returnUrl);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
