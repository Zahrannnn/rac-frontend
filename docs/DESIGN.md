---
version: alpha
name: RAC-DAMP
description: Institutional M&E platform design — UNIDO blue + orange identity, bilingual RTL/LTR, data-dense but calm, eye-comfort type.
colors:
  primary: "#0072A8"
  secondary: "#F58220"
  brand-blue: "#009EDB"
  shell: "#004E77"
  tertiary: "#2F9E6B"
  neutral: "#F4F7F9"
  surface: "#FFFFFF"
  text-primary: "#22303E"
  text-secondary: "#5B6B7C"
  border: "#DFE7EE"
  success: "#2F9E6B"
  warning: "#E8A13D"
  danger: "#C0534A"
  info: "#009EDB"
  ai-accent: "#7C4DBF"
  primary-hover: "#00587F"
  secondary-hover: "#D96B10"
  shell-hover: "#003D5F"
  on-primary: "#FFFFFF"
  row-selected: "#E1F3FB"
typography:
  h1:
    fontFamily: Cairo
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: "1.25"
    letterSpacing: "0em"
  h2:
    fontFamily: Cairo
    fontSize: 1.375rem
    fontWeight: 700
    lineHeight: "1.3"
  h3:
    fontFamily: Cairo
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: "1.35"
  body-lg:
    fontFamily: Cairo
    fontSize: 1.0625rem
    fontWeight: 400
    lineHeight: "1.65"
  body-md:
    fontFamily: Cairo
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: "1.65"
  body-sm:
    fontFamily: Cairo
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: "1.55"
  label-caps:
    fontFamily: Cairo
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: "1.4"
    letterSpacing: "0.06em"
  kpi-number:
    fontFamily: Cairo
    fontSize: 2rem
    fontWeight: 700
    lineHeight: "1.1"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    typography: "{typography.body-md}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    size: "1px solid {colors.secondary}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-shell:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-shell-hover:
    backgroundColor: "{colors.shell-hover}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ai-action:
    backgroundColor: "{colors.ai-accent}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  badge-status-verified:
    backgroundColor: "#DFF2FB"
    textColor: "#00587F"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    typography: "{typography.label-caps}"
  badge-status-selected:
    backgroundColor: "#DDEFE6"
    textColor: "#1E5B3D"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    typography: "{typography.label-caps}"
  badge-status-reserved:
    backgroundColor: "#FBEEDA"
    textColor: "#7A5210"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    typography: "{typography.label-caps}"
  badge-status-blocked:
    backgroundColor: "#F9E4E2"
    textColor: "#8F2D26"
    rounded: "{rounded.full}"
    padding: "2px 10px"
    typography: "{typography.label-caps}"
  badge-status-neutral:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  kpi-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "16px"
  data-table-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    height: "48px"
  data-table-row-selected:
    backgroundColor: "{colors.row-selected}"
    textColor: "{colors.text-primary}"
    height: "48px"
  sidebar:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.on-primary}"
    width: "240px"
  sidebar-item-active:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  alert-warning:
    backgroundColor: "#FDF3E3"
    textColor: "#8A5A14"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  alert-ai-insight:
    backgroundColor: "#F3EDFB"
    textColor: "#4A2D73"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  progress-track:
    backgroundColor: "{colors.border}"
    textColor: "{colors.text-primary}"
    height: "8px"
    rounded: "{rounded.full}"
---

## Overview

