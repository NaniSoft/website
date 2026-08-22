# Cybersecurity Data Lake & Knowledge Graph — Landing Page Design

**Date:** 2026-08-17
**Working brand name:** Sentinel Lake
**Status:** Approved (brainstorming → spec)

---

## 1. Purpose

A single-page marketing site that introduces Sentinel Lake to enterprise security leaders and converts them into demo requests. The page must:

- Position the product as a unified, temporal, queryable model of the enterprise security surface.
- Immediately demonstrate the platform through a live "Command Center" hero and an interactive Knowledge Graph section.
- Convey trust and authority for a B2B security audience.
- Work flawlessly in both dark and light themes.

Out of scope: blog, docs, pricing logic, real auth, real backend, form submission, SEO scaffolding beyond basic meta. Everything is presentational/visual except the demo-request CTA which posts to a placeholder endpoint.

---

## 2. Tech stack

- **Framework:** Next.js 14 (App Router) + TypeScript.
- **UI library:** Ant Design (`antd`) v5 with `ConfigProvider` for theming (light = `defaultAlgorithm`, dark = `darkAlgorithm`).
- **Icons:** `@ant-design/icons`.
- **Graph visualization:** `react-force-graph-2d` (canvas-based, performs well to ~500 nodes, dark/light friendly).
- **Charts:** `recharts` (sparklines, trend chips in stat strip).
- **Styling:** antd tokens + a small amount of CSS Modules for one-off gradients/glows. No Tailwind.
- **State:** React + URL hash for active KG node. Theme persisted to `localStorage`.
- **Animation:** `framer-motion` for scroll-in fades and the hero parallax (≤16 px translate). Reduced-motion respected.

---

## 3. Information architecture

A single route `/` composed of 11 vertical sections. Each is a self-contained React component.

| # | Section | Component |
|---|---|---|
| 1 | Sticky top nav with theme toggle | `components/TopNav.tsx` |
| 2 | Hero with live Command Center mock | `components/Hero.tsx` |
| 3 | Logo cloud | `components/LogoCloud.tsx` |
| 4 | Problem statement (3 cards) | `components/Problem.tsx` |
| 5 | Platform overview (4-step flow + 6 feature grid) | `components/Platform.tsx` |
| 6 | Interactive Knowledge Graph | `components/KnowledgeGraph.tsx` |
| 7 | AI Agents in action (chat + result) | `components/Agents.tsx` |
| 8 | Use cases (3 large cards) | `components/UseCases.tsx` |
| 9 | Integrations grid | `components/Integrations.tsx` |
| 10 | Testimonial + metrics | `components/Testimonial.tsx` |
| 11 | Final CTA + footer | `components/FinalCTA.tsx` |

All data (logos, feature copy, integrations, sample graph nodes/edges, chat transcripts) lives in `lib/data.ts` as typed constants. No hard-coded copy inside components.

---

## 4. Design system

### 4.1 Typography

- Display / headings: **Inter Display** weights 500/600/700.
- Body: **Inter** 400/500.
- Mono (IDs, hashes, timestamps, query snippets): **JetBrains Mono** 400/500.
- Scale: 72 / 56 / 40 / 28 / 20 / 16 / 14 px. Body line-height 1.6, headings 1.1–1.2.

Loaded via `next/font/google` with `display: 'swap'`.

### 4.2 Color tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F7F9FC` | `#0A1020` | page background |
| `bg-elev` | `#FFFFFF` | `#111A2E` | cards, panels |
| `bg-sunken` | `#F0F4FA` | `#0E152A` | mock surfaces, code blocks |
| `border` | `#E5EAF2` | `#1E2A44` | dividers, card edges |
| `text` | `#0B1726` | `#E6ECF5` | primary text |
| `text-muted` | `#56627A` | `#8A98B0` | secondary text |
| `primary` | `#1E5BFF` | `#3B82F6` | CTAs, links, focus |
| `accent` | `#00C2D6` | `#22D3EE` | highlights, graph nodes |
| `success` | `#10A48B` | `#34D399` | positive deltas |
| `warning` | `#D08C1A` | `#F59E0B` | policy nodes |
| `danger` | `#D43A3A` | `#F87171` | alerts, errors |

All text/bg pairs verified to ≥4.5:1 (AA).

### 4.3 Visual language

