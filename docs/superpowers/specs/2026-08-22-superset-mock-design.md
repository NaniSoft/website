# Superset mock (ticket 16) — sandbox-only dashboard

> **Status:** approved design (2026-08-22). Branch: `feat/16-superset-mock`.
> **Source ticket:** `.scratch/nanosoft-digital-twin/issues/16-superset-mock-sandbox.md`.
> **Spec basis:** `.scratch/nanosoft-digital-twin/SPEC.md` §4.8 (Superset per-tool block — sandbox-only), §4.9 (Superset = read lens, the finding as a dashboard chart), §4.6 (seeded dataset — the planted anomaly), §2 (identity / motion), §6 (carry-forwards).
> **Prerequisites (done on main):** 07–12. Ticket 11 established the uniform `ToolOverlay` chrome, the pure-derivation pattern (`overlayReducer`/`beckonToolId`/`dataGerrySyncStatus` in `packages/architecture/src/overlay.ts`), and the single registration point `apps/playground/app/_overlay/tool-content.ts`. Ticket 12 added `airflowDagStatus` as the second pure derivation + `AirflowOverlay`. Superset drops in as the next entry — no chrome rework, no store changes.
> **Resolves:** ticket 16 (the sixth/sandbox mocked-tool overlay).

## Goal

Ship the **sandbox-only Superset dashboard mock** — the off-path, read-lens dashboard over live Gold (SPEC §4.8/§4.9). It is reached by **clicking the Superset node** (no guided step in the flagship; step 21 stays the optional narrate-only reactive step), explorable from the seed before the flagship finding runs. A pre-built dashboard grid + filter bar: (1) **bar** — products by exposure count; (2) **table** — users with anomalous views (`j.harper` flagged); (3) **donut** — views by source system. The canonical action is **apply a filter / drill-down** (toggle "sensitive only", or click a bar to drill a product) → the dashboard re-renders. It **reads Gold client-side** (deriving exposure = a `viewed` edge with no `memberof` backing = exposed), **writes nothing**, and carries a "query path: Superset → Trino → Gold" label.

This ticket reuses the ticket-11/12 framework verbatim with **one deliberate exception**: Superset has **no `store.step()` button** and **no `openTool` on any step**. Its canonical action is filter/drill-down — local UI state in the overlay, not a lakehouse mutate — because Superset is a read lens (SPEC §4.9). It adds **no new state field** and **no store or chrome changes**.

## Decisions (locked during brainstorm)

