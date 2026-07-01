# PROPERTYDOCZ_DELTAS.md — PropertyDocz overrides on the XeedlyAI standards library

Per the library's `conventions/DELTAS-PATTERN.md`: this file documents intentional divergence. Where it's silent, the library (`..\standards`) governs. PropertyDocz **is the canonical default brand** (primary `#38b6ff`, Inter + JetBrains Mono, standard status ramp) — so the deltas here are minimal and mostly product structure.

Created 2026-07-01 (standards-consolidation Wave 4), absorbing the product-specific parts of the retired `XEEDLY_STANDARDS.md` era; its generic content lives in the library (UX Principles now in `standards/DESIGN_SYSTEM.md` §0).

## True deltas

- **`--color-status-success: #22c55e` (green) exists in globals.css** while canon "good" is teal `#14b8a6`. UI convention (and CLAUDE.md) says checkmarks use teal — treat the green var as legacy; prefer teal. Candidate cleanup.
- **Multi-tenant surfaces:** PropertyDocz loads the tenancy layer — subdomain-per-tenant routing, tenant RLS, platform-admin impersonation (`impersonate_tenant_id` cookie, dual `getAdminUser`/`getPlatformUser` in `src/lib/auth.ts`). Use the library preset `presets/multi-tenant-platform.md`, NOT the base platform preset.

## Product structure (PropertyDocz-specific, not canon)

### Shared Component Registry
| Component | Path | Usage |
|---|---|---|
| PageHeader | `src/components/shared/PageHeader.tsx` | Page title + subtitle + action |
| PageKpiTicker | `src/components/shared/PageKpiTicker.tsx` | KPI bar atop every dashboard page |
| PageTransition | `src/components/shared/PageTransition.tsx` | FadeUp, StaggerContainer, FadeUpChild |
| EmptyState | `src/components/shared/EmptyState.tsx` | Brand-consistent empty states |
| useCountUp | `src/hooks/useCountUp.ts` | Animated KPI count-up |
| RequestPipeline | `src/components/admin/request-pipeline.tsx` | Pipeline visualization |
| PlatformHealth | `src/components/admin/platform-health.tsx` | Revenue, turnaround, completion |
| TenantHealth | `src/components/platform/tenant-health.tsx` | Per-tenant status overview |
| PlatformAlerts | `src/components/platform/platform-alerts.tsx` | Auto-generated platform alerts |

### Admin vs Platform accent
- Admin sidebar: blue `#38b6ff` (tenant operator context); Platform sidebar: purple `#8b5cf6` (platform admin context). Both 3px left-border active indicators.

### Common debugging patterns
- RLS errors → check `tenant_id` scope; `createServiceClient()` for cross-tenant queries
- Tailwind JIT → `style={{}}` for dynamic colors (especially navbar)
- Dark mode → check both themes; `.dark .dash-card` shadow adjust, topo opacity reduced
- Hydration mismatch → theme script in `<head>`, `suppressHydrationWarning`