- Radii: cards 12 px, inputs 8 px, pills 999 px.
- Borders: 1 px solid `border`.
- Shadows: 24 px blur, 8% black (light) / 24% black (dark), y-offset 8.
- Gradients: subtle blue-50 → white in light hero; rich radial `#0A1020 → #112048` with two 16% cyan glows in dark hero.
- Motion: 200 ms ease-out on hover, 400 ms on scroll-in fade. No spring overshoot.
- Iconography: `@ant-design/icons` + 6 custom 1.5 px line illustrations (graph, funnel, agent spark, shield, clock, plug) drawn in `primary` color.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.

### 4.4 Antd theme

```
// light
algorithm: theme.defaultAlgorithm
token: { colorPrimary: '#1E5BFF', borderRadius: 8, colorBgLayout: '#F7F9FC', fontFamily: 'Inter, sans-serif' }
// dark
algorithm: theme.darkAlgorithm
token: { colorPrimary: '#3B82F6', borderRadius: 8, colorBgLayout: '#0A1020', fontFamily: 'Inter, sans-serif' }
```

Components used throughout: `Layout`, `Menu`, `Button`, `Card`, `Tag`, `Tabs`, `Tooltip`, `Avatar`, `Progress`, `Statistic`, `Table`, `Timeline`, `Segmented` (theme toggle), `Input`, `Input.TextArea`, `Modal`, `Drawer`, `FloatButton` (mobile theme toggle).

### 4.5 Knowledge Graph palette

Node colors per entity type:
- `User` — `accent` (cyan)
- `Service` — `primary` (blue)
- `DataAsset` — `#8B5CF6` (violet)
- `Policy` — `warning` (amber)
- `Event` — `text-muted` (gray)
- `Identity` — `#EC4899` (pink)

Edge colors: 30% opacity of source node color. "Hot paths" rendered at 100% opacity with a 1.5 px stroke.

---

## 5. Hero (in detail)

**Layout:** Two columns ≥1024 px, stacked below. `min-h: calc(100vh - 64px)`. 96 px top padding, 64 px bottom.

**Background:**
- Dark: radial gradient `#0A1020 → #112048` + two soft cyan glows (`rgba(34,211,238,0.16)`) positioned at 30%/30% and 80%/70%.
- Light: `#F7F9FC → #FFFFFF` + single 8% blue wash from the top-left.

**Left column (5/12):**
1. **Eyebrow Tag** with pulsing cyan dot: "Security Knowledge Graph · v2.4".
2. **H1:** "See every asset, identity, and event in one temporal model." (56/72 px, weight 700, line-height 1.1).
3. **Subhead:** "Sentinel Lake unifies IT, HR, IAM, cloud, and security telemetry into a single queryable graph — and lets AI agents answer your hardest forensic questions in seconds." (20 px, muted, max 540 px).
4. **CTAs:** primary "Request a demo" (filled, 48 px), secondary "Watch 2-min walkthrough" (outlined, play icon, 48 px).
5. **Trust row:** "Trusted by security teams at" caption + 4 grayscale customer logos (24 px tall).
6. **Inline metrics row:** 3 dividers, mono 14 px — "12 B events/day", "47 M entities", "<200 ms p95 query".

**Right column (7/12) — Command Center mock:**
A 1 px-bordered card, 24 px radius, soft shadow. Contains four sub-panels:

1. **Top stat strip** (full width, 56 px): 4 `Statistic` cells.
   - Entities `12.4M` (delta +1.2%)
   - Events/sec `2,140` (delta +3.8%)
   - Policies `1,287` (delta +0.4%)
   - Active queries `34` (delta −2)
   Each cell includes a 24 px trend sparkline and a small `Tag` (green/red) for the delta.

2. **Center canvas** (`flex: 1`, ~640 × 380): the live Knowledge Graph.
   - ~80 nodes, color-coded per §4.5.
   - A few "hot paths" drawn brighter.
   - 3–4 nodes pulse with a soft glow.
   - Background `bg-sunken`.
   - Floating toolbar top-right (zoom in, zoom out, reset, filter, export) — antd `Button` with `type="text"` and icons.

3. **Right rail (160 px) — Node inspector preview:** static snippet showing a sample selected node "Sarah Chen — Senior Engineer" with role, last access time, 3 connected-entity `Tag` chips. On hover over a graph node this preview updates to that node (no click required for hero).

4. **Bottom chat panel** (collapsible, 200 px docked): styled as a chat.
   - Header: "Sentinel AI" `Avatar`, small "thinking" indicator on first load.
   - Two pre-canned messages:
     - User: "Where is the Q3 financial model stored, and who has accessed it in the last 30 days?"
     - Agent: "The file `s3://finance-prod/q3-2026/model.xlsx` is classified **Confidential** under policy `FIN-PII-007`. In the last 30 days, 4 identities accessed it: Sarah Chen, Mark Patel, the `etl-pipeline` service, and a deprecated `etl-backup` credential. Click any node to inspect." + small mini-graph thumbnail.
   - Input row: `Input.TextArea` (auto-resize 1–3 lines) + send `Button`.

