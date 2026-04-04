-- ============================================================
-- seed-membership-tiers.sql
-- Seed the four membership tiers matching the pricing page
-- Run AFTER 004_membership_schema.sql
-- ============================================================

insert into membership_tiers (slug, name, price_cents, included_packages, overage_discount_percent, features, sort_order)
values
  (
    'pay_per_order',
    'Pay-Per-Order',
    0,
    0,
    0,
    '["No commitment", "Pay per document", "Digital delivery", "Email support"]',
    1
  ),
  (
    'agent_pro',
    'Agent Pro',
    14900,
    3,
    20,
    '["3 document packages/mo", "20% off additional orders", "Priority processing", "Email support"]',
    2
  ),
  (
    'broker_office',
    'Broker Office',
    39900,
    10,
    25,
    '["10 document packages/mo", "25% off additional orders", "Priority processing", "Multi-agent access", "Phone support"]',
    3
  ),
  (
    'title_partner',
    'Title Partner',
    79900,
    25,
    30,
    '["25 document packages/mo", "30% off additional orders", "Same-day rush included", "Dedicated account manager", "Bill-to-closing", "API access"]',
    4
  )
on conflict (slug) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  included_packages = excluded.included_packages,
  overage_discount_percent = excluded.overage_discount_percent,
  features = excluded.features,
  sort_order = excluded.sort_order;
