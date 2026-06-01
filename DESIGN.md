---
name: Concrete Works
description: Quality Management and Innovation Section — concrete request & quality operations PWA
colors:
  accent-primary: "#18a0fb"
  accent-primary-hover: "#0d8ce8"
  accent-brand: "#5eb8ff"
  surface-shell: "#1e1e1e"
  surface-main: "#262626"
  surface-sidebar: "#181818"
  surface-glass: "#2c2c2c"
  surface-glass-muted: "#242424"
  ink-primary: "#ffffff"
  ink-body: "#e5e5e5"
  ink-muted: "#a3a3a3"
  ink-subtle: "#737373"
  line-default: "#383838"
  line-strong: "#4a4a4a"
  semantic-destructive: "#dc2626"
typography:
  display:
    fontFamily: "\"LINE Seed Sans\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "\"LINE Seed Sans\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "\"LINE Seed Sans\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "-0.01em"
  body:
    fontFamily: "\"LINE Seed Sans\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "\"LINE Seed Sans\", ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  card: "12px"
  shell: "16px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  page-section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent-primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-primary-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input-glass:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  glass-card:
    backgroundColor: "{colors.surface-glass}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.shell}"
    padding: "16px 20px"
  nav-item-active:
    backgroundColor: "rgba(24, 160, 251, 0.14)"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
---

# Design System: Concrete Works

## Overview

**Creative North Star: "The Pour Control Room"**

Concrete Works reads like a control room for pour operations: calm, legible, and authoritative. Surfaces are layered with tinted neutrals and restrained glass so status, volumes, and workflow steps stay scannable on a phone at a job site or on a wide desktop in the office. The system serves three balanced jobs (requests, CST/quality, ops/admin) without letting any one screen feel like a marketing dashboard.

Density follows context: compact tables and forms on desktop (`pour-desktop`, fluid type from Figma 1440), slightly larger touch targets on mobile (390-based scale). Motion confirms state (page enter, press, status pulse) rather than decorating idle screens. Four theme variants (`dark`, `light`, `green`, `pink`) swap the same token names; **dark is the default** for field and night use.

**Key Characteristics:**

- Single sans family (LINE Seed Sans) with tabular numerals for metrics, not a separate mono face
- Accent blue (`#18a0fb`) reserved for primary actions, focus rings, and current nav selection
- Glass surfaces (`pour-glass*`) with subtle borders and small shadows for cards, modals, and panels
- Semantic ink ramp (`--pour-ink-0` … `--pour-ink-3`) instead of raw gray Tailwind on colored backgrounds
- MUI primitives (buttons, inputs, dialogs) aligned to 12px radius and `textTransform: none`
- Layout breakpoints: mobile ≤767px portrait; desktop = landscape + ≥768px; wide = landscape + ≥1280px

Reject anything that fights the existing token vocabulary or reads as a generic SaaS marketing layer (gradient KPI frames, purple/indigo hero metrics, decorative gradient text).

## Colors

The palette is **restrained**: tinted dark neutrals carry most of the UI; accent blue signals action and focus. Light/green/pink variants retint the same roles for user preference, not separate brands.

### Primary

- **Operations Blue** (`#18a0fb` / `--pour-accent`): Primary buttons, focus borders, active nav, chart emphasis, links. Use on ≤15% of a typical screen.
- **Operations Blue Deep** (`#0d8ce8` / `--pour-accent-hover`): Hover/pressed primary controls.
- **Brand Sky** (`#5eb8ff` / `--pour-brand`): Wordmark highlights and secondary brand moments only, not default buttons.

### Secondary

- **Status tints** (per workflow in `STATUS_COLORS` / `--status-tint`): Card pulses and summary chips keyed to request state. Never replace the primary accent for global actions.

### Tertiary

- **Chart neutrals** (`--chart-grid`, `--chart-axis`, `--chart-label`): Recharts and dashboard axes only. Do not reuse as body text colors on main surfaces.

### Neutral

- **Shell Charcoal** (`#1e1e1e` / `--pour-bg`, `--pour-cream`): App background and shell.
- **Canvas Gray** (`#262626` / `--pour-bg-2`, `--pour-canvas`): Main column, inset panels.
- **Sidebar Ink** (`#181818` / `--pour-sidebar`): Desktop sidebar rail.
- **Glass Panel** (`#2c2c2c` / `--glass-bg`): Cards, modals, popovers; muted variant `--glass-bg-muted` for nested sections.
- **Ink Primary** (`#ffffff` / `--pour-ink-0`): Headings, primary labels, button text on accent.
- **Ink Body** (`#e5e5e5` / `--pour-ink-1`): Default reading text.
- **Ink Muted** (`#a3a3a3` / `--pour-ink-2`): Secondary metadata; minimum for large text on dark glass.
- **Ink Subtle** (`#737373` / `--pour-ink-3`): Placeholders and de-emphasized hints; never for long body copy on tinted backgrounds.
- **Line Default** (`#383838` / `--pour-line`, `--glass-border-subtle`): Dividers and card borders.
- **Destructive** (`#dc2626` / `--destructive`): Delete, errors, alert KPI when loss > 0.

### Named Rules

**The Token-Only Rule.** New screens use `var(--pour-*)` and `var(--glass-*)`. Do not introduce raw `slate-*`, `indigo-*`, or hex one-offs on dashboard or form surfaces.

**The Accent Sparingly Rule.** `#18a0fb` marks what is actionable or selected. If everything is blue, nothing is.

## Typography

**Display Font:** LINE Seed Sans (ui-sans-serif, system-ui fallbacks)  
**Body Font:** LINE Seed Sans (same stack)  
**Label/Mono Font:** LINE Seed Sans with `tabular-nums` / `tnum` (class `font-mono` is numeric styling, not a second family)

**Character:** Professional Thai/Latin UI type: medium weights for navigation, semibold for titles, relaxed line-height for forms. No display serif; no all-caps body.

### Hierarchy

- **Display** (600, `text-pour-display` ~1.5rem mobile / fluid desktop, lh 1.15): Rare page heroes only; max one per view.
- **Headline** (600, `text-pour-title` ~1.25rem, lh 1.25): Screen titles (`type.hero`).
- **Title** (600, `text-pour-lg` ~0.875rem, lh 1.45): Section headers, dialog titles (`type.title`).
- **Body** (400, `text-pour-base` ~0.75rem, lh 1.5): Forms, table cells, descriptions (`type.body`). Prose blocks cap ~65–75ch where readable.
- **Label** (500, `text-pour-2xs`–`xs`, tracking 0.08em, uppercase only for `type.overline` and short nav section labels): Eyebrows; never full sentences in caps.

### Named Rules

**The Fixed-Scale Rule.** Product UI uses the `text-pour-*` scale and pour-mobile/pour-pc fluid tokens, not marketing-style `clamp()` display headings.

**The Table Head Rule.** Table headers use `type.tableHead` (normal case, medium weight), not uppercase grid labels.

## Elevation

Depth is **glass + tonal layering**, not heavy Material shadows. Resting cards use `pour-glass` or `pour-glass-muted` with `var(--glass-shadow-sm)`. Stronger elevation appears on hover (`pour-card-lift`), dialogs (`rounded-2xl`, 16px), and pull-to-refresh chips. Shell background uses soft radial blobs (`--shell-blob-*`) behind content, not parallax decoration.

Inputs that need blur use `pour-input-glass` (24px backdrop blur on MUI outlined fields). Default form controls (`pour-form-control`) avoid transition on touch to prevent jank.

### Shadow Vocabulary

- **Glass sm** (`var(--glass-shadow-sm)`): Default card resting shadow.
- **Glass lg** (`var(--glass-shadow)`): Modals, elevated panels, mobile cards without border.
- **Status inset** (`inset 0 0 0 1px var(--status-accent)` + pulse): `StatusSummaryCard` active state only.

### Named Rules

**The Flat Form Rule.** Form fields do not animate layout or background on every keystroke; border color shifts to `--pour-accent` on focus only.

**The Reduced Motion Rule.** All `pour-page-*`, stagger, card-lift, and status pulse animations disable under `prefers-reduced-motion: reduce` (see `index.css`).

## Components

### Buttons

- **Shape:** Rounded rectangles (12px / `rounded.md`), MUI `disableElevation`, sentence case labels.
- **Primary:** `--pour-accent` fill, white text, min-height 40px default; variants `destructive`, `warning` (#d97706), `success` (#16a34a) for semantic actions only.
- **Outline / Secondary:** Outlined inherit color, glass border tokens on dense toolbars.
- **Ghost / Link:** Text buttons for tertiary actions; link variant underlined primary.
- **Hover / Focus:** MUI state + `pour-interactive` press scale on mobile; focus ring via `--pour-accent-ring` on custom controls.

### Chips

- **Style:** Status-driven pills from `StatusBadge` / request status colors; filter chips in calendars use glass border + muted text, filled accent when selected.

### Cards / Containers

- **Corner Style:** 12px (`rounded-xl` / `pour-table-shell`); modals and accordions often 16px (`rounded-2xl`).
- **Background:** `pour-glass`, `pour-glass-muted`, or `app.card` / `rq.card` patterns from `requestUi.ts`.
- **Shadow Strategy:** `glass-shadow-sm` at rest; optional `pour-card-lift` on interactive list cards.
- **Border:** 1px `var(--glass-border-subtle)`; mobile list cards may drop border and keep shadow only.
- **Internal Padding:** `space.cardPad` (20px / fluid desktop tokens).

### Inputs / Fields

- **Style:** 1.5px border `var(--glass-border-subtle)`, `var(--glass-bg)` fill, 12px radius (`glass.input` / MUI outlined).
- **Focus:** Border `var(--pour-accent)`; no default browser outline on custom pickers.
- **Placeholder:** `var(--pour-ink-3)`; verify contrast on light themes.
- **Error / Disabled:** MUI error color; destructive actions use `variant="destructive"`.

### Navigation

- **Desktop:** `DesktopSidebar` on `--pour-sidebar`; items `theme.navLink`, active `pour-nav-active-bg`.
- **Mobile:** `AppHeader` with brand wordmark; bottom-weight actions in request flows.
- **Typography:** `text-pour-md` medium for nav; section labels `type.overline` sparingly.

### Status Summary Card

- **Signature component** for request list: glass + `color-mix` status tint, optional `pour-status-border-pulse` on active filter. Icon + count + label; no gradient text on metrics.

## Do's and Don'ts

Grounded in PRODUCT.md: professional, clear, trustworthy; stay consistent with existing `--pour-*` / glass system; task-first for field and office.

### Do:

- **Do** use `--pour-ink-*` and `--glass-*` for all new UI on interactive surfaces.
- **Do** use `AppIcon` + MUI icons at consistent sizes (`xs`–`lg`) instead of ad-hoc SVG strokes.
- **Do** use `tabular-nums` / `font-mono` class for volumes, dates, and dashboard KPI values.
- **Do** respect `pour-desktop` vs mobile layouts: sidebar + top bar on landscape ≥768px; single column and `AppHeader` on mobile.
- **Do** keep primary actions verb + object in Thai or English labels ("บันทึกคำขอ", "Save changes").
- **Do** provide focus-visible styles and honor `prefers-reduced-motion`.

### Don't:

- **Don't** add styles that break consistency with the current token system (arbitrary Tailwind palette on product screens).
- **Don't** use gradient text (`bg-clip-text` + gradient) for headings or brand; use solid `pour-ink-0` or `pour-brand`.
- **Don't** ship SaaS-style KPI cards (gradient border frames, uppercase micro-labels on every metric, indigo/violet accent unrelated to `--pour-accent`).
- **Don't** put `text-slate-*` on saturated accent buttons or chart toggles; use ink on accent or dedicated on-accent tokens.
- **Don't** use colored `border-left` stripes thicker than 1px as card accents.
- **Don't** add decorative page-load choreography; motion must reflect navigation, press, or status.
- **Don't** nest glass cards inside glass cards without `pour-glass-muted` or flat `--pour-bg-2` inset to reduce visual noise.