**Motion:** the mock has a subtle scroll parallax (translateY −16 px at top → 0 px at bottom). The mock scales to fit the viewport on smaller screens; the chat panel collapses to a single preview line below tablet.

---

## 6. Interactive Knowledge Graph section

Full-width, `bg` background (or `bg-elev` in dark mode for contrast). 96 px vertical padding.

**Layout:** section heading on top (H2 "Explore the live graph", 40 px), a short subhead, and the canvas below. The canvas is `min-height: 640px`, full container width, with a side `Drawer` (antd) sliding in from the right when a node is clicked, showing the full inspector view (replaces the static one in the hero).

**Data:** ~120 nodes spanning all 6 entity types, ~280 edges, with at least 3 visible "hot paths" highlighted. Data is in `lib/data.ts` as a typed `GraphData` object.

**Interactions:**
- Pan, zoom, drag nodes.
- Click a node → opens the side `Drawer` with full details (description, attributes table, 10 most recent events, connected entities).
- Filter chips at the top of the canvas: `All / Users / Services / Data / Policies / Events / Identity`. Selecting one fades non-matching nodes to 20% opacity.
- Search input (top-left): filters nodes by name; matching nodes glow, others dim.
- Reduced-motion: disables the pulse animation.

---

## 7. AI Agents in action

Two-column split (6/6 on desktop, stacked on mobile).

**Left — chat transcript:** A vertical timeline of 3 pre-canned exchanges, each with a different question type to showcase capability breadth:
1. **Sensitive data location:** "Where is the Q3 financial model stored, and who has accessed it in the last 30 days?"
2. **Blast radius:** "If the `okta-prod` service account is compromised, what data could an attacker reach?"
3. **Compliance at time T:** "On March 14 at 02:00 UTC, was access to `customer-pii/` by `svc-etl` compliant with `FIN-PII-007`?"

Each exchange: user message bubble (right-aligned, primary), agent response bubble (left-aligned, bg-elev) with embedded graph mini-view or compliance timeline thumbnail.

**Right — result panel:** a sticky card showing the agent's output for the currently selected question (default = #1). Includes a graph mini-view (small `react-force-graph-2d` instance, ~280 × 240), a 3-bullet summary, and a "View in graph" link that scrolls to §6 with the relevant nodes pre-selected.

`Segmented` control above the section lets users pick which question to feature.

---

## 8. Use cases

3 large cards in a 3-column grid (stacks on mobile). Each card:
- 240 px illustration tile at the top (mini graph or UI screenshot, custom SVG, dark-bg).
- Headline (24 px, 600 weight).
- 3 bullets (16 px, muted).
- "Read the full story →" link in `primary`.

Cards:
1. **M&A due diligence** — graph, IT/HR unification, evidence export.
2. **Incident response** — blast-radius, timeline reconstruction, access replay.
3. **Continuous compliance** — policy-as-code, time-travel audit, control evidence.

---

## 9. Integrations

Section heading "Connects to every source your security team already runs." 4 × 4 grid of integration tiles (16 tiles + 1 "and 40+ more" tile). Each tile: 40 px logo, name, one-line category (`Cloud`, `Identity`, `SIEM`, `ITSM`, etc.). Logos rendered as inline SVG (no external requests). The "and 40+" tile uses a dashed border and a `+40` label.

The full integrations list: AWS, Azure, GCP, Okta, Active Directory, ServiceNow, Jira, Splunk, CrowdStrike, Snowflake, Workday, GitHub, Datadog, Slack, Salesforce, Zendesk, + 40 more.

---

## 10. Testimonial + metrics

A 2/3 + 1/3 split on a `bg-elev` panel.

**Left (2/3):** large pull-quote (28 px, 500 weight) with a small "❝" mark, attribution (name, title, company logo), 5-star visual.

**Right (1/3):** 3 stacked `Statistic` cells with mono numbers:
- "85% faster M&A diligence"
- "60% less time on audit prep"
- "12× more entities correlated"

Below the section: a small "Read all customer stories →" link.

---

## 11. Final CTA + footer

**Final CTA:** centered, 96 px vertical padding. H2 "Bring every signal into one model." Two buttons: primary "Request a demo" (filled), secondary "Talk to sales" (outlined). Small "or start a free 14-day pilot" link below.

