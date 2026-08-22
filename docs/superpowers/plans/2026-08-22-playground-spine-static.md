# Playground Spine (Static) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the nanisoft digital-twin architecture as a static, non-reactive directed left→right pipeline spine on the playground, sourced from `@nanisoft/architecture` and skinned in `@nanisoft/identity` tokens.

**Architecture:** A Server Component page renders a `'use client'` wrapper, which dynamically imports (`ssr: false`, inside the client wrapper) a React Flow spine. A pure, framework-agnostic `layout.ts` derives all node positions, edges, and phase bands from the model exports. React Flow renders it in static mode (all interaction off). Jade and teal are unused (jade = live wavefront only; teal = done edges — both reactive, ticket 10).

**Tech Stack:** Next.js 16.3.1 (Turbopack, app router) · React 19.2 · `@xyflow/react` v12 (new) · `@nanisoft/architecture` · `@nanisoft/identity` · pnpm monorepo.

## Global Constraints

- **Modified Next.js:** read `node_modules/.pnpm/next@16.3.1_*/node_modules/next/dist/docs/` before writing Next code. `dynamic({ ssr: false })` is forbidden inside Server Components — it lives inside the `'use client'` wrapper here.
- **Workspace imports:** `@nanisoft/architecture` and `@nanisoft/identity` are `workspace:*`. The architecture package uses extensionless relative imports internally (Turbopack rule) — do not change its source.
- **Jade rule:** `color.jade` / `role.accent` must NOT be imported or referenced anywhere in the spine. Static has no live wavefront, so the accent never appears. Teal (`color.teal`) is also unused this ticket (done-edge color, reactive).
- **No pure white/black:** the page background is bone (`#F4EFE6`), never `#FFFFFF`.
- **Fonts:** Satoshi (voice) + JetBrains Mono (data/node labels) are already wired in `apps/playground/app/layout.tsx` via `--font-satoshi` / `--font-mono`. Node codenames use `font.data` (JetBrains Mono).
- **No vitest in playground this ticket:** structural correctness is verified at render time (build + accessibility snapshot + human visual confirm), not by unit tests. `layout.ts` stays pure so ticket 10 can test it.
- **Branch:** `feat/09-playground-spine-static` (already created). Commit per task.
- **No-vision verification:** the agent has no vision — verify via `pnpm -r build`, console messages, the Playwright accessibility snapshot, and a human visual confirm.

---

## File Structure

- **Create** `apps/playground/app/spine/layout.ts` — pure `buildSpineGraph(): SpineGraph`. Imports only `@nanisoft/architecture`. No React, no React Flow. Derives node positions (columns from `PIPELINE_SPINE`, stacking from `STAGE_COMPONENTS`, observer/platform bands from `EDGES`), per-edge handle selection, and phase bands (from each `Component.phase`). Exports neutral `SpineNode`/`SpineEdge`/`SpineGraph` types + the handle-id convention.
- **Create** `apps/playground/app/spine/NodeChip.tsx` — `'use client'` custom React Flow node. Token-styled chip (JetBrains Mono codename, optional `realName`), 4 source + 4 target invisible handles. Exports `CHIP_W`/`CHIP_H`.
- **Create** `apps/playground/app/spine/PhaseBand.tsx` — `'use client'` custom React Flow node. A labeled, translucent band spanning its phase's columns.
- **Create** `apps/playground/app/spine/Spine.tsx` — `'use client'`. Imports `@xyflow/react/dist/style.css`, maps the neutral graph to React Flow nodes/edges (smoothstep + arrowhead markers, token colors), renders `<ReactFlow>` static mode.
- **Create** `apps/playground/app/playground-client.tsx` — `'use client'` wrapper. `dynamic(() => import('./spine/Spine'), { ssr: false })` + page chrome (header, version stamps, `/tokens` link, footer credit) + bone background + skeleton loading fallback.
- **Modify** `apps/playground/app/page.tsx` — Server Component; replace placeholder body with `<PlaygroundClient />`.
- **Modify** `apps/playground/app/globals.css` — set `body` background to bone (no-pure-white fix).
- **Modify** `apps/playground/package.json` — add `@xyflow/react` dependency.

---

## Task 1: Add `@xyflow/react` and fix the bone background

**Files:**
- Modify: `apps/playground/package.json`
- Modify: `apps/playground/app/globals.css`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `@xyflow/react` installed and importable by later tasks; bone `body` background so no pure-white shows through.

