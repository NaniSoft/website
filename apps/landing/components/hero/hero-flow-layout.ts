/**
 * Pure, framework-free geometry for the "estate to answer" hero traversal
 * (task 4). Two coordinate arrangements of the SAME five-stage story:
 *
 *   horizontal (desktop ≥720px): sources → Land → Conform → Graph → Serve,
 *     left → right, viewBox ≈ 1000×340;
 *   vertical (narrow <720px): the same stages stacked top → bottom, sources
 *     as a row on top, viewBox ≈ 340×620 — sized so the SVG scales to a
 *     320px-wide content box without ever widening the document.
 *
 * No React, no DOM. HeroFlow.tsx renders this and drives motion from it;
 * tests can verify the geometry mechanically.
 */

export interface FlowPoint {
  x: number;
  y: number;
}

export interface FlowSource {
  id: string;
  name: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export interface FlowStation {
  id: 'land' | 'conform' | 'graph' | 'serve';
  /** Chip face text. */
  name: string;
  /** Caption tier line (mono uppercase, e.g. BRONZE). */
  tier: string;
  /** Caption gloss line (mono uppercase, muted). */
  gloss: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** A drawn connector stroke with its midpoint (for proximity brightening). */
export interface FlowConnector {
  id: string;
  d: string;
  mx: number;
  my: number;
}

export interface FlowLayout {
  kind: 'horizontal' | 'vertical';
  width: number;
  height: number;
  sources: FlowSource[];
  stations: FlowStation[];
  /** Per-source waypoint chains (raw polylines; the pulse rides these). */
  feedWaypoints: FlowPoint[][];
  /** Station centers in travel order — the pulse's hop anchors. */
  trunkAnchors: FlowPoint[];
  /** Drawn connector strokes (arrow-marked) with midpoints. */
  feeds: FlowConnector[];
  links: FlowConnector[];
  /** Where the records-become-nodes twin glyph forms (center). */
  twin: { nodes: [FlowPoint, FlowPoint]; line: [FlowPoint, FlowPoint] };
  /** The revealed answer chip (center-based). */
  answer: { cx: number; cy: number; w: number; h: number };
  /** Arrival-ring radius. */
  ringR: number;
}

// ── Shared story copy ─────────────────────────────────────────────────────────

export const SOURCE_NAMES = ['Directory', 'HR', 'Databases'] as const;

export const STATIONS: Array<Pick<FlowStation, 'id' | 'name' | 'tier' | 'gloss'>> = [
  { id: 'land', name: 'Land', tier: 'Bronze', gloss: 'Raw lands untouched' },
  { id: 'conform', name: 'Conform', tier: 'Silver', gloss: 'One person, one node' },
  { id: 'graph', name: 'Graph', tier: 'Gold', gloss: 'Records become the twin' },
  { id: 'serve', name: 'Serve', tier: 'Atlas', gloss: 'Answers, policy-checked' },
];

export const ANSWER_QUESTION = 'Who can reach this system?';
export const ANSWER_BADGES = ['policy ✓', 'audited ✓'] as const;

// ── Horizontal arrangement (desktop) ──────────────────────────────────────────

function buildHorizontal(): FlowLayout {
  const width = 1000;
  const height = 340;

  // Three small neutral source chips, stacked at the far left.
  const sources: FlowSource[] = SOURCE_NAMES.map((name, i) => ({
    id: `src-${name.toLowerCase()}`,
    name,
    cx: 92,
    cy: 112 + i * 56,
    w: 104,
    h: 34,
  }));

  // The four in-house stage chips on one spine axis.
  const spineY = 170;
  const stationXs = [300, 470, 640, 856];
  const stations: FlowStation[] = STATIONS.map((s, i) => ({
    ...s,
    cx: stationXs[i],
    cy: spineY,
    w: 136,
    h: 46,
  }));

  // Each estate feed converges onto a shared final leg into Land's center —
  // many raw systems become one governed flow.
  const land = stations[0];
  const mergeX = land.cx - 48;
  const feedWaypoints: FlowPoint[][] = sources.map((src) => [
    { x: src.cx + src.w / 2, y: src.cy },
    { x: src.cx + src.w / 2 + 56, y: src.cy },
    { x: mergeX, y: spineY },
    { x: land.cx, y: land.cy },
  ]);

  const feeds: FlowConnector[] = feedWaypoints.map((pts, i) => ({
    id: `feed-${i}`,
    d: roundedPath(pts),
    ...midpoint(pts),
  }));

  // Short arrowed links between consecutive stations (chip edge to chip edge).
  const links: FlowConnector[] = [];
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i];
    const b = stations[i + 1];
    const pts: FlowPoint[] = [
      { x: a.cx + a.w / 2, y: a.cy },
      { x: b.cx - b.w / 2, y: b.cy },
    ];
    links.push({ id: `link-${i}`, d: roundedPath(pts), ...midpoint(pts) });
  }

