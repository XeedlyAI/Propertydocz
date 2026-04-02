# PropertyDocz — Complete Build Plan
## Multi-Tenant HOA Document Platform

**Repo:** `XeedlyAI/coredocs` (rename to `propertydocz` when ready)
**Domain:** `propertydocz.com` — wildcard subdomains for tenants (`corehoa.propertydocz.com`)
**Stack:** Next.js 15 (App Router) + Supabase + Stripe Connect + shadcn/ui + Tailwind CSS + Typst + Claude API

---

## Business Model

- Platform owner (XeedlyAI) takes a percentage of every document order
- HOA Management Company (tenant) earns the rest — new revenue line for them
- Stripe Connect handles automatic payment splitting
- Replaces CondoCerts.com / HomeWiseDocs by letting management companies own the relationship

---

## Architecture Overview

### Multi-Tenant Structure
```
Platform (PropertyDocz / XeedlyAI)
  └── Tenant: Core HOA (management company)
  │     ├── Stripe Connected Account (auto-split)
  │     ├── Dropbox OAuth Connection
  │     ├── Association: Sunset Ridge HOA
  │     │     ├── Property: 123 Main St, Unit 101
  │     │     └── Property: 123 Main St, Unit 102
  │     └── Association: Mountain View Condos
  └── Tenant: Another Management Co
        └── ...
```

### URL Routing
- `propertydocz.com` — Marketing site / platform admin
- `corehoa.propertydocz.com` — Core HOA's public order portal
- `corehoa.propertydocz.com/admin` — Core HOA's admin dashboard
- Vercel wildcard subdomain → middleware resolves tenant from subdomain

### Roles
| Role | Access | Description |
|------|--------|-------------|
| Platform Admin | All tenants, settings, splits | You (XeedlyAI) |
| Tenant Admin | Their associations, requests, documents | HOA Management Company staff |
| Public Requester | Order form only, no auth | Agents, lenders, owners, title companies |

---

## Document Request Workflow (Human-in-the-Loop)

```
1. REQUEST RECEIVED
   │ Public requester submits order form
   │ Payment collected via Stripe Connect (auto-split)
   │ Status: received → paid
   │
2. AUTO-POPULATE
   │ System pulls static association/property data from DB
   │ System pulls governing docs from Dropbox (if applicable)
   │ System identifies MISSING LIVE DATA fields
   │ Status: paid → awaiting_data
   │
3. ⏸ PAUSE — LIVE DATA INPUT
   │ Notification sent to Tenant Admin (email + in-app)
   │ Admin sees focused input form with ONLY the missing fields
   │ (e.g., current payoff balance, outstanding violations, recent special assessments)
   │ Admin fills in live data, hits submit
   │ Status: awaiting_data → ready_for_generation
   │
4. AI DOCUMENT ASSEMBLY
   │ Claude API structures and validates all data
   │ Flags any inconsistencies or gaps
   │ Feeds structured output into Typst templates
   │ PDF generated server-side
   │ Status: ready_for_generation → pending_review
   │
5. ⏸ PAUSE — ADMIN REVIEW
   │ Admin sees fully rendered PDF preview
   │ Can approve, request changes, or reject
   │ Status: pending_review → approved
   │
6. DELIVER
   │ PDF uploaded to storage
   │ Email sent to requester with download link
   │ Status: approved → delivered
```

---

## Document Types — Full Compliance Field Specifications

### 1. Resale Certificate ($99)
**Legal basis:** Utah Code §57-8a-227, §57-8a-105.1

