-- ============================================================
-- 005_storage_providers.sql
-- Multi-provider storage connections + tenant branding columns
-- Run in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STORAGE CONNECTIONS (supports Dropbox, Google Drive, OneDrive)
-- ============================================================
create table if not exists tenant_storage_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null,                      -- 'dropbox', 'google_drive', 'onedrive'
  credentials jsonb not null default '{}',     -- { access_token, refresh_token, account_id, ... }
  is_primary boolean not null default false,
  connected_at timestamptz not null default now(),
  connected_by uuid references profiles(id),
  status text not null default 'active',       -- 'active', 'expired', 'disconnected'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, provider)                  -- one connection per provider per tenant
);

create index idx_storage_connections_tenant on tenant_storage_connections(tenant_id);
create index idx_storage_connections_provider on tenant_storage_connections(tenant_id, provider);

-- Updated_at trigger
create trigger tenant_storage_connections_updated_at
  before update on tenant_storage_connections
  for each row execute function update_updated_at();

-- RLS: tenant admins see own, platform admins see all
alter table tenant_storage_connections enable row level security;

create policy "Tenant admins can view own storage connections"
  on tenant_storage_connections for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.tenant_id = tenant_storage_connections.tenant_id
      and profiles.role in ('tenant_admin', 'platform_admin')
    )
  );

create policy "Platform admins can manage all storage connections"
  on tenant_storage_connections for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'platform_admin'
    )
  );

-- ============================================================
-- TENANT BRANDING COLUMNS
-- logo_url and primary_color already exist in migration.sql
-- Add brand_color as an alias-check — skip if primary_color exists
-- ============================================================

-- Ensure brand_color column exists (some deployments may not have primary_color)
-- ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_color text;
-- Note: The tenants table already has logo_url and primary_color columns
-- from the original migration. No additional columns needed.

-- ============================================================
-- MIGRATE EXISTING DROPBOX CREDENTIALS
-- Copy Dropbox tokens from tenants table to tenant_storage_connections
-- for any tenant that has them. Legacy columns remain for backward compat.
-- ============================================================
insert into tenant_storage_connections (tenant_id, provider, credentials, is_primary, connected_at, status)
select
  id,
  'dropbox',
  jsonb_build_object(
    'provider', 'dropbox',
    'access_token', dropbox_access_token,
    'refresh_token', coalesce(dropbox_refresh_token, ''),
    'connected_at', now()::text
  ),
  true,
  now(),
  'active'
from tenants
where dropbox_access_token is not null
  and dropbox_access_token != ''
on conflict (tenant_id, provider) do nothing;
