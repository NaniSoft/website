/**
 * Pure, framework-agnostic derivation of the landing architecture section's
 * directed pipeline from the @nanisoft/architecture model — the landing-local
 * sibling of the playground's `apps/playground/app/_spine/spine-graph.ts`.
 *
 * Why a local module instead of lifting the playground one (ticket 20 reuse
 * decision, option (b)): during the parallel 19/20/21 batch, playground app
 * code is out of bounds, so the shared derivation cannot move into
 * `packages/architecture` yet. The two consumers also want different shapes —
 * the playground emits React Flow positions/handles; this module emits centers,
 * orthogonal SVG polylines, and a scroll-state reducer. Carry-forward for the
 * coordinator: after the batch, lift the shared derivation into the package and
 * repoint both apps.
 *
 * Layout mirrors SPEC §4.3 (the playground spine): stage columns from
 * `PIPELINE_SPINE` × `STAGE_COMPONENTS`, Watchtower observing from above,
 * Anchor/Conveyor/OpenBao in a platform band, persona edges dropped, phase
 * bands below (Sources subtle + the four phases). Visual language per SPEC §2:
 * orthogonal routing with soft rounded bends and arrowheads.
 *
 * Routing is hand-tuned once against this model (validated by the vitest
 * segment-vs-chip guard) so horizontals run in clear corridors between chip
 * rows and long hauls take a bottom channel. If the model's spine changes,
 * re-check `tests/architecture-section.test.tsx` first.
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

// ── Geometry (viewBox px) ─────────────────────────────────────────────────────
export const SECTION_GEOMETRY = {
  chipW: 118,
  chipH: 46,
  colPitch: 142,
  rowPitch: 78,
  marginX: 46,
  watchtowerY: -196,
  platformY: -136,
  /** Shared channel below the spine for long horizontal hauls. */
  channelY: 118,
  bandY: 140,
  bandH: 34,
  cornerR: 10,
} as const;

export const VIEW_TOP = SECTION_GEOMETRY.watchtowerY - SECTION_GEOMETRY.chipH / 2 - 18;
export const VIEW_HEIGHT =
  SECTION_GEOMETRY.bandY + SECTION_GEOMETRY.bandH + 24 - VIEW_TOP;
export const VIEW_WIDTH =
  SECTION_GEOMETRY.marginX * 2 +
  SECTION_GEOMETRY.chipW +
  SECTION_GEOMETRY.colPitch * (PIPELINE_SPINE.length - 1);

const colX = (i: number) => SECTION_GEOMETRY.marginX + SECTION_GEOMETRY.chipW / 2 + i * SECTION_GEOMETRY.colPitch;
const HW = SECTION_GEOMETRY.chipW / 2;
const HH = SECTION_GEOMETRY.chipH / 2;

// ── Types ────────────────────────────────────────────────────────────────────
export type ElementStatus = 'idle' | 'active' | 'done';
export interface Pt {
  x: number;
  y: number;
}
export interface SectionNode {
  id: string;
  cx: number;
  cy: number;
  component: Component;
}
export interface SectionBand {
  id: string;
  name: string;
  subtle: boolean;
  x0: number;
  x1: number;
}
export interface SectionEdge {
  id: string;
  from: string;
  to: string;
  dotted: boolean;
  points: Pt[];
  d: string;
}
export interface SectionState {
  bands: Record<string, ElementStatus>;
  nodes: Record<string, ElementStatus>;
  edges: Record<string, ElementStatus>;
}

/**
 * Presentation-only row assignment inside two columns (the model order is
 * untouched): Trailhead sits centered between its two trigger targets so its
 * edges are short verticals, and Overlook takes the lower serving row next to
 * the Bedrock/Atlas traffic it participates in.
 */
const ROW_ORDER: Partial<Record<(typeof PIPELINE_SPINE)[number], string[]>> = {
  ingestion: ['airbyte', 'trailhead', 'scout'],
  serving: ['superset', 'overlook'],
};

/** Platform/ops nodes rendered above the spine (derived: platform kind minus the observer). */
const PLATFORM_IDS = Object.values(COMPONENT_BY_ID)
  .filter((c) => c.kind === 'platform' && c.id !== 'watchtower')
  .map((c) => c.id);

interface PhaseGroup {
  phaseId: string | null;
  name: string;
  fromCol: number;
  toCol: number;
}