- [ ] **Step 1: Add the dependency**

Run from the repo root:

```bash
pnpm --filter @nanisoft/playground add @xyflow/react
```

Expected: `@xyflow/react` (v12.x) is added to `apps/playground/package.json` `dependencies` and installed. If pnpm reports a React 19 peer-dependency conflict, re-run with `pnpm --filter @nanisoft/playground add @xyflow/react --config.strict-peer-dependencies=false` and note it in the commit body.

- [ ] **Step 2: Verify the install + a clean build**

Run:

```bash
pnpm -r build
```

Expected: both apps + architecture compile green (nothing imports `@xyflow/react` yet, so this only confirms the install did not break the workspace).

- [ ] **Step 3: Set the bone background in globals.css**

In `apps/playground/app/globals.css`, the `body` rule currently has no background (defaults to white, violating the no-pure-white rule). Replace the `body` block so it reads:

```css
body {
  margin: 0;
  /* color.bone (#F4EFE6) — kept in sync with @nanisoft/identity; never pure white. */
  background: #F4EFE6;
  font-family: var(--font-satoshi), 'Satoshi', system-ui, -apple-system, sans-serif;
}
```

Leave the existing `:root { color-scheme: light; }` and the `prefers-reduced-motion` block untouched.

- [ ] **Step 4: Commit**

```bash
git add apps/playground/package.json apps/playground/app/globals.css pnpm-lock.yaml
git commit -m "feat(playground): add @xyflow/react + bone background

Dependency for the static spine (SPEC §4.1 validated tool). Sets the
body background to bone so no pure white shows through (no-pure-white
identity invariant)."
```

---

## Task 2: Pure layout module `buildSpineGraph()`

**Files:**
- Create: `apps/playground/app/spine/layout.ts`

**Interfaces:**
- Consumes: `@nanisoft/architecture` exports `COMPONENT_BY_ID`, `EDGES`, `OBSERVER_COMPONENTS`, `PHASES`, `PIPELINE_SPINE`, `STAGE_COMPONENTS`, and type `Component`.
- Produces: `buildSpineGraph(): SpineGraph` plus exported types `SpineNode`, `SpineEdge`, `SpineGraph`, `HandleSide`, and the `SOURCE_HANDLE` / `TARGET_HANDLE` id maps. Later tasks map these neutral objects into React Flow. `NodeChip.tsx` consumes `SOURCE_HANDLE` / `TARGET_HANDLE` / `HandleSide` and must render handles with exactly these ids. `Spine.tsx` consumes `buildSpineGraph` and the neutral types.

- [ ] **Step 1: Create the layout module**

Create `apps/playground/app/spine/layout.ts` with this exact content:

```ts
/**
 * Pure, framework-agnostic derivation of the playground spine graph from the
 * @nanisoft/architecture model. No React, no React Flow — just geometry + the
 * model. Spine.tsx maps these neutral objects into React Flow; ticket 10 can
 * unit-test this module, and an SVG fallback could reuse it unchanged.
 *
 * See `.scratch/nanosoft-digital-twin/SPEC.md` §1 (model) and §4.3 (spine).
 */
import {
  COMPONENT_BY_ID,
  EDGES,
  OBSERVER_COMPONENTS,
  PHASES,
  PIPELINE_SPINE,
  STAGE_COMPONENTS,
  type Component,
} from '@nanisoft/architecture';

// ── Geometry (px) ──────────────────────────────────────────────────────────────
const CHIP_W = 180;
const CHIP_H = 64;
const COL_PITCH = 260; // horizontal distance between column centers
const ROW_PITCH = 90; // vertical distance between stacked chips in a column
const COL_ORIGIN_X = 200; // x center of the first (Sources) column
const SPINE_ORIGIN_Y = 0; // y center of the first spine row
const WATCHTOWER_Y = -200; // observer band (above the spine)
const PLATFORM_Y = -110; // platform/ops band (above the spine, below Watchtower)
const PHASE_BAND_Y = 250; // phase band row (below the spine)

// ── Handle convention (shared with NodeChip.tsx) ───────────────────────────────
// 4 source + 4 target handles, one per side. NodeChip renders handles with these
// exact ids; layout picks the best pair per edge from relative position.
export type HandleSide = 'top' | 'right' | 'bottom' | 'left';
export const SOURCE_HANDLE: Record<HandleSide, string> = {
  top: 's-top',
  right: 's-right',
  bottom: 's-bottom',
  left: 's-left',
};
export const TARGET_HANDLE: Record<HandleSide, string> = {
  top: 't-top',
  right: 't-right',
  bottom: 't-bottom',
  left: 't-left',
};

// ── Neutral graph types (no React / React Flow) ─────────────────────────────────
export interface SpineNode {
  id: string;
  kind: 'chip' | 'phase';
  /** React Flow top-left position. */
  position: { x: number; y: number };
  /** Present when kind === 'chip'. */
  component?: Component;
  /** Present when kind === 'phase'. */
  phase?: { name: string; width: number; subtle: boolean };
}
export interface SpineEdge {
  id: string;
  from: string;
  to: string;
  dotted: boolean;
  sourceHandle: string;
  targetHandle: string;
}
export interface SpineGraph {
  nodes: SpineNode[];
  edges: SpineEdge[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const colX = (i: number) => COL_ORIGIN_X + i * COL_PITCH;
const topLeft = (cx: number, cy: number) => ({ x: cx - CHIP_W / 2, y: cy - CHIP_H / 2 });

/** The 19 node ids we render: spine stages + observer + platform. */
function renderedIds(): Set<string> {
  const stageIds = Object.values(STAGE_COMPONENTS).flat();
  return new Set([...stageIds, ...OBSERVER_COMPONENTS, 'anchor', 'conveyor', 'openbao']);
}

/** Pick the best source/target handle pair from the relative position of centers. */
function pickHandles(src: { cx: number; cy: number }, tgt: { cx: number; cy: number }) {
  const dx = tgt.cx - src.cx;
  const dy = tgt.cy - src.cy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      sourceHandle: dx >= 0 ? SOURCE_HANDLE.right : SOURCE_HANDLE.left,
      targetHandle: dx >= 0 ? TARGET_HANDLE.left : TARGET_HANDLE.right,
    };
  }
  return {
    sourceHandle: dy >= 0 ? SOURCE_HANDLE.bottom : SOURCE_HANDLE.top,
    targetHandle: dy >= 0 ? TARGET_HANDLE.top : TARGET_HANDLE.bottom,
  };
}

/** Mean x of a node's edge targets (used to place observer/platform nodes). */
function meanTargetX(
  targets: string[],
  centers: Map<string, { cx: number; cy: number }>,
): number | null {
  const xs = targets
    .map((id) => centers.get(id)?.cx)
    .filter((v): v is number => v !== undefined);
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

interface PhaseGroup {
  phaseId: string | null;
  name: string;
  subtle: boolean;
  fromCol: number;
  toCol: number;
}

/** Group consecutive spine columns by their components' phase (derived, not hardcoded). */
function derivePhaseGroups(): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  PIPELINE_SPINE.forEach((stage, col) => {
    const ids = STAGE_COMPONENTS[stage];
    const phaseId = ids.length ? COMPONENT_BY_ID[ids[0]].phase : null;
    const last = groups[groups.length - 1];
    if (last && last.phaseId === phaseId) {
      last.toCol = col;
    } else {
      groups.push({
        phaseId,
        name: phaseId ? (PHASES.find((p) => p.id === phaseId)?.name ?? stage) : 'Sources',
        subtle: phaseId === null,
        fromCol: col,
        toCol: col,
      });
    }
  });
  return groups;
}

// ── Build ──────────────────────────────────────────────────────────────────────
export function buildSpineGraph(): SpineGraph {
  const ids = renderedIds();
  const centers = new Map<string, { cx: number; cy: number }>();
  const nodes: SpineNode[] = [];

  const addChip = (id: string, cx: number, cy: number) => {
    centers.set(id, { cx, cy });
    nodes.push({ id, kind: 'chip', position: topLeft(cx, cy), component: COMPONENT_BY_ID[id] });
  };

  // 1. Spine stages: column = stage index, row = order within STAGE_COMPONENTS.
  PIPELINE_SPINE.forEach((stage, col) => {
    STAGE_COMPONENTS[stage].forEach((id, row) => {
      addChip(id, colX(col), SPINE_ORIGIN_Y + row * ROW_PITCH);
    });
  });

  // 2. Watchtower observer: x = mean of its observe targets.
  for (const id of OBSERVER_COMPONENTS) {
    const mean =
      meanTargetX(
        EDGES.filter((e) => e.from === id).map((e) => e.to),
        centers,
      ) ?? colX(3);
    addChip(id, mean, WATCHTOWER_Y);
  }

  // 3. Platform band: order by mean-target x, then spread evenly across the spine
  //    so the three nodes never overlap (their computed means can cluster).
  const platformIds = ['anchor', 'conveyor', 'openbao'];
  const ordered = platformIds
    .map((id) => ({
      id,
      mean:
        meanTargetX(
          EDGES.filter((e) => e.from === id).map((e) => e.to),
          centers,
        ) ?? 0,
    }))
    .sort((a, b) => a.mean - b.mean);
  const minX = colX(0);
  const maxX = colX(PIPELINE_SPINE.length - 1);
  ordered.forEach((entry, i) => {
    addChip(entry.id, minX + ((i + 1) / (ordered.length + 1)) * (maxX - minX), PLATFORM_Y);
  });

  // 4. Edges: keep only those whose both endpoints are rendered (drops the 4 persona
  //    edges); pick handles by relative position.
  const edges: SpineEdge[] = [];
  for (const e of EDGES) {
    if (!ids.has(e.from) || !ids.has(e.to)) continue;
    const s = centers.get(e.from);
    const t = centers.get(e.to);
    if (!s || !t) continue;
    const { sourceHandle, targetHandle } = pickHandles(s, t);
    edges.push({
      id: `${e.from}__${e.to}`,
      from: e.from,
      to: e.to,
      dotted: e.style === 'dotted',
      sourceHandle,
      targetHandle,
    });
  }

  // 5. Phase bands below the spine (non-interactive background nodes).
  for (const g of derivePhaseGroups()) {
    const x0 = colX(g.fromCol) - COL_PITCH / 2;
    const x1 = colX(g.toCol) + COL_PITCH / 2;
    nodes.push({
      id: `phase-${g.phaseId ?? 'sources'}`,
      kind: 'phase',
      position: { x: x0, y: PHASE_BAND_Y },
      phase: { name: g.name, width: x1 - x0, subtle: g.subtle },
    });
  }

  return { nodes, edges };
}
```

