# Ticket 21 — Landing narrative sections · Design

> Date: 2026-08-23 · Branch: `feat/21-narrative-sections` · Owner surface: `apps/landing/lib/data.ts`, `lib/types.ts` (data-only consumers), the five kept section components (`Problem`, `Platform`, `UseCases`, `Integrations`, `FinalCTA`) and their tests.
> Not touched: `Hero.tsx`, TopNav/Footer/Wordmark/PillButton, theme system, `app/page.tsx`, ArchitectureSection (Agent 2), playground, packages.

## 1. Beat → section mapping

Shared `page.tsx` fixes the render order; Agent 2 inserts ArchitectureSection into the second slot pair. Resulting page = exactly SPEC §3's narrative:

| Page slot | Section (id kept) | Narrative beat |
|---|---|---|
| Hero | (ticket 19) | — |
| `Problem` | id=`problem` | **What it is** — digital twin of the org's IT estate via a multi-component datalake; see how systems are connected and how they actually work |
| `Platform` | id=`platform` | **How we build it**, part one — the datalake path (Bronze → Silver → Gold → serve); feeds the reader down into… |
| *ArchitectureSection* | *(Agent 2)* | **How we build it**, part two — the full component spine |
| `UseCases` | id=`use-cases` | **What it unlocks** — flagship named (access traversal / Sensitive Product View Audit); more coming |
| `Integrations` | id=`integrations` | **Our approach** — buy-first / compose-OSS: 16 off-the-shelf + 4 custom (own only Atlas + Compass + the Bridge + Scout) |
| `FinalCTA` | id=`final-cta` | **Try it in the playground** — primary CTA → `https://playground.nanisoft.com` |

TopNav anchors (`#platform` `#use-cases` `#integrations` `#final-cta`) all survive because ids are unchanged.

## 2. Copy deck (plain, confident, never breathless)

All collection copy lives in `lib/data.ts`; headings/sublines stay inline in components (house pattern).

### Problem — "What it is"
- h2: **nanisoft builds a digital twin of your IT estate.**
- sub: Systems, people, and permissions modeled in one place, so you can see how your estate is connected — and how it actually works.
- Cards (icon/title/body):
  1. `graph` · **Everything in one graph** · Directories, HR systems, databases, and applications become nodes. Memberships, grants, and activity become edges. The estate finally agrees with itself.
  2. `stack` · **Produced, not assembled** · The twin comes off a real data platform — ingestion, transformation, quality gates, versioned layers — so it stays trustworthy as the estate changes.
  3. `magnify` · **Built for questions** · Who can reach this system? What did access look like last quarter? The twin answers by traversal, not stitched exports. Access is the first use-case; more are coming.

### Platform — "How we build it" (part one)
- h2: **Built like a lakehouse — because it is one.**
- sub: Every fact lands raw, gets conformed, and is promoted layer by layer until it becomes part of the twin.
- Flow (step tags `01–04` stay mono):
  1. **Land** · Raw source data lands untouched in Bronze. Nothing is interpreted at the door.
  2. **Conform** · Records are cleaned, joined, and resolved until identities are stable. One person, one node — that's Silver.
  3. **Graph** · Conformed facts resolve into Gold: nodes and edges. This graph is the twin.
  4. **Serve** · Atlas serves traversals, checks every question against policy, and writes an audit trail.
- Features (six properties of the build; codenames introduced naturally):
  1. **Orchestrated end to end** · Trailhead sequences every move — ingestion, promotion, maintenance — as reviewable DAGs.
  2. **Versioned at every layer** · The lakehouse catalog keeps history, so last quarter's twin can be reproduced exactly.
  3. **Promoted only when clean** · Quality gates decide what advances. Bad input stops at the boundary and never reaches the twin.
  4. **Watched continuously** · Watchtower observes every component — pipelines, queries, engine — from one place.
  5. **Governed by default** · Policy checks sit in front of the graph, and every answer is logged.
  6. **Declared as code** · Anchor declares the infrastructure; Conveyor delivers it. No snowflake deployments.
- Handoff paragraph after the grids: That's the data path. The next section walks the full pipeline — every component, from source systems to Compass.

### UseCases — "What it unlocks"
- h2: **What it unlocks**
- sub: One twin, many questions. Today, the flagship is access.
- Cards (`status`: `available` | `planned`; teal status tag, jade untouched):
  1. `available` · tag **Flagship** · illus `graph` · **Access traversal — Sensitive Product View Audit**
     - Trace every path between a person and a sensitive product: group memberships, direct grants, inherited rights.
     - The audit surfaces views of sensitive products with no membership backing them. Each one is a finding.
     - Read the same finding three ways — as graph edges, as a table row, as a dashboard chart.
  2. `planned` · illus `shield` · **Blast radius**
     - Ask what an account, a key, or a host can actually reach from where it sits.
     - Rehearse containment before you need it, against the graph you already have.
     - Next on the roadmap — designed on the twin, no new connectors.
  3. `planned` · illus `clock` · **Stale and unused access**
     - Find memberships nobody remembers granting and privileges nobody has exercised.
     - Feed clean-up work with evidence instead of anecdotes.
     - Planned alongside blast radius; both fall out of the same graph.
