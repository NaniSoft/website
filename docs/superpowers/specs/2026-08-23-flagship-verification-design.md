# Flagship playbook verification — design (ticket 17 close-out)

Date: 2026-08-23 · Ticket: `.scratch/nanosoft-digital-twin/issues/17-flagship-playbook-verification.md`
Branch: `feat/17-flagship-verification` · Scope: `packages/architecture` (tests), `apps/playground` (Playwright bootstrap + e2e specs).

## Problem

The flagship Sensitive Product View Audit (22 steps) is proven at the pure-core level (122 green unit tests; criterion 3 already closed), but nothing committed proves it *in the running app*: no Playwright setup exists anywhere in the tree. Remaining criteria:

1. Auto-run completes stopped at step 22 without errors, spine shows the done state.
2. Single-step canonical actions mutate/read exactly what auto-run does (one code path).
4. Export → reset → import roundtrips a *complete* 22-step run preserving the finding.
5. An inspector visibly shows the lakehouse evolving across the full run.

## Decisions

### D1 — Playwright lives app-level (`apps/playground/`)

`apps/playground/playwright.config.ts` + `apps/playground/e2e/*.spec.ts`. Rationale:
only the playground has e2e scope; `apps/landing` is owned by a parallel agent and
must stay untouched (a root-level config would sweep or need to exclude it);
matches the repo's per-package test-config pattern (vitest configs live per
package); gives a clean `pnpm --filter @nanisoft/playground test:e2e`. The
`webServer` runs the playground dev server (`pnpm dev`, port 3001) — required,
because the `window.__playground` store hook used for state assertions is
dev-only (stripped in production builds). `reuseExistingServer: !CI`.
New script: `test:e2e`. `@playwright/test` added as a devDependency of the
app; chromium is the only installed browser project. `test-results/` +
`playwright-report/` go to `.gitignore`.

### D2 — No vision: assertions come from roles/text/DOM attributes/live JS state

Never screenshots. Three assertion channels:

- **Real UI interaction** through roles and accessible names
  (`getByRole('button', { name: 'Run playbook' })`, aria-labelled overlays,
  inspector tabs, Compass node chips).
- **Live store state** through the existing dev-only `window.__playground`
  Zustand hook (read `getState().state` / `exportJson()`; never mutated by
  assertions except Spec B's deliberate programmatic re-application).
- **DOM/SVG structure** where visual semantics carry meaning: Narrative
  "step N / 22", inspector counts, Compass edge `stroke="#14A77A"` (jade =
  anomalous viewed) and `stroke-dasharray="4 4"` (the missing-memberof gap),
  spine chip border colors (jade active / teal done).

### D3 — One code path proven by direct pure-core comparison

Spec B imports the pure core (`applyStep`, `SENSITIVE_PRODUCT_VIEW_AUDIT`)
directly from `@nanisoft/architecture` (workspace TS source — Playwright
transforms TS across the module graph). At each of the four `store.step()`-wired
tools' beckon cursors (DataGerry @0, Airflow @6, Atlas @13, Trino @15): capture
the exported live state JSON, perform the real button click, then deep-compare
the resulting live state against `applyStep(prev, STEPS[prevCursor])` computed
in the test process. Same function, same input ⇒ same state, proven end-to-end
through the real UI wiring.

**Deliberate exceptions (documented, not fixed — SPEC §4.8):** Compass
drill-into and the Superset filter are UI-local read-lens actions; their
canonical act must NOT touch the store. Spec B asserts this negatively: the
exported state JSON is byte-identical before/after the interaction while the
UI-local state changes (selection/detail panel; filter `aria-pressed` + filtered
rows).

### D4 — Spec files

| File | Criteria | What it does |
|---|---|---|
| `e2e/helpers.ts` | — | Store readers, reset/step drivers, console-error collector fixture. |
| `e2e/spec-a-autorun.spec.ts` | 1 | Reset → Run → auto-run completes stopped at cursor 22, zero console/page errors, Narrative reads "step 22 / 22 · investigation", Investigation phase band done, the six tool chips all visited (teal). |
| `e2e/spec-b-canonical-actions.spec.ts` | 2 | Single-step to each beckon cursor; perform the four canonical buttons; assert equality with the programmatically applied step. Assert the two read-lens exceptions leave the store untouched. |
| `e2e/spec-c-inspector-evolution.spec.ts` | 3+5 | Step through the run checking inspector evolution: Schema gains `Sensitive:bool` after the DataGerry action; Bronze rows land at step 7; Gold 5 nodes/4 edges at step 10; audit rows appear at step 14 (→3 by 22). Read-lens spot checks: Trino anomalous row; Compass auto-opens at 19 with jade viewed edge + dashed memberof gap; Superset dashboard bar/table/donut **after** the run (never pre-run — known carry-forward: the store boots on empty-Gold `blankState()`; SPEC §6 records it; out of scope here). |

Serial workers (dev-server compile races + shared single-instance store make
parallelism pointless here). Spec A carries a long timeout (~25s of paced
auto-run + first-compile warmup).

### D5 — Criterion 4 stays pure-core

A ~12-line addition beside the existing roundtrip test in
`packages/architecture/tests/playground-state.test.ts`: drive all 22 steps via
`applyStep`, `exportState` → fresh `blankState()` → `importState`, assert the
finding survives (`user === 'j.harper'`, P-1042 / Payroll-NG / sensitive),
gold 5/4, 3 audit entries, cursor 22 preserved.

## Error-handling posture

Any failure the specs catch in product code gets a minimal fix + prominent
report. Specs are never weakened silently to go green. Console-error gate is
strict: zero `console.error` + zero pageerrors during Spec A's run.

## Verification

1. `pnpm --filter @nanisoft/architecture test` → 123+ green (122 + new roundtrip).
2. `pnpm --filter playground build` → exit 0 (config/specs must not break the build).
3. `pnpm --filter playground test:e2e` → green locally.
