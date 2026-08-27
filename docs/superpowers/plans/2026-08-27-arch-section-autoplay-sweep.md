# Architecture Section Autoplay Column-Sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "How we build it" section's `320vh` scroll-driven 4-snap walkthrough with a one-shot autoplay that sweeps a continuous jade wavefront left-to-right across the spine on first viewport entry, plus a manual Replay control.

**Architecture:** A new pure `deriveSectionStateSweep(progress)` reducer maps a 0..1 progress to per-chip `idle/active/done` statuses by spine column, so each chip crossfades exactly once as the wavefront passes (reusing the existing `.35s` CSS transitions). The component drops the tall sticky track + scroll listener and instead drives `progress` via `requestAnimationFrame` on an `IntersectionObserver` first-entry trigger. Reduced motion keeps the existing `deriveSectionState(3)` static end-state.

**Tech Stack:** Next.js 16 App Router, React 19, antd 6 (`PillButton`), semantic CSS custom properties (no Tailwind), `vitest` + `@testing-library/react`, Playwright overflow gate. Shared model in `@nanisoft/architecture`.

## Global Constraints

- **Stack:** Next.js 16.3.1 App Router, React 19, antd 6.6.1. Styling = semantic CSS custom properties in `apps/landing/app/globals.css` + inline `style` props + per-component `<style>` JSX. **No Tailwind.** Tokens from `@nanisoft/identity` (`color`, `font`, `radius`, `easing`).
- **Brand rules (identity lock):** jade (`--color-accent` `#14A77A`) is reserved for **live/active states ONLY**, never decorative. teal (`--color-secondary` `#2A8C97`) = supporting/done marks. Shape lock: buttons are pills (use `PillButton`). No purple, no neon, no pure black, no pure white.
- **No raw hex in components.** Use `var(--…)` tokens. The sweep reuses the existing `idle/active/done` stroke/fill tokens already wired in the component — no new color values.
- **`prefers-reduced-motion`** must be honored for any new/changed motion: static final state, no `IntersectionObserver`, no rAF, no Replay button. The global guard in `globals.css` kills CSS animations/transitions; JS motion checks `matchMedia('(prefers-reduced-motion: reduce)')`.
- **320px / 200% zoom law:** no horizontal page overflow at any viewport; the Playwright overflow gate (`playwright.overflow.config.ts`) must stay green. The diagram's `overflowX: auto` box + right-edge scroll cue are unchanged.
- **Do not break tests.** Keep both green before committing:
  - `pnpm --filter @nanisoft/landing exec vitest run`
  - `pnpm --filter @nanisoft/landing exec playwright test --config playwright.overflow.config.ts`
- **Follow existing patterns.** Inline styles + `<style>` JSX; the `data-band`/`data-node`/`data-edge`/`data-status` attribute contract on the SVG is unchanged so existing selectors and tests keep working. Improve code you touch, but don't restructure beyond the task.

## Spine column reference (verified)

`PIPELINE_SPINE` (from `packages/architecture/src/types.ts`) has 8 stages → columns 0..7:

| col | stage      | components                         | phase band     |
|-----|------------|-----------------------------------|----------------|
| 0   | sources    | active-directory, workday, sql-fleet | Sources (subtle) |
| 1   | schema     | blueprint, bridge                 | Schema         |
| 2   | ingestion  | airbyte, scout, trailhead         | Ingestion      |
| 3   | bedrock    | bedrock                           | Transform      |
| 4   | transform  | forge                             | Transform      |
| 5   | serving    | overlook, superset                | Investigation  |
| 6   | core       | atlas, opa                        | Investigation  |
| 7   | ui         | compass                           | Investigation  |

Phase bands collapse to: Sources[0], Schema[1], Ingestion[2], Transform[3–4], Investigation[5–7]. So `SWEEP_MIN_COL = 1`, `SWEEP_MAX_COL = 7`, and the wavefront is `w = 1 + progress · 6`.

---

## Task 1: Add `deriveSectionStateSweep` to `spine-graph.ts` (pure reducer, TDD)

