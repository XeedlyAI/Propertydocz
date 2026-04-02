-- PropertyDocz Migration SQL
-- Run in Supabase SQL Editor
-- Creates all tables, indexes, and RLS policies for multi-tenant isolation

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('platform_admin', 'tenant_admin', 'tenant_staff');
create type request_status as enum ('received', 'paid', 'awaiting_data', 'ready_for_generation', 'pending_review', 'approved', 'delivered', 'cancelled');
create type payment_status as enum ('pending', 'paid', 'refunded', 'bill_to_closing');
create type turnaround_type as enum ('standard', 'rush');
create type requester_type as enum ('agent', 'lender', 'owner', 'title_company', 'other');
create type document_type as enum ('resale_certificate', 'payoff_statement', 'governing_documents', 'lender_questionnaire');
create type project_type as enum ('condo', 'townhome', 'pud', 'co-op');
create type assessment_frequency as enum ('monthly', 'quarterly', 'annually');
create type governing_doc_category as enum ('ccrs', 'bylaws', 'articles', 'rules', 'budget', 'financial_statement', 'reserve_analysis', 'insurance_cert', 'minutes', 'plat', 'amendment');
create type generation_method as enum ('typst', 'ai_assisted');
create type document_source as enum ('dropbox', 'upload');

-- ============================================================
-- TABLES
-- ============================================================

-- Multi-tenant root
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique, -- subdomain
  stripe_account_id text,
  platform_fee_percent numeric(5,2) not null default 20.00,
  dropbox_access_token text,
  dropbox_refresh_token text,
  logo_url text,
  primary_color text default '#1a1a2e',
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index tenants_slug_idx on tenants (slug);

-- User profiles (tenant admins)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role user_role not null default 'tenant_staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_tenant_id_idx on profiles (tenant_id);

-- HOA communities managed by a tenant
create table associations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  legal_name text,
  address text,
  city text,
  state text default 'UT',
  zip text,
  mailing_address text,

  -- Management contacts
  manager_name text,
  manager_email text,
  manager_phone text,
  billing_contact_name text,
  billing_contact_email text,
  billing_contact_phone text,

  -- Payment info
  payable_to text,
  remit_address text,
  wire_instructions text,
  electronic_payment_instructions text,

  -- Financial
  monthly_assessment_amount integer, -- cents
  assessment_frequency assessment_frequency default 'monthly',
  annual_budget_amount integer, -- cents
  reserve_balance integer, -- cents
  reserve_study_date date,
  percent_funded numeric(5,2),
  capital_contribution_fee integer, -- cents
  transfer_fee integer, -- cents
  requires_first_month_assessment boolean default false,

  -- Ownership & occupancy
  total_units integer,
  owner_occupied_pct numeric(5,2),
  second_home_pct numeric(5,2),
  investor_owned_pct numeric(5,2),
  commercial_space_pct numeric(5,2),

  -- Project info
  project_type project_type,
  year_built integer,
  construction_status text,
  phases_planned integer,
  phases_completed integer,
  developer_units_remaining integer,
  hoa_owned_units integer,

  -- Insurance
  master_policy_carrier text,
  master_policy_number text,
  master_policy_expiration date,
  general_liability_coverage boolean,
  general_liability_amount integer, -- cents
  fidelity_bond boolean,
  fidelity_amount integer, -- cents
  flood_zone text,
  flood_insurance_in_force boolean,
  flood_coverage_amount integer, -- cents

  -- Policies
  rental_policy text,
  short_term_rental_policy text,
  pet_policy text,
  parking_policy text,
  age_restrictions text,
  right_of_first_refusal text,

  -- Legal
  in_litigation boolean default false,
  litigation_details text,
  litigation_relates_to_defects boolean,
  attorney_name text,
  attorney_phone text,

  -- Building safety (1076A addendum)
  last_inspection_date date,
  last_inspection_findings boolean,
  inspection_repairs_completed boolean,
  inspection_repairs_remaining text,
  inspection_repairs_timeline text,
  known_deficiencies boolean,
  deficiency_details text,
  deficiency_repairs_remaining text,
  deficiency_timeline text,
  outstanding_violations boolean,
  violation_details text,
  anticipated_violations boolean,
  anticipated_violation_plan text,
  deferred_maintenance_funding_plan boolean,
  deferred_maintenance_schedule text,

  -- Addendum II
  evacuation_order boolean default false,
  material_deficiencies_1yr boolean default false,
  mold_water_intrusion boolean default false,
  advanced_deterioration boolean default false,
  failed_mandatory_inspections boolean default false,

  -- Special assessments
  current_special_assessment boolean default false,
  current_sa_amount integer, -- cents
  current_sa_terms text,
  current_sa_purpose text,
  planned_special_assessment boolean default false,
  planned_sa_amount integer, -- cents
  planned_sa_terms text,
  planned_sa_purpose text,

  -- HOA loans
  hoa_loan_exists boolean default false,
  hoa_loan_amount integer, -- cents
  hoa_loan_terms text,

  -- Financial controls
  separate_operating_reserve_accounts boolean,
  account_access_controls boolean,
  bank_sends_statements_to_hoa boolean,
  dual_signatures_for_reserves boolean,
  independent_financial_review boolean,
  financial_review_frequency text,

  -- Tax/legal
  hoa_ein text,
  management_company_ein text,
  hoa_transfer_date date,

  -- Dropbox
  dropbox_folder_path text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index associations_tenant_id_idx on associations (tenant_id);

