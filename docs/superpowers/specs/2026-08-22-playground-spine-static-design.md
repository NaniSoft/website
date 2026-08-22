# Playground spine — static, rendered from the model (ticket 09)

> **Status:** approved design (2026-08-22). Branch: `feat/09-playground-spine-static`.
> **Source ticket:** `.scratch/nanosoft-digital-twin/issues/09-playground-spine-static.md`.
> **Spec basis:** `.scratch/nanosoft-digital-twin/SPEC.md` §1 (model), §2 (identity), §4.1/§4.3 (playground stack + spine).

## Goal

The first end-to-end render of the digital-twin architecture on the playground: the
directed left→right pipeline spine, drawn from `@nanisoft/architecture` (ticket 07
model), every component shown, phase band present, skinned in `@nanisoft/identity`
tokens (ticket 08). **Static and non-reactive** — reactivity (node lighting, the jade
wavefront, edge animation, playbook state) is ticket 10.

## Decisions (locked during brainstorm)

1. **Layout / edge routing:** `@xyflow/react` (React Flow v12) — the SPEC §4.1 validated
   spine tool. Deterministic column positions from the model; React Flow renders nodes
   and routes edges. Static mode (all interaction off). Forward-compatible: ticket 10
   enables reactivity on the same graph, so this work is not thrown away.
2. **Node scope:** 19 nodes — the 8 `PIPELINE_SPINE` stages (15 components) + Watchtower
   (observer) + Anchor/Conveyor/OpenBao (platform band). The 4 human personas (Schema
   Author, Analyst, Compliance/Audit, Platform Engineer) are **excluded** — they are
   drivers, not architecture components, and would clutter a spine diagram. This matches
   "every component node present" (components, not people) and SPEC §4.10, which calls
   Anchor/Conveyor/OpenBao "reactive nodes on the spine."

## Architecture & file layout

Validated stack rule, made concrete (server page → client wrapper; `dynamic({ssr:false})`
only inside the client wrapper, never in a Server Component):

- `apps/playground/app/page.tsx` — **Server Component.** Replaces the placeholder.
  Renders `<PlaygroundClient />` and nothing else.
- `apps/playground/app/playground-client.tsx` — **`'use client'` wrapper.** Loads the
  spine via `dynamic(() => import('./spine/Spine'), { ssr: false })` (zero hydration
  risk; `ssr:false` lives inside the client wrapper → compliant). Holds the page chrome:
  header ("nanisoft playground"), architecture/identity version stamps, `/tokens` link,
  footer with a "Built with React Flow" credit. Bone background. A token-styled skeleton
  is rendered as the dynamic `loading` fallback.
- `apps/playground/app/spine/Spine.tsx` — **`'use client'`.** Imports
  `@xyflow/react/dist/style.css`, calls `buildSpineGraph()`, registers custom node types,
  and renders `<ReactFlow>` in static mode with `fitView`.
- `apps/playground/app/spine/layout.ts` — **pure, framework-agnostic**
  `buildSpineGraph(): { nodes, edges, phaseBands }`. All positions derived from the model
  exports. No React import. (Stays pure so ticket 10 can unit-test it.)
- `apps/playground/app/spine/NodeChip.tsx` — custom React Flow node (the chip).
- `apps/playground/app/spine/PhaseBand.tsx` — custom React Flow node (the phase band).
- `apps/playground/app/globals.css` — set `body` background to bone (fixes the
  no-pure-white invariant app-wide) + small overrides for React Flow defaults to match
  tokens.

New dependency: `@xyflow/react` (v12, React 19-compatible) added to
`apps/playground/package.json`. **No** zustand, **no** `motion` — those arrive in
ticket 10.

## Layout derivation (from the model, not hardcoded)

`buildSpineGraph()` in `layout.ts`:

1. **Columns** = `PIPELINE_SPINE` index × 260px pitch. Within a column, the
   `STAGE_COMPONENTS[stage]` array order stacks nodes vertically at 90px pitch.
2. **Watchtower + platform nodes** (not in any `STAGE_COMPONENTS` entry) get
   `x = mean(x of their edge targets)` (derived from `EDGES`) and a fixed band `y`
   above the spine: Watchtower in the top observer band, Anchor/Conveyor/OpenBao in a
   second platform band directly below it. Horizontal placement is therefore derived
   from the model's edges, not hand-set.
3. **Phase bands** derived generically: group consecutive spine columns by their
   components' `phase` field.
   - Schema → column 1 (schema stage).
   - Ingestion → column 2 (ingestion stage).
   - Transform → columns 3–4 (bedrock + transform stages).
   - Investigation → columns 5–7 (serving + core + ui stages).
   - Sources → column 0 (phase `null`); rendered as a neutral label, not one of the 4
     phases.
   No hardcoded stage→phase map — the grouping comes from each `Component.phase`.

## Node chips & tokens

Light surface (bone), consistent with the existing `/tokens` preview.

- Chip shape: `radius.inner` (12) corners, `boneElev` fill, `boneSunken` border, `ink`
  text. **JetBrains Mono** (`font.data`) for the codename label.