function derivePhaseGroups(): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  PIPELINE_SPINE.forEach((stage, col) => {
    const ids = orderedStageIds(stage);
    const phaseId = ids.length ? COMPONENT_BY_ID[ids[0]].phase : null;
    const last = groups[groups.length - 1];
    if (last && last.phaseId === phaseId) {
      last.toCol = col;
    } else {
      groups.push({
        phaseId,
        name: phaseId ? (PHASES.find((p) => p.id === phaseId)?.name ?? stage) : 'Sources',
        fromCol: col,
        toCol: col,
      });
    }
  });
  return groups;
}

function orderedStageIds(stage: (typeof PIPELINE_SPINE)[number]): string[] {
  return ROW_ORDER[stage] ?? STAGE_COMPONENTS[stage];
}

/** Mean x of a node's edge targets (places the observer/platform band). */
function meanTargetX(targets: string[], centers: Map<string, number>): number | null {
  const xs = targets.map((id) => centers.get(id)).filter((v): v is number => v !== undefined);
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ── Path builder: polyline → rounded orthogonal path ──────────────────────────
function roundedPath(pts: Pt[], r: number): string {
  if (pts.length < 2) return '';
  const parts = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const next = pts[i + 1];
    const d1 = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const d2 = Math.hypot(next.x - cur.x, next.y - cur.y);
    const rr = Math.min(r, d1 / 2, d2 / 2);
    const p1 = { x: cur.x - ((cur.x - prev.x) / d1) * rr, y: cur.y - ((cur.y - prev.y) / d1) * rr };
    const p2 = { x: cur.x + ((next.x - cur.x) / d2) * rr, y: cur.y + ((next.y - cur.y) / d2) * rr };
    parts.push(`L ${p1.x} ${p1.y}`, `Q ${cur.x} ${cur.y} ${p2.x} ${p2.y}`);
  }
  const last = pts[pts.length - 1];
  parts.push(`L ${last.x} ${last.y}`);
  return parts.join(' ');
}

const pt = (x: number, y: number): Pt => ({ x, y });