**Files:**
- Modify: `apps/landing/lib/spine-graph.ts` (add `deriveSectionStateSweep` + helpers after the existing `deriveSectionState`, ~line 500)
- Test: `apps/landing/tests/architecture-section.test.tsx` (add a new `describe` block in the pure-layer section, after the existing `section state reducer` block ending ~line 201)

**Interfaces:**
- Consumes: `derivePhaseGroups()`, `EDGES`, `PIPELINE_SPINE`, `STAGE_COMPONENTS`, `OBSERVER_COMPONENTS`, `PLATFORM_IDS`, `ElementStatus`, `SectionState` — all already in `spine-graph.ts`.
- Produces: `deriveSectionStateSweep(progress: number): SectionState` — exported, consumed by Task 2. Same `SectionState` shape (`{ bands, nodes, edges }: Record<string, ElementStatus>`) as `deriveSectionState`. Band ids match the existing `band-${phaseId ?? 'sources'}` convention; node/edge ids match `${from}__${to}`.

- [ ] **Step 1: Write the failing tests**

Add the import of `deriveSectionStateSweep` to the existing import block at the top of `apps/landing/tests/architecture-section.test.tsx` (lines 4–7):

```ts
import {
  buildSectionGraph,
  deriveSectionState,
  deriveSectionStateSweep,
  SECTION_GEOMETRY,
} from '@/lib/spine-graph';
```

Then append this `describe` block immediately after the existing `describe('section state reducer (jade = active, teal = done) { … }` block (after its closing `});` at ~line 201, before the `// ── Component ───` comment):

```ts
// ── Pure layer: continuous-sweep reducer ───────────────────────────────────────

describe('section state sweep reducer (continuous column wavefront)', () => {
  it('starts at Schema active with sources done and nothing downstream lit', () => {
    const s = deriveSectionStateSweep(0);
    expect(s.bands['band-schema']).toBe('active');
    expect(s.bands['band-investigation']).toBe('idle');
    expect(s.bands['band-sources']).toBe('idle');
    expect(s.nodes['blueprint']).toBe('active');
    expect(s.nodes['bridge']).toBe('active');
    expect(s.nodes['atlas']).toBe('idle');
    // Sources are the data origin — done from the start of the sweep.
    expect(s.nodes['active-directory']).toBe('done');
  });

  it('ends with the wavefront at Compass: investigation band active, earlier done', () => {
    const s = deriveSectionStateSweep(1);
    expect(s.bands['band-investigation']).toBe('active');
    expect(s.bands['band-schema']).toBe('done');
    expect(s.bands['band-ingestion']).toBe('done');
    expect(s.bands['band-transform']).toBe('done');
    expect(s.bands['band-sources']).toBe('idle');
    expect(s.nodes['compass']).toBe('active');
    expect(s.nodes['atlas']).toBe('done');
    expect(s.nodes['blueprint']).toBe('done');
    expect(s.nodes['active-directory']).toBe('done');
    // Cross-cutting platform/observer stay neutral throughout.
    expect(s.nodes['watchtower']).toBe('idle');
    expect(s.nodes['anchor']).toBe('idle');
    // The outgoing Compass edge is live; earlier edges are done.
    expect(s.edges['compass__atlas']).toBe('active');
    expect(s.edges['blueprint__bridge']).toBe('done');
  });

  it('lights exactly one phase band for every progress in [0, 1]', () => {
    for (const p of [0, 0.1, 0.25, 0.5, 0.75, 0.99, 1]) {
      const s = deriveSectionStateSweep(p);
      const active = Object.entries(s.bands).filter(([, v]) => v === 'active');
      expect(active).toHaveLength(1);
    }
  });

  it('moves each phase band idle -> active -> done in spine order as progress advances', () => {
    const states = [0, 0.2, 0.5, 0.8, 1].map(
      (p) => deriveSectionStateSweep(p).bands['band-ingestion'],
    );
    expect(new Set(states)).toEqual(new Set(['idle', 'active', 'done']));
  });

  it('clamps progress outside [0, 1] to the ends', () => {
    expect(deriveSectionStateSweep(-1)).toEqual(deriveSectionStateSweep(0));
    expect(deriveSectionStateSweep(2)).toEqual(deriveSectionStateSweep(1));
  });

  it('keeps cross-cutting platform/observer edges neutral throughout', () => {
    for (const p of [0, 0.5, 1]) {
      const s = deriveSectionStateSweep(p);
      expect(s.edges['watchtower__atlas']).toBe('idle');
      expect(s.edges['anchor__atlas']).toBe('idle');
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @nanisoft/landing exec vitest run tests/architecture-section.test.tsx`
Expected: FAIL — `deriveSectionStateSweep is not exported from '@/lib/spine-graph'` (import error), so all 6 new tests error.

