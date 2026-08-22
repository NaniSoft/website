# Tool-overlay framework + DataGerry mock (ticket 11)

> **Status:** approved design (2026-08-22). Branch: `feat/11-tool-overlay-framework-datagerry`.
> **Source ticket:** `.scratch/nanosoft-digital-twin/issues/11-tool-overlay-framework-datagerry.md`.
> **Spec basis:** `.scratch/nanosoft-digital-twin/SPEC.md` §4.8 (mock fidelity — the six full-UI components), §4.9 (teaching spine), §4.10 (reactive non-full-UI nodes), §6 (carry-forward: tool-overlay presentation). §2 (identity / motion).
> **Prerequisites (done on main):** 07 (`@nanisoft/architecture` model + seed + `MOCK_TOOLS` + `SCHEMA_REGISTRY`), 08 (`@nanisoft/identity` tokens + motion), 09 (static spine), 10 (reactive spine + Zustand store + Controls + Inspector + Narrative; controlled React Flow reading `deriveStatus(STEPS, cursor)`; `NodeChip` renders each node with `.spine-node-active` jade ripple; `openTool` flag exists on steps 11/19 but is **not consumed**).
> **Resolves:** SPEC §6 carry-forward "Tool-overlay presentation — modal vs inline-expand vs split-pane."

## Goal

Establish the **mocked-tool overlay framework** — one uniform chrome every later tool reuses, plus the open/close + beckon wiring off the existing ticket-10 spine — and ship the **first tool instance: DataGerry / Blueprint schema authoring**. DataGerry establishes the **one-code-path pattern**: the overlay's canonical action *is* a playbook step (the same `applyStep` auto-run uses), so single-stepping the learner and auto-running the twin literally share one mutate. This ticket resolves the §6 presentation carry-forward as **split-pane** and leaves a single registration point so tickets 12–16 drop in their tool content with no chrome rework.

## Decisions (locked during brainstorm)

1. **Presentation = split-pane.** Clicking a full-UI node splits the spine card into a slim left spine strip (re-fits, active node still visible/pulsing) + a right tool pane inside the same card; the Inspector rail stays. The learner sees the twin move *and* acts in the tool simultaneously — the strongest teaching affordance and the one that keeps the beckoning node in view. Locked for tickets 12–16. (Chosen over modal — hides the spine behind a scrim; over inline-expand — hides the spine entirely.)
2. **One code path = the overlay's canonical action *is* a playbook step (Approach 1).** The DataGerry "Add Sensitive: bool" button calls a store action that applies the beckoning step — the **same `applyStep`** auto-run uses. The mutate is a named pure function `authorSensitiveProductField(state)`; step 1's `apply` calls it. The overlay reads `state.schemaRegistry` to render; after the action `Sensitive` appears jade. The action is enabled only while the cursor sits at the beckoning step; once applied it is ghosted "already authored." (Rejected: a separate overlay mutate fn — two code paths, desyncs the teaching sequence; rejected: pure-presentational overlay over the unchanged wholesale-registry step 1 — couldn't show the *act* of adding the field.)
3. **`blankState().schemaRegistry` carries a drafted `Product` (id/name/owner_group) *without* `Sensitive`.** This makes step 1's honest act *adding the `Sensitive: bool` field* — the definitional hinge — rather than a wholesale registry replace. `SEED` / `SCHEMA_REGISTRY` (the full teaching state, with `Sensitive`) are unchanged; only the pre-pipeline `blankState` gains the drafted `Product`. After step 1 the registry equals `SCHEMA_REGISTRY.Product`, so the existing "cursor 1 authors the hinge" test still holds.
4. **The Bridge writing the `ext_product` table schema is modelled.** A new `bridgedTables: string[]` field (parallel to `bronze`/`silver`/`gold`) is empty in `blankState`, populated (`['ext_product']`) in `SEED` (the seed is the post-run teaching state), and pushed by step 3's `apply`. This makes "the Bridge writes the `ext_product` table schema" a real state write (the ticket's checkbox), and lets the DataGerry sync-status line + the Inspector reflect it honestly.
5. **Overlay chrome state is a tiny pure reducer in `@nanisoft/architecture`.** Matching the ticket-10 pattern (`applyStep`/`deriveStatus` are pure in the package, wrapped by the Zustand store), `overlayReducer` + `beckonToolId` live in the pure core and are vitest-tested in isolation; the Zustand store wraps them. The DataGerry sync-status line is a pure `dataGerrySyncStatus(state, cursor)` derivation, also pure + tested.
6. **Beckon = the active step's `openTool` node, rippling only while its overlay is closed.** Step 1 gains `openTool: 'blueprint'` (it currently has none — the DataGerry beckon is missing). The existing `.spine-node-active` jade ripple is refactored into a dedicated `.spine-node-beckon` class applied only to a full-UI node that is the current step's `openTool` *and* whose overlay is not open; a `.spine-node-open` class stops the ripple once the overlay is open (the node reads as "opened," not "inviting"). Non-tool active nodes keep the jade border without the ripple (they have no overlay to invite). Reduced-motion degrades to the static jade ring (content/state intact).

