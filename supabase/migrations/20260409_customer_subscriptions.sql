-- ============================================================
-- Customer Account & Subscription System
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Customer Accounts
CREATE TABLE IF NOT EXISTS customer_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  customer_type TEXT NOT NULL DEFAULT 'individual',
  license_number TEXT,
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_customer_account_email ON customer_account(email);
CREATE INDEX IF NOT EXISTS idx_customer_account_user_id ON customer_account(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_account_org ON customer_account(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_account_type ON customer_account(customer_type);

-- 2. Customer Subscriptions
CREATE TABLE IF NOT EXISTS customer_subscription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_account(id) ON DELETE CASCADE,
  organization_subscription BOOLEAN DEFAULT false,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  packages_included INTEGER NOT NULL DEFAULT 0,
  packages_used INTEGER NOT NULL DEFAULT 0,
  overage_discount_percent DECIMAL DEFAULT 0,
  monthly_price DECIMAL NOT NULL DEFAULT 0,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_sub_customer ON customer_subscription(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_sub_status ON customer_subscription(status);
CREATE INDEX IF NOT EXISTS idx_customer_sub_tier ON customer_subscription(tier);
CREATE INDEX IF NOT EXISTS idx_customer_sub_stripe ON customer_subscription(stripe_subscription_id);

-- 3. Subscription Usage Tracking
CREATE TABLE IF NOT EXISTS customer_subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES customer_subscription(id) ON DELETE CASCADE,
  document_request_id UUID,
  billing_cycle_start DATE,
  used_at TIMESTAMPTZ DEFAULT now(),
  was_overage BOOLEAN DEFAULT false,
  overage_amount DECIMAL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sub_usage_sub ON customer_subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_usage_cycle ON customer_subscription_usage(billing_cycle_start);

-- 4. Add columns to document_requests (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_requests' AND column_name = 'customer_id') THEN
    ALTER TABLE document_requests ADD COLUMN customer_id UUID REFERENCES customer_account(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_requests' AND column_name = 'subscription_id') THEN
    ALTER TABLE document_requests ADD COLUMN subscription_id UUID REFERENCES customer_subscription(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_requests' AND column_name = 'pricing_type') THEN
    ALTER TABLE document_requests ADD COLUMN pricing_type TEXT DEFAULT 'standard';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'document_requests' AND column_name = 'discount_applied') THEN
    ALTER TABLE document_requests ADD COLUMN discount_applied DECIMAL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_doc_req_customer ON document_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_doc_req_subscription ON document_requests(subscription_id);

-- 5. RLS Policies
ALTER TABLE customer_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscription_usage ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by API routes)
CREATE POLICY "service_role_customer_account" ON customer_account
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_customer_subscription" ON customer_subscription
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_customer_usage" ON customer_subscription_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Customers can read their own account
CREATE POLICY "customers_read_own" ON customer_account
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Customers can read their own subscriptions
CREATE POLICY "customers_read_own_sub" ON customer_subscription
  FOR SELECT TO authenticated USING (
    customer_id IN (SELECT id FROM customer_account WHERE user_id = auth.uid())
  );
