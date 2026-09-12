-- Overage discount: one unit. customer_subscription.overage_discount_percent
-- is a whole percent (20 = 20%), matching its name and membership_tiers.
-- Until 2026-09-11 the Stripe webhook wrote the tier's decimal (0.20) here.
-- Convert those rows. The application reads both forms during the transition
-- (see overageDiscountFraction in src/lib/subscriptions.ts), so this is safe
-- to run before or after the code deploys. Run in the Supabase SQL Editor.

UPDATE customer_subscription
SET overage_discount_percent = ROUND(overage_discount_percent * 100)
WHERE overage_discount_percent > 0
  AND overage_discount_percent <= 1;

COMMENT ON COLUMN customer_subscription.overage_discount_percent IS
  'Whole percent (20 = 20%). Written by the Stripe webhook from SUBSCRIPTION_TIERS[tier].overageDiscount * 100.';
