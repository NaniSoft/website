# nanisoft — Landing + Playground · Handoff Spec

> **Status:** decided (spec for handoff). Source: the wayfinder map at `.scratch/nanosoft-digital-twin/map.md`, resolved through tickets 01–05 + 15 standing decisions recorded during charting. This document consolidates them into one buildable spec.
> **Scope:** two web surfaces that share one model of the same architecture — **nanisoft.com** (landing) and **playground.nanisoft.com** (simulator). This is the *landing + the simulator*, not the real product backend.
> **Not the product:** no real Atlas engine, real Compass, real OPA, real data pipeline, real tool integrations, or real auth. The playground is fully mocked. "TrueAccess" is retired everywhere; component codenames are kept.
> **Resolved without vision** (tickets 03–05): all visual/interaction decisions were reached through text — identity style tile, spine/state prototype, and mock-fidelity grilling were verified via text description / accessibility tree / live JS state, never visual review. Builders should treat the token + motion definitions below as authoritative, not any prior screenshot.

---

## 1. The shared model — `packages/architecture`

The **one source of truth** for the digital-twin architecture, consumed by *both* the landing's architecture section and the playground. (Decision 5; ticket 04.)

### Components (codenames kept — decision 10)

**Custom (4)** *(classification reconciled 2026-08-23 to the stack doc + ticket-21 landing framing — Blueprint=DataGerry was mis-listed here as custom, and Scout was missing)*:
- **Atlas** — core engine + API (FastAPI in the real arch; mocked in the playground). Owns the traversal API, authz enforcement, audit log, use-case step serving.
- **Compass** — traversal UI (the product's differentiated value: graph exploration of the twin).
- **DataGerry Bridge** — thin sync from DataGerry to Bedrock DDL + Atlas SchemaRegistry cache (a CronJob in the real arch).
- **Scout** — residual connectors for genuinely bespoke internal systems the off-the-shelf ingestion catalog doesn't cover (small glue following the connector plugin interface, triggered by Airflow).

**Schema authoring (off-the-shelf, codenamed):**
- **Blueprint = DataGerry** — schema definition UI (Type/Field editor), AGPLv3 used unmodified (mock hides Section/Relation/Granularity richness — §4.8).

**Orchestration / transform / lakehouse / serving (off-the-shelf, codenamed):**
- **Trailhead = Airflow** — orchestration (DAGs).
- **Forge = Spark + dbt** — transform/conform/SCD2 + confidence scoring.
- **Bedrock = Nessie** (Iceberg catalog, Postgres, S3) — the lakehouse: Bronze → Silver → Gold.
- **Overlook = Trino** — query engine over Bedrock.
- **Watchtower = Prometheus + Grafana + Loki** — cross-cutting observability.

**Platform/ops (off-the-shelf, codenamed):**
- **Anchor = OpenTofu/Terraform** (IaC), **Conveyor = ArgoCD** (GitOps), **OpenBao** (secrets).

**Off-the-shelf, unnamed in the spine (reactive nodes only in the playground):** Airbyte (ingestion connectors), Zingg (entity resolution), Great Expectations (quality gates), MinIO/S3, CloudNativePG, MongoDB, RabbitMQ, Superset, OPA, Valkey/Redis.

### Phases (4)
`Schema → Ingestion → Transform → Investigation` — the phase band tracks the active step.

### Pipeline spine (directed, left → right — ticket 04)
`Sources → Schema → Ingestion → Bedrock → Transform → Serving → Core → UI`, with **Watchtower** as a cross-cutting observer *above* the spine. Sources = Active Directory, Workday HR, SQL Server Fleet. The landing's architecture section and the playground's spine both render this same directed DAG; the playground makes it reactive.

### Edges
Directed edges between components per `resources/TrueAccess_MVP_Architecture.mermaid`. The model is seeded from `resources/` (de-branded: "TrueAccess" retired, codenames kept — decision 9/10).

---

## 2. nanisoft identity (ticket 03 — "The Living Map")

Applied to all three surfaces (hero / architecture section / playground tool chips), grounded in the digital-twin subject matter. **Brand is greenfield** (decision 13); this identity is the spec.

### Wordmark
- **W1 "node + flow"** — Satoshi 700. The "i" dot = a ringed graph node + a trailing live link. **Jade is reserved for the active link only** (the live/flowing state); the rest of the mark is petrol.
- **W3 monogram** — kept as the favicon / dock fallback.

### Palette
- **Base:** petrol + bone.
- **Secondary:** teal.
- **Accent:** **jade = single locked accent, live/active only** (the wavefront, the active edge, the active link in the wordmark). Jade never used decoratively.
- **Excluded:** no purple, no neon, no pure black, no pure white.
- **Shape lock:** card radius 20, inner radius 12, buttons are pills.

### Typography
- **Satoshi** — the voice (UI/body/headings).
- **JetBrains Mono** — the twin's data (tables, query, logs, node labels).
- Italic = emphasis. No serif.

### Motion (four principles — ticket 03)
**breathe / traverse / ripple / settle**, easing `cubic-bezier(.32,.72,0,1)`. `prefers-reduced-motion` honored (all motion degrades to a static end-state, never removed content). The spine step cadence in the prototype was ~1.1s/step — tune at build.

### Tone
Plain, confident, never breathless. No hype words.

### Hero graph language (landing hero + reused in playground)
A **directed acyclic pipeline** — a left→right DAG of the real architecture, orthogonal routing with soft 90° bends + arrowheads, a **jade wavefront flowing through**. **Watchtower** is a cross-cutting observer. *Not* a scattered mesh — a directed pipeline (revised from mesh per user feedback that real architecture is a directed flow).

---

## 3. App 1 — nanisoft.com (landing)

A rebranded landing for nanisoft (decision 14 — restructure around the digital-twin narrative). Web only (decision: no mobile apps).

### Narrative structure (decision 14)
`what it is → how we build it → what it unlocks → our approach → try it in the playground`

### Sections
1. **Hero** (decision 6, ticket 03) — a reactive, mouse-driven **digital-twin graph** hero: the directed DAG pipeline (§2 hero language), live + mouse-reactive, **no buttons** (pure spectacle). Wordmark + positioning line over it. *Executed stack note (ticket 19, 2026-08-23): hand-rolled SVG derived from `@nanisoft/architecture` — zero new dependencies, superseding the earlier react-force-graph-2d/@xyflow parenthetical; rationale matrix in `docs/superpowers/specs/2026-08-23-landing-hero-dag-design.md`.*
2. **What it is** — the digital twin of an organization's IT estate, built via a multi-component datalake, so the org can see how its systems are connected and actually work. Access traversal is *one use-case*; more coming (decision 9).
3. **How we build it** — the **architecture section** (decision 7): an interactive shared-spine, scroll-animated through `Schema → Ingestion → Transform → Investigation`, reusing `packages/architecture` (§1). Bridge CTA → playground.nanisoft.com.
4. **What it unlocks** — use-cases (flagship: access traversal / Sensitive Product View Audit; more coming).
5. **Our approach** (decision 9) — nanisoft's stated approach = the buy-first / compose-OSS strategy (16 off-the-shelf products + 4 custom components; own only Atlas + Compass + the Bridge + Scout). De-branded from the stack doc.
6. **Try it in the playground** — CTA to playground.nanisoft.com.

### Components — keep / retire (decision 14)
- **Reuse + re-theme** existing components where they map to the new narrative (in the nanisoft tokens §2).
- **Retire** the Sentinel-Datalake-demo-specific components that don't fit: **ChatPanel, CommandCenter, the Agents demo, LogoCloud, Testimonial.**

### Positioning (decision 9)
nanisoft = digital twin of the IT estate. "TrueAccess" retired everywhere. Access traversal = one use-case; more use-cases coming via small utilities + OSS reuse. Buy-first/compose-OSS = nanisoft's stated *approach*.

---

## 4. App 2 — playground.nanisoft.com (simulator)

An in-browser, interactive **simulator of the entire digital-twin architecture** with mocked tool-use and shared in-browser state. **Teaching-first that can also sell** (decision 2). Web only.

### 4.1 Stack (ticket 01)
- **Next.js 16.3.1** (stock, not a fork) · **pnpm monorepo** (decision 5).
- Playground = a **client app**: `'use client'`, **motion**, **react-force-graph-2d** proven; `dynamic({ssr:false})` is **forbidden in Server Components** — use a client wrapper.
- **Recommended playground stack:** **Zustand** (shared state) + **@xyflow/react** (flow spine) + **react-force-graph-2d** (hero graph) + **motion** (animations). (Prototype 04 validated the *model*, not the stack.)

### 4.2 Repo (decision 5)
pnpm monorepo: `apps/landing`, `apps/playground`, `packages/architecture` (§1 — the one source of truth; also holds seeded datasets + mock-tool specs).

### 4.3 The spine (ticket 04)
A **directed left→right pipeline** of the real architecture (§1): `Sources → Schema → Ingestion → Bedrock → Transform → Serving → Core → UI`; **Watchtower** observer above. **Not** a mesh, hub-and-spoke, or free canvas — a DAG. A **phase band** tracks the active phase (`Schema/Ingestion/Transform/Investigation`). Each playbook step lights its actor node jade + animates its edge; done edges turn teal.

### 4.4 The playbook engine (ticket 04; decisions 4, 11)
- A use-case = a **declarative, ordered sequence of phase-steps**, each with: an actor node, an active edge, a narrative line, and a **mutate fn** over the shared state.
- **Guided-first.** Controls: **auto-run + single-step + reset**. Pace ~1.1s/step (tune).
- **Framework + flagship (decision 11):** the engine ships; the **flagship = access traversal (Sensitive Product View Audit)** is the first instance. The use-case list is **open to grow** — more playbooks later, not in this spec.
- A **free-form sandbox** is in scope (decision 4) but is **later, not the spine.**

### 4.5 Shared in-browser state (ticket 04; decision 12)
- The **lakehouse:** **Bronze** (raw) → **Silver** (conformed) → **Gold** (`graph_nodes` + `graph_edges`), plus a **SchemaRegistry** and an **audit_log**.
- Surfaced in an **inspector after every step** (the state the learner watches evolve).
- **Persistence = session-only** (resets on reload) + **export/import**; a **reset** button restores the seeded scenario (decision 12).

### 4.6 Seeded dataset (ticket 04)
Minimal seed sufficient to teach the flagship: **2 products, 4 users, 2 groups, 2 view-logs.** Richness is a build-time tuning knob, not a standalone decision. The planted anomaly: **j.harper** has a `viewed → P-1042` edge but **no `memberof` edge**; **m.okafor** and **a.chen** both have `memberof → G-SR`. P-1042 = Payroll-NG, `sensitive: true`.

### 4.7 The flagship playbook — Sensitive Product View Audit
22 steps, mirrored from `resources/TrueAccess_Schema_to_Visualization_Sequence.mermaid`. Step map (from prototype 04 verification):
- Steps 1–10 produce the teaching state: Bronze 10 rows, Silver 2 tables, Gold 5 nodes / 4 edges, SchemaRegistry `Product/Sensitive:bool`. The anomaly is present in the data.
- Step 14: audit log writes.
- Step 17: sets the finding (j.harper / P-1042 / Payroll-NG / sensitive / no backing group membership) and marks Gold edges `anomalous` / `ok`.
- Steps 11/19 + the finding step: Compass renders the finding narrative.
- Step 22: run completes and stops.

### 4.8 Mock fidelity — the six full-UI components (ticket 05)

**Cross-cutting (all six):**
1. **Interaction posture = hybrid.** Auto-run is passive-observe (the playbook performs each step; the mock shows the result). **Single-step / click-into** exposes each tool's *one canonical action* — the learner performs that step's honest act, then watches state mutate. One code path per tool (auto-run mutates programmatically; the canonical action mutates the same way).
2. **Fidelity = structured echo.** Each mock uses the real tool's *information structure* (its recognizable shape) rendered in the **nanisoft tokens** (§2) — not the real tool's colors/fonts/icons. Uniform overlay chrome: title bar = codename + a **"mocked" badge**. Not a literal clone; not a pure bespoke abstraction.
3. **Auto-run overlays = beckon.** Auto-run animates the spine only; the active tool's node **pulses** (jade ripple) to invite a click — overlays do **not** auto-open mid-run (no stacking). Single-step pauses at the beckoning node. **Compass auto-opens at the finding step** — the one climax.
4. **Tool zoom = click a full-UI node → mocked tool overlay** (ticket 04). **Presentation = split-pane** — resolved in ticket 11: clicking a full-UI node splits the spine card into a slim left spine strip (active node still visible/pulsing) + a right tool pane; the Inspector rail stays. Locked for tickets 12–16 (see §6).

**Per-tool (pipeline order):**

**DataGerry / Blueprint — schema authoring (Phase 1, origin)**
- Action: **add the `Sensitive: bool` field to the `Product` ObjectType** (the definitional hinge — "sensitive" is authored before data flows).
- Shows: schema/type editor — left list of ObjectTypes (`Product`), right pane fields (`id`, `name`, `owner_group`, + `Sensitive` added jade); sync-status line animates `Bridge → Bedrock (ext_product created) → Atlas (SchemaRegistry refreshed)`.
- State: **writes** `SchemaRegistry[Product].fields += {Sensitive: bool}`; the Bridge step writes the `ext_product` table schema. Reads: none (origin).
- Fidelity: minimal — one ObjectType, ~4 fields, only `Sensitive` interactive; DataGerry's Section/Relation/Granularity richness hidden.

**Airflow / Trailhead — orchestration (Phase 2 trigger + Phase 3)**
- Action: **trigger the ingestion DAG** ("run this DAG") → Airbyte → Source → Bronze.
- Shows: DAG graph + per-task run-state + trigger. Ingestion DAG: `extract_AD / extract_Workday / extract_SQLFleet → load_Bronze`, pending → running (jade) → success (teal), one-line run log. Phase 3 (auto-run only): a second smaller DAG (`Forge → Silver → Gold`) animates as orchestrated; not a separate action.
- State: **writes** Bronze (`bronze.products`, `bronze.view_logs`). Reads: none (DAG config static).
- Fidelity: minimal — one ingestion DAG, ~3 tasks; transform DAG passive. Scheduler/variables/connections/retries/SLA/Gantt hidden.

**Trino / Overlook — query (Phase 4, surfaces the finding)**
- Action: **run the seeded SQL query** (SQL pre-written, Atlas-seeded — header "Query seeded by Atlas: Sensitive Product View Audit"; user runs, does not author SQL).
- Shows: SQL console — editor + run button + results table; anomalous row (`j.harper / P-1042 / viewed / no-backing`) highlighted. The finding as a **table row**.
- State: **reads** Gold (`graph_nodes`/`graph_edges`); **writes nothing** — pure read surface.
- Fidelity: minimal — one seeded query, pre-written; results table with the anomalous row. Catalog/RBAC/federation/history/EXPLAIN hidden.

**Atlas + OPA — authz decision + traversal API (Phase 4, the hub)**
- Atlas is an API, not a UI; the mock visualizes the API surface.
- Action: **evaluate the authz decision** (OPA card: user=analyst, use-case=Sensitive Product View Audit → **ALLOW**) → Atlas **writes the audit-log entry**. Teaches the twin is *governed*.
- Shows (one overlay, two zones): **OPA decision card** — input → ALLOW + read-only ~3-line Rego snippet (focal interactive); **Atlas request/response log** — `GET use-cases/.../steps → 200`, `POST /authz/check → 200 {allow:true}`, `POST /audit/log → 201`, `GET /traversal/query → 200 [finding]` (context, non-interactive).
- State: Atlas **writes** `audit_log`; **reads** `SchemaRegistry`. OPA stateless (reads static policy, writes nothing; audit write is Atlas's).
- Fidelity: minimal — one authz decision, ~3-line Rego snippet, ~4-call log. Confidence/trust state machine, temporal-ledger internals, Celery, full FastAPI surface, OPA bundle management hidden. The traversal-*result* stays a hand-off *to* Compass (not Atlas's action) — preserves Compass's climax.

**Compass — traversal UI (Phase 4, climax; refined from ticket 04)**
- Settled in 04: traversal graph showing the finding *as edges* (jade anomalous `viewed` edge, **dashed missing `memberof` gap**, teal backed access) + narrative steps; climax auto-open; reads via Atlas, writes nothing.
- Action (new): **drill into a node** — click `j.harper` → "viewed P-1042 (sensitive: true), no backing group membership"; click `P-1042` → "sensitive: true, Payroll-NG." Graph exploration = Compass's differentiated value.
- Fidelity: **most faithful of the six** (Compass is the product's own value; Q2's echo doesn't apply). Traversal highlight + path + drill-into-node detail panel. **Node-within-node containment deferred** (build-time carry-forward).
- State: reads Atlas's response (path + narrative); writes nothing.

**Superset — dashboard (sandbox-only; compliance/audit persona)**
- Off the flagship path. Reached by clicking the Superset node (no guided step); a pre-built dashboard over live Gold.
- Action: **apply a filter / drill-down** (toggle "sensitive only," or click a bar to drill a source system) → re-queries Gold → dashboard re-renders.
- Shows: dashboard grid + filter bar — (1) bar: products by exposure count, (2) table: users with anomalous views (`j.harper` flagged), (3) donut: views by source system. A "query path: Superset → Trino → Gold" label notes real routing; the mock reads in-browser Gold directly (client-side) — no real query engine wired.
- State: **reads** Gold, deriving exposure client-side (`viewed` edge with no `memberof` backing = exposed) — explorable *before* the flagship runs, from the seed. Writes nothing.
- Fidelity: minimal — 2–3 charts, one filter interaction, pre-built (no chart-builder). SQL Lab/dataset editor/row-level security/alerting/cache hidden.

### 4.9 Teaching spine (ticket 05)
**Three read lenses on one finding:** Trino = **table row**, Compass = **edges**, Superset = **dashboard chart**. **Three write surfaces:** DataGerry = author (schema), Airflow = ingest (Bronze), Atlas = govern (audit log). This contrast — same data, different lenses; author → ingest → govern → query → visualize — is the heart of "the twin is queryable and visualizable."

### 4.10 Reactive (non-full-UI) nodes (decision 3)
All other components (Airbyte, Forge, Bedrock, Watchtower, Anchor, Conveyor, OpenBao, etc.) are **reactive nodes** on the spine — they light/animate with their step but have no full mocked UI. (Forge, Bedrock appear in the spine + state inspector, not as tool overlays.)

---

## 5. Deployment (ticket 02 research → executed as ticket 22; decision 15)

**Domains (fixed):** `nanisoft.com` (apex) + `www.nanisoft.com` + `playground.nanisoft.com`.

**Executed decision (2026-08-22 — supersedes the recorded Vercel-Pro default):** both apps deploy to **Cloudflare Workers via `@opennextjs/cloudflare`**: landing → worker `nanisoft` (existing worker updated in place; apex + www custom domains already configured), playground → worker `nanisoft-playground`. One verify-gated workflow (`.github/workflows/deploy.yml`) lints/tests/builds on push/PR, then deploys both workers in parallel on push to `main`. Rationale: reuses the existing Cloudflare worker + API-token secrets; free tier, commercial use OK; the landing's demo-request API route needs a server runtime (rules out static export); no K8s cluster to reuse. The four open inputs from ticket 02 (cost posture, registrar/DNS host, cluster, server-feature needs) are answered de facto by this choice. CI deploy green at HEAD 2026-08-22; both domains verified live (HTTP 200) 2026-08-23. Ticket 18's re-themed shell landed on `main` the same day and ships on push; the hero / architecture / narrative sections arrive with tickets 19–21. Design: `docs/superpowers/specs/2026-08-23-cloudflare-workers-deploy-design.md`; platform research: `research/deployment-findings.md`.

**Alternatives (recorded, not chosen):**
- **Vercel Pro** ($20/mo, commercial-use required) — the only Next.js-verified adapter besides Bun; native two-project + pnpm-monorepo + subdomain wiring. Retained as the documented fallback.
- **K8s self-hosting** (`output:'standalone'` Docker + reverse proxy) — fully supported, heaviest ops; no cluster in play.
- The ticket-02 Cloudflare caveat (open `proxy.ts` gap #1277; workaround "keep `middleware.ts` + `--webpack`") is **obsolete** — neither app carries middleware/proxy, and the OpenNext build deploys cleanly without it.

**Subdomain serving is a deployment concern, not a build constraint** (ticket 01) — no build change needed for two subdomains.

---

## 6. Open items & carry-forwards

**Deliberate fog (out of scope to specify now — graduates later):**
- **Future use-cases** beyond access traversal (blast-radius, stale/unused privileges, sensitive-data exposure). Use-case list is open to grow (decision 11). **First concrete candidate (ticket 05): a "compliance dashboard playbook" on the Superset sandbox surface** — a compliance/audit use-case ending in the Superset dashboard over Gold. Stays fog until the use-case list is grown.
- **Real-vs-mock boundary per component** — whether any component should ever optionally connect to a real tool. Out of scope for the MVP playground (all mocked); may re-emerge if the playground later doubles as a real control surface.

**Build carry-forwards (open for the build, not fidelity decisions):**
- **Tool-overlay presentation** — ~~modal vs. inline-expand vs. split-pane~~ **resolved (ticket 11): split-pane** — clicking a full-UI node splits the spine card into a slim left spine strip (active node still visible/pulsing) + a right tool pane, Inspector rail stays. Locked for tickets 12–16.
- **Compass node-within-node containment** — richer Compass interaction, deferred (ticket 05).
- **Playground step cadence** — ~1.1s/step in the prototype; tune at build.
- **Seeded-dataset richness** — minimal seed is sufficient; a build-time tuning knob.
- **Superset sandbox pre-run data** (surfaced by the 2026-08-23 audit) — the live store boots on `blankState()` whose Gold is empty until the flagship builds it (~step 10); `supersetDashboard` is cursor-independent and seed-ready at the pure-core level, but the pre-run dashboard renders empty charts. Decide: boot with seed-populated Gold vs. accept empty-before-run (§4.8 says "explorable before the flagship runs, from the seed").
- **Spine-graph derivation dedupe** (surfaced by ticket 20, 2026-08-23) — the directed layout now exists twice: playground `_spine/spine-graph.ts` and landing `lib/spine-graph.ts`, both derived from the same model exports but shaped for different consumers (React Flow positions/handles vs SVG polylines + scroll-state reducer; landing's also carries a no-edge-crossing guard). Lift the shared core into `packages/architecture` and repoint both apps when next touched — deliberately not done during the 19–21 parallel batch (playground was out of bounds).
- **Landing footer placeholder links** (18-era) — footer columns still carry generic placeholders (`Docs`, `Customer stories`, …); real destinations were out of scope for every ticket so far.

**Taste flow to consult during execution (decision 8):** `design-taste-frontend` (landing redesign base, anti-slop, audit-first), `high-end-visual-design` (spectacle hero + mouse-reactive motion, haptic depth, micro-interactions), `ui-ux-pro-max` (shared design-token + motion database across both apps).

**Hard rule (AGENTS.md):** this is a *modified* Next.js with breaking changes — read the relevant guide in `node_modules/next/dist/docs/` (resolved from repo root) before writing any code. Heed deprecation notices.

---

## 7. Decision provenance

| Spec section | Decided in |
|---|---|
| Shared model / `packages/architecture` | Decision 5, 10; ticket 04; `resources/` |
| Identity ("The Living Map") | Ticket 03 |
| Landing structure / hero / positioning / retire list | Decisions 6, 7, 9, 13, 14; ticket 03 |
| Playground stack / repo | Decision 5; ticket 01 |
| Playground spine + state + playbook engine | Ticket 04; decisions 4, 11, 12 |
| Mock fidelity (six tools) | Ticket 05 |
| Deployment | Decision 15; ticket 02 research; executed as ticket 22 (Cloudflare Workers/OpenNext, 2026-08-22) |

Map: `.scratch/nanosoft-digital-twin/map.md` (Decisions-so-far index). Tickets: `.scratch/nanosoft-digital-twin/issues/01..05-*.md`. Prototypes: `.scratch/nanosoft-digital-twin/prototypes/03-identity-style-tile.html`, `04-playground-spine-state.html`. Architecture sources: `resources/TrueAccess_MVP_Architecture.mermaid`, `resources/TrueAccess_Schema_to_Visualization_Sequence.mermaid`, `resources/TrueAccess_MVP_Stack_and_Licensing.md`.