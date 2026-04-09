# XeedlyAI Design System Standards

Universal design system shared across all XeedlyAI products (PropertyDocz, PropertyJobz). This document is the single source of truth for visual patterns, component behavior, and UX principles.

---

## Typography

| Role | Font | Usage |
|------|------|-------|
| **Sans** | Inter | All UI text, headings, body copy, labels, buttons |
| **Mono** | JetBrains Mono | All numbers, money, dates, percentages, data figures |

- Headings: Inter, `font-semibold`
- Body: Inter, `font-normal`
- Data figures: JetBrains Mono via `.font-data` or `font-mono` class
- Font features: `"cv02", "cv03", "cv04", "cv11"` for Inter; `"tnum"` for JetBrains Mono

## Color System

### Brand
| Token | Value | Usage |
|-------|-------|-------|
| Primary Blue | `#38b6ff` | CTAs, active states, links, sidebar highlights |
| Brand ramp | `brand-50` through `brand-900` | Tints and shades for hover, focus, backgrounds |

### Status Colors
| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Urgent / Danger | Red | `#ef4444` | Overdue, errors, critical alerts |
| Attention / Warning | Amber | `#f59e0b` | Due soon, needs review, caution |
| Good / Success | Teal | `#14b8a6` | Complete, on track, healthy |
| Informational | Blue | `#38b6ff` | Neutral status, in-progress, tips |

### Status Application Rules
- **Left-border accent only** — `border-left: 3px solid {color}` on cards and rows
- **Never** full-color background fills for status indication
- **Never** colored text for status — use the left border + neutral text
- Status dot (8px circle) is acceptable as a secondary indicator inside a cell
- Context line below KPI numbers may use status color at `text-[10px]` size

## Component Patterns

### KPI Ticker Bar (`PageKpiTicker`)
Compact horizontal bar at the top of every dashboard page.

- **Desktop:** Single flex row, `flex-nowrap`, cells separated by 1px borders
- **Mobile:** 2-column grid
- **Cell anatomy:** Number (JetBrains Mono, `text-lg`, `font-semibold`) → Label (`text-[11px]`, uppercase, `tracking-normal`, Inter) → Context line (`text-[10px]`, color-coded)
- **Padding:** `px-3 py-2` per cell, card has `p-0`
- **Animation:** Count-up from 0 with `easeOutCubic` over 600ms
- Optionally clickable (wraps cell in `Link`)

### Card Treatment (`.dash-card`)
Every content card on dashboards uses the `.dash-card` class.

- Subtle resting shadow: `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)`
- Hover: elevated shadow + `translateY(-1px)`
- Border radius: `var(--radius)` (0.5rem) or `rounded-xl`
- Transition: `all 0.2s ease`
- Background: `var(--card)` / `bg-card`

### Status Indicators
- Left-border accent on cards: `.status-urgent`, `.status-attention`, `.status-good`, `.status-info`
- Status dots: 8px colored circle inline with text
- Never full-row color fills

### Empty States
- Centered layout with max-width constraint
- Lucide icon in a `bg-brand-50` / `bg-accent` tinted circle (48px)
- Headline: `text-lg font-semibold`
- Description: `text-sm text-muted-foreground`, max 2 lines
- Optional CTA button in brand blue

### Page Headers (`PageHeader`)
- Title: `text-xl font-semibold`
- Optional subtitle: `text-muted-foreground text-sm`
- Optional action button slot aligned right
- Responsive: `flex-col sm:flex-row`

### Page Information Hierarchy
Every page follows this vertical order:
1. **PageHeader** — title, subtitle, action button
2. **PageKpiTicker** — summary metrics for the page
3. **Content** — cards, tables, detail views

## Animation Standards (Framer Motion)

### FadeUp (page-level)
```ts
initial: { opacity: 0, y: 10 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.35, ease: "easeOut" }
```

### Stagger Container
```ts
staggerChildren: 0.1  // 100ms between each child
```

### Count-Up Numbers
- Duration: 600ms
- Easing: `easeOutCubic`
- Start from 0, animate to target value
- Format during animation (commas, dollar signs, percentages)

### Reduced Motion
- Always check `prefers-reduced-motion`
- When reduced motion preferred: skip all animations, show final state immediately

## Mobile Optimization

| Pattern | Desktop | Mobile (< 640px) |
|---------|---------|-------------------|
| KPI Ticker | Single flex row | 2-column grid |
| Tables | Full columns visible | Hide low-priority columns, horizontal scroll via `.table-scroll-mobile` |
| Page Header | Title + action side by side | Stacked vertically |
| Cards | Grid layout | Single column stack |
| Sidebar | Visible | Collapsed/overlay |

## UX Principles

1. **Information density** — Show the maximum useful data without clutter. Every pixel earns its place.
2. **Data needs context** — A number alone is meaningless. Always pair with a label, trend, or comparison.
3. **Hierarchy over decoration** — Use spacing, weight, and size to create hierarchy. Avoid decorative elements.
4. **Progressive disclosure** — Show summary first, detail on interaction.
5. **Operator-first** — Users are busy operators on the floor, not analysts at desks. Deliver intelligence, don't require exploration.

## Navigation

### Sidebar
- Dark background (`--sidebar` / `#0C0F14`)
- Categorized sections with uppercase `text-[11px]` section labels
- Active item: brand blue text + `rgba(56, 182, 255, 0.08)` background
- Hover: subtle background shift
- Icons: Lucide, 18px, aligned left

### Landing Page
- Dark nav and footer
- Topographical background pattern (`.topo-bg`) at reduced opacity

## Do's and Don'ts

### Do
- ✅ Use left-border accents for status
- ✅ Use JetBrains Mono for every number and data figure
- ✅ Include context lines under KPI numbers
- ✅ Animate page entry with FadeUp
- ✅ Stagger card appearances
- ✅ Test every layout at 375px width
- ✅ Use `.dash-card` for all dashboard cards
- ✅ Respect `prefers-reduced-motion`

### Don't
- ❌ Use full-color background fills for status
- ❌ Use colored text for status indication
- ❌ Show numbers without labels or context
- ❌ Skip the KPI ticker on dashboard pages
- ❌ Use decorative gradients or glows on data cards
- ❌ Hardcode pixel widths — use responsive utilities
- ❌ Put animations on elements that re-render frequently
- ❌ Use Inter for data figures or JetBrains Mono for body text