// ── Build ─────────────────────────────────────────────────────────────────────
export function buildSectionGraph(): {
  nodes: SectionNode[];
  bands: SectionBand[];
  edges: SectionEdge[];
} {
  const centers = new Map<string, number>();
  const rows = new Map<string, number>();
  const nodes: SectionNode[] = [];

  // 1. Spine stages: column per stage index, rows centered within the column.
  PIPELINE_SPINE.forEach((stage, col) => {
    const ids = orderedStageIds(stage);
    ids.forEach((id, row) => {
      const cy = (row - (ids.length - 1) / 2) * SECTION_GEOMETRY.rowPitch;
      centers.set(id, colX(col));
      rows.set(id, cy);
      nodes.push({ id, cx: colX(col), cy, component: COMPONENT_BY_ID[id] });
    });
  });
  const C = (id: string) => centers.get(id)!;
  const Y = (id: string) => rows.get(id)!;

  // 2. Watchtower observer: over the mean of its observe targets, nudged half a
  //    pitch right so its drop-legs fall in the column gap, not on a chip.
  for (const id of OBSERVER_COMPONENTS) {
    const mean =
      meanTargetX(
        EDGES.filter((e) => e.from === id).map((e) => e.to),
        centers,
      ) ?? colX(3);
    const cx = Math.round(mean + SECTION_GEOMETRY.colPitch / 2);
    centers.set(id, cx);
    rows.set(id, SECTION_GEOMETRY.watchtowerY);
    nodes.push({ id, cx, cy: SECTION_GEOMETRY.watchtowerY, component: COMPONENT_BY_ID[id] });
  }

  // 3. Platform band: spread evenly across the spine (playground rule), but in
  //    an explicit slot order: OpenBao left near the ingestion stack it feeds,
  //    Anchor central (it provisions everything), Conveyor outermost-right —
  //    its deploy fan-out reaches Atlas AND Compass, so it needs the clear
  //    right margin; a mean-target sort would strand it left of Anchor and
  //    force its feeders through Anchor's chip.
  const PLATFORM_SLOT_ORDER = ['openbao', 'anchor', 'conveyor'];
  const orderedPlatform = PLATFORM_SLOT_ORDER.filter((id) => PLATFORM_IDS.includes(id));
  const minX = colX(0);
  const maxX = colX(PIPELINE_SPINE.length - 1);
  orderedPlatform.forEach((id, i) => {
    const cx = Math.round(minX + ((i + 1) / (orderedPlatform.length + 1)) * (maxX - minX));
    centers.set(id, cx);
    rows.set(id, SECTION_GEOMETRY.platformY);
    nodes.push({ id, cx, cy: SECTION_GEOMETRY.platformY, component: COMPONENT_BY_ID[id] });
  });

  // 4. Edges. Hand-routed polylines (see the routing notes at top); anchors sit
  //    on chip sides: R/L = right/left edge midpoint ± lane offsets, T/B = top/
  //    bottom with entry offsets along the edge. Numbers reference the derived
  //    centers/rows so a model-side geometry change surfaces as test failures.
  const route = (id: string, from: string, to: string, points: Pt[]): SectionEdge => ({
    id,
    from,
    to,
    dotted: false,
    points,
    d: roundedPath(points, SECTION_GEOMETRY.cornerR),
  });
  const dotted = (id: string, from: string, to: string, points: Pt[]): SectionEdge => ({
    ...route(id, from, to, points),
    dotted: true,
  });

  const edges: SectionEdge[] = [
    // Sources → Airbyte (three extraction feeds; entries staggered down
    // Airbyte's left edge).
    route('active-directory__airbyte', 'active-directory', 'airbyte', [
      pt(C('active-directory') + HW, Y('active-directory')),
      pt(C('airbyte') - HW, Y('airbyte')),
    ]),
    route('workday__airbyte', 'workday', 'airbyte', [
      pt(C('workday') + HW, Y('workday')),
      pt(313, 0),
      pt(313, Y('airbyte') + 14),
      pt(C('airbyte') - HW, Y('airbyte') + 14),
    ]),
    route('sql-fleet__airbyte', 'sql-fleet', 'airbyte', [
      pt(C('sql-fleet') + HW, Y('sql-fleet')),
      pt(328, Y('sql-fleet')),
      pt(328, Y('airbyte') - 14),
      pt(C('airbyte') - HW, Y('airbyte') - 14),
    ]),

    // Ingestion: Trailhead centered between its targets → short verticals;
    // connectors converge on Forge through clear lanes.
    route('trailhead__airbyte', 'trailhead', 'airbyte', [
      pt(C('trailhead'), Y('trailhead') - HH),
      pt(C('airbyte'), Y('airbyte') + HH),
    ]),
    route('trailhead__scout', 'trailhead', 'scout', [
      pt(C('trailhead'), Y('trailhead') + HH),
      pt(C('scout'), Y('scout') - HH),
    ]),
    route('airbyte__forge', 'airbyte', 'forge', [
      pt(C('airbyte') + HW, Y('airbyte')),
      pt(596, Y('airbyte')),
      pt(596, Y('forge') - 12),
      pt(C('forge') - HW, Y('forge') - 12),
    ]),
    route('scout__forge', 'scout', 'forge', [
      pt(C('scout') + HW, Y('scout')),
      pt(598, Y('scout')),
      pt(598, Y('forge')),
      pt(C('forge') - HW, Y('forge')),
    ]),
    route('trailhead__forge', 'trailhead', 'forge', [
      pt(C('trailhead') + 15, Y('trailhead') + HH),
      pt(C('trailhead') + 15, 35),
      pt(606, 35),
      pt(606, Y('forge') + 12),
      pt(C('forge') - HW, Y('forge') + 12),
    ]),

    // Schema: Blueprint → Bridge internal sync; Bridge fans out to Bedrock DDL
    // and (long haul) the Atlas SchemaRegistry via the bottom channel.
    route('blueprint__bridge', 'blueprint', 'bridge', [
      pt(C('blueprint'), Y('blueprint') + HH),
      pt(C('bridge'), Y('bridge') - HH),
    ]),
    route('bridge__bedrock', 'bridge', 'bedrock', [
      pt(C('bridge') + HW, Y('bridge') - 8),
      pt(460, Y('bridge') - 8),
      pt(460, Y('bedrock')),
      pt(C('bedrock') - HW, Y('bedrock')),
    ]),
    route('bridge__atlas', 'bridge', 'atlas', [
      pt(C('bridge'), Y('bridge') + HH),
      pt(C('bridge'), SECTION_GEOMETRY.channelY),
      pt(884, SECTION_GEOMETRY.channelY),
      pt(884, Y('atlas') - 25),
      pt(C('atlas') - HW, Y('atlas') - 25),
    ]),

    // Transform ↔ lakehouse.
    route('forge__bedrock', 'forge', 'bedrock', [
      pt(C('forge'), Y('forge') + HH),
      pt(C('forge'), Y('bedrock') + 8),
      pt(C('bedrock') + 20, Y('bedrock') + 8),
      pt(C('bedrock') + 20, Y('bedrock') + HH),
    ]),
    route('overlook__bedrock', 'overlook', 'bedrock', [
      pt(C('overlook') - HW, Y('overlook') - 4),
      pt(C('bedrock'), Y('overlook') - 4),
      pt(C('bedrock'), Y('bedrock') + HH),
    ]),

    // Serving → core: Overlook queries Bedrock; Superset feeds Overlook;
    // Atlas ↔ Overlook seeded-query pair on split lanes; Compass → Atlas.
    route('superset__overlook', 'superset', 'overlook', [
      pt(C('superset'), Y('superset') + HH),
      pt(C('overlook'), Y('overlook') - HH),
    ]),
    route('atlas__overlook', 'atlas', 'overlook', [
      pt(C('atlas') - HW, Y('atlas') + 10),
      pt(886, Y('atlas') + 10),
      pt(886, Y('overlook') - 10),
      pt(C('overlook') + HW, Y('overlook') - 10),
    ]),
    route('overlook__atlas', 'overlook', 'atlas', [
      pt(C('overlook') + HW, Y('overlook') + 10),
      pt(894, Y('overlook') + 10),
      pt(894, Y('atlas') + 14),
      pt(C('atlas') - HW, Y('atlas') + 14),
    ]),
    route('compass__atlas', 'compass', 'atlas', [
      pt(C('compass') - HW, Y('compass')),
      pt(1028, Y('compass')),
      pt(1028, Y('atlas') + 14),
      pt(C('atlas') + HW, Y('atlas') + 14),
    ]),

    // Core: Atlas ↔ OPA authz pair on split vertical lanes.
    route('atlas__opa', 'atlas', 'opa', [
      pt(C('atlas') - 12, Y('atlas') + HH),
      pt(C('atlas') - 12, Y('opa') - HH),
    ]),
    route('opa__atlas', 'opa', 'atlas', [
      pt(C('opa') + 12, Y('opa') - HH),
      pt(C('opa') + 12, Y('atlas') + HH),
    ]),

    // Platform / Watchtower cross-cut (dotted): hand-routed feeders that stay
    // above the spine or thread the platform/spine slot; crossings with other
    // legs are perpendicular and few by design.
    dotted('watchtower__atlas', 'watchtower', 'atlas', [
      pt(C('watchtower') - 10, Y('watchtower') + HH),
      pt(C('watchtower') - 10, -81),
      pt(955, -81),
      pt(955, Y('atlas') - HH),
    ]),
    dotted('watchtower__trailhead', 'watchtower', 'trailhead', [
      pt(C('watchtower') + 10, Y('watchtower') + HH),
      pt(C('watchtower') + 10, 49),
      pt(C('trailhead'), 49),
      pt(C('trailhead'), Y('trailhead') + HH),
    ]),
    dotted('anchor__atlas', 'anchor', 'atlas', [
      // Dives under the Conveyor chip into the sub-platform slot, then runs to
      // Atlas in the half of that slot Conveyor's own lane doesn't use.
      pt(C('anchor') + HW, Y('anchor') + 4),
      pt(770, Y('anchor') + 4),
      pt(770, -107),
      pt(985, -107),
      pt(985, Y('atlas') - HH),
    ]),
    dotted('conveyor__atlas', 'conveyor', 'atlas', [
      pt(C('conveyor') + HW, Y('conveyor')),
      pt(995, Y('conveyor')),
      pt(995, Y('atlas') - HH),
    ]),
    dotted('conveyor__compass', 'conveyor', 'compass', [
      pt(C('conveyor') + HW, Y('conveyor') - 8),
      pt(1028, Y('conveyor') - 8),
      pt(1028, -39),
      pt(C('compass'), -39),
      pt(C('compass'), Y('compass') - HH),
    ]),
    dotted('conveyor__bridge', 'conveyor', 'bridge', [
      // Clears the Anchor chip at platform level, dives into the sub-platform
      // slot west of it, then rides that slot to the Bridge's top-right entry.
      pt(C('conveyor') - HW, Y('conveyor')),
      pt(700, Y('conveyor')),
      pt(700, -107),
      pt(318, -107),
      pt(318, Y('bridge') - 8),
      pt(C('bridge') + HW, Y('bridge') - 8),
    ]),
    dotted('openbao__atlas', 'openbao', 'atlas', [
      // Rides the thread between the platform tops and Watchtower's underside —
      // its own exclusive lane — then drops down right of every platform chip.
      pt(C('openbao'), Y('openbao') - HH),
      pt(C('openbao'), -166),
      pt(925, -166),
      pt(925, Y('atlas') - HH),
    ]),
    dotted('openbao__airbyte', 'openbao', 'airbyte', [
      pt(C('openbao'), Y('openbao') + HH),
      pt(C('openbao'), -119),
      pt(C('airbyte'), -119),
      pt(C('airbyte'), Y('airbyte') - HH),
    ]),
  ];

  // 5. Phase bands below the spine (Sources subtle + the four phases).
  const bands: SectionBand[] = derivePhaseGroups().map((g) => ({
    id: `band-${g.phaseId ?? 'sources'}`,
    name: g.name,
    subtle: g.phaseId === null,
    x0: colX(g.fromCol) - SECTION_GEOMETRY.colPitch / 2,
    x1: colX(g.toCol) + SECTION_GEOMETRY.colPitch / 2,
  }));

  return { nodes, bands, edges };
}

