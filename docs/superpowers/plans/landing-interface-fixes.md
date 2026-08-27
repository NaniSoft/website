# Plan — Fix nanisoft landing-page interface review findings

Fixes the 10 HIGH + 5 in-cap MEDIUM findings from the `better-interface` review
(verdict: Block). Excluded LOW/MEDIUM findings are out of scope unless named in
a task. Work on branch `fix/landing-interface-review`.

## Global Constraints

- **Stack:** Next.js 16.3.1 App Router, React 19, antd 6.6.1, `@ant-design/icons`.
  Styling = semantic CSS custom properties in `apps/landing/app/globals.css` +
  inline `style` props + per-component `<style>` JSX. **No Tailwind.** Tokens
  come from `@nanisoft/identity` (`color`, `font`, `radius`, `easing`); antd
  theme mapped in `apps/landing/components/theme/tokens.ts`.
- **Brand rules (identity lock):** jade (`--color-accent` `#14A77A`) is reserved
  for **live/active states ONLY**, never decorative. teal (`--color-secondary`
  `#2A8C97`) = supporting marks. Shape lock: card radius 20 / inner 12 / button
  pill. No purple, no neon, no pure black, no pure white.
- **No raw hex in components.** Any new color value is either an existing
  `@nanisoft/identity` value or a new role token declared in `globals.css`
  (with an identity-name comment, like the existing tokens). Components consume
  tokens via `var(--…)`; the canvas in `HeroDag.tsx` reads tokens via
  `getComputedStyle().getPropertyValue('--…')` (extend `readTokens` there, do
  not hardcode hex).
- **prefers-reduced-motion** must be honored for any new/changed motion. The
  global guard in `globals.css` already kills CSS animations/transitions; JS
  motion must check `matchMedia('(prefers-reduced-motion: reduce)')`.
- **Do not break tests.** Keep both green before committing:
  - `pnpm --filter @nanisoft/landing exec vitest run` (a11y, theme, hero,
    architecture-section, page, data suites)
  - `pnpm --filter @nanisoft/landing exec playwright test --config playwright.overflow.config.ts`
- **320px / 200% zoom law:** no horizontal page overflow at any viewport; the
  Playwright overflow gate enforces this — keep it passing.
- **Contrast:** any text/UI/focus color pair must meet WCAG: 4.5:1 for body &
  small text, 3:1 for large text and UI components/strokes/focus indicators.
  Compute and verify ratios for every pair you change.
- **Follow existing patterns.** Inline styles + `<style>` JSX; semantic tokens
  via `var()`. Improve code you touch the way a good dev would, but don't
  restructure beyond the task.

## Task 1: Color contrast role tokens

Fixes review findings **1, 5, 8** (HIGH). Root cause: the mode-invariant
brand hues (teal `#2A8C97`, jade `#14A77A`) fail required contrast on the
surfaces they're actually used on. Introduce per-surface role tokens and
repoint consumers; do not retune the identity brand values themselves.

**Declaring the tokens (in `apps/landing/app/globals.css`):**
- `--color-secondary-on-dark: #4DB0BB;` — lighter teal for teal-as-text or
  teal-as-UI-stroke on petrol-family dark surfaces. Declare it in the
  `[data-theme='dark']` block AND in the `.hero` block (the hero is dark in
  both page modes and uses teal). Add the identity-name comment
  `/* role: lighter teal for dark surfaces */`.
- `--color-accent-strong: #0E8A62;` — darker jade for jade active strokes on
  LIGHT surfaces (where `#14A77A` reads 2.87:1). Declare in `:root` only.
  Comment `/* role: darker jade for active strokes on light */`.
