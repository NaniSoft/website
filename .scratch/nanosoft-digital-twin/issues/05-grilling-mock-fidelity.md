Type: grilling
Status: closed
Assignee: agent (driving map)
Resolved: 2026-08-21
Blocked by: 04

## Question

For each full-mocked-UI component — **Compass** (traversal UI), **Atlas + OPA** (authz decision + traversal API), **DataGerry/Blueprint** (schema authoring), **Superset** (dashboard), **Trino/Overlook** (query), **Airflow/Trailhead** (DAG run) — decide exactly what the mocked tool UI shows and what the user does at it, at a fidelity that teaches the digital-twin flow without cloning the real tool.

One question at a time (grilling, HITL). For each: what the user *does* (the interaction), what the mock *shows* (the feedback), how it reads/writes the shared in-browser state, and how faithful-vs-simplified it should be. Prerequisite: the spine/state model from ticket 04, so each mock's state contract is grounded.

Resolution records the mock-fidelity spec per component — the detail the playground spec needs.

## Answer

**Mock-fidelity spec for the six full-UI components** — the detail the playground spec needs. Resolved by grilling (HITL, text-only — no vision; verified through description, not visual review). All six share four cross-cutting decisions; each tool then fixes its canonical action, shown structure, state contract, and fidelity knob.

### Cross-cutting (apply to all six)

1. **Interaction posture = hybrid.** Auto-run is passive-observe (the playbook performs each step; the mock shows the result, as Compass did in prototype 04). **Single-step / click-into** exposes each tool's *one canonical action* — the learner performs that step's honest act, then watches the shared state mutate. One code path per tool (auto-run mutates programmatically; the canonical action mutates the same way the step would).
2. **Fidelity principle = structured echo.** Each mock uses the real tool's *information structure* (its recognizable shape — a DAG graph, a SQL console, a dashboard grid, a schema form, an API/decision card) but rendered in the **nanisoft tokens** from ticket 03 (petrol/bone/teal/jade, Satoshi + JetBrains Mono, breathe/traverse/ripple/settle motion) — not the real tool's colors, fonts, or icons. Uniform overlay chrome (title bar: codename + a **"mocked" badge**) ties the six as one family. Not a literal clone; not a pure bespoke abstraction.
3. **Auto-run overlay behavior = beckon, with one climactic auto-open.** Auto-run animates the spine only (light actor node jade + animate edge per step; done edges teal; phase band tracks). The active tool's node **pulses** (a jade ripple, on-brand per ticket 03's "ripple" principle) to invite a click — overlays do *not* auto-open mid-run (no stacking). Single-step pauses at the beckoning node. **Compass auto-opens at the finding step** — the one payoff (consistent with prototype 04, not new). Click/single-step opens the overlay with the canonical action primed.
4. **Superset = sandbox-only surface** (the one full-UI mock not on the flagship path). Reached by clicking its node (no guided step); a pre-built dashboard over live Gold. The other five are on the flagship access-traversal path and are reached both by their playbook step (beckon) and by click-into.

### Per-tool (pipeline order)

**DataGerry / Blueprint — schema authoring (Phase 1, origin).**
- Action: **add the `Sensitive: bool` field to the `Product` ObjectType** — the hinge of the whole audit (the twin is *definitional*; "sensitive" is authored before any data flows). Matches the sequence (Author *defines* the ObjectType).
- Shows: schema/type editor — left list of ObjectTypes (`Product` only), right pane of fields (`id`, `name`, `owner_group`, + the `Sensitive` field you add, highlighted jade); a sync-status line animates `Bridge → Bedrock (ext_product created) → Atlas (SchemaRegistry refreshed)`.
- State: **writes** `SchemaRegistry[Product].fields += {Sensitive: bool}`; the follow-on Bridge step writes the Bronze/Silver `ext_product` table schema. **Reads:** none (origin).
- Fidelity: minimal — one ObjectType, ~4 fields, only `Sensitive` interactive; DataGerry's full Section/Relation/Granularity richness hidden.

**Airflow / Trailhead — orchestration (Phase 2 trigger + Phase 3 orchestration).**
- Action: **trigger the ingestion DAG** (the recognizable "run this DAG" act) → fires Airbyte → Source → Bronze.
- Shows: Airflow's DAG graph + per-task run-state + trigger control. Ingestion DAG: `extract_AD` / `extract_Workday` / `extract_SQLFleet` → `load_Bronze`, tasks animating pending → running (jade) → success (teal), one-line run log. In Phase 3 (auto-run only) a second smaller DAG — transform (`Forge → Silver → Gold`) — animates as *orchestrated*, showing Airflow's role continues; not a separate action.
- State: **writes** Bronze — `bronze.products`, `bronze.view_logs` land with seeded raw rows. **Reads:** none (DAG config static).
- Fidelity: minimal — one ingestion DAG, ~3 tasks; transform DAG passive in Phase 3. Scheduler/variables/connections/retries/SLA/Gantt hidden.