**Static fields (from association/property data):**
- Association legal name
- Association address (street, city, state, zip)
- Management company name & contact
- Property address & unit number
- Owner of record
- Monthly/quarterly assessment amount
- Assessment frequency
- Capital contribution / transfer fee
- First month assessment required (Y/N)
- CC&Rs status (recorded, date)
- Bylaws status
- Rules & Regulations status
- Current year budget status
- Insurance certificate status (master policy carrier, number, expiration)
- General liability coverage (Y/N, amount)
- Fidelity/crime bond (Y/N, amount)
- Flood zone status
- Flood insurance in force (Y/N)
- Rental policy (long-term restrictions, percentage caps)
- Short-term rental policy (Airbnb, VRBO restrictions)
- Pet policy
- Parking policy / assigned spaces
- Age restrictions (55+, etc.)
- Right of first refusal (Y/N, details)
- Pending litigation status
- Litigation details (if any)
- Reserve fund balance
- Reserve study date
- Annual budget amount
- Percent funded (reserves)
- Special assessment history

**Live data fields (admin inputs per request):**
- Current balance due for this unit
- Outstanding violations for this unit
- Special assessments currently due for this unit
- Transfer fee amount due at closing
- Other fees due at closing (move-in deposit, key fees, etc.)
- Prorated assessment through closing date
- Any unit-specific restrictions or encumbrances
- Account status (current, delinquent, collections)

**Computed fields:**
- Total due at closing (sum of all amounts)
- Document preparation date
- Validity period (30 days from preparation per Utah practice)
- Prepared by (name, title, contact)

**Certification language (required):**
Utah Community Association Act compliance statement referencing §57-8a-227. Statement that certificate is valid for 30 days. SSN/bank account redaction notice per §57-8a-227(1)(b).

---

### 2. Payoff Statement ($15)
**Legal basis:** Utah Code §57-8a-106 (fee cap), §57-8a-311 (statement requirements), §57-8a-206 (written statement)

**Static fields:**
- Association legal name
- Association address
- Management company name & contact
- Property address & unit number
- Owner of record
- Regular assessment amount & frequency
- Payable to (entity name for checks)
- Remit address (mailing address for payments)
- Wire transfer instructions (bank, routing, account, reference)
- Electronic payment instructions (if applicable)

**Live data fields (admin inputs per request):**
- Regular assessments through good-through date
- Past due balance
- Late fees (subject to 2025 HB 217 caps: max of greater of 10% or $50)
- Interest accrued (max 1.5%/month per HB 217 if set by rule)
- Special assessments due
- Legal/collection fees
- Fines/violation fees
- Other charges (itemized)
- Per diem rate (daily charge after good-through date)
- Good-through date
- Closing date (from requester or rush notes)

**Computed fields:**
- Total payoff amount
- Document preparation date
- Per diem calculation
- Prepared by (name, title, contact)

**Compliance notes:**
- §57-8a-106: Fee for providing payoff info cannot exceed amount in declaration, with $50 max if not specified. Must provide within 5 business days or lose lien enforcement rights at closing.
- Bill-to-closing option: Only for standalone payoff statement. Fee collected at closing per Utah practice.
- 2025 HB 217 changes: Late fee caps and interest rate caps now codified. Board can set by rule but capped at greater of 10% of assessment or $50 for late fees, and 1.5%/month for interest.

---

### 3. Lender Questionnaire ($95)
**Legal basis:** Fannie Mae Form 1076 / Freddie Mac Form 476 + Addendum 1076A/476A (post-Surfside)

**Section I — Basic Project Information:**
- Project legal name
- Project address (street, city, state, zip)
- Year built
- Total number of units in project
- Total number of phases planned / completed
- Are all common amenities complete? (Y/N)
- Type of project (condo, townhome, PUD, co-op)
- Is the project a conversion? (Y/N, conversion details)
- HOA Tax ID / EIN
- Management company name, Tax ID

**Section II — Project Completion:**
- Is the project fully complete? (Y/N)
- Number of phases planned / completed
- Number of units completed / sold
- Date control transferred from developer to HOA
- Any developer-owned units remaining? (count)

**Section III — Newly Converted/Rehabilitated (if applicable):**
- Original use of building
- Date of conversion
- Scope of rehabilitation
- Engineer/architect inspection report available (Y/N)