  return {
    kind: 'horizontal',
    width,
    height,
    sources,
    stations,
    feedWaypoints,
    trunkAnchors: stations.map((s) => ({ x: s.cx, y: s.cy })),
    feeds,
    links,
    // The twin-forms moment floats just above the Gold chip.
    twin: {
      nodes: [
        { x: 622, y: 102 },
        { x: 658, y: 90 },
      ],
      line: [
        { x: 622, y: 102 },
        { x: 658, y: 90 },
      ],
    },
    answer: { cx: 856, cy: 283, w: 272, h: 58 },
    ringR: 30,
  };
}

// ── Vertical arrangement (narrow screens) ─────────────────────────────────────

function buildVertical(): FlowLayout {
  const width = 340;
  const height = 620;

  // Sources as one row across the top (fits a 272px content box when scaled).
  const sourceCy = 52;
  const sources: FlowSource[] = SOURCE_NAMES.map((name, i) => ({
    id: `src-${name.toLowerCase()}`,
    name,
    cx: 63 + i * 107,
    cy: sourceCy,
    w: 94,
    h: 34,
  }));

  // Land's top edge (cy 180 − half of chip height 46).
  const landTop = 157;
  const stationCys = [180, 280, 380, 476];
  const stations: FlowStation[] = STATIONS.map((s, i) => ({
    ...s,
    cx: 170,
    cy: stationCys[i],
    w: 150,
    h: 46,
  }));

  // Feeds drop from each source and fan into Land's top; staggered turn
  // heights keep the three strokes from sharing a lane.
  const turnYs = [112, 0, 124]; // middle source runs straight down
  const feedWaypoints: FlowPoint[][] = sources.map((src, i) =>
    i === 1
      ? [
          { x: src.cx, y: src.cy + src.h / 2 },
          { x: src.cx, y: landTop },
        ]
      : [
          { x: src.cx, y: src.cy + src.h / 2 },
          { x: src.cx, y: turnYs[i] },
          { x: 170, y: turnYs[i] },
          { x: 170, y: landTop },
        ],
  );

  const feeds: FlowConnector[] = feedWaypoints.map((pts, i) => ({
    id: `feed-${i}`,
    d: roundedPath(pts),
    ...midpoint(pts),
  }));

  const links: FlowConnector[] = [];
  for (let i = 0; i < stations.length - 1; i++) {
    const a = stations[i];
    const b = stations[i + 1];
    const pts: FlowPoint[] = [
      { x: a.cx, y: a.cy + a.h / 2 },
      { x: b.cx, y: b.cy - b.h / 2 },
    ];
    links.push({ id: `link-${i}`, d: roundedPath(pts), ...midpoint(pts) });
  }

  return {
    kind: 'vertical',
    width,
    height,
    sources,
    stations,
    feedWaypoints,
    trunkAnchors: stations.map((s) => ({ x: s.cx, y: s.cy })),
    feeds,
    links,
    // The twin glyph sits beside the Gold chip.
    twin: {
      nodes: [
        { x: 277, y: 372 },
        { x: 305, y: 388 },
      ],
      line: [
        { x: 277, y: 372 },
        { x: 305, y: 388 },
      ],
    },
    answer: { cx: 170, cy: 566, w: 280, h: 62 },
    ringR: 28,
  };
}

export function buildFlowLayout(kind: 'horizontal' | 'vertical'): FlowLayout {
  return kind === 'vertical' ? buildVertical() : buildHorizontal();
}

// ── Path helpers (moved from the retired hero-graph module) ───────────────────

/** Axis-aligned polyline → SVG path with soft 90° bends (quadratic corners). */
export function roundedPath(points: FlowPoint[], r = 9): string {
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
 * semantics (Newton–Raphson with binary-subdivision fallback).
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

/** Straight-line midpoint of a polyline's endpoints (proximity anchor). */
function midpoint(points: FlowPoint[]): { mx: number; my: number } {
  const first = points[0];
  const last = points[points.length - 1];
  return { mx: (first.x + last.x) / 2, my: (first.y + last.y) / 2 };
}

/** Cumulative length of a polyline (the pulse parameterizes travel by it). */
export function polylineLength(points: FlowPoint[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return len;
}

/** Point at fraction f (0..1) along a polyline's length. */
export function pointAtFraction(points: FlowPoint[], f: number): FlowPoint {
  const total = polylineLength(points);
  let remaining = Math.max(0, Math.min(1, f)) * total;
  for (let i = 1; i < points.length; i++) {
    const segLen = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (remaining <= segLen || i === points.length - 1) {
      const t = segLen === 0 ? 0 : remaining / segLen;
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
      };
    }
    remaining -= segLen;
  }
  return points[points.length - 1];
}
