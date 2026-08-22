# Airflow / Trailhead mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the second mocked-tool overlay — Airflow / Trailhead — the "ingest" write surface: an ingestion-DAG mock (`extract_AD / extract_Workday / extract_SQLFleet → load_Bronze`, per-task `pending → running (jade) → success (teal)`, a one-line-per-run log, a "Run this DAG" trigger) plus a passive transform DAG (`Forge → Silver → Gold`), dropping into the ticket-11 framework with no chrome/store/state changes.

**Architecture:** Pure domain core (`packages/architecture`, framework-agnostic, vitest) gains `loadBronze(state)` (the canonical ingestion mutate, mirroring `authorSensitiveProductField`) and `airflowDagStatus(state, cursor)` (a pure DAG run-state derivation, mirroring `dataGerrySyncStatus`). `apps/playground` gains only `AirflowOverlay.tsx` + one line in the `tool-content.ts` registry. The overlay's "Run this DAG" button calls `store.step()` — the same `applyStep` auto-run uses — and step 7's `apply` calls `loadBronze`, so single-step and auto-run share one mutate. Bronze is already modelled; no `SeedDataset`/`PlaygroundState`/store/chrome changes.

**Tech Stack:** Next.js 16.3.1 (stock, modified — see Global Constraints), pnpm monorepo, `@xyflow/react` ^12, Zustand ^5, `@nanisoft/architecture` + `@nanisoft/identity` (workspace), vitest 4 (architecture package only).

## Global Constraints