**Section IV — Financial Information:**
- Units delinquent 60+ days (count and percentage)
- Mortgagee responsibility for delinquent assessments on foreclosure (Y/N, duration)
- Active or pending litigation (Y/N)
  - If yes: attorney name, phone, details, documentation
  - Does litigation relate to construction defects? (Y/N)
- Current annual budget amount
- Monthly/quarterly assessment amount per unit
- Reserve fund balance
- Reserve study completed within past 3 years? (Y/N)
- Reserve study date
- Percent funded

**Section V — Ownership & Occupancy:**
- Total units
- Owner-occupied count / percentage
- Second home count / percentage
- Investor-owned/rented count / percentage
- HOA-owned units (count)
- Developer-owned units (count)
- Any single entity owning >1 unit? (list: entity name, unit count)
- Commercial space (Y/N, square footage, percentage of project)
- Non-residential use description

**Section VI — Insurance & Financial Controls:**
- Master property insurance carrier, policy number, expiration
- General liability coverage (Y/N, amount)
- Fidelity bond / crime coverage (Y/N, amount, covers all with access to funds)
- Flood zone designation (Y/N, zone)
- Flood insurance in force (Y/N, coverage amount)
- HOA maintains separate operating and reserve accounts (Y/N)
- Appropriate access controls for accounts (Y/N)
- Bank sends statements directly to HOA (Y/N)
- Two board signatures required for reserve withdrawals (Y/N)
- Independent financial review / audit conducted (Y/N, frequency)

**Addendum 1076A/476A — Building Safety (Post-Surfside, mandatory since Dec 2021):**
- Date of last building inspection by licensed architect/engineer
- Did inspection have findings related to safety/soundness/structural integrity/habitability? (Y/N)
  - If yes: have repairs been completed? (Y/N)
  - What repairs remain?
  - When will they be completed?
  - Provide copy of inspection report + board meeting minutes with action plan
- HOA aware of any deficiencies related to safety/soundness/structural integrity? (Y/N)
  - If yes: what are deficiencies? What repairs remain? Timeline?
- Outstanding violations of jurisdictional requirements (zoning, codes)? (Y/N)
  - If yes: provide notice from jurisdictional entity
- Anticipated future violations? (Y/N, details + remediation plan)
- Funding plan for deferred maintenance? (Y/N)
- Schedule for deferred maintenance repairs/replacements? (Y/N, provide schedule)
- Reserve study completed within past 3 years? (Y/N)
- Current reserve account balance
- Current special assessments (Y/N)
  - Amount, terms, purpose
- Planned special assessments (Y/N)
  - Amount, terms, purpose
- HOA loans for improvements/deferred maintenance? (Y/N)
  - Amount borrowed, repayment terms

**Addendum II (newer, post-Sept 2023 bulletins):**
- Subject to evacuation order due to unsafe conditions? (Y/N)
- Material deficiencies that could cause system failure within 1 year? (Y/N)
- Mold, water intrusion, or damaging leaks not repaired? (Y/N)
- Advanced physical deterioration? (Y/N)
- Failed mandatory jurisdictional inspections? (Y/N)

**Contact Information:**
- Preparer name, title, phone, email
- Preparer company name and address
- Date completed

---

### 4. Governing Documents ($35)
**Legal basis:** Utah Code §57-8a-227 (records availability)

**Required documents to include (pulled from Dropbox or uploaded):**
- Declaration of Covenants, Conditions & Restrictions (CC&Rs)
- Bylaws
- Articles of Incorporation
- Rules & Regulations
- Current year approved budget
- Most recent financial statement
- Most recent reserve analysis (§57-8a-227(1)(a)(ii)(D))
- Certificate of insurance for each policy (§57-8a-227(1)(a)(ii)(E))
- Most recent approved meeting minutes (§57-8a-227(1)(a)(ii)(B))
- Plat/Survey (if applicable)
- Amendments to CC&Rs (all recorded amendments)

