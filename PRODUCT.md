# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Security, identity & access management (IAM), and access-governance teams — the people who must answer "who can reach this system?" across an estate of directories, HR systems, databases, and applications. They evaluate tooling that can trace access paths, surface audit findings, and produce evidence instead of anecdotes.

## Product Purpose

nanisoft produces a digital twin of an organization's IT estate: a queryable graph in which directories, HR systems, databases, and applications are nodes, and memberships, grants, and activity are edges. The twin is produced — not assembled — on a real data platform: raw source data lands untouched (Bronze), records are conformed until one person is one node (Silver), and conformed facts resolve into the node/edge graph (Gold), with quality gates at every boundary and versioned layers so a past twin can be reproduced exactly. Success: a security/IAM visitor to the landing understands the mechanism and opens the playground to watch a query traverse the twin end to end.

## Positioning

"Produced, not assembled." The twin comes off a genuine lakehouse data platform — ingestion, transformation, quality gates, versioned layers — so it stays trustworthy as the estate changes; questions are answered by traversal against the graph, not by stitching exports. The platform composes sixteen off-the-shelf open-source products running unmodified (integrated through their APIs, configured, never forked) plus four components built in-house (Atlas, Compass, DataGerry Bridge, Scout). nanisoft is an open-source project, not a commercial product: it composes proven OSS and contributes back where it can. A neighboring product cannot truthfully copy the produced-not-assembled mechanism without becoming a data platform itself.

## Operating Context

- One product, four apps: `apps/landing` — nanisoft.com, the persuasion surface whose single ask is **Open the playground**; `apps/playground` — playground.nanisoft.com, the fully-mocked, in-browser tour of the twin (guided, nothing to install); `apps/docs` — docs.nanisoft.com, documentation and white papers; `apps/blog` — blog.nanisoft.com, progress reported in public.
- Evaluation path: the landing introduces, the playground demonstrates, the docs specify, the blog reports.
- Terminology that must stay consistent: Bronze/Silver/Gold layers; codename components (Trailhead, Forge, Bedrock, Overlook, Blueprint, Watchtower, Anchor, Conveyor) with the real OSS product shown beneath the codename; Atlas = traversal engine (traversal API, policy enforcement, audit log); Compass = traversal UI.
- Use-case status: access traversal is available; blast radius and stale/unused access are planned, off the same graph.
- Contact happens via a form on the about-us page. There is no pricing, sales, or demo funnel.

## Capabilities and Constraints

- Confirmed: access traversal tracing every path between a person and a sensitive product (group memberships, direct grants, inherited rights); audit views of sensitive products with no membership backing them; the same finding readable as graph edges, a table row, or a dashboard chart; policy checks in front of the graph; every answer logged.
- Planned (roadmap only, never presented as shipped): blast radius; stale and unused access.
- Constraint: off-the-shelf products run unmodified — codenames are presentation over the real product (shown verbatim), never forks.
- Constraint: the playground is fully mocked — nothing it shows is a live estate; nothing may imply production deployments at customer sites.

## Brand Commitments

- Name is lowercase **nanisoft**; tagline: "Digital twin of the IT estate."
- Voice typeface Satoshi (Fontshare, ITF Free Font License, self-hosted woff2); data typeface JetBrains Mono.
- `@nanisoft/identity` is the primitive token layer consumed by all four apps — palette, shape lock, typefaces, motion, and the shared theme-bootstrap contract and identity version; `@nanisoft/architecture` owns the component model the landing copy and hero canvas are sourced from.
- Landing copy is gated by landing tests (presence + banned-phrase checks); factual copy is not invented ad hoc.

## Evidence on Hand

- Complete, load-bearing copy dataset: `apps/landing/lib/data.ts` (problem, platform flow, use-cases, codename→OSS stack mapping, about-us content).
- Component model behind the copy: `packages/architecture` (@nanisoft/architecture).
- Runnable, fully mocked playground at playground.nanisoft.com; docs + white papers at docs.nanisoft.com; blog at blog.nanisoft.com.
- Absences that must not be fabricated: no customer testimonials, no case studies, no press, no pricing, no benchmarks, and no commercial claims of any kind (open-source project). No imagery of a real customer estate exists.

## Product Principles

1. **Produced, not assembled** — trust is earned by the data platform (quality gates, versioned layers), not by hand-stitched exports.
2. **Answer by traversal** — the graph answers by walking edges; tables and dashboards are views of that answer, not the answer.
3. **Compose, never fork** — open source runs unmodified; a codename is a layer of presentation with the real product shown beneath it.
4. **One ask** — the playground is the only conversion on the site; every section substantiates it.
5. **Evidence over anecdote** — findings, audit trails, reproducible twins; nothing is claimed that the twin cannot show.