- **AGENTS.md (modified Next.js):** read the relevant guide in `node_modules/next/dist/docs/` (resolved from the consuming app's directory) before writing any Next code. Heed deprecation notices. `'use client'` wrapper + `dynamic({ssr:false})` stays INSIDE the client wrapper (never in a Server Component) — the 09/10/11 `page.tsx` Server → `playground-client.tsx` `'use client'` → `dynamic(ssr:false)` `Spine` spine pattern is untouched by this ticket.
- **No vision workflow:** verify via `pnpm -r build`, console messages, Playwright MCP a11y snapshot, live JS state (`window.__playground.getState()`), + a human visual confirm (deferred — operator AFK; a11y + build + live-state stand in).
- **Add vitest for any pure logic** (architecture package; `environment: node`, `tests/**/*.test.ts`). React components have no unit-test runner in the playground — verify via build + Playwright MCP.
- **Jade = single locked accent, live/active only; teal = done. No pure white/black.** Jade appears only on: the running (live) DAG task (border + soft fill + pulse) and the enabled trigger button's accent. Success tasks and success run-log lines are teal. Pending is petrol.
- **Pure core must not import React/Next/Zustand/React Flow.** The overlay React lives in `apps/playground`.
- **Identity tokens:** `color` (`jade`, `teal`, `petrolSoft`), `surface`, `font` (`data`, `voice`), `radius` (`inner`, `card`) from `@nanisoft/identity`. Shape lock: card radius 20, inner 12, buttons pills. A global `prefers-reduced-motion` guard already lives in `apps/playground/app/globals.css` (suppresses all animations); running state must be readable from color alone.
- Run tests from the repo root with `pnpm -r run test` (architecture + identity + landing). The playground has no test script.
- Commit on the branch `feat/12-airflow-mock` (already checked out).

---

## File Structure

**`packages/architecture` (pure + vitest):**
- Modify `src/tool-actions.ts` — add `loadBronze(state)` (the Airflow canonical-action mutate; idempotent).
- Modify `src/overlay.ts` — add `airflowDagStatus(state, cursor)` + `AirflowTaskState`/`AirflowTask`/`AirflowDag`/`AirflowRunLogLine`/`AirflowDagStatus` types (next to `dataGerrySyncStatus`).
- Modify `src/playbook.ts` — step 7 `apply` → `loadBronze(s)`; step 7 gains `openTool: 'trailhead'`.
- Modify `src/index.ts` — re-export `loadBronze` + `airflowDagStatus` + the new types.
- Extend `tests/tool-actions.test.ts` (loadBronze), `tests/overlay.test.ts` (airflowDagStatus), `tests/playbook.test.ts` (step 7 openTool).

**`apps/playground` (React shell):**
- Create `app/_overlay/AirflowOverlay.tsx` — the DAG mock body (ingestion mini-DAG + trigger + run log + passive transform mini-DAG + fidelity footer).
- Modify `app/_overlay/tool-content.ts` — add `trailhead: AirflowOverlay` (the single registration point).

Nothing else changes: `ToolOverlay.tsx`, `usePlayground.ts`, `Spine.tsx`, `NodeChip.tsx`, `playground-client.tsx`, `globals.css` are untouched. `trailhead` is already `fullUi: true` (node already clickable); `openTool`/`closeTool`/`step` already exist; `MOCK_TOOL_BY_COMPONENT['trailhead']` already carries the canonical-action/shows/reads/writes/fidelity text. No new dependency, no new state field (Bronze already in `SeedDataset`/`PlaygroundState`).

---

### Task 1: Pure core — `loadBronze` canonical action

**Files:**
- Modify: `packages/architecture/src/tool-actions.ts` (append after `authorSensitiveProductField`)
- Modify: `packages/architecture/src/index.ts` (the `// ── Tool canonical actions ──` block ~line 97)
- Test: `packages/architecture/tests/tool-actions.test.ts` (append a describe block)

**Interfaces:**
- Produces: `loadBronze(state: PlaygroundState): void` — idempotently sets `state.bronze = { products: state.products, viewLogs: state.viewLogs }`. Used by step 7's `apply` (Task 3) AND by the overlay's "Run this DAG" button via `store.step()` (Task 4) — the one code path.

- [ ] **Step 1: Write the failing tests**

Append to `packages/architecture/tests/tool-actions.test.ts` (after the existing `authorSensitiveProductField` describe block). Add `loadBronze` to the import from `'../src/index'`:

```ts
import {
  authorSensitiveProductField,
  blankState,
  loadBronze,
  reduceToCursor,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
} from '../src/index';
```

Append the new describe block:

```ts
describe('loadBronze — SPEC §4.8 Airflow canonical action (ingest)', () => {
  it('loads Bronze from the in-browser source rows (2 products + 2 view-logs)', () => {
    const s = blankState();
    expect(s.bronze.products).toHaveLength(0);
    expect(s.bronze.viewLogs).toHaveLength(0);
    loadBronze(s);
    expect(s.bronze.products).toHaveLength(2);
    expect(s.bronze.viewLogs).toHaveLength(2);
    expect(s.bronze.products.map((p) => p.id)).toEqual(['P-1042', 'P-2210']);
  });

  it('is idempotent (a second call does not duplicate or grow Bronze)', () => {
    const s = blankState();
    loadBronze(s);
    loadBronze(s);
    expect(s.bronze.products).toHaveLength(2);
    expect(s.bronze.viewLogs).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @nanisoft/architecture run test -- tool-actions`
Expected: FAIL — `loadBronze` is not exported (`TypeError: loadBronze is not a function` / import error).

- [ ] **Step 3: Implement — `tool-actions.ts`**

In `packages/architecture/src/tool-actions.ts`, append after `authorSensitiveProductField`:

```ts
/**
 * Airflow / Trailhead canonical action — trigger the ingestion DAG (SPEC §4.8):
 * land the raw extracted rows into Bronze (`bronze.products`, `bronze.view_logs`).
 * Idempotent — re-sets Bronze from the in-browser source rows (a no-op in effect
 * once already loaded; the overlay's "already run" guard is `bronze.products.length`).
 *
 * Used by step 7's `apply` AND by the overlay's "Run this DAG" button — the one
 * code path. Reads none (the DAG config / source rows are static in the mock).
 */
export function loadBronze(state: PlaygroundState): void {
  state.bronze = { products: state.products, viewLogs: state.viewLogs };
}
```

- [ ] **Step 4: Re-export from `index.ts`**

In `packages/architecture/src/index.ts`, update the tool canonical actions export block:

```ts
// ── Tool canonical actions ───────────────────────────────────────────────────
export { authorSensitiveProductField, loadBronze } from './tool-actions';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @nanisoft/architecture run test -- tool-actions`
Expected: PASS — both `loadBronze` tests pass; existing `authorSensitiveProductField` tests stay green.

- [ ] **Step 6: Commit**

```bash
git add packages/architecture/src/tool-actions.ts packages/architecture/src/index.ts packages/architecture/tests/tool-actions.test.ts
git commit -m "feat(arch): loadBronze canonical action (ticket 12)"
```

---

### Task 2: Pure core — `airflowDagStatus` derivation

**Files:**
- Modify: `packages/architecture/src/overlay.ts` (append after `dataGerrySyncStatus`)
- Modify: `packages/architecture/src/index.ts` (the `// ── Overlay chrome + derivations ──` block ~line 100)
- Test: `packages/architecture/tests/overlay.test.ts` (append describe blocks)

**Interfaces:**
- Produces:
  - `AirflowTaskState = 'pending' | 'running' | 'success'`
  - `AirflowTask = { id: string; label: string; stepN: number; state: AirflowTaskState }`
  - `AirflowDag = { id: 'ingestion' | 'transform'; title: string; tasks: AirflowTask[]; edges: [string, string][] }`
  - `AirflowRunLogLine = { dagId: 'ingestion' | 'transform'; run: number; status: 'running' | 'success'; text: string }`
  - `AirflowDagStatus = { ingestion: AirflowDag; transform: AirflowDag; runLog: AirflowRunLogLine[]; canTrigger: boolean; triggered: boolean }`
  - `airflowDagStatus(state: PlaygroundState, cursor: number): AirflowDagStatus`

- [ ] **Step 1: Write the failing tests**

Append to `packages/architecture/tests/overlay.test.ts`. Add `airflowDagStatus` to the import from `'../src/index'`:

```ts
import {
  airflowDagStatus,
  beckonToolId,
  dataGerrySyncStatus,
  overlayReducer,
  blankState,
  reduceToCursor,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  type OverlayState,
} from '../src/index';
```

Append the new describe blocks:

```ts
describe('airflowDagStatus — SPEC §4.8 Airflow DAG run-state', () => {
  it('cursor 0 → all tasks pending, no run log, cannot trigger, not triggered', () => {
    const d = airflowDagStatus(blankState(), 0);
    expect(d.ingestion.tasks.map((t) => t.state)).toEqual(['pending', 'pending', 'pending', 'pending']);
    expect(d.transform.tasks.map((t) => t.state)).toEqual(['pending', 'pending', 'pending']);
    expect(d.runLog).toEqual([]);
    expect(d.canTrigger).toBe(false);
    expect(d.triggered).toBe(false);
  });

  it('cursor 5 → extract_SQLFleet running, the rest pending; ingestion run running; not triggerable', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 5), 5);
    expect(d.ingestion.tasks.map((t) => t.state)).toEqual(['running', 'pending', 'pending', 'pending']);
    expect(d.runLog).toHaveLength(1);
    expect(d.runLog[0].status).toBe('running');
    expect(d.runLog[0].text).toContain('ingestion');
    expect(d.canTrigger).toBe(false);
    expect(d.triggered).toBe(false);
  });

  it('cursor 6 → extract_SQLFleet success; extract_AD + extract_Workday running (parallel); load_Bronze pending; canTrigger true', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 6), 6);
    expect(d.ingestion.tasks.map((t) => t.state)).toEqual(['success', 'running', 'running', 'pending']);
    expect(d.canTrigger).toBe(true);
    expect(d.triggered).toBe(false);
  });

  it('cursor 7 → all extracts success; load_Bronze running; triggered true (Bronze populated); not triggerable', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 7), 7);
    expect(d.ingestion.tasks.map((t) => t.state)).toEqual(['success', 'success', 'success', 'running']);
    expect(d.triggered).toBe(true);
    expect(d.canTrigger).toBe(false);
    expect(d.runLog[0].status).toBe('running');
  });

  it('cursor 8 → all 4 ingestion tasks success; ingestion run success line with counts; transform forge running; runLog has 2 lines', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 8), 8);
    expect(d.ingestion.tasks.map((t) => t.state)).toEqual(['success', 'success', 'success', 'success']);
    expect(d.transform.tasks.map((t) => t.state)).toEqual(['running', 'pending', 'pending']);
    expect(d.runLog).toHaveLength(2);
    expect(d.runLog[0].status).toBe('success');
    expect(d.runLog[0].text).toContain('loaded 2 products · 2 view-logs');
    expect(d.runLog[1].status).toBe('running');
    expect(d.runLog[1].text).toContain('transform');
  });

  it('cursor 10 → transform forge + silver success, gold running; transform run still running', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 10), 10);
    expect(d.transform.tasks.map((t) => t.state)).toEqual(['success', 'success', 'running']);
    expect(d.runLog[1].status).toBe('running');
  });

  it('cursor 11 → transform all success; transform run success line with Gold counts; 2 run-log lines both success', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 11), 11);
    expect(d.transform.tasks.map((t) => t.state)).toEqual(['success', 'success', 'success']);
    expect(d.runLog).toHaveLength(2);
    expect(d.runLog[1].status).toBe('success');
    expect(d.runLog[1].text).toContain('Gold 5 nodes / 4 edges');
  });

  it('cursor 22 → all 7 tasks success; 2 success run-log lines; not triggerable; triggered', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 22), 22);
    expect(d.ingestion.tasks.every((t) => t.state === 'success')).toBe(true);
    expect(d.transform.tasks.every((t) => t.state === 'success')).toBe(true);
    expect(d.runLog).toHaveLength(2);
    expect(d.runLog.every((l) => l.status === 'success')).toBe(true);
    expect(d.canTrigger).toBe(false);
    expect(d.triggered).toBe(true);
  });

  it('ingestion DAG shape: 3 extracts → load_Bronze (fan-in edges)', () => {
    const d = airflowDagStatus(blankState(), 0);
    expect(d.ingestion.tasks.map((t) => t.label)).toEqual(['extract_SQLFleet', 'extract_AD', 'extract_Workday', 'load_Bronze']);
    expect(d.ingestion.edges).toEqual([
      ['extract_sqlfleet', 'load_bronze'],
      ['extract_ad', 'load_bronze'],
      ['extract_workday', 'load_bronze'],
    ]);
  });

  it('transform DAG shape: forge → silver → gold (linear edges)', () => {
    const d = airflowDagStatus(blankState(), 0);
    expect(d.transform.tasks.map((t) => t.label)).toEqual(['Forge', 'Silver', 'Gold']);
    expect(d.transform.edges).toEqual([['forge', 'silver'], ['silver', 'gold']]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @nanisoft/architecture run test -- overlay`
Expected: FAIL — `airflowDagStatus` is not exported. (The existing `overlayReducer`/`beckonToolId`/`dataGerrySyncStatus` tests stay green.)

- [ ] **Step 3: Implement — `overlay.ts`**

In `packages/architecture/src/overlay.ts`, append after `dataGerrySyncStatus`:

```ts
// ── Airflow / Trailhead DAG run-state (SPEC §4.8) ─────────────────────────────

export type AirflowTaskState = 'pending' | 'running' | 'success';

export interface AirflowTask {
  id: string;
  /** Airflow-shaped task label, e.g. `extract_SQLFleet`, `load_Bronze`. */
  label: string;
  /** The playbook step number (step.n) this task maps to. */
  stepN: number;
  state: AirflowTaskState;
}

export interface AirflowDag {
  id: 'ingestion' | 'transform';
  title: string;
  tasks: AirflowTask[];
  /** [from, to] task-id edges (the DAG shape). */
  edges: [string, string][];
}

export interface AirflowRunLogLine {
  dagId: 'ingestion' | 'transform';
  run: number;
  status: 'running' | 'success';
  text: string;
}

export interface AirflowDagStatus {
  ingestion: AirflowDag;
  transform: AirflowDag;
  /** Up to 2 lines (ingestion, then transform), each appearing as its DAG starts. */
  runLog: AirflowRunLogLine[];
  /** Trigger enabled only at the load_Bronze beckon cursor, Bronze not yet loaded. */
  canTrigger: boolean;
  /** The ingestion DAG has been run (Bronze populated). */
  triggered: boolean;
}

/** Ingestion DAG tasks: 3 parallel extracts feeding one load (SPEC §4.8). */
const INGESTION_DEFS = [
  { id: 'extract_sqlfleet', label: 'extract_SQLFleet', stepN: 5 },
  { id: 'extract_ad', label: 'extract_AD', stepN: 6 },
  { id: 'extract_workday', label: 'extract_Workday', stepN: 6 },
  { id: 'load_bronze', label: 'load_Bronze', stepN: 7 },
] as const;
const INGESTION_EDGES: [string, string][] = [
  ['extract_sqlfleet', 'load_bronze'],
  ['extract_ad', 'load_bronze'],
  ['extract_workday', 'load_bronze'],
];

/** Transform DAG tasks: linear Forge → Silver → Gold (passive, phase 3). */
const TRANSFORM_DEFS = [
  { id: 'forge', label: 'Forge', stepN: 8 },
  { id: 'silver', label: 'Silver', stepN: 9 },
  { id: 'gold', label: 'Gold', stepN: 10 },
] as const;
const TRANSFORM_EDGES: [string, string][] = [
  ['forge', 'silver'],
  ['silver', 'gold'],
];

/**
 * Per-task run-state from the cursor: `running` = the active step
 * (cursor === stepN, matching the spine's jade active node); `success` =
 * cursor > stepN; else `pending`. `extract_AD` + `extract_Workday` both map to
 * step 6 → they run in parallel. `load_Bronze` shows running at cursor 7 and
 * success at cursor 8 (a 1-step offset after Bronze lands — "task running, data
 * landing"), matching the spine's active/done cadence.
 */
function taskStateFor(stepN: number, cursor: number): AirflowTaskState {
  if (cursor > stepN) return 'success';
  if (cursor === stepN) return 'running';
  return 'pending';
}

/**
 * The Airflow DAG run-state — a pure derivation from `(state, cursor)`
 * (SPEC §4.8), mirroring `dataGerrySyncStatus`. Drives both the ingestion DAG
 * (4 tasks + trigger) and the passive transform DAG (3 tasks). The run log
 * gains one line per DAG run as it starts. No persisted DAG state — it is a
 * pure function of the cursor (the trigger flags are `cursor === 6` and
 * `bronze.products.length > 0`).
 */
export function airflowDagStatus(state: PlaygroundState, cursor: number): AirflowDagStatus {
  const bronzePopulated = state.bronze.products.length > 0;

  const ingestion: AirflowDag = {
    id: 'ingestion',
    title: 'Ingestion DAG',
    tasks: INGESTION_DEFS.map((d) => ({ ...d, state: taskStateFor(d.stepN, cursor) })),
    edges: INGESTION_EDGES,
  };
  const transform: AirflowDag = {
    id: 'transform',
    title: 'Transform DAG',
    tasks: TRANSFORM_DEFS.map((d) => ({ ...d, state: taskStateFor(d.stepN, cursor) })),
    edges: TRANSFORM_EDGES,
  };

  const runLog: AirflowRunLogLine[] = [];
  if (cursor >= 5) {
    const success = cursor >= 8; // load_Bronze success at cursor > 7
    runLog.push({
      dagId: 'ingestion',
      run: 1,
      status: success ? 'success' : 'running',
      text: success
        ? `DAG run #1 · ingestion · success · loaded ${state.bronze.products.length} products · ${state.bronze.viewLogs.length} view-logs`
        : 'DAG run #1 · ingestion · running · 4 tasks',
    });
  }
  if (cursor >= 8) {
    const success = cursor >= 11; // gold success at cursor > 10
    runLog.push({
      dagId: 'transform',
      run: 2,
      status: success ? 'success' : 'running',
      text: success
        ? `DAG run #2 · transform · success · Gold ${state.gold.nodes.length} nodes / ${state.gold.edges.length} edges`
        : 'DAG run #2 · transform · running · 3 tasks',
    });
  }

  return {
    ingestion,
    transform,
    runLog,
    // Step 7 (load_Bronze) is index 6 in STEPS; at cursor 6 it is the next step
    // to apply, so store.step() runs loadBronze. Bronze must not be loaded yet.
    canTrigger: cursor === 6 && !bronzePopulated,
    triggered: bronzePopulated,
  };
}
```

- [ ] **Step 4: Re-export from `index.ts`**

In `packages/architecture/src/index.ts`, update the overlay derivations export block:

```ts
// ── Overlay chrome + derivations ──────────────────────────────────────────────
export { overlayReducer, beckonToolId, dataGerrySyncStatus, airflowDagStatus } from './overlay';
export type {
  OverlayState,
  OverlayAction,
  DataGerrySyncStatus,
  AirflowTaskState,
  AirflowTask,
  AirflowDag,
  AirflowRunLogLine,
  AirflowDagStatus,
} from './overlay';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @nanisoft/architecture run test -- overlay`
Expected: PASS — all `airflowDagStatus` tests pass; existing overlay tests stay green. (These tests only read `cursor` + Bronze/Gold counts, which step 7 already populates — they pass before Task 3 rewires step 7, because step 7 already lands Bronze the same way.)

- [ ] **Step 6: Commit**

```bash
git add packages/architecture/src/overlay.ts packages/architecture/src/index.ts packages/architecture/tests/overlay.test.ts
git commit -m "feat(arch): airflowDagStatus derivation (ticket 12)"
```

---

### Task 3: Pure core — wire step 7 to `loadBronze` + `openTool: 'trailhead'`

**Files:**
- Modify: `packages/architecture/src/playbook.ts` (step 7 ~line 66, and the `tool-actions` import ~line 20)
- Test: `packages/architecture/tests/playbook.test.ts` (append tests)

**Interfaces:**
- Consumes: `loadBronze` (Task 1).
- Produces: step 7 `apply` calls `loadBronze`; step 7 has `openTool: 'trailhead'` (so `beckonToolId(STEPS, 7) === 'trailhead'`). Behavior-identical Bronze landing (existing cursor-7 test stays green).

- [ ] **Step 1: Write the failing test**

Append to `packages/architecture/tests/playbook.test.ts`, inside the `describe('flagship replay — SPEC §4.7 teaching state', …)` block:

```ts
  it('step 7 carries openTool: trailhead (the Airflow beckon)', () => {
    expect(STEPS[6].openTool).toBe('trailhead');
  });

  it('cursor 7 lands Bronze via loadBronze (the shared canonical action)', () => {
    const s = reduceToCursor(STEPS, 7);
    expect(s.bronze.products).toHaveLength(2);
    expect(s.bronze.viewLogs).toHaveLength(2);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @nanisoft/architecture run test -- playbook`
Expected: FAIL — `STEPS[6].openTool` is `undefined` (not `'trailhead'`). (The cursor-7 Bronze assertion already passes — step 7 already lands Bronze inline; this test documents that the wiring preserves it.)

- [ ] **Step 3: Implement — rewire step 7**

In `packages/architecture/src/playbook.ts`, add `loadBronze` to the `tool-actions` import (line 20):

```ts
import { authorSensitiveProductField, loadBronze } from './tool-actions';
```

Replace step 7 (the `{ n: 7, … }` object) with:

```ts
  {
    n: 7, phase: 'ingestion', actor: 'airbyte', edge: ['airbyte', 'forge'],
    title: 'Raw rows land in Bronze',
    desc: 'Airbyte lands raw records into Bronze: ext_product (2) + view_logs (2).',
    apply: (s) => { loadBronze(s); },
    openTool: 'trailhead',
  },
```

- [ ] **Step 4: Run the full architecture suite to verify it passes**

Run: `pnpm --filter @nanisoft/architecture run test`
Expected: PASS — all architecture tests green (playbook, playground-state, overlay, tool-actions, seed). The new `step 7 carries openTool: trailhead` test passes; the existing `cursor 7 lands Bronze` test still passes (behavior-identical). The `airflowDagStatus` tests (Task 2) still pass.

- [ ] **Step 5: Commit**

```bash
git add packages/architecture/src/playbook.ts packages/architecture/tests/playbook.test.ts
git commit -m "feat(arch): wire step 7 to loadBronze + openTool:trailhead (ticket 12)"
```

---

### Task 4: Shell — `AirflowOverlay.tsx` + register in `tool-content.ts`

**Files:**
- Create: `apps/playground/app/_overlay/AirflowOverlay.tsx`
- Modify: `apps/playground/app/_overlay/tool-content.ts` (add the `trailhead` entry)

**Interfaces:**
- Consumes: `airflowDagStatus`, `AirflowDag`, `AirflowTask` (Task 2); `usePlayground` (existing). Identity tokens `color`, `font`, `radius`, `surface`.
- Produces: `AirflowOverlay` — the DAG mock body (ingestion mini-DAG + "Run this DAG" trigger calling `store.step()` + run log + passive transform mini-DAG + fidelity footer). Registered as `TOOL_CONTENT['trailhead']`.

- [ ] **Step 1: Read the Next.js client-component docs (AGENTS.md rule)**

Read the relevant guide in `apps/playground/node_modules/next/dist/docs/` for client components (confirm no breaking change to `'use client'` components that only use React + identity tokens). Note: `AirflowOverlay` is a plain `'use client'` component with no Next.js APIs (no `dynamic`, no Server Component) — identical in shape to `DataGerryOverlay.tsx` — so no deprecation applies. This step is the AGENTS.md compliance check.

- [ ] **Step 2: Implement — `AirflowOverlay.tsx`**

Create `apps/playground/app/_overlay/AirflowOverlay.tsx`:

```tsx
'use client';

import type { CSSProperties } from 'react';
import { color, font, radius, surface } from '@nanisoft/identity';
import { airflowDagStatus, type AirflowDag, type AirflowTask } from '@nanisoft/architecture';
import { usePlayground } from '../_store/usePlayground';

/**
 * Airflow / Trailhead mock — the "ingest" write surface (SPEC §4.8/§4.9).
 * Structured-echo of Airflow's info shape (a DAG of task boxes with per-task
 * run-state + a trigger + a run log) in nanisoft tokens. The "Run this DAG"
 * button calls store.step() — the same applyStep auto-run uses (one code path).
 * Reads airflowDagStatus(state, cursor) for all task states, the run log, and
 * the trigger flags. Running = jade (live); success = teal (done); pending =
 * petrol. The global prefers-reduced-motion guard suppresses the running pulse;
 * the running state stays readable from the jade border + fill.
 */

/** Scoped running-pulse for the live DAG task (decorative only; the jade border
 *  + fill carry the state — suppressed under prefers-reduced-motion by the
 *  global guard in globals.css). Mirrors the spine-ripple keyframe. */
const PULSE = `
@keyframes airflow-running-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(20, 167, 122, 0); }
  50%      { box-shadow: 0 0 0 4px rgba(20, 167, 122, 0.16); }
}
.airflow-task-running { animation: airflow-running-pulse 1.1s cubic-bezier(.32, .72, 0, 1) infinite; }
`;

const label: CSSProperties = {
  margin: 0,
  fontFamily: font.data,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: surface.light.textMuted,
};

function borderFor(state: AirflowTask['state']): string {
  if (state === 'running') return color.jade;
  if (state === 'success') return color.teal;
  return color.petrolSoft;
}

function TaskBox({ task }: { task: AirflowTask }) {
  const running = task.state === 'running';
  return (
    <div
      className={running ? 'airflow-task-running' : undefined}
      role="img"
      aria-label={`${task.label} ${task.state}`}
      style={{
        border: `1px solid ${borderFor(task.state)}`,
        background: running ? 'rgba(20, 167, 122, 0.10)' : surface.light.elevated,
        borderRadius: radius.inner,
        padding: '6px 10px',
        fontFamily: font.data,
        fontSize: 11,
        color: surface.light.text,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 96,
        justifyContent: 'center',
      }}
    >
      <span>{task.label}</span>
      {task.state === 'success' && <span style={{ color: color.teal }}>✓</span>}
      {running && <span style={{ color: color.jade }}>●</span>}
    </div>
  );
}

function MiniDag({ dag, ariaLabel }: { dag: AirflowDag; ariaLabel: string }) {
  if (dag.id === 'transform') {
    // linear: Forge → Silver → Gold
    return (
      <div role="group" aria-label={ariaLabel} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {dag.tasks.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TaskBox task={t} />
            {i < dag.tasks.length - 1 && <span style={{ color: surface.light.textMuted }}>→</span>}
          </div>
        ))}
      </div>
    );
  }
  // ingestion fan-in: 3 extracts (each with a ↓) → load_Bronze
  const extracts = dag.tasks.slice(0, 3);
  const load = dag.tasks[3];
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {extracts.map((t) => (
          <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <TaskBox task={t} />
            <span style={{ color: surface.light.textMuted, fontFamily: font.data, fontSize: 12 }}>↓</span>
          </div>
        ))}
      </div>
      <TaskBox task={load} />
    </div>
  );
}