**Cover page fields (generated):**
- Association legal name
- Property address & unit number
- Current owner
- Document list with included/missing status
- Management company contact info
- Date prepared, prepared for (requester name)
- Disclaimer / certification language

**Assembly:**
- Cover page (Typst-generated PDF)
- All available documents merged into single PDF packet
- Missing documents flagged on cover page

---

## Database Schema (New Supabase Instance)

### Core Tables
```sql
-- Multi-tenant root
tenants (
  id, name, slug, -- slug = subdomain
  stripe_account_id, -- Stripe Connect connected account
  platform_fee_percent, -- XeedlyAI's cut
  dropbox_access_token, dropbox_refresh_token,
  logo_url, primary_color, -- basic branding
  contact_email, contact_phone,
  created_at, updated_at
)

-- HOA communities managed by a tenant
associations (
  id, tenant_id FK,
  name, legal_name,
  address, city, state, zip, mailing_address,
  -- Management contacts
  manager_name, manager_email, manager_phone,
  billing_contact_name, billing_contact_email, billing_contact_phone,
  -- Payment info
  payable_to, remit_address, wire_instructions, electronic_payment_instructions,
  -- Financial
  monthly_assessment_amount, assessment_frequency,
  annual_budget_amount, reserve_balance, reserve_study_date, percent_funded,
  capital_contribution_fee, transfer_fee,
  requires_first_month_assessment,
  -- Ownership & occupancy
  total_units, owner_occupied_pct, second_home_pct, investor_owned_pct,
  commercial_space_pct,
  -- Project info
  project_type, year_built, construction_status,
  phases_planned, phases_completed,
  developer_units_remaining, hoa_owned_units,
  -- Insurance
  master_policy_carrier, master_policy_number, master_policy_expiration,
  general_liability_coverage, general_liability_amount,
  fidelity_bond, fidelity_amount,
  flood_zone, flood_insurance_in_force, flood_coverage_amount,
  -- Policies
  rental_policy, short_term_rental_policy, pet_policy, parking_policy,
  age_restrictions, right_of_first_refusal,
  -- Legal
  in_litigation, litigation_details, litigation_relates_to_defects,
  attorney_name, attorney_phone,
  -- Building safety (1076A addendum)
  last_inspection_date, last_inspection_findings,
  inspection_repairs_completed, inspection_repairs_remaining, inspection_repairs_timeline,
  known_deficiencies, deficiency_details, deficiency_repairs_remaining, deficiency_timeline,
  outstanding_violations, violation_details,
  anticipated_violations, anticipated_violation_plan,
  deferred_maintenance_funding_plan, deferred_maintenance_schedule,
  -- Addendum II
  evacuation_order, material_deficiencies_1yr, mold_water_intrusion, advanced_deterioration,
  failed_mandatory_inspections,
  -- Special assessments
  current_special_assessment, current_sa_amount, current_sa_terms, current_sa_purpose,
  planned_special_assessment, planned_sa_amount, planned_sa_terms, planned_sa_purpose,
  -- HOA loans
  hoa_loan_exists, hoa_loan_amount, hoa_loan_terms,
  -- Financial controls
  separate_operating_reserve_accounts, account_access_controls,
  bank_sends_statements_to_hoa, dual_signatures_for_reserves,
  independent_financial_review, financial_review_frequency,
  -- Tax/legal
  hoa_ein, management_company_ein,
  hoa_transfer_date, -- date control transferred from developer
  -- Dropbox
  dropbox_folder_path, -- mapped folder for governing docs
  created_at, updated_at
)

-- Individual units/lots
properties (
  id, association_id FK,
  address, unit_number, lot_number,
  owner_name, owner_email, owner_phone,
  -- Per-unit overrides (if different from association defaults)
  monthly_assessment_override,
  created_at, updated_at
)

-- Document requests (central tracking)
document_requests (
  id, tenant_id FK, association_id FK, property_id FK,
  -- Request info
  document_types text[], -- array of requested types
  requester_name, requester_email, requester_phone,
  requester_type, -- agent, lender, owner, title_company, other
  property_address, -- denormalized for display
  -- Turnaround
  turnaround, -- standard, rush
  rush_notes,
  -- Pricing
  total_price_cents,
  bill_to_closing boolean,
  -- Payment
  stripe_payment_intent_id,
  stripe_checkout_session_id,
  payment_status, -- pending, paid, refunded, bill_to_closing
  -- Workflow
  status, -- received, paid, awaiting_data, ready_for_generation, pending_review, approved, delivered, cancelled
  -- Data assembly
  auto_data jsonb, -- static data auto-populated from association/property
  live_data jsonb, -- manual data entered by admin
  missing_fields jsonb, -- fields that need admin input
  ai_validation_notes text, -- Claude's notes on data quality
  -- Approval
  reviewed_by, reviewed_at,
  approved_by, approved_at,
  -- Delivery
  file_urls text[], -- array of generated document URLs
  delivered_at,
  -- Notifications
  admin_notified_at,
  requester_notified_at,
  created_at, updated_at
)

-- Generated document files
generated_documents (
  id, document_request_id FK,
  document_type, -- which specific doc (resale_cert, payoff, etc.)
  file_url, file_name, file_type, -- pdf
  generated_at,
  generation_method, -- typst, ai_assisted
  created_at
)

-- Governing document files (synced from Dropbox or uploaded)
governing_documents (
  id, association_id FK,
  document_name, -- e.g. "CC&Rs", "Bylaws"
  document_category, -- ccrs, bylaws, articles, rules, budget, financial_statement, reserve_analysis, insurance_cert, minutes, plat, amendment
  file_url, file_name,
  source, -- dropbox, upload
  dropbox_path, -- if from Dropbox
  last_synced_at,
  created_at, updated_at
)

-- User accounts (tenant admins)
profiles (
  id, -- matches auth.users.id
  tenant_id FK,
  full_name, email, phone,
  role, -- platform_admin, tenant_admin, tenant_staff
  created_at, updated_at
)

-- Audit trail
activity_log (
  id, tenant_id, user_id,
  entity_type, entity_id, -- polymorphic ref
  action, -- created, updated, approved, delivered, etc.
  details jsonb,
  created_at
)
```

