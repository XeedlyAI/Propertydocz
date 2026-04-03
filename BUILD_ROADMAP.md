# PropertyDocz — Build Roadmap

## Current Status (April 3, 2026)

Core platform is deployed and functional. Document ordering, generation, and delivery pipeline works end-to-end. Intelligent data pipeline foundation (Phase A) is in place. Next priorities are the onboarding pipeline and auto-fill system.

---

## Immediate Priorities

### Phase B — Onboarding Pipeline
**Status:** Not started
**Dependency:** Phase A (complete)

Build the initial data harvest system that runs when a management company onboards an association:

1. `/api/onboarding/harvest` endpoint — scans Dropbox folder, categorizes documents, runs AI extraction
2. AI extraction prompts per document category (CC&Rs, budget, insurance, reserve study, meeting minutes, bylaws)
3. Onboarding wizard UI: add association → map Dropbox → trigger harvest → review report
4. Bulk CSV import for associations
5. Onboarding Report review UI — admin confirms/corrects AI-extracted values
6. Progress indicator for async harvest jobs

### Phase C — Auto-Fill & Gap Analysis
**Status:** Not started
**Dependency:** Phase B

Make document requests intelligent:

1. `/api/ai/gap-analysis` endpoint — Claude assesses field completeness, flags missing/stale/suspicious values
2. Auto-fill on request creation: pull Tier 1 + Tier 2 values from `association_field_values`
3. Dropbox check for new documents since last sync, run extraction on changes
4. Gap analysis determines request status: `ready_for_review` vs `awaiting_data`
5. Write `missing_fields` from gap analysis results (replaces current static fallback)

### Phase D — Admin Review Form Redesign
**Status:** Not started
**Dependency:** Phase C

Redesign `LiveDataForm` with the three-tier confidence model:

1. All fields visible, grouped by section, color-coded by confidence (green/yellow/red)
2. Summary bar: "38 of 42 fields complete — 30 verified, 4 from documents, 4 need input"
3. Green fields: pre-filled, muted styling, "From association profile" label
4. Yellow fields: "Last verified [date]" + "Confirm Current" / "Update Value" buttons
5. Yellow with AI update: shows old vs new value, "Accept New Value" / "Keep Previous"
6. Red fields: empty, highlighted, red border
7. "Confirm All Verified" bulk action button

---

## Near-Term Features

### Stripe Connect Fix
- Debug "Failed to initiate Stripe Connect" error
- Test full payment flow with Core HOA test account
- Verify auto-split (50% platform / 50% tenant)

### Membership Backend
- Stripe Billing for recurring subscriptions
- 4 tiers from marketing site pricing page
- Usage tracking (included documents per tier)
- Overage billing
- Agent accounts with login + order history

### Document Delivery Polish
- Verify all 3 email triggers work in production (order confirmation, admin notification, document ready)
- Test signed download URL expiration
- Consider adding download tracking (who downloaded, when)

### Phase E — Continuous Sync
- Dropbox change detection (compare file list against sync log)
- Trigger extraction on new/modified files during request creation
- "Sync Now" manual trigger on association detail page

---

## Growth Features

### Agent Accounts
- Agent registration and login
- Order history and document access
- Membership tier display and usage tracking
- Saved associations / favorite properties

### Marketing Site
- Individual pages per document type (`/documents/resale-certificate`, etc.) for SEO
- Blog for content marketing ("Utah HOA resale certificate requirements", etc.)
- Meta tags, Open Graph images, structured data
- Responsive polish pass on all pages

### Core HOA Production Onboarding
- Set up real association data (not test data)
- Connect real properties
- Connect actual Dropbox with real governing documents
- Run initial data harvest
- Admin training

---

## Future Phases

### Phase F — Background Jobs
- Daily Dropbox folder scan across all tenants
- Staleness alerts in AI Advisory Feed
- Automatic re-extraction when documents are updated

### Multi-State Expansion
- State-specific compliance templates (currently Utah HB 217 only)
- State selector in document generation
- State-specific field requirements and disclosures

### API / Integrations
- Title company integrations (direct order submission)
- MLS integrations (property data auto-fill)
- Accounting system integrations (assessment/balance data)

---

## Architecture Documents

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Claude Code session rules and conventions |
| `PROPERTYDOCZ_BUILD_PLAN.md` | Original architecture and compliance specs |
| `DATA_INTELLIGENCE_ARCHITECTURE.md` | Intelligent data pipeline design (tiers, onboarding, gap analysis) |
| `BUILD_SUMMARY.md` | What's been built and current state |
| `BUILD_ROADMAP.md` | This file — what's next and in what order |
