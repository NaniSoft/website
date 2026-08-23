# Code audit — packages/* + apps/playground vs map.md claims ([06]–[17])

Date: 2026-08-23 · Auditor scope: `packages/architecture`, `packages/identity`, `apps/playground`.
Method: current working tree only (git hashes ignored per audit brief); primary-source verification plus the two mandated runs. Read-only except this file.

**Command results (exact tails at bottom):**
- `pnpm --filter @nanisoft/architecture test` → **Test Files 5 passed (5), Tests 122 passed (122)** — matches the map's integration claim.
- `pnpm --filter playground build` → **exit 0** (Next.js 16.3.1 Turbopack, routes `/`, `/_not-found`, `/icon.svg`, `/tokens`).
- Bonus: `pnpm --filter @nanisoft/identity test` → **Tests 33 passed (33)** — matches map [08]'s "identity suite 33/33".

---

## [06] Monorepo scaffold — **VERDICT: complete**

- `pnpm-workspace.yaml` lists `'apps/*'` and `'packages/*'` under `packages:` (verified by reading the file).
- `apps/landing/`, `apps/playground/`, `packages/architecture/`, `packages/identity/` all exist (directory listing).
- Playground runs on :3001 (`apps/playground/package.json` scripts `dev`/`start` use `-p 3001`); package name is **`@nanisoft/playground`**.
- Note: landing build/vitest claims are outside this audit's scope (owned by the concurrent landing/deploy auditor).

## [07] Architecture model + seeded dataset — **VERDICT: complete**

- Model: `packages/architecture/src/components.ts` — `PHASES` = exactly 4 (schema/ingestion/transform/investigation, lines 21–50); `COMPONENTS` (60–291); `EDGES` directed with solid/dotted styles (304–351); `spineComponentIds()` helper.
- Seed counts: `src/dataset.ts` — `PRODUCTS` 2 (51–54), `USERS` 4 (61–66), `GROUPS` 2 (56–59), `VIEW_LOGS` 2 (78–81).
- Anomaly exact as claimed: `GROUP_MEMBERSHIPS` contains only m.okafor + a.chen (73–76), so j.harper's `viewed→P-1042` (VL-001, line 79) has no backing membership; P-1042 = **Payroll-NG**, `ownerGroup: 'G-SR'`, `sensitive: true` (line 52). `conformToGold` yields exactly 5 nodes / 4 edges (doc comment 204–208); `detectAnomalies` (258–269) encodes sensitive-view-without-membership.
- Six mock-tool specs: `src/tools.ts` `MOCK_TOOLS` = blueprint(DataGerry), trailhead(Airflow), overlook(Trino), atlas(+OPA), compass, superset (lines 39–124) + `MOCK_TOOL_BY_COMPONENT`.
- All exports present in `src/index.ts` (model 19–40, dataset 43–74, tools 77–78, engine 81–95, tool-actions 98, overlay 101–126).

## [08] nanisoft identity system — **VERDICT: complete**

- Tokens (`packages/identity/src/tokens.ts`): petrol family + bone family base (30–47); `role.secondary = teal #2A8C97`, `role.accent = jade #14A77A` with the jade-as-only-accent invariant enforced structurally (jade absent from every `surface.*` role, comment 49–53 + surface 65–82); shape lock `radius.card=20 / inner=12 / pill=9999` (89–93); `font.voice` Satoshi + `font.data` JetBrains Mono (114–119); `easing = cubic-bezier(.32,.72,0,1)` (123).
- Motion (`src/motion.ts`): exactly four principles breathe/traverse/ripple/settle, all transform/opacity-only, all on the brand easing (48–98); `withReducedMotion(variant)` returns the static visible `endState` — never touches display/visibility/content (109–116).
- Marks (`src/wordmark.ts`): W1 wordmark — Satoshi 700 "nanisoft", native i-dot masked, ringed graph node + single trailing **jade** link (jade appears exactly once, lines 32–53); W3 monogram — petrol tile + bone node-and-flow, **no jade** (63–79).
- Favicon: `apps/playground/app/icon.svg` is the generated W3 monogram (header comment cites `monogramSvg(32)`; values match).
- Fonts wired in the playground: `app/layout.tsx` — Satoshi via `next/font/local` (variable 300–900 + italic, license file present in `app/fonts/`) into `--font-satoshi`; JetBrains Mono via `next/font/google` into `--font-mono` (lines 10–25).
- Tests: identity suite 33/33 green (run above).

## [09] Playground spine static — **VERDICT: complete**