- **custom** (Atlas, Compass, Bridge, Scout): codename only — they read as the 4
  components nanisoft owns (SPEC §3.5).
- **offshelf** (Blueprint, Trailhead, Forge, Bedrock, Overlook, Superset, OPA, Airbyte):
  codename (bold) + `realName` muted underneath (e.g. "Blueprint · DataGerry").
- **platform / source**: codename + realName.

**Jade is not imported anywhere in the spine.** Static has no live/active wavefront, so
the single locked accent never appears — enforced by construction (no `color.jade` /
`role.accent` reference in any spine module). **Teal is also unused** in static — teal
is the "done edge" color, a reactive-state concept that arrives in ticket 10. Chips and
edges use only petrol / petrolSoft / petrolTint on bone.

## Edges

From `EDGES`, filtered to the 19-node set (drops the 4 persona edges:
`schema-author→blueprint`, `analyst→compass`, `compliance→superset`,
`platform-engineer→atlas`; keeps all solid data-flow edges and the dotted
Watchtower/Anchor/Conveyor/OpenBao cross-cuts).

- `type: 'smoothstep'`, `borderRadius: 12` → the SPEC §2 "orthogonal routing with soft
  90° bends"; `markerEnd` arrowheads.
- Solid (data flow): stroke `petrolSoft`.
- Dotted (provision / deploy / secrets / observe): stroke `petrolTint` +
  `strokeDasharray`.
- No edge labels in static (the directed flow is the point; labels arrive on the active
  edge in ticket 10).
- Back-edges (Atlas↔Overlook, Atlas↔OPA) route naturally via React Flow.

## Phase band

4 phase bands (Schema / Ingestion / Transform / Investigation) + a neutral Sources
label, rendered as **non-interactive background nodes** inside the flow, in their own
y-row below the spine. In-flow placement keeps them aligned under `fitView` regardless of
scale. Translucent `boneSunken` fill, hairline border, phase name in mono uppercase
letterspaced — the same treatment as the `/tokens` section labels. **No active
highlight** — the active phase is a reactive concept (ticket 10).

## React Flow static mode

`nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`,
`panOnDrag={false}`, `zoomOnScroll={false}`, `zoomOnPinch={false}`,
`zoomOnDoubleClick={false}`, `fitView` with `fitViewOptions={{ padding: 0.2 }}`.
`proOptions={{ hideAttribution: true }}` with a "Built with React Flow" line in the
footer (the ethical equivalent). Container: `width: 100%`, `height: 70vh`,
`minHeight: 560px` so the canvas has a box on desktop.

`nodeTypes` (`{ chip: NodeChip, phase: PhaseBand }`) defined once at module scope (not
recreated per render) to avoid React Flow's new-object warning.

## Verification (no-vision workflow)

The agent has no vision; visual artifacts are verified through text, the accessibility
tree, live JS state, and a human visual confirm.

- `pnpm -r build` green — playground compiles with React Flow + the client wrapper.
- `pnpm -r test` stays green — unchanged. **No vitest is added to the playground in this
  ticket** (scope-tight); `layout.ts` stays pure so ticket 10 can test it. Structural
  correctness is verified at render time instead (below).
- Render check on `next dev` (:3001):
  - **Console messages clean** — no errors/warnings.
  - **Accessibility snapshot** asserts all 19 codenames are present and the 4 phase
    labels (Schema / Ingestion / Transform / Investigation) are present.
  - Human visually confirms the spine holds on desktop without layout breakage.
- **Contingency:** if `@xyflow/react` will not build under Next 16 / Turbopack / React 19,
  fall back to hand-rolled SVG (the originally-considered Approach A), reusing the same
  pure `layout.ts`. The layout module is deliberately framework-agnostic so this swap is
  cheap.

## Acceptance criteria mapping (from the ticket)

| Ticket criterion | How this design satisfies it |
|---|---|
| Spine renders the full directed pipeline (Sources → … → UI) with Watchtower above, sourced from the model (not hardcoded) | `buildSpineGraph()` reads `PIPELINE_SPINE` / `STAGE_COMPONENTS` / `OBSERVER_COMPONENTS` / `EDGES`; React Flow renders it. |
| Every component node present and labelled (codenames); phase band shows Schema/Ingestion/Transform/Investigation | 19 nodes, codename in JetBrains Mono; 4 phase bands derived from `Component.phase`. |
| Nanisoft tokens applied (node chips, edges, phase band); JetBrains Mono for node labels | All chips/edges/bands styled from `@nanisoft/identity` tokens; `font.data` for codenames. |
| Client component with a client wrapper; no `dynamic({ssr:false})` inside a Server Component | Server `page.tsx` → `'use client'` `playground-client.tsx` → `dynamic(ssr:false)` of `Spine.tsx`. |
| Renders without errors; holds up on desktop without layout breakage | `pnpm -r build` + dev render + console-clean + a11y snapshot + human visual confirm. |

## Out of scope (later tickets)

- Reactivity: node lighting, the jade wavefront, edge animation, playbook state, the
  state inspector (ticket 10).
- Tool overlays / mock fidelity (tickets 11–16).
- Personas on the canvas (excluded from the spine; not re-added unless a later ticket
  calls for it).