- `--color-focus` — a per-mode focus-indicator color that passes 3:1 against
  BOTH the page background AND a primary-button fill in that mode (focusable
  controls sit on both). Declare in `:root` (light) and `[data-theme='dark']`
  and `.hero`. Recommended starting values to verify: light `#1F6E78`
  (darkened teal — verify ≥3:1 on bone `#F4EFE6`, bone-elev `#FBF7EF`, AND on
  the petrol primary-button fill `#0C2A33`); dark `#4DB0BB` (verify ≥3:1 on
  petrol `#0C2A33`, petrolMid `#15414A`, AND on the bone-elev primary-button
  fill `#FBF7EF`). If a single value cannot pass on both the page bg and the
  button fill in a mode, choose the page-bg pair (the global rule covers most
  controls) and leave antd's own button focus for buttons — note it in the
  report. Do not reintroduce the gray antd ring for non-button controls.

**Repointing consumers:**
- `globals.css` `:focus-visible` (lines ~118-122): change
  `outline: 2px solid var(--color-secondary)` → `var(--color-focus)`.
- `Hero.tsx` `.hero-eyebrow` (line ~93): change
  `color: var(--color-secondary)` → `var(--color-text-muted)` (this is the
  cheaper reuse — `#8FB0B6` on petrol = 6.49:1, pass; no new token needed for
  the eyebrow). Keep it on `--color-text-muted`.
- `ArchitectureSection.tsx` `strokeFor()` (lines ~51-53) and the arrowhead
  marker fill (lines ~164-168): active stroke on a LIGHT surface must use
  `var(--color-accent-strong)`; done stroke on a DARK surface must use
  `var(--color-secondary-on-dark)`. The section background is the page bg
  (light or dark per theme), so the stroke color must follow the resolved
  theme. Simplest correct approach: derive the two stroke values from CSS
  vars that already flip per mode — declare `--color-accent-strong` in
  `:root` and a mode-aware `--color-secondary-on-dark` only in dark; for the
  active stroke use `var(--color-accent-strong, var(--color-accent))` and for
  the done stroke use `var(--color-secondary-on-dark, var(--color-secondary))`
  so light falls back to brand jade/teal only where they pass (verify: brand
  jade on light bg-elev = 2.87:1 FAILS, so the active stroke MUST use
  `--color-accent-strong` in light — do not fall back to jade in light). If
  the fallback approach is ambiguous, instead pass the resolved stroke colors
  into the SVG via CSS custom properties set on the section root per theme.
  Whatever approach: verify the active and done strokes pass 3:1 in BOTH
  modes against `--color-bg-elev`.
- `UseCases.tsx` `STATUS_TAG.available` (lines ~17-25): change the tag text
  color from `var(--color-secondary)` → `var(--color-text)`; keep the
  `color-mix(in srgb, var(--color-secondary) 14%, transparent)` background as
  the status cue. The label text "Flagship · available today" already carries
  meaning, so this is not color-alone. Verify the new text pair passes 4.5:1
  in both modes.

**Verify:** compute and state the contrast ratios for every changed pair in
both modes. Run both test commands (vitest + playwright overflow). Note:
existing `tests/theme.test.tsx` may assert token values — update assertions
only if they reference tokens you changed, and only to match the new values.

## Task 2: Skip link, TopNav narrow-width, Footer placeholders

Fixes review findings **2, 3, 4** (HIGH) + the excluded MEDIUM **nav pill 6px
overflow** + excluded LOW **footer headings are `<div>`**.

- **Skip link (`apps/landing/app/page.tsx:14`):** delete the inline
  `style={{ position: 'absolute', left: -9999 }}` attribute entirely. The CSS
  in `globals.css:124-131` (`a[href="#main"]:not(:focus) { left:-9999px;
  position:absolute }` + the focused styles) already implements the correct
  off-screen-until-focused pattern; the inline style was defeating it. Verify
  with the dev server / Playwright that focusing the link brings it on-screen.