- Chain confirmed: server `app/page.tsx` renders `PlaygroundClient`; `app/playground-client.tsx:1` is `'use client'`; `dynamic(() => import('./_spine/Spine'), { ssr:false })` lives inside the client wrapper (lines 14–18, with the explicit comment that ssr:false never sits in a Server Component).
- Pure derivation: `app/_spine/spine-graph.ts` `buildSpineGraph()` (146–224) builds nodes/edges/bands entirely from imported model data (`COMPONENTS`, `EDGES`, `PHASES`, `PIPELINE_SPINE`, `STAGE_COMPONENTS`, `OBSERVER_COMPONENTS`) — labels, edges, phase bands all model-derived; geometry constants are the only literals.
- **Carry-forward cleared:** the old hardcoded `['anchor','conveyor','openbao']` selection list is gone; `PLATFORM_COMPONENTS` is now computed — `COMPONENTS.filter(c => c.kind === 'platform' && c.id !== 'watchtower')` at `_spine/spine-graph.ts:78-80`.
- Node count checks out: 15 stage chips + Watchtower observer + 3 platform-band nodes = 19 components (footer copy agrees: "19 components · 4 phases"); phase bands derived by `derivePhaseGroups()` (123–143).

## [10] Lakehouse state + playbook engine + reactive spine — **VERDICT: complete**

- Pure engine `packages/architecture/src/playground-state.ts`: `blankState` (71–96), `applyStep` (104–109, structuredClone + immutable advance), `reduceToCursor` (115–122, clamps), `deriveStatus` (132–151), `exportState` (170–172), `importState` (175–201, field validation + `InvalidStateError`). All exported via index.
- Playbook `src/playbook.ts`: `SENSITIVE_PRODUCT_VIEW_AUDIT` = exactly **22** steps numbered 1..22 (asserted by tests too); step 10 calls `conformToGold`, step 17 calls `getFinding` + `detectAnomalies` — reuse, not duplication.
- Store `apps/playground/app/_store/usePlayground.ts`: Zustand `create`, session-only (no persistence anywhere), `STEP_PACE_MS = 1100` (line 20), `step/run/pause/reset/exportJson/importJson/openTool/closeTool`; interval cleared on end/pause/reset/import (single module-level timer).
- Shell pieces all exist: `_controls/Controls.tsx` (Run/Pause/Step/Reset/Export/Import + IO textarea), `_inspector/Inspector.tsx` with exactly **Bronze/Silver/Gold/Schema/Audit** tabs (line 7) + live count row, `_spine/Narrative.tsx` (step x/22, title/desc, progress bar, scrollable step list).
- Jade reactive styling: `app/globals.css` — `@keyframes spine-ripple` + `.spine-node-beckon` (1.1s, brand easing), `.spine-node-open { animation:none }`, `@keyframes spine-flow` + `.spine-edge-active` (flowing dashed jade edge); global `prefers-reduced-motion` block suppresses all animation while keeping state visible. Active node = jade border inline (`NodeChip.tsx` `borderFor`), done = teal. Controlled React Flow reads `deriveStatus(STEPS, cursor)` in `Spine.tsx:136`.

## [11] Tool-overlay framework + DataGerry mock — **VERDICT: complete** (one deliberate a11y drift, see Deltas)

- Core: `overlay.ts` `overlayReducer` (21–29), `beckonToolId` (36–39), `dataGerrySyncStatus` (53–58); `tool-actions.ts` `authorSensitiveProductField` (18–27, idempotent) used by playbook step 1 AND the overlay button — one code path.
- `blankState` drafts Product **without** Sensitive (playground-state.ts:78–87) and `bridgedTables: []`; playbook step 3 pushes `ext_product` (playbook.ts:44).
- Shell: `_overlay/ToolOverlay.tsx` uniform chrome — codename + real-name subline + uppercase **"mocked"** badge + close (54–103); Esc closes (24–28); focuses itself. `_overlay/DataGerryOverlay.tsx` (ObjectType/fields editor, jade Sensitive row, "Add Sensitive: bool" → `store.step()`, Bridge→Bedrock→Atlas sync-status line). `_overlay/tool-content.ts` = single registration point, all six tools registered.
- Split-pane presentation: `playground-client.tsx:88` grid switches to `minmax(280px,0.6fr)/minmax(360px,0.4fr)` when an overlay is open; Inspector rail stays.
- `NodeChip.tsx:52` applies `.spine-node-beckon` / `.spine-node-open`; fullUi nodes are buttons (role="button", Enter/Space handled).
- Drift: **focus-trap is intentionally NOT implemented** — header comment (ToolOverlay.tsx:9–15): split-pane dialog "focuses itself + closes on Esc but does not trap Tab". No return-focus-to-trigger either. The map's "[11] …Esc/focus-trap" and design-spec lines 37/67 overstate what shipped.