// ── Scroll-state reducer ──────────────────────────────────────────────────────
/**
 * Pipeline position of each rendered node, derived from its column's phase
 * group: -1 = source system (feeds the pipeline but is never "active"),
 * null = cross-cutting platform/observer (stays neutral), 0..3 = the four
 * phases in spine order.
 */
function nodePositions(): Map<string, number | null> {
  const pos = new Map<string, number | null>();
  const groups = derivePhaseGroups();
  const groupPosOfCol = new Map<number, number>();
  groups.forEach((g, gi) => {
    for (let c = g.fromCol; c <= g.toCol; c++) groupPosOfCol.set(c, g.phaseId === null ? -1 : gi - 1);
  });
  PIPELINE_SPINE.forEach((stage, col) => {
    for (const id of orderedStageIds(stage)) pos.set(id, groupPosOfCol.get(col) ?? null);
  });
  for (const id of OBSERVER_COMPONENTS) pos.set(id, null);
  for (const id of PLATFORM_IDS) pos.set(id, null);
  return pos;
}

const POSITIONS = nodePositions();

const clampIndex = (i: number) => Math.max(0, Math.min(PHASES.length - 1, Math.trunc(i)));

function statusFor(pos: number | null, k: number): ElementStatus {
  if (pos === null) return 'idle';
  if (pos === -1) return k >= 1 ? 'done' : 'idle';
  return pos < k ? 'done' : pos === k ? 'active' : 'idle';
}

