# Lakehouse state + playbook engine + reactive spine (ticket 10)

> **Status:** approved design (2026-08-22). Branch: `feat/10-lakehouse-state-playbook-engine`.
> **Source ticket:** `.scratch/nanosoft-digital-twin/issues/10-lakehouse-state-playbook-engine.md`.
> **Spec basis:** `.scratch/nanosoft-digital-twin/SPEC.md` §4.3 (spine), §4.4 (playbook engine), §4.5 (shared in-browser state), §4.6 (seeded dataset), §4.7 (flagship 22-step), §4.8 (mock fidelity — auto-run = beckon), §2 (identity / motion).
> **Prerequisites (done on main):** 07 (`@nanisoft/architecture` model + seed + `MOCK_TOOLS`), 08 (`@nanisoft/identity` tokens + motion), 09 (static spine — Server `page.tsx` → `'use client'` `playground-client.tsx` → `dynamic(ssr:false)` `Spine.tsx`; pure `buildSpineGraph()` in `app/_spine/spine-graph.ts`).

## Goal

The simulator's heart: a shared in-browser lakehouse state that evolves under a declarative playbook engine, with the 09 static spine made reactive to each step and an inspector showing state after every step. The flagship playbook (Sensitive Product View Audit, 22 steps) runs end-to-end on the spine. **No tool overlays** — those are tickets 11–16; ticket 10 only records each step's `openTool` flag and does the beckon (node ripple).

## Decisions (locked during brainstorm)

