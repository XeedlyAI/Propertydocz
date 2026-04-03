# PropertyDocz — Intelligent Data Pipeline & Onboarding Architecture

## Executive Summary

PropertyDocz currently treats every document request as a blank slate — the admin fills every field manually. This architecture transforms the platform into an intelligence layer where data is harvested once during onboarding, maintained automatically, and only the gaps require human attention.

The result: a management company onboards an association in 15 minutes (not hours), and subsequent document requests go from 40 manual fields to 2-5 fields requiring input.

---

## 1. Data Confidence Model

### Three Tiers

Every field in the system is classified into one of three confidence tiers. This classification is defined per-field, not per-request — the system always knows what tier a field belongs to.

#### Tier 1 — Static (Green)

Data that doesn't change between transactions for the same association. Set once during onboarding, reused on every request.

**Examples:**
- Association name, address, unit count, year built
- CC&R recording date, book/page numbers
- FHA/VA approval status and ID numbers
- Age restrictions, pet restrictions, rental policies
- Common amenities list
- Governing document names and recording references
- Articles of incorporation date
- Plat/survey map reference
- Commercial space percentage

**Source:** Association record in the database. Populated during onboarding via AI extraction from uploaded documents or manual entry.

**UI treatment:** Pre-filled, green dot indicator, slightly muted styling. Editable but visually de-emphasized. Label: "From association profile."

**Update frequency:** Only when CC&Rs are amended or association fundamentals change (rare — maybe once every few years).

#### Tier 2 — Periodic (Yellow)

Data that changes on a known cycle — annually, quarterly, or by calendar trigger. The system tracks when it was last verified and flags it as stale.

**Examples:**
- Monthly/quarterly assessment amount
- Current reserve fund balance
- Annual budget figures (income, expenses, funded reserves)
- Insurance certificate details and expiration date
- Reserve study date and percent funded
- Number of delinquent units, delinquency percentage
- Owner-occupied vs. investor-owned unit counts
- Special assessment details (amount, purpose, dates)
- Current litigation status and details
- Management company contact info
- Most recent meeting minutes date
- Pending capital improvements

**Source:** Association record (last known value) + Dropbox document extraction (updated values from new budget docs, insurance certs, reserve studies).

**Staleness rules:**
| Data Type | Fresh Window | Stale After |
|-----------|-------------|-------------|
| Assessment amount | 90 days | 90 days |
| Reserve balance | 60 days | 60 days |
| Budget figures | Until next fiscal year start | Fiscal year change |
| Insurance cert | Until expiration date | Expiration date |
| Reserve study | 12 months | 12 months |
| Delinquency counts | 30 days | 30 days |
| Litigation status | 30 days | 30 days |
| Meeting minutes | 90 days | 90 days |

**UI treatment:** Pre-filled with last known value. Yellow dot if within fresh window, red dot if stale. Shows "Last verified: [date]" and a one-click "Confirm Current" button. If the AI extracted an updated value from Dropbox, shows "Updated from [filename] — verify" with the new value and the old value for comparison.

**Update frequency:** Automatically refreshed when new documents appear in the Dropbox folder. Manually confirmed by admin during document request processing.

#### Tier 3 — Transaction-Specific (Red)

Data unique to this specific request that cannot be pre-filled from any source. Always requires manual input or per-request lookup.

**Examples:**
- Current owner name(s)
- Current owner mailing address
- Owner's unit-specific assessment status (current/delinquent)
- Owner's outstanding balance (for payoff)
- Owner-specific violations or compliance issues
- Owner-specific architectural modifications
- Requester information (name, email, role)
- Lender/title company information
- Specific closing date (for payoff calculations)

**Source:** Must be entered by the admin or pulled from the management company's accounting system per-request.

**UI treatment:** Empty field, red dot indicator, highlighted background. These are the fields the admin's eye should go to immediately.

---

## 2. Field Registry

A centralized field registry defines every possible field across all document types, its tier, validation rules, and which document types use it.

### Schema: `field_definitions` table

