-- 006_cron_tables.sql
-- Cron run logging table for background job monitoring

CREATE TABLE IF NOT EXISTS cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,            -- e.g. 'staleness', 'usage-reset'
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'error'
  records_processed INT DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_cron_runs_job_started
  ON cron_runs (job_name, started_at DESC);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_cron_runs_started_at
  ON cron_runs (started_at);

-- RLS: only platform admins can read cron runs
ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can read cron runs"
  ON cron_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'platform_admin'
    )
  );

-- Service role can insert/update (used by cron endpoints)
-- No RLS policy needed for service role as it bypasses RLS