1. **Reset / seed semantics = blank-slate replay.** At rest and on Reset the lakehouse is empty (pre-pipeline). Run/Step builds Bronze → Silver → Gold from step 1, reaching the teaching state at step 10 and the finding at step 17. This matches the prototype and SPEC §4.7 ("steps 1–10 produce the teaching state"). Ticket 16's Superset sandbox will read `SEED.gold` directly (the architecture conformed Gold), independent of the live run state — so it is explorable at rest regardless of cursor. (Chosen over "seed-at-rest" options because §4.7 explicitly frames steps 1–10 as *producing* the teaching state.)
2. **Architecture = Approach A.** The pure domain core (playbook, state shape, reducer, `deriveStatus`, export/import) lives in `packages/architecture` — framework-agnostic, unit-tested with vitest. `apps/playground` holds only the thin Zustand shell + reactive React/React Flow rendering. The mutate fns reuse the package's existing `conformToGold()` / `detectAnomalies()` / `getFinding()`.
3. **Forge is the step-10 actor.** The prototype had a separate "Scoring" node, but the architecture model has only `forge` in the transform stage (Forge = Spark + dbt + scoring, per the mermaid's single "writes Gold" beat). Steps 9 and 10 both use `forge` as actor (the node lights twice) — keeps 22 steps per SPEC §4.7 without inventing a node the model doesn't have.
4. **Motion = CSS keyframes generated from `@nanisoft/identity`'s `motion` variants** (no `motion` library this ticket). The variant objects are plain data "usable as CSS @keyframes source" (per `motion.ts`); `ripple` (active node) and `traverse` (active edge) become two `@keyframes` in `globals.css` driven by a `status` class. `prefers-reduced-motion` → `withReducedMotion(variant)` endState (static jade ring / static jade dashed edge; state intact, just still). `motion` can be added later if a ticket needs orchestrated enter/exit transitions.
5. **Seed is authoritative over the prototype.** The prototype used `m.okafor →viewed→ P-2014`; the architecture seed has **both** view-logs on `P-1042` (`VL-001 j.harper→P-1042`, `VL-002 m.okafor→P-1042`). m.okafor's view is `ok` (backed by `memberof G-SR`); j.harper's is the anomaly. Gold is still 5 nodes / 4 edges — both `viewed` edges point at P-1042. The build follows the seed.

## Architecture & file layout

Boundary: **pure domain core in `packages/architecture`**, **thin Zustand + React shell in `apps/playground`**. Nothing in the core imports React, Next, Zustand, or React Flow.

**`packages/architecture` (new, pure + unit-tested):**
- `src/playbook.ts` — `PlaybookStep` type + the 22-step flagship `SENSITIVE_PRODUCT_VIEW_AUDIT: PlaybookStep[]`.
- `src/playground-state.ts` — `PlaygroundState` shape, `blankState()`, `applyStep(state, step)`, `reduceToCursor(target)`, `exportState(s)` / `importState(json)`, `deriveStatus(cursor)`.
- `tests/playbook.test.ts` + `tests/playground-state.test.ts` — extend the existing architecture vitest suite.

**`apps/playground` (reactive shell):**
- `app/_spine/spine-graph.ts` — **kept** from 09. **Plus the 09 carry-forward fix:** replace the hardcoded `['anchor','conveyor','openbao']` at `:78,:169` with `COMPONENTS.filter(c => c.kind === 'platform' && c.id !== 'watchtower')` (same derivation pattern 09 uses for `OBSERVER_COMPONENTS`).
- `app/_spine/Spine.tsx` — becomes **controlled**: reads `cursor` from the Zustand store, calls `deriveStatus(cursor)`, merges status into the graph before React Flow.
- `app/_spine/NodeChip.tsx` / `PhaseBand.tsx` — gain a `status` prop.
- `app/_spine/Narrative.tsx` — current-step narrative + step list + progress bar.
- `app/_store/usePlayground.ts` — Zustand store (thin wrapper over the pure core).
- `app/_inspector/Inspector.tsx` — Bronze/Silver/Gold/Schema/Audit tabs + counts.
- `app/_controls/Controls.tsx` — Run/Pause, Step, Reset, Export, Import.
- `app/playground-client.tsx` — extends to compose spine + narrative + controls + inspector (2-column layout).
- `app/globals.css` — two `@keyframes` (`ripple`, `traverse`) from the identity variants + reduced-motion guards.

New playground dependency: `zustand` (SPEC §4.1 validated). No `motion` library this ticket.

## State model (pure core)

`PlaygroundState` extends architecture's existing `SeedDataset` so the conform/detect/find functions are called directly (no adapter):

```ts
type PlaygroundState = SeedDataset & {
  finding: Finding | null;  // step 17 sets
  cursor:  number;          // 0..22
};
```

i.e. the `SeedDataset` fields are all present at top level — `products`, `users`, `groups`, `groupMemberships`, `viewLogs` (the fixed source rows ingestion reads), `bronze`, `silver`, `gold`, `schemaRegistry`, `auditLog` (the mutable lakehouse) — plus `finding` and `cursor`. `conformToGold(state)`, `getFinding(state)`, and `detectAnomalies(state.gold, state)` all accept a `PlaygroundState` directly (it is a structural superset of `SeedDataset`).

`blankState()` = the `SEED` source rows (`products`/`users`/`groups`/`groupMemberships`/`viewLogs`), lakehouse/registry/audit empty (`bronze`/`silver` as empty arrays, `gold: {nodes:[],edges:[]}`, `schemaRegistry: {}`, `auditLog: []`), `finding: null`, `cursor: 0`.

**Runner:** `applyStep(state, step)` returns a new state via `structuredClone(state)` → `step.apply(next)` → `next.cursor++` (immutability at the boundary; `apply` fns mutate the clone). `reduceToCursor(target)` replays from `blankState()` to a cursor — used by `reset` (target 0) and `import` (target = imported cursor).

**`deriveStatus(cursor)`** (pure): `activeStep = STEPS[cursor-1]` → `{ activeNodeId, activeEdge: {from,to}|null, doneNodeIds: Set, doneEdgeIds: Set, activePhase }`. At `cursor === 22`: no active, all done.

**`exportState(s)`** = `JSON.stringify(state)`; **`importState(json)`** validates the shape (has the flat `SeedDataset` fields — `products`/`users`/`groups`/`groupMemberships`/`viewLogs`/`bronze`/`silver`/`gold`/`schemaRegistry`/`auditLog` — plus `finding`/`cursor`) and returns the parsed state, or throws a typed error the store surfaces as an "invalid state" message. Import resumes at the imported `cursor` (not "jump to end" as the prototype did).

## The 22-step flagship

Mirrored from the prototype, adapted to architecture ids + reuse of conform/detect. Each step: `{ n, phase, actor, edge: [from,to]|null, title, desc, apply, openTool?, final? }`.

| # | Phase | Actor | Edge | apply (state change) |
|---|---|---|---|---|
| 1 | Schema | blueprint | blueprint→bridge | `schemaRegistry.Product = SCHEMA_REGISTRY.Product` (the hinge) |
| 2 | Schema | bridge | blueprint→bridge | — (narrate) |
| 3 | Schema | bridge | bridge→bedrock | bronze shell created |
| 4 | Schema | bridge | bridge→atlas | — (SchemaRegistry cache refresh) |
| 5 | Ingestion | airbyte | sql-fleet→airbyte | — |
| 6 | Ingestion | airbyte | active-directory→airbyte | — |
| 7 | Ingestion | airbyte | airbyte→forge | `bronze = { products: state.products, viewLogs: state.viewLogs }` |
| 8 | Transform | forge | forge→bedrock | — (narrate "reads cached schema") |
| 9 | Transform | forge | forge→bedrock | `silver` conformed |
| 10 | Transform | forge | forge→bedrock | `gold = conformToGold(state)` → 5 nodes / 4 edges |
| 11 | Investigation | compass | compass→atlas | — (`openTool: compass`) |
| 12 | Investigation | atlas | atlas→opa | — |
| 13 | Investigation | opa | opa→atlas | — |
| 14 | Investigation | atlas | — | `auditLog.push({allow})` |
| 15 | Investigation | atlas | atlas→overlook | — |
| 16 | Investigation | overlook | overlook→bedrock | — |
| 17 | Investigation | overlook | overlook→atlas | `finding = getFinding(state)`; mark gold edges `anomalous`/`ok` via `detectAnomalies` |
| 18 | Investigation | atlas | — | — (atlas→compass is not in EDGES; narrate-only) |
| 19 | Investigation | compass | — | — (`openTool: compass`, `final`) |
| 20 | Investigation | compass | — | `auditLog.push({result})` |
| 21 | Investigation | superset | superset→overlook | — (the sandbox hint) |
| 22 | Investigation | watchtower | — | `auditLog.push({run complete})` |

The `apply` fns reuse `conformToGold` (step 10), `getFinding` + `detectAnomalies` (step 17) — flagship is thin orchestration over functions that already exist and are tested.

**Edge verification note:** every non-null `edge` above is a real pair in `packages/architecture`'s `EDGES` (a unit test asserts this). The table therefore diverges from the raw mermaid where the mermaid's data-flow direction has no matching architecture edge: step 7 lights `airbyte→forge` (the "raw → Bronze" edge) rather than a non-existent `airbyte→bedrock`; steps 8/9/10 share `forge→bedrock` (no `bedrock→forge` edge exists — Forge is the actor for read *and* write); step 15 `atlas→overlook`, step 16 `overlook→bedrock` (directions that exist, vs the mermaid's `overlook→atlas`/`bedrock→overlook` which do not); step 18 is narrate-only (`atlas→compass` is not in `EDGES` — only `compass→atlas` is).

## Reactivity on the spine

09's spine becomes **controlled**: `Spine.tsx` reads `cursor` from the store, calls `deriveStatus(cursor)`, and merges status into `buildSpineGraph()` nodes/edges.

**Node status** (`NodeChip` gains `status: 'idle' | 'active' | 'done'`):
- **idle** — 09's chip unchanged (boneElev fill, petrolSoft border).
- **active** — jade ring + **ripple** pulse (the beckon). Jade locked to active only. Full-UI tool nodes ripple when active = SPEC §4.8 "auto-run = beckon."
- **done** — teal ring.

**Edge status** (merged onto `SpineEdge`):
- **idle** — 09's `petrolSoft` (solid) / `petrolTint` (dotted).
- **active** — jade stroke + `strokeDasharray: '6 6'` + animated `strokeDashoffset` (flowing wavefront = traverse).
- **done** — teal stroke, solid.

**Phase band** (`PhaseBand` gains `status`): active phase → jade highlight; done phases → teal; idle → 09's sunken.

**Motion:** `@keyframes ripple` + `@keyframes traverse` in `globals.css`, generated from the identity `motion` variants, driven by a `status` class. `prefers-reduced-motion` → static endState (jade ring without pulse; jade dashed edge without flow). No `motion` library.

**09 carry-forward fix:** derive the platform-band node ids from the model (`COMPONENTS.filter(c => c.kind === 'platform' && c.id !== 'watchtower')`) instead of the hardcoded list at `spine-graph.ts:78,:169`.

**Controls** (`Controls.tsx`): Run/Pause, Step, Reset, Export, Import. `STEP_PACE_MS = 1100` (tunable). Run = `setInterval(step, STEP_PACE_MS)`; Pause clears it; at cursor 22 Run auto-stops. Reset = `reduceToCursor(0)`.

## Inspector + narrative + layout

**Inspector** (`app/_inspector/Inspector.tsx`): five tabs — Bronze / Silver / Gold / Schema / Audit — plus a counts row. Token-styled on bone (boneElev card, sunken tab strip, ink text, JetBrains Mono for all data). Jade is reserved for the live step indicator (the narrative "now" marker), never for a count; counts use ink + teal. Each tab renders the current state slice:
- Bronze → tables + row counts; Silver → conformed tables + `sensitive` flag; Gold → `graph_nodes` + `graph_edges` (anomalous edge flagged, `ok` edges teal); Schema → `SchemaRegistry` types + fields (`Sensitive: bool` jade-tagged as the hinge); Audit → `auditLog` entries. Empty states: "Bronze empty — no tables yet" etc. Updates after every step.

**Narrative** (`app/_spine/Narrative.tsx`): current step number/phase, title, desc, + a scrollable step list (done = teal, now = jade, pending = muted) that auto-scrolls the "now" row into view. A progress bar (jade fill) tracks `cursor / 22`.

**Layout** (extend `playground-client.tsx`): the prototype-validated **2-column grid** on desktop — left = spine card (phase band + narrative + controls beneath), right = inspector card. Stacks to one column under ~980px. 09's header (title + version stamps + `/tokens`) and footer stay; the "static preview" subtitle updates to reflect the live engine. Spine card keeps its `70vh` box; inspector gets its own scrollable card.

## Testing + verification

**Pure core — vitest in `packages/architecture`** (TDD; extends the existing 26-test suite):
- `playbook.test.ts` — flagship has exactly 22 steps; every `actor` is a real component id; every `edge` (where present) is a real `EDGES` pair; phases progress Schema→Ingestion→Transform→Investigation; each `apply` is a pure function.
- `playground-state.test.ts`:
  - `blankState()` → lakehouse/registry/audit empty, sources present, cursor 0.
  - `reduceToCursor(10)` → Gold 5 nodes / 4 edges.
  - `reduceToCursor(17)` → `finding` set; `j.harper →viewed→ P-1042` anomalous, `m.okafor →viewed→ P-1042` ok.
  - `reduceToCursor(22)` → `auditLog` 3 entries (steps 14/20/22), finding set, all edges marked, cursor 22.
  - `export → import` roundtrips identically (cursor preserved); `import` rejects malformed shapes.
  - `deriveStatus` at cursor 0 (no active), 10 (active=forge, edge forge→bedrock), 22 (all done, no active).

**Playground render verification (no vision):** `pnpm -r build` green; `next dev` on :3001; console clean; Playwright a11y snapshot asserts the controls (Run/Step/Reset/Export/Import) + inspector tabs (Bronze/Silver/Gold/Schema/Audit) render; after a Run, the Gold tab shows 5 nodes / 4 edges + the anomalous flag (via a11y/live state); `prefers-reduced-motion` → no animations, state still advances. Human visual confirm for the reactivity (jade active node + flowing edge, teal done, phase band tracking). Existing suites stay green (identity 33/33, landing 19/19).

## Acceptance criteria mapping (from the ticket)

| Ticket criterion | How this design satisfies it |
|---|---|
| Zustand store holds Bronze/Silver/Gold + SchemaRegistry + audit_log; session-only + export/import + reset-to-seed | `usePlayground.ts` Zustand store over `PlaygroundState`; `blankState()`/`reduceToCursor(0)` = reset; `exportState`/`importState`; session-only (no persistence). |
| Declarative playbook engine: use-case = ordered phase-steps with actor + active edge + narrative + mutate fn; flagship = 22-step mirrored from the mermaid | `SENSITIVE_PRODUCT_VIEW_AUDIT` in `playbook.ts`; 22-step table above; `apply` mutate fns; mirrors `TrueAccess_Schema_to_Visualization_Sequence.mermaid`. |
| Controls: auto-run + single-step + reset; pace ~1.1s/step (tunable) | `Controls.tsx` Run/Pause/Step/Reset; `STEP_PACE_MS = 1100`. |
| Spine reacts: actor node jade + active edge animates; done edges teal; phase band tracks active phase | `deriveStatus` + controlled `Spine.tsx` + `NodeChip`/`PhaseBand`/edge status; jade active / teal done; phase band tracking. |
| Inspector shows state after every step | `Inspector.tsx` reads the store; updates every step. |

## Out of scope (later tickets)

- Tool overlays / mock fidelity (tickets 11–16). Ticket 10 records `openTool` + does the beckon only.
- The free-form sandbox (later, not the spine).
- Compass auto-open UI (ticket 15); ticket 10 records the flag.