-- Individual units/lots
create table properties (
  id uuid primary key default uuid_generate_v4(),
  association_id uuid not null references associations(id) on delete cascade,
  address text,
  unit_number text,
  lot_number text,
  owner_name text,
  owner_email text,
  owner_phone text,
  monthly_assessment_override integer, -- cents, if different from association default
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_association_id_idx on properties (association_id);

-- Document requests (central tracking)
create table document_requests (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  association_id uuid not null references associations(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,

  -- Request info
  document_types document_type[] not null,
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  requester_type requester_type not null default 'other',
  property_address text, -- denormalized for display

  -- Turnaround
  turnaround turnaround_type not null default 'standard',
  rush_notes text,

  -- Pricing
  total_price_cents integer not null,
  bill_to_closing boolean not null default false,

  -- Payment
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  payment_status payment_status not null default 'pending',

  -- Workflow
  status request_status not null default 'received',

  -- Data assembly
  auto_data jsonb default '{}',
  live_data jsonb default '{}',
  missing_fields jsonb default '[]',
  ai_validation_notes text,

  -- Approval
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  approved_by uuid references profiles(id),
  approved_at timestamptz,

  -- Delivery
  file_urls text[] default '{}',
  delivered_at timestamptz,

  -- Notifications
  admin_notified_at timestamptz,
  requester_notified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index document_requests_tenant_id_idx on document_requests (tenant_id);
create index document_requests_association_id_idx on document_requests (association_id);
create index document_requests_status_idx on document_requests (status);
create index document_requests_payment_status_idx on document_requests (payment_status);

-- Generated document files
create table generated_documents (
  id uuid primary key default uuid_generate_v4(),
  document_request_id uuid not null references document_requests(id) on delete cascade,
  document_type document_type not null,
  file_url text not null,
  file_name text not null,
  file_type text not null default 'pdf',
  generated_at timestamptz not null default now(),
  generation_method generation_method not null default 'typst',
  created_at timestamptz not null default now()
);

create index generated_documents_request_id_idx on generated_documents (document_request_id);

-- Governing document files (synced from Dropbox or uploaded)
create table governing_documents (
  id uuid primary key default uuid_generate_v4(),
  association_id uuid not null references associations(id) on delete cascade,
  document_name text not null,
  document_category governing_doc_category not null,
  file_url text not null,
  file_name text not null,
  source document_source not null default 'upload',
  dropbox_path text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index governing_documents_association_id_idx on governing_documents (association_id);

-- Audit trail
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  details jsonb default '{}',
  created_at timestamptz not null default now()
);

create index activity_log_tenant_id_idx on activity_log (tenant_id);
create index activity_log_entity_idx on activity_log (entity_type, entity_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tenants_updated_at before update on tenants for each row execute function update_updated_at();
create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger associations_updated_at before update on associations for each row execute function update_updated_at();
create trigger properties_updated_at before update on properties for each row execute function update_updated_at();
create trigger document_requests_updated_at before update on document_requests for each row execute function update_updated_at();
create trigger governing_documents_updated_at before update on governing_documents for each row execute function update_updated_at();

-- ============================================================
-- HELPER FUNCTION: Get current user's tenant_id
-- ============================================================
create or replace function get_user_tenant_id()
returns uuid as $$
  select tenant_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- ============================================================
-- HELPER FUNCTION: Check if current user is platform admin
-- ============================================================
create or replace function is_platform_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'platform_admin'
  );
$$ language sql security definer stable;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table associations enable row level security;
alter table properties enable row level security;
alter table document_requests enable row level security;
alter table generated_documents enable row level security;
alter table governing_documents enable row level security;
alter table activity_log enable row level security;

-- ---- TENANTS ----
-- Platform admins can see all tenants; tenant members can see their own tenant
create policy "Platform admins see all tenants"
  on tenants for select
  using (is_platform_admin());

create policy "Tenant members see own tenant"
  on tenants for select
  using (id = get_user_tenant_id());

create policy "Platform admins manage tenants"
  on tenants for all
  using (is_platform_admin());

-- ---- PROFILES ----
-- Users can see their own profile
create policy "Users see own profile"
  on profiles for select
  using (id = auth.uid());

-- Tenant admins can see profiles in their tenant
create policy "Tenant admins see tenant profiles"
  on profiles for select
  using (tenant_id = get_user_tenant_id());

-- Platform admins can manage all profiles
create policy "Platform admins manage profiles"
  on profiles for all
  using (is_platform_admin());

-- Users can update their own profile
create policy "Users update own profile"
  on profiles for update
  using (id = auth.uid());

-- ---- ASSOCIATIONS ----
-- Tenant members see their associations
create policy "Tenant members see associations"
  on associations for select
  using (tenant_id = get_user_tenant_id());

-- Tenant admins manage their associations
create policy "Tenant admins manage associations"
  on associations for all
  using (
    tenant_id = get_user_tenant_id()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('tenant_admin', 'platform_admin')
    )
  );

-- Platform admins manage all associations
create policy "Platform admins manage associations"
  on associations for all
  using (is_platform_admin());

-- ---- PROPERTIES ----
-- Tenant members see properties in their associations
create policy "Tenant members see properties"
  on properties for select
  using (
    exists (
      select 1 from associations
      where associations.id = properties.association_id
      and associations.tenant_id = get_user_tenant_id()
    )
  );

-- Tenant admins manage their properties
create policy "Tenant admins manage properties"
  on properties for all
  using (
    exists (
      select 1 from associations
      where associations.id = properties.association_id
      and associations.tenant_id = get_user_tenant_id()
    )
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('tenant_admin', 'platform_admin')
    )
  );

-- Platform admins manage all properties
create policy "Platform admins manage properties"
  on properties for all
  using (is_platform_admin());

-- ---- DOCUMENT REQUESTS ----
-- Tenant members see their document requests
create policy "Tenant members see document requests"
  on document_requests for select
  using (tenant_id = get_user_tenant_id());

-- Tenant admins manage their document requests
create policy "Tenant admins manage document requests"
  on document_requests for all
  using (
    tenant_id = get_user_tenant_id()
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('tenant_admin', 'platform_admin')
    )
  );

