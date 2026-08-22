# Trino / Overlook mock (ticket 13)

> **Status:** approved design (2026-08-22). Branch: `feat/13-trino-mock`.
> **Source ticket:** `.scratch/nanosoft-digital-twin/issues/13-trino-mock.md`.
> **Spec basis:** `.scratch/nanosoft-digital-twin/SPEC.md` §4.8 (mock fidelity — Trino/Overlook), §4.9 (teaching spine — Trino = the "query" read lens, finding as a table row), §2 (identity / motion), §6 (carry-forwards: step cadence ~1.1s; presentation = split-pane, locked for 12–16).
> **Prerequisites (done on main):** 07–12. Ticket 11 (merge 760bf80) established the uniform `ToolOverlay` chrome, the **one-code-path pattern** (overlay's canonical action *is* a playbook step → the same `applyStep` auto-run uses), the pure `overlayReducer`/`beckonToolId`/`dataGerrySyncStatus` in `packages/architecture/src/overlay.ts`, and the **single registration point** `apps/playground/app/_overlay/tool-content.ts`. Ticket 12 (Airflow) added the second overlay (`airflowDagStatus` + `AirflowOverlay`) and locked the pure-derivation + `store.step()` pattern for read/write surfaces. Trino drops in as the next entry — no chrome rework, no store changes.
> **Resolves:** ticket 13 (the third of the six mocked-tool overlays — the first *read* surface).

## Goal

Ship the **third mocked-tool overlay — Trino / Overlook** — the "query" read lens (SPEC §4.9: Trino = table row). It is a SQL-console mock: a read-only editor pre-populated with the Atlas-seeded query (header "Query seeded by Atlas: Sensitive Product View Audit"), a Run button, and a results table. The canonical action — "run the seeded SQL query" — **writes nothing**; Trino is a pure read surface over Gold (`graph_nodes` / `graph_edges`). The finding surfaces as a **table row**: the anomalous row (`j.harper / P-1042 / viewed / no-backing`) is highlighted jade. Catalog/RBAC/federation/history/EXPLAIN are hidden.

This ticket reuses the ticket-11/12 framework verbatim: the overlay's "Run query" button calls `store.step()` (the same `applyStep` auto-run uses), so single-stepping the learner and auto-running the twin share one mutate — here a *no-op* mutate (step 16 is narrate-only; Trino writes nothing). It adds **no new state field**, **no new canonical-action mutate**, and **no store or chrome changes**.

## Decisions (locked during brainstorm)

1. **Canonical action = step 16 ("Overlook reads Gold graph"), the read surface.** Step 16 gains `openTool: 'overlook'`. The overlay's "Run query" button calls `store.step()` — the same `applyStep` auto-run uses — enabled at `cursor === 15` (the index of step 16, the cursor at which `STEPS[15]` = step 16 is next) and ghosted "Query already run" once the query has been run (`cursor >= 16`). The overlook node **beckons** (ripples jade) at cursor 16 (step 16 is the active step, the established beckon semantics — `beckonToolId(16) === 'overlook'`). Step 16's `apply` stays `() => {}` (Trino writes nothing — the read is the act; no lakehouse/registry/audit change). (Rejected: binding to step 15 ("Atlas runs the seeded SQL via Overlook") — step 15's actor is `atlas`, not `overlook`, so it would beckon the wrong node and the Run button would fire an Atlas step; rejected: binding to step 17 ("Overlook returns an anomalous view") — that is the *finding* step which sets `finding` + flags `edge.status`, a real mutate, not the read; the "run the seeded query" act is the read, which is step 16.)
2. **Row derivation = pure `trinoResults(state, cursor)`** in `packages/architecture/src/overlay.ts`, mirroring `dataGerrySyncStatus` / `airflowDagStatus`. No persisted query state, no store slice — the results are a pure function of `state.gold` + `cursor`. The function returns `{ sql, rows, queryRun, canRun }`. (Rejected: a stateful query reducer — heavier, and the query state would only mirror cursor.)
3. **Anomaly flag: prefer the explicit `edge.status` once step 17 has run; otherwise derive.** A viewed row is `anomalous` when (a) `edge.status === 'anomalous'` (step 17 has flagged it), else (b) `edge.status === 'ok'` → not anomalous, else (c) `edge.status === null` (step 17 not yet run) → derived: the viewed product is `sensitive` AND the viewer has no `memberof` edge to the product's `ownerGroup` (exactly `detectAnomalies`'s rule, recomputed here from Gold). So the anomalous row shows at cursor 16 (post-read, pre-flag) via derivation, and stays jade at cursor 17+ via the explicit flag. (Rejected: always-derive — would diverge from the explicit `ok` flag step 17 writes on the backed `m.okafor → P-1042` view; rejected: always read `edge.status` — would show nothing anomalous at cursor 16, before step 17 runs, breaking the "finding as a table row" teaching beat at the read step.)
4. **Results table populates only after the query is run.** `queryRun = cursor >= 16` (step 16 applied). Before that (`cursor < 16`) the table is empty with a muted "run the seeded query to see results" hint. `canRun = cursor === 15` (step 16 next; the one-code-path guard). After run, the table shows all viewed edges (2 rows with the seed: `j.harper → P-1042` anomalous, `m.okafor → P-1042` backed/ok). (Rejected: always show results — there is no "run" act to perform if the table is already populated at open.)
5. **Reads Gold only.** The derivation reads `state.gold.nodes` + `state.gold.edges` (product node → `sensitive`/`ownerGroup`/label; user node → label; `memberof` edges → backing). It does **not** read `state.products`/`state.users`/`state.groupMemberships` — the query is over the Gold graph, faithful to "reads Gold (`graph_nodes`/`graph_edges`)." The row's `productName`/`userName` come from Gold node labels; `sensitive`/`ownerGroup` from the product node.
6. **Render = custom SQL console + results table.** A read-only editor pane (`font.data`, the pre-written SQL, a muted "Query seeded by Atlas: Sensitive Product View Audit" header), a Run pill (jade-accented when `canRun`, ghosted "Query already run" when `queryRun`), and a results table (`font.data`, columns: user · product · viewed · backing; the anomalous row highlighted jade — jade border + soft jade fill, the single locked accent for the live/active finding-as-a-row; the backed row teal-bordered `ok`). No real code editor / syntax highlighter. (Rejected: a literal Trino web console clone — the structured-echo rule; rejected: highlighting the anomalous row teal — jade is the live/active accent and the anomaly is the *live finding*, teal is for *done/ok*.)

## Architecture & file layout

Boundary unchanged from ticket 11/12: **pure domain core in `packages/architecture`**, **thin Zustand + React shell in `apps/playground`**. Nothing in the core imports React, Next, Zustand, or React Flow.

**`packages/architecture` (pure + unit-tested):**
- `src/overlay.ts` — add `trinoResults(state, cursor)` + types (`TrinoResultRow`, `TrinoResults`) + the `TRINO_SEEDED_SQL` constant. Lives next to `airflowDagStatus`.
- `src/playbook.ts` — step 16 gains `openTool: 'overlook'` (no `apply` change; stays `() => {}`).
- `src/index.ts` — re-export the new symbols + types.
- `tests/overlay.test.ts` *(extended)* — `trinoResults` derivation across cursors.
- `tests/playbook.test.ts` *(extended)* — step 16 carries `openTool: 'overlook'`.

**`apps/playground` (reactive shell):**
- `app/_overlay/TrinoOverlay.tsx` *(new)* — the SQL-console + results-table mock body.
- `app/_overlay/tool-content.ts` — add `overlook: TrinoOverlay` (the single registration point).

Nothing else changes. `ToolOverlay.tsx`, `usePlayground.ts`, `Spine.tsx`, `NodeChip.tsx`, `playground-client.tsx`, `globals.css`, `tool-actions.ts` are untouched. The `overlook` component is already `fullUi: true`, so its node is already clickable; `openTool`/`closeTool`/`step` already exist; `MOCK_TOOL_BY_COMPONENT['overlook']` already carries the canonical-action/shows/reads/writes/fidelity text. No new playground dependency. No new canonical-action mutate (Trino writes nothing).

## The query + results derivation (pure core)

`trinoResults(state, cursor)` returns the seeded SQL string, the result rows, and the two cursor-derived flags. All reads are from `state.gold` (the query is over the Gold graph).

```ts
/** The Atlas-seeded SQL (SPEC §4.8) — pre-written; the user runs it, does not author it. */
export const TRINO_SEEDED_SQL = `-- Query seeded by Atlas: Sensitive Product View Audit
SELECT v.user, v.product, p.label AS product_name,
       p.sensitive, p.owner_group,
       CASE WHEN EXISTS (SELECT 1 FROM graph_edges m
                        WHERE m.from = v.user AND m.to = p.owner_group
                          AND m.kind = 'memberof')
            THEN 'memberof' ELSE 'no-backing' END AS backing
FROM graph_edges v
JOIN graph_nodes p ON p.id = v.product AND p.kind = 'product'
WHERE v.kind = 'viewed';`;

export interface TrinoResultRow {
  user: string;
  userName: string;
  product: string;
  productName: string;
  sensitive: boolean;
  ownerGroup: string;
  backing: 'memberof' | 'no-backing';
  anomalous: boolean;
  edgeId: string;
}

export interface TrinoResults {
  sql: string;
  rows: TrinoResultRow[];
  /** The seeded query has been run (step 16 applied). */
  queryRun: boolean;
  /** The "Run query" button is enabled (step 16 is the next step to apply). */
  canRun: boolean;
}
```

**Derivation:**
- `canRun = cursor === 15` (step 16 — `STEPS[15]` — is next; the one-code-path guard, mirroring Airflow's `cursor === 6` for step 7).
- `queryRun = cursor >= 16` (step 16 applied).
- `rows = queryRun ? deriveRows(state.gold) : []`.
- For each `viewed` edge in `state.gold.edges`:
  - resolve the product node (`kind === 'product'`) → `productName` = label, `sensitive`, `ownerGroup`.
  - resolve the user node (`kind === 'user'`) → `userName` = label.
  - `hasBacking` = a `memberof` edge from this user to the product's `ownerGroup` exists in `state.gold.edges`.
  - `anomalous`: if `edge.status === 'anomalous'` → true; if `edge.status === 'ok'` → false; if `edge.status === null` → `sensitive && !hasBacking` (the derivation, equal to `detectAnomalies`'s rule).
  - `backing = hasBacking ? 'memberof' : 'no-backing'`.

With the seed (cursor 16, step 17 not yet run): 2 rows — `j.harper / P-1042 / viewed / no-backing / anomalous=true` (derived: sensitive, no backing) and `m.okafor / P-1042 / viewed / memberof / anomalous=false` (derived: sensitive but backed). At cursor 17+ the same two rows show via the explicit `edge.status` flags step 17 wrote.

## The one-code-path canonical action

**No new mutate.** Trino writes nothing — it is a pure read surface (SPEC §4.8). The "Run query" button calls **`store.step()`** — the same action the auto-run interval calls, which applies `STEPS[cursor]` via `applyStep`. At `cursor === 15`, `store.step()` applies step 16 (`STEPS[15].apply === () => {}` — a narrate-only read) and advances the cursor to 16. Auto-run's step 16 and the overlay's "Run query" button therefore run the *same* step — one code path. There is no separate "overlay mutate" code path; the guard is the button's enabled/disabled state. The button is enabled only at `cursor === 15`; clicking advances the cursor to 16, running the read. Once `cursor >= 16` the button is ghosted "Query already run." Opening the overlay later (post-run) shows the results table populated with the action disabled — the act is done.

**Why this is the one code path:** auto-run (`setInterval(step)`) and the overlay's button both reduce to `applyStep(state, STEPS[cursor])`. There is no second mutate (there is no first mutate either — step 16 is a no-op; the read is the act). The Inspector's Gold tab is what the query reads from — the learner sees the query surface the Gold graph as a table row as they run it.

## Trino mock content

`TrinoOverlay.tsx` — the query surface, structured-echo of Trino's info shape (a SQL editor + run control + results table) in nanisoft tokens:

- **Seeded-query header**: a muted "Query seeded by Atlas: Sensitive Product View Audit" label (`font.data`, `surface.light.textMuted`) above the editor — the Atlas-seeded provenance (SPEC §4.8).
- **SQL editor** (`role="textbox"` `aria-label="seeded SQL query"`, `aria-readonly="true"`): a read-only pane (`font.data`, `surface.light.sunken` background, `radius.inner`) showing `TRINO_SEEDED_SQL`. The query is pre-written; the user runs it, does not author it. Monospace, line-broken.
- **Run control**: "Run query" — a pill, jade-accented when `canRun`, ghosted "Query already run" when `queryRun`. `font.voice`. `aria-label="Run seeded SQL query"`. Clicking performs step 16 (the one-code-path `store.step()`). Disabled otherwise.
- **Results table** (`role="table"` `aria-label="query results"`): a header row (`user · product · product_name · viewed · backing`) + one row per `viewed` edge, `font.data`. The anomalous row is highlighted **jade** — jade border + a soft jade fill (`rgba(20,167,122,0.10)`) + jade `anomalous` tag — the single locked accent for the live finding-as-a-row. The backed row is teal-bordered (`ok`). Empty state (pre-run): a muted "run the seeded query to see results" line. A small row-count line "N rows" appears when populated.
- **Fidelity footer**: a muted "mocked · query surface only · catalog/RBAC/federation/history/EXPLAIN hidden" line (the hidden richness, per `MOCK_TOOLS['overlook'].fidelity`).
- **Tokens**: `surface.light` panes, `radius.inner`, `font.data` for the editor + table, `font.voice` for the Run pill. Jade only for the anomalous row highlight + the enabled Run pill's accent. Teal for the backed (`ok`) row. Petrol for borders/muted text. No pure white/black. (Identity §2: jade = single locked accent, live/active only — here the live finding row.)

The overlay reads `trinoResults(state, state.cursor)` (pure) for the SQL, rows, and the two flags; it reads `store.step` for the canonical action. `BECKON_CURSOR` is computed the same way `AirflowOverlay`/`DataGerryOverlay` compute it (`STEPS.findIndex(s => s.openTool === 'overlook')`, = 15) — but the pure core hardcodes `cursor === 15` with a comment (mirroring `airflowDagStatus`'s `cursor === 6`), so the core stays free of the STEPS import.

## State model changes (pure core)

**None.** No new state field. No `STATE_FIELDS` or `importState` change. No `tool-actions.ts` change (Trino writes nothing).

Step table change (only step 16):

| # | Phase | Actor | Edge | apply (state change) | openTool |
|---|---|---|---|---|---|
| 16 | investigation | overlook | overlook→bedrock | `() => {}` (unchanged — the read is the act; Trino writes nothing) | `'overlook'` *(new)* |

All other steps unchanged. Step 16's mutate stays behavior-identical (a no-op); only its `openTool` is added.

## Testing + verification

**Pure core — vitest in `packages/architecture`** (TDD; extends the existing suite; `environment: node`, `tests/**/*.test.ts`):
- `overlay.test.ts` *(extended)* — `trinoResults(state, cursor)`:
  - cursor 0 (blank state) → `rows` empty, `queryRun` false, `canRun` false, `sql` = the seeded SQL.
  - cursor 15 (step 16 next; Gold populated by reduceToCursor) → `rows` empty (query not yet run), `canRun` true, `queryRun` false.
  - cursor 16 (step 16 applied, step 17 not yet) → `rows` length 2; the `j.harper → P-1042` row `anomalous=true`, `backing='no-backing'`; the `m.okafor → P-1042` row `anomalous=false`, `backing='memberof'`; both via *derivation* (`edge.status` still null); `queryRun` true, `canRun` false.
  - cursor 17 (step 17 applied — explicit flags) → same 2 rows but `anomalous` now read from `edge.status` (`'anomalous'` / `'ok'`); `queryRun` true, `canRun` false.
  - cursor 22 → 2 rows, both still consistent with the explicit flags; `canRun` false.
- `playbook.test.ts` *(extended)*: step 16 carries `openTool: 'overlook'`.

**Playground build verification:** `pnpm --filter playground build` green; the existing suites stay green (the architecture suite was 86/86).

## Acceptance criteria mapping (from the ticket)

| Ticket criterion | How this design satisfies it |
|---|---|
| SQL console: editor (pre-written, seeded by Atlas — header "Query seeded by Atlas: Sensitive Product View Audit") + run button + results table | `TrinoOverlay.tsx` renders the read-only editor with `TRINO_SEEDED_SQL` + the "Query seeded by Atlas" header + the "Run query" pill + the results table. |
| Canonical action: run the seeded SQL query (the user runs it; does not author SQL) | "Run query" button = `store.step()` at cursor 15 → applies step 16 (the read); editor is read-only. |
| Results table shows the anomalous row (`j.harper / P-1042 / viewed / no-backing`) highlighted; the finding as a table row | `trinoResults` derives the row; the overlay highlights the `anomalous` row jade (jade border + fill + tag). |
| Reads Gold (`graph_nodes`/`graph_edges`); writes nothing — pure read surface | `trinoResults` reads only `state.gold`; step 16 `apply === () => {}`; no `tool-actions.ts` mutate. |
| Reuses the overlay chrome + one-code-path pattern from 11 | Drops into `TOOL_CONTENT['overlook']`; chrome unchanged; `store.step()` is step 16's apply — one code path (auto-run and the button share it). |

## Out of scope (later tickets)

- Tools 14–16 (Atlas+OPA, Compass, Superset) — this ticket ships Trino only; they drop into `TOOL_CONTENT`.
- Compass auto-open at the finding (ticket 15) — untouched; Compass's existing `openTool` flags stay.
- Real SQL execution / a real Trino wire — the mock derives client-side from Gold (SPEC §4.8).