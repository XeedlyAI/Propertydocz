-- ============================================================
-- Revenue Split & Settlement System
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Fulfillment Ledger — tracks revenue split per delivered document request
CREATE TABLE IF NOT EXISTS fulfillment_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  document_request_id UUID NOT NULL REFERENCES document_requests(id),
  customer_id UUID REFERENCES customer_account(id),

  -- What type of revenue this is
  revenue_type TEXT NOT NULL,  -- 'pay_per_order' | 'overage' | 'subscription_fulfillment'

  -- Document details
  document_type TEXT NOT NULL,
  document_count INTEGER NOT NULL DEFAULT 1,

  -- Money (stored in dollars as DECIMAL)
  order_amount DECIMAL NOT NULL DEFAULT 0,       -- what the customer paid
  tenant_share DECIMAL NOT NULL DEFAULT 0,       -- what the management company earns
  platform_share DECIMAL NOT NULL DEFAULT 0,     -- what XeedlyAI keeps

  -- Settlement tracking
  settlement_status TEXT NOT NULL DEFAULT 'accrued',  -- 'accrued' | 'settled' | 'paid'
  settlement_id UUID,                                  -- links to monthly_settlement when paid
  settled_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_ledger_tenant ON fulfillment_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fulfillment_ledger_status ON fulfillment_ledger(settlement_status);
CREATE INDEX IF NOT EXISTS idx_fulfillment_ledger_created ON fulfillment_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_fulfillment_ledger_request ON fulfillment_ledger(document_request_id);

-- 2. Monthly Settlement — aggregated monthly payout per tenant
CREATE TABLE IF NOT EXISTS monthly_settlement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Totals
  total_documents_fulfilled INTEGER NOT NULL DEFAULT 0,

  -- Pay-per-order revenue
  ppo_orders INTEGER NOT NULL DEFAULT 0,
  ppo_gross_revenue DECIMAL NOT NULL DEFAULT 0,
  ppo_tenant_share DECIMAL NOT NULL DEFAULT 0,
  ppo_platform_share DECIMAL NOT NULL DEFAULT 0,

  -- Subscription fulfillment revenue
  sub_fulfillments INTEGER NOT NULL DEFAULT 0,
  sub_fulfillment_fees DECIMAL NOT NULL DEFAULT 0,

  -- Combined
  total_tenant_earnings DECIMAL NOT NULL DEFAULT 0,
  total_platform_earnings DECIMAL NOT NULL DEFAULT 0,

  -- Payment
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'processing' | 'paid' | 'failed'
  stripe_transfer_id TEXT,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monthly_settlement_tenant ON monthly_settlement(tenant_id);
CREATE INDEX IF NOT EXISTS idx_monthly_settlement_period ON monthly_settlement(period_start);
CREATE INDEX IF NOT EXISTS idx_monthly_settlement_status ON monthly_settlement(status);

-- 3. RLS Policies
ALTER TABLE fulfillment_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fulfillment_ledger"
  ON fulfillment_ledger FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access on fulfillment_ledger"
  ON fulfillment_ledger FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE monthly_settlement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read monthly_settlement"
  ON monthly_settlement FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role full access on monthly_settlement"
  ON monthly_settlement FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. Add settlement_id FK constraint on fulfillment_ledger (after monthly_settlement exists)
ALTER TABLE fulfillment_ledger
  ADD CONSTRAINT fk_fulfillment_ledger_settlement
  FOREIGN KEY (settlement_id) REFERENCES monthly_settlement(id);