/**
 * State for scroll position `activeIdx` (0..3, clamped): jade = active,
 * teal = done — identical semantics to the playground spine. An edge lights
 * when its data lands: its position is the later of its endpoints'; edges
 * touching only cross-cutting nodes stay neutral.
 */
export function deriveSectionState(activeIdx: number): SectionState {
  const k = clampIndex(activeIdx);
  const bands: Record<string, ElementStatus> = {};
  derivePhaseGroups().forEach((g, gi) => {
    const id = `band-${g.phaseId ?? 'sources'}`;
    // Real-phase position within the group list: gi 0 is Sources (never active),
    // gi 1..4 are the four phases in spine order.
    bands[id] = g.phaseId === null ? 'idle' : statusFor(gi - 1, k);
  });
  const nodes: Record<string, ElementStatus> = {};
  for (const [id, pos] of POSITIONS) nodes[id] = statusFor(pos, k);
  const edges: Record<string, ElementStatus> = {};
  for (const e of EDGES) {
    const f = POSITIONS.get(e.from);
    const t = POSITIONS.get(e.to);
    if (f === undefined || t === undefined || f === null || t === null) {
      edges[`${e.from}__${e.to}`] = 'idle';
      continue;
    }
    edges[`${e.from}__${e.to}`] = statusFor(Math.max(f, t), k);
  }
  return { bands, nodes, edges };
}