- **TopNav narrow-width (`apps/landing/components/TopNav.tsx`):** below 1024px
  the three primary nav links are `display:none` with no replacement, leaving
  `<nav aria-label="Primary">` empty. Fix: keep the three short in-page anchor
  links visible at narrow widths instead of hiding them. They are short
  ("Platform", "Use cases", "Integrations" ~220px) and fit at 320px once the
  tagline is hidden at 768px. Replace the `@media (max-width:1023px){
  .top-nav-links{display:none!important} }` rule with a responsive treatment
  that keeps them visible and legible (e.g. reduce gap, allow the links row to
  sit on its own line, or let the header wrap). Do NOT add a hamburger menu
  unless the links genuinely cannot fit — verify at 320px, 640px, 768px,
  1023px, 1024px that nothing clips and the page has no horizontal overflow.
  Also fix the `@media (max-width:639px)` wrap fallback so the
  toggle+pill group does not overflow: at 320px the pill's right edge currently
  lands ~6px past the viewport. Allow the inner group (`gap:12`) to wrap, or
  reduce its gap / the pill's horizontal padding at ≤639px so the group's
  min-content fits. Verify `scrollWidth <= clientWidth` at 320px.
- **Footer placeholders (`apps/landing/components/Footer.tsx` + `lib/data.ts`
  `FOOTER_LINKS`):** all footer links are `href="#"` and labels promise
  pages/offerings that don't exist. Fix by deleting placeholder entries that
  have no real destination and keeping only links to content that exists. The
  real in-page/playground anchors available are: `#platform`, `#use-cases`,
  `#integrations`, and `https://playground.nanisoft.com` (external, new tab,
  `rel="noopener noreferrer"`). Restructure `FOOTER_LINKS` to reflect real
  destinations only (e.g. a "Product" column with Platform/Use cases/
  Integrations as in-page anchors and an external "Open the playground" link);
  remove columns/labels for offerings the site never substantiates ("AI
  Agents", "M&A diligence", "Incident response", "Continuous compliance",
  "Identity governance", "Docs", "Customer stories", "Security & trust",
  "Changelog", "About", "Careers", "Press", "Contact"). For the bottom legal
  row (`Privacy`/`Terms`/`Security`/`Status`), if no real pages exist, render
  them as non-interactive `<span>`s (styled like the current links) rather
  than `href="#"` anchors — OR remove them. Pick one and be consistent; do not
  leave `href="#"` anchors. Also: change the four footer column headings from
  `<div>` to `<h2>` (or `<h3>` if you judge the footer sub-level) so they enter
  the page outline; keep heading order coherent (no level skip).

**Verify:** Run vitest (the a11y test may assert footer/skip behavior — update
if needed) and the playwright overflow suite. Use Playwright MCP (text
snapshot + `browser_evaluate` for rects/scrollWidth; NO screenshots — the
model cannot process images) to confirm: skip link appears on focus; nav
links are visible at 320/640/768; no horizontal overflow at 320; footer has no
`href="#"` anchors.

## Task 3: Codename → real-product honesty

Fixes review findings **9, 10** (HIGH). The page's most trust-relevant detail
— which names are real OSS and which are nanisoft codenames — is currently
neither honestly labeled in Integrations nor legibly rendered in Architecture.

