# Plan: UI cohesion pass — responsive, unified palette, explanation-first

Execution plan for the wayfinder effort charted in `.scratch/ui-cohesion/`.
Destination: all refinements implemented and verified — vertical-only page
scroll everywhere, one mode-aware palette across landing + playground, a
simplified traversal hero, zero sales asks replaced by one exploration path.
The human partner explicitly authorized: execution on `main`, sequential
tasks, subagent-driven, controller picks best judgment on open details
(human is AFK; no prototype round).

## Global Constraints (bind every task)

1. **Next.js 16.3.1 breaking changes.** Before writing any app code, read the
   relevant guide under that app's `node_modules/next/dist/docs/` (the
   AGENTS.md mandate). Heed deprecation notices. If an API you "know"
   differs from the docs, the docs win.
2. **Brand tokens** come verbatim from `@nanisoft/identity`
   (`packages/identity/src/tokens.ts`). Never introduce a new hex value.
   Jade `#14A77A` is reserved for live/active states ONLY — never
   decorative. Shape lock: card radius 20, inner 12, buttons pill. Motion
   easing `cubic-bezier(.32,.72,0,1)` (identity exports `easing`,
   `easingTuple`). Do not change identity token VALUES; consumers adapt to
   identity.
3. **Scroll law:** page-level horizontal overflow is forbidden on both apps
   at every viewport from 320 through 1920 px, landscape orientations
   included (`document.scrollingElement.scrollWidth <= clientWidth` and
   same for `document.documentElement`). Internal interactive-canvas panning
   (@xyflow spine) may exist but must never move the page. After Task 4 the
   hero needs no horizontal pan at all (it restacks vertically on narrow
   screens).
4. **Reduced motion:** every animation degrades to a static settled
   end-state; content and state remain visible without motion (existing
   global CSS + per-component `[data-motion='settled']` patterns).
5. **Environment:** Windows host, PowerShell primary + Git Bash available;
   pnpm@11 monorepo. Suites: landing unit `pnpm --filter @nanisoft/landing
   test` (vitest); playground e2e `pnpm --filter @nanisoft/playground
   test:e2e` (Playwright; needs its dev server per its config); lint
   `pnpm lint`; builds `pnpm --filter @nanisoft/<app> build`. Known
   PRE-EXISTING local failures: some contact/demo-request e2e specs fail
   locally from unset `NEXT_PUBLIC_CONTACT_ENDPOINT` + turbopack-dev route
   stubbing — record them, never chase environment fixes for them.
