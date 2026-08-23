# Landing architecture section (ticket 20) — design

**Date:** 2026-08-23
**Status:** Approved (coordinator brief pre-approves option (b); autonomous batch — decisions recorded here for review)
**Scope:** `apps/landing` only — new `lib/spine-graph.ts`, new `components/ArchitectureSection.tsx`, one additive edit to `app/page.tsx`, new vitest file. No edits to playground, packages/*, existing components, or `lib/data.ts`.

## Goal

The "how we build it" section: the real architecture rendered as the directed pipeline from `@nanisoft/architecture` (SPEC §1), in a scroll-driven container whose active phase advances Schema → Ingestion → Transform → Investigation as the reader scrolls — jade = active, teal = done, identical semantics to the playground spine (SPEC §4.3) — ending in a bridge CTA to https://playground.nanisoft.com. `prefers-reduced-motion` renders the settled four-phase state statically; content is never removed.

## Reuse-strategy decision — option (b): landing-local pure module

**(a) rejected for this batch:** lifting `apps/playground/app/_spine/spine-graph.ts` into `packages/architecture` is the cleanest end state, but it forces an import change in `apps/playground/app/_spine/Spine.tsx` — playground app code is OUT OF BOUNDS during the parallel 19/20/21 batch, and the coordinator verifies playground Playwright 10/10 at integration. Mid-batch breakage risk for zero user-visible gain.

**(b) chosen:** `apps/landing/lib/spine-graph.ts` derives the same directed layout directly from the model exports (`PIPELINE_SPINE`, `STAGE_COMPONENTS`, `OBSERVER_COMPONENTS`, `COMPONENT_BY_ID`, `EDGES`). Two further reasons beyond batch safety:

1. **Consumer shape differs.** The playground module emits React Flow data (top-left positions, handle-id strings coupled to `NodeChip.tsx`). The landing renders plain SVG and needs centers, orthogonal routed path strings, and per-element state — not RF positions or handle ids.
2. **Zero dependency/lockfile churn**, `packages/*` untouched.

**Carry-forward (for the coordinator, post-batch):** lift the shared derivation (layout + status reducer) into `packages/architecture` (or a new package) and repoint both consumers; the landing module is written so its pure functions port without rework (no React, no DOM at this layer).

## Pure layer — `lib/spine-graph.ts`

Framework-agnostic (no React/DOM), unit-testable:

- **Layout** (derived, not hardcoded — same derivation logic as the playground module, smaller scale): 8 stage columns from `PIPELINE_SPINE` × `STAGE_COMPONENTS` (row order preserved, columns vertically centered); Watchtower observer above at the mean x of its observe targets; Anchor/Conveyor/OpenBao platform band above the spine (platform-kind minus observer, spread evenly, ordered by mean-target x — mirroring the playground's rule); persona edges dropped (endpoints not rendered — same as playground). Phase bands below, grouped from consecutive columns sharing a phase: Sources (subtle) | Schema | Ingestion | Transform | Investigation.
- **Orthogonal routing** with soft rounded 90° bends (SVG quadratic corners, radius ~10) and closed arrowheads. Three strategies, chosen per edge: straight (same column / same row), near-target elbow (H at source-y → bend in the inter-column gap → short H into the target side), and a bottom-channel route for long spans (bridge→atlas) so horizontals never cross intermediate chips. Mutual-pair edges (atlas↔overlook, atlas↔opa) get ±lane offsets so both directions stay visible.
- **Status reducer** `deriveSectionState(activeIdx)` — pure: given active phase index 0..3 returns, for every band/node/edge, `idle | active | done` using playground semantics (jade = active, teal = done). Node/edge membership maps to phases via the same column grouping as the bands; an edge is active when either endpoint sits in the active group, done when both sit in covered groups.

## Component — `components/ArchitectureSection.tsx` ('use client')

- **Scroll driver:** a tall wrapper (~320vh) with a sticky stage. A passive, rAF-throttled scroll/resize listener maps wrapper progress to `activeIdx = min(3, floor(p × 4))`; state lives in `useState(0)` (server HTML = Schema active — no hydration mismatch). No scroll-jacking; native scrolling untouched.
- **Reduced motion:** `matchMedia('(prefers-reduced-motion: reduce)')` checked on mount (+ change listener): no listeners attached, state initialized to the settled end (`deriveSectionState(3)`) — full four-phase state, all content intact, zero animation. The global reduced-motion CSS kill-switch in `globals.css` covers residual transitions.
- **Visual language (SPEC §2 hero graph language, token discipline):**
  - SVG scaled responsively (`width: 100%`, fixed viewBox). Chips: rect rx 12 (inner radius), codename in Satoshi 600 + realName in JetBrains Mono muted (the data face for data-shaped labels).
  - Colors via CSS vars only (mode-aware): idle edges `color-mix(text-muted ~50%, transparent)`, dotted platform/observe lighter; active = `var(--color-accent)` (jade, dashed animated dash-offset — traverse principle); done = `var(--color-secondary)` (teal). Jade appears ONLY on active states + nothing else. Arrowheads via `<marker>` defs per state (marker children carry `style.fill` — presentation attributes cannot hold `var()`).
  - Phase bands mirror the playground PhaseBand: uppercase mono labels, sunken fill, active band jade-tinted border/fill mix, done teal.
  - Caption under the graph narrates the active phase in landing tone (one plain sentence per phase, codenames introduced naturally — copy lives in the component file; `lib/data.ts` is out of bounds).
- **Bridge CTA:** after the scroll track, always visible (never gated behind scroll depth): `PillButton type="primary" size="large" href="https://playground.nanisoft.com" target="_blank" rel="noopener noreferrer"` labeled "Try it in the playground" — the site's first link to the playground domain.
- **a11y:** `<section aria-labelledby>` heading; SVG `role="img"` with `<title>`/`<desc>` summarizing the pipeline; bands/nodes carry `data-status` for testability; caption changes are not announced via aria-live (scroll-driven chatter avoided); CTA is a real link with accessible name.
- Section `id="architecture"` (topical id pattern: problem/platform/use-cases/…), inserted once between `<Problem />` and `<Platform />` in `app/page.tsx` — the only edit to that file (import + element).

## Testing (landing vitest; no Playwright additions)

New `tests/architecture-section.test.tsx`:

1. **Reducer units:** idx 0 → Schema active, others idle; idx 3 → Investigation active, Schema/Ingestion/Transform done; exactly one active band per idx; monotone done coverage.
2. **Geometry units:** every rendered edge yields a finite `M…` path; unique node ids; five phase bands; bridge→atlas takes the bottom channel; mutual pairs get distinct paths.
3. **Component:** heading renders; four phase labels present; Watchtower + sample codenames present; CTA link has href `https://playground.nanisoft.com`.
4. **Reduced motion:** stub `matchMedia` to match → end-state rendering (investigation `data-status="active"`, earlier bands `"done"`), no scroll listener work needed to get there.

Existing suites must stay green untouched (page/a11y/theme/data).

## Verification bar

`pnpm --filter @nanisoft/landing lint && test && build` green · no regressions in `@nanisoft/architecture` (124) or `@nanisoft/identity` (34) · human visual confirm deferred (house precedent).