## Architecture & file layout

Boundary unchanged from ticket 10: **pure domain core in `packages/architecture`**, **thin Zustand + React shell in `apps/playground`**. Nothing in the core imports React, Next, Zustand, or React Flow.

**`packages/architecture` (pure + unit-tested):**
- `src/overlay.ts` *(new)* — `OverlayState`/`OverlayAction` types, `overlayReducer(state, action)`, `beckonToolId(steps, cursor)`, `dataGerrySyncStatus(state, cursor)`.
- `src/tool-actions.ts` *(new)* — `authorSensitiveProductField(state)`: the canonical-action mutate (idempotent; pushes `{name:'Sensitive', type:'bool'}` onto `state.schemaRegistry.Product.fields`).
- `src/dataset.ts` — add `bridgedTables: string[]` to `SeedDataset`; `createSeed()` sets `['ext_product']`.
- `src/playground-state.ts` — `blankState()` sets `schemaRegistry = { Product: { name:'Product', fields:[id,name,owner_group] } }` and `bridgedTables: []`; add `bridgedTables` to `STATE_FIELDS` + import validation (must be an array).
- `src/playbook.ts` — step 1 `apply` → `authorSensitiveProductField(s)`; step 1 gains `openTool: 'blueprint'`; step 3 `apply` → push `'ext_product'` into `s.bridgedTables` (idempotent); step 1 `desc` retuned to "adds the `Sensitive: bool` field to the drafted `Product` ObjectType."
- `src/index.ts` — re-export the new overlay/tool-action symbols + `OverlayState`/`OverlayAction` types.
- `tests/overlay.test.ts` *(new)* + `tests/playground-state.test.ts` / `tests/playbook.test.ts` *(extended)*.

**`apps/playground` (reactive shell):**
- `app/_store/usePlayground.ts` — gains `overlay: OverlayState`, `openTool(id)`, `closeTool()`; `reset`/`importJson` clear the overlay; the `window.__playground` dev hook already exposes the store (so overlay state is live-inspectable).
- `app/_overlay/ToolOverlay.tsx` *(new)* — the uniform chrome shell (title bar = codename + real-name subline + "mocked" badge + close; `role="dialog"`, `aria-label`, Esc-to-close, focus trap) that looks up `TOOL_CONTENT[componentId]` and renders the tool's body.
- `app/_overlay/DataGerryOverlay.tsx` *(new)* — the DataGerry mock body (ObjectType list + fields pane + "Add Sensitive: bool" action + sync-status line).
- `app/_overlay/tool-content.ts` *(new)* — `TOOL_CONTENT: Record<string, () => JSX.Element>` registry; DataGerry is the first entry. **This is the single registration point for tickets 12–16.**
- `app/_spine/NodeChip.tsx` — full-UI nodes become clickable (call `openTool(component.id)`); chip data gains `beckon` + `open` booleans; `.spine-node-beckon` / `.spine-node-open` classes.
- `app/_spine/Spine.tsx` — compute `beckonToolId(STEPS, cursor)`; pass `beckon`/`open` into node data; `onPaneClick` → `closeTool()`; re-`fitView` when the pane splits/unsplits (via `useReactFlow().fitView()` in an effect keyed on overlay state, inside a `ReactFlowProvider`).
- `app/playground-client.tsx` — the spine card becomes a CSS grid that switches columns on overlay state: `1fr` (closed) → `minmax(280px, 0.6fr) minmax(360px, 0.4fr)` (spine | tool); the tool pane renders `<ToolOverlay/>`; Inspector rail + Narrative + Controls unchanged; the ≤980px stack rule extends to the tool pane.
- `app/globals.css` — refactor `.spine-node-active` (jade border, no animation) + add `.spine-node-beckon` (the ripple, from the identity `ripple` variant) + `.spine-node-open` (no ripple); reduced-motion guard already global.

