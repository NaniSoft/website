# Compass mock (ticket 15) — the climax

> **Status:** approved design (2026-08-22). Branch: `feat/15-compass-mock`.
> **Source ticket:** `.scratch/nanosoft-digital-twin/issues/15-compass-mock-climax.md`.
> **Spec basis:** `.scratch/nanosoft-digital-twin/SPEC.md` §4.8 (mock fidelity — Compass; cross-cutting 3: "Compass auto-opens at the finding step — the one climax"), §4.9 (Compass = the "read" lens, finding as edges), §2 (identity / motion), §6 (carry-forwards: node-within-node containment deferred; split-pane locked).
> **Prerequisites (done on main):** 07–12. Ticket 11 established the uniform `ToolOverlay` chrome, the one-code-path pattern, the pure derivations in `packages/architecture/src/overlay.ts`, and the single registration point `apps/playground/app/_overlay/tool-content.ts`. Ticket 12 added `airflowDagStatus` + the `AirflowOverlay` (custom CSS/SVG mini-DAG, no second React Flow canvas) — the render pattern this ticket mirrors.
> **Resolves:** ticket 15 (the fifth of the six mocked-tool overlays — the climax).

## Goal

Ship the **fifth mocked-tool overlay — Compass** — the product's own differentiated value: a traversal graph that shows the finding **as edges** (jade anomalous `viewed` edge, a **dashed missing `memberof` gap**, teal backed access) plus a narrative, with **drill-into-node** for the "why." Compass is the **most faithful** of the six mocks (the structured-echo rule does not apply — Compass is the product's own value, per `MOCK_TOOLS['compass'].fidelity`).

The climax: Compass **auto-opens at the finding step** (step 19, `final: true`) — the ONE auto-open mid-run. Every other tool only beckons (ripple); Compass alone opens itself. This is the single exception to "overlays do not auto-open mid-run" (SPEC §4.8 cross-cutting 3).

Compass **writes nothing**. Its canonical action is **drill-into-node** — clicking a graph node to read its "why" — which is **local UI state** in the overlay (which node is selected), not a lakehouse mutate. This is the intentional exception to the one-code-path pattern: there is no `store.step()` button because there is no step to perform; the act is exploration, not mutation (SPEC §4.9: Compass is a read/exploration lens).

## Decisions (locked during brainstorm)

