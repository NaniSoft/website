# Airflow / Trailhead mock (ticket 12)

> **Status:** approved design (2026-08-22). Branch: `feat/12-airflow-mock`.
> **Source ticket:** `.scratch/nanosoft-digital-twin/issues/12-airflow-mock.md`.
> **Spec basis:** `.scratch/nanosoft-digital-twin/SPEC.md` §4.8 (mock fidelity — Airflow/Trailhead), §4.9 (teaching spine — Airflow = the "ingest" write surface), §2 (identity / motion), §6 (carry-forwards: step cadence ~1.1s; presentation = split-pane, locked for 12–16).
> **Prerequisites (done on main):** 07–11. Ticket 11 (merge 760bf80) established the uniform `ToolOverlay` chrome, the **one-code-path pattern** (overlay's canonical action *is* a playbook step → the same `applyStep` auto-run uses), the pure `overlayReducer`/`beckonToolId`/`dataGerrySyncStatus` in `packages/architecture/src/overlay.ts`, and the **single registration point** `apps/playground/app/_overlay/tool-content.ts`. Airflow drops in as the next entry — no chrome rework, no store changes.
> **Resolves:** ticket 12 (the second of the six mocked-tool overlays).

## Goal

Ship the **second mocked-tool overlay — Airflow / Trailhead** — the "ingest" write surface (SPEC §4.9: Airflow = ingest, Bronze). It is an ingestion-DAG mock: `extract_AD / extract_Workday / extract_SQLFleet → load_Bronze`, per-task run-state `pending → running (jade) → success (teal)`, a one-line run log, and a trigger control. The canonical action — "run this DAG" — writes Bronze (`bronze.products`, `bronze.view_logs`); reads none (DAG config static). A second, smaller transform DAG (`Forge → Silver → Gold`) animates passively (orchestrated, no separate action) as the cursor advances through phase 3.

This ticket reuses the ticket-11 framework verbatim: the overlay's "Run this DAG" button calls `store.step()` (the same `applyStep` auto-run uses), so single-stepping the learner and auto-running the twin share one mutate. It adds **no new state field** — Bronze is already modelled in `SeedDataset`/`PlaygroundState` — and **no store or chrome changes**.

## Decisions (locked during brainstorm)

1. **Canonical action = step 7 (`load_Bronze`), mirror DataGerry.** Step 7's apply becomes the pure `loadBronze(state)`; step 7 gains `openTool: 'trailhead'`. The overlay's "Run this DAG" button calls `store.step()` — the same `applyStep` auto-run uses — enabled at `cursor === 6` (the cursor at which `STEPS[6]` = step 7 is next) and ghosted "DAG already run" once Bronze is populated. The trailhead node **beckons** (ripples) at cursor 7 (post-load observe invite, the established beckon semantics). The extracts (steps 5–6) are narrate-only DAG-task animations (their `apply` stays `() => {}`). No ingestion restructuring; the existing "step 7 lands Bronze" assertions stay valid. (Rejected: binding the trigger to step 5 / the start of ingestion — that would reorder ingestion, move the Bronze write off step 7, break the existing spine/inspector teaching sequence and tests, and load Bronze before the extracts that produce it.)
2. **DAG run-state = pure derivation `airflowDagStatus(state, cursor)`** in `packages/architecture/src/overlay.ts`, mirroring `dataGerrySyncStatus`. No persisted DAG state, no store slice — DAG task state is a pure function of `cursor`, so the "reducer" framing is satisfied by a function that reduces `(state, cursor)` → run-state. (Rejected: a stateful `dagReducer` with its own store slice — heavier, and the DAG state would only mirror cursor.)
3. **Cascade rule: `running` = the active step (`cursor === task.stepN`), `success` = `cursor > task.stepN`.** The jade task in the DAG matches the jade actor in the spine — one mental model. `load_Bronze` shows running (jade) at cursor 7, success (teal) at cursor 8 — a 1-step offset (Bronze already landed in the lakehouse at cursor 7) that reads as realistic ("task running, data landing"). (Rejected: `running` = next-to-run step — no offset but the DAG jade would lead the spine jade by one step, splitting the two views.)
4. **Transform DAG = passive, animates in both modes.** Forge (step 8) → Silver (step 9) → Gold (step 10) cascade via the same cursor rule; no trigger button. "Auto-run only" (ticket wording) = "not a separate canonical action" — it is orchestrated, passive, cursor-derived, and animates whenever the cursor advances through phase 3 (auto-run *and* single-step).
5. **Render = custom CSS/SVG mini-DAG** — task boxes (JetBrains Mono labels) laid out as a small graph with CSS/SVG arrows, colored by state. No second React Flow canvas. (Rejected: a second `@xyflow/react` canvas — heavyweight for 4+3 static boxes and adds resize-coupling; rejected: a task-list with chevrons — loses Airflow's graph-view identity.)
6. **Run log = one line per DAG run, max 2.** An ingestion line appears once ingestion starts (cursor ≥ 5), flipping running → success when `load_Bronze` succeeds (cursor ≥ 8); a transform line appears once phase 3 starts (cursor ≥ 8), flipping running → success when `gold` succeeds (cursor ≥ 11). Each line is a single concise run summary — honoring the ticket's "one-line run log" per run.

## Architecture & file layout

Boundary unchanged from ticket 10/11: **pure domain core in `packages/architecture`**, **thin Zustand + React shell in `apps/playground`**. Nothing in the core imports React, Next, Zustand, or React Flow.

**`packages/architecture` (pure + unit-tested):**
- `src/tool-actions.ts` — add `loadBronze(state)`: idempotently set `state.bronze = { products: state.products, viewLogs: state.viewLogs }` (the canonical ingestion mutate; mirrors `authorSensitiveProductField`).
- `src/overlay.ts` — add `airflowDagStatus(state, cursor)` + types (`AirflowTaskState`, `AirflowTask`, `AirflowDag`, `AirflowRunLogLine`, `AirflowDagStatus`). Lives next to `dataGerrySyncStatus`.
- `src/playbook.ts` — step 7 `apply` → `loadBronze(s)`; step 7 gains `openTool: 'trailhead'`.
- `src/index.ts` — re-export the new symbols + types.
- `tests/overlay.test.ts` (extend) + `tests/playbook.test.ts` (extend).

**`apps/playground` (reactive shell):**
- `app/_overlay/AirflowOverlay.tsx` *(new)* — the DAG mock body.
- `app/_overlay/tool-content.ts` — add `trailhead: AirflowOverlay` (the single registration point).

Nothing else changes. `ToolOverlay.tsx`, `usePlayground.ts`, `Spine.tsx`, `NodeChip.tsx`, `playground-client.tsx`, `globals.css` are untouched. The `trailhead` component is already `fullUi: true`, so its node is already clickable; `openTool`/`closeTool`/`step` already exist; `MOCK_TOOL_BY_COMPONENT['trailhead']` already carries the canonical-action/shows/reads/writes/fidelity text. No new playground dependency.

## The DAG task model + run-state derivation (pure core)

`airflowDagStatus(state, cursor)` describes **two DAGs**, each a small set of tasks keyed to a playbook step number. A task's state is derived purely from the cursor:

```ts
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
  /** The trigger button is enabled only at the load_Bronze beckon cursor, Bronze not yet loaded. */
  canTrigger: boolean;
  /** The ingestion DAG has been run (Bronze populated). */
  triggered: boolean;
}
```

**Task → step mapping** (from `playbook.ts`):

| DAG | Task id | label | stepN | playbook step |
|---|---|---|---|---|
| ingestion | `extract_sqlfleet` | `extract_SQLFleet` | 5 | step 5 (Airbyte extracts product + view-log records from the SQL Server Fleet) |
| ingestion | `extract_ad` | `extract_AD` | 6 | step 6 (groups + users from Active Directory) |
| ingestion | `extract_workday` | `extract_Workday` | 6 | step 6 (employees from Workday HR) |
| ingestion | `load_bronze` | `load_Bronze` | 7 | step 7 (raw rows land in Bronze) |
| transform | `forge` | `Forge` | 8 | step 8 (Forge reads the cached schema) |
| transform | `silver` | `Silver` | 9 | step 9 (Forge writes conformed Silver) |
| transform | `gold` | `Gold` | 10 | step 10 (Forge writes Gold graph_nodes + graph_edges) |

**Ingestion DAG shape:** `extract_sqlfleet → load_bronze`, `extract_ad → load_bronze`, `extract_workday → load_bronze` (three parallel extracts feeding one load).
**Transform DAG shape:** `forge → silver → gold` (linear).

**State derivation** (pure, the locked cascade rule):
```ts
function taskState(stepN: number, cursor: number): AirflowTaskState {
  if (cursor > stepN) return 'success';
  if (cursor === stepN) return 'running';
  return 'pending';
}
```
`extract_ad` and `extract_workday` both map to step 6, so they run in parallel (both `running` at cursor 6, both `success` at cursor ≥ 7) — realistic Airflow parallelism.

**Trigger flags:**
- `canTrigger = cursor === BECKON_CURSOR && !bronzePopulated`, where `BECKON_CURSOR = STEPS.findIndex(s => s.openTool === 'trailhead')` (= 6) and `bronzePopulated = state.bronze.products.length > 0`. The button is enabled only when step 7 is the *next* step to apply (so `store.step()` applies `loadBronze`) and Bronze is not yet loaded.
- `triggered = bronzePopulated` (the ingestion DAG has been run).

**Run log** (pure, cursor-derived; counts from state when success):
- **Ingestion line** appears at `cursor >= 5` (ingestion started): `running` for `5 <= cursor <= 7`; `success` at `cursor >= 8` (when `load_Bronze` succeeds). Success text: `` `DAG run #1 · ingestion · success · loaded ${bronze.products.length} products · ${bronze.viewLogs.length} view-logs` ``. Running text: `` `DAG run #1 · ingestion · running · 4 tasks` ``.
- **Transform line** appears at `cursor >= 8` (phase 3 started): `running` for `8 <= cursor <= 10`; `success` at `cursor >= 11` (when `gold` succeeds). Success text: `` `DAG run #2 · transform · success · Gold ${gold.nodes.length} nodes / ${gold.edges.length} edges` ``. Running text: `` `DAG run #2 · transform · running · 3 tasks` ``.
- `runLog` is the concatenation of present lines (0, 1, or 2 entries).

## The one-code-path canonical action

**`loadBronze(state)`** (`src/tool-actions.ts`): idempotently sets `state.bronze = { products: state.products, viewLogs: state.viewLogs }` (creates the Bronze landing from the in-browser source rows — mirrors the existing step-7 mutate, now named). Step 7's `apply` calls it. Auto-run's step 7 and the overlay's "Run this DAG" button therefore run the *same* mutate — one code path.

**The overlay action = a playbook step.** The Airflow "Run this DAG" button calls **`store.step()`** — the same action the auto-run interval calls, which applies `STEPS[cursor]` via `applyStep`. There is no separate "overlay mutate" code path; the guard is the button's enabled/disabled state. The button is enabled only at `cursor === 6` and when Bronze is not yet loaded; clicking advances the cursor to 7, running `loadBronze`. Once Bronze is populated the button is ghosted "DAG already run." Opening the overlay later (post-run, or mid-run at a later cursor) shows the DAG complete with the action disabled — the act is done.

**Why this is the one code path:** auto-run (`setInterval(step)`) and the overlay's button both reduce to `applyStep(state, STEPS[cursor])`. There is no second mutate. The Inspector's Bronze tab updates from the same state the overlay just wrote — the learner sees Bronze land in the twin's lakehouse as they trigger the load.

## Airflow mock content

`AirflowOverlay.tsx` — the orchestration surface, structured-echo of Airflow's info shape (a DAG of task boxes with per-task run-state + a trigger + a run log) in nanisoft tokens:

- **Ingestion DAG** (`role="group"` `aria-label="ingestion DAG"`): three extract task boxes (`extract_SQLFleet`, `extract_AD`, `extract_Workday`) in a row, each connected by a CSS/SVG arrow down to a single `load_Bronze` task box. Each box shows its label in `font.data` and is colored by state: **pending** = `petrolSoft` border/text, **running** = `jade` border + a soft jade fill + the identity `breathe`/`ripple` pulse, **success** = `teal` border + a teal ✓ (the success marker — jade is the live/active accent only, per Identity §2). Reduced-motion degrades the running pulse to a static jade ring (state still readable from color + ✓).
- **Trigger control**: "Run this DAG" — a pill, jade-accented when `canTrigger`, ghosted "DAG already run" when `triggered`. `font.voice`. `aria-label="Run ingestion DAG"`. Clicking performs step 7 (the one-code-path mutate). Disabled otherwise.
- **Run log** (`role="log"`): up to 2 monospace lines from `airflowDagStatus(...).runLog`, each appearing as its DAG starts. `font.data`.
- **Transform DAG** (`role="group"` `aria-label="transform DAG"`): a smaller, secondary section labelled "Transform DAG · orchestrated" — `forge → silver → gold` as a linear mini-DAG with the same state coloring. No trigger button (passive). A muted note: "passive · orchestrates phase 3 (Forge → Silver → Gold)".
- **Fidelity footer**: a muted "mocked · orchestration surface only · scheduler/variables/connections/retries/SLA/Gantt hidden" line (the hidden richness, per `MOCK_TOOLS['trailhead'].fidelity`).
- **Tokens**: `surface.light` panes, `radius.inner`, `font.data` for task labels + run log, `font.voice` for the trigger. Jade only for running tasks + the enabled trigger's accent. Teal for success. Petrol for pending. No pure white/black. (Identity §2: jade = single locked accent, live/active only.)

The overlay reads `airflowDagStatus(state, state.cursor)` (pure) for all task states, the run log, and the trigger flags; it reads `store.step` for the canonical action. `BECKON_CURSOR` is computed the same way `DataGerryOverlay` computes it (`STEPS.findIndex(s => s.openTool === 'trailhead')`).

## State model changes (pure core)

**None.** Bronze (`bronze: { products: Product[]; viewLogs: ViewLog[] }`) already exists in `SeedDataset`/`PlaygroundState`; `SEED.bronze` is the populated teaching state and `blankState().bronze = { products: [], viewLogs: [] }`. The Bronze write is already modelled — `loadBronze` only names the existing step-7 mutate. No `STATE_FIELDS` or `importState` change.

Step table change (only step 7):

| # | Phase | Actor | Edge | apply (state change) | openTool |
|---|---|---|---|---|---|
| 7 | ingestion | airbyte | airbyte→forge | `loadBronze(s)` — lands `bronze.products` + `bronze.view_logs` (the canonical ingestion mutate) | `'trailhead'` *(new)* |

All other steps unchanged. Step 7's mutate is behavior-identical to today (Bronze lands the same way); only its `apply` now calls the named `loadBronze` and it gains `openTool`.

## Testing + verification

**Pure core — vitest in `packages/architecture`** (TDD; extends the existing suite; `environment: node`, `tests/**/*.test.ts`):
- `overlay.test.ts` *(extended)*:
  - `loadBronze`: on blank state sets `bronze = { products, viewLogs }` (2 + 2); idempotent (second call no-op); matches the existing step-7 Bronze shape.
  - `airflowDagStatus(state, cursor)`:
    - cursor 0 → ingestion 4 tasks all pending; transform 3 all pending; `runLog` empty; `canTrigger` false; `triggered` false.
    - cursor 5 → `extract_sqlfleet` running, the other 3 pending; `runLog` = [ingestion running]; `canTrigger` false (cursor ≠ 6).
    - cursor 6 → `extract_sqlfleet` success; `extract_ad` + `extract_workday` running (parallel); `load_bronze` pending; `canTrigger` true (cursor 6, Bronze empty).
    - cursor 7 → all extracts success; `load_bronze` running; `canTrigger` false; `triggered` true (Bronze populated); `runLog` ingestion still running.
    - cursor 8 → all 4 ingestion tasks success (cursor > 7); ingestion run-log line `success · loaded 2 products · 2 view-logs`; transform `forge` running (cursor === 8), `silver`/`gold` pending; transform run-log line `running · 3 tasks`; `runLog` has 2 lines.
    - cursor 10 → transform `forge` + `silver` success, `gold` running; transform run `running`.
    - cursor 11 → transform all success; transform run-log line `success · Gold 5 nodes / 4 edges`; `runLog` has 2 lines.
    - cursor 22 → all 7 tasks success; `runLog` 2 lines (both success); `canTrigger` false; `triggered` true.
- `playbook.test.ts` *(extended)*: cursor 7 sets Bronze via `loadBronze` (2 products + 2 view-logs); step 7 carries `openTool: 'trailhead'`; the existing cursor-7 Bronze assertion still holds.

**Playground render verification (no vision — the project's "resolved without vision" norm; the Playwright MCP browser tools drive the running dev server):**
- `pnpm -r build` green; `next dev` on :3001; console clean.
- Playwright MCP a11y snapshot: click the `Trailhead` node → `role="dialog"` with `aria-label="Trailhead"`, the "mocked" badge, the ingestion DAG (4 task boxes) + the "Run this DAG" button; transform DAG present.
- Single-step to cursor 6 (via Controls or `window.__playground`) → "Run this DAG" enabled; click → `window.__playground.getState().state.bronze.products.length === 2` and `viewLogs.length === 2`; the `load_bronze` task reads success (after the cascade settles); the Inspector Bronze tab shows 2 products + 2 view-logs; the run log gains the ingestion success line.
- Esc closes the overlay; the `.spine-node-beckon` class is present on the active `trailhead` node at cursor 7 before open and absent after open.
- Auto-run through phase 3 → the transform DAG tasks cascade `forge → silver → gold` and the run log gains the transform line.
- `prefers-reduced-motion` → no running pulse animation; task states still advance via color + ✓.
- Existing suites stay green (identity, landing, architecture; DataGerry overlay + beckon).

**Human visual confirm** — the one step not done here (operator AFK): the split-pane Airflow pane, the jade running pulse on the active DAG task, the teal success state, the "mocked" badge, and the run log lines. Flagged for the operator's return; the a11y + build + live-state checks above stand in until then.

## Acceptance criteria mapping (from the ticket)

| Ticket criterion | How this design satisfies it |
|---|---|
| Ingestion DAG shown: `extract_AD / extract_Workday / extract_SQLFleet → load_Bronze`, per-task pending → running (jade) → success (teal) + one-line run log + trigger control | `AirflowOverlay.tsx` renders the 4-task ingestion mini-DAG via `airflowDagStatus`; `AirflowTaskState` cascade pending/running(jade)/success(teal); run log (one line per run); "Run this DAG" trigger. |
| Canonical action: trigger the ingestion DAG ("run this DAG") → Airbyte → Source → Bronze | "Run this DAG" button = `store.step()` at cursor 6 → `loadBronze` (step 7) → Bronze. |
| Writes Bronze (`bronze.products`, `bronze.view_logs`); reads none (DAG config static) | `loadBronze` writes `bronze.products` + `bronze.viewLogs`; `airflowDagStatus` reads only `cursor` (+ counts from `bronze`/`gold` for the success log lines); no source reads. |
| Phase-3 transform DAG (`Forge → Silver → Gold`) animates as orchestrated in auto-run only (not a separate action) | Passive transform mini-DAG, cursor-derived cascade (steps 8–10), no trigger button — animates as the cursor advances through phase 3. |
| Reuses the overlay chrome + one-code-path pattern from 11; same mutate whether auto-run or single-step | Drops into `TOOL_CONTENT['trailhead']`; chrome unchanged; `loadBronze` is step 7's `apply` and the overlay button's `store.step()` — one mutate. |

## Out of scope (later tickets)

- Tools 13–16 (Overlook, Atlas+OPA, Compass, Superset) — this ticket ships Airflow only; they drop into `TOOL_CONTENT`.
- Compass auto-open at the finding (ticket 15) — untouched; Compass's existing `openTool` flags stay.
- The free-form sandbox (later, not the spine).