-- Platform admins manage all document requests
create policy "Platform admins manage document requests"
  on document_requests for all
  using (is_platform_admin());

-- ---- GENERATED DOCUMENTS ----
-- Tenant members see generated docs for their requests
create policy "Tenant members see generated documents"
  on generated_documents for select
  using (
    exists (
      select 1 from document_requests
      where document_requests.id = generated_documents.document_request_id
      and document_requests.tenant_id = get_user_tenant_id()
    )
  );

-- Platform admins manage all generated documents
create policy "Platform admins manage generated documents"
  on generated_documents for all
  using (is_platform_admin());

-- ---- GOVERNING DOCUMENTS ----
-- Tenant members see governing docs for their associations
create policy "Tenant members see governing documents"
  on governing_documents for select
  using (
    exists (
      select 1 from associations
      where associations.id = governing_documents.association_id
      and associations.tenant_id = get_user_tenant_id()
    )
  );

-- Tenant admins manage governing docs
create policy "Tenant admins manage governing documents"
  on governing_documents for all
  using (
    exists (
      select 1 from associations
      where associations.id = governing_documents.association_id
      and associations.tenant_id = get_user_tenant_id()
    )
    and exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('tenant_admin', 'platform_admin')
    )
  );

-- Platform admins manage all governing documents
create policy "Platform admins manage governing documents"
  on governing_documents for all
  using (is_platform_admin());

-- ---- ACTIVITY LOG ----
-- Tenant members see their activity log
create policy "Tenant members see activity log"
  on activity_log for select
  using (tenant_id = get_user_tenant_id());

-- Platform admins see all activity
create policy "Platform admins see all activity"
  on activity_log for select
  using (is_platform_admin());

-- Authenticated users can insert activity log entries for their tenant
create policy "Authenticated users insert activity log"
  on activity_log for insert
  with check (tenant_id = get_user_tenant_id());

-- Platform admins insert any activity log entry
create policy "Platform admins insert activity log"
  on activity_log for insert
  with check (is_platform_admin());

-- ============================================================
-- SERVICE ROLE BYPASS NOTE
-- ============================================================
-- API routes that handle public order form submissions use the
-- service role key (SUPABASE_SERVICE_ROLE_KEY) which bypasses RLS.
-- This is intentional: public requesters have no auth session,
-- so inserts into document_requests go through API routes that
-- validate input via Zod before writing with the service client.
