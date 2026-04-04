-- ============================================================
-- 004_membership_schema.sql
-- Membership tiers, agent accounts, and document usage tracking
-- Run in Supabase SQL Editor
-- ============================================================

-- Add 'agent' to user_role enum
alter type user_role add value if not exists 'agent';

-- ============================================================
-- MEMBERSHIP TIERS
-- ============================================================
create table if not exists membership_tiers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,               -- 'pay_per_order', 'agent_pro', 'broker_office', 'title_partner'
  name text not null,                       -- Display name
  price_cents integer not null default 0,   -- Monthly price in cents (0 = free)
  included_packages integer not null default 0,  -- Included document packages per month
  overage_discount_percent integer not null default 0,  -- Discount on overage orders (20, 25, 30)
  features jsonb not null default '[]',     -- Feature list for display
  stripe_price_id text,                     -- Stripe Price ID for subscription billing
  sort_order integer not null default 0,    -- Display ordering
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- AGENT ACCOUNTS
-- ============================================================
create table if not exists agent_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  tier_id uuid not null references membership_tiers(id),

  -- Stripe billing
  stripe_customer_id text,                  -- Stripe Customer for this agent
  stripe_subscription_id text,              -- Active subscription ID
  subscription_status text default 'none',  -- 'none', 'active', 'past_due', 'canceled', 'trialing'

  -- Billing cycle
  current_period_start timestamptz,
  current_period_end timestamptz,

  -- Agent info
  company_name text,
  license_number text,
  phone text,

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One agent account per user per tenant
  unique(user_id, tenant_id)
);

create index idx_agent_accounts_user on agent_accounts(user_id);
create index idx_agent_accounts_tenant on agent_accounts(tenant_id);
create index idx_agent_accounts_tier on agent_accounts(tier_id);
create index idx_agent_accounts_stripe_customer on agent_accounts(stripe_customer_id);
create index idx_agent_accounts_stripe_sub on agent_accounts(stripe_subscription_id);

-- ============================================================
-- DOCUMENT USAGE TRACKING
-- Tracks package usage per billing period
-- ============================================================
create table if not exists document_usage (
  id uuid primary key default gen_random_uuid(),
  agent_account_id uuid not null references agent_accounts(id) on delete cascade,
  request_id uuid not null references document_requests(id) on delete cascade,

  -- Period tracking
  period_start timestamptz not null,
  period_end timestamptz not null,

  -- Usage classification
  is_included boolean not null default false,   -- true = within included packages, false = overage
  overage_discount_percent integer default 0,   -- Discount applied to this overage order

  created_at timestamptz not null default now(),

  unique(request_id)  -- One usage record per request
);

create index idx_document_usage_agent on document_usage(agent_account_id);
create index idx_document_usage_period on document_usage(agent_account_id, period_start, period_end);

-- ============================================================
-- TRIGGERS
-- ============================================================
create trigger membership_tiers_updated_at
  before update on membership_tiers
  for each row execute function update_updated_at();

create trigger agent_accounts_updated_at
  before update on agent_accounts
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- membership_tiers: public read, platform_admin write
alter table membership_tiers enable row level security;

create policy "Anyone can read active tiers"
  on membership_tiers for select
  using (is_active = true);

create policy "Platform admins can manage tiers"
  on membership_tiers for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'platform_admin'
    )
  );

-- agent_accounts: agents see own, tenant_admin sees tenant's, platform_admin sees all
alter table agent_accounts enable row level security;

create policy "Agents can view own account"
  on agent_accounts for select
  using (user_id = auth.uid());

create policy "Agents can update own account"
  on agent_accounts for update
  using (user_id = auth.uid());

create policy "Tenant admins can view tenant agents"
  on agent_accounts for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = agent_accounts.tenant_id
      and profiles.role = 'tenant_admin'
    )
  );

create policy "Platform admins can manage all agent accounts"
  on agent_accounts for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'platform_admin'
    )
  );

-- document_usage: agents see own, tenant_admin sees tenant's, platform_admin sees all
alter table document_usage enable row level security;

create policy "Agents can view own usage"
  on document_usage for select
  using (
    exists (
      select 1 from agent_accounts
      where agent_accounts.id = document_usage.agent_account_id
      and agent_accounts.user_id = auth.uid()
    )
  );

create policy "Tenant admins can view tenant usage"
  on document_usage for select
  using (
    exists (
      select 1 from agent_accounts
      join profiles on profiles.id = auth.uid()
      where agent_accounts.id = document_usage.agent_account_id
      and agent_accounts.tenant_id = profiles.tenant_id
      and profiles.role = 'tenant_admin'
    )
  );

create policy "Platform admins can manage all usage"
  on document_usage for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'platform_admin'
    )
  );

-- Service role bypass (for API routes using service client)
-- Note: service_role key already bypasses RLS by default in Supabase
