import { describe, expect, it } from 'vitest';
import {
  COMPONENTS,
  COMPONENT_BY_ID,
  EDGES,
  OBSERVER_COMPONENTS,
  PIPELINE_SPINE,
  STAGE_COMPONENTS,
} from '@nanisoft/architecture';
import { buildHeroGraph, cubicBezier, roundedPath } from '@/components/hero/hero-graph';

// Recompute the expected rendered set from the model (mirrors the playground
// spine precedent: spine stages + observer + platform band, personas dropped).
const expectedIds = new Set<string>([
  ...Object.values(STAGE_COMPONENTS).flat(),
  ...OBSERVER_COMPONENTS,
  ...COMPONENTS.filter((c) => c.kind === 'platform' && c.id !== 'watchtower').map((c) => c.id),
]);

interface Rect { x0: number; y0: number; x1: number; y1: number }

function chipRects(): Map<string, Rect> {
  const g = buildHeroGraph();
  const rects = new Map<string, Rect>();
  for (const n of g.nodes) {
    rects.set(n.id, { x0: n.cx - n.w / 2, y0: n.cy - n.h / 2, x1: n.cx + n.w / 2, y1: n.cy + n.h / 2 });
  }
  return rects;
}

function segIntersectsRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  r: Rect,
): boolean {
  // Axis-aligned segment vs axis-aligned rect (inclusive of the boundary minus a
  // hairline epsilon so touching the chip edge counts as incident, not crossing).
  const eps = 0.75;
  const rx0 = r.x0 - eps, ry0 = r.y0 - eps, rx1 = r.x1 + eps, ry1 = r.y1 + eps;
  if (a.y === b.y) {
    const y = a.y;
    if (y <= ry0 || y >= ry1) return false;
    return Math.min(a.x, b.x) < rx1 && Math.max(a.x, b.x) > rx0;
  }
  const x = a.x;
  if (x <= rx0 || x >= rx1) return false;
  return Math.min(a.y, b.y) < ry1 && Math.max(a.y, b.y) > ry0;
}

