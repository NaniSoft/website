# Flagship Playbook Verification Implementation Plan (ticket 17)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the full 22-step Sensitive Product View Audit end-to-end with committed automated coverage — one new pure-core roundtrip test (criterion 4) and three no-vision Playwright specs bootstrapped for `apps/playground` (criteria 1, 2, 3+5).

**Architecture:** App-level Playwright setup (`apps/playground/playwright.config.ts`, specs in `apps/playground/e2e/`) whose `webServer` runs the playground dev server on :3001 (the dev-only `window.__playground` store hook is the state-assertion channel). Specs interact through real buttons/roles and assert via DOM text/attributes + live store JSON; Spec B deep-compares button-click results against `applyStep` computed in the test process (one code path). No app source changes expected; anything a spec catches gets a minimal fix.

**Tech Stack:** `@playwright/test` (chromium only), Next.js 16.3.1 dev server, Zustand store hook `window.__playground`, vitest (pure-core test), pnpm workspace (`@nanisoft/architecture` TS-source package).

## Global Constraints

- Branch `feat/17-flagship-verification`; never merge to main, never push.
- Do NOT touch `apps/landing`. Do NOT resolve the Superset pre-run-seed carry-forward (SPEC §6).
- No-vision rule: never screenshots; assert via accessibility roles/text, DOM/SVG attributes, or `window.__playground` state only.
- AGENTS.md: modified Next.js — relevant guide (`node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`) already read: use `webServer` for the dev server, `baseURL` in config.
- Store facts relied on: beckon cursors are DataGerry @0, Airflow @6, Atlas @13, Trino @15 (`STEPS.findIndex(s => s.openTool === id)`); `STEPS[cursor]` is the next step to apply; auto-run pace 1100 ms/step; `window.__playground` exists only when `NODE_ENV !== 'production'`.
- Identity colors for DOM assertions: jade `#14A77A` (rgb(20,167,122)), teal `#2A8C97` (rgb(42,140,151)).

---

### Task 1: Pure-core full-run roundtrip test (criterion 4)

**Files:**
- Modify: `packages/architecture/tests/playground-state.test.ts` (append inside the existing `describe('export / import — SPEC §4.5 persistence')` block)

**Interfaces:**
- Consumes: `applyStep`, `blankState`, `exportState`, `importState` from `../src/index`; `SENSITIVE_PRODUCT_VIEW_AUDIT` from `../src/index`.
- Produces: test `roundtrips a COMPLETE 22-step flagship run preserving the finding` — 123rd suite test.

- [ ] **Step 1: Write the test** (append to the export/import describe block)

```ts
  it('roundtrips a COMPLETE 22-step flagship run preserving the finding (ticket 17 criterion 4)', () => {
    let played = blankState();
    for (const step of SENSITIVE_PRODUCT_VIEW_AUDIT) played = applyStep(played, step);
    const back = importState(exportState(played));
    expect(back).toEqual(played);
    expect(back.cursor).toBe(22);
    expect(back.finding).toMatchObject({ user: 'j.harper', product: 'P-1042', productName: 'Payroll-NG', sensitive: true, missingMembership: true });
    expect(back.gold.nodes).toHaveLength(5);
    expect(back.gold.edges).toHaveLength(4);
    expect(back.auditLog).toHaveLength(3);
  });
```

Add `SENSITIVE_PRODUCT_VIEW_AUDIT` to the existing import from `'../src/index'`.