1. **Auto-open trigger = `cursor === 19` (the finding step, `final: true`), in a `useEffect` in `playground-client.tsx`.** The store's `openTool`/`overlay` already exists; `openTool` on a step currently only drives the *beckon* (ripple via `beckonToolId`). The auto-open is a new, single reactive hook: when `cursor` reaches the finding step's `n` (19) the Compass overlay opens itself. Implemented as a `useEffect` keyed on `cursor` that calls `openTool('compass')` when `cursor === 19`, no overlay is currently open, and a `useRef` guard (`autoOpenedFinding`) has not already fired for this run. The guard prevents re-opening after the user closes the overlay at 19; it resets when `cursor < 19` (reset / before-climax). This fires in **both** auto-run (the interval advances `cursor` to 19 via `applyStep`) and single-step (the user steps to 19) — one trigger, both modes. It is the **only** auto-open; no other tool gets one. The existing close behavior (Esc / ✕) is preserved — closing sets `overlay = null` but does not re-trigger the effect (the effect depends on `cursor`, not `overlay`). (Rejected: wiring the auto-open into the store's `step()` path — it would couple the pure reducer to a specific tool and fire on `reduceToCursor` imports too; rejected: depending on `overlay` in the effect — it would re-open Compass every time the user closed it at 19.)
2. **No `store.step()` button — drill-into-node is local UI state, not a mutate.** Compass's canonical action is selecting a graph node to read its detail. The selected-node id is held in `useState` inside `CompassOverlay.tsx` — it never touches the Zustand store or the lakehouse. This is faithful: SPEC §4.9 names Compass a *read* lens, and the ticket explicitly notes this is an intentional exception to the one-code-path rule (not a missed one). There is no `tool-actions.ts` addition and no `playbook.ts` change for this ticket (steps 11/19 already carry `openTool: 'compass'`; step 19 is already `final: true`).
3. **Pure core `compassTraversal(state, cursor)`** in `packages/architecture/src/overlay.ts`, mirroring `airflowDagStatus`/`dataGerrySyncStatus`. Returns the traversal graph (nodes from Gold, edges from Gold + a synthesized `missing` memberof gap), a `ready` flag (`state.finding !== null && cursor >= 19` — the climax render point), a pre-climax `status` line, the narrative (3 lines, when ready), and per-node drill-into `details` (when ready). The selected-node state is UI-local (overlay), NOT in the derivation. Adds types + re-exports from `index.ts`; unit-tested.
4. **Render = custom CSS/SVG traversal graph** (NOT a second React Flow canvas — the ticket mandates this). A 3-column layout (users | product | group) with an SVG edge layer behind absolutely-positioned node chips. Jade for the anomalous `viewed` edge, a dashed petrol gap for the missing `memberof` edge, teal for backed (`ok`/`memberof`) edges, petrol for pending edges (pre-step-17). Node chips are clickable → a detail panel shows the selected node's `details` text. This mirrors Airflow's mini-DAG approach (CSS/SVG, no React Flow) and is the spectacle/climax.
5. **`ready` gate protects the climax.** Before `cursor` 19 the overlay (if opened manually at step 11's beckon) shows the raw Gold graph shape with a status line ("Querying Atlas for the traversal path…" when the finding is null; "Atlas returned the highlighted path — rendering traversal…" once the finding is set but the cursor is < 19). At `cursor >= 19` the full traversal renders: jade/teal/dashed edges + narrative + drill-into. This preserves the climax as a moment, not a gradual reveal, while keeping the overlay useful whenever it is open.

## Architecture & file layout

Boundary unchanged from ticket 11/12: **pure domain core in `packages/architecture`**, **thin Zustand + React shell in `apps/playground`**. Nothing in the core imports React, Next, Zustand, or React Flow.

**`packages/architecture` (pure + unit-tested):**
- `src/overlay.ts` — add `compassTraversal(state, cursor)` + types (`CompassNode`, `CompassEdge`, `CompassNarrativeStep`, `CompassTraversal`). Lives next to `airflowDagStatus`.
- `src/index.ts` — re-export the new symbols + types.
- `tests/overlay.test.ts` (extend).

**`apps/playground` (reactive shell):**
- `app/_overlay/CompassOverlay.tsx` *(new)* — the traversal-graph mock body + drill-into detail panel.
- `app/_overlay/tool-content.ts` — add `compass: CompassOverlay` (the single registration point).
- `app/playground-client.tsx` — add the auto-open `useEffect` (the one climax hook).

Nothing else changes: `ToolOverlay.tsx`, `usePlayground.ts`, `Spine.tsx`, `NodeChip.tsx`, `globals.css` are untouched. The `compass` component is already `fullUi: true` (node already clickable); `openTool`/`closeTool` already exist; `MOCK_TOOL_BY_COMPONENT['compass']` already carries the canonical-action/shows/reads/writes/fidelity text. No new playground dependency, no new state field.

## The traversal graph derivation (pure core)

`compassTraversal(state, cursor)` describes the finding as a small graph, derived purely from Gold + the finding:

```ts
export type CompassNodeKind = 'user' | 'product' | 'group';

export interface CompassNode {
  id: string;
  kind: CompassNodeKind;
  label: string;
  sensitive?: boolean;   // product nodes only
  ownerGroup?: string;   // product nodes only
}

export type CompassEdgeStatus = 'anomalous' | 'ok' | 'backed' | 'pending' | 'gap';

export interface CompassEdge {
  id: string;
  from: string;
  to: string;
  kind: 'viewed' | 'memberof';
  /** Display class derived from Gold `status` + `missing`. */
  status: CompassEdgeStatus;
  /** True for the synthesized missing-memberof gap (no Gold edge). */
  missing: boolean;
}

export interface CompassNarrativeStep {
  n: number;
  text: string;
}

export interface CompassTraversal {
  /** True once the finding is set AND cursor >= 19 (the climax render point). */
  ready: boolean;
  /** A pre-climax status line (rendered before the traversal is ready). */
  status: string;
  nodes: CompassNode[];
  edges: CompassEdge[];
  /** 3 narrative lines, populated when ready. */
  narrative: CompassNarrativeStep[];
  /** Per-node drill-into detail text, populated when ready. */
  details: Record<string, string>;
  /** The structured finding, once set (null before step 17). */
  finding: Finding | null;
}
```

**Node/edge mapping** (from `state.gold` + `state.finding`):

| node id | kind | label | source |
|---|---|---|---|
| `j.harper` | user | Jordan Harper | `gold.nodes` |
| `m.okafor` | user | Mara Okafor | `gold.nodes` |
| `a.chen` | user | Alex Chen | `gold.nodes` |
| `P-1042` | product | Payroll-NG (sensitive, ownerGroup G-SR) | `gold.nodes` |
| `G-SR` | group | Sensitive Reports | `gold.nodes` |

| edge | from→to | kind | status | source |
|---|---|---|---|---|
| `e:viewed:j.harper:P-1042` | j.harper→P-1042 | viewed | `anomalous` (jade) | `gold.edges` (status set at step 17) |
| `e:viewed:m.okafor:P-1042` | m.okafor→P-1042 | viewed | `ok` (teal) | `gold.edges` (status set at step 17) |
| `e:memberof:m.okafor:G-SR` | m.okafor→G-SR | memberof | `backed` (teal) | `gold.edges` |
| `e:memberof:a.chen:G-SR` | a.chen→G-SR | memberof | `backed` (teal) | `gold.edges` |
| `e:missing:j.harper:G-SR` | j.harper→G-SR | memberof | `gap` (dashed petrol) | **synthesized** from `finding.missingMembership` |

**Edge status derivation:**
- `missing` edge → `status: 'gap'` (dashed petrol, the missing-memberof gap).
- `viewed` with `gold.status === 'anomalous'` → `'anomalous'` (jade).
- `viewed` with `gold.status === 'ok'` → `'ok'` (teal).
- `memberof` (gold.status null) → `'backed'` (teal).
- `viewed` with `gold.status === null` (before step 17) → `'pending'` (petrol).

**`ready` + `status`:**
- `ready = state.finding !== null && cursor >= 19`.
- `finding === null` (cursor < 17) → `status = "Querying Atlas for the traversal path…"`.
- `finding !== null && cursor < 19` (17–18) → `status = "Atlas returned the highlighted path — rendering traversal…"`.
- `ready` → `status = ""` (the traversal renders; the status line is hidden).

**Narrative** (3 lines, when ready, derived from the finding):
1. `` `j.harper viewed P-1042 (Payroll-NG) — sensitive: true` ``
2. `` `j.harper has no memberof edge to G-SR (Sensitive Reports) — the backing group for P-1042` ``
3. `` `m.okafor and a.chen both hold memberof → G-SR — backed access` ``

**Per-node drill-into `details`** (when ready, derived from the finding + Gold):
- `j.harper`: `"viewed P-1042 (sensitive: true), no backing group membership"`
- `P-1042`: `"sensitive: true, Payroll-NG"`
- `m.okafor`: `"viewed P-1042 — backing membership G-SR present (ok)"`
- `a.chen`: `"memberof G-SR — backed access"`
- `G-SR`: `"Sensitive Reports — owner group of P-1042 (Payroll-NG)"`

## The auto-open (the one climax hook)

Added to `apps/playground/app/playground-client.tsx`:

```tsx
const FINDING_STEP_N = STEPS.find((s) => s.final)?.n ?? 19;   // step 19
const cursor = usePlayground((s) => s.state.cursor);
const openTool = usePlayground((s) => s.openTool);
const autoOpenedFinding = useRef(false);

useEffect(() => {
  if (cursor === FINDING_STEP_N && !autoOpenedFinding.current) {
    if (!usePlayground.getState().overlay) openTool('compass');
    autoOpenedFinding.current = true;
  }
  if (cursor < FINDING_STEP_N) autoOpenedFinding.current = false;
}, [cursor, openTool]);
```

- **Only auto-open:** Compass is the sole tool with an auto-open; no `useEffect` opens any other tool. The effect is keyed on `cursor` (not `overlay`) so closing the overlay at 19 does not re-trigger it.
- **Both modes:** auto-run's interval and single-step both advance `cursor` to 19 via `applyStep`; the effect fires on the cursor transition.
- **Close preserved:** Esc / ✕ call `closeTool` (sets `overlay = null`); the effect does not re-fire (cursor unchanged), so Compass stays closed. The user can re-open it manually by clicking the Compass node.
- **Reset:** `reset()` sets `cursor = 0` → the effect resets `autoOpenedFinding.current = false` → the next climb to 19 auto-opens again.

## Compass mock content

`CompassOverlay.tsx` — the traversal surface, the most faithful mock (the product's own value, in nanisoft tokens):
- **Traversal graph** (`role="group"` `aria-label="compass traversal"`): a 3-column layout — users (left), the product (middle), the group (right). An SVG layer behind the node chips draws the edges: jade `<line>` for the anomalous `viewed` edge, a dashed petrol `<line>` for the missing `memberof` gap, teal `<line>`s for the backed (`ok`/`memberof`) edges, petrol for pending (pre-step-17). Each edge carries a small label (`viewed` / `memberof`) at its midpoint. Node chips are `font.data` labels in `radius.inner` boxes, colored by kind (sensitive product gets a jade accent ring when ready).
- **Drill-into detail panel** (the canonical action): clicking a node chip selects it (`useState` local) → a detail panel below the graph shows the node's `details` text (from `compassTraversal`). The panel has `role="status"` + `aria-label="compass node detail"`. Default: "Select a node to inspect the finding." This is Compass's differentiated value (graph exploration); it never touches the store.
- **Narrative** (when ready): the 3 narrative lines rendered as an ordered list (`role="list"`), `font.data`.
- **Pre-climax status** (when not ready): the `status` line rendered as a muted `font.data` note above the graph; the raw Gold graph shape still shows (nodes/edges in petrol/pending), so the overlay is useful whenever it is open.
- **Fidelity footer**: a muted line echoing `MOCK_TOOLS['compass'].fidelity` ("most faithful of the six · Compass is the product's own value · node-within-node containment deferred").
- **Tokens**: `surface.light` panes, `radius.inner`, `font.data` for node labels / narrative, `font.voice` for the panel. Jade only for the anomalous viewed edge + the sensitive-product accent. Teal for backed/ok edges. Petrol for pending + the dashed gap. No pure white/black. (Identity §2: jade = single locked accent, live/active only — the anomalous edge IS the live finding.)

The overlay reads `compassTraversal(state, state.cursor)` (pure) for all graph data + narrative + details. It reads `usePlayground` only for `state` (no `step`/`openTool`/`closeTool` — it writes nothing).

## State model changes (pure core)

**None.** Gold (`graph_nodes`/`graph_edges`, with `status` set at step 17) and `finding` (set at step 17) already exist in `SeedDataset`/`PlaygroundState`. `compassTraversal` only reads them. No `STATE_FIELDS` or `importState` change. No `tool-actions.ts` addition (Compass writes nothing). No `playbook.ts` change (steps 11/19 already carry `openTool: 'compass'`; step 19 is already `final: true`).

## Testing + verification

**Pure core — vitest in `packages/architecture`** (TDD; extends the existing suite; `environment: node`, `tests/**/*.test.ts`):
- `overlay.test.ts` *(extended)* — `compassTraversal(state, cursor)`:
  - blank state (cursor 0) → `ready` false, `status` contains "Querying Atlas", `nodes`/`edges` empty (Gold empty), `narrative` empty, `details` empty, `finding` null.
  - cursor 10 (Gold conformed, no finding) → 5 nodes / 4 edges (no missing gap), all viewed edges `pending`, memberof edges `backed`; `ready` false; `finding` null; `status` "Querying Atlas…".
  - cursor 17 (finding set, edges flagged) → 5 nodes / **5** edges (the synthesized missing gap `e:missing:j.harper:G-SR`), the j.harper→P-1042 edge `anomalous`, m.okafor→P-1042 `ok`, memberof edges `backed`, missing edge `gap`; `ready` false (cursor < 19); `finding` non-null; `status` "Atlas returned the highlighted path…".
  - cursor 19 (the climax) → `ready` true; `status` empty; `narrative` has 3 lines; `details` has entries for all 5 nodes; `details['j.harper']` contains "no backing group membership"; `details['P-1042']` contains "sensitive: true"; `details['G-SR']` contains "owner group".
  - cursor 22 (run complete) → `ready` true; same 5 nodes / 5 edges; narrative + details still populated.
  - missing-gap edge shape: id `e:missing:j.harper:G-SR`, `from: 'j.harper'`, `to: 'G-SR'`, `kind: 'memberof'`, `status: 'gap'`, `missing: true`.

**Playground render verification (no vision — the project's "resolved without vision" norm; Playwright MCP browser tools drive the running dev server):**
- `pnpm -r build` green; `next dev` on :3001; console clean.
- Playwright MCP a11y snapshot: the Compass node is clickable (full-UI).
- Auto-open: single-step (via `window.__playground.getState().step()` repeated) to cursor 19 → assert `window.__playground.getState().overlay` is `{ componentId: 'compass', openedAtCursor: 19 }` (the climax auto-open). Assert `role="dialog"` `aria-label="Compass"` appears.
- Close preserves: press Esc → `overlay` becomes `null`; step once more (cursor 20) → the overlay does NOT auto-reopen (guard fired).
- Reset: `window.__playground.getState().reset()` → `cursor` 0; step back to 19 → auto-open fires again.
- Drill-into: with Compass open at cursor 19, click the `j.harper` node → the detail panel shows "viewed P-1042 (sensitive: true), no backing group membership"; click `P-1042` → "sensitive: true, Payroll-NG". Assert the detail panel `role="status"` updates.
- Graph content: at cursor 19, the traversal graph shows 5 nodes; the anomalous viewed edge (jade), the dashed missing memberof gap, and the teal backed edges are present (verified via the SVG line attributes / a11y labels).
- Auto-run to 19: from a fresh reset, run auto-run → at cursor 19 the Compass overlay opens (assert `overlay.componentId === 'compass'` once `cursor` reaches 19).
- Existing suites stay green (identity, landing, architecture; DataGerry + Airflow overlays + beckon).

**Human visual confirm** — the one step not done here (operator AFK): the jade anomalous edge, the dashed missing-edge gap, the teal backed access, the drill-into panel, and the climax auto-open moment. Flagged for the operator's return; the a11y + build + live-state checks stand in until then.

## Acceptance criteria mapping (from the ticket)

| Ticket criterion | How this design satisfies it |
|---|---|
| Traversal graph shows the finding as edges: anomalous viewed (jade), missing memberof (dashed gap), backed access (teal) + narrative | `compassTraversal` (Decision 3) derives the 5 edges (anomalous/ok/backed/gap/pending); `CompassOverlay` (Decision 4) renders jade/teal/dashed SVG edges + the 3-line narrative. |
| Climax: auto-opens at the finding step (the one auto-open) | The `useEffect` in `playground-client.tsx` (Decision 1) opens Compass at `cursor === 19`, the only auto-open. |
| Canonical action: drill into a node (j.harper → "…"; P-1042 → "…"); graph exploration = differentiated value | `CompassOverlay`'s clickable node chips + `useState` selected-node + detail panel (Decision 2) reading `compassTraversal().details`. |
| Reads the Atlas response (path + narrative) + Gold state; writes nothing | `compassTraversal` reads `state.gold` + `state.finding` only; no `tool-actions.ts` addition; no `store.step()` button. |
| Most faithful of the six; node-within-node containment deferred | `MOCK_TOOLS['compass'].fidelity` echoed in the footer; no node-within-node work in this ticket (carry-forward). |

## Out of scope (later tickets)

- Tools 13/14/16 (Overlook, Atlas+OPA, Superset) — parallel tickets; they drop into `TOOL_CONTENT`.
- Compass node-within-node containment (SPEC §6 carry-forward).
- The free-form sandbox (later, not the spine).