```sql
create type field_tier as enum ('static', 'periodic', 'transaction');
create type field_value_type as enum ('text', 'number', 'currency', 'date', 'boolean', 'enum', 'text_array');

create table field_definitions (
  id uuid primary key default gen_random_uuid(),
  field_key text unique not null,           -- e.g., 'association_name', 'reserve_balance'
  label text not null,                      -- e.g., 'Association Name', 'Current Reserve Balance'
  tier field_tier not null,
  value_type field_value_type not null default 'text',
  section text not null,                    -- e.g., 'general_info', 'financials', 'insurance'
  document_types text[] not null,           -- which doc types use this field: {'resale_cert', 'payoff', 'lender_questionnaire', 'governing_docs'}
  validation_rules jsonb,                   -- e.g., {"required": true, "min": 0, "pattern": "..."}
  staleness_days integer,                   -- for periodic fields: how many days before considered stale
  extraction_hints text[],                  -- keywords/patterns to help AI extract from documents
  display_order integer not null default 0, -- ordering within section
  help_text text,                           -- tooltip/guidance for admin
  created_at timestamptz default now()
);
```

### Schema: `association_field_values` table

Stores the current known values for each association, with verification tracking.

```sql
create table association_field_values (
  id uuid primary key default gen_random_uuid(),
  association_id uuid references associations(id) on delete cascade,
  field_key text references field_definitions(field_key),
  value text,                               -- stored as text, cast based on value_type
  confidence text not null default 'unverified', -- 'verified', 'ai_extracted', 'stale', 'unverified'
  source text,                              -- 'manual', 'dropbox_extraction', 'onboarding_upload', 'admin_confirmed'
  source_document text,                     -- filename if extracted from a document
  last_verified_at timestamptz,
  last_verified_by uuid references users(id),
  previous_value text,                      -- for comparison when AI updates a value
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(association_id, field_key)
);
```

---

## 3. Onboarding Pipeline

### 3.1 Tenant Onboarding Flow

When a new management company signs up:

1. **Account setup** (existing) — create tenant, admin user, basic config
2. **Connect Dropbox** (existing) — OAuth flow to link their Dropbox account
3. **Add associations** — for each association they manage:
   a. Basic info (name, address, unit count) — manual or bulk CSV upload
   b. Map Dropbox folder to association
   c. **Trigger Initial Data Harvest** (new)

### 3.2 Initial Data Harvest

This is the heavy lift that happens once per association. The system:

1. **Scans the Dropbox folder** — pulls all documents, categorizes them (CC&Rs, bylaws, budget, insurance cert, reserve study, meeting minutes, etc.)

2. **Runs AI extraction on each document category:**

   **CC&Rs / Declaration:**
   - Recording date, book/page
   - Assessment authority and limits
   - Rental restrictions, pet policies, age restrictions
   - Architectural control provisions
   - Insurance requirements
   - Amendment provisions

   **Bylaws:**
   - Board composition and terms
   - Meeting requirements (annual, special)
   - Quorum requirements
   - Voting rights

   **Current Budget:**
   - Assessment amount (monthly/quarterly/annual)
   - Total annual income
   - Operating expenses breakdown
   - Reserve fund contribution
   - Any special assessments

   **Insurance Certificate:**
   - Carrier name
   - Policy number
   - Coverage types and amounts
   - Expiration date
   - Agent contact

   **Reserve Study:**
   - Study date
   - Percent funded
   - Recommended funding
   - Major components and remaining life

   **Meeting Minutes:**
   - Most recent meeting date
   - Key decisions/votes
   - Any pending litigation mentions

3. **Populates `association_field_values`** with extracted data, all marked as `confidence: 'ai_extracted'` and `source: 'onboarding_upload'`

4. **Generates an Onboarding Report** — presented to the admin showing:
   - What was found and extracted (with source document references)
   - What's missing (documents not found, fields not extractable)
   - Confidence levels for each extraction
   - Fields requiring manual verification or input

5. **Admin reviews and confirms** — clicks through the report, verifying or correcting AI-extracted values. Each confirmation updates `confidence` to `'verified'` and sets `last_verified_at`.