- Footer line: More use-cases are coming — small utilities, composed largely from open-source parts. *See the flagship run today in the playground.* (link → playground)
- Dead `href="#"` per-card links removed.

### Integrations — "Our approach"
- h2: **Buy first. Build only what's ours.**
- sub: Sixteen proven open-source products carry the platform. We build four things ourselves — the parts where nanisoft differs.
- Grid (16, `name` + `role`): Trailhead/Orchestration · Forge/Transform · Bedrock/Lakehouse · Overlook/Query · Blueprint/Schema · Watchtower/Observability · Anchor/IaC · Conveyor/GitOps · Airbyte/Ingestion · Zingg/Entity resolution · Great Expectations/Quality gates · Superset/Dashboards · OPA/Authorization · OpenBao/Secrets · CloudNativePG/Databases · Valkey/Cache.
- Closing line under grid: Every off-the-shelf product runs unmodified — integrated through its APIs, configured, never forked. (True to the stack doc's license discipline.)
- "Built in-house" strip (4): **Atlas** — the core engine: traversal API, policy enforcement, audit log. **Compass** — the traversal UI: explore the twin as a graph. **DataGerry Bridge** — glue that syncs authored schema into the lakehouse and the engine. **Scout** — connectors for internal systems no catalog covers. Each card carries a small mono `CUSTOM` label (JetBrains Mono data-shape rule) so the built-vs-composed split reads at a glance.
- "+40 more" dashed tile removed.

### FinalCTA — "Try it in the playground"
- h2: **Try it in the playground.**
- primary: `Open the playground` → `https://playground.nanisoft.com` (external → `target="_blank"` + `rel="noopener noreferrer"`)
- secondary (kept): `Request a demo` → `mailto:hello@nanisoft.com` (the old href `/api/demo-request` was a GET link onto a POST-only stub)
- footnote: In-browser, guided, and fully mocked — nothing to install.

## 3. Types (`lib/types.ts`) — sole consumer is `lib/data.ts`

- Remove `Integration`; add `StackProduct { name; role }` (+ literal union of the 16 roles) and `CustomComponent { name; blurb }`.
- `UseCase` gains `status: 'available' | 'planned'`; bullets stay a 3-tuple; illustration union unchanged.

## 4. Tests

- `tests/data.test.ts`: keep BRAND/de-brand/footer/hero-cta assertions; new: exactly 16 stack products with roles; built-in-house names exactly `['Atlas','Compass','DataGerry Bridge','Scout']`; 3 use cases with flagship first carrying `Sensitive Product View Audit`; `FINAL_CTA.primary.href === 'https://playground.nanisoft.com'`.
- `tests/page.test.tsx`: keep shell/five-ids/retired-negative tests; add: playground CTA link rendered with the external href; flagship name rendered; approach framing rendered ("Sixteen"); no `a[href="#"]` inside `#use-cases`/`#final-cta` (Footer's dead links are out of scope).
- `tests/a11y.test.tsx`: unchanged; must stay green (new links get real text; tags are text; covers remain aria-hidden).

## 5. Constraints honored

- Tone §2: no hype, no invented metrics in owned copy ("cut audit prep from weeks to hours" and "50+ connectors" die; testimonial class content already retired in 18).
- Jade locked to live/active only → status tags use teal/muted; decorative washes unchanged.
- Shape lock via existing antd tokens (`borderRadiusLG:20`) + `--radius-inner` avatars; buttons stay `PillButton`.
- JetBrains Mono: step tags keep `.mono`; no new data-shaped elements.
- Motion: none added; static narrative sections (motion lives in hero/architecture).
- AGENTS.md: modified Next.js docs read (`link.md`, client-components guide scan) — `Link`/external-anchor behavior unchanged for my surface.

## 6. Coordinator notes

1. **HERO invented metrics live in my file but not my surface:** `HERO.metrics` ("12 B events/day", "47 M entities", "<200 ms p95") and `trustCaption`/`CUSTOMER_LOGOS` ("Trusted by…") are consumed by `Hero.tsx`, which ticket 19 owns and which `.map()`s over `HERO.metrics`. Removing them from `data.ts` would break a file outside my boundary. Ticket 19 should strip them during the hero rebuild.
2. **Platform kept, repurposed** per brief — it becomes the datalake-path prologue to ArchitectureSection. Not deleted, not a second architecture section: no topology, no spine, only the Bronze→Silver→Gold data journey + cross-cutting properties.
3. TopNav nav labels ("Platform", "Integrations") are ticket 18's surface; ids still resolve, but labels could later read "What it is"/"Our approach" if wanted.
4. **SPEC §1 reconciliation needed:** §1 lists "Blueprint = DataGerry — schema definition" under *Custom (4)*, while ticket 21's criterion ("own only Atlas + Compass + the Bridge + Scout"), map.md decision 10, and the stack doc all treat Blueprint/DataGerry as off-the-shelf (the custom piece is the *DataGerry Bridge* glue). The landing follows the latter; amend §1's Custom list to Atlas / Compass / DataGerry Bridge / Scout.
5. Review-ratified judgement calls: `StackRole` kept as a literal union (strict-TS culture over decoupling); `{label, href}` left untyped as `CtaLink` (three usages, YAGNI); copy-pinning data tests kept per house "criteria proven by tests" practice.