### Row Level Security
- All tables scoped by `tenant_id`
- `profiles.role = 'platform_admin'` bypasses tenant scope
- Public requester operations go through API routes (no direct Supabase client access from public form)
- RLS policies use `auth.uid()` → `profiles.tenant_id` for tenant isolation

---

## Tech Stack Details

### Document Generation Pipeline
1. **Typst** — Modern typesetting engine. Produces professional PDFs with precise typography, tables, headers, footers, page numbers. Runs as CLI (`typst compile`) from API routes. No headless browser needed.
2. **Claude API (Sonnet)** — Validates data completeness, structures messy inputs, generates summary narratives where needed, flags compliance issues.
3. **Typst templates** — One per document type. Professional legal document styling. Parameterized with structured JSON data.

### Payment
- **Stripe Connect** — Platform account (XeedlyAI) + Connected accounts (each tenant)
- `payment_intent` with `transfer_data` for automatic split
- Configurable `platform_fee_percent` per tenant
- Webhook handler for payment confirmation → status transition

### Cloud Storage Integration
- **Dropbox OAuth** per tenant — Browse folders, map to associations, pull documents on demand
- Abstraction layer (`StorageProvider` interface) for future Google Drive / OneDrive support
- Daily background job to check for stale/missing governing docs

### Notifications
- **Email** (Resend or SendGrid) — Admin notification when input needed, requester notification on delivery
- **In-app** — Real-time notification badges in admin dashboard via Supabase Realtime

---

## Phased Build Plan

