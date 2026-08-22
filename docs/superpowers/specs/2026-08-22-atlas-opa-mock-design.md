# Atlas + OPA mock (ticket 14)

> **Status:** approved design (2026-08-22). Branch: `feat/14-atlas-opa-mock`.
> **Source ticket:** `.scratch/nanosoft-digital-twin/issues/14-atlas-opa-mock.md`.
> **Spec basis:** `.scratch/nanosoft-digital-twin/SPEC.md` §4.8 (mock fidelity — Atlas+OPA), §4.9 (teaching spine — Atlas = the "govern" write surface, audit log), §2 (identity / motion), §6 (carry-forwards: step cadence ~1.1s; presentation = split-pane, locked for 12–16).
> **Prerequisites (done on main):** 07–12. Ticket 11 established the uniform `ToolOverlay` chrome + the **one-code-path pattern** (overlay's canonical action *is* a playbook step → the same `applyStep` auto-run uses), the pure derivations in `packages/architecture/src/overlay.ts`, and the single registration point `apps/playground/app/_overlay/tool-content.ts`. Ticket 12 (Airflow) added `airflowDagStatus` as the second instance. Atlas+OPA drops in as the fourth tool — no chrome rework, no store changes.
> **Resolves:** ticket 14 (the fourth of the six mocked-tool overlays — Atlas + OPA, the authz-and-audit surface).

## Goal

Ship the **fourth mocked-tool overlay — Atlas + OPA** — the "govern" write surface (SPEC §4.9: Atlas = govern, audit log). It teaches the twin is *governed*: the learner evaluates the OPA authz decision (`user=analyst`, `use-case=Sensitive Product View Audit → ALLOW`) and Atlas writes the audit-log entry before executing. One overlay, **two zones**: an **OPA decision card** (focal interactive — input → ALLOW + a read-only ~3-line Rego snippet) and an **Atlas request/response log** (context, non-interactive — the four API calls appearing as a function of the cursor). The traversal *result* stays a hand-off to Compass (a log line only, never visualized here) — preserving Compass's climax (ticket 15).

This ticket reuses the ticket-11/12 framework verbatim: the overlay's "Evaluate authz" button calls `store.step()` (the same `applyStep` auto-run uses), so single-stepping the learner and auto-running the twin share one mutate. It adds **no new canonical-action fn** — step 14's `apply` already pushes the `auditLog` entry — and **no store or chrome changes**.

## Decisions (locked during brainstorm)

1. **Canonical action = step 14 (the audit-write mutate), one code path.** Step 14 gains `openTool: 'atlas'`. The overlay's "Evaluate authz" button calls `store.step()` — the same `applyStep` auto-run uses — enabled at `cursor === 13` (the cursor at which `STEPS[13]` = step 14 is the next step to apply) and ghosted "Audit entry written" once the audit log is populated. The atlas node **beckons** (ripples) at `cursor === 14` (post-write observe invite, the established beckon semantics — `beckonToolId` returns `steps[cursor-1].openTool`). Steps 12 (Atlas asks OPA) and 13 (OPA returns allow) stay narrate-only (`apply: () => {}`); their `apply` is unchanged. The audit mutate is **not duplicated** — step 14's existing `apply` is the only write; no new fn in `tool-actions.ts`. (Rejected B: `openTool` on step 13 — its `apply` is `() => {}`, so the button would have no state effect and the audit would need auto-firing, violating "no auto-write before evaluate" and one-code-path. Rejected C: two buttons for steps 13 + 14 — two code paths.)
2. **OPA decision + Atlas log = pure derivation `atlasOpaStatus(state, cursor)`** in `packages/architecture/src/overlay.ts`, mirroring `dataGerrySyncStatus` / `airflowDagStatus`. Returns `{ allow: boolean, rego: string, log: AtlasLogLine[] }`. No persisted authz state, no store slice — the decision and the log are pure functions of the cursor (OPA is stateless; the audit write is Atlas's, already in `auditLog`). (Rejected: a stateful `authzReducer` with its own store slice — heavier, and the state would only mirror cursor.)
3. **Log-line thresholds (cursor = step.n of the last-applied step; "call has happened").** Each line appears once the step that produces it is applied:
   - `GET use-cases/sensitive-product-view-audit/steps → 200` — Compass asks Atlas (step 11) → `cursor ≥ 11`.
   - `POST /authz/check → 200 {allow:true}` — Atlas asks OPA (step 12) + OPA returns allow (step 13); shown complete once the decision is in hand → `cursor ≥ 13`. The `allow:true` body is the response.
   - `POST /audit/log → 201` — Atlas writes the audit entry (step 14) → `cursor ≥ 14`. This is the canonical action's result: absent at the button-enabled cursor (13), present after the press (cursor 14).
   - `GET /traversal/query → 200 [finding]` — Atlas serves the traversal to Compass (step 18) → `cursor ≥ 18`. A **log line only** — the finding is *not* visualized in this overlay, preserving Compass's climax (step 19).
   - Invariant: at the button-enabled cursor (13) the learner sees `GET use-cases/steps` + `POST /authz/check` (allow) as context; the `POST /audit/log` line is the act they are about to perform. At the post-action beckon (cursor 14) all three prior calls + the audit POST are shown; the traversal line is still hidden.
   - `allow = cursor ≥ 13` (OPA has returned allow). The OPA card renders ALLOW (jade) when `allow`, else a muted "pending" state.
4. **No traversal visualization here.** The `GET /traversal/query → 200 [finding]` line is a log entry only. The finding traversal (j.harper → viewed → P-1042, dashed missing memberof) is Compass's climax (ticket 15). Atlas's action is the authz + audit, not the traversal render.
5. **Rego snippet = static, read-only, ~3 lines.** A minimal policy echoing the decision: `package nanisoft.authz` / `allow if { input.user == "analyst"; input.use_case == "sensitive-product-view-audit" }`. Rendered in `font.data` (JetBrains Mono), non-editable. OPA bundle management, data-binding, partial-evaluation hidden.
6. **Fidelity = minimal.** One authz decision, one Rego snippet (~3 lines), one audit write, ~4-call log. Confidence/trust state machine, temporal-ledger internals, Celery, full FastAPI surface, OPA bundle management hidden. Atlas is an API; the overlay visualizes the API surface (a decision card + a request/response log), not a fake UI.

## Architecture & file layout

Boundary unchanged from ticket 11/12: **pure domain core in `packages/architecture`**, **thin Zustand + React shell in `apps/playground`**. Nothing in the core imports React, Next, Zustand, or React Flow.

**`packages/architecture` (pure + unit-tested):**
- `src/overlay.ts` — add `atlasOpaStatus(state, cursor)` + types (`AtlasLogLine`, `AtlasOpaStatus`). Lives next to `airflowDagStatus`.
- `src/playbook.ts` — step 14 gains `openTool: 'atlas'`. (Its `apply` already pushes the `auditLog` entry — unchanged.)
- `src/index.ts` — re-export the new symbols + types.
- `tests/overlay.test.ts` (extend) + `tests/playbook.test.ts` (extend).

**`apps/playground` (reactive shell):**
- `app/_overlay/AtlasOpaOverlay.tsx` *(new)* — the two-zone mock body.
- `app/_overlay/tool-content.ts` — add `atlas: AtlasOpaOverlay` (the single registration point).

Nothing else changes. `ToolOverlay.tsx`, `usePlayground.ts`, `Spine.tsx`, `NodeChip.tsx`, `playground-client.tsx`, `globals.css` are untouched. The `atlas` component is already `fullUi: true`, so its node is already clickable; `openTool`/`closeTool`/`step` already exist; `MOCK_TOOL_BY_COMPONENT['atlas']` already carries the canonical-action/shows/reads/writes/fidelity text. `opa` stays `fullUi: false` (surfaced as a zone inside the Atlas overlay, not its own tool — no `TOOL_CONTENT` entry). No new playground dependency.

## The pure derivation `atlasOpaStatus(state, cursor)`

```ts
export interface AtlasLogLine {
  method: 'GET' | 'POST';
  path: string;
  status: number;
  /** Optional response body snippet (e.g. `{allow:true}` or `[finding]`). */
  body?: string;
}

export interface AtlasOpaStatus {
  /** OPA decision — true once OPA returns allow (cursor ≥ 13). False = pending. */
  allow: boolean;
  /** Static read-only Rego snippet (the policy OPA evaluates). */
  rego: string;
  /** The Atlas request/response log, cursor-derived (up to 4 lines). */
  log: AtlasLogLine[];
}
```

**The Rego snippet** (constant, ~3 lines):
```
package nanisoft.authz
allow if {
  input.user == "analyst"
  input.use_case == "sensitive-product-view-audit"
}
```

**The log** (pure, cursor-derived; the four calls appear as their producing step is applied):

| Line | method | path | status | body | appears at |
|---|---|---|---|---|---|
| 1 | GET | `/use-cases/sensitive-product-view-audit/steps` | 200 | — | `cursor ≥ 11` |
| 2 | POST | `/authz/check` | 200 | `{allow:true}` | `cursor ≥ 13` |
| 3 | POST | `/audit/log` | 201 | — | `cursor ≥ 14` |
| 4 | GET | `/traversal/query` | 200 | `[finding]` | `cursor ≥ 18` |

`allow = cursor >= 13`. `log` is the concatenation of present lines (0–4 entries).

The function reads `state` only for signature parity with the sibling derivations (`dataGerrySyncStatus`, `airflowDagStatus`) and for `auditLog`-length in the overlay's action guard; the derivation itself is a pure function of `cursor`.

## The one-code-path canonical action

**No new fn in `tool-actions.ts`.** Step 14's existing `apply` already pushes the audit entry:
```ts
apply: (s) => {
  s.auditLog.push({ ts: TS, actor: 'analyst', useCase: 'sensitive-product-view-audit',
                    decision: 'allow', detail: 'OPA allowed Sensitive Product View Audit' });
},
```
The overlay's "Evaluate authz" button calls **`store.step()`** — the same action auto-run's `setInterval(step)` calls, which applies `STEPS[cursor]` via `applyStep`. There is no second mutate. The guard is the button's enabled/disabled state: enabled only at `cursor === 13` (step 14 is next) and when the audit log is empty; clicking advances the cursor to 14, running step 14's `apply` (the audit push). Once the audit log is populated the button is ghosted "Audit entry written."

`BECKON_CURSOR = STEPS.findIndex(s => s.openTool === 'atlas')` (= 13), computed the same way `DataGerryOverlay` / `AirflowOverlay` compute theirs. `canAct = state.cursor === BECKON_CURSOR && state.auditLog.length === 0`. (At cursor 13 the audit log is empty — step 14 is the first audit write — so `canAct` is true; after the press, cursor 14, `auditLog.length === 1`, `canAct` false.)

**Why this is the one code path:** auto-run (`setInterval(step)`) and the overlay's button both reduce to `applyStep(state, STEPS[cursor])`. There is no second mutate; the audit push lives only in step 14's `apply`. The Inspector's audit-log tab updates from the same state the overlay just wrote — the learner sees the audit entry land as they evaluate.

## Atlas+OPA mock content

`AtlasOpaOverlay.tsx` — the authz-and-audit surface, structured-echo of Atlas's API shape (a decision card + a request/response log) in nanisoft tokens:

- **OPA decision card** (`role="group"` `aria-label="OPA decision"` — the focal interactive zone): the authz input rendered as two labeled values (`user: analyst`, `use-case: Sensitive Product View Audit`) in `font.data`; the read-only ~3-line Rego snippet in a `surface.light.sunken` code block (`font.data`, monospace); the decision rendered as a pill — **ALLOW** (jade, when `allow`) or a muted "pending" (petrolSoft, when not). The "Evaluate authz" pill button below — jade-accented when `canAct`, ghosted "Audit entry written" when the audit log is populated. `font.voice`. `aria-label="Evaluate authz decision"`. Clicking performs step 14 (the one-code-path mutate). A muted subnote: "OPA is stateless · reads a static Rego policy · writes nothing".
- **Atlas request/response log** (`role="log"` `aria-label="Atlas request log"` — context, non-interactive): the cursor-derived lines from `atlasOpaStatus(...).log`, each `method path → status body` in `font.data`. A muted placeholder "no requests yet" when empty. The `POST /audit/log → 201` line is the visible effect of the canonical action.
- **Fidelity footer**: a muted "mocked · authz + audit surface only · confidence/trust state machine, temporal-ledger, Celery, full FastAPI surface, OPA bundle management hidden" line (the hidden richness, per `MOCK_TOOLS['atlas'].fidelity`).
- **Tokens**: `surface.light` panes, `radius.inner`, `font.data` for the Rego + log, `font.voice` for the button. Jade only for the ALLOW decision + the enabled button's accent. Teal for the `201`/`200` success statuses (done). Petrol for pending. No pure white/black. (Identity §2: jade = single locked accent, live/active only.)

The overlay reads `atlasOpaStatus(state, state.cursor)` (pure) for the decision, the Rego snippet, and the log; it reads `store.step` for the canonical action. `BECKON_CURSOR` is computed via `STEPS.findIndex(s => s.openTool === 'atlas')`.

## State model changes (pure core)

**None.** `auditLog: AuditEntry[]` already exists in `SeedDataset`/`PlaygroundState`; step 14's `apply` already pushes the entry. `SchemaRegistry` already exists (Atlas reads it — already populated by step 4). No `STATE_FIELDS` or `importState` change.

Step table change (only step 14):

| # | Phase | Actor | Edge | apply (state change) | openTool |
|---|---|---|---|---|---|
| 14 | investigation | atlas | `null` | push the audit-log entry (unchanged) — the canonical govern mutate | `'atlas'` *(new)* |

All other steps unchanged. Steps 12/13 stay narrate-only. Step 14's mutate is behavior-identical to today; it only gains `openTool`.

## Testing + verification

**Pure core — vitest in `packages/architecture`** (TDD; extends the existing suite; `environment: node`, `tests/**/*.test.ts`):
- `overlay.test.ts` *(extended)* — `atlasOpaStatus(state, cursor)`:
  - cursor 0 → `allow` false; `log` empty; `rego` is the static snippet.
  - cursor 10 → still empty log (Compass hasn't asked Atlas).
  - cursor 11 → `log` = [GET use-cases/steps → 200]; `allow` false.
  - cursor 12 → same as 11 (authz check not yet complete); `allow` false.
  - cursor 13 → `log` adds `POST /authz/check → 200 {allow:true}` (2 lines); `allow` true.
  - cursor 14 → `log` adds `POST /audit/log → 201` (3 lines); `allow` true.
  - cursor 17 → same 3 lines (traversal not yet served).
  - cursor 18 → `log` adds `GET /traversal/query → 200 [finding]` (4 lines); `allow` true.
  - cursor 22 → 4 lines, `allow` true.
  - `rego` is the constant 3-line snippet in every case.
- `playbook.test.ts` *(extended)*: step 14 carries `openTool: 'atlas'`; step 14's `apply` still pushes exactly one audit entry (existing assertion holds); `beckonToolId(STEPS, 14)` returns `'atlas'` (the node beckons post-write).

**Playground render verification (no vision — the project's "resolved without vision" norm; the Playwright MCP browser tools drive the running dev server):**
- `pnpm --filter @nanisoft/architecture vitest run` green; `pnpm --filter playground build` green; `next dev` on :3001; console clean.
- Playwright MCP a11y snapshot: click the `Atlas` node → `role="dialog"` with `aria-label="Atlas"`, the "mocked" badge, the OPA decision card (input + Rego + ALLOW/pending), the "Evaluate authz" button, and the Atlas request log.
- Single-step to cursor 13 (via Controls or `window.__playground`) → the OPA card reads ALLOW, the log shows `GET use-cases/steps` + `POST /authz/check`, the "Evaluate authz" button is enabled; click → `window.__playground.getState().state.auditLog.length === 1` with `detail` containing "OPA allowed"; the log gains `POST /audit/log → 201`; the Inspector audit-log tab shows the entry; the button is ghosted "Audit entry written".
- Esc closes the overlay; the `.spine-node-beckon` class is present on the active `atlas` node at cursor 14 before open.
- Auto-run through step 18 → the log gains `GET /traversal/query → 200 [finding]` (a log line only — no traversal rendered in this overlay).
- Existing suites stay green (identity, landing, architecture; DataGerry + Airflow overlays + beckon).

**Human visual confirm** — the one step not done here (operator AFK): the two-zone Atlas pane, the jade ALLOW pill, the Rego code block, the "mocked" badge, and the request log lines. Flagged for the operator's return; the a11y + build + live-state checks above stand in until then.

## Acceptance criteria mapping (from the ticket)

| Ticket criterion | How this design satisfies it |
|---|---|
| One overlay, two zones: OPA decision card (input → ALLOW + read-only ~3-line Rego, focal interactive) + Atlas request/response log (4 calls) | `AtlasOpaOverlay.tsx` renders the OPA card (input + static Rego + ALLOW) and the Atlas log (4 cursor-derived lines) via `atlasOpaStatus`. |
| Canonical action: evaluate the authz decision (user=analyst, use-case → ALLOW) → Atlas writes the audit-log entry | "Evaluate authz" button = `store.step()` at cursor 13 → step 14's `apply` pushes the audit entry. ALLOW shown as context (cursor ≥ 13). |
| Atlas writes `audit_log` and reads `SchemaRegistry`; OPA stateless (reads static policy, writes nothing; the audit write is Atlas's) | Step 14's `apply` writes `auditLog`; `atlasOpaStatus` reads only `cursor` (+ `auditLog.length` for the guard); OPA's Rego is static, no writes. |
| The traversal result stays a hand-off to Compass (not Atlas's action) — preserves Compass's climax | `GET /traversal/query → 200 [finding]` is a log line only (cursor ≥ 18), never rendered; the finding traversal is Compass's (ticket 15). |
| Reuses the overlay chrome + one-code-path pattern from 11 | Drops into `TOOL_CONTENT['atlas']`; chrome unchanged; step 14's `apply` is the audit mutate and the overlay button's `store.step()` — one mutate, no new fn. |

## Out of scope (later tickets)

- Tools 13 / 15 / 16 (Overlook, Compass, Superset) — this ticket ships Atlas+OPA only; they drop into `TOOL_CONTENT`.
- Compass auto-open at the finding (ticket 15) — untouched; Compass's existing `openTool` flags stay.
- The free-form sandbox (later, not the spine).