### 3.3 Bulk Association Import

For management companies with many associations:

```
CSV format:
association_name, address, city, state, zip, unit_count, type, dropbox_folder_path

Upload CSV → create association records → map Dropbox folders → queue data harvest for each
```

The harvest runs asynchronously (queued job) since processing multiple associations with large document sets could take minutes. Admin sees a progress indicator: "Harvesting data for Sunset Ridge HOA... 4 of 7 documents processed."

### 3.4 API Route: `/api/onboarding/harvest`

```
POST /api/onboarding/harvest
Body: { association_id: uuid }

1. Fetch association and tenant Dropbox credentials
2. List all files in the mapped Dropbox folder
3. Download and categorize documents
4. For each document, call Claude API with extraction prompt + document content
5. Map extracted data to field_definitions
6. Upsert into association_field_values
7. Return harvest report (found, missing, confidence)
```

---

## 4. Document Request Flow (Revised)

### Current Flow
```
Request created → Status: paid → Admin manually fills all fields → Generate → Review → Deliver
```

### New Flow
```
Request created → Auto-fill triggered → AI gap analysis → Status determined → Admin reviews/fills gaps → Generate → Review → Deliver
```

### 4.1 Auto-Fill on Request Creation

When a new document request is created (after checkout):

1. **Pull all Tier 1 fields** from `association_field_values` for the association — these are always current
2. **Pull all Tier 2 fields** — check staleness against `last_verified_at` and the field's `staleness_days`
3. **Check Dropbox for new documents** since the last sync — if found, run extraction to update Tier 2 values
4. **Merge into `live_data`** on the document request record
5. **Run AI gap analysis** (see 4.2)

### 4.2 AI Gap Analysis

After auto-fill, call Claude to assess completeness:

```
POST /api/ai/gap-analysis
Body: { request_id: uuid }

Prompt to Claude:
"You are reviewing a {document_type} request for {association_name}. 
Here are the fields required for this document type: {field_list_with_tiers}
Here are the current values: {live_data}
Here are the staleness dates: {verification_dates}

Assess:
1. Which required fields are missing entirely?
2. Which fields have values but are stale (last verified before their staleness window)?
3. Which fields have values that seem inconsistent or suspicious?
   (e.g., reserve balance of $0, delinquency count higher than unit count, 
   insurance expired, assessment amount unusually low/high for the unit count)
4. Are there any compliance concerns for Utah HB 217?

Return a JSON object:
{
  missing_fields: string[],           // field_keys with no value
  stale_fields: string[],             // field_keys past staleness window  
  suspicious_fields: [{               // field_keys with questionable values
    field_key: string,
    current_value: string,
    concern: string
  }],
  compliance_flags: string[],         // any HB 217 concerns
  completeness_score: number,         // 0-100
  recommended_status: 'ready_for_review' | 'awaiting_data',
  summary: string                     // human-readable assessment
}
```

### 4.3 Status Determination

Based on the gap analysis:

- **completeness_score >= 90 AND no missing Tier 3 fields** → Status: `ready_for_review`
  - All fields populated, admin just needs to verify and generate
- **completeness_score < 90 OR missing Tier 3 fields** → Status: `awaiting_data`
  - Admin needs to fill gaps before generating

### 4.4 Admin Review Form (Redesigned)

The form now shows ALL fields for the document type, organized by section, with visual confidence indicators.

**Top summary bar:**
```
┌────────────────────────────────────────────────────────────┐
│  Resale Certificate — Sunset Ridge HOA                     │
│  38 of 42 fields complete                                  │
│  ● 30 verified  ● 4 from documents  ● 4 need input        │
│  Completeness: 90%                                         │
└────────────────────────────────────────────────────────────┘
```

**Field rendering by confidence:**

