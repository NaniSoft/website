Type: prototype
Status: closed
Assignee: agent (driving map)
Resolved: 2026-08-21
Blocked by: 01, 03

## Question

Prototype the **playground's spine + shared in-browser state engine** — the heart of the simulator — as a rough, interactive artifact to react to. Prerequisites: the Next.js capability/stack findings from ticket 01 (prototype with the *right* stack to avoid rework) **and the locked nanisoft identity from ticket 03** (apply the petrol/bone/jade tokens, Satoshi + JetBrains Mono, and the directed-pipeline spine language to the prototype so it doesn't need re-skinning).

Raise fidelity on:

1. **`packages/architecture` model** — the one source of truth for the digital-twin architecture: the component/phase/flow definition (Atlas, Compass, Trailhead, Forge, Bedrock, Overlook, Blueprint, Watchtower, Anchor, Conveyor + the 16 off-the-shelf nodes), the four phases (Schema → Ingestion → Transform → Investigation), and the edges between them. Both the landing's architecture section and the playground consume this.

2. **The flow-graph spine** — a navigable, reactive graph of all components; triggering a phase animates data through the spine; each node shows live status/logs/sample payloads; clicking a full-UI component (Compass, Atlas+OPA, DataGerry, Superset, Trino, Airflow) zooms into its mocked tool UI. A rough prototype of the spine + **one** mocked tool UI is enough to react to.

3. **The shared in-browser state engine** — the lakehouse state (Bronze/Silver/Gold tables, graph_nodes/graph_edges, schema registry, audit log), the **playbook engine** (a use-case = a declarative sequence of phase-steps over the shared state), the **flagship playbook** (access traversal: Sensitive Product View Audit, from `TrueAccess_Schema_to_Visualization_Sequence.mermaid`), session-only state + export/import + reset, and the **seeded dataset** (AD, Workday HR, SQL Server Fleet → Product objects, view-logs, group membership).

This is a *prototype* (HITL): a rough interactive artifact (the spine + state engine + one mocked tool + the flagship playbook stepping) to confirm the interaction model before the full spec is written. Link the artifact from this ticket. Resolution records the decided spine/state/playbook model.

## Artifact (prototype)

`.scratch/nanosoft-digital-twin/prototypes/04-playground-spine-state.html` — single self-contained HTML file (no build, no server). **Run:** open in a browser (or `python -m http.server` in that dir + visit the URL if the browser blocks `file://`).

Branch: **UI** (visual interaction model), with the full shared state surfaced in an inspector after every step so the state engine is verifiable through text. The validated stack from ticket 01 (Zustand + @xyflow/react) is *not* exercised here — this validates the **model**, not the stack; the real build uses the validated stack. Tokens + directed-pipeline spine language applied from ticket 03 ("The Living Map": petrol/bone/teal/jade, Satoshi + JetBrains Mono, directed DAG spine with jade wavefront).

What it implements:
1. **`packages/architecture` model** (inlined as JS here) — components (10 codenames + off-shelf), 4 phases, directed edges. The one source of truth the landing architecture section and playground both consume.
2. **Flow-graph spine** — directed left→right pipeline (Sources→Schema→Ingestion→Bedrock→Transform→Serving→Core→UI; Watchtower observer above). Reactive: each playbook step lights its actor node jade + animates its edge; done edges turn teal; phase band tracks Schema/Ingestion/Transform/Investigation.
3. **Shared in-browser state engine** — lakehouse Bronze/Silver/Gold (graph_nodes/graph_edges), SchemaRegistry, audit_log; a declarative **playbook engine** (use-case = ordered phase-steps with mutate fns); the **flagship playbook** = Sensitive Product View Audit (22 steps, mirrored from `TrueAccess_Schema_to_Visualization_Sequence.mermaid`); session-only + export/import + reset to seed.
4. **One mocked tool UI — Compass** — click the Compass node (or reach step 11/19) → overlay shows the traversal graph: the anomalous `j.harper →viewed→ P-1042` edge in jade, the **missing `memberof` edge as a dashed gap**, the backed access in teal, plus narrative steps.

Self-verified (no vision — driven through the text accessibility tree + JS state):
- Loads with no JS errors (only a harmless favicon 404).
- Steps 1→10 produce exactly the intended teaching state: Bronze 10 rows, Silver 2 tables, Gold 5 nodes / 4 edges, SchemaRegistry Product/Sensitive:bool. The planted anomaly is present in the data: j.harper has a `viewed→P-1042` edge but **no `memberof` edge**, while m.okafor + a.chen both have `memberof→G-SR`.
- Step 17 sets the finding (j.harper / P-1042 Payroll-NG / sensitive / no backing group membership) and marks the Gold edges (`anomalous` / `ok`); audit log writes at step 14; Compass renders the finding narrative.
- Run completes at step 22 and stops; reset clears state (Gold→0); export→reset→import roundtrips (Gold→5, finding preserved).

## Answer

**Verdict (settled by human reaction): the interaction model is locked as the playground's spine.** The four pieces all land: directed-pipeline spine, declarative playbook stepping, Bronze/Silver/Gold state inspector, click-node→tool-overlay.

Decided model, for the spec:
1. **Spine = a directed left→right pipeline** of the real architecture (Sources → Schema → Ingestion → Bedrock → Transform → Serving → Core → UI; Watchtower as a cross-cutting observer above). Not a scattered mesh, not a hub-and-spoke, not a free canvas — a DAG with the phase band (Schema/Ingestion/Transform/Investigation) tracking the active step. The landing's architecture section reuses the same `packages/architecture` model; the playground makes it reactive.
2. **Playbook engine = a use-case is a declarative, ordered sequence of phase-steps**, each with an actor node, an active edge, a narrative line, and a mutate fn over the shared state. Guided-first (the flagship ships as the first instance; the use-case list stays open to grow, per standing decision 11). Controls: auto-run + single-step + reset; pace ~1.1s/step in the prototype (tune at build). A free-form sandbox is still in scope (standing decision 4) but is *later*, not the spine.
3. **Shared in-browser state = the lakehouse**: Bronze (raw) → Silver (conformed) → Gold (`graph_nodes` + `graph_edges`), plus a SchemaRegistry and an audit_log. This is the state the learner watches evolve, surfaced in an inspector after every step. Session-only + export/import + reset to the seeded scenario (standing decision 12).
4. **Tool zoom = click a full-UI node → a mocked tool overlay** (modal in the prototype; the real build can pick overlay vs. inline-expand vs. split-pane — open, not part of this decision). One mocked tool (Compass) proven in this prototype; the other five (Atlas+OPA, DataGerry/Blueprint, Superset, Trino/Overlook, Airflow/Trailhead) are ticket 05.
5. **Compass mock = a traversal graph** that shows the finding as *edges*, not prose: the anomalous `viewed` edge in jade, the **missing `memberof` edge as a dashed gap**, backed access in teal, plus plain-language narrative steps. Teaches the digital-twin flow without cloning the real tool.

Graduated from fog: the **seeded-dataset richness** patch (formerly in the map's "Not yet specified") is now specified enough by demonstration — a minimal seed (2 products, 4 users, 2 groups, 2 view-logs) is sufficient to teach the flagship; richness is a build-time tuning knob, not a standalone decision. Cleared from the map.

Open carry-forwards (not blockers, noted for the build/handoff):
- Real-build stack = Zustand + @xyflow/react + motion (ticket 01); this prototype validated the *model* only.
- Tool-overlay presentation (modal vs inline vs split) left open for build.
- The other five mock fidelities → ticket 05, now unblocked.