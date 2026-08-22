# Trino / Overlook mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the third mocked-tool overlay — Trino / Overlook — the "query" read lens: a SQL-console mock (read-only editor with the Atlas-seeded SQL + "Run query" button + results table, the anomalous row highlighted jade), dropping into the ticket-11/12 framework with no chrome/store/state changes and **no new canonical-action mutate** (Trino writes nothing — pure read surface).

**Architecture:** Pure domain core (`packages/architecture`, framework-agnostic, vitest) gains `trinoResults(state, cursor)` (a pure results derivation over Gold, mirroring `dataGerrySyncStatus` / `airflowDagStatus`). `apps/playground` gains only `TrinoOverlay.tsx` + one line in the `tool-content.ts` registry. The overlay's "Run query" button calls `store.step()` — the same `applyStep` auto-run uses — and step 16's `apply` stays `() => {}` (the read is the act), so single-step and auto-run share one code path. No `SeedDataset`/`PlaygroundState`/store/chrome/`tool-actions` changes. Step 16 gains `openTool: 'overlook'`.

**Tech Stack:** Next.js 16.3.1 (stock, modified — see Global Constraints), pnpm monorepo, `@xyflow/react` ^12, Zustand ^5, `@nanisoft/architecture` + `@nanisoft/identity` (workspace), vitest 4 (architecture package only).

## Global Constraints

- **AGENTS.md (modified Next.js):** read the relevant guide in `node_modules/next/dist/docs/` (resolved from the consuming app's directory) before writing any Next code. Heed deprecation notices. `TrinoOverlay` is a plain `'use client'` component with no Next.js APIs (no `dynamic`, no Server Component) — identical in shape to `AirflowOverlay.tsx` / `DataGerryOverlay.tsx` — so no deprecation applies.
- **No vision workflow:** verify via `pnpm --filter playground build` + `pnpm --filter @nanisoft/architecture test`. The playground has no test script; React components verify via build.
- **Add vitest for any pure logic** (architecture package; `environment: node`, `tests/**/*.test.ts`).
- **Jade = single locked accent, live/active only; teal = done/ok. No pure white/black.** Jade appears only on: the anomalous (live finding) results row (border + soft fill + tag) and the enabled "Run query" button's accent. The backed (`ok`) row is teal.
- **Pure core must not import React/Next/Zustand/React Flow.** The overlay React lives in `apps/playground`.
- **Identity tokens:** `color` (`jade`, `teal`, `petrolSoft`), `surface`, `font` (`data`, `voice`), `radius` (`inner`) from `@nanisoft/identity`.
- Commit on the branch `feat/13-trino-mock` (already checked out). Do NOT merge to main — the coordinator integrates.

---

## File Structure

**`packages/architecture` (pure + vitest):**
- Modify `src/overlay.ts` — add `trinoResults(state, cursor)` + `TrinoResultRow`/`TrinoResults` types + `TRINO_SEEDED_SQL` constant (next to `airflowDagStatus`).
- Modify `src/playbook.ts` — step 16 gains `openTool: 'overlook'` (no `apply` change).
- Modify `src/index.ts` — re-export `trinoResults` + `TRINO_SEEDED_SQL` + the new types.
- Extend `tests/overlay.test.ts` (`trinoResults`), `tests/playbook.test.ts` (step 16 openTool).

**`apps/playground` (React shell):**
- Create `app/_overlay/TrinoOverlay.tsx` — the SQL-console + results-table mock body.
- Modify `app/_overlay/tool-content.ts` — add `overlook: TrinoOverlay` (the single registration point).

Nothing else changes: `ToolOverlay.tsx`, `usePlayground.ts`, `Spine.tsx`, `NodeChip.tsx`, `playground-client.tsx`, `globals.css`, `tool-actions.ts` are untouched. `overlook` is already `fullUi: true` (node already clickable); `openTool`/`closeTool`/`step` already exist; `MOCK_TOOL_BY_COMPONENT['overlook']` already carries the canonical-action/shows/reads/writes/fidelity text. No new dependency, no new state field, no new canonical-action mutate.

---

### Task 1: Pure core — `trinoResults` derivation

**Files:**
- Modify: `packages/architecture/src/overlay.ts` (append after `airflowDagStatus`)
- Modify: `packages/architecture/src/index.ts` (the `// ── Overlay chrome + derivations ──` block)
- Test: `packages/architecture/tests/overlay.test.ts` (append a describe block)

**Interfaces:**
- Produces:
  - `TRINO_SEEDED_SQL` (the Atlas-seeded SQL string constant)
  - `TrinoResultRow = { user, userName, product, productName, sensitive, ownerGroup, backing: 'memberof' | 'no-backing', anomalous, edgeId }`
  - `TrinoResults = { sql, rows: TrinoResultRow[], queryRun, canRun }`
  - `trinoResults(state: PlaygroundState, cursor: number): TrinoResults` — pure; reads only `state.gold`.

- [ ] **Step 1: Write the failing tests**

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement — `overlay.ts`**

- [ ] **Step 4: Re-export from `index.ts`**

- [ ] **Step 5: Run test to verify it passes**

- [ ] **Step 6: Commit**

---

### Task 2: Pure core — step 16 `openTool: 'overlook'`

**Files:**
- Modify: `packages/architecture/src/playbook.ts` (step 16 — add `openTool: 'overlook'`)
- Test: `packages/architecture/tests/playbook.test.ts` (append a test)

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement — add `openTool: 'overlook'` to step 16**
- [ ] **Step 4: Run the full architecture suite to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 3: Shell — `TrinoOverlay.tsx` + register in `tool-content.ts`

**Files:**
- Create: `apps/playground/app/_overlay/TrinoOverlay.tsx`
- Modify: `apps/playground/app/_overlay/tool-content.ts` (add the `overlook` entry)

- [ ] **Step 1: Read the Next.js client-component docs (AGENTS.md rule)**
- [ ] **Step 2: Implement — `TrinoOverlay.tsx`**
- [ ] **Step 3: Register the overlay**
- [ ] **Step 4: Verify the playground builds**
- [ ] **Step 5: Commit**

---

### Task 4: Integration verification

**Files:** Verify only.

- [ ] **Step 1: Full architecture test suite** — `pnpm --filter @nanisoft/architecture test` (was 86/86; +N new tests).
- [ ] **Step 2: Playground build** — `pnpm --filter playground build`.
- [ ] **Step 3: Final report** — do NOT merge to main.

---

## Self-Review

**Spec coverage:** SQL console (editor + Run + results) → `TrinoOverlay`; canonical action run-seeded-SQL → `store.step()` at cursor 15 → step 16 (read); anomalous row highlighted jade → `trinoResults` derivation + jade row; reads Gold writes nothing → `trinoResults` reads `state.gold`, step 16 `apply === () => {}`, no `tool-actions` mutate; reuses chrome + one-code-path → `TOOL_CONTENT['overlook']`, chrome unchanged, `store.step()` shared with auto-run.

**Type consistency:** `trinoResults(state, cursor): TrinoResults` (Task 1) — consumed by `TrinoOverlay` (Task 3) as `results.rows`/`results.canRun`/`results.queryRun`/`results.sql`. Step 16 `openTool: 'overlook'` (Task 2) → `STEPS.findIndex(s => s.openTool === 'overlook') === 15` matches `canRun = cursor === 15` (Task 1). ✓