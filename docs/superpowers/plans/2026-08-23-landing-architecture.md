# Landing architecture section (ticket 20) — plan

**Spec:** `docs/superpowers/specs/2026-08-23-landing-architecture-design.md`
**Branch:** `feat/20-architecture-section`

## Steps

1. **Pure module, test-first** — `apps/landing/lib/spine-graph.ts`
   - Write failing units in `tests/architecture-section.test.tsx` (reducer + geometry blocks) first.
   - Implement: layout constants; stage columns from `PIPELINE_SPINE` × `STAGE_COMPONENTS`; Watchtower at mean-target x; platform band spread; phase groups (Sources subtle); edge filtering (drop persona edges), mutual-pair lane offsets, three routing strategies (`straight` / `nearElbow` / `bottomChannel`) with rounded corners; `deriveSectionState(idx)` reducer.
   - Gate: new tests green, old suites untouched.
2. **Component, test-first** — `apps/landing/components/ArchitectureSection.tsx`
   - Failing component tests: heading, four phase labels, Watchtower/codenames, CTA href, reduced-motion end-state via matchMedia stub.
   - Implement: sticky scroll wrapper (~320vh), rAF-throttled passive scroll listener → activeIdx; matchMedia gate (static end-state when reduced); SVG render (markers per state via style-filled defs, edges under chips, bands below); phase captions (landing-tone copy in-file); bridge CTA PillButton → https://playground.nanisoft.com (target _blank, rel noopener noreferrer).
3. **Wire the page** — one additive edit to `app/page.tsx`: import + `<ArchitectureSection />` between `<Problem />` and `<Platform />`. Nothing else.
4. **Verify** — `pnpm --filter @nanisoft/landing lint && test && build`; regression check `pnpm --filter @nanisoft/architecture test` (124) + `@nanisoft/identity` (34).
5. **Review + close** — self code-review against file-boundary contract + taste rules (jade discipline, shape lock, tone); tick nothing in the ticket file (coordinator owns doc sync); commit on the feature branch.

## Guardrails

- Touch only: `lib/spine-graph.ts`, `components/ArchitectureSection.tsx`, `tests/architecture-section.test.tsx`, `app/page.tsx` (one edit), docs.
- No new deps → no lockfile change. No playground/packages edits.
- Copy: plain, confident, no hype words, no invented metrics.