```
● Green (verified/static)
  ┌─────────────────────────────────────────┐
  │ 🟢 Association Name                     │
  │ ┌─────────────────────────────────────┐ │
  │ │ Sunset Ridge HOA                    │ │ ← slightly muted, editable
  │ └─────────────────────────────────────┘ │
  │ From association profile                │
  └─────────────────────────────────────────┘

● Yellow (periodic, needs confirmation)
  ┌─────────────────────────────────────────┐
  │ 🟡 Current Reserve Balance              │
  │ ┌─────────────────────────────────────┐ │
  │ │ $245,000.00                         │ │ ← highlighted border
  │ └─────────────────────────────────────┘ │
  │ Last verified: Jan 15, 2026 (78 days)  │
  │ [Confirm Current] [Update Value]       │
  └─────────────────────────────────────────┘

● Yellow with AI update
  ┌─────────────────────────────────────────┐
  │ 🟡 Monthly Assessment                   │
  │ ┌─────────────────────────────────────┐ │
  │ │ $415.00  (was $385.00)              │ │ ← shows old vs new
  │ └─────────────────────────────────────┘ │
  │ Updated from "2026 Budget.pdf" — verify│
  │ [Accept New Value] [Keep Previous]     │
  └─────────────────────────────────────────┘

● Red (missing / transaction-specific)
  ┌─────────────────────────────────────────┐
  │ 🔴 Owner Name(s)                        │
  │ ┌─────────────────────────────────────┐ │
  │ │                                     │ │ ← empty, red border
  │ └─────────────────────────────────────┘ │
  │ Required — enter owner information     │
  └─────────────────────────────────────────┘

● Red (suspicious value)
  ┌─────────────────────────────────────────┐
  │ 🔴 Reserve Balance                      │
  │ ┌─────────────────────────────────────┐ │
  │ │ $0.00                               │ │ ← flagged
  │ └─────────────────────────────────────┘ │
  │ ⚠ AI flag: Reserve balance of $0       │
  │   seems incorrect for a 48-unit assoc. │
  │ [Confirm Value] [Update]               │
  └─────────────────────────────────────────┘
```

**"Confirm All Verified" button:** For admins who trust the static/periodic data, one-click to confirm all green/yellow fields so they can focus on reds.

---

## 5. Dropbox Continuous Sync

### 5.1 Periodic Refresh

Beyond the initial harvest, the system should periodically check for new documents:

- **On document request creation:** Always check for new files since last sync
- **Daily background job (future):** Scan all connected Dropbox folders for changes, run extraction on new/modified files, update `association_field_values`
- **Manual trigger:** Admin can click "Sync Now" on the association detail page

### 5.2 Document Change Detection

Track what's been synced:

```sql
create table document_sync_log (
  id uuid primary key default gen_random_uuid(),
  association_id uuid references associations(id),
  dropbox_file_id text,
  dropbox_path text,
  file_name text,
  category text,                    -- 'ccrs', 'budget', 'insurance', 'reserve_study', etc.
  file_hash text,                   -- to detect modifications
  last_synced_at timestamptz,
  extraction_status text,           -- 'pending', 'completed', 'failed'
  extracted_fields jsonb,           -- which fields were extracted from this doc
  created_at timestamptz default now()
);
```

When syncing:
1. List files in Dropbox folder
2. Compare against `document_sync_log` — identify new and modified files
3. For new/modified files: download, extract, update `association_field_values`
4. Mark `extraction_status = 'completed'`

---

## 6. Database Changes Summary

### New Tables
- `field_definitions` — field registry with tiers, validation, extraction hints
- `association_field_values` — current known values per association per field
- `document_sync_log` — tracks Dropbox file sync and extraction status

### Modified Tables
- `tenants` — no changes needed
- `associations` — add `onboarding_status` enum ('pending', 'harvesting', 'review', 'complete')
- `document_requests` — add `completeness_score` integer, `gap_analysis` jsonb

### New Enums
- `field_tier`: static, periodic, transaction
- `field_value_type`: text, number, currency, date, boolean, enum, text_array
- `onboarding_status`: pending, harvesting, review, complete

---

## 7. Implementation Phases

### Phase A — Field Registry & Data Model (Foundation)
1. Create `field_definitions` table and seed with all fields across all 4 doc types, classified by tier
2. Create `association_field_values` table
3. Create `document_sync_log` table
4. Add columns to `associations` and `document_requests`
5. Build admin UI for viewing/editing field definitions (platform admin only)

