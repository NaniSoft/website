# Design — Architecture section: autoplay column-sweep

**Date:** 2026-08-27
**Component:** `apps/landing/components/ArchitectureSection.tsx` ("How we build it.")
**Lib:** `apps/landing/lib/spine-graph.ts`
**Status:** approved (pre-implementation)

## Problem

The "How we build it" section ties its pipeline walkthrough to scroll position: a
`320vh` tall track with a `position: sticky` diagram, and `idx = Math.floor(p * 4)`
snaps through 4 discrete phases (Schema → Ingestion → Transform → Investigation) as
you scroll. The color/stroke changes use **time-based** `.35s` CSS transitions, not
scroll-bound ones.

This produces a "jagged" feel:

- The track is ~3.2 viewport-heights tall; you scroll ~2.2 of them while the SVG sits
  pinned and mostly unchanged → scrolling feels "stuck."
- Only **4 hard snaps** across the whole distance; between snaps, nothing changes,
  then it lurches.
- The `.35s` transition is decoupled from scroll velocity — fast scrolling snaps
  faster than .35s can play (stutter); slow scrolling finishes the transition then
  sits dead.

Native scroll is never hijacked (listeners are passive), so this is an *animation
model* problem, not a scroll-hijack problem.

## Direction (user decisions)

1. **Replace** the scroll-driven walkthrough with a one-shot autoplay that plays when
   the section scrolls into view, then settles. (Drop the tall sticky track.)
2. **Play once** on first entry; no auto-retrigger on re-entry. Add a **manual Replay
   control** so the walkthrough is re-accessible on demand.
3. **Continuous column-by-column sweep:** a single jade "live" wavefront travels
   left-to-right across the spine — each chip lights individually as the front
   reaches it, edges light as data lands at their downstream end, the phase-band
   highlight follows the front. (Chosen over a 4-phase cascading reveal for the
   smoothest, most "intuitive traversal.")

## Behavior

### Layout

- Remove `height: '320vh'`, `position: sticky`, and the scroll-driver effect.
- The section renders in normal flow: heading → lead → diagram card → caption →
  Replay control → bridge CTA. The `data-arch-track` wrapper div is kept (tests query
  it) but becomes a plain container with `height: 'auto'` and no sticky inner.
- Section shrinks from ~320vh to ~1 viewport — less stuck scrolling overall.
- The horizontal-scroll cue (finding 7) for narrow viewports stays unchanged
  (the SVG keeps `minWidth: 900` in an `overflowX: auto` box).

### Autoplay

- A continuous `progress` state, `0..1`, default `0` on mount. (Under reduced motion
  `progress` is unused — the section renders `deriveSectionState(3)` statically.)
- An `IntersectionObserver` observes the diagram card; on first intersect
  (`threshold` ~0.25), it calls `play()` once, then disconnects (a `playedRef`
  guards against re-trigger on re-entry).
- `play()` runs a `requestAnimationFrame` loop that advances `progress` `0 → 1` over
  **`DURATION_MS = 6000`** on the brand `easing` curve, then stops at `1`. A
  `playingRef` prevents overlapping loops. `play()` is also the Replay handler:
  reset `progress` to `0`, then animate to `1`.
- Reduced motion (`prefers-reduced-motion: reduce`): render `deriveSectionState(3)`
  statically (the existing phase-level final state — whole Investigation phase
  active), no observer, no rAF, no Replay button. Unchanged from today.

### The wavefront

A new `deriveSectionStateSweep(progress: number): SectionState` in `spine-graph.ts`.
The existing `deriveSectionState` (integer phase semantics, tested) is left
**untouched**.

Mapping:

- `minCol` = the Schema band's `fromCol` (first phase column).
- `maxCol` = the Investigation band's `toCol` (last spine column).
- `w = minCol + progress * (maxCol - minCol)` — the wavefront's current column.

Per-element status (reuses the `ElementStatus = 'idle' | 'active' | 'done'` shape):

- **Staged nodes** (sources + the four phases, each at its `PIPELINE_SPINE` column
  `c`):
  - `w < c` → `idle`
  - `c <= w < c + 1` → `active` (jade — the front is at this chip)
  - `w >= c + 1` → `done` (teal)
  - Source columns (`c < minCol`) are `done` from `progress = 0` (they are the data
    origin, already extracted) — so the wavefront starts at Schema, matching the
    existing "starts at Schema" contract.
- **Platform / observer nodes** (cross-cutting, `null` position): `idle` always.
- **Edges:** status by `max(sourceCol, targetCol)` relative to `w` (data lands at the
  downstream end; `max` mirrors the existing `max(f, t)` pattern). Edges touching any
  `null`-position node stay `idle`.
- **Bands:** each phase band spans `[fromCol, toCol]`:
  - `w < fromCol` → `idle`
  - `fromCol <= w <= toCol` → `active`
  - `w > toCol` → `done`
  - The **Sources** band (`subtle`) stays `idle` (it is the dashed origin band, not a
    phase).

Why this reads as smooth: the existing per-element `.35s` CSS transitions now do real
work — each chip/edge/band crossfades **exactly once** as the front passes its
column. Because those flips are staggered along the spine (a handful at a time, not
4 simultaneous snaps), the result is one continuous left-to-right flow, bound to time
rather than decoupled from input. `arch-edge-flow` marching-ants on the currently
active edges stays.

### End-state