- [ ] **Step 2: Typecheck the module**

Run:

```bash
pnpm --filter @nanisoft/playground exec tsc --noEmit
```

Expected: no errors. (`layout.ts` is under `app/` so it is included by the playground `tsconfig`; it imports only `@nanisoft/architecture`, which has types.)

- [ ] **Step 3: Commit**

```bash
git add apps/playground/app/spine/layout.ts
git commit -m "feat(playground): pure buildSpineGraph layout module

Derives the 19-node spine (8 PIPELINE_SPINE stages + Watchtower +
Anchor/Conveyor/OpenBao), per-edge handle selection, and the 4 phase
bands from @nanisoft/architecture — no React Flow, no hardcoding."
```

---

## Task 3: Custom node components `NodeChip` and `PhaseBand`

**Files:**
- Create: `apps/playground/app/spine/NodeChip.tsx`
- Create: `apps/playground/app/spine/PhaseBand.tsx`

**Interfaces:**
- Consumes: `SOURCE_HANDLE`, `TARGET_HANDLE`, `HandleSide` from `./layout`; `Component` type and identity tokens from `@nanisoft/identity` / `@nanisoft/architecture`.
- Produces: `NodeChip` (React Flow node component, type key `'chip'`), `PhaseBand` (type key `'phase'`), and `CHIP_W` / `CHIP_H` constants consumed by `Spine.tsx`.

- [ ] **Step 1: Create NodeChip.tsx**

Create `apps/playground/app/spine/NodeChip.tsx`:

```tsx
'use client';

import { Handle, Position } from '@xyflow/react';
import type { Component } from '@nanisoft/architecture';
import { font, radius, surface } from '@nanisoft/identity';
import { SOURCE_HANDLE, TARGET_HANDLE, type HandleSide } from './layout';

export const CHIP_W = 180;
export const CHIP_H = 64;

const SIDES: HandleSide[] = ['top', 'right', 'bottom', 'left'];
const POS: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};
// Handles are invisible in static mode (no manual connections); they only anchor edges.
const HANDLE_STYLE = { opacity: 0, width: 1, height: 1 } as const;

/**
 * The secondary line under the codename: the real off-the-shelf product name, when
 * it differs from the codename. Custom components (Atlas/Compass/Bridge/Scout) show
 * codename only — they read as the 4 nanisoft owns (SPEC §3.5).
 */
function realNameLine(c: Component): string | null {
  if (c.kind === 'custom') return null;
  if (c.realName && c.realName !== c.codename) return c.realName;
  return null;
}

export function NodeChip({ data }: { data: { component: Component } }) {
  const c = data.component;
  const sub = realNameLine(c);
  return (
    <div
      style={{
        width: CHIP_W,
        minHeight: CHIP_H,
        borderRadius: radius.inner,
        background: surface.light.elevated,
        border: `1px solid ${surface.light.border}`,
        boxShadow: '0 1px 2px rgba(12,42,51,0.06)',
        padding: '8px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontFamily: font.data,
        color: surface.light.text,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{c.codename}</div>
      {sub && (
        <div style={{ fontSize: 11, color: surface.light.textMuted, marginTop: 2, lineHeight: 1.2 }}>
          {sub}
        </div>
      )}
      {SIDES.map((side) => (
        <Handle
          key={`s-${side}`}
          id={SOURCE_HANDLE[side]}
          type="source"
          position={POS[side]}
          style={HANDLE_STYLE}
          isConnectable={false}
        />
      ))}
      {SIDES.map((side) => (
        <Handle
          key={`t-${side}`}
          id={TARGET_HANDLE[side]}
          type="target"
          position={POS[side]}
          style={HANDLE_STYLE}
          isConnectable={false}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create PhaseBand.tsx**

Create `apps/playground/app/spine/PhaseBand.tsx`:

```tsx
'use client';

import { font, radius, surface } from '@nanisoft/identity';

/**
 * A phase band — a labeled, translucent rectangle spanning its phase's columns,
 * rendered as a non-interactive React Flow node below the spine. The 4 phases
 * (Schema/Ingestion/Transform/Investigation) use a sunken fill; the neutral
 * Sources label is subtle (transparent, dashed border). No active highlight in
 * static mode (the active phase is reactive — ticket 10).
 */
