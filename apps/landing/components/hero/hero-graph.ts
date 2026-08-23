/**
 * Pure, framework-free derivation of the landing hero DAG from the
 * @nanisoft/architecture model. No React, no DOM — just geometry + the model,
 * so `tests/hero-graph.test.ts` can verify the routing mechanically and
 * HeroDag.tsx can render it. (Learned from the playground's
 * `_spine/spine-graph.ts`; cross-app imports are forbidden, so this module
 * stands alone and tunes the layout for the hero's spectacle scale.)
 *
 * Routing contract (verified by tests, not by eye):
 *  - every waypoint segment is axis-aligned;
 *  - no segment crosses a chip it does not connect;
 *  - no two edges overlap collinearly (distinct channels / lanes);
 *  - bends are softened by `roundedPath` (soft 90° bends per SPEC §2).
 *
 * See `.scratch/nanosoft-digital-twin/SPEC.md` §2 (hero graph language) and
 * `docs/superpowers/specs/2026-08-23-landing-hero-dag-design.md`.
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

// ── Geometry (viewBox px) ─────────────────────────────────────────────────────
export interface HeroPoint {
  x: number;
  y: number;
}

export interface HeroNode {
  id: string;
  component: Component;
  /** Center x/y in viewBox coordinates. */
  cx: number;
  cy: number;
  w: number;
  h: number;
  band: 'spine' | 'observer' | 'platform';
  /** Spine column index (−1 for band nodes). */
  col: number;
}

export interface HeroEdge {
  id: string;
  from: string;
  to: string;
  dotted: boolean;
  waypoints: HeroPoint[];
}

export interface HeroPhaseBand {
  id: string;
  name: string;
  subtle: boolean;
  x0: number;
  x1: number;
}

export interface HeroGraph {
  nodes: HeroNode[];
  edges: HeroEdge[];
  phases: HeroPhaseBand[];
  width: number;
  height: number;
  nodeById: Record<string, HeroNode>;
  /** Center x of each spine column — the wavefront's hop stops. */
  columnXs: number[];
}

const WIDTH = 1280;
const HEIGHT = 560;
const COL_PITCH = 158;
const COL_X0 = 90;
const CHIP_W = 132;
const CHIP_H = 40;
const HH = CHIP_H / 2;
const HW = CHIP_W / 2;
const OBS_W = 180; // Watchtower carries a long realName — wider chip.
const SPINE_CY = 330;
const ROW_PITCH = 58;
const OBSERVER_Y = 80;
const PLATFORM_Y = 182;

/** Horizontal routing bands. Platform hauls run high (just under their band),
 *  data hauls under them, valleys below the spine, watch lanes above all. */
const PLATFORM_LANES = [210, 214, 218, 222];
const DATA_LANES = [226, 230, 234, 238, 242, 246, 250, 254];
const WATCH_LANES = [112, 120, 128, 136];
const VALLEY_LANES = [438, 444, 450, 456, 462];

/** Offset sequence for multiple connections on one chip side (top→bottom edge). */
const SIDE_SEQ = [-12, -4, 4, 12, -18, 18, 0];
const PAIR_SEQ = [-6, 6, -12, 12, 0];

const colX = (i: number) => COL_X0 + i * COL_PITCH;
/** Center of the gap between column i and i+1. */
const gapCenter = (i: number) => colX(i) + HW + (COL_PITCH - CHIP_W) / 2;

// ── Model-derived sets ────────────────────────────────────────────────────────
const PLATFORM_IDS = COMPONENTS.filter(
  (c) => c.kind === 'platform' && !OBSERVER_COMPONENTS.includes(c.id),
).map((c) => c.id);

interface RenderedIds extends Set<string> {}

function renderedIds(): RenderedIds {
  return new Set([
    ...Object.values(STAGE_COMPONENTS).flat(),
    ...OBSERVER_COMPONENTS,
    ...PLATFORM_IDS,
  ]);
}