## [12] Airflow / Trailhead mock — **VERDICT: complete**

- `airflowDagStatus(state,cursor)` in `overlay.ts:145-194`: ingestion DAG extract_SQLFleet/extract_AD/extract_Workday → load_Bronze (fan-in edges), passive transform DAG Forge→Silver→Gold, pending→running(jade)→success(teal) task states, ≤2-line run log, `canTrigger = cursor === 6 && !bronzePopulated`, `triggered = bronze populated`.
- `loadBronze` in `tool-actions.ts:38-40`; playbook **step 7** `apply → loadBronze` + `openTool: 'trailhead'` (playbook.ts:66–72) — **actual step number 7, matching the map**.
- `_overlay/AirflowOverlay.tsx`: custom CSS mini-DAG (fan-in + compact linear transform DAG rendered as secondary passive section), "Run this DAG" → `store.step()` (one code path), run log, reduced-motion-safe pulse. Registered as `trailhead` in `tool-content.ts:16`.
- Tests: 10 `airflowDagStatus` cases incl. full-run cursor 22 (all success) — green.

## [13] Trino / Overlook mock — **VERDICT: complete**

- `trinoResults(state,cursor)` in `overlay.ts:251-293` (+ `TRINO_SEEDED_SQL` 204–213 with "Query seeded by Atlas" provenance header): read-only over Gold, writes nothing; `canRun = cursor === 15`, `queryRun = cursor >= 16`; anomaly prefers explicit `edge.status` after step 17, derives before it.
- Playbook **step 16** `openTool: 'overlook'` (playbook.ts:129–134) — **actual step number 16, matching the map**.
- `_overlay/TrinoOverlay.tsx`: seeded-SQL console (readonly textbox) + "Run query" → `store.step()` + results table where the anomalous row (`j.harper / P-1042 / no-backing`) gets jade highlight + "anomalous" pill. Registered `overlook`.
- Tests: 8 trino cases incl. cursor 16/17/22 consistency — green.

## [14] Atlas + OPA mock — **VERDICT: complete**

- `atlasOpaStatus(state,cursor)` in `overlay.ts:336-351` (+ `ATLAS_REGO` const): OPA ALLOW card data (allow at cursor ≥ 13), ~4-line request log (GET steps→200 at 11, POST /authz/check→200 {allow:true} at 13, POST /audit/log→201 at 14, GET /traversal/query→200 [finding] at 18). Purely cursor-derived — **it performs no audit write**; the single audit write remains step 14's `apply` (playbook.ts:117–120), so no duplicate. Test asserts exactly 1 audit entry at cursor 14 and narrate-only steps 12/13 (playbook.test.ts:139–146).
- Playbook **step 14** `openTool: 'atlas'` (playbook.ts:113–121) — **actual step number 14, matching the map**.
- `_overlay/AtlasOpaOverlay.tsx`: two-zone layout (OPA decision card + Atlas request/response log), "Evaluate authz" → `store.step()` (one code path across steps 12–14), guarded by `cursor === BECKON_CURSOR && !auditWritten`. Registered `atlas`.

## [15] Compass mock (climax) — **VERDICT: complete**

- `compassTraversal(state,cursor)` in `overlay.ts:439-520`: finding **as edges** — jade anomalous viewed, synthesized dashed missing-memberof **gap** (`e:missing:j.harper:G-SR`), teal backed; `ready` gates climax render at cursor ≥ `COMPASS_CLIMAX_STEP = 19`; 3 narrative lines + per-node drill-into `details` (incl. backed-viewer m.okafor "ok" vs member-no-view a.chen "backed access").
- Auto-open: `playground-client.tsx:20-44` — `FINDING_STEP_N = STEPS.find(s => s.final)?.n ?? 19` → **actual step 19, matching the map**; `useEffect` opens Compass when cursor hits it, guarded by `autoOpenedFinding` ref that resets below the step; fires for both auto-run and single-step; keyed on cursor so closing doesn't retrigger.
- `_overlay/CompassOverlay.tsx`: SVG 3-column traversal graph, node chip buttons with `selected` **local UI state** feeding the drill-into detail panel — no `store.step()` (deliberate read-lens exception). Legend: anomalous/backed/missing. Registered `compass`.

## [16] Superset mock (sandbox) — **VERDICT: complete**