No new playground dependency. React Flow's `useReactFlow`/`ReactFlowProvider` are already available from `@xyflow/react`.

## The overlay framework (chrome + open/close + beckon)

**Pure chrome reducer** (`src/overlay.ts`):

```ts
type OverlayState = { componentId: string; openedAtCursor: number } | null;
type OverlayAction =
  | { type: 'open'; componentId: string; cursor: number }
  | { type: 'close' }
  | { type: 'reset' };
function overlayReducer(state: OverlayState, action: OverlayAction): OverlayState
```

`openedAtCursor` records the cursor at open time so a tool knows whether its canonical action is still live (cursor hasn't advanced past the beckoning step) or already done. The store wraps it: `openTool(id)` → `set({ overlay: overlayReducer(get().overlay, { type:'open', componentId:id, cursor:get().state.cursor }) })`; `closeTool()` → `{ type:'close' }`; `reset`/`importJson` → `{ type:'reset' }`.

**Beckon derivation** (`beckonToolId(steps, cursor): string | null`): returns the active step's `openTool` (the step at `cursor-1` when `0 < cursor < steps.length`), else null. The spine adds `.spine-node-beckon` to exactly that node **only when its overlay is not open** (`beckonToolId === node.id && overlay?.componentId !== node.id`); `.spine-node-open` when it is open. Motion = the identity `ripple` variant (jade radial pulse; `withReducedMotion` → static jade ring). This is the invite-to-click; overlays never auto-open mid-run (no stacking). (Compass auto-opens at the finding — ticket 15, not this one; Compass's existing `openTool` flags stay.)

