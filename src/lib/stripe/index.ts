// Stripe Connect helpers
// Platform account (XeedlyAI) + Connected accounts (each tenant)

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return key;
}