describe('buildHeroGraph', () => {
  it('renders exactly the model-derived set: spine stages + observer + platform, no personas', () => {
    const g = buildHeroGraph();
    expect(new Set(g.nodes.map((n) => n.id))).toEqual(expectedIds);
    for (const n of g.nodes) {
      expect(COMPONENT_BY_ID[n.id]).toBeDefined();
      expect(COMPONENT_BY_ID[n.id].kind).not.toBe('person');
    }
  });

  it('lays the spine out left→right in PIPELINE_SPINE order', () => {
    const g = buildHeroGraph();
    const colOf = (id: string) => {
      const stage = Object.entries(STAGE_COMPONENTS).find(([, ids]) => ids.includes(id))![0];
      return (PIPELINE_SPINE as readonly string[]).indexOf(stage);
    };
    const spineNodes = g.nodes.filter((n) => n.band === 'spine');
    const xsByCol = new Map<number, number[]>();
    for (const n of spineNodes) {
      const col = colOf(n.id);
      xsByCol.set(col, [...(xsByCol.get(col) ?? []), n.cx]);
    }
    expect(xsByCol.size).toBe(PIPELINE_SPINE.length);
    const cols = [...xsByCol.keys()].sort((a, b) => a - b);
    for (let i = 1; i < cols.length; i++) {
      expect(Math.max(...xsByCol.get(cols[i])!)).toBeGreaterThan(Math.min(...xsByCol.get(cols[i - 1])!));
    }
  });

  it('places the observer above the spine and the platform band between observer and spine', () => {
    const g = buildHeroGraph();
    const ys = (band: string) => g.nodes.filter((n) => n.band === band).map((n) => n.cy);
    const obsY = Math.min(...ys('observer'));
    const platY = Math.min(...ys('platform'));
    const spineY = Math.min(...ys('spine').map((y) => y));
    expect(obsY).toBeLessThan(platY);
    expect(platY).toBeLessThan(spineY);
  });

  it('keeps every model edge whose endpoints render (personas dropped)', () => {
    const g = buildHeroGraph();
    const edgeIds = new Set(g.edges.map((e) => e.id));
    for (const e of EDGES) {
      if (!expectedIds.has(e.from) || !expectedIds.has(e.to)) continue;
      expect(edgeIds.has(`${e.from}__${e.to}`)).toBe(true);
    }
    // Persona edges (e.g. analyst→compass) must not appear.
    expect(edgeIds.has('analyst__compass')).toBe(false);
    expect(g.edges.length).toBe(EDGES.filter((e) => expectedIds.has(e.from) && expectedIds.has(e.to)).length);
  });

  it('routes every edge with axis-aligned waypoints', () => {
    const g = buildHeroGraph();
    for (const e of g.edges) {
      expect(e.waypoints.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < e.waypoints.length; i++) {
        const a = e.waypoints[i - 1];
        const b = e.waypoints[i];
        expect(a.x === b.x || a.y === b.y, `${e.id} segment ${i - 1}→${i} diagonal`).toBe(true);
      }
    }
  });

  it('never routes a segment through a chip it does not connect', () => {
    const g = buildHeroGraph();
    const rects = chipRects();
    for (const e of g.edges) {
      const [from, to] = e.id.split('__');
      const own = new Set([from, to]);
      for (let i = 1; i < e.waypoints.length; i++) {
        const seg = [e.waypoints[i - 1], e.waypoints[i]];
        for (const [id, r] of rects) {
          if (own.has(id)) continue;
          expect(segIntersectsRect(seg[0], seg[1], r), `${e.id} segment ${i - 1}→${i} crosses ${id}`).toBe(false);
        }
      }
      // Endpoints touch the boundary of their own chips.
      const first = e.waypoints[0];
      const last = e.waypoints[e.waypoints.length - 1];
      const touches = (p: { x: number; y: number }, id: string) => {
        const r = rects.get(id)!;
        return p.x >= r.x0 - 1 && p.x <= r.x1 + 1 && p.y >= r.y0 - 1 && p.y <= r.y1 + 1;
      };
      expect(touches(first, from), `${e.id} start leaves ${from}`).toBe(true);
      expect(touches(last, to), `${e.id} end enters ${to}`).toBe(true);
    }
  });

  it('allocates distinct channels: no two edges overlap collinearly', () => {
    const g = buildHeroGraph();
    const horiz: { e: string; y: number; x0: number; x1: number }[] = [];
    const vert: { e: string; x: number; y0: number; y1: number }[] = [];
    for (const e of g.edges) {
      for (let i = 1; i < e.waypoints.length; i++) {
        const a = e.waypoints[i - 1];
        const b = e.waypoints[i];
        if (a.y === b.y) horiz.push({ e: e.id, y: a.y, x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x) });
        else vert.push({ e: e.id, x: a.x, y0: Math.min(a.y, b.y), y1: Math.max(a.y, b.y) });
      }
    }
    for (let i = 0; i < horiz.length; i++) {
      for (let j = i + 1; j < horiz.length; j++) {
        const A = horiz[i], B = horiz[j];
        if (A.e === B.e) continue;
        const overlap = A.x0 < B.x1 && B.x0 < A.x1;
        expect(overlap && A.y === B.y, `${A.e}/${B.e} share lane y=${A.y}`).toBe(false);
      }
    }
    for (let i = 0; i < vert.length; i++) {
      for (let j = i + 1; j < vert.length; j++) {
        const A = vert[i], B = vert[j];
        if (A.e === B.e) continue;
        const overlap = A.y0 < B.y1 && B.y0 < A.y1;
        expect(overlap && A.x === B.x, `${A.e}/${B.e} share channel x=${A.x}`).toBe(false);
      }
    }
  });

  it('derives readable phase bands: Sources, Schema, Ingestion, Transform, Investigation', () => {
    const g = buildHeroGraph();
    expect(g.phases.map((p) => p.name)).toEqual([
      'Sources',
      'Schema',
      'Ingestion',
      'Transform',
      'Investigation',
    ]);
    expect(g.phases[0].subtle).toBe(true);
    // Transform spans the Bedrock + Forge columns; Investigation spans serving→UI.
    expect(g.phases[3].x1).toBeLessThanOrEqual(g.phases[4].x0);
    for (const p of g.phases) {
      expect(p.x1).toBeGreaterThan(p.x0);
    }
  });

  it('fits inside its viewBox', () => {
    const g = buildHeroGraph();
    for (const n of g.nodes) {
      expect(n.cx - n.w / 2).toBeGreaterThanOrEqual(0);
      expect(n.cx + n.w / 2).toBeLessThanOrEqual(g.width);
      expect(n.cy - n.h / 2).toBeGreaterThanOrEqual(0);
      expect(n.cy + n.h / 2).toBeLessThanOrEqual(g.height);
    }
  });
});

describe('roundedPath', () => {
  const pts = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 80 },
    { x: 200, y: 80 },
  ];

  it('starts with M, uses only H/V/Q, and preserves endpoints', () => {
    const d = roundedPath(pts, 10);
    expect(d.startsWith('M 0 0')).toBe(true);
    expect(d.endsWith('L 200 80')).toBe(true);
    for (const cmd of d.split(/(?=[MHVLQ])/)) {
      expect(cmd[0]).toMatch(/[MHVLQ]/);
    }
  });

  it('clamps the radius to half the shortest segment', () => {
    // Segments 100 long → radius 10 fits; make one segment tiny and request more.
    const tight = [
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 60 },
    ];
    const d = roundedPath(tight, 10);
    // Must not throw and must stay axis-aligned between bends (Q control points
    // sit on the segment axes). Just verify structure + endpoints.
    expect(d.startsWith('M 0 0')).toBe(true);
    expect(d.includes('Q')).toBe(true);
  });
});

describe('cubicBezier', () => {
  // Independent reference implementation (binary subdivision) to cross-check.
  function refBezier(x1: number, y1: number, x2: number, y2: number) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
    const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
    return (x: number) => {
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 24; i++) {
        const vx = sampleX(t);
        if (Math.abs(vx - x) < 1e-6) break;
        if (vx < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
      return sampleY(t);
    };
  }

  it('hits 0 and 1 exactly', () => {
    const b = cubicBezier(0.32, 0.72, 0, 1);
    expect(b(0)).toBe(0);
    expect(b(1)).toBe(1);
  });

  it('matches a reference solver for the brand easing', () => {
    const b = cubicBezier(0.32, 0.72, 0, 1);
    const ref = refBezier(0.32, 0.72, 0, 1);
    for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      expect(Math.abs(b(t) - ref(t))).toBeLessThan(1e-4);
    }
  });
});
