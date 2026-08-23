# Landing hero DAG (ticket 19) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder landing hero with a mouse-reactive, hand-rolled SVG DAG of the real architecture model — orthogonal soft-bend edges + arrowheads, jade wavefront, Watchtower observer above, wordmark + positioning line overlaid, no buttons, reduced-motion settled state.

**Architecture:** Pure model→geometry derivation (`hero-graph.ts`, no React) consumed by a `'use client'` SVG renderer (`HeroDag.tsx`) under a Server Component shell (`Hero.tsx` keeps the stable export). Zero new dependencies. Design rationale: `docs/superpowers/specs/2026-08-23-landing-hero-dag-design.md`.

**Tech Stack:** Next 16.3.1 App Router · React 19.2.8 · `@nanisoft/architecture` (model) · `@nanisoft/identity` (tokens/easing) · vitest + testing-library (jsdom).

## Global Constraints

- Branch `feat/19-hero-dag` in the assigned worktree; never merge/push.
- Do NOT touch: `app/page.tsx`, other sections, `globals.css`/theme, `apps/playground`, `packages/*`. `lib/data.ts` untouched (data.test reads it).
- Keep export name `Hero`; keep `id="hero"` on the section.
- No buttons/links anywhere in the hero; demo-request API route untouched.
- Jade (`--color-accent`) ONLY for the wavefront (beam, active-column stroke, ripple) — hover/highlight stays neutral. No purple/neon/pure-black/white. Radii: chips 12 (`--radius-inner`). Node labels JetBrains Mono (`.mono` / `font.data`). All colors via CSS custom properties or identity values — no raw hex in components.
- Motion easing `cubic-bezier(.32,.72,0,1)` (= identity `easing`); four principles breathe/traverse/ripple/settle; `prefers-reduced-motion` → static settled end-state, content intact (`data-motion="settled"`).
- NO Playwright additions. Verification: landing vitest + build green; architecture 124/124; identity 34/34.

## Geometry contract (locked by design)

viewBox 1280×560. Columns `colX(i)=90+i*158` (i=0..7 → 90..1196), chip 132×40 (hw 66/hh 20, rx 12), row pitch 58: 3-row cols y∈{272,330,388}, 2-row {301,359}, 1-row {330}. Observer band y=96, platform band y=196, phase labels y≈505, sky lanes y∈[222..250], valley lanes y∈[442..470]. Router rules: adjacent same-row = straight H; adjacent diff-row = mid-gap jog; spanning ≥1 intermediate column = sky lane (exit right→gap vertical↑→lane→target-cx vertical↓ into top); backward same-row = straight H (±6 anti-parallel offset); backward diff-row = valley lane; same-column = side rails in the neighboring gap. Gap channels staggered ±3–6px.

---

### Task 1: `hero-graph.ts` — pure model→geometry derivation

**Files:**
- Create: `apps/landing/components/hero/hero-graph.ts`
- Test: `apps/landing/tests/hero-graph.test.ts`

**Interfaces (produced):**
```ts
interface HeroNode { id: string; cx: number; cy: number; band: 'spine'|'observer'|'platform'; col: number }
interface HeroEdge { id: string; dotted: boolean; waypoints: { x: number; y: number }[] } // axis-aligned
interface HeroPhaseBand { id: string; name: string; subtle: boolean; x0: number; x1: number }
interface HeroGraph { nodes: HeroNode[]; edges: HeroEdge[]; phases: HeroPhaseBand[];
                      width: 1280; height: 560;
                      nodeById: Record<string, HeroNode>; columnXs: number[] }
function buildHeroGraph(): HeroGraph
function roundedPath(points: {x:number;y:number}[], r?: number): string // M/H/V/Q path with rounded bends
function cubicBezier(x1:number,y1:number,x2:number,y2:number): (t:number)=>number
```

- [ ] Write failing tests: (a) node set == spine ∪ observer ∪ platform ids recomputed from the model, no personas; (b) every edge's waypoints are axis-aligned (consecutive points share x or y); (c) no edge segment intersects any chip rect except its own endpoints' chips; (d) sky/valley lanes: horizontal segments at the same y have disjoint x-spans unless identical edges; (e) phases derived = Sources|Schema|Ingestion|Transform|Investigation with correct spans; (f) `roundedPath` emits M then only H/V/Q commands and preserves endpoints; (g) `cubicBezier(0.32,0.72,0,1)(0.5)` ≈ known value (compute once via reference implementation in test).
- [ ] Run: `pnpm --filter @nanisoft/landing test -- hero-graph` → FAIL (module missing).
- [ ] Implement `buildHeroGraph` (layout constants above; channel allocator per gap), `roundedPath`, `cubicBezier`.
- [ ] Run again → PASS. Commit `feat(landing): hero graph pure derivation from the architecture model`.

### Task 2: `HeroDag.tsx` — client SVG renderer (static structure first)

