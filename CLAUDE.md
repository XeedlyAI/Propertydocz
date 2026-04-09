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

## Design System (XeedlyAI Standards)

Full reference: `XEEDLY_STANDARDS.md` (project root)

### Fonts
- **Inter** — all UI text, headings, body (CSS var: `--font-sans`)
- **JetBrains Mono** — all numbers, money, dates, data figures (CSS var: `--font-mono`, utility: `.font-data`)
- Configured in `src/app/layout.tsx` via `next/font/google`

### Primary Color
- Brand blue: `#38b6ff` — CTAs, active states, sidebar highlights
- Full ramp: `brand-50` through `brand-900` in globals.css

### Status Colors (Left-Border Accents Only)
| Status | Color | Class |
|--------|-------|-------|
| Urgent | `#ef4444` | `.status-urgent` |
| Attention | `#f59e0b` | `.status-attention` |
| Good | `#14b8a6` | `.status-good` |
| Info | `#38b6ff` | `.status-info` |

**Rule:** Never use full-color background fills for status. Always left-border accent.

### Shared Component Registry
| Component | Path | Usage |
|-----------|------|-------|
| PageHeader | `src/components/shared/PageHeader.tsx` | Consistent page title + subtitle + action |
| PageKpiTicker | `src/components/shared/PageKpiTicker.tsx` | KPI bar atop every dashboard page |
| PageTransition | `src/components/shared/PageTransition.tsx` | FadeUp, StaggerContainer, FadeUpChild |
| EmptyState | `src/components/shared/EmptyState.tsx` | Brand-consistent empty states |
| useCountUp | `src/hooks/useCountUp.ts` | Animated count-up for KPI numbers |
| RequestPipeline | `src/components/admin/request-pipeline.tsx` | Horizontal bar chart pipeline visualization |
| PlatformHealth | `src/components/admin/platform-health.tsx` | Revenue, turnaround, completion metrics |
| TenantHealth | `src/components/platform/tenant-health.tsx` | Per-tenant status overview |
| PlatformAlerts | `src/components/platform/platform-alerts.tsx` | Auto-generated platform alert cards |

### Admin vs Platform Accent Colors
- **Admin sidebar**: Blue `#38b6ff` — tenant operator context
- **Platform sidebar**: Purple `#8b5cf6` — platform admin context
- Both use 3px left-border active indicators and categorized nav groups

### Page Information Hierarchy
Every dashboard page follows this order:
1. **PageHeader** — title, subtitle, action button
2. **PageKpiTicker** — summary metrics
3. **Content** — cards, tables, detail views

### CSS Utilities
- `.dash-card` — card shadow + hover elevation (use on all dashboard cards), dark mode adjusted
- `.topo-bg` — topographical background pattern (landing page sections), dimmed in dark mode
- `.table-scroll-mobile` — horizontal scroll for tables on mobile
- `.font-data` — JetBrains Mono with tabular numbers
- `.status-urgent/attention/good/info` — left-border accent classes

### Landing Page Pattern
- Navbar: dark bg (#0f172a) initially, transitions to white on scroll (inline styles to avoid JIT issues)
- Footer: dark bg (#0f172a)
- Alternating section backgrounds: white (topo visible) → #f0f4f8 (cool blue-grey, opaque) → #f5f5f0 (warm grey, opaque)
- CTAs always `#38b6ff`, headings always dark slate
- Checkmarks use teal `#14b8a6` (not green)

### Mobile Optimization Patterns
- Tables: `hidden sm:table-cell` / `hidden md:table-cell` / `hidden lg:table-cell` for progressive column hiding
- Buttons: `w-full sm:w-auto`, `min-h-[44px]` touch targets
- Page headers: `flex-col sm:flex-row` for title + action stacking
- KPI tickers: 2-col grid on mobile via `PageKpiTickerMobile`
- Cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` responsive grids

### Common Debugging Patterns
- **RLS errors**: Check `tenant_id` scope, use `createServiceClient()` for cross-tenant queries
- **Tailwind JIT issues**: Use `style={{}}` for dynamic colors that JIT can't detect (especially in navbar)
- **Dark mode**: Check both themes — shadows need adjustment (`.dark .dash-card`), topo opacity reduced
- **Hydration mismatch**: Theme script in `<head>` prevents flash, use `suppressHydrationWarning`

## Reference
- Full build plan: PROPERTYDOCZ_BUILD_PLAN.md
- Build roadmap: PROMPT_PLAN.md (create during Phase 0)
- Design system: XEEDLY_STANDARDS.md