**Footer:** 4 link columns (Product, Solutions, Resources, Company) + brand block on the left (logo, tagline, social icons). Bottom row: copyright, legal links (Privacy, Terms, Security, Status), theme toggle mirror.

---

## 12. Theming implementation

A `ThemeProvider` client component wraps the entire app. It:
- Reads initial theme from `localStorage.sentinel-theme` (default `system`).
- Subscribes to `prefers-color-scheme` when in `system` mode.
- Sets `data-theme="dark|light"` on `<html>` so CSS variables resolve.
- Wraps children in antd's `ConfigProvider` with the right algorithm and token map.
- Exposes `useTheme()` returning `{ theme, setTheme, resolved }`.

A `Segmented` control in the nav (icon-only on mobile) lets users switch `light / dark / system`. The choice persists and is reflected immediately (no flash — the initial value is read in a `<script>` tag in `app/layout.tsx` before hydration).

---

## 13. Accessibility

- All interactive elements reachable by keyboard; focus rings use 2 px `primary` outline with 2 px offset.
- Color contrast ≥4.5:1 for text, ≥3:1 for large text and UI components.
- Knowledge Graph has a parallel text-list view (toggle "Show as list", always available, not optional) for screen readers and keyboard users. The list view shows the same nodes/edges as a sortable, filterable antd `Table`.
- The chat panel transcript is marked up as a `role="log"` `aria-live="polite"`.
- Reduced-motion media query disables parallax, pulse animations, and scroll fades.
- Skip link to main content at the top of the page.
- `prefers-reduced-motion` honored for the graph and hero.

---

## 14. Performance budget

- First contentful paint < 1.5 s on simulated 4G.
- Time to interactive < 3.5 s.
- Total JS shipped < 400 KB gzipped (amended 2026-08-18 from 350 KB after the Task 8 fix round confirmed the antd cssinjs chunk is forced into the initial bundle by above-the-fold Hero/TopNav usage and cannot be reduced via component-local edits; antd v5 ships ES modules so unused components are tree-shaken automatically; the graph lib loaded with `next/dynamic` and `ssr: false` so it doesn't bloat the initial bundle).
- No layout shift on load (CLS < 0.05).
- Lighthouse scores: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90 on both themes.

---

## 15. Project structure

```
/
├── app/
│   ├── layout.tsx          # root layout, fonts, theme bootstrap
│   ├── page.tsx            # composes the 11 sections
│   ├── globals.css         # CSS variables, resets
│   └── api/
│       └── demo-request/route.ts  # placeholder POST handler
├── components/
│   ├── TopNav.tsx
│   ├── Hero.tsx
│   ├── LogoCloud.tsx
│   ├── Problem.tsx
│   ├── Platform.tsx
│   ├── KnowledgeGraph.tsx
│   ├── Agents.tsx
│   ├── UseCases.tsx
│   ├── Integrations.tsx
│   ├── Testimonial.tsx
│   ├── FinalCTA.tsx
│   ├── CommandCenter.tsx        # the hero mock
│   ├── ChatPanel.tsx
│   ├── KGCanvas.tsx             # wraps react-force-graph-2d
│   ├── NodeInspector.tsx
│   └── icons/                   # custom line illustrations
├── lib/
│   ├── data.ts                  # all static content
│   ├── graph-data.ts            # KG nodes/edges
│   └── theme.ts                 # antd token maps
├── public/
│   └── (no external assets; all SVG inline)
├── next.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

---

## 16. Implementation phases (to be detailed in the plan)

1. **Scaffold** — Next.js + TS + antd, theme provider, fonts, base CSS variables.
2. **Layout shell** — top nav, page composition, footer, theme toggle.
3. **Hero + Command Center mock** — stat strip, chat panel, mock graph (static first, then interactive).
4. **Sections 3–5** — logo cloud, problem, platform overview.
5. **Interactive Knowledge Graph section** — full canvas, filters, search, drawer.
6. **Agents section** — chat transcript, result panel, segmented control.
7. **Sections 8–10** — use cases, integrations, testimonial.
8. **Final CTA + footer** — wrap-up.
9. **Polish** — motion, parallax, reduced-motion, accessibility audit, perf budget check, cross-theme QA.

---

## 17. Out of scope / non-goals

- Real backend, real auth, real form submission (CTA posts to a placeholder route that 200s with a thank-you message).
- Pricing page, blog, docs, careers, legal pages beyond footer links.
- Multi-language (English only).
- A/B testing infrastructure.
- Real customer logos (all customer/company references are placeholder; will be swapped on real customer commitments).
- Real KG data (graph is hand-curated sample data illustrating the concept).