**Uniform chrome** (`ToolOverlay.tsx`): one shell, one `content` slot per tool.
- **Title bar**: codename (e.g. `Blueprint`) + real-name subline (`DataGerry`) + a **"mocked" badge** (pill, `surface` tokens, never jade) + close `[×]`. Structured-echo fidelity = the real tool's *information shape* in nanisoft tokens, not its colors/fonts/icons.
- **Body**: `TOOL_CONTENT[componentId]` (DataGerry's editor here; tickets 12–16 drop in theirs).
- **A11y**: `role="dialog"`, `aria-label` = codename, focus trap, Esc closes, close returns focus to the clicked node. Unknown / non-full-UI ids render nothing.

**Single registration point** (`tool-content.ts`): `TOOL_CONTENT: Record<string, () => JSX.Element>` (componentId → content component). `ToolOverlay` reads `state.overlay.componentId` and renders `TOOL_CONTENT[id]`. DataGerry is the first entry; tickets 12–16 add theirs here with no chrome rework.

**Split-pane wiring** (`playground-client.tsx` + `Spine.tsx`): the spine card is a CSS grid that switches columns on overlay state — `1fr` closed, `minmax(280px, 0.6fr) minmax(360px, 0.4fr)` open (spine | tool). React Flow re-fits on the resize: `Spine` wraps in `ReactFlowProvider` and an effect calls `useReactFlow().fitView({ padding: 0.2 })` when overlay opens/closes so the slimmed spine keeps the active node in view. The Inspector rail stays a third column as today; below 980px the tool pane stacks under the spine. Clicking a full-UI node → `openTool(node.id)`; clicking empty canvas (`onPaneClick`) or the close button → `closeTool()`. Only `fullUi: true` components are clickable (the model already flags them).

## The one-code-path canonical action

**`authorSensitiveProductField(state)`** (`src/tool-actions.ts`): idempotently pushes `{ name: 'Sensitive', type: 'bool' }` onto `state.schemaRegistry.Product.fields` (creates the `Product` ObjectType defensively if absent). Step 1's `apply` calls it. Auto-run's step 1 and the overlay's "Add Sensitive: bool" button therefore run the *same* mutate — one code path.

**The overlay action = a playbook step.** The DataGerry "Add Sensitive: bool" button calls **`store.step()`** — the same action the auto-run interval calls, which applies `STEPS[cursor]` via `applyStep`. There is no separate "overlay mutate" code path; the guard is the button's enabled/disabled state, not a second function. The button is enabled only when the cursor is at the beckoning step **and** `Sensitive` is not yet in the registry (`cursor === step1.n - 1` and `!hasSensitive`); clicking advances the cursor to 1, running `authorSensitiveProductField`. Once `Sensitive` is present the button is ghosted "already authored." Opening the overlay later (post-run, or mid-run at a later cursor) shows the authored result with the action disabled — the act is done.

**Why this is the one code path:** auto-run (`setInterval(step)`) and the overlay's button both reduce to `applyStep(state, STEPS[cursor])`. There is no second mutate. The Inspector's Schema tab updates from the same state the overlay just wrote — the learner sees the field land in the twin's registry as they author it.

## DataGerry mock content

`DataGerryOverlay.tsx` — the schema/type editor, structured-echo of DataGerry's info shape in nanisoft tokens:
- **Left list — ObjectTypes**: just `Product` (selected). Fidelity: one ObjectType (DataGerry's Section/Relation/Granularity richness is hidden — noted in a muted footer).
- **Right pane — fields**: `id: string`, `name: string`, `owner_group: string`, and `Sensitive: bool` rendered **jade** when present. Pre-action, a ghosted "＋ Add Sensitive: bool" affordance; post-action, the field appears jade in the list. Only `Sensitive` is interactive.
- **Canonical action button**: "Add Sensitive: bool" — a pill, jade-accented when live, ghosted "already authored" when `Sensitive` is already in the registry. Clicking performs step 1 (the one-code-path mutate). `font.data` for field names/types; `font.voice` for the button.
- **Sync-status line**: `Bridge → Bedrock (ext_product) → Atlas (SchemaRegistry)` with jade checkmarks as each stage completes, driven by the pure `dataGerrySyncStatus(state, cursor)`:
  - `authored` — `state.schemaRegistry.Product.fields` contains `Sensitive` (state-derived; step 1).
  - `bedrock` — `state.bridgedTables.includes('ext_product')` (state-derived; step 3).
  - `atlas` — `cursor >= 4` (cursor-derived — Atlas acks the cache refresh at step 4; no separate state slot because the registry already *is* Atlas's cache).
  - Stages light via the `settle` motion (content arriving); reduced-motion → static checkmarks.
- **Fidelity footer**: a muted "mocked · schema authoring surface only" line (the hidden richness).
- **Tokens**: `surface.light` panes, `radius.inner`, `font.data` for fields/labels. Jade only for the live `Sensitive` field, the active sync stage, and the enabled action's accent. No pure white/black.

## State model changes (pure core)

`SeedDataset` gains `bridgedTables: string[]` (parallel to `bronze`/`silver`/`gold`):
- `SEED.bridgedTables = ['ext_product']` (the seed is the post-run teaching state — the Bridge has already written the table).
- `blankState().bridgedTables = []` (pre-pipeline).
- `createSeed()` sets it.
- `STATE_FIELDS` adds `'bridgedTables'`; `importState` requires it to be an array.

`blankState().schemaRegistry` changes from `{}` to `{ Product: { name: 'Product', fields: [ {name:'id',type:'string'}, {name:'name',type:'string'}, {name:'owner_group',type:'string'} ] } }` (drafted `Product`, no `Sensitive`). `SEED` / `SCHEMA_REGISTRY` unchanged.

Step table changes (only steps 1 and 3):

| # | Phase | Actor | Edge | apply (state change) | openTool |
|---|---|---|---|---|---|
| 1 | Schema | blueprint | blueprint→bridge | `authorSensitiveProductField(s)` — pushes `Sensitive: bool` onto `Product.fields` (the hinge) | `'blueprint'` *(new)* |
| 3 | Schema | bridge | bridge→bedrock | `s.bridgedTables.push('ext_product')` (idempotent) — the Bridge writes the `ext_product` table schema | — |

All other steps unchanged. After step 1, `state.schemaRegistry.Product.fields` equals `SCHEMA_REGISTRY.Product.fields` (4 fields), so the existing "cursor 1 authors the hinge" test still passes.

## Testing + verification

**Pure core — vitest in `packages/architecture`** (TDD; extends the existing suite; `environment: node`, `tests/**/*.test.ts`):
- `overlay.test.ts` *(new)*:
  - `overlayReducer`: `null` initially; `open` records `componentId` + `openedAtCursor`; `close` → `null`; `reset` → `null`; `open` over an existing overlay replaces it (no stacking).
  - `beckonToolId(STEPS, cursor)`: cursor 0 → null; cursor 1 → `'blueprint'`; cursor 11 → `'compass'`; cursor 22 → null.
  - `authorSensitiveProductField`: on a drafted `Product` (3 fields) adds `Sensitive: bool` (4 fields); idempotent (second call no-op); creates `Product` defensively if absent.
  - `dataGerrySyncStatus`: blank state → none done; after step 1 → `authored`; after step 3 → `authored + bedrock`; at cursor 4 → all three; at cursor 22 → all three.
- `playground-state.test.ts` *(extended)*: update the `blankState().schemaRegistry` assertion to the drafted-`Product` shape; assert `blankState().bridgedTables === []`; `SEED.bridgedTables === ['ext_product']`; export→import roundtrip still identical (now includes `bridgedTables`); `importState` rejects a state missing `bridgedTables`.
- `playbook.test.ts` *(extended)*: cursor 1 still authors `Sensitive: bool`; cursor 3 sets `bridgedTables` to include `ext_product`; step 1 carries `openTool: 'blueprint'`.

**Playground render verification (no vision — the project's "resolved without vision" norm; Playwright is not in the repo, so the Playwright MCP browser tools drive the running dev server):**
- `pnpm -r build` green; `next dev` on :3001; console clean.
- Playwright MCP a11y snapshot: click the `Blueprint` node → `role="dialog"` with `aria-label="Blueprint"`, the "mocked" badge text, the `Product` ObjectType + fields list; the "Add Sensitive: bool" button is enabled at cursor 0.
- Click "Add Sensitive: bool" → `Sensitive` appears in the field list (jade) + the Inspector Schema tab shows `Product.Sensitive: bool`; `window.__playground.getState().state.schemaRegistry.Product.fields` now includes `Sensitive` (live JS state); the sync-status line shows `authored`.
- Step forward to cursor 3 → sync-status shows `Bedrock (ext_product)`; `window.__playground` state shows `bridgedTables: ['ext_product']`.
- Esc closes the overlay; the beckon class is present on the active `blueprint` node before open and absent after open.
- `prefers-reduced-motion` → no ripple animation, state still advances.
- Existing suites stay green (identity, landing, architecture).

**Human visual confirm** — the one step not done here (operator AFK): the split-pane layout, the jade beckon ripple on the active tool node, the `Sensitive` field landing jade, and the sync-status line animating. Flagged for the operator's return; the a11y + build + live-state checks above stand in until then.

## Acceptance criteria mapping (from the ticket)

| Ticket criterion | How this design satisfies it |
|---|---|
| Overlay chrome: title bar = codename + "mocked" badge; nanisoft tokens; structured-echo fidelity; one uniform chrome every later tool reuses | `ToolOverlay.tsx` shell (codename + real-name + "mocked" badge + close) + `TOOL_CONTENT` registry; structured-echo = info shape in nanisoft tokens. |
| Auto-run = beckon: active tool's node pulses jade; overlays do not auto-open mid-run; single-step pauses at the beckoning node | `beckonToolId` + `.spine-node-beckon` ripple on the active step's `openTool` node (step 1 gains `openTool:'blueprint'`); overlays never auto-open; single-step pauses at the beckoning node (cursor at step 1). |
| DataGerry mock: schema/type editor — left ObjectTypes (`Product`), right fields (`id`,`name`,`owner_group` + `Sensitive` jade); sync-status line animates Bridge → Bedrock (`ext_product`) → Atlas | `DataGerryOverlay.tsx`; `dataGerrySyncStatus` drives the three-stage sync line. |
| Canonical action (single-step): add `Sensitive: bool` to `Product` | `authorSensitiveProductField`; the overlay button performs step 1. |
| One code path: auto-run performs the same mutate; state writes `SchemaRegistry[Product].fields += {Sensitive:bool}` and the Bridge writes the `ext_product` table schema; reads none | Step 1 `apply` = `authorSensitiveProductField`; step 3 `apply` pushes `ext_product` into `bridgedTables`; auto-run and the overlay button share `applyStep`. |
| Clicking the DataGerry full-UI node opens the overlay; presentation picked + noted | Split-pane (Decision 1); full-UI `blueprint` node is clickable → `openTool`. |

## Out of scope (later tickets)

- Tools 12–16 (Trailhead, Overlook, Atlas+OPA, Compass, Superset) — this ticket ships the framework + DataGerry only; they drop into `TOOL_CONTENT`.
- Compass auto-open at the finding (ticket 15) — this ticket only consumes `openTool` for the beckon; Compass's auto-open stays a ticket-15 concern.
- The free-form sandbox (later, not the spine).