-- ============================================================
-- PropertyDocz — Phase A: Field Registry & Data Model
-- Run in Supabase SQL Editor AFTER migration.sql
-- Creates: enums, field_definitions, association_field_values,
--          document_sync_log + RLS + indexes
-- ============================================================

-- ===================
-- NEW ENUMS
-- ===================

-- Data confidence tier for field classification
create type field_tier as enum ('static', 'periodic', 'transaction');

-- Field value types for validation and rendering
create type field_value_type as enum ('text', 'number', 'currency', 'date', 'boolean', 'enum', 'text_array');

-- Association onboarding status
create type onboarding_status as enum ('pending', 'harvesting', 'review', 'complete');


-- ===================
-- TABLE: field_definitions
-- Central registry of every field across all document types
-- ===================

create table field_definitions (
  id uuid primary key default gen_random_uuid(),
  field_key text unique not null,
  label text not null,
  tier field_tier not null,
  value_type field_value_type not null default 'text',
  section text not null,
  document_types text[] not null,
  validation_rules jsonb,
  staleness_days integer,
  extraction_hints text[],
  display_order integer not null default 0,
  help_text text,
  created_at timestamptz default now()
);

-- RLS for field_definitions
alter table field_definitions enable row level security;

-- Platform admins can read and write
create policy "Platform admins full access to field_definitions"
  on field_definitions
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'platform_admin'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'platform_admin'
    )
  );

-- Tenant admins and staff can read only
create policy "Tenant users can read field_definitions"
  on field_definitions
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('tenant_admin', 'tenant_staff')
    )
  );

-- Service role has full access (implicit with service key, but explicit for clarity)
create policy "Service role full access to field_definitions"
  on field_definitions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ===================
-- TABLE: association_field_values
-- Current known values per association per field, with confidence tracking
-- ===================

create table association_field_values (
  id uuid primary key default gen_random_uuid(),
  association_id uuid references associations(id) on delete cascade,
  field_key text references field_definitions(field_key),
  value text,
  confidence text not null default 'unverified',   -- 'verified', 'ai_extracted', 'stale', 'unverified'
  source text,                                       -- 'manual', 'dropbox_extraction', 'onboarding_upload', 'admin_confirmed'
  source_document text,                              -- filename if extracted from a document
  last_verified_at timestamptz,
  last_verified_by uuid,                             -- references auth.users(id) but no FK to avoid cross-schema issues
  previous_value text,                               -- for comparison when AI updates a value
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(association_id, field_key)
);

-- RLS for association_field_values — scoped to tenant via association
alter table association_field_values enable row level security;

-- Users can only access field values for associations belonging to their tenant
create policy "Tenant users can access own association field values"
  on association_field_values
  for all
  using (
    exists (
      select 1 from associations a
      join profiles p on p.tenant_id = a.tenant_id
      where a.id = association_field_values.association_id
        and p.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from associations a
      join profiles p on p.tenant_id = a.tenant_id
      where a.id = association_field_values.association_id
        and p.id = auth.uid()
    )
  );

-- Service role has full access
create policy "Service role full access to association_field_values"
  on association_field_values
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ===================
-- TABLE: document_sync_log
-- Tracks Dropbox file sync and extraction status
-- ===================

create table document_sync_log (
  id uuid primary key default gen_random_uuid(),
  association_id uuid references associations(id) on delete cascade,
  dropbox_file_id text,
  dropbox_path text,
  file_name text,
  category text,                      -- 'ccrs', 'budget', 'insurance', 'reserve_study', etc.
  file_hash text,                     -- to detect modifications
  last_synced_at timestamptz,
  extraction_status text default 'pending',  -- 'pending', 'completed', 'failed'
  extracted_fields jsonb,             -- which fields were extracted from this doc
  created_at timestamptz default now()
);

-- RLS for document_sync_log — scoped to tenant via association
alter table document_sync_log enable row level security;

create policy "Tenant users can access own document sync logs"
  on document_sync_log
  for all
  using (
    exists (
      select 1 from associations a
      join profiles p on p.tenant_id = a.tenant_id
      where a.id = document_sync_log.association_id
        and p.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from associations a
      join profiles p on p.tenant_id = a.tenant_id
      where a.id = document_sync_log.association_id
        and p.id = auth.uid()
    )
  );

-- Service role has full access
create policy "Service role full access to document_sync_log"
  on document_sync_log
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ===================
-- ALTER EXISTING TABLES
-- ===================

-- Add onboarding status to associations
alter table associations add column if not exists onboarding_status onboarding_status default 'pending';

-- Add intelligence fields to document_requests
alter table document_requests add column if not exists completeness_score integer;
alter table document_requests add column if not exists gap_analysis jsonb;


-- ===================
-- INDEXES
-- ===================

-- association_field_values: primary lookup by association + field
create index idx_afv_association_field
  on association_field_values(association_id, field_key);

-- association_field_values: bulk lookup by association
create index idx_afv_association
  on association_field_values(association_id);

-- document_sync_log: latest sync per association
create index idx_dsl_association_synced
  on document_sync_log(association_id, last_synced_at desc);

-- field_definitions: GIN index for array containment queries on document_types
create index idx_fd_document_types
  on field_definitions using gin(document_types);

-- field_definitions: section + display_order for ordered reads
create index idx_fd_section_order
  on field_definitions(section, display_order);