- `supersetDashboard(state,_cursor)` in `overlay.ts:582-643`: bar (products by exposure), table (anomalous users), donut (views by source system); exposure = viewed edge with no memberof backing, derived from scratch — does **not** read `state.finding` or `edge.status`. Cursor parameter unused ⇒ **cursor-independent**, proven by test "same state at different cursors yields the same dashboard" and by from-seed-at-cursor-0 tests using `{...SEED, cursor: 0}` (populated Gold: Payroll-NG exposed ×1, j.harper flagged).
- `_overlay/SupersetOverlay.tsx`: filter ("sensitive only") + drill-down as **local UI state**, no `store.step()`; registered `superset`.
- `components.ts:155-163`: superset `fullUi: true`; **no playbook step carries `openTool: 'superset'`** (openTools are only blueprint@1, trailhead@7, atlas@14, overlook@16, compass@11+19) ⇒ off-path sandbox, always clickable. Matches map.
- Nuance (see Deltas): the live store starts at `blankState()` whose Gold is empty, so at cursor 0 in the running app the dashboard renders *empty* datasets (tests cover this explicitly, overlay.test.ts:427–436); the populated "from the seed" case is a property of the derivation/tests, not of the app's initial state.

## [17] Flagship verification close-out — **VERDICT: partial** (coverage analysis)

Ticket file read in full (`.scratch/nanosoft-digital-twin/issues/17-flagship-playbook-verification.md`); its five checkboxes are all unchecked and status is `ready-for-agent`. Existing automated coverage:

Test inventory (all green, 122 total): `seed.test.ts` (27), `playground-state.test.ts` (16), `playbook.test.ts` (20), `tool-actions.test.ts` (6), `overlay.test.ts` (53). There is **no Playwright/e2e spec anywhere in the tree** (glob for `*.spec.ts`/`*.test.tsx` under apps/playground and `e2e/` dirs: none; no `playwright.config.*` at any level). The Playwright runs cited in map [10] and the coordinator smoke were ad-hoc, nothing committed. apps/playground has no test runner of its own (no vitest config, no test script).

Per-criterion determination:

1. **"A complete auto-run of the 22-step flagship advances the spine through all six tools without errors, ending stopped at step 22"** — PARTIALLY proven. Green unit tests prove the replay core end-to-end: `reduceToCursor(STEPS, 22)` → cursor 22, 3 audit entries, every viewed edge marked anomalous|ok (playbook.test.ts:105–117); every tool's derivation is asserted across the full cursor range including 22 (airflow cursor 22 all-success overlay.test.ts:138–146; trino cursor 22 :220–227; atlas cursor 22 :303–307; compass cursor 22 :372–380; superset cursor 22 :453–457); openTool flags exist at steps 1/7/14/16/19. NOT proven: the actual auto-run loop (`setInterval` pacing, stop-at-end in the store), spine React Flow rendering, "without errors" in a browser, and that each of the six tools actually beckons/appears during a live run. **Needs new test code (Playwright) or a manual run** to close.
2. **"Single-step mode exposes each tool's one canonical action; performing each mutates/reads the same state auto-run does (one code path)"** — LARGELY proven at the pure-core level: playbook `apply` fns literally call the exported canonical mutates (`authorSensitiveProductField`, `loadBronze` — playbook.ts:31,70; tool-actions.test.ts covers both, incl. idempotency/no-duplicate), and Atlas/Trino/DataGerry buttons call `store.step()` (code inspection). The UI wiring (button enabled at the right cursor, click → same mutation) is not machine-checked anywhere. **A cheap component/e2e test would be needed for formal closure; state semantics are already proven.**
3. **"The three read lenses show the same finding differently; the three write surfaces each write their target"** — ALREADY PROVEN by existing green unit tests. Reads: Trino = anomalous table row j.harper/P-1042 (overlay.test.ts:189–207), Compass = edges (gap + anomalous + backed, :335–370), Superset = dashboard chart data (:397–425). Writes: SchemaRegistry `Product.Sensitive: bool` (playbook.test.ts:57–62), Bronze 2 products + 2 view-logs via loadBronze (:51–55), audit_log entries (:105–110, :127–133). No new work needed for this criterion beyond recording it.
4. **"export → reset → import roundtrips a complete run preserving the finding"** — PARTIALLY proven. The machinery is tested (roundtrip preserves played state + cursor on a 2-step fake playbook, playground-state.test.ts:102–108; validation rejects malformed input; `STATE_FIELDS` includes `finding`; `reduceToCursor(steps,0) === blankState` gives reset), but **no test exports a full 22-step flagship run and asserts the imported state retains `finding`/gold/anomalies**. Needs one small new unit test (~10 lines, no browser) — the mechanism makes failure implausible but it is currently unproven.
5. **"An inspector shows the lakehouse state evolve across the full run"** — NOT covered. `Inspector.tsx` is an untested React component (zero component tests in the repo; playground has no test setup). The underlying lakehouse evolution is thoroughly proven, but "an inspector shows" is a rendering criterion. Needs a render test (@testing-library) or a Playwright/manual pass.