1. **No `openTool` on any step.** Superset is sandbox-only. Step 21 (`actor: 'superset'`, the "(Optional) Superset can pin the finding as a dashboard" narrate step) stays exactly as it is — a narrate-only reactive step with `apply: () => {}` and **no `openTool`**. The overlay is reached purely by clicking the Superset node, which already works because `superset` is `fullUi: true` (`NodeChip` calls `onOpenTool(c.id)` for every `fullUi` node). This is the deliberate exception to the beckon pattern: every other full-UI tool beckons via its step's `openTool`; Superset never beckons — it is always openable. (Rejected: adding `openTool: 'superset'` to step 21 — that would make Superset beckon at cursor 21, putting a sandbox tool on the flagship path and violating "off the flagship path.")
2. **No `store.step()` button — the canonical action is local UI state.** Superset writes nothing (SPEC §4.9: read lens). Its canonical action — toggle "sensitive only" / click a bar to drill — is **local React state in the overlay** (`{ sensitiveOnly: boolean; drillProductId: string | null }`), not a lakehouse mutate and not a playbook step. There is no `store.step()` button in `SupersetOverlay`. This is the deliberate exception to the one-code-path pattern (DataGerry/Airflow/Trino/Atlas/Compass all mutate via `store.step()`); Superset does not mutate. The filter re-queries Gold by re-deriving `supersetDashboard(state)` from the live `state` on every render (Zustand reactivity) and re-applying the local filter — the dashboard re-renders. (Rejected: modelling the filter as playground state — it is view state, not lakehouse state; persisting it would violate "writes nothing.")
3. **Pure core: `supersetDashboard(state, cursor)`** in `packages/architecture/src/overlay.ts`, mirroring `dataGerrySyncStatus`/`airflowDagStatus`. Returns the three datasets — products-by-exposure, anomalous-users, views-by-source-system — derived purely from Gold (+ the product/user dimension tables already on `PlaygroundState`). The `cursor` parameter is accepted for signature consistency with the sibling derivations but is **unused** — the derivation is of Gold only, so the dashboard works from the seed (populated Gold) at any cursor, including before the flagship finding (step 17). **Exposure = a `viewed` edge where the viewer has no `memberof` edge to the viewed product's `ownerGroup`** (the SPEC §4.8 definition — "viewed edge with no memberof backing = exposed"). An **anomalous view** (the table) = an exposure **on a sensitive product** (matching `detectAnomalies`). The derivation computes exposure independently of the step-17 `edge.status` marking — so it surfaces the exposure before the flagship finding runs. The filter is UI-local (overlay), NOT in the derivation. Add types + re-export from `index.ts`. Unit-test it, including a from-seed case (populated Gold at cursor 0) and a before-step-17 case.
4. **Three charts, read as one system (dataviz):** (1) **bar** — products by exposure count (one bar per product, height = unbacked viewed-edge count); (2) **table** — users with anomalous views (one row per anomalous `viewed` edge; `j.harper → P-1042` flagged); (3) **donut** — views by source system (the Gold graph's edges by their feeding source system: `viewed` → SQL Server Fleet, `memberof` → Active Directory). Nanisoft tokens, jade reserved for the live/anomalous state only (the `j.harper` row + the exposure bar for the sensitive product), teal for backed/done, petrol for neutral. Accessible (roles, labels, contrast) and consistent in light + dark. Pre-built (no chart-builder).
5. **Filter reactivity model:** the pure core returns the three datasets **unfiltered**; the overlay holds the filter state and applies it by row-filtering. The **bar** row-filters `products` by `sensitiveOnly` (sensitive products only) and `drillProductId` (the drilled product); clicking a bar sets `drillProductId`. The **table** row-filters `anomalousUsers` by `drillProductId` (the drilled product's anomalous views). The **donut** is a global overview (the Gold source mix) and is not row-filtered by the product drill — it is the stable context that the bar/table filter against. This satisfies "dashboard re-renders" (bar + table re-render on filter; the donut is the overview). (Rejected: putting the filter in the pure derivation — the task mandates the filter be UI-local; rejected: making the donut filter by product — memberof edges are not product-scoped, so a product-filtered donut would be inconsistent.)

### The donut's "views by source system" — a fidelity note

The SPEC §4.8 donut label is "views by source system." A `viewed` edge is a view-log record, and in the real architecture the view-logs are ingested from the **SQL Server Fleet** (the LOB access logs). With the minimal seed (2 view-logs, both from SQL Fleet), a strict "viewed edges by source" donut is a single slice (100% SQL Server Fleet) — honest but visually degenerate (a full ring with no category contrast). The only **multi-category** source-system breakdown derivable from Gold is by **edge kind**: `viewed` edges → SQL Server Fleet (the access logs), `memberof` edges → Active Directory (the group memberships). The donut therefore renders the **Gold graph's edges by their contributing source system** (2 slices: SQL Server Fleet / Active Directory), labeled "Views by source system" per the SPEC, with a sub-caption "Gold edges by contributing source system" to be precise. This is the honest, non-degenerate categorical breakdown the seed supports and it teaches the Gold graph is multi-source. Seed-richness carry-forward (§6): richer view-log source lineage would let the donut split the viewed slice further.

## Architecture & file layout

Boundary unchanged from ticket 11/12: **pure domain core in `packages/architecture`**, **thin Zustand + React shell in `apps/playground`**. Nothing in the core imports React, Next, Zustand, or React Flow.

**`packages/architecture` (pure + unit-tested):**
- `src/overlay.ts` — add `supersetDashboard(state, cursor)` + types (`SupersetExposureRow`, `SupersetAnomalousUserRow`, `SupersetSourceSystem`, `SupersetSourceRow`, `SupersetDashboard`). Lives next to `airflowDagStatus`.
- `src/index.ts` — re-export the new symbol + types.
- `tests/overlay.test.ts` (extend) with the from-seed + before-step-17 cases.

**`apps/playground` (reactive shell):**
- `app/_overlay/SupersetOverlay.tsx` *(new)* — the dashboard mock body (filter bar + bar + table + donut + query-path label + fidelity footer).
- `app/_overlay/tool-content.ts` — add `superset: SupersetOverlay` (the single registration point).

Nothing else changes. `ToolOverlay.tsx`, `usePlayground.ts`, `Spine.tsx`, `NodeChip.tsx`, `playground-client.tsx`, `globals.css`, `playbook.ts` are untouched. The `superset` component is already `fullUi: true` (node already clickable); `openTool`/`closeTool` already exist; `MOCK_TOOL_BY_COMPONENT['superset']` already carries the canonical-action/shows/reads/writes/fidelity text. No new playground dependency.

## The exposure derivation (pure core)

`supersetDashboard(state, cursor)` returns three datasets, each derived purely from `state.gold` + the dimension tables (`state.products`, `state.users`, `state.groupMemberships`) already on `PlaygroundState`:

```ts
export type SupersetSourceSystem = 'SQL Server Fleet' | 'Active Directory';

export interface SupersetExposureRow {
  productId: string;
  productName: string;
  sensitive: boolean;
  /** Unbacked viewed edges to this product (exposure). */
  exposureCount: number;
  /** Total viewed edges to this product. */
  viewCount: number;
}

export interface SupersetAnomalousUserRow {
  user: string;
  userLabel: string;
  productId: string;
  productName: string;
  /** The anomalous viewed edge. */
  edgeId: string;
  ownerGroup: string;
}

export interface SupersetSourceRow {
  sourceSystem: SupersetSourceSystem;
  edgeKind: 'viewed' | 'memberof';
  count: number;
}

export interface SupersetDashboard {
  /** Bar — products by exposure count (all products, unfiltered). */
  products: SupersetExposureRow[];
  /** Table — users with anomalous views (sensitive + unbacked). */
  anomalousUsers: SupersetAnomalousUserRow[];
  /** Donut — views by source system (Gold edges by contributing source). */
  sources: SupersetSourceRow[];
}
```

**Derivation:**
- Build `membersOf: Map<user, Set<group>>` from `state.groupMemberships`, and `products`/`users` lookups from the dimension tables.
- **Bar** — one row per product in `state.products` (the product dimension), `viewCount` = count of `viewed` edges to it, `exposureCount` = count of those where the viewer is NOT a member of the product's `ownerGroup`. (P-1042 → viewCount 2, exposureCount 1; P-2210 → 0/0. Including all products — even those not in Gold — makes the bar non-degenerate and the "sensitive only" filter meaningful.)
- **Table** — for each `viewed` edge where the product is `sensitive` AND the viewer has no `memberof` to the product's `ownerGroup`, emit a row (user, label, product, edgeId, ownerGroup). This is exactly `detectAnomalies` re-derived independently of `edge.status` (so it works before step 17). (j.harper → P-1042 is the one row.)
- **Donut** — `sources = [{ SQL Server Fleet, 'viewed', viewedEdges.length }, { Active Directory, 'memberof', memberofEdges.length }]`.

The `cursor` parameter is unused (derivation is of Gold only) — kept in the signature for consistency with the sibling derivations. The function does not read `state.finding` or `state.gold.edges[*].status`; it derives exposure from scratch.

**From-seed behavior (the teaching point):** because the derivation is of Gold only (not the cursor, not the finding), `supersetDashboard(seedState, 0)` where `seedState = { ...SEED, finding: null, cursor: 0 }` returns the full dashboard (1 exposure, 1 anomalous user, 2 source rows) — explorable before the flagship finding runs. `supersetDashboard(blankState(), 0)` returns empty arrays / zero counts (Gold empty at cursor 0) and does not crash. `supersetDashboard(reduceToCursor(STEPS, 10), 10)` (Gold populated, finding not set, edge statuses null) returns the full dashboard — proving it works before step 17. `supersetDashboard(reduceToCursor(STEPS, 17), 17)` returns the same dashboard (it ignores the step-17 status marking) — proving the read lens derives independently.

## The no-mutate canonical action (filter / drill-down)

`SupersetOverlay` holds local React state:

```ts
const [sensitiveOnly, setSensitiveOnly] = useState(false);
const [drillProductId, setDrillProductId] = useState<string | null>(null);
```

The dashboard datasets come from `supersetDashboard(state, state.cursor)` (pure), re-derived on every render via Zustand reactivity. The overlay applies the filter by row-filtering:
- **Bar** — `dashboard.products.filter(p => (!sensitiveOnly || p.sensitive) && (!drillProductId || p.productId === drillProductId))`. Clicking a bar sets `drillProductId` (drill) or toggles it off if already drilled.
- **Table** — `dashboard.anomalousUsers.filter(u => (!drillProductId || u.productId === drillProductId))`.
- **Donut** — `dashboard.sources` (unfiltered global overview).

The filter bar: a "Sensitive only" toggle (pill, jade-accent when active) + a "Clear" affordance when a drill is active. No `store.step()` button. No write to the lakehouse. This is the deliberate exception to the one-code-path pattern, noted explicitly.

## Superset mock content

`SupersetOverlay.tsx` — the dashboard surface, structured-echo of Superset's info shape (a dashboard grid + filter bar) in nanisoft tokens:

- **Query-path label** (top): "query path: Superset → Trino → Gold" in `font.data`, muted, with a note "mocked · reads in-browser Gold directly (no query engine wired)". Notes the real routing.
- **Filter bar**: "Sensitive only" toggle (pill, jade border/fill when active, petrol when not) + a "clear drill" pill when `drillProductId` is set. `font.voice`. `aria-pressed` on the toggle.
- **Dashboard grid** (3 panels, each a `surface.light.elevated` card with `radius.inner`):
  1. **Bar — "Products by exposure count"** (`role="img"` `aria-label`): one bar per product (filtered). Bar height = `exposureCount`; the sensitive product's bar is jade (the live/anomalous state), non-sensitive is petrol/teal-neutral. Bars are clickable (`role="button"`, `aria-label="Drill into <product>"`); the drilled bar is emphasized (jade border). Axis: product labels (`font.data`) + count. Zero-exposure products render as a minimal baseline so "Inventory-NG has no exposure" is visible.
  2. **Table — "Users with anomalous views"** (`role="table"` / `aria-label`): columns user · product · owner group · status. One row per anomalous view (filtered). The `j.harper` row is flagged jade (the live/anomalous state) with a "no backing membership" status; backed views do not appear (the table is anomalous-only by construction). `font.data`.
  3. **Donut — "Views by source system"** (`role="img"` `aria-label`): 2 slices (SQL Server Fleet = `viewed` edges, Active Directory = `memberof` edges), teal + petrol (jade reserved for the anomalous state only, so the donut uses teal/petrol). Legend with counts + percentages. Sub-caption "Gold edges by contributing source system".
- **Fidelity footer**: a muted "mocked · dashboard surface only · SQL Lab/dataset editor/row-level security/alerting/cache hidden" line (the hidden richness, per `MOCK_TOOLS['superset'].fidelity`).
- **Tokens**: `surface.light` panes, `radius.inner`, `font.data` for labels/counts/legend, `font.voice` for the filter. Jade only for the anomalous state (j.harper row + the sensitive product's exposure bar + the active filter accent). Teal for backed/neutral chart marks. Petrol for neutral. No pure white/black. (Identity §2: jade = single locked accent, live/active only.) Charts read as one system: shared palette, shared radius, consistent typography, light + dark safe.

The overlay reads `supersetDashboard(state, state.cursor)` (pure) for the three datasets and applies the local filter. It does NOT call `store.step`. `BECKON_CURSOR` is not computed (Superset never beckons).

## State model changes (pure core)

**None.** No `SeedDataset`/`PlaygroundState`/`STATE_FIELDS`/`importState` change. No `playbook.ts` change (step 21 stays as-is). No store change. No chrome change.

## Testing + verification

**Pure core — vitest in `packages/architecture`** (TDD; extends `tests/overlay.test.ts`; `environment: node`):
- `supersetDashboard(state, cursor)`:
  - **From seed** — `supersetDashboard({ ...SEED, finding: null, cursor: 0 }, 0)` → `products` = [P-1042 (sensitive, exposure 1, views 2), P-2210 (not sensitive, exposure 0, views 0)]; `anomalousUsers` = [j.harper → P-1042, ownerGroup G-SR, edgeId `e:viewed:j.harper:P-1042`]; `sources` = [SQL Server Fleet/viewed/2, Active Directory/memberof/2].
  - **Blank** — `supersetDashboard(blankState(), 0)` → `products` = [P-1042 (0/0), P-2210 (0/0)]; `anomalousUsers` = []; `sources` = [SQL Fleet/viewed/0, AD/memberof/0]. (Well-formed, no crash.)
  - **Before step 17** — `supersetDashboard(reduceToCursor(STEPS, 10), 10)` (Gold populated, finding null, statuses null) → same as the from-seed case (1 exposure, 1 anomalous user, 2/2 sources). Proves it works before the flagship finding.
  - **After step 17** — `supersetDashboard(reduceToCursor(STEPS, 17), 17)` → same dashboard (derives independently of `edge.status`).
  - **Cursor 22** — same dashboard (all steps done; Superset still reads the same Gold).
  - `cursor` parameter is unused — passing different cursors with the same state yields the same dashboard.

**Playground render verification (no vision — the project's "resolved without vision" norm; Playwright MCP browser tools drive the running dev server):**
- `pnpm -r build` green; `next dev` on :3001; console clean.
- Playwright MCP a11y snapshot: click the `Superset` node → `role="dialog"` with `aria-label="Superset"`, the "mocked" badge, the "query path: Superset → Trino → Gold" label, the filter bar ("Sensitive only"), and the three dashboard panels (bar, table, donut).
- **From-seed render (the key acceptance criterion):** at a fresh playground (cursor 0), the dashboard renders the three charts from the live Gold. At cursor 0 `blankState()` has empty Gold → the bar shows both products at 0 exposure, the table is empty, the donut shows 0/0. Step the playbook to cursor 10 (Gold populated, before the finding) → the bar shows P-1042 at 1 exposure (jade) + P-2210 at 0; the table shows the `j.harper` row (flagged); the donut shows SQL Fleet 2 / Active Directory 2. This confirms the dashboard renders from the seeded Gold before the flagship finding runs.
- Toggle "Sensitive only" → the bar hides P-2210 (non-sensitive); the table unchanged (anomalous-only); the donut unchanged (overview). Click the P-1042 bar → `drillProductId = P-1042`; the bar emphasizes P-1042; the table filters to the j.harper row; the "clear drill" pill appears. Click again or "clear" → drill cleared.
- Esc closes the overlay; `window.__playground.getState().overlay` → `null`.
- `prefers-reduced-motion` → no motion (Superset has none by default).
- Existing suites stay green (identity, landing, architecture; DataGerry + Airflow overlays + beckon).

**Human visual confirm** — the one step not done here (operator AFK): the split-pane Superset dashboard, the jade anomalous flag on j.harper + the sensitive exposure bar, the donut, and the filter reactivity. Flagged for the operator's return; the a11y + build + live-state checks stand in until then.

## Acceptance criteria mapping (from the ticket)

| Ticket criterion | How this design satisfies it |
|---|---|
| Reached by clicking the Superset node (no guided step); off the flagship path | `superset` is `fullUi: true` → `NodeChip` calls `onOpenTool('superset')`; no `openTool` on any step (Decision 1); step 21 stays narrate-only. |
| Dashboard grid + filter bar: bar / table / donut | `SupersetOverlay.tsx` renders the 3-panel grid + filter bar from `supersetDashboard` (Decision 3/4). |
| Canonical action: apply a filter / drill-down → re-queries Gold → dashboard re-renders | Local filter state (Decision 2/5); overlay re-derives `supersetDashboard(state)` on every render (Zustand reactivity) + row-filters; no `store.step()`, no write. |
| Reads Gold client-side (exposure = viewed edge with no memberof backing = exposed); writes nothing; "query path: Superset → Trino → Gold" label | `supersetDashboard` derives exposure from Gold (Decision 3); no write; query-path label in the overlay. |
| Explorable before the flagship runs, from the seed | Derivation is of Gold only (unused cursor); from-seed test + cursor-10 render verification (Decision 3). |

## Out of scope

- Tools 13–15 (Overlook, Atlas+OPA, Compass) — parallel tickets; they drop into `TOOL_CONTENT` independently.
- A "compliance dashboard playbook" on the Superset surface (SPEC §6 future use-case) — stays fog.
- Richer view-log source lineage (multi-source viewed slice) — seed-richness carry-forward (§6).
- Chart-builder / SQL Lab / dataset editor / row-level security / alerting / cache — hidden (fidelity footer).