**Files:**
- Create: `apps/landing/components/hero/HeroDag.tsx`
- Test: `apps/landing/tests/hero.test.tsx`

**Consumes:** Task 1 exports. **Produces:** default-exported? No — named `HeroDag`, props `{}`; renders `<svg role="img" aria-label="nanisoft digital-twin pipeline …">` with marker defs (`hero-arrow`, `hero-arrow-active`), layer `<g>`s (labels/platform/observer/spine/beam), one `<g data-node-id>` per node (rect rx=12 + codename text + optional realName second line + `<title>`), one `<path data-edge-id>` per edge with `marker-end`, phase label texts, root attr `data-motion`.

- [ ] Write failing tests: svg role/label present; every model node id has a `[data-node-id]`; edge path count > 10; markers defined; phase names visible; `data-motion` present.
- [ ] Run → FAIL. Implement static render (nodes/edges/phases/markers/layers, token colors, `.mono` labels). Reduced-motion initial read via lazy `useState` initializer (SSR-safe `typeof window` guard).
- [ ] Run → PASS. Commit `feat(landing): HeroDag SVG renderer — nodes, routed edges, arrowheads, phase bands`.

### Task 3: Motion + pointer reactivity + reduced motion

**Files:**
- Modify: `apps/landing/components/hero/HeroDag.tsx`

**Consumes:** `cubicBezier(EASING_X…)` from Task 1, identity `easing`.
- [ ] Wavefront: rAF-driven beam `x(t)` — hop column-to-column every 1050ms over ~880ms with brand easing, dwell, fade-wrap after last column; beam = jade gradient rect (low opacity); active column chips get jade stroke; arrival triggers one ripple ring per chip (CSS animation re-triggered by key/class rotation).
- [ ] Pointer: `pointermove` stores target in ref (converted to viewBox coords); the same rAF loop smooths pointer (exp lerp), applies per-node attraction transform + brightness within ~180px, edge opacity boost near midpoints, layer parallax (labels ×0.5, bands ×1.2, max 7px). All writes imperative on refs — zero React state per frame. `pointerleave` lerps home. Skipped entirely for coarse pointers (`matchMedia('(hover: none)')`) or reduced motion.
- [ ] Reduced motion: no loop, beam parked at Core column as a static jade ring, entrance animations disabled via `[data-motion='settled']` CSS, content identical.
- [ ] Tests (jsdom-safe): matchMedia stubbed reduce:true → `data-motion="settled"` AND node count unchanged; default → `data-motion="live"`; rAF/matchMedia absence must not throw during render (setup.ts polyfills exist).
- [ ] Run suite → PASS. Commit `feat(landing): hero wavefront + pointer depth + reduced-motion settled state`.

### Task 4: `Hero.tsx` shell — overlay copy, scrim, responsive

**Files:**
- Modify: `apps/landing/components/Hero.tsx` (full rewrite; keeps `export function Hero()`)

- [ ] Server Component (no directive): `<section id="hero">` → absolutely-positioned `HeroDag`, radial scrim (`color-mix(in srgb, var(--color-bg) …)`), overlay block: W1 wordmark display-scale inside `aria-hidden` span (TopNav owns the AT announcement; page.test asserts exactly two labeled marks) + `<h1>Digital <em>twin</em> of the IT estate.</h1>`; remove CTA/logo strip/metrics/Sentinel eyebrow. Responsive: overlay fluid; canvas `overflow-x:auto` with inner min-width 900px under 720px.
- [ ] Tests added to `tests/hero.test.tsx`: within hero — zero `button`/`link` roles; h1 is the positioning line; `.wordmark` present; full-page render still passes existing suites unchanged.
- [ ] Run full landing suite → PASS. Commit `feat(landing): hero shell — wordmark + positioning line over the DAG, no buttons`.

### Task 5: Verification bar

- [ ] `pnpm install` at worktree root (fresh worktree needs node_modules).
- [ ] `pnpm --filter @nanisoft/landing test` green (existing 18 + new).
- [ ] `pnpm --filter @nanisoft/landing build` exit 0.
- [ ] `pnpm --filter @nanisoft/architecture test` 124/124; `pnpm --filter @nanisoft/identity test` 34/34.
- [ ] `pnpm --filter @nanisoft/landing lint` clean.
- [ ] Self-review vs ticket criteria; commit docs; final branch report.

## Self-review

- Spec coverage: criterion 1 → Tasks 1–2 (+ wavefront/observer in 3); 2 → Tasks 3–4; 3 (validated-stack decision) → design doc §1 (hand-roll rationale documented, coordinator-blessed option); 4 → Task 3; 5 → Tasks 3–4 tests; 6 → Task 4 (name kept); 7 → Tasks 2–4 tests + Task 5.
- Placeholders: none — geometry locked above; algorithms specified.
- Type consistency: interfaces in Task 1 are the single source consumed verbatim by Tasks 2–3.
