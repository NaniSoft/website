/**
 * Pure, framework-agnostic derivation of the playground spine graph from the
 * @nanisoft/architecture model. No React, no React Flow — just geometry + the
 * model. Spine.tsx maps these neutral objects into React Flow; ticket 10 can
 * unit-test this module, and an SVG fallback could reuse it unchanged.
 *
 * See `.scratch/nanosoft-digital-twin/SPEC.md` §1 (model) and §4.3 (spine).
 */
import {
  COMPONENTS,
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

/** Platform/ops nodes rendered above the spine (derived, not hardcoded):
 *  platform-kind nodes minus Watchtower (which is the observer). */
const PLATFORM_COMPONENTS: string[] = COMPONENTS.filter(
  (c) => c.kind === 'platform' && c.id !== 'watchtower',
).map((c) => c.id);

function renderedIds(): Set<string> {
  const stageIds = Object.values(STAGE_COMPONENTS).flat();
  return new Set([...stageIds, ...OBSERVER_COMPONENTS, ...PLATFORM_COMPONENTS]);
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
  const platformIds = PLATFORM_COMPONENTS;
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