### Phase B — Onboarding Pipeline
1. Build `/api/onboarding/harvest` endpoint
2. Build AI extraction prompts per document category (CC&Rs, budget, insurance, etc.)
3. Build onboarding wizard UI: add association → map Dropbox → trigger harvest → review report
4. Build bulk CSV import for associations
5. Build the Onboarding Report review UI (admin confirms/corrects extracted values)

### Phase C — Auto-Fill & Gap Analysis
1. Build `/api/ai/gap-analysis` endpoint
2. Modify document request creation flow to trigger auto-fill
3. Pull Tier 1 and Tier 2 values from `association_field_values` into `live_data`
4. Run gap analysis and set status accordingly
5. Write `missing_fields` from gap analysis results

### Phase D — Admin Review Form Redesign
1. Redesign `LiveDataForm` to show all fields with confidence indicators
2. Implement green/yellow/red visual treatment
3. Build "Confirm Current" one-click for yellow fields
4. Build "Accept New Value / Keep Previous" for AI-updated fields
5. Build "Confirm All Verified" bulk action
6. Build top summary bar with completeness score

### Phase E — Continuous Sync
1. Build Dropbox change detection (compare file list against sync log)
2. Trigger extraction on new/modified files during request creation
3. Update `association_field_values` with new extractions
4. Build "Sync Now" manual trigger on association detail page

### Phase F — Background Jobs (Future)
1. Daily Dropbox folder scan across all tenants
2. Staleness alerts in the AI Advisory Feed
3. Automatic re-extraction when documents are updated

---

## 8. AI Extraction Prompt Strategy

Each document category gets a tailored extraction prompt. The prompt includes:

1. The document content (PDF text or image)
2. The list of `field_definitions` relevant to that category (with `extraction_hints`)
3. The association's existing data (so AI can detect changes, not just extract)
4. Instructions to return structured JSON mapping field_keys to extracted values

**Example prompt for a budget document:**

```
You are extracting financial data from an HOA annual budget document.

Association: {association_name}
Document: {filename}

Extract the following fields if present. Return ONLY a JSON object mapping field keys to values. If a field is not found in the document, omit it from the response.

Fields to extract:
- monthly_assessment: Current monthly assessment amount per unit (look for: "assessment", "dues", "monthly fee")
- annual_budget_total: Total annual budget (look for: "total budget", "total income", "total revenue")
- reserve_contribution: Annual reserve fund contribution (look for: "reserve", "replacement fund", "capital reserve")
- operating_expenses: Total annual operating expenses (look for: "operating", "total expenses")
- special_assessment_amount: Any special assessment (look for: "special assessment", "one-time charge")
- special_assessment_purpose: Purpose of special assessment
- fiscal_year_start: Start of fiscal year (look for: "fiscal year", "budget period")
- fiscal_year_end: End of fiscal year

Current known values for comparison:
{existing_values}

If you detect a value that differs from the current known value, include both in your response:
{ "field_key": { "new_value": "...", "previous_value": "...", "source_reference": "page X, section Y" } }

Return only valid JSON. No explanation or commentary.
```

---

## 9. Migration Path from Current State

The existing associations (Sunset Ridge, Mountain View) already have some data in their association records. The migration:

1. Seed `field_definitions` with all fields
2. For existing associations, migrate their current data into `association_field_values` with `confidence: 'verified'` and `source: 'manual'`
3. Re-run Dropbox sync for existing associations to fill any gaps
4. Existing document requests continue to work — the `live_data` column is unchanged, the new system just provides a smarter way to populate it

---

## 10. Success Metrics

- **Onboarding time:** A new association should go from "no data" to "80%+ fields populated" in under 15 minutes (Dropbox harvest + admin review)
- **Per-request admin effort:** Average fields requiring manual input should drop from 35-40 to under 5 for repeat associations
- **Data accuracy:** AI-extracted values should match admin-verified values 90%+ of the time
- **Request turnaround:** Time from request creation to document delivery should decrease by 60%+