**Trino / Overlook — query (Phase 4, surfaces the finding).**
- Action: **run the seeded SQL query** (the SQL is pre-written, Atlas-seeded — header "Query seeded by Atlas: Sensitive Product View Audit"; the user runs it, does not author SQL).
- Shows: SQL console — editor (seeded audit query, e.g. `… WHERE action='viewed' AND NOT EXISTS (memberof backing)`) + run button + results table; the anomalous row (`j.harper / P-1042 / viewed / no-backing`) highlighted. The finding in its **raw tabular form** — the last form before Compass renders it as a graph.
- State: **reads** Gold (`graph_nodes`, `graph_edges`); **writes nothing** — pure read surface. Teaching point: the query engine never mutates the twin; it asks questions of it.
- Fidelity: minimal — one seeded query, pre-written; results table with the anomalous row highlighted. Catalog/RBAC/federation/history/EXPLAIN hidden.

**Atlas + OPA — authz decision + traversal API (Phase 4, the hub).** Atlas is an API, not a UI; the mock visualizes the API surface.
- Action: **evaluate the authz decision** (OPA card: user=analyst, use-case=Sensitive Product View Audit → **ALLOW**) → OPA returns allow → Atlas **writes the audit-log entry** → investigation authorized to proceed. Teaches the twin is *governed* — access to the twin is itself access-controlled.
- Shows (one overlay, two zones): **OPA decision card** — input (user, use-case, action) → decision (ALLOW) + a read-only ~3-line Rego snippet that allowed it (focal interactive zone); **Atlas request/response log** — chronological `GET use-cases/.../steps → 200`, `POST /authz/check → 200 {allow:true}`, `POST /audit/log → 201`, `GET /traversal/query → 200 [finding]` (context, non-interactive).
- State: Atlas **writes** `audit_log` (shared audit log — its one mutation); **reads** `SchemaRegistry` (for steps). OPA is stateless (reads static policy, returns decision, writes nothing — the audit write is Atlas's, triggered by allow).
- Fidelity: minimal — one authz decision, one ~3-line Rego snippet, ~4-call log. Confidence/trust state machine, temporal-ledger internals, Celery, full FastAPI surface, OPA bundle management hidden. The traversal-*result* stays a hand-off *to* Compass (not Atlas's action), preserving Compass's climax.

**Compass — traversal UI (Phase 4, climax; refined from ticket 04, not re-decided).**
- Settled in 04: traversal graph showing the finding *as edges* (jade anomalous `viewed` edge, dashed missing `memberof` gap, teal backed access) + narrative; climax auto-open; reads via Atlas, writes nothing.
- Action (new this ticket): **drill into a node** on the traversal graph to reveal the "why" — click `j.harper` → "viewed P-1042 (sensitive: true), no backing group membership"; click `P-1042` → "sensitive: true, Payroll-NG." Graph exploration is Compass's actual differentiated value (vs. replay-narrative, which is the playbook's stepping).
- Fidelity: **most faithful of the six** — Compass is the one *custom* component (the product's own value), so Q2's echo doesn't apply; the mock is closest to intended real Compass: traversal highlight + path + drill-into-node detail panel. **Node-within-node containment** visualization deferred (build-time / fog) — richer interaction the MVP mock need not prove.
- State: reads Atlas's response (highlighted path + narrative); **writes nothing** (pure view).

**Superset — dashboard (sandbox-only per cross-cutting #4; compliance/audit persona).**
- Action: **apply a filter / drill-down** on the dashboard (toggle "sensitive only," or click a bar to drill one source system's exposures) → re-queries Gold → dashboard re-renders. Reached by click-into (no step). The recognizable "slice the dashboard" act.
- Shows: dashboard grid + filter bar — (1) bar: products by exposure count, (2) table: users with anomalous views (`j.harper` flagged), (3) donut: views by source system. A "query path: Superset → Trino → Gold" label notes real routing; the mock reads in-browser Gold directly (client-side) — a didactic simplification, no real query engine wired.
- State: **reads** Gold, deriving exposure client-side (`viewed` edge with no `memberof` backing = exposed) — so the dashboard is independently explorable *before* the flagship runs, from the seed. **Writes nothing** (third read-only lens).
- Fidelity: minimal — 2–3 charts, one filter interaction, pre-built (no chart-builder). SQL Lab/dataset editor/row-level security/alerting/cache hidden.

### Teaching spine across the three read surfaces
**Trino** = the finding as a *table row*; **Compass** = the same finding as *edges*; **Superset** = the same finding as a *dashboard chart*. Three lenses on one twin — the heart of "the twin is queryable and visualizable." The three *write* surfaces, in order: DataGerry (schema), Airflow (raw Bronze), Atlas (audit log) — authoring, ingestion, governance.

### Graduated from fog / carry-forwards
- **"Compliance dashboard playbook on Superset"** is now a concrete first candidate among the future use-cases (sharpened from the map's "Specific future use-cases" fog) — but stays *fog*, not a ticket: Q4 deferred it (sandbox-only; the use-case list is open to grow, flagship is the first instance). It graduates to a ticket only if/when the use-case list is grown.
- **Compass node-within-node containment** — build-time carry-forward (richer Compass interaction), not a spec decision; noted for the build/handoff.
- **Tool-overlay presentation** (modal vs. inline-expand vs. split-pane) — still open for build (carried from ticket 04); not a fidelity decision.