- [ ] **Step 3: Implement `deriveSectionStateSweep`**

In `apps/landing/lib/spine-graph.ts`, append the following block immediately after the closing `}` of `deriveSectionState` (the existing reducer, ending ~line 499). Do **not** modify `deriveSectionState`, `statusFor`, `clampIndex`, `POSITIONS`, or anything above it.

```ts
// ── Continuous-sweep state reducer ─────────────────────────────────────────────
/**
 * Cached phase-group columns: the leftmost/rightmost spine column of each phase
 * band. Sources is the subtle (phaseId === null) band; the four real phases follow
 * in spine order. The wavefront sweeps from the first real phase's column to the
 * last spine column.
 */
const SWEEP_GROUPS = derivePhaseGroups();
const SWEEP_PHASE_BANDS = SWEEP_GROUPS.filter((g) => g.phaseId !== null);
const SWEEP_MIN_COL = SWEEP_PHASE_BANDS[0].fromCol;
const SWEEP_MAX_COL = SWEEP_PHASE_BANDS[SWEEP_PHASE_BANDS.length - 1].toCol;

/**
 * Each band stays `active` from its own `fromCol` until the next phase band begins
 * (so the band highlight is continuous for fractional wavefront positions, with no
 * gaps between adjacent phase columns). The final band stays active through
 * `SWEEP_MAX_COL`. Sources is subtle and never active.
 */
const SWEEP_BAND_BOUNDS = SWEEP_PHASE_BANDS.map((g, i) => ({
  id: `band-${g.phaseId}`,
  fromCol: g.fromCol,
  activeUntil:
    i + 1 < SWEEP_PHASE_BANDS.length
      ? SWEEP_PHASE_BANDS[i + 1].fromCol
      : SWEEP_MAX_COL + 1,
}));

/**
 * Per-node spine column (0..7) for staged nodes, `null` for cross-cutting
 * platform/observer nodes. Same id set as POSITIONS but keyed by column, not phase
 * group — so the jade wavefront can sweep chip-by-chip rather than phase-by-phase.
 * STAGE_COMPONENTS[stage] is the same id set per column as orderedStageIds (ROW_ORDER
 * only reorders within a column).
 */
function nodeColumns(): Map<string, number | null> {
  const cols = new Map<string, number | null>();
  PIPELINE_SPINE.forEach((stage, col) => {
    for (const id of STAGE_COMPONENTS[stage]) cols.set(id, col);
  });
  for (const id of OBSERVER_COMPONENTS) cols.set(id, null);
  for (const id of PLATFORM_IDS) cols.set(id, null);
  return cols;
}
const COLUMNS = nodeColumns();

/** Status of column `c` when the wavefront is at `w`: idle ahead, active at, done behind. */
function colStatus(c: number, w: number): ElementStatus {
  if (w < c) return 'idle';
  if (c <= w && w < c + 1) return 'active';
  return 'done';
}

/**
 * State for a continuous left-to-right wavefront at `progress` (0..1, clamped):
 * jade = the chip the front is currently passing, teal = everything behind it,
 * neutral = everything ahead. Source chips read `done` from the start (they are the
 * data origin). The front sweeps from the Schema band's first column to the
 * Investigation band's last. Cross-cutting platform/observer nodes stay neutral; an
 * edge lights when the front reaches its downstream endpoint (max endpoint column).
 *
 * End state (progress = 1): wavefront at the last spine column — band-investigation
 * active, Compass active, every earlier staged node done. This intentionally differs
 * from deriveSectionState(3), which lights the whole final phase; the reduced-motion
 * path keeps deriveSectionState(3) for the richer whole-phase static view.
 */
export function deriveSectionStateSweep(progress: number): SectionState {
  const p = Math.max(0, Math.min(1, progress));
  const w = SWEEP_MIN_COL + p * (SWEEP_MAX_COL - SWEEP_MIN_COL);
  const bands: Record<string, ElementStatus> = {};
  for (const b of SWEEP_BAND_BOUNDS) {
    bands[b.id] = w < b.fromCol ? 'idle' : w < b.activeUntil ? 'active' : 'done';
  }
  bands['band-sources'] = 'idle';
  const nodes: Record<string, ElementStatus> = {};
  for (const [id, c] of COLUMNS) {
    if (c === null) nodes[id] = 'idle';
    else nodes[id] = c < SWEEP_MIN_COL ? 'done' : colStatus(c, w);
  }
  const edges: Record<string, ElementStatus> = {};
  for (const e of EDGES) {
    const f = COLUMNS.get(e.from);
    const t = COLUMNS.get(e.to);
    if (f === undefined || t === undefined || f === null || t === null) {
      edges[`${e.from}__${e.to}`] = 'idle';
    } else {
      edges[`${e.from}__${e.to}`] = colStatus(Math.max(f, t), w);
    }
  }
  return { bands, nodes, edges };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @nanisoft/landing exec vitest run tests/architecture-section.test.tsx`