// ── Continuous-sweep state reducer ─────────────────────────────────────────────
/**
 * Cached phase-group columns: the leftmost/rightmost spine column of each phase
 * band. Sources is the subtle (phaseId === null) band; the four real phases follow
 * in spine order. The wavefront sweeps from the first real phase's column to the
 * last spine column.
 */
const SWEEP_GROUPS = derivePhaseGroups();
const SWEEP_PHASE_BANDS = SWEEP_GROUPS.filter((g) => g.phaseId !== null);
const SWEEP_MIN_COL = SWEEP_PHASE_BANDS[0].fromCol;
const SWEEP_MAX_COL = SWEEP_PHASE_BANDS[SWEEP_PHASE_BANDS.length - 1].toCol;

/**
 * Each band stays `active` from its own `fromCol` until the next phase band begins
 * (so the band highlight is continuous for fractional wavefront positions, with no
 * gaps between adjacent phase columns). The final band stays active through
 * `SWEEP_MAX_COL`. Sources is subtle and never active.
 */
const SWEEP_BAND_BOUNDS = SWEEP_PHASE_BANDS.map((g, i) => ({
  id: `band-${g.phaseId}`,
  fromCol: g.fromCol,
  activeUntil:
    i + 1 < SWEEP_PHASE_BANDS.length
      ? SWEEP_PHASE_BANDS[i + 1].fromCol
      : SWEEP_MAX_COL + 1,
}));

/**
 * Per-node spine column (0..7) for staged nodes, `null` for cross-cutting
 * platform/observer nodes. Same id set as POSITIONS but keyed by column, not phase
 * group — so the jade wavefront can sweep chip-by-chip rather than phase-by-phase.
 * STAGE_COMPONENTS[stage] is the same id set per column as orderedStageIds (ROW_ORDER
 * only reorders within a column).
 */
function nodeColumns(): Map<string, number | null> {
  const cols = new Map<string, number | null>();
  PIPELINE_SPINE.forEach((stage, col) => {
    for (const id of STAGE_COMPONENTS[stage]) cols.set(id, col);
  });
  for (const id of OBSERVER_COMPONENTS) cols.set(id, null);
  for (const id of PLATFORM_IDS) cols.set(id, null);
  return cols;
}
const COLUMNS = nodeColumns();

/** Status of column `c` when the wavefront is at `w`: idle ahead, active at, done behind. */
function colStatus(c: number, w: number): ElementStatus {
  if (w < c) return 'idle';
  if (c <= w && w < c + 1) return 'active';
  return 'done';
}

/**
 * State for a continuous left-to-right wavefront at `progress` (0..1, clamped):
 * jade = the chip the front is currently passing, teal = everything behind it,
 * neutral = everything ahead. Source chips read `done` from the start (they are the
 * data origin). The front sweeps from the Schema band's first column to the
 * Investigation band's last. Cross-cutting platform/observer nodes stay neutral; an
 * edge lights when the front reaches its downstream endpoint (max endpoint column).
 *
 * End state (progress = 1): wavefront at the last spine column — band-investigation
 * active, Compass active, every earlier staged node done. This intentionally differs
 * from deriveSectionState(3), which lights the whole final phase; the reduced-motion
 * path keeps deriveSectionState(3) for the richer whole-phase static view.
 */
export function deriveSectionStateSweep(progress: number): SectionState {
  const p = Math.max(0, Math.min(1, progress));
  const w = SWEEP_MIN_COL + p * (SWEEP_MAX_COL - SWEEP_MIN_COL);
  const bands: Record<string, ElementStatus> = {};
  for (const b of SWEEP_BAND_BOUNDS) {
    bands[b.id] = w < b.fromCol ? 'idle' : w < b.activeUntil ? 'active' : 'done';
  }
  bands['band-sources'] = 'idle';
  const nodes: Record<string, ElementStatus> = {};
  for (const [id, c] of COLUMNS) {
    if (c === null) nodes[id] = 'idle';
    else nodes[id] = c < SWEEP_MIN_COL ? 'done' : colStatus(c, w);
  }
  const edges: Record<string, ElementStatus> = {};
  for (const e of EDGES) {
    const f = COLUMNS.get(e.from);
    const t = COLUMNS.get(e.to);
    if (f === undefined || t === undefined || f === null || t === null) {
      edges[`${e.from}__${e.to}`] = 'idle';
    } else {
      edges[`${e.from}__${e.to}`] = colStatus(Math.max(f, t), w);
    }
  }
  return { bands, nodes, edges };
}