function meanTargetX(id: string, centers: Map<string, number>): number | null {
  const xs = EDGES.filter((e) => e.from === id)
    .map((e) => centers.get(e.to))
    .filter((v): v is number => v !== undefined);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

// ── Allocators ────────────────────────────────────────────────────────────────
/** Offsets for multiple connections landing on one chip side, in claim order. */
class SideOffsets {
  private counts = new Map<string, number>();
  take(key: string): number {
    const n = this.counts.get(key) ?? 0;
    this.counts.set(key, n + 1);
    return SIDE_SEQ[Math.min(n, SIDE_SEQ.length - 1)];
  }
}

/**
 * Anti-parallel pairs on one row (e.g. Atlas ⇄ Overlook) separate vertically:
 * single edges sit on the row, pairs split to −6/+6.
 */
class PairOffsets {
  private counts = new Map<string, number>();
  take(pairKey: string): number {
    const n = this.counts.get(pairKey) ?? 0;
    this.counts.set(pairKey, n + 1);
    return PAIR_SEQ[Math.min(n, PAIR_SEQ.length - 1)];
  }
}

/** Horizontal lanes claimed with x-spans; a lane is reusable when spans are disjoint. */
class LanePool {
  private spans = new Map<number, Array<[number, number]>>();
  constructor(private pool: number[], private step: number) {}
  claim(x0: number, x1: number): number {
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    for (const y of this.pool) {
      const spans = this.spans.get(y) ?? [];
      if (!spans.some(([a, b]) => lo < b && a < hi)) {
        spans.push([lo, hi]);
        this.spans.set(y, spans);
        return y;
      }
    }
    // Extend downward-outward (callers sized pools so this is a safety valve).
    const y = this.pool[this.pool.length - 1] + this.step;
    this.pool.push(y);
    this.spans.set(y, [[lo, hi]]);
    return y;
  }
}

/** Per-gap vertical channels, spaced by demand so hairlines never coincide. */
class GapChannels {
  private demands = new Map<number, number>();
  private assignment = new Map<string, number>();
  demand(gap: number, key: string): void {
    this.demands.set(gap, (this.demands.get(gap) ?? 0) + 1);
    this.assignment.set(key, gap);
  }
  resolve(key: string): number {
    const gap = this.assignment.get(key);
    if (gap === undefined) throw new Error(`no channel demanded for ${key}`);
    const order = [...this.assignment.entries()].filter(([, g]) => g === gap);
    const n = order.length;
    const index = order.findIndex(([k]) => k === key);
    const spacing = Math.min(6, 22 / Math.max(1, n - 1));
    return gapCenter(gap) + (index - (n - 1) / 2) * spacing;
  }
}

// ── Build ─────────────────────────────────────────────────────────────────────
export function buildHeroGraph(): HeroGraph {
  const ids = renderedIds();
  const nodes: HeroNode[] = [];
  const nodeById: Record<string, HeroNode> = {};

  const addNode = (id: string, cx: number, cy: number, band: HeroNode['band'], col: number, w = CHIP_W) => {
    const component = COMPONENT_BY_ID[id];
    if (!component) throw new Error(`unknown component ${id}`);
    const node: HeroNode = { id, component, cx, cy, w, h: CHIP_H, band, col };
    nodes.push(node);
    nodeById[id] = node;
  };

  // 1. Spine stages: column per stage, rows stacked around the spine axis.
  PIPELINE_SPINE.forEach((stage, col) => {
    const stageIds = STAGE_COMPONENTS[stage];
    stageIds.forEach((id, row) => {
      addNode(id, colX(col), SPINE_CY + (row - (stageIds.length - 1) / 2) * ROW_PITCH, 'spine', col);
    });
  });

  // 2. Observer(s): centered on the mean x of their observe targets.
  const spineCenters = new Map(nodes.map((n) => [n.id, n.cx]));
  for (const id of OBSERVER_COMPONENTS) {
    const mean = meanTargetX(id, spineCenters) ?? colX(3);
    addNode(id, Math.round(mean), OBSERVER_Y, 'observer', -1, OBS_W);
  }

  // 3. Platform band: ordered by mean target x, spread evenly across the spine.
  const ordered = PLATFORM_IDS.map((id) => ({ id, mean: meanTargetX(id, spineCenters) ?? 0 })).sort(
    (a, b) => a.mean - b.mean,
  );
  ordered.forEach((entry, i) => {
    const x = colX(0) + ((i + 1) / (ordered.length + 1)) * (colX(PIPELINE_SPINE.length - 1) - colX(0));
    addNode(entry.id, Math.round(x), PLATFORM_Y, 'platform', -1);
  });

  // ── Edge routing ────────────────────────────────────────────────────────────
  //
  // Four passes, so nothing resolves against partial demand:
  //   1. classify each kept edge into a RoutePlan (claims side/pair offsets,
  //      registers gap-channel demand);
  //   2. allocate — resolve every channel (total demand per gap is now known)
  //     and claim lane spans in classification order;
  //   3. emit waypoints.
  const kept = EDGES.filter((e) => ids.has(e.from) && ids.has(e.to));
  const sides = new SideOffsets();
  const pairs = new PairOffsets();
  const gaps = new GapChannels();
  const pools = {
    platform: new LanePool([...PLATFORM_LANES], 4),
    data: new LanePool([...DATA_LANES], 4),
    watch: new LanePool([...WATCH_LANES], 8),
    valley: new LanePool([...VALLEY_LANES], 8),
  };

  type PoolId = keyof typeof pools;

  interface RoutePlan {
    allocate(): void;
    emit(): HeroPoint[];
  }

  const colOf = (n: HeroNode) => n.col;
  const siblingAbove = (n: HeroNode) =>
    nodes.some((o) => o.band === 'spine' && o.col === n.col && o.cy < n.cy - 1);
  const siblingBelow = (n: HeroNode) =>
    nodes.some((o) => o.band === 'spine' && o.col === n.col && o.cy > n.cy + 1);

  const plans: RoutePlan[] = [];

  for (const e of kept) {
    const A = nodeById[e.from];
    const B = nodeById[e.to];
    const key = `${e.from}__${e.to}`;
    const west = B.cx < A.cx; // target sits to the west (left)

    // ── Band node (observer / platform) → spine target ──────────────────────
    if (A.band !== 'spine') {
      const exitX = A.cx + sides.take(`${A.id}:B`);
      if (!siblingAbove(B)) {
        // Drop to the band's lane, haul east/west, descend into the target top.
        const entryX = B.cx + sides.take(`${B.id}:T`);
        const pool: PoolId = A.band === 'observer' ? 'watch' : 'platform';
        let lane = 0;
        plans.push({
          allocate() {
            lane = pools[pool].claim(Math.min(exitX, entryX), Math.max(exitX, entryX));
          },
          emit: () => [
            { x: exitX, y: A.cy + HH },
            { x: exitX, y: lane },
            { x: entryX, y: lane },
            { x: entryX, y: B.cy - HH },
          ],
        });
      } else {
        // Top blocked by a stacked sibling: descend beside the stack through
        // the gap on the approach side and enter the target's flank.
        const gap = west ? B.col : B.col - 1;
        gaps.demand(gap, key);
        const entryY = B.cy + sides.take(west ? `${B.id}:R` : `${B.id}:L`);
        const entryX = B.cx + (west ? HW : -HW);
        const pool: PoolId = A.band === 'observer' ? 'watch' : 'platform';
        let ch = 0;
        let lane = 0;
        plans.push({
          allocate() {
            ch = gaps.resolve(key);
            lane = pools[pool].claim(Math.min(exitX, ch), Math.max(exitX, ch));
          },
          emit: () => [
            { x: exitX, y: A.cy + HH },
            { x: exitX, y: lane },
            { x: ch, y: lane },
            { x: ch, y: entryY },
            { x: entryX, y: entryY },
          ],
        });
      }
      continue;
    }

    // ── Spine → spine ─────────────────────────────────────────────────────────
    const dCol = colOf(B) - colOf(A);

    if (dCol === 0) {
      // Same column: rail through the neighboring gap on the east side.
      const gap = Math.min(B.col, PIPELINE_SPINE.length - 2);
      gaps.demand(gap, key);
      const exitY = A.cy + sides.take(`${A.id}:R`);
      const entryY = B.cy + sides.take(`${B.id}:R`);
      let ch = 0;
      plans.push({
        allocate() {
          ch = gaps.resolve(key);
        },
        emit: () => [
          { x: A.cx + HW, y: exitY },
          { x: ch, y: exitY },
          { x: ch, y: entryY },
          { x: B.cx + HW, y: entryY },
        ],
      });
      continue;
    }

    if (Math.abs(dCol) === 1 && A.cy === B.cy) {
      // Anti-parallel pairs on one row separate vertically.
      const y = A.cy + pairs.take([e.from, e.to].sort().join('|'));
      const pts: HeroPoint[] = west
        ? [
            { x: A.cx - HW, y },
            { x: B.cx + HW, y },
          ]
        : [
            { x: A.cx + HW, y },
            { x: B.cx - HW, y },
          ];
      plans.push({ allocate() {}, emit: () => pts });
      continue;
    }

    if (Math.abs(dCol) === 1) {
      // Adjacent, different rows: jog through the gap between the columns.
      const gap = west ? colOf(B) : colOf(A);
      gaps.demand(gap, key);
      let ch = 0;
      plans.push({
        allocate() {
          ch = gaps.resolve(key);
        },
        emit: () => [
          { x: A.cx + (west ? -HW : HW), y: A.cy },
          { x: ch, y: A.cy },
          { x: ch, y: B.cy },
          { x: B.cx + (west ? HW : -HW), y: B.cy },
        ],
      });
      continue;
    }

    if (west) {
      // Backward spanning flow (e.g. Overlook queries Bedrock): valley route
      // underneath. Exits bottom unless a sibling sits directly below.
      const blocked = siblingBelow(A);
      const gap = colOf(A) - 1;
      gaps.demand(gap, key);
      const exitY = A.cy + (blocked ? sides.take(`${A.id}:L`) : 0);
      const exitX = blocked ? A.cx - HW : A.cx;
      const exitSideY = A.cy + HH;
      let ch = 0;
      let lane = 0;
      plans.push({
        allocate() {
          ch = gaps.resolve(key);
          lane = pools.valley.claim(Math.min(ch, B.cx), Math.max(ch, B.cx));
        },
        emit: () =>
          blocked
            ? [
                { x: exitX, y: exitY },
                { x: ch, y: exitY },
                { x: ch, y: lane },
                { x: B.cx, y: lane },
                { x: B.cx, y: B.cy + HH },
              ]
            : [
                { x: exitX, y: exitSideY },
                { x: exitX, y: lane },
                { x: B.cx, y: lane },
                { x: B.cx, y: B.cy + HH },
              ],
      });
      continue;
    }

    // Forward spanning: sky route over the intermediate columns.
    {
      const gap = colOf(A);
      gaps.demand(gap, key);
      const exitY = A.cy + sides.take(`${A.id}:R`);
      const entryX = B.cx + sides.take(`${B.id}:T`);
      let ch = 0;
      let lane = 0;
      plans.push({
        allocate() {
          ch = gaps.resolve(key);
          lane = pools.data.claim(Math.min(ch, entryX), Math.max(ch, entryX));
        },
        emit: () => [
          { x: A.cx + HW, y: exitY },
          { x: ch, y: exitY },
          { x: ch, y: lane },
          { x: entryX, y: lane },
          { x: entryX, y: B.cy - HH },
        ],
      });
    }
  }

  for (const plan of plans) plan.allocate();

  const edges: HeroEdge[] = plans.map((plan, i) => ({
    id: `${kept[i].from}__${kept[i].to}`,
    from: kept[i].from,
    to: kept[i].to,
    dotted: kept[i].style === 'dotted',
    waypoints: plan.emit(),
  }));

  // ── Phase bands: consecutive spine columns grouped by their phase ───────────
  const phases: HeroPhaseBand[] = [];
  PIPELINE_SPINE.forEach((stage, col) => {
    const firstId = STAGE_COMPONENTS[stage][0];
    const phaseId = firstId ? COMPONENT_BY_ID[firstId].phase : null;
    const name = phaseId ? (PHASES.find((p) => p.id === phaseId)?.name ?? stage) : 'Sources';
    const last = phases[phases.length - 1];
    if (last && last.id === (phaseId ?? 'sources')) {
      last.x1 = colX(col) + HW + 13;
    } else {
      phases.push({
        id: phaseId ?? 'sources',
        name,
        subtle: phaseId === null,
        x0: colX(col) - HW - 13,
        x1: colX(col) + HW + 13,
      });
    }
  });

  return {
    nodes,
    edges,
    phases,
    width: WIDTH,
    height: HEIGHT,
    nodeById,
    columnXs: PIPELINE_SPINE.map((_, i) => colX(i)),
  };
}

// ── Path helpers ──────────────────────────────────────────────────────────────

/** Axis-aligned polyline → SVG path with soft 90° bends (quadratic corners). */
export function roundedPath(points: HeroPoint[], r = 9): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const v = points[i];
    const next = points[i + 1];
    const inLen = Math.hypot(v.x - prev.x, v.y - prev.y);
    const outLen = Math.hypot(next.x - v.x, next.y - v.y);
    const rr = Math.min(r, inLen / 2, outLen / 2);
    const inX = (v.x - prev.x) / (inLen || 1);
    const inY = (v.y - prev.y) / (inLen || 1);
    const outX = (next.x - v.x) / (outLen || 1);
    const outY = (next.y - v.y) / (outLen || 1);
    const p1 = { x: v.x - inX * rr, y: v.y - inY * rr };
    const p2 = { x: v.x + outX * rr, y: v.y + outY * rr };
    d += ` L ${p1.x} ${p1.y} Q ${v.x} ${v.y} ${p2.x} ${p2.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Cubic-bezier(x1,y1,x2,y2) easing solver — the brand curve
 * `cubic-bezier(.32,.72,0,1)` drives JS-side animation with the exact CSS
 * semantics (Newton–Raphson with binary-subdivision fallback, as in the
 * canonical CSS bezier implementation).
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) return sampleY(t);
      const d = sampleDX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 24; i++) {
      const err = sampleX(t) - x;
      if (Math.abs(err) < 1e-6) break;
      if (err < 0) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sampleY(t);
  };
}