Expected: PASS — all 6 new sweep tests pass, and the existing `section graph` / `section state reducer` / `ArchitectureSection` tests still pass (no changes to their code paths yet).

- [ ] **Step 5: Commit**

```bash
git add apps/landing/lib/spine-graph.ts apps/landing/tests/architecture-section.test.tsx
git commit -m "$(cat <<'EOF'
feat(arch): add deriveSectionStateSweep continuous column-wavefront reducer

Pure 0..1-progress reducer that lights each spine chip idle->active->done
as a jade wavefront sweeps left-to-right, reusing SectionState shape.
Existing deriveSectionState (phase-level) is untouched and still used by
the reduced-motion path.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Replace the scroll driver with autoplay + Replay in `ArchitectureSection.tsx` (TDD)

**Files:**
- Modify: `apps/landing/components/ArchitectureSection.tsx` (remove scroll driver + 320vh/sticky track; add `progress` state + `IntersectionObserver` + rAF + Replay button; rewire `state` + caption; copy tweak)
- Test: `apps/landing/tests/architecture-section.test.tsx` (update the `describe('ArchitectureSection')` block — rename one test, replace the 320vh-sticky test, add Replay present/absent tests)

**Interfaces:**
- Consumes: `deriveSectionStateSweep(progress)` from Task 1; existing `deriveSectionState`, `buildSectionGraph`, `deriveSectionState` (reduced-motion path), `PHASES`, `PillButton`, `easing`, `font`, `radius` from existing imports.
- Produces: an `ArchitectureSection` that renders in normal flow (no `320vh` sticky track), autoplays the sweep once on first viewport entry, exposes a Replay `PillButton`, and under `prefers-reduced-motion: reduce` renders the static `deriveSectionState(3)` end-state with no Replay button.

- [ ] **Step 1: Update the component tests to the new contract (failing)**

In `apps/landing/tests/architecture-section.test.tsx`, in the `describe('ArchitectureSection') { … }` block:

(a) Rename the existing test at ~line 233. Change:

```ts
  it('starts scroll-driven at the Schema phase before any scrolling', async () => {
    renderSection();
    await flush();
    expect(document.querySelector('[data-band="band-schema"]')).toHaveAttribute(
      'data-status',
      'active'
    );
    expect(document.querySelector('[data-band="band-investigation"]')).toHaveAttribute(
      'data-status',
      'idle'
    );
  });