### Phase 0 — Scaffold & Infrastructure
- [ ] Next.js 15 App Router project setup
- [ ] Supabase project creation + migration SQL
- [ ] Subdomain middleware (resolve tenant from `*.propertydocz.com`)
- [ ] Auth setup (Supabase Auth, tenant-scoped)
- [ ] RLS policies for all tables
- [ ] Stripe Connect setup (platform account, connect flow for tenants)
- [ ] Environment variables + Vercel configuration
- [ ] CLAUDE.md + PROMPT_PLAN.md for Claude Code sessions

### Phase 1 — Public Order Form
- [ ] Tenant-branded order form at `{tenant}.propertydocz.com`
- [ ] Association selector (scoped to tenant)
- [ ] Document type selection with pricing
- [ ] Turnaround selection (standard/rush)
- [ ] Contact info fields
- [ ] Bill-to-closing option (payoff only)
- [ ] Order summary with total calculation
- [ ] Stripe Connect checkout (auto-split payment)
- [ ] Success/confirmation page
- [ ] Email confirmation to requester

### Phase 2 — Admin Dashboard
- [ ] Tenant admin login + protected routes
- [ ] Request queue (filterable by status, type, association, date)
- [ ] Stats cards (pending, in progress, delivered, revenue)
- [ ] Request detail view with workflow status
- [ ] Live data input form (focused fields per request)
- [ ] Document preview (rendered PDF inline)
- [ ] Approve / reject / request changes actions
- [ ] Delivery action (send to requester)
- [ ] Association management (CRUD)
- [ ] Property management (CRUD, CSV import)
- [ ] Notification system (in-app + email)

### Phase 3 — Document Generation Engine
- [ ] Typst template design for all 4 document types
- [ ] Claude API integration for data validation + structuring
- [ ] Auto-populate logic (association data → document fields)
- [ ] Missing field detection
- [ ] PDF generation pipeline (JSON → Typst → PDF → Storage)
- [ ] Governing docs packet assembly (cover page + Dropbox files → merged PDF)

### Phase 4 — Dropbox Integration
- [ ] Dropbox OAuth flow for tenants
- [ ] Folder browser / mapper UI
- [ ] On-demand file pull for governing doc requests
- [ ] Daily sync job for freshness checking
- [ ] Missing document alerts

### Phase 5 — Platform Admin
- [ ] Platform admin dashboard (all tenants overview)
- [ ] Tenant onboarding flow
- [ ] Revenue split configuration per tenant
- [ ] Revenue reporting (platform cut vs tenant cut)
- [ ] Stripe Connect onboarding for new tenants

### Phase 6 — Polish & Launch
- [ ] Marketing landing page at `propertydocz.com`
- [ ] Professional email templates
- [ ] Mobile-responsive testing
- [ ] Error handling + edge cases
- [ ] Seed data for Core HOA (first tenant)
- [ ] Production deployment + DNS setup

---

## 2025 Utah Law Changes (HB 217) — Compliance Notes

The following went into effect May 7, 2025 and affect our documents:

1. **Late fee caps**: Cannot exceed the greater of 10% of the assessment amount or $50
2. **Interest rate caps**: Cannot exceed 1.5% per month (18% per annum) when set by board rule
3. **HOA Registry**: Annual renewal now required with Department of Commerce
4. **Ombudsman Office**: New Office of Homeowners' Association Ombudsman established (§13-79)
5. **Fiduciary duties codified**: §57-8a-502 now explicitly codifies board member fiduciary duties

Our payoff statement template and calculation logic must enforce these caps.

---

## Priority Order for Claude Code Sessions

1. Phase 0 (scaffold) — single session
2. Phase 1 (order form) — 1-2 sessions
3. Phase 2 (admin dashboard) — 2-3 sessions
4. Phase 3 (document generation) — 2-3 sessions (most complex)
5. Phase 4 (Dropbox) — 1 session
6. Phase 5 (platform admin) — 1 session
7. Phase 6 (polish) — 1-2 sessions