- **Integrations (`apps/landing/components/Integrations.tsx` + `lib/data.ts`
  `STACK_PRODUCTS`):** `STACK_PRODUCTS` lists nanisoft codenames (Trailhead,
  Forge, Bedrock, Overlook, Blueprint, Watchtower, Anchor, Conveyor)
  identically to real OSS products (Airbyte, OPA, Superset, …) under the
  heading "Sixteen proven open-source products carry the platform" and the
  claim "Every off-the-shelf product runs unmodified". This misleads about
  build-vs-buy. Fix: add a `realName` field to the codename entries in
  `STACK_PRODUCTS` (the `@nanisoft/architecture` model already carries the
  codename→real-product mapping — read it from there, e.g.
  `packages/architecture/src/components.ts`, do not invent names). Render the
  real product name under the codename in the Integrations card (a secondary
  muted line in the mono data face is the established pattern — see how
  `ArchitectureSection.tsx:277-289` renders codename + realName). Adjust the
  section heading/intro copy so it no longer implies all sixteen are
  off-the-shelf (e.g. distinguish "open source we compose" from "what we call
  the pieces"). Keep the "Built in-house" (`BUILT_IN_HOUSE`) block as-is —
  those are the four nanisoft builds.
- **Architecture chips (`apps/landing/components/ArchitectureSection.tsx:283-289`):**
  the `realName` `<text>` is rendered at `fontSize: 8` and squeezed via
  `textLength`/`lengthAdjust`, below the readable floor. Fix: raise it to
  ≥12px and drop the `textLength` squeeze (let it clip or reduce chip label
  count if needed), OR delete the realName `<text>` line entirely if the
  codename + the SVG `<desc>` are sufficient. Choose the option that keeps the
  chip legible at the SVG's rendered size; verify the realName is readable at
  1280px and at 200% zoom. Do not introduce raw hex.

**Verify:** Run vitest (data.test may assert STACK_PRODUCTS shape — update the
type in `lib/types.ts` if you add `realName`, and update data.test if it
asserts the array length/shape). Run the overflow suite. Confirm via Playwright
text snapshot that realName renders in Integrations and Architecture chips are
legible (NO screenshots — use `browser_evaluate` to read computed font-size and
the rendered text content).

## Task 4: HeroDag reduced-motion static "live" cue

Fixes review finding **6** (HIGH) + excluded LOW **hero canvas blank without
JS**.

- **`apps/landing/components/hero/HeroDag.tsx`** — under `reduce === true`
  (motion==='settled') the draw loop never paints jade: `active` is always
  false, `liveNode` is empty, every node fills muted/teal. Jade is the brand's
  live/active signal and the moving wavefront is the only thing that ever
  paints it — so under reduced motion the "live" state is carried by motion
  alone with nothing left behind (escalation trigger). Fix: in the settled
  branch of `draw()` (or in a path that runs when `reduce` is true), paint one
  static jade cue so "live" is conveyed without motion. Recommended: a jade
  ring on the terminal `Compass` hub (reuse the existing hub-ring stroke path
  at lines ~374-380 with `live = true` for Compass when reduced) plus a small
  static jade dot or a short "live" text label near Compass. No new animation,
  no rAF — one extra paint in the settled frame only. Keep jade reserved for
  this live cue (brand rule). Verify with `emulateMedia({ reducedMotion:
  'reduce' })` that a jade pixel is present in the settled frame.
- **No-JS fallback (excluded LOW U8):** the hero's right column is a blank
  dark panel without JS. Add a `<noscript>` block (or a static element behind
  the canvas) with a short text fallback — e.g. "A live pipeline diagram runs
  here with JavaScript enabled." — styled in the hero token colors, so the
  column isn't an empty hole. Keep it hidden when JS is on.

**Verify:** Run vitest (hero.test may need updating if it asserts the settled
frame). Use Playwright `browser_evaluate` + `emulateMedia reducedMotion:reduce`
to confirm: `data-motion="settled"`, rAF not running, AND a jade pixel present
(NO screenshots). Confirm the `<noscript>` fallback is present in the DOM.

## Task 5: ArchitectureSection — scroll cue, reduced-motion track, caption live region

Fixes review findings **7, 12, 13** (HIGH + 2 MEDIUM). All in
`apps/landing/components/ArchitectureSection.tsx`.

- **Horizontal-scroll cue (finding 7):** the 900px-min-width SVG sits in an
  `overflowX:'auto'` box that is 255–837px wide on viewports ≤~924px; the
  right-side chips (Compass/Atlas/OPA) are reachable only past a scroll edge
  with no visible cue. Add a right-edge affordance on the scroll box: a
  `::after` gradient fade (from transparent to `--color-bg-elev`) plus an
  inline "→" cue that hides once `scrollLeft + clientWidth >= scrollWidth -
  1`. Implement the cue as a CSS `::after` on the scroll box or an absolutely
  positioned element; toggle its visibility via a scroll listener (reuse the
  existing scroll-rAF hook) or a CSS-only approach if feasible. Verify the cue
  shows at 320/640px and hides when scrolled to the end.
- **Reduced-motion track (finding 12):** `height: '320vh'` is unconditional
  and `position: sticky` remains under reduced motion, so reduced-motion users
  scroll ~1817px of sticky content whose animation never plays. Fix: when
  `reduced` is true, render the final state as a normal block — set the track
  height to `'auto'` and drop `position: sticky` (render the inner panel in
  normal flow). Keep the full four-phase end-state visible (content is not
  removed). Verify the section height collapses under reduced motion.
- **Caption live region (finding 13):** the phase caption re-mounts per phase
  (`key={activeIdx}`) but is not a live region, so the scroll-driven narration
  is silent to AT. Wrap the caption row in a stable `role="status"`
  (`aria-live="polite"`) container that is always present; update the text
  inside it. You may drop the `key` remount (let text update in place) — which
  also removes the per-phase `arch-caption-in` fade replay (addresses excluded
  LOW U6). Keep the SVG `role="img"` title/desc as-is.

**Verify:** Run vitest (architecture-section.test may assert track height or
caption — update if needed) and the overflow suite. Use Playwright
`browser_evaluate` + `emulateMedia reducedMotion:reduce` to confirm: track
height is auto under reduce; `aria-live` present on the caption wrapper;
scroll-cue element visible at 320px and hidden at scroll end (NO screenshots).

## Task 6: Type system tokens

Fixes review finding **11** (MEDIUM, systemic) + excluded LOWs **T7 uppercase
tracking variance, T8 missing `-moz-osx-font-smoothing`, T9 card body 15/16
mix, T10 no negative tracking on display h2s**.

- **Declare a type scale + heading tokens in `apps/landing/app/globals.css`**
  (mode-invariant, in `:root`): a small named scale anchored at 16px (ratio
  ~1.2–1.25), e.g. `--text-xs: 12px; --text-sm: 14px; --text-base: 16px;
  --text-md: 18px; --text-lg: 20px; --text-xl: 22px; --text-2xl: 40px;
  --text-display: 48px;` plus `--lh-heading: 1.15; --lh-tight: 1.06;
  --tracking-upper: 0.16em; --tracking-display: -0.015em;`. Map the existing
  ad-hoc px values onto these tokens. Add `text-wrap: balance` to headings and
  `text-wrap: pretty` to lead/description paragraphs via a small set of helper
  classes or inline (addresses excluded MEDIUM T6).
- **Apply across components:** replace inline `fontSize: <px>` values with the
  matching token in `Hero.tsx`, `Problem.tsx`, `Platform.tsx`,
  `UseCases.tsx`, `Integrations.tsx`, `FinalCTA.tsx`, `TopNav.tsx`,
  `Footer.tsx`, `ArchitectureSection.tsx` (section h2 40 → `--text-2xl`;
  card h3 20/22 → `--text-lg`/`--text-xl`; body 15/16 → `--text-base`; etc.).
  Standardize section h2 `line-height` to `--lh-heading` (fixes the four h2s
  that inherit body 1.6). Add `--tracking-display` to display h2s/h1.
  Standardize uppercase mono labels to `--tracking-upper` (hero-eyebrow .22,
  arch band .16, arch caption .14 → all `--tracking-upper`).
- **FinalCTA (`FinalCTA.tsx`):** replace antd `Typography.Title level={2}`
  with a raw `<h2>` using `--text-display` + `--lh-heading` + `--tracking-display`,
  matching the other section h2s' element + treatment.
- **`globals.css` body:** add `-moz-osx-font-smoothing: grayscale;` alongside
  the existing `-webkit-font-smoothing: antialiased;`.
- **Card body consistency:** ensure all card body copy uses `--text-base`
  (fixes the 15/16 mix in Platform/Integrations).

Keep the change mechanical: this is a token introduction + find/replace, not a
redesign. Do not change any rendered size meaningfully (the tokens should map
to the existing px values). Verify the page looks unchanged at 1280px (use
`browser_evaluate` to read computed font-sizes before/after if needed — NO
screenshots).

**Verify:** Run vitest (a11y/theme tests may snapshot styles — update if
needed) and the overflow suite. Confirm no horizontal overflow and heading
order intact.

## Task 7: Copy + visual cohesion

Fixes review findings **14** (jargon, MEDIUM), **15** (cohesion, MEDIUM) +
excluded LOWs **W2 terminal-period, W3 three CTA phrasings, W6 "actually work"
repeat, W7 metaphor drift, W8 use-case title, W9 metadata "living"**.

- **Jargon (finding 14):** gloss Bronze/Silver/Gold once in the Platform intro
  or flow ("raw → clean → published"). Replace "Bedrock DDL" → "Bedrock table
  definitions"; "Atlas's SchemaRegistry cache" → "Atlas's schema cache". Drop
  the `graph_nodes`/`graph_edges` table names from the Architecture caption
  prose (the SVG labels them) or gloss as "the node and edge tables". Keep
  voice consistent.
- **Cohesion (finding 15):** three different mark/cover treatments across
  adjacent card sections (antd icons in Problem, initial-letter tiles in
  Integrations, gradient covers in UseCases). Pick ONE mark language and apply
  it consistently: recommended — a 40×40 rounded tile (`border-radius:
  var(--radius-inner)`, background `var(--color-bg-sunken)`) holding either an
  antd icon or an initial, reused across Problem + Integrations (UseCases
  keeps its full-bleed cover since it's a different card shape — acceptable,
  but if feasible align its cover radius). Minimum viable fix: give Problem
  cards the same 40×40 `--bg-sunken` tile the Integrations cards use, with the
  existing antd icon inside. Reuse `--radius-inner`; no new tokens.
- **CTA phrasings (W3):** standardize on "Open the playground" (the nav/FinalCTA
  label). Change the ArchitectureSection bridge button ("Try it in the
  playground") and the UseCases link ("See the flagship run today in the
  playground.") to "Open the playground" (the UseCases link may append " — see
  the flagship run" if the flagship framing must survive). All three now read
  the same action.
- **Terminal period (W2):** add the period to "How we build it" → "How we
  build it." to match every other section h2.
- **"actually work" repeat (W6):** vary one of the three instances (Hero sub,
  Problem intro, metadata description) — e.g. Problem intro → "how it
  behaves".
- **Metaphor drift (W7):** anchor to "twin" — change FinalCTA h2 "See the
  system think." → "See the twin think."; change hero eyebrow "nanisoft · the
  living map" → "nanisoft · the living twin" (or keep "living map" if you
  judge it a deliberate sub-line — your call, but make the page's primary noun
  consistent).
- **Use-case title (W8):** "Access traversal — Sensitive Product View Audit"
  reads as an internal audit name. Change to "Access traversal" (or
  "Access traversal — sensitive product views") to match the plain pattern of
  the other two cards.
- **Metadata (W9):** drop "living" from the `layout.tsx` metadata description
  (the h1 has no "living"), OR add it to the h1 — cheapest is delete.

**Verify:** Run vitest (data.test may assert string values — update if needed)
and the overflow suite. Confirm via Playwright text snapshot that the three
CTAs read "Open the playground" and no `href="#"` was reintroduced.

## Notes for the controller

- Tasks are dispatched sequentially (never parallel) — several share files
  (`globals.css`, `ArchitectureSection.tsx`, `UseCases.tsx`, `lib/data.ts`),
  so each builds on the prior task's commit.
- Suggested order: Task 1 → 2 → 3 → 4 → 5 → 7 → 6 (type-system token sweep
  last, so it tokenizes the final markup rather than getting overwritten).
- Excluded findings not assigned to a task stay documented in the review; they
  are not blockers.