export function PhaseBand({ data }: { data: { name: string; width: number; subtle?: boolean } }) {
  const subtle = data.subtle;
  return (
    <div
      style={{
        width: data.width,
        height: 40,
        borderRadius: radius.inner,
        background: subtle ? 'transparent' : surface.light.sunken,
        border: `1px ${subtle ? 'dashed' : 'solid'} ${surface.light.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: font.data,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: surface.light.textMuted,
      }}
    >
      {data.name}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run:

```bash
pnpm --filter @nanisoft/playground exec tsc --noEmit
```

Expected: no errors. (Confirms the React Flow `Handle`/`Position` usage and identity token imports typecheck.)

- [ ] **Step 4: Commit**

```bash
git add apps/playground/app/spine/NodeChip.tsx apps/playground/app/spine/PhaseBand.tsx
git commit -m "feat(playground): NodeChip + PhaseBand custom nodes

Token-styled chip (JetBrains Mono codename, optional realName for
off-the-shelf nodes) with 4 source + 4 target invisible handles; phase
band as a non-interactive background node. Jade/teal unused (static)."
```

---

## Task 4: Spine component, client wrapper, page, and render verification

**Files:**
- Create: `apps/playground/app/spine/Spine.tsx`
- Create: `apps/playground/app/playground-client.tsx`
- Modify: `apps/playground/app/page.tsx`

**Interfaces:**
- Consumes: `buildSpineGraph` + neutral types from `./spine/layout`; `NodeChip`, `CHIP_W`, `CHIP_H` from `./spine/NodeChip`; `PhaseBand` from `./spine/PhaseBand`; identity tokens; `APP_NAME`/`ARCHITECTURE_VERSION` from `@nanisoft/architecture`.
- Produces: the rendered playground home route (`/`) showing the static spine.

- [ ] **Step 1: Create Spine.tsx**

Create `apps/playground/app/spine/Spine.tsx`:

```tsx
'use client';

import '@xyflow/react/dist/style.css';
import { useMemo } from 'react';
import {
  MarkerType,
  ReactFlow,
  type Edge as RFEdge,
  type Node as RFNode,
  type NodeTypes,
} from '@xyflow/react';
import { color, surface } from '@nanisoft/identity';
import { buildSpineGraph, type SpineEdge, type SpineNode } from './layout';
import { NodeChip, CHIP_W, CHIP_H } from './NodeChip';
import { PhaseBand } from './PhaseBand';

// Defined once at module scope (not recreated per render) — React Flow requirement.
const nodeTypes: NodeTypes = { chip: NodeChip, phase: PhaseBand };

const PETROL_SOFT = color.petrolSoft; // solid data-flow edges
const PETROL_TINT = color.petrolTint; // dotted platform/observe edges

function toRFNode(n: SpineNode): RFNode {
  if (n.kind === 'chip') {
    return {
      id: n.id,
      type: 'chip',
      position: n.position,
      data: { component: n.component },
      width: CHIP_W,
      height: CHIP_H,
      draggable: false,
      selectable: false,
      focusable: false,
    };
  }
  return {
    id: n.id,
    type: 'phase',
    position: n.position,
    data: { name: n.phase!.name, width: n.phase!.width, subtle: n.phase!.subtle },
    width: n.phase!.width,
    height: 40,
    draggable: false,
    selectable: false,
    focusable: false,
  };
}

function toRFEdge(e: SpineEdge): RFEdge {
  const stroke = e.dotted ? PETROL_TINT : PETROL_SOFT;
  return {
    id: e.id,
    source: e.from,
    target: e.to,
    type: 'smoothstep',
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
    style: {
      stroke,
      strokeWidth: 1.5,
      strokeDasharray: e.dotted ? '2 5' : undefined,
    },
    borderRadius: 12,
  };
}

export default function Spine() {
  const { nodes, edges } = useMemo(() => buildSpineGraph(), []);
  return (
    <ReactFlow
      nodes={nodes.map(toRFNode)}
      edges={edges.map(toRFEdge)}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      elementsSelectable={false}
      panOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      proOptions={{ hideAttribution: true }}
      style={{ background: surface.light.bg }}
    />
  );
}
```

- [ ] **Step 2: Create playground-client.tsx**

Create `apps/playground/app/playground-client.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { APP_NAME, ARCHITECTURE_VERSION } from '@nanisoft/architecture';
import { font, IDENTITY_VERSION, surface } from '@nanisoft/identity';

// ssr:false lives INSIDE this 'use client' wrapper (never in a Server Component) —
// the validated stack rule. Zero hydration risk for the React Flow spine.
const Spine = dynamic(() => import('./spine/Spine'), {
  ssr: false,
  loading: () => <SpineSkeleton />,
});

export default function PlaygroundClient() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: surface.light.bg,
        color: surface.light.text,
        fontFamily: font.voice,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '20px 32px 12px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{APP_NAME} playground</h1>
          <p
            style={{
              margin: '4px 0 0',
              color: surface.light.textMuted,
              fontSize: 14,
              maxWidth: '70ch',
            }}
          >
            The digital-twin architecture spine — a directed pipeline from sources to UI, with
            Watchtower observing above. Static preview; reactivity arrives soon.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'baseline',
            fontFamily: font.data,
            fontSize: 12,
            color: surface.light.textMuted,
          }}
        >
          <span>arch v{ARCHITECTURE_VERSION}</span>
          <span>identity v{IDENTITY_VERSION}</span>
          <Link href="/tokens" style={{ color: surface.light.textMuted, textDecoration: 'underline' }}>
            tokens
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '0 32px 24px', minHeight: 560 }}>
        <div
          style={{
            width: '100%',
            height: '70vh',
            minHeight: 520,
            borderRadius: 20,
            border: `1px solid ${surface.light.border}`,
            overflow: 'hidden',
          }}
        >
          <Spine />
        </div>
      </main>

      <footer
        style={{
          padding: '12px 32px 20px',
          fontFamily: font.data,
          fontSize: 11,
          color: surface.light.textMuted,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span>Built with React Flow</span>
        <span>·</span>
        <span>19 components · 4 phases · jade reserved for the live wavefront (static preview)</span>
      </footer>
    </div>
  );
}

function SpineSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: font.data,
        fontSize: 13,
        color: surface.light.textMuted,
        background: surface.light.bg,
      }}
    >
      loading spine…
    </div>
  );
}
```

- [ ] **Step 3: Replace page.tsx**

Replace the entire contents of `apps/playground/app/page.tsx` with:

```tsx
import PlaygroundClient from './playground-client';

