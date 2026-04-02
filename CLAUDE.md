# CLAUDE.md — PropertyDocz

## Project Overview
PropertyDocz is a multi-tenant HOA document ordering and fulfillment platform. HOA Management Companies (tenants) use it to process document requests from agents, lenders, title companies, and property owners. Each tenant gets a branded subdomain portal. Stripe Connect handles automatic revenue splitting between the platform (XeedlyAI) and the tenant.

**Repo:** `XeedlyAI/coredocs` (will rename to `propertydocz`)
**Domain:** `propertydocz.com` — wildcard subdomains for tenants (`corehoa.propertydocz.com`)
**Deployed via:** Vercel (auto-deploy from main branch)

## Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Database:** Supabase (new dedicated instance)
- **Auth:** Supabase Auth (email/password, tenant-scoped)
- **Payments:** Stripe Connect (platform + connected accounts)
- **UI:** shadcn/ui + Tailwind CSS v4
- **State:** TanStack Query (server state), Zustand (client state if needed)
- **Document Generation:** Typst (CLI, server-side PDF rendering)
- **AI:** Claude API (Sonnet) for data validation and document assembly
- **Cloud Storage:** Dropbox OAuth (per-tenant, for governing doc sync)
- **Email:** Resend (transactional emails)
- **Icons:** Lucide React

## Git Rules
- Always work on `main` branch
- Always commit and push to `main`
- Always commit and push to main after completing any task. Never leave unpushed work.
- Worktrees are fine — they are hardcoded into Claude Code behavior. Clean up old worktrees each session.
- No feature branches unless explicitly requested

## Build & Verify Rules
- **DO NOT** run `npm run dev` — dev server does not work in this environment
- **DO NOT** open browser previews — Chrome is broken on the dev machine
- **DO** verify changes via `npm run build` — if it builds, it ships
- Vercel auto-deploys from main on push
- Run Supabase migrations manually via Supabase SQL Editor (not CLI)

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # Public-facing routes (order form, success)
│   ├── (admin)/            # Tenant admin routes (protected)
│   ├── (platform)/         # Platform admin routes (protected)
│   ├── api/                # API routes
│   │   ├── documents/      # Document generation endpoints
│   │   ├── stripe/         # Stripe Connect webhooks + checkout
│   │   ├── dropbox/        # Dropbox OAuth + file operations
│   │   └── notifications/  # Email sending
│   ├── layout.tsx
│   └── middleware.ts       # Subdomain → tenant resolution
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── forms/              # Order form, data input forms
│   ├── admin/              # Admin dashboard components
│   └── shared/             # Shared layout components
├── lib/
│   ├── supabase/           # Supabase client, types, helpers
│   ├── stripe/             # Stripe Connect helpers
│   ├── documents/          # Document generation logic
│   │   ├── templates/      # Typst template files (.typ)
│   │   ├── generate.ts     # PDF generation pipeline
│   │   └── validate.ts     # Claude API data validation
│   ├── dropbox/            # Dropbox API helpers
│   ├── pricing.ts          # Pricing constants and calculations
│   ├── types.ts            # Shared TypeScript types
│   └── utils.ts            # General utilities
├── hooks/                  # React hooks
└── styles/                 # Global styles
```

## Multi-Tenant Architecture
- Tenant resolved from subdomain in middleware (`corehoa.propertydocz.com` → tenant slug `corehoa`)
- All database queries scoped by `tenant_id`
- RLS policies enforce tenant isolation at the database level
- Public order form requires no auth — goes through API routes
- Admin routes require Supabase Auth + tenant membership check
- Platform admin bypasses tenant scope (role: `platform_admin`)

## Document Types & Pricing
| Document | Price | Rush (+$50) | Bill to Closing |
|----------|-------|-------------|-----------------|
| Resale Certificate | $99 | Yes | No |
| Payoff Statement | $15 | Yes | Yes (standalone only) |
| Governing Documents | $35 | Yes | No |
| Lender Questionnaire | $95 | Yes | No |

Rush fee applies once per order, not per document.

## Document Request Workflow
```
received → paid → awaiting_data → ready_for_generation → pending_review → approved → delivered
                                                                                  → cancelled (any stage)
```
Three human pause points:
1. **awaiting_data** — Admin fills in live data (payoff balances, violations, etc.)
2. **pending_review** — Admin reviews generated PDF before delivery
3. **approved → delivered** — Admin triggers delivery to requester

## Utah Legal Compliance (Critical)
- **Payoff Statement fee:** Capped per §57-8a-106. Must provide within 5 business days.
- **Late fees:** Max of greater of 10% of assessment or $50 (2025 HB 217)
- **Interest:** Max 1.5%/month when set by board rule (2025 HB 217)
- **Resale Certificate:** Must include all items per §57-8a-227 including reserve analysis, insurance certs, recent minutes
- **Lender Questionnaire:** Must cover full Fannie Mae 1076 + Addendum 1076A + Addendum II fields
- **Governing Docs:** Must include declaration, bylaws, minutes, budget, financial statement, reserve analysis, insurance certs per §57-8a-227
- **Bill to closing:** Only for standalone payoff statement
- **SSN/bank account redaction:** Required per §57-8a-227(1)(b)

## Environment Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe Connect
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Claude API
ANTHROPIC_API_KEY=

# Dropbox
DROPBOX_APP_KEY=
DROPBOX_APP_SECRET=

# Resend (email)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_DOMAIN=propertydocz.com
```

## Coding Conventions
- Use `async/await` everywhere, no raw `.then()` chains
- Server components by default, `"use client"` only when needed
- Supabase queries in server components or API routes, not client-side (except real-time subscriptions)
- All monetary values stored in cents (integer), displayed in dollars
- Dates stored as ISO 8601 in UTC, displayed in user's timezone
- Use `zod` for all form validation and API input validation
- Prefer server actions for mutations from authenticated pages
- Use TanStack Query for data fetching in client components
- Error boundaries at route segment level

## Prompt Preferences
- Focused single-task prompts over large omnibus prompts
- Revert-and-rebuild over iterative patching after a first failed attempt
- Grounded, data-based analysis — no unsupported superlative claims or motivational rhetoric
- When in doubt, ask before assuming

## Reference
- Full build plan: PROPERTYDOCZ_BUILD_PLAN.md
- Build roadmap: PROMPT_PLAN.md (create during Phase 0)