```

to (assertion unchanged — only the title and comment change):

```ts
  it('starts at the Schema phase on initial render', async () => {
    renderSection();
    await flush();
    expect(document.querySelector('[data-band="band-schema"]')).toHaveAttribute(
      'data-status',
      'active'
    );
    expect(document.querySelector('[data-band="band-investigation"]')).toHaveAttribute(
      'data-status',
      'idle'
    );
  });
```

(b) Replace the test at ~line 305 (`it('keeps the full 320vh sticky track under default (no reduced-motion) preferences')`) entirely with:

```ts
  it('renders the diagram in normal flow (no tall sticky track) under default prefs', async () => {
    renderSection();
    await flush();
    const track = document.querySelector('[data-arch-track]') as HTMLElement;
    expect(track).not.toBeNull();
    expect(track.style.height).toBe('auto');
    const inner = track.firstElementChild as HTMLElement;
    expect(inner.style.position).not.toBe('sticky');
  });

  it('renders an accessible Replay control under default prefs', async () => {
    renderSection();
    await flush();
    expect(screen.getByRole('button', { name: /replay/i })).toBeInTheDocument();
  });

  it('hides the Replay control under prefers-reduced-motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    try {
      renderSection();
      await flush();
      expect(screen.queryByRole('button', { name: /replay/i })).toBeNull();
    } finally {
      window.matchMedia = original;
    }
  });
```

(c) Leave these existing tests unchanged — they still pass as written:
- `renders the how-we-build-it heading and intro`
- `shows all four phase labels and key codenames`
- `bridges to the playground domain with a plain-label pill link`
- `renders the settled four-phase state statically under prefers-reduced-motion`
- `collapses the scroll track to auto height and drops sticky under prefers-reduced-motion`
- `announces phase captions through a stable polite live region (no per-phase remount)`

- [ ] **Step 2: Run the tests to verify the new/changed ones fail**

Run: `pnpm --filter @nanisoft/landing exec vitest run tests/architecture-section.test.tsx`
Expected: FAIL — `renders the diagram in normal flow…` (current track height is `320vh`, not `auto`), `renders an accessible Replay control` (no button yet), `hides the Replay control under prefers-reduced-motion` (no button → query returns null → passes by accident, but the next step fixes the button in). The renamed `starts at the Schema phase` test still passes (assertion unchanged).

- [ ] **Step 3: Implement the component changes**

In `apps/landing/components/ArchitectureSection.tsx`:

(i) Update the React import (line 3) to add `useCallback`:

```ts
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
```

(ii) Update the `@/lib/spine-graph` import (lines 7–15) to add `deriveSectionStateSweep` (keep `deriveSectionState` — still used for reduced motion):

```ts
import {
  buildSectionGraph,
  deriveSectionState,
  deriveSectionStateSweep,
  SECTION_GEOMETRY,
  VIEW_HEIGHT,
  VIEW_TOP,
  VIEW_WIDTH,
  type ElementStatus,
} from '@/lib/spine-graph';
```

(iii) Add a duration constant near the other module constants (after `SECONDARY` at ~line 48):

```ts
/** Autoplay sweep duration (ms). Per-element .35s CSS transitions handle local crossfade. */
const SWEEP_DURATION_MS = 6000;

