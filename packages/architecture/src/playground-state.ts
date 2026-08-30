/**
 * Pure playground state engine — the lakehouse + playbook reducer.
 *
 * Framework-agnostic: no React, no Zustand, no React Flow. The Zustand store in
 * apps/playground wraps this; the reducer + status derivation are unit-tested
 * here.
 *
 * Reset semantics = blank-slate replay (design decision 1): the lakehouse starts
 * empty; the playbook builds Bronze → Silver → Gold from step 1.
 */
import { SEED, type Finding, type SeedDataset } from './dataset';
import type { PhaseId } from './types';

// re-export so consumers can import PhaseId from here if desired
export type { PhaseId };

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A single declarative playbook step. The `apply` fn mutates a *clone* of the
 * state (the reducer clones before calling it), so it can be written as plain
 * mutation code. `edge` is the spine edge that lights up for this step, or null
 * for narrate-only steps. `openTool` flags a full-UI tool to beckon (the overlay
 * itself is tickets 11–16; ticket 10 only records the flag).
 */
export interface PlaybookStep {
  n: number;
  phase: PhaseId;
  /** Component id of the acting node. */
  actor: string;
  /** Spine edge [from, to] that lights up, or null. */
  edge: [string, string] | null;
  title: string;
  desc: string;
  apply: (state: PlaygroundState) => void;
  /** Component id of a full-UI tool to beckon (ripple) at this step. */
  openTool?: string;
  /** Marks the climax / final finding step. */
  final?: boolean;
}

/**
 * The playground state = the seeded `SeedDataset` (source rows + mutable
 * lakehouse + registry + audit) plus `finding` and a `cursor` (0..22). Being a
 * structural superset of `SeedDataset` means `conformToGold(state)`,
 * `getFinding(state)`, and `detectAnomalies(state.gold, state)` accept it
 * directly — no adapter.
 */
export type PlaygroundState = SeedDataset & {
  finding: Finding | null;
  cursor: number;
};

/** Per-step reactivity status derived from the cursor (consumed by the spine). */
export interface StepStatus {
  activeNodeId: string | null;
  activeEdge: { from: string; to: string } | null;
  /** All node ids whose step has been applied (active overrides done at render). */
  doneNodeIds: Set<string>;
  /** All edge ids (`from__to`) whose step has been applied. */
  doneEdgeIds: Set<string>;
  activePhase: PhaseId | null;
}

// ── State construction ────────────────────────────────────────────────────────

/**
 * The blank-slate pre-pipeline state: sources present (ingestion reads them),
 * lakehouse / registry / audit empty, no finding, cursor 0.
 */
export function blankState(): PlaygroundState {
  return {
    products: SEED.products,
    users: SEED.users,
    groups: SEED.groups,
    groupMemberships: SEED.groupMemberships,
    viewLogs: SEED.viewLogs,
    schemaRegistry: {
      Product: {
        name: 'Product',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'owner_group', type: 'string' },
        ],
      },
    },
    bronze: { products: [], viewLogs: [] },
    silver: { extProduct: [], extViewLog: [] },
    gold: { nodes: [], edges: [] },
    auditLog: [],
    bridgedTables: [],
    finding: null,
    cursor: 0,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

/**
 * Apply one step immutably: clone the state, run the step's mutate fn, advance
 * the cursor to the step's number. Returns a fresh state; the input is untouched.
 */
export function applyStep(state: PlaygroundState, step: PlaybookStep): PlaygroundState {
  const next = structuredClone(state) as PlaygroundState;
  step.apply(next);
  next.cursor = step.n;
  return next;
}

/**
 * Replay from blankState to `target` steps. Used by reset (target 0) and import
 * (target = imported cursor). Clamps past the end.
 */
export function reduceToCursor(steps: readonly PlaybookStep[], target: number): PlaygroundState {
  let state = blankState();
  const end = Math.min(target, steps.length);
  for (let i = 0; i < end; i++) {
    state = applyStep(state, steps[i]);
  }
  return state;
}

// ── Status derivation ─────────────────────────────────────────────────────────

/**
 * Derive spine reactivity status from the cursor. `doneNodeIds`/`doneEdgeIds`
 * include every applied step's actor/edge (including the currently-active one)
 * plus each applied step's `openTool` node — a beckoned tool participates in
 * its step, so it counts as visited once the step applies even when it is not
 * the actor (Airflow/Trailhead: steps 5–7 act as `airbyte`, step 7 beckons
 * `trailhead`). The spine renders active > done > idle so an edge that is both
 * shows active. At cursor === steps.length there is no active step (run
 * complete, all done).
 */
export function deriveStatus(steps: readonly PlaybookStep[], cursor: number): StepStatus {
  const doneNodeIds = new Set<string>();
  const doneEdgeIds = new Set<string>();
  const applied = Math.min(cursor, steps.length);
  for (let i = 0; i < applied; i++) {
    const s = steps[i];
    doneNodeIds.add(s.actor);
    if (s.openTool) doneNodeIds.add(s.openTool);
    if (s.edge) doneEdgeIds.add(`${s.edge[0]}__${s.edge[1]}`);
  }
  let activeNodeId: string | null = null;
  let activeEdge: { from: string; to: string } | null = null;
  let activePhase: PhaseId | null = null;
  if (cursor > 0 && cursor < steps.length) {
    const s = steps[cursor - 1];
    activeNodeId = s.actor;
    activePhase = s.phase;
    if (s.edge) activeEdge = { from: s.edge[0], to: s.edge[1] };
  }
  return { activeNodeId, activeEdge, doneNodeIds, doneEdgeIds, activePhase };
}

// ── Export / import ───────────────────────────────────────────────────────────

/** The required top-level fields of a serialized PlaygroundState. */
const STATE_FIELDS = [
  'products', 'users', 'groups', 'groupMemberships', 'viewLogs',
  'schemaRegistry', 'bronze', 'silver', 'gold', 'auditLog', 'bridgedTables', 'finding', 'cursor',
] as const;

/** Thrown by `importState` when the JSON is not a valid PlaygroundState. */
export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateError';
  }
}

/** Serialize a state for export. */
export function exportState(state: PlaygroundState): string {
  return JSON.stringify(state);
}

/** Parse + validate an exported state. Throws `InvalidStateError` on any problem. */
export function importState(json: string): PlaygroundState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new InvalidStateError('not valid JSON');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new InvalidStateError('not an object');
  }
  const p = parsed as Record<string, unknown>;
  for (const key of STATE_FIELDS) {
    if (!(key in p)) {
      throw new InvalidStateError(`missing field: ${key}`);
    }
  }
  if (typeof p.cursor !== 'number' || p.cursor < 0) {
    throw new InvalidStateError('cursor must be a non-negative number');
  }
  if (!Array.isArray(p.auditLog)) {
    throw new InvalidStateError('auditLog must be an array');
  }
  if (!Array.isArray(p.bridgedTables)) {
    throw new InvalidStateError('bridgedTables must be an array');
  }
  return p as unknown as PlaygroundState;
}