export default function Page() {
  return <PlaygroundClient />;
}
```

- [ ] **Step 4: Full workspace build**

Run:

```bash
pnpm -r build
```

Expected: green. The playground now compiles the client wrapper + dynamic spine + React Flow. If `@xyflow/react` fails to build under Next 16 / Turbopack / React 19, stop and apply the spec's contingency: fall back to a hand-rolled SVG renderer reusing `buildSpineGraph()` (Approach A), keeping `layout.ts` unchanged. Report the failure before proceeding.

- [ ] **Step 5: Start the dev server**

Run (background):

```bash
pnpm --filter @nanisoft/playground dev
```

Wait for the "Ready" / "Local: http://localhost:3001" line before continuing.

- [ ] **Step 6: Verify console is clean**

Using the Playwright MCP tools, navigate to `http://localhost:3001` and read console messages:

- `browser_navigate` → `http://localhost:3001`
- `browser_console_messages` with `level: "error"`

Expected: **no errors and no warnings.** (A React Flow hydration/measure warning would be a failure — it means the `ssr:false` wrapper is not isolating client rendering.)

- [ ] **Step 7: Verify structural correctness via the accessibility tree**

Using Playwright, capture the accessibility snapshot and confirm the spine is structurally correct (no-vision verification):

- `browser_snapshot`
- Then `browser_find` for each of these strings and confirm a hit:
  - The 19 codenames: `Active Directory`, `Workday HR`, `SQL Server Fleet`, `Blueprint`, `DataGerry Bridge`, `Airbyte`, `Scout`, `Trailhead`, `Bedrock`, `Forge`, `Overlook`, `Superset`, `Atlas`, `OPA`, `Compass`, `Watchtower`, `Anchor`, `Conveyor`, `OpenBao`.
  - The 4 phase labels + Sources: `Schema`, `Ingestion`, `Transform`, `Investigation`, `Sources`.

Expected: all 24 strings found. (Confirms every component node is present and labelled, and the phase band shows the 4 phases.)

- [ ] **Step 8: Human visual confirm**

Ask the human to open `http://localhost:3001` and confirm the spine holds up on desktop without layout breakage (chips not overlapping, edges routed with soft 90° bends + arrowheads, phase band aligned under the columns, Watchtower + platform band above the spine). Wait for their confirmation.

- [ ] **Step 9: Stop the dev server and commit**

Stop the background dev server. Then:

```bash
git add apps/playground/app/spine/Spine.tsx apps/playground/app/playground-client.tsx apps/playground/app/page.tsx
git commit -m "feat(playground): render static spine from the model

Server page -> 'use client' wrapper -> dynamic(ssr:false) React Flow
spine, built from buildSpineGraph(). Static mode (all interaction
off). Smoothstep edges with arrowheads, token-skinned chips, 4 phase
bands. Jade/teal reserved (unused in static)."
```

---

## Self-Review (completed during planning)

**1. Spec coverage:**
- Spine renders the directed pipeline from the model → Task 2 (`buildSpineGraph` from `PIPELINE_SPINE`/`STAGE_COMPONENTS`/`EDGES`) + Task 4 (renders it). ✓
- Every component node present + labelled, phase band shows 4 phases → Task 2 (19 nodes, phase bands) + Task 4 Step 7 (a11y asserts all 19 codenames + 4 phases). ✓
- Tokens applied, JetBrains Mono node labels → Task 3 (`NodeChip` uses `font.data`, identity tokens) + Task 4 (edges/bands token-colored). ✓
- Client component + client wrapper, no `dynamic({ssr:false})` in a Server Component → Task 4 Step 2/3 (server `page.tsx` → `'use client'` wrapper → `dynamic(ssr:false)`). ✓
- Renders without errors, holds on desktop → Task 4 Steps 4–8 (build + console-clean + a11y + human visual). ✓

**2. Placeholder scan:** none — every code step contains the full file content; verification steps have exact commands and expected results.

**3. Type consistency:**
- `SOURCE_HANDLE`/`TARGET_HANDLE` ids (`s-top` etc.) are produced in `layout.ts` (Task 2) and consumed verbatim in `NodeChip.tsx` (Task 3) — match. ✓
- `SpineNode`/`SpineEdge` fields (`kind`, `position`, `component`, `phase`, `from`, `to`, `dotted`, `sourceHandle`, `targetHandle`) match between `layout.ts` (Task 2) and `Spine.tsx`'s `toRFNode`/`toRFEdge` (Task 4). ✓
- `CHIP_W`/`CHIP_H` exported from `NodeChip.tsx` (Task 3) and imported in `Spine.tsx` (Task 4). ✓
- `buildSpineGraph()` signature is identical in Task 2 (defined) and Task 4 (called). ✓