- [ ] **Step 2: Run** — `pnpm --filter @nanisoft/architecture test`
  Expected: 123 passed (a failure here is a product bug — fix, don't weaken).

- [ ] **Step 3: Commit** — `test(architecture): full-run export/import roundtrip preserves the finding (ticket 17 c4)`

### Task 2: Playwright bootstrap + smoke spec

**Files:**
- Create: `apps/playground/playwright.config.ts`
- Create: `apps/playground/e2e/helpers.ts`
- Create: `apps/playground/e2e/smoke.spec.ts`
- Modify: `apps/playground/package.json` (devDep `@playwright/test`, script `test:e2e`)
- Modify: `.gitignore` (append `test-results/`, `playwright-report/`)

**Interfaces:**
- Produces (`helpers.ts`, used by all later tasks):
  - `type StoreState = { cursor: number; running: boolean; overlay: { componentId: string } | null; json: string }`
  - `readStore(page: Page): Promise<{ cursor: number; running: boolean; overlayComponent: string | null; json: string }>` — via `window.__playground`
  - `resetViaUi(page)`, `stepTo(page, target: number)` (clicks the real `Step →` button until `readStore().cursor >= target`)
  - `openToolChip(page, codename: string)` (clicks `[aria-label="Open <codename> mock"]`)
  - `makeConsoleCollector(page)` → `{ errors: string[], pageErrors: string[] }` (wires `console` type=error + `pageerror`)
  - declares global `__playground` typing.

- [ ] **Step 1: Add dep + script + gitignore.** `pnpm --filter @nanisoft/playground add -D @playwright/test`; script `"test:e2e": "playwright test"`; append to `.gitignore`:
```
# Playwright output
test-results/
playwright-report/
```
If the registry's `minimumReleaseAge` blocks the newest `@playwright/test`, pin the newest version older than the window or add a `minimumReleaseAgeExclude` entry in `pnpm-workspace.yaml` (document which).

- [ ] **Step 2: Config** (`apps/playground/playwright.config.ts`):

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
```

- [ ] **Step 3: helpers.ts** — store access via `page.evaluate` on `(window as any).__playground`; `readStore` returns `{ cursor, running, overlayComponent, json }` where `json = usePlayground.getState().exportJson()`; `stepTo` polls `readStore` and clicks `getByRole('button', { name: 'Step →' })` while `cursor < target` (guard 30 iterations); `resetViaUi` clicks `Reset`; console collector wires `page.on('console', m => m.type() === 'error' && errors.push(m.text()))` and `page.on('pageerror', e => pageErrors.push(String(e)))`.

- [ ] **Step 4: smoke.spec.ts** — proves the three risky mechanics before real specs are written:
  1. dev server serves `/` and the spine mounts (`.react-flow` visible);
  2. `window.__playground` is present and `readStore` returns cursor 0;
  3. specs can import the pure core: `import { SENSITIVE_PRODUCT_VIEW_AUDIT } from '@nanisoft/architecture'` and `expect(STEPS).toHaveLength(22)`.

- [ ] **Step 5: Install browser + run** — `pnpm --filter playground exec playwright install chromium`, then `pnpm --filter playground test:e2e`. Expected: smoke passes. (If the workspace-TS import fails, fall back per design D3: in-page before/after equivalence — record the fallback in the design doc.)

- [ ] **Step 6: Commit** — `test(playground): bootstrap Playwright (app-level config, dev webServer :3001, no-vision helpers)`

### Task 3: Spec A — auto-run completes (criterion 1)

**Files:**
- Create: `apps/playground/e2e/spec-a-autorun.spec.ts`

**Interfaces:**
- Consumes: helpers from Task 2; Narrative text format `step {n} / 22 · phase: {phase}`; phase band text nodes (`Investigation` div, computed color teal `rgb(42, 140, 151)` when done); tool chips `[aria-label="Open <Codename> mock"]` with computed border-color teal when visited; store `running:false` at cursor 22.

- [ ] **Step 1: Write spec** — goto `/`; attach console collector before navigation; wait for `.react-flow`; `resetViaUi`; click `▶ Run playbook`; `waitForFunction(() => window.__playground.getState().state.cursor === 22 && !window.__playground.getState().running, 90s)`; assert:
  - `readStore().cursor === 22`, `running === false`;
  - collector `errors` and `pageErrors` both empty (fail with the collected messages);
  - Narrative contains `step 22 / 22 · phase: investigation`;
  - the `Investigation` phase band's computed color is `rgb(42, 140, 151)` (done);
  - the five path tool chips (Blueprint, Trailhead, Atlas, Overlook, Compass) all have computed border-color `rgb(42, 140, 151)` (visited/done).

- [ ] **Step 2: Run** — `pnpm --filter playground test:e2e -- --grep "A"` (spec titled `A — full auto-run ...`). Fix whatever it catches (product fixes minimal + reported).

- [ ] **Step 3: Commit** — `test(playground): spec A — 22-step auto-run completes stopped, error-free, spine done state`

### Task 4: Spec B — canonical actions, one code path (criterion 2)

**Files:**
- Create: `apps/playground/e2e/spec-b-canonical-actions.spec.ts`

**Interfaces:**
- Consumes: helpers; pure core `applyStep`, `SENSITIVE_PRODUCT_VIEW_AUDIT` (imported in the spec); overlay action buttons by accessible name: `Add Sensitive: bool` (DataGerry), `Run this DAG` (Airflow), `Evaluate authz` (Atlas), `Run query` (Trino); Compass node chips `[aria-label="inspect j.harper"]`; Superset `Sensitive only` toggle.

- [ ] **Step 1: Write spec.** Fresh page per test section; shared flow `stepTo(page, beckonCursor)` → `openToolChip` → snapshot `json` before → click the action button → `json` after. For each of the four store-wired tools assert `afterJson === JSON.stringify(applyStep(JSON.parse(beforeJson), STEPS[beforeCursor]))` (exact string equality; both sides derive from the same key-ordered serialization) plus one human-visible mutation (Sensitive field visible; run log line; audit entry; results table).
  Then the two documented read-lens exceptions:
  - Compass (auto-opened at step 19 after `stepTo(19)`): click `inspect j.harper` → detail panel shows `no backing group membership`; store `json` unchanged from before the click.
  - Superset: `openToolChip('Superset')` at cursor 19 → click `Sensitive only` → `aria-pressed=true`, bar list shows only Payroll-NG; store `json` unchanged.
  A comment block documents WHY these two are UI-local (SPEC §4.8 read lenses; deliberate exception, not a bug).

- [ ] **Step 2: Run** — `pnpm --filter playground test:e2e -- --grep "B"`. Fix what it catches.

- [ ] **Step 3: Commit** — `test(playground): spec B — canonical actions match applyStep exactly; read-lens exceptions stay UI-local`

### Task 5: Spec C — inspector evolution + three lenses (criteria 3+5)

**Files:**
- Create: `apps/playground/e2e/spec-c-inspector-evolution.spec.ts`

**Interfaces:**
- Consumes: helpers; inspector count row labels (`Bronze`, `Silver`, `Gold nodes`, `Gold edges`, `Audit`), inspector tabs (buttons `Bronze|Silver|Gold|Schema|Audit`), inspector body `[aria-label="inspector-state"]`; Trino results table `[aria-label="query results"]` + row `[aria-label="j.harper anomalous view of P-1042"]`; Compass dialog `[role="dialog"][aria-label="Compass"]` + svg lines + narrative `ol`; Superset sections (`Products by exposure count`, `Users with anomalous views`, `Views by source system`).

- [ ] **Step 1: Write spec** (single test, sequential checkpoints):
  1. Boot: counts Bronze 0 / Gold nodes 0 / Audit 0 (blank boot — the documented carry-forward; NO seeded-dashboard assertions).
  2. Schema tab: `id`, `name`, `owner_group` present; `Sensitive` absent.
  3. Open Blueprint → click `Add Sensitive: bool` → Schema tab shows `Sensitive:bool`.
  4. `stepTo(7)`: Bronze count 4; Bronze tab `ext_product · 2 rows` + `view_logs · 2 rows`.
  5. `stepTo(10)`: Gold nodes 5, Gold edges 4; Gold tab lists `P-1042` with `sensitive`.
  6. `stepTo(14)`: Audit count 1; Audit tab contains `OPA allowed`.
  7. `stepTo(16)` → open Overlook: results table shows the anomalous row `j.harper` / `P-1042` with an `anomalous` pill (read lens 1 — table row).
  8. `stepTo(19)`: Compass dialog is open WITHOUT any chip click (the one auto-open); svg has a `line[stroke-dasharray="4 4"]` (the memberof gap) and a jade `line[stroke="rgb(20, 167, 122)"]`-equivalent (`#14A77A`); narrative lists `j.harper viewed P-1042` and `no memberof edge to G-SR` (read lens 2 — edges); drill into `inspect j.harper` → `no backing group membership`.
  9. `stepTo(22)`: Audit count 3.
  10. Close Compass, open Superset: bar section lists Payroll-NG with `1 exposed · 2 views`; table section row `j.harper` + `no backing membership`; donut legend `SQL Server Fleet` and `Active Directory` with `2 · 50%` each (read lens 3 — dashboard; post-run only, per the carry-forward caution).

- [ ] **Step 2: Run** — `pnpm --filter playground test:e2e -- --grep "C"`. Fix what it catches.

- [ ] **Step 3: Commit** — `test(playground): spec C — inspector evolution across 22 steps + three read lenses`

### Task 6: Full verification + docs

- [ ] **Step 1:** `pnpm --filter @nanisoft/architecture test` → all green (123+).
- [ ] **Step 2:** `pnpm --filter playground build` → exit 0.
- [ ] **Step 3:** `pnpm --filter playground test:e2e` → all specs green in one run.
- [ ] **Step 4:** Skills gate: `superpowers:verification-before-completion` then `mattpocock-skills:code-review` (review diff vs main along Standards + Spec axes); fix findings.
- [ ] **Step 5:** Update `.scratch/nanosoft-digital-twin/issues/17-flagship-playbook-verification.md` — tick criteria 1/2/4/5, rewrite the Status line to record what closed them (unit test + committed Playwright suite), note any product bugs found/fixed and the two read-lens exceptions.
- [ ] **Step 6:** Final commit(s) — `docs(nanosoft): ticket 17 close-out — criteria 1/2/4/5 proven by committed tests`.