/** easeInOutQuad — a gentle in/out for the overall pace; brand `easing` drives the CSS transitions. */
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
```

(iv) Replace the `trackRef` declaration (line 70) and the entire `idx` scroll-driver `useEffect` (lines 86–121) — delete `trackRef` and that effect. Keep `scrollRef` (line 71) and the `reduced` state + its effect (lines 77–84) and the `cue` effect (lines 129–150) unchanged.

Insert this in place of the deleted scroll-driver effect (after the `reduced` effect, before the `cue` effect):

```ts
  // Autoplay sweep: a continuous 0..1 progress advanced by rAF. Plays once on first
  // viewport entry (IntersectionObserver) and on Replay clicks. rAF-throttled; native
  // scrolling is never hijacked (the tall sticky track is gone). Server HTML renders
  // progress 0 — no hydration mismatch. Reduced motion never attaches this (the
  // reduced effect above returns early and the section renders deriveSectionState(3)).
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);
  const playedRef = useRef(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const play = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(0);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SWEEP_DURATION_MS);
      setProgress(easeInOut(t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // First viewport entry → play once, then disconnect (no re-trigger on re-entry).
  useEffect(() => {
    if (reduced) return;
    if (typeof IntersectionObserver === 'undefined') return; // jsdom / SSR guard
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !playedRef.current) {
          playedRef.current = true;
          play();
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, play]);

  // Cancel any in-flight rAF on unmount.
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);
```

(v) Replace the `activeIdx`/`state`/caption-index derivation (lines 152–156):

```ts
  const activeIdx = reduced ? PHASES.length - 1 : idx;
  const state = useMemo(() => deriveSectionState(activeIdx), [activeIdx]);
  const G = SECTION_GEOMETRY;
  const HW = G.chipW / 2;
  const HH = G.chipH / 2;
```

with:

```ts
  const state = useMemo(
    () => (reduced ? deriveSectionState(PHASES.length - 1) : deriveSectionStateSweep(progress)),
    [reduced, progress],
  );
  // Caption phase = the phase band currently active (follows the wavefront). Defaults
  // to Schema at progress 0; under reduced motion this resolves to Investigation.
  const PHASE_BAND_IDS = useMemo(() => PHASES.map((p) => `band-${p.id}`), []);
  const capIdx = useMemo(() => {
    const i = PHASE_BAND_IDS.findIndex((id) => state.bands[id] === 'active');
    return i === -1 ? 0 : i;
  }, [PHASE_BAND_IDS, state]);
  const G = SECTION_GEOMETRY;
  const HW = G.chipW / 2;
  const HH = G.chipH / 2;
```

(vi) Replace the `trackRef`/`data-arch-track` wrapper + sticky inner (lines 169–170):

```tsx
      <div ref={trackRef} data-arch-track style={{ position: 'relative', height: reduced ? 'auto' : '320vh' }}>
        <div style={reduced ? { background: 'var(--color-bg)', padding: '24px 0' } : { position: 'sticky', top: '10vh', background: 'var(--color-bg)', padding: '24px 0' }}>
```

with a normal-flow wrapper (no sticky, height auto in both modes) and move the card `ref` to the bordered card div:

```tsx
      <div data-arch-track style={{ position: 'relative', height: 'auto' }}>
        <div style={{ background: 'var(--color-bg)', padding: '24px 0' }}>
          <div ref={cardRef} style={{ border: '1px solid var(--color-border)', borderRadius: radius.card, background: 'var(--color-bg-elev)', overflow: 'hidden' }}>
```

This adds one extra nesting level (the card div now opens where the old sticky inner opened). Keep the rest of the card's children (the `<div style={{ position: 'relative' }}>` SVG box + cue, and the caption live region) indented one level deeper. The card's closing `</div>` (currently ~line 369) and the wrapper closes now need matching extra `</div>` — add one `</div>` before the wrapper close so the structure is:

```tsx
            {/* caption live region (unchanged) */}
            <div role="status" aria-live="polite" style={{ … }}>
              …
            </div>
          </div>{/* /card */}
          {/* Replay control — outside the live region so its label isn't announced. */}
          {!reduced && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <PillButton type="default" size="small" onClick={play} aria-label="Replay walkthrough">
                Replay
              </PillButton>
            </div>
          )}
        </div>
      </div>{/* /track */}
```

(vii) Update the caption text to use `capIdx` instead of `activeIdx`. In the caption live region (the `<span>` and `<p>`), change every `activeIdx` to `capIdx`:

```tsx
              <span
                className="mono arch-caption"
                style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: 'var(--tracking-upper)', color: 'var(--color-text)' }}
              >
                {`0${capIdx + 1} / 04 · ${PHASES[capIdx].name.toUpperCase()}`}
              </span>
              <p className="arch-caption" style={{ margin: 0, fontSize: 'var(--text-base)', maxWidth: 760, color: 'var(--color-text-muted)' }}>
                {PHASE_CAPTIONS[PHASES[capIdx].id]}
              </p>