6. **Git:** work directly on `main` (human authorized this explicitly);
   strictly sequential tasks — one task fully merged before the next
   starts. Conventional commits matching history (`type(scope): subject`);
   end every commit message with
   `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. If `next dev`
   regenerates an `AGENTS.md` block during your work, commit that
   regeneration with your task (its own instruction).
7. **Tests are the gate.** Every task ends with its named suites green and
   output pristine (warnings are findings). New behavior gets new tests
   that verify rendered behavior, not mocks.

## Pre-flight notes (controller-resolved; no blocking conflicts)

- Tasks 1 and 4 both touch the hero: Task 1 stops the *current* hero from
  forcing page overflow (drop the forced `min-width:900px` + `overflow-x`
  so the SVG scales); Task 4 then replaces the component wholesale. Task 1's
  hero edit is deliberately throwaway-safe.
- Order chosen to minimize churn: layout law → theme plumbing → sales
  removal → hero replacement → whole-repo verification.

---

## Task 1: Responsiveness sweep — kill all page-level horizontal scroll

**Goal:** On both apps, at widths 320 / 375 / 390 / 768 / 1024 / 1280 /
1440 / 1920 plus a landscape laptop size (1366×768), the page never scrolls
horizontally.

**Known suspect (confirmed):** `apps/landing/components/Hero.tsx` mobile
block sets `.hero-canvas { overflow-x:auto }` + `.hero-canvas svg {
min-width:900px }` — remove both so the SVG scales down inside the
container instead of forcing swipe.

**Work:**
1. Build an automated overflow check and wire it into each app:
   - Landing: add `@playwright/test` devDep + a `test:overflow` Playwright
     project (new `playwright.overflow.config.ts`) running one spec against
     `next dev` that visits `/` at the full viewport matrix and asserts
     `scrollWidth <= clientWidth` on scrollingElement and documentElement.
   - Playground: add an equivalent spec inside the existing e2e setup
     (`e2e/overflow.spec.ts`), visiting `/` (and `/tokens`) at the same
     matrix.
   - Reuse one shared viewport list constant per spec; keep configs minimal.
   - If browser binaries are missing, install chromium only.
2. Audit and fix every offender the checks surface. Sweep at least:
   landing `TopNav`, `Problem`, `Platform`, `UseCases`, `Integrations`,
   `ArchitectureSection` (wide SVGs!), `Footer`, `Hero`; playground
   `_controls/Controls`, `_inspector/Inspector`, `_overlay/*` fixed/absolute
   panels, `_spine` wrapper, `playground-client` layout grid.
   Typical fixes: replace fixed pixel widths with max-width + fluid,
   avoid `100vw` (scrollbar-induced overflow), wrap long unbreakable
   strings, give wide media `max-width:100%`, grid `minmax(0,…)` instead
   of bare fr blowouts. Landscape laptop: ensure nothing requires more than
   viewport height/width without scrolling vertically.
3. Do not redesign visuals — this is a layout-law pass. Keep diffs tight.

**Acceptance:**
- Both overflow specs pass at the full matrix (light theme; dark covered in
  Task 5 once Task 2 lands).
- `pnpm --filter @nanisoft/landing test` green; playground e2e green except
  the recorded pre-existing env failures; `pnpm lint` clean.
- Report lists each offender found + the fix applied.

---

## Task 2: Playground goes mode-aware (unified palette)

**Goal:** The playground honors the same light/dark system as the landing:
same hues (already shared via identity), same mode, synced across pages.

**Contract to mirror:** read `apps/landing/components/theme/ThemeProvider.tsx`
+ `ThemeToggle.tsx` FIRST and mirror their storage key, `data-theme`
attribute target, and system-preference fallback exactly.

**Work:**
1. Mirror the landing's token pattern in `apps/playground/app/globals.css`:
   define `--color-*` custom properties for light and `[data-theme='dark']`
   (values copied from identity with identity-name comments, exactly like
   landing does), set `color-scheme` per mode, drive `body` background from
   the tokens.
2. No-FOUC: inline pre-hydration script in `app/layout.tsx` that sets
   `data-theme` on `<html>` from the shared localStorage key, falling back
   to `prefers-color-scheme`.
3. Convert components off hardcoded `surface.light.*`: `_spine/NodeChip`,
   `_spine/Spine`, `_spine/PhaseBand`, `_spine/Narrative`, `_inspector/
   Inspector`, `_controls/Controls`, `_overlay/*`, `playground-client`.
   Prefer swapping color/surface reads to `var(--color-*)` strings so
   theming is pure CSS (mode-invariant things — font/radius/shapes — keep
   their identity imports). Where a component truly needs the mode in TS,
   use a tiny hook observing the `data-theme` attribute.
4. Add a compact theme toggle to the playground chrome, visually consistent
   with the landing's toggle (plain button; playground has no antd),
   persisting to the same storage key.
5. Update `e2e/helpers.ts` / specs that assert light-only colors; extend the
   smoke spec to toggle dark and assert the html attribute + a surface
   color flips.

**Acceptance:** toggling flips every surface; reload persists; system
preference honored when unset; landing ↔ playground share the stored mode;
reduced-motion behavior untouched; landing vitest + playground e2e (minus
known env failures) green; lint clean.

---

## Task 3: Remove the sales surface — one exploration path

**Goal:** Nothing asks for a demo or a purchase anywhere; the only ask is
"Open the playground."

**Work:**
1. Delete `apps/landing/app/api/demo-request/` (route + directory).
2. `lib/data.ts`: reshape `FINAL_CTA` to a single exploration CTA —
   `h2: 'See the system think.'`, `primary: { label: 'Open the playground',
   href: 'https://playground.nanisoft.com' }`, keep the footnote idea
   ("In-browser, guided, and fully mocked — nothing to install.") extended
   by one clause about watching a query traverse the twin end to end. Drop
   the mailto `secondary` field. Keep the export name `FINAL_CTA`.
3. `components/FinalCTA.tsx`: render the single primary button + h2 +
   footnote; remove secondary button handling.
4. `components/TopNav.tsx`: replace the "Request a demo" pill with primary
   "Open the playground" pointing at the playground URL (external href ⇒
   same `_blank` + noopener conventions used elsewhere in the file).
5. Leave footer links (incl. Contact) and `USE_CASES_MORE` untouched.
6. Update tests asserting the old copy: `data.test.ts` (demo/mailto
   assertions), `hero.test.tsx` (nav button expectations around line 169),
   `page.test.tsx` if it references the route/CTA. Assert the negative too:
   no "demo"/"mailto:hello@" strings render.

**Acceptance:** `grep -ri "request a demo\|hello@nanisoft.com" apps/landing`
returns nothing; route gone; all landing suites green; lint clean. Record
(don't fix) any effect on the known-failing contact e2e specs.

---

## Task 4: Replace the hero with the "estate to answer" traversal

**Goal:** The hero tells ONE story — raw estate flows through the platform
and comes out as an answered, governed question — with ~6 visual elements,
self-running, understandable in 8 seconds, on every device.

**Design (controller's locked judgment — implement faithfully):**
- New `'use client'` component `apps/landing/components/hero/HeroFlow.tsx`
  (self-contained; extract a small layout module only if the file would
  exceed ~450 lines). DELETE `HeroDag.tsx`, `hero-graph.ts`,
  `hero-graph.test.ts`. `Hero.tsx` swaps the import and drops the mobile
  overflow/pan CSS entirely (canvas always fits now).
- Stations (left→right desktop): three small source chips **Directory /
  HR / Databases** → **Land** *(Bronze — raw lands untouched)* → **Conform**
  *(Silver — one person, one node)* → **Graph** *(Gold — records become
  nodes + edges: the twin)* → **Serve** *(Atlas answers, policy-checked)*.
  Phase labels mono uppercase letter-spaced muted, echoing the old
  phase-label language.
- Visual language: single SVG (desktop viewBox ≈ 1000×340), rounded-rect
  chips rx=12, rounded connector paths with arrow markers, tokens only.
  Custom (in-house) chips may take the teal stroke treatment the old DAG
  gave customs — Land/Conform/Graph/Serve/Atlas count as in-house.
- Motion (single rAF loop, imperative ref writes, zero React state per
  frame — follow the old HeroDag's architecture):
  - A jade pulse travels sources → Serve over a ~7s cycle, brand-eased per
    segment, arrival ring at each station, fading in/out at the ends.
  - At Graph, a tiny 2-node+edge glyph forms inside/near the chip; at Serve
    an answer chip reveals: *"Who can reach this system?"* with two
    micro-badges appearing sequentially — `policy ✓` then `audited ✓`.
    (Jade = live/active only; badges/text use ink/muted/teal.)
  - Pointer life: proximity brightening within ~150px, gain eased to rest on
    leave, disabled when `(hover: none)`.
  - Pause the loop while `document.hidden`.
- Reduced motion / no-rAF: static settled frame showing the complete story
  including the answer + both badges (pulse parked at Graph), via the
  `[data-motion='settled']` pattern; server-rendered markup IS the settled
  frame (hydration-safe reduced-motion flip like the old component).
- A11y: `role="img"`, fresh aria-label + `<desc>` narrating the full story;
  purely decorative bits `aria-hidden`.
- Narrow screens (<720px): VERTICAL variant — the same five stages stacked
  top→bottom (sources row on top), pulse travels downward. Implement as a
  second coordinate arrangement chosen at mount + on resize (matchMedia),
  not CSS transforms of the horizontal SVG. Nothing overflows 320px; no
  horizontal pan anywhere. Message identical on every device.
- Tests: rewrite `hero.test.tsx` — story text present, aria-label/desc,
  settled frame renders answer + badges, old DAG markers absent; keep
  `page.test.tsx` and `a11y.test.tsx` green (adjust selectors they used
  from the old hero if any).

**Acceptance:** landing vitest green; overflow matrix still clean at 320–1920;
screenshots at 375 and 1280 saved to the report dir and described in the
report (story legible, nothing clipped); lint clean.

---

## Task 5: Whole-effort verification gate

**Goal:** Prove the destination is reached, or fix what proves it isn't.

**Work (run ALL, report results as a table):**
1. `pnpm -r test` (landing vitest + identity/architecture package suites).
2. `pnpm -r lint`.
3. `pnpm --filter @nanisoft/landing build` and
   `pnpm --filter @nanisoft/playground build`.
4. Playground e2e: `pnpm --filter @nanisoft/playground test:e2e` — classify
   results into PASS / REGRESSION / KNOWN-PRE-EXISTING (env) with reasons.
5. Overflow matrix, now in BOTH themes on both apps, full viewport list incl.
   1366×768 landscape. Zero page overflow anywhere is the bar.
6. Cross-app mode sync spot-check: set the storage key to dark, load each
   app, confirm dark surfaces on both.
7. Small regressions found here get fixed directly (documented in the
   report); anything structural → BLOCKED report instead.

**Acceptance:** every gate green (minus enumerated known-env items); report
names exact commands + outcomes; explicit verdict: destination reached yes/no.
