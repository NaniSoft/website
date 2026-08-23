# Landing hero — reactive DAG pipeline · Design

> Ticket 19 (`.scratch/nanosoft-digital-twin/issues/19-landing-hero-dag.md`) · SPEC §2 (hero graph language) + §3.1 (Hero section). Replaces the placeholder `apps/landing/components/Hero.tsx`. Branch: `feat/19-hero-dag`.

## 1. Stack decision

Three options were weighed against the actual requirements: mouse-reactivity, orthogonal routed edges with soft 90° bends + arrowheads, a jade wavefront, a reduced-motion static end-state, and no buttons.

| | A. react-force-graph-2d | B. @xyflow/react | C. hand-rolled SVG from the model |
|---|---|---|---|
| Directed left→right DAG | Force physics → scattered mesh; SPEC §2 explicitly forbids ("not a scattered mesh"). Would need every node pinned via fx/fy, leaving the lib as a canvas line-drawer. | Native fit (node/edge model), but its drag/pan/zoom/connection machinery is all suppressed for a no-button spectacle. | Native — layout is fully determined by the model (`PIPELINE_SPINE` columns × `STAGE_COMPONENTS` rows); playground's pure `buildSpineGraph()` already proves the derivation. |
| Orthogonal soft bends + arrowheads | Custom canvas painting per edge anyway. | `smoothstep` edges ≈ free; `markerEnd` free. | ~40 lines of waypoint geometry + rounded-corner path emission; `<marker>` arrowheads. |
| Mouse-proximity depth effects | Custom. | Custom (React Flow has none). | Custom — and it is the *only* code, with direct DOM access. |
| Reduced-motion static end-state | Canvas repaint loop must be suppressed manually. | Fine. | Trivial — content never depends on motion; skip the stepper + listeners. |
| Testability (landing vitest / jsdom) | None — canvas is opaque to jsdom and AT. | DOM-rendered, but needs container measurements that jsdom zeroes. | Everything is real SVG DOM: nodes, labels, paths, markers all assertable. |
| Bundle / supply chain | Re-adds the dep ticket 18 just removed from landing ("dead KG family"). | ~100KB+ min into the landing's first-paint bundle for one graphic. | **Zero** new dependencies. |

**Decision: C — hand-rolled SVG derived purely from `@nanisoft/architecture`.** The ticket's parenthetical ("validated stack") came from SPEC §4.1's *playground* recommendation, where React Flow earns its keep as an editing surface; SPEC §2's hero language (geometry + motion) carries no library requirement. The coordinator brief explicitly biases toward "the lightest thing that satisfies" the four behaviors — all three options need bespoke code for proximity reactivity and the wavefront, so the library's remaining value collapses to edge routing, which is simple grid-aligned geometry. Hand-rolled also keeps `package.json`/lockfile untouched (no supply-chain surface, no React 19.2.8 / Next 16.3.1 compat risk) and makes the reduced-motion path trivially correct because rendering never depends on motion state.

## 2. Architecture

```
components/Hero.tsx            ← keeps the `Hero` export (page.tsx untouched);
                                  now a Server Component: section shell + overlay copy
components/hero/hero-graph.ts  ← pure model→geometry derivation (no React, unit-testable)
components/hero/HeroDag.tsx    ← 'use client': renders the SVG, owns pointer rAF loop,
                                  wavefront stepper, reduced-motion switch
```