```

(viii) Tweak the lead copy. Change the sentence at ~line 166:

```tsx
        One directed pipeline, composed from proven open-source parts around the four things we
        build ourselves: Atlas, Compass, the DataGerry Bridge, and Scout. Scroll to follow data
        from schema to finding.
```

to:

```tsx
        One directed pipeline, composed from proven open-source parts around the four things we
        build ourselves: Atlas, Compass, the DataGerry Bridge, and Scout. Follow data from schema
        to finding.
```

(Drop "Scroll to" → "Follow".)

Leave the rest of the component — the SVG render (bands/edges/nodes mapping over `state`), the `<defs>` markers, the scroll cue, the bridge CTA, and the `<style>` block (keyframes, reduced-motion guard, per-theme stroke roles) — unchanged.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter @nanisoft/landing exec vitest run tests/architecture-section.test.tsx`
Expected: PASS — all tests in the file green, including the renamed `starts at the Schema phase`, the replaced `renders the diagram in normal flow…`, `renders an accessible Replay control`, and `hides the Replay control under prefers-reduced-motion`. The existing reduced-motion + caption live-region tests still pass.

- [ ] **Step 5: Run the full suite + overflow gate**

Run: `pnpm --filter @nanisoft/landing exec vitest run`
Expected: PASS — full landing suite green (no other tests touched the architecture section's scroll behavior).

Run: `pnpm --filter @nanisoft/landing exec playwright test --config playwright.overflow.config.ts`
Expected: PASS — no horizontal page overflow at 320px; the diagram's `overflowX: auto` box + scroll cue are unchanged.

- [ ] **Step 6: Commit**

```bash
git add apps/landing/components/ArchitectureSection.tsx apps/landing/tests/architecture-section.test.tsx
git commit -m "$(cat <<'EOF'
feat(arch): autoplay column-sweep walkthrough replaces scroll-driven snaps

Drop the 320vh sticky track + scroll listener; a continuous jade wavefront
sweeps the spine on first viewport entry via IntersectionObserver+rAF, with
a Replay control. Reduced motion keeps the static deriveSectionState(3)
end-state. Fixes the jagged, decoupled-from-scroll snapping feel.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Visual verification via Playwright MCP

**Files:** none modified (verification only).

**Interfaces:** consumes the implemented component from Task 2.

- [ ] **Step 1: Start the dev server**

Run (background): `pnpm --filter @nanisoft/landing exec next dev` (or the project's established dev command; note the localhost port from the output).
Expected: server ready on `http://localhost:<port>`.

- [ ] **Step 2: Confirm the autoplay + Replay behavior in the browser**

Using Playwright MCP (text snapshot + `browser_evaluate`, **no screenshots** — the model cannot process images):

1. Navigate to `http://localhost:<port>/#architecture`.
2. `browser_evaluate`: read `document.querySelector('[data-arch-track]').style.height` → expect `'auto'` (no `320vh` track).
3. Scroll the section into view; `browser_evaluate` after ~1s: read `document.querySelector('[data-band="band-investigation"]').getAttribute('data-status')` → expect it to transition to `'active'` (autoplay reached the end). Also confirm `document.querySelector('[data-node="compass"]')` `data-status` becomes `'active'`.
4. `browser_evaluate`: confirm a Replay button exists — `document.querySelector('button[aria-label="Replay walkthrough"]')` is non-null.
5. Click the Replay button (`browser_click`); `browser_evaluate` immediately after: `document.querySelector('[data-band="band-schema"]').getAttribute('data-status')` → expect `'active'` (sweep restarted at Schema), then after ~7s `band-investigation` returns to `'active'`.

Expected: the wavefront visibly sweeps left-to-right (assert via `data-status` changes, not screenshots), Replay re-runs it, and there is no `320vh` sticky track.

- [ ] **Step 3: Confirm reduced-motion final state**

Using Playwright MCP `emulateMedia({ reducedMotion: 'reduce' })` (or set the media feature) and reload:

1. `browser_evaluate`: `document.querySelector('[data-band="band-investigation"]').getAttribute('data-status')` → `'active'`.
2. `document.querySelector('[data-band="band-schema"]').getAttribute('data-status')` → `'done'`.
3. `document.querySelector('button[aria-label="Replay walkthrough"]')` → `null` (Replay hidden under reduced motion).
4. `document.querySelector('[data-arch-track]').style.height` → `'auto'`.

Expected: the static four-phase end-state renders with no autoplay and no Replay control.

- [ ] **Step 4: Confirm no horizontal overflow at 320px + scroll cue**

Using Playwright MCP, resize to 320×800 and navigate to `#architecture`:

1. `browser_evaluate`: `document.documentElement.scrollWidth <= document.documentElement.clientWidth` → `true`.
2. `browser_evaluate`: the right-edge scroll cue is present — `document.querySelector('[data-arch-scroll-cue]')` is non-null (the SVG's `minWidth: 900` still overflows the 320px box). Scroll the pan box to its right end; confirm the cue then hides (`[data-arch-scroll-cue]` becomes null).

Expected: no horizontal page overflow; the scroll cue shows then hides at the pan edge, unchanged from before.

- [ ] **Step 5: Final commit (if any test tweak surfaced)**

If Steps 2–4 surfaced a real defect requiring a fix, make the minimal edit and commit it. Otherwise nothing to commit — the verification is the task's deliverable.

```bash
# Only if a fix was needed:
git add apps/landing/components/ArchitectureSection.tsx
git commit -m "fix(arch): <specific defect> (Playwright verification)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage:**
- Remove 320vh track + sticky + scroll driver → Task 2 step (iv)/(vi). ✓
- Autoplay on first viewport entry (IntersectionObserver, fire once, disconnect) → Task 2 step (iv). ✓
- rAF continuous progress 0→1 over 6000ms → Task 2 step (iv) + `SWEEP_DURATION_MS`. ✓
- Replay control (PillButton, accessible, hidden under reduced motion) → Task 2 step (vi), tested in Task 2 step (1b). ✓
- Continuous column-by-column sweep, per-chip idle/active/done, edges by max endpoint column, band highlight follows front, sources done from start → Task 1 step (3). ✓
- Reduced motion keeps `deriveSectionState(3)` static, no observer/rAF/Replay → Task 2 step (v). ✓
- Caption narrates active phase, stable polite live region, "01 / 04 · SCHEMA" at mount → Task 2 step (v)/(vii), existing test kept. ✓
- Copy: "Scroll to follow data…" → "Follow data…" → Task 2 step (viii). ✓
- Tests: rename start-at-Schema, replace 320vh-sticky, add sweep reducer tests, add Replay present/absent, pure-derivation tests untouched → Task 1 step (1), Task 2 step (1). ✓
- Verification: vitest + playwright overflow + Playwright MCP (normal flow, Replay, reduced-motion final state, no 320px overflow, scroll cue) → Task 2 step (5), Task 3. ✓
- `deriveSectionState` kept in use (reduced-motion path) — not dead code → Task 2 step (v). ✓

**2. Placeholder scan:** No "TBD"/"TODO"/"add appropriate…"/"similar to Task N". Every code step contains the actual code. The dev command in Task 3 step 1 is the one established pattern (`pnpm --filter @nanisoft/landing exec next dev`); if the project uses a different dev command, the implementer runs that instead — noted inline.

**3. Type consistency:** `deriveSectionStateSweep(progress: number): SectionState` (Task 1) matches the import + `useMemo` call in Task 2 step (ii)/(v). `SectionState` shape (`{ bands, nodes, edges }: Record<string, ElementStatus>`) matches the existing render code's `state.bands[b.id]` / `state.nodes[n.id]` / `state.edges[e.id]` lookups — unchanged. `PHASES`, `PillButton`, `radius` referenced in Task 2 are existing imports. `capIdx` (number) used in `PHASES[capIdx]` and `0${capIdx + 1}` — matches `PHASES[activeIdx]` usage it replaces. Band id convention `band-${p.id}` in `PHASE_BAND_IDS` (Task 2) matches `band-${g.phaseId}` in the reducer (Task 1) and `band-${g.phaseId ?? 'sources'}` in `buildSectionGraph`. ✓