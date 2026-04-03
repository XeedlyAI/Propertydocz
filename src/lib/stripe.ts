import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/**
 * Create a Stripe Connect Express account onboarding link.
 */
export async function createConnectOnboardingLink(
  tenantId: string,
  tenantName: string,
  returnUrl: string,
  refreshUrl: string
): Promise<{ accountId: string; url: string }> {
  const stripe = getStripe();

  // Create Express account
  const account = await stripe.accounts.create({
    type: "express",
    metadata: { tenant_id: tenantId },
    business_profile: { name: tenantName },
  });

  // Create onboarding link
  const link = await stripe.accountLinks.create({
    account: account.id,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: "account_onboarding",
  });

  return { accountId: account.id, url: link.url };
}

/**
 * Create a Stripe Checkout Session with automatic payment splitting.
 * Platform keeps platform_fee_percent, rest goes to tenant's connected account.
 */
export async function createCheckoutSession(opts: {
  tenantStripeAccountId: string;
  platformFeePercent: number;
  totalAmountCents: number;
  requestId: string;
  tenantName: string;
  requesterEmail: string;
  documentDescription: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const stripe = getStripe();

  const platformFeeCents = Math.round(
    (opts.totalAmountCents * opts.platformFeePercent) / 100
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: opts.requesterEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Document Order — ${opts.tenantName}`,
            description: opts.documentDescription,
          },
          unit_amount: opts.totalAmountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: opts.tenantStripeAccountId,
      },
      metadata: {
        request_id: opts.requestId,
      },
    },
    metadata: {
      request_id: opts.requestId,
    },
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });

  return session.url || "";
}