The 8 spine columns are `sources`(0), `schema`(1), `ingestion`(2), `bedrock`(3),
`transform`(4), `serving`(5), `core`(6), `ui`(7). The phase bands collapse to
Sources[0], Schema[1], Ingestion[2], Transform[3–4], Investigation[5–7]. So the
wavefront sweeps `w = 1 + progress · 6` (Schema's first column → Investigation's
last column).

`deriveSectionStateSweep(1)` ends with the wavefront at the last spine column
(`w = 7`): **band-investigation active**, band-schema/ingestion/transform `done`,
band-sources `idle`; **Compass active** (col 7); every earlier staged node `done`;
sources `done`; platform/observer `idle`; the investigation edges into Compass
`active`. A pure column-sweep ends with only the terminal UI chip live — the
intended "data arrived at its destination" end-state — **not** the whole final
phase.

**Reduced motion** keeps the existing phase-level `deriveSectionState(3)` (the
whole Investigation phase active) exactly as today — no regression for
reduced-motion users. The two end-states intentionally differ: the sweep
emphasizes the live terminal chip; the reduced-motion static state emphasizes the
whole live phase. `deriveSectionState` stays in use (reduced-motion path), so it is
not dead code. An explicit unit test asserts `sweep(1)`'s expected values above (not
a deep-equal to `deriveSectionState(3)`, which lights the whole final phase).

### Caption & accessibility

- The caption shows the phase whose band is currently active, `01 / 04 · SCHEMA` →
  `04 / 04 · INVESTIGATION`, derived from the active non-`subtle` band (defaulting to
  Schema at `progress = 0`).
- Stays a stable `role="status" aria-live="polite"` live region; text updates in
  place (no per-phase remount). Initial render reads "01 / 04 · SCHEMA" (matches the
  existing test).
- SVG `role="img"` `<title>`/`<desc>` unchanged — the whole pipeline is always in the
  DOM; color is never the only cue.
- Replay control is a `PillButton` (the landing's established pill — honors the
  "buttons are pills" shape lock) with `type="default"` small size and an
  accessible name ("Replay"); keyboard focusable; hidden under reduced motion. It is
  a `type="button"` control, distinct from the bridge-CTA `PillButton` link.

### Copy

- Lead: "Scroll to follow data from schema to finding." → "Follow data from schema
  to finding." (drop the scroll reference). Heading "How we build it." unchanged.

## Files

| File | Change |
|------|--------|
| `apps/landing/lib/spine-graph.ts` | Add `deriveSectionStateSweep` + `minCol`/`maxCol`/column-status helpers. Existing `deriveSectionState` & `buildSectionGraph` untouched. |
| `apps/landing/components/ArchitectureSection.tsx` | Remove scroll driver + 320vh/sticky track; add autoplay (IntersectionObserver + rAF + `progress` state) + Replay button; wire `deriveSectionStateSweep`; copy tweak; reduced-motion path. |
| `apps/landing/tests/architecture-section.test.tsx` | Rename "starts scroll-driven at Schema" → "starts at Schema on initial render" (assertion unchanged); replace "320vh sticky track under default" with "normal flow, no sticky track, Replay control present"; add `deriveSectionStateSweep` reducer tests (sweep(0) Schema active; sweep(1) end-state = Compass active, band-investigation active, earlier done; one-phase-band-active for progress in (0,1]; monotonic idle→active→done); add Replay present/absent tests. Pure-derivation tests (graph layout, edge routing) and the existing `deriveSectionState` reducer tests untouched. |
| `apps/landing/app/globals.css` | None. Section styles are inline / in the component `<style>` block. |

## Global constraints honored

- **No Tailwind; semantic tokens via `var()`; no raw hex.** No new color values
  introduced — the sweep reuses the existing `idle/active/done` stroke/fill tokens
  already wired in the component.
- **Brand lock:** jade (`--color-accent`/`--color-accent-strong`) stays reserved for
  the live/active wavefront only; teal (`--color-secondary`) for done. No new accent
  use.
- **`prefers-reduced-motion`** honored: static final end-state, no rAF, no observer,
  no Replay button.
- **320px / 200% zoom law:** no horizontal page overflow; the Playwright overflow
  gate stays green. The diagram's overflow-`X` box + scroll cue are unchanged.
- **Follow existing patterns:** inline styles + `<style>` JSX; the `data-status`
  attribute contract on bands/nodes/edges is unchanged so existing selectors and tests
  keep working.

## Verification

- `pnpm --filter @nanisoft/landing exec vitest run` — architecture-section + full
  suite green.
- `pnpm --filter @nanisoft/landing exec playwright test --config
  playwright.overflow.config.ts` — overflow gate green.
- Playwright MCP (text snapshot + `browser_evaluate`, **no screenshots**): confirm
  normal-flow layout, Replay control present, reduced-motion final state, no
  horizontal overflow at 320px, scroll-cue still works on narrow viewports.

## Risks

- `IntersectionObserver` and `requestAnimationFrame` are not in jsdom — the autoplay
  is **structurally** tested (Replay wiring, `sweep(1)` deep-equals
  `deriveSectionState(3)` end-state invariant, Replay present/absent) and visually
  verified via Playwright; exact frame timing is not asserted in unit tests. If an
  IO mock is needed, add a minimal one in the affected test(s).
- Per-element `.35s` transition + continuous front: only the wavefront column's
  elements flip at any instant (a handful), so few simultaneous transitions — no
  transition-storm jank.
- The sweep end-state (`sweep(1)`: Compass active, band-investigation active, earlier
  done) is asserted by an explicit unit test. It intentionally differs from
  `deriveSectionState(3)` (whole final phase active), which the reduced-motion path
  keeps using unchanged.