Bottom line for [17]: criterion 3 is closed by existing green tests; criteria 1, 2, 4, 5 each need something small — 4 needs a tiny unit test, 1/2/5 need a committed Playwright spec (or a documented manual run) since none exist in the tree.

## Referenced docs existence — all present

All seven design specs + plans named in map [10]–[16] exist under `docs/superpowers/`:
- specs: `2026-08-22-lakehouse-state-playbook-engine-design.md`, `-tool-overlay-framework-datagerry-design.md`, `-airflow-mock-design.md`, `-trino-mock-design.md`, `-atlas-opa-mock-design.md`, `-compass-mock-design.md`, `-superset-mock-design.md`
- plans: the matching seven `2026-08-22-*.md` files (plus older `2026-08-17-*` and deploy docs not in my scope).

---

## SPEC sync deltas

Every place the working tree diverges from SPEC.md/map.md wording:

1. **[11] Focus-trap dropped (a11y drift, documented in code).** Map [11] and `docs/superpowers/specs/2026-08-22-tool-overlay-framework-datagerry-design.md:37,67` promise a focus trap + "close returns focus to the clicked node". Implementation deliberately does neither: `ToolOverlay.tsx:9-15` — split-pane dialog "focuses itself + closes on Esc but does not trap Tab". Esc + self-focus + badge + codename all shipped. SPEC.md §6 itself only requires codename + "mocked" badge, so this is map/design-doc drift, not SPEC drift.
2. **[10] "spine-ripple = jade active node" is imprecise.** The ripple animation (`.spine-node-beckon` → `spine-ripple` keyframe) is applied to the *beckoning tool node* (the active step's openTool), while the active node gets a static jade border with no animation (`NodeChip.tsx` `borderFor`; `globals.css:36-45`). Flowing jade edge (`spine-flow` on `.spine-edge-active`) matches the claim exactly.
3. **[16] "explorable from the seed before the run" — derivation yes, live initial state no.** `supersetDashboard` ignores cursor and works over SEED-populated Gold at cursor 0 (tested), but the playground store initializes `blankState()` (Gold empty, `usePlayground.ts:55`), so at cursor 0 in the live app the dashboard renders empty datasets until step 10 populates Gold. Tests cover both cases (overlay.test.ts:395–436); only the map's phrasing implies the live app starts with seeded Gold.
4. **[07] "seed.test.ts 26/26" was the ticket-time count.** Current `seed.test.ts` holds 27 tests; the suite-level claim (122/122 overall) is exact and verified.
5. **Extra, unclaimed features in the tree (additions, not conflicts):** `window.__playground` dev-only store hook for driving verification (`usePlayground.ts:118-122`); `/tokens` route in the playground (token showcase page); Compass also beckons at step 11 (openTool before the final auto-open at 19) — consistent with SPEC §6 cross-cutting 3 but not spelled out in map [15].
6. **No divergences found in the claimed step numbers:** DataGerry=1, Airflow=7, Atlas=14, Trino=16, Compass climax/auto-open=19 — all exactly as the map records them. Export names match the map verbatim (`overlayReducer`, `beckonToolId`, `dataGerrySyncStatus`, `airflowDagStatus`, `trinoResults`, `atlasOpaStatus`, `compassTraversal`, `supersetDashboard`, `loadBronze`, `authorSensitiveProductField`, `blankState`…`importState`).

## Command output tails

1. `pnpm --filter @nanisoft/architecture test`:
```
 RUN  v4.1.11 C:/Users/dpven/source/website/packages/architecture
 Test Files  5 passed (5)
      Tests  122 passed (122)
   Start at  03:05:48
   Duration  2.18s
```
(exit 0)

2. `pnpm --filter playground build`:
```
$ next build
▲ Next.js 16.3.1 (Turbopack)
✓ Compiled successfully in 11.7s
  Running TypeScript ...
✓ Generating static pages using 6 workers (5/5) in 1395ms
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /icon.svg
└ ○ /tokens
BUILD_EXIT=0
```
(exit code 0)

3. (bonus) `pnpm --filter @nanisoft/identity test`: `Test Files 3 passed (3) · Tests 33 passed (33)` (exit 0).