No `dynamic({ssr:false})` anywhere: `Hero` (server) imports `HeroDag` directly — the `'use client'` boundary in `HeroDag.tsx` is the client wrapper. All colors come from the CSS custom properties in `globals.css` (token discipline; no raw hex in components). Node labels use JetBrains Mono (`.mono`, the twin's data face).

### hero-graph.ts (pure)

Mirrors the approach of `apps/playground/app/_spine/spine-graph.ts` (learned from, not imported — cross-app imports are forbidden):

- Renders spine stages (15 components across the 8 `PIPELINE_SPINE` columns) + `OBSERVER_COMPONENTS` (Watchtower, band above) + platform-kind components (Anchor, Conveyor, OpenBao, second band above). Personas are dropped — same precedent as the playground spine.
- Emits `HeroNode { id, cx, cy, band }`, `HeroEdge { id, dotted, waypoints }` (orthogonal waypoints with backward/same-column channels), `HeroPhase { name, x0, x1 }` groups derived by grouping consecutive stage columns by phase, plus the viewBox.
- Edge router: forward = exit right → enter left; same-column = parallel vertical rails at `cx ± offset`; backward = channel below the spine (staggered lanes); observer/platform drop in from above into target tops. All bends rounded (quadratic corners, radius clamped to half segment length).
- Also exports small pure helpers used by the renderer: `roundedPath(waypoints)` (path `d` string) and `cubicBezier(p1x,p1x,p2x,p2y)(t)` evaluator so the brand easing `cubic-bezier(.32,.72,0,1)` drives JS-side animation exactly.

### HeroDag.tsx ('use client')

Renders `<svg role="img" aria-label="…pipeline…" >` with:

- **Layers** (back→front): phase labels · platform band · observer band · spine · wavefront beam. Each layer wrapper gets a parallax factor for pointer depth.
- **Wavefront**: a soft jade beam (~140px, low-opacity gradient rect) sweeping left→right, hopping column-to-column on the prototype's ~1.1s cadence with the brand easing; on arrival at a column its nodes ripple once and breathe while active; the front fades out after the last column and restarts. Jade appears ONLY here (+ the wordmark's live link) — hover/highlight states stay neutral per the jade lock.
- **Pointer reactivity** (haptic depth): one `pointermove` listener stores the target point in a ref; a single rAF loop smooths toward it (brand-eased lerp), then writes imperative styles only — per-node `transform: translate(dx·w·k, dy·w·k) scale(1+w·0.05)` attraction within a ~180px radius, a `--near` custom property driving CSS fill/stroke transitions on nodes, class toggles (with CSS transitions) for near-edge emphasis, and layer parallax (max ~8px, opposite directions per band). `pointerleave` lerps back to rest. No React state per frame.
- **Reduced motion** (`prefers-reduced-motion: reduce`, read via `matchMedia`): no stepper, no listeners, entrance animations skipped; the wavefront renders parked at rest (static jade ring on the Core column) — full content intact, root carries `data-motion="settled"`.
- Entrance: per-column staggered settle (rise + fade, brand easing), CSS-transition driven.

### Hero.tsx (Server Component shell)

- `<section id="hero">`: absolute-positioned `HeroDag` canvas behind, overlay content in front (wordmark + positioning line), radial scrim (`color-mix` on `--color-bg`) behind the text for legibility.
- Overlay: W1 wordmark at display scale (wrapped `aria-hidden` — TopNav already announces the brand to AT, and page.test asserts exactly two labeled marks; this avoids a third) + `<h1>Digital <em>twin</em> of the IT estate.</h1>` — the positioning line becomes the page heading; italic = emphasis per identity.
- Removed per ticket: demo CTA (`PillButton`), customer logo strip, metrics row, Sentinel-era eyebrow/copy. The demo-request API route stays (FinalCTA owns CTAs).

## 3. Responsive + accessibility posture

- Desktop: SVG scales via `viewBox` + `preserveAspectRatio="xMidYMid meet"` inside a min-height ~78vh section.
- Narrow screens (<720px): the canvas becomes horizontally swipeable (`overflow-x: auto`, inner min-width ~900px) — natural for a left→right pipeline; overlay text stays fluid.
- A11y: the diagram is `role="img"` with an aria-label naming the pipeline and the four phases; visible phase labels + node codenames carry the detail for sighted users; no interactive elements exist (pure spectacle), so nothing needs keyboard operation. Honors `prefers-reduced-motion` beyond the global CSS clamp by not running JS animation at all.

## 4. Testing strategy (vitest, jsdom — no Playwright additions)

New `apps/landing/tests/hero.test.tsx`:

1. Model-derived render: expected node set computed in-test from `@nanisoft/architecture` (spine + observer + platform ids); asserts each codename appears and the count matches.
2. Diagram semantics: `role="img"` svg present with pipeline label; arrowhead `<marker>`s defined; more than ten routed edge paths.
3. Phase context readable: Schema / Ingestion / Transform / Investigation texts present.
4. No buttons or links inside the hero section (pure spectacle).
5. Reduced motion: with `matchMedia` stubbed `matches: true`, root has `data-motion="settled"` and node count is unchanged (content intact).
6. Overlay: positioning line is the h1; decorative `.wordmark` present.

Existing suites must stay green unchanged (18/18): page.test's two-wordmark assertion holds because the hero mark is `aria-hidden`; data.test reads `lib/data.ts`, which is untouched.

## 5. Verification bar

`pnpm --filter @nanisoft/landing test` green · `pnpm --filter @nanisoft/landing build` exit 0 · `pnpm --filter @nanisoft/architecture test` 124/124 · `pnpm --filter @nanisoft/identity test` 34/34 · lint clean. Human visual confirm deferred (house precedent).