export function AirflowOverlay() {
  const state = usePlayground((s) => s.state);
  const step = usePlayground((s) => s.step);
  const dag = airflowDagStatus(state, state.cursor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14 }}>
      <style>{PULSE}</style>

      {/* Ingestion DAG + trigger */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={label}>Ingestion DAG · extract → load_Bronze</p>
        <MiniDag dag={dag.ingestion} ariaLabel="ingestion DAG" />
        <button
          onClick={step}
          disabled={!dag.canTrigger}
          aria-label="Run ingestion DAG"
          style={{
            alignSelf: 'flex-start',
            fontFamily: font.voice,
            fontSize: 13,
            fontWeight: 600,
            padding: '9px 18px',
            borderRadius: 9999,
            cursor: dag.canTrigger ? 'pointer' : 'not-allowed',
            border: `1px solid ${dag.canTrigger ? color.jade : surface.light.border}`,
            background: dag.canTrigger ? color.jade : 'transparent',
            color: dag.canTrigger ? surface.light.bg : surface.light.textMuted,
          }}
        >
          {dag.triggered ? 'DAG already run' : 'Run this DAG'}
        </button>
      </div>

      {/* Run log — one line per DAG run */}
      <div
        role="log"
        aria-label="airflow run log"
        style={{
          background: surface.light.sunken,
          borderRadius: radius.inner,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {dag.runLog.length === 0 ? (
          <span style={{ fontFamily: font.data, fontSize: 11, color: surface.light.textMuted }}>no DAG runs yet</span>
        ) : (
          dag.runLog.map((line) => (
            <div
              key={line.dagId}
              style={{
                fontFamily: font.data,
                fontSize: 11,
                color: line.status === 'success' ? color.teal : color.jade,
              }}
            >
              {line.text}
            </div>
          ))
        )}
      </div>

      {/* Transform DAG — passive, orchestrated (no trigger) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={label}>Transform DAG · orchestrated (passive)</p>
        <MiniDag dag={dag.transform} ariaLabel="transform DAG" />
        <p style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }}>
          passive · orchestrates phase 3 (Forge → Silver → Gold)
        </p>
      </div>

      <p style={{ ...label, marginTop: 2 }}>
        mocked · orchestration surface only · scheduler/variables/connections/retries/SLA/Gantt hidden
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Register the overlay**

In `apps/playground/app/_overlay/tool-content.ts`, add the `trailhead` entry:

```ts
import type { ComponentType } from 'react';
import { AirflowOverlay } from './AirflowOverlay';
import { DataGerryOverlay } from './DataGerryOverlay';

/**
 * The single registration point for mocked-tool overlay content (SPEC §4.8).
 * Tickets 12–16 add their tool body here; the uniform chrome (`ToolOverlay`)
 * stays unchanged. Keyed by component id.
 */
export const TOOL_CONTENT: Record<string, ComponentType> = {
  blueprint: DataGerryOverlay,
  trailhead: AirflowOverlay,
};
```

- [ ] **Step 4: Verify the playground builds**

Run: `pnpm --filter @nanisoft/playground run build`
Expected: build succeeds (no type errors; `airflowDagStatus` + `AirflowDag`/`AirflowTask` are exported by `@nanisoft/architecture`; `trailhead` is a known component id).

- [ ] **Step 5: Commit**

```bash
git add apps/playground/app/_overlay/AirflowOverlay.tsx apps/playground/app/_overlay/tool-content.ts
git commit -m "feat(playground): Airflow mock overlay + register trailhead (ticket 12)"
```

---

### Task 5: Integration verification + merge to main

**Files:**
- Verify only (no source changes unless a check fails).

- [ ] **Step 1: Full test suite**

Run: `pnpm -r run test`
Expected: all green (architecture incl. new `loadBronze` + `airflowDagStatus` + step-7-openTool tests, identity, landing). The existing `cursor 7 lands Bronze` test still passes.

- [ ] **Step 2: Full build**

Run: `pnpm -r run build`
Expected: both apps build clean (landing + playground).

- [ ] **Step 3: Start the playground dev server**

Run (background): `pnpm --filter @nanisoft/playground run dev`
Wait for the "Ready" / compiled line on `http://localhost:3001`.

- [ ] **Step 4: Playwright MCP — open + a11y + action + live state**

Using the Playwright MCP browser tools against `http://localhost:3001`:
- Navigate to `http://localhost:3001`; assert console is clean (no errors/warnings from our code).
- Click the `Trailhead` node → assert an a11y node with `role="dialog"` and `aria-label="Trailhead"` appears, the "mocked" badge text is present, and the ingestion DAG task labels (`extract_SQLFleet`, `extract_AD`, `extract_Workday`, `load_Bronze`) + the "Run this DAG" button are visible; the transform DAG (`Forge`, `Silver`, `Gold`) is present.
- Evaluate `window.__playground.getState().state.cursor` → expect `0` (fresh). Evaluate `window.__playground.getState().state.bronze.products.length` → expect `0`.
- Single-step the playbook to cursor 6 (via the Controls "Step →" button six times, or `window.__playground.getState().step()` repeated) → assert the "Run this DAG" button is enabled; evaluate `window.__playground.getState().state.cursor` → expect `6`.
- Click "Run this DAG" → evaluate `window.__playground.getState().state.bronze.products.length` → expect `2`; evaluate `window.__playground.getState().state.bronze.viewLogs.length` → expect `2`; evaluate `window.__playground.getState().state.cursor` → expect `7`.
- Assert the `load_Bronze` task reads `running` (cursor 7) then, after one more step (cursor 8), `success`; assert the run log gains the ingestion line (`loaded 2 products · 2 view-logs`).
- Press Escape → assert the dialog disappears; evaluate `window.__playground.getState().overlay` → expect `null`. Re-open Trailhead (click the node) at cursor ≥ 7 → assert the trigger button reads "DAG already run" (disabled).
- Esc closes the overlay; assert the `.spine-node-beckon` class is present on the active `trailhead` node at cursor 7 before open and absent after open (a11y/evaluate the node class).
- Auto-run through phase 3 (Controls "Run ▶" from cursor 7, or step to 8/9/10) → assert the transform DAG tasks cascade `forge → silver → gold` and the run log gains the transform line (`Gold 5 nodes / 4 edges` at success).
- Take a final a11y snapshot; assert no `role="dialog"` remains after close.

- [ ] **Step 5: Stop the dev server**

Stop the background dev process.

- [ ] **Step 6: Human visual confirm (deferred — operator AFK)**

Record in the final report: the split-pane Airflow pane, the jade running pulse on the active DAG task, the teal success state + ✓, the "mocked" badge, and the run-log lines are pending the operator's visual confirm on return. The a11y + build + live-state checks above stand in until then.

- [ ] **Step 7: Merge to main**

```bash
git checkout main
git merge --no-ff feat/12-airflow-mock -m "Merge ticket 12: Airflow / Trailhead mock"
```

(Do not delete the feature branch — leave it for reference until the operator confirms.)

- [ ] **Step 8: Final report + stop**

Report: what was built, verification results (tests/build/a11y/live-state), the one deferred item (human visual confirm), and the merge. Then stop.

---

## Self-Review

**Spec coverage:**
- Ingestion DAG shown (`extract_AD / extract_Workday / extract_SQLFleet → load_Bronze`), per-task pending → running (jade) → success (teal) → `airflowDagStatus` (Task 2) + `MiniDag`/`TaskBox` (Task 4). ✓
- One-line run log + trigger control → run log (Task 2 derivation, Task 4 render) + "Run this DAG" button (Task 4). ✓
- Canonical action: trigger the ingestion DAG ("run this DAG") → writes Bronze → `loadBronze` (Task 1) + button calls `store.step()` (Task 4) + step 7 wired (Task 3). ✓
- Writes Bronze (`bronze.products`, `bronze.view_logs`); reads none → `loadBronze` writes Bronze; `airflowDagStatus` reads only `cursor` (+ Bronze/Gold counts for success log lines); no source reads. ✓
- Phase-3 transform DAG (`Forge → Silver → Gold`) animates orchestrated, not a separate action → passive transform `MiniDag` (Task 4), cursor-derived cascade (Task 2), no trigger button. ✓
- Reuses overlay chrome + one-code-path from 11; same mutate auto-run or single-step → `trailhead` registered in `TOOL_CONTENT` (Task 4); chrome unchanged; step 7 `apply` = `loadBronze` = `store.step()` (Tasks 1/3/4). ✓
- Single registration point → `tool-content.ts` gains the `trailhead` entry only (Task 4). ✓

**Placeholder scan:** none — every step has real code or real commands.

**Type consistency:** `loadBronze(state: PlaygroundState): void` (Task 1) — used by step 7 `apply` (Task 3). `airflowDagStatus(state, cursor): AirflowDagStatus` (Task 2) — used by `AirflowOverlay` (Task 4); `AirflowDag`/`AirflowTask` (Task 2) imported in Task 4. `airflowDagStatus` returns `canTrigger`/`triggered` (Task 2) consumed as `dag.canTrigger`/`dag.triggered` (Task 4) — names match. Re-exports in `index.ts` (Tasks 1/2) match the imports in `AirflowOverlay` (Task 4). `STEPS[6]` (step 7) is the load_Bronze step (Task 3 test) — matches `canTrigger: cursor === 6` (Task 2). ✓