RAC-DAMP is a bilingual (Arabic RTL default / English LTR) monitoring & evaluation platform for a
UNIDO/NOU/EED program. The visual identity follows the UNIDO brand: a **deep UNIDO-blue shell**
(sidebar + login panel, #004E77) with **UNIDO blue #0072A8 as the action color** and **orange
#F58220 as the secondary accent** (highlights, key emphasis — used sparingly), white content cards
on a cool light-grey canvas, and semantic status colors used sparingly and consistently. Type is
Cairo throughout, sized up and with relaxed line-heights for eye comfort over long field/admin
sessions.

Three principles govern every screen:

1. **Data density without noise** — this is a working M&E tool (tables, wizards, KPI walls). Whitespace
   is generous between cards, disciplined inside them.
2. **Bilingual first** — every component must work in RTL and LTR. Never hardcode `left`/`right`;
   use logical properties. Cairo typeface covers both scripts; Western digits for data, Arabic-Indic
   only in prose where the client requests.
3. **Calm authority** — one accent per screen purpose. AI features get purple; decisions get blue;
   orange marks brand emphasis only; statuses get green/amber/red. Nothing else competes.

## Colors

- **Primary (#0072A8)** — UNIDO blue, darkened from the brand blue for AA contrast on white. The
  single interaction color: primary buttons, links, active states, focus rings, progress fill.
  If an element is clickable, it is probably this blue.
- **Brand blue (#009EDB)** — the UNIDO logo blue (Pantone 2925 C). Non-text brand accents: active
  nav items, progress bars, info icons, selected-row tints. Too light for white-on-blue text.
- **Shell (#004E77)** — deep UNIDO blue. Sidebar, login panel, table headers, page-title tint.
  Replaces the earlier institutional navy while keeping the same structural role.
- **Secondary (#F58220)** — UN-orange accent for brand emphasis: section highlights, key callouts,
  secondary buttons (outline). Never used for status, and never competing with warning amber.
- **Tertiary / Success (#2F9E6B)** — "Selected", "Completed", "Assessed", "Handover Complete".
- **Warning (#E8A13D)** — "Reserved", pending validations, due follow-ups. Amber, distinct from
  the orange brand accent.
- **Danger (#C0534A)** — skill-gap severity, failed validations, deactivation. Used for *state*,
  never for decoration.
- **AI accent (#7C4DBF)** — reserved exclusively for the AI layer: insight cards, NL-query chat,
  "Generate Training Plan". Purple = machine-generated, per the mockups.
- **Neutral canvas (#F4F7F9)** with white cards and softened text (#22303E instead of near-black)
  keeps 8-hour admin sessions legible without harsh contrast.

Status badge mapping: Selected/Completed = success · Reserved/Pending = warning ·
Verified/Surveyed = info · Neutral/draft = neutral pill.

## Typography

**Cairo** (Google Fonts) for everything — it is the standard Arabic UI face with excellent Latin
coverage, so RTL/LTR switching never changes the type system. Weights: 400 body, 600 headings/subtle
emphasis, 700 page titles and KPI numbers. Type is tuned for **eye comfort**: body sizes step up
from the old 0.875rem base to 0.9375rem, line-heights are relaxed to 1.65/1.55, and body text uses
softened ink (#22303E) rather than near-black.

- `kpi-number` (2rem/700) — dashboard KPI cards; the number is the hero.
- `label-caps` — badges, table column headers, stepper labels; 0.06em tracking, no caps-transform
  for Arabic (letter-spacing must be zeroed in RTL).
- Body sizes step 0.9375rem → 1.0625rem; never below 0.8125rem for data tables (field teams on tablets).

## Layout

Fixed 240px deep-blue sidebar + 56px topbar (hamburger, governorate/global filters, language toggle,
user menu). Content area max 1440px, 24px gutters. KPI card grids: 4-up desktop, 2-up tablet,
1-up large-mobile. Survey wizard: sticky step list on the left (collapses to a top stepper on
mobile). Data tables: 48px rows, sticky header, pagination footer ("Showing 1–5 of 200").

RTL: the sidebar sits on the **right** in Arabic, on the left in English; tables, steppers and
breadcrumbs mirror; icons with directional meaning (arrows, progress) flip; brand mark and media
do not.

## Elevation & Depth

Three levels only: resting cards, dropdowns/popovers, modals. All shadows use UNIDO-blue-tinted
`rgba(0,78,119,…)` rather than pure black — keeps depth warm on the grey canvas. Focus rings:
2px `{colors.secondary}` offset ring, never removed.

## Shapes

Radius scale 4 / 8 / 12 / full. Cards and modals 12px; inputs and buttons 8px; badges and
progress tracks fully rounded. No exceptions — the mockups show soft, rounded institutional UI.

## Components

- `button-primary` is the UNIDO blue; at most one visible per view region. `button-secondary`
  (orange outline) for supporting/brand actions; destructive actions are `button-danger` with confirm dialog.
- Status is communicated by `badge-status-*` pills — never by color alone (they carry text labels:
  "Selected", "Reserved" — accessibility + Arabic legibility).
- `kpi-card` holds `kpi-number` + `label-caps` + trend delta; clicking drills down (SRS rule:
  KPI → governorate → workshop → technician).
- `alert-ai-insight` wraps all AI output, always paired with a human-action button
  ("Generate Training Plan") and never auto-executes anything — the SRS forbids AI decisions.
- Tables use row-selected tint instead of bold hover effects; GPS/photo evidence renders as
  thumbnail chips linked to full records.

## Do's and Don'ts

**Do**
- Use logical CSS properties (`margin-inline-start`, `inset-inline-end`) everywhere.
- Keep one primary action per region; everything else outline/ghost.
- Pair every status color with a text label (color-blind safe, RTL safe).
- Show data timestamps and audit info in `body-sm` grey — traceability is a product feature.
- Reserve purple strictly for AI surfaces.

**Don't**
- Don't use red as decoration or for non-errors.
- Don't use the orange accent for status or warnings — status is green/amber/red only.
- Don't introduce a second accent color per module — the whole platform shares this palette.
- Don't hardcode directional values or assets that can't mirror in RTL.
- Don't render KPI numbers that can't be drilled into (SRS: every figure traces to the database).
- Don't let AI cards look like system errors or approvals — insight, not authority.
