# Lakehouse State + Playbook Engine + Reactive Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the playground simulator's heart — a pure lakehouse state + declarative 22-step playbook engine in `packages/architecture`, and a thin Zustand shell that makes the 09 static spine reactive (jade active node + flowing edge, teal done, phase band tracking) with an inspector + controls.

**Architecture:** The pure domain core (`PlaygroundState`, `PlaybookStep`, `applyStep`, `reduceToCursor`, `deriveStatus`, `exportState`/`importState`, the 22-step flagship) lives in `packages/architecture` — framework-agnostic, unit-tested with vitest. `apps/playground` adds a thin Zustand store wrapping the core, a controlled React Flow spine that reads per-node/edge status from the store, an inspector, and controls. Motion is CSS keyframes generated from `@nanisoft/identity`'s `motion` variants (no `motion` library). 09's pure `buildSpineGraph()` is kept; only its hardcoded platform-id list is fixed.

**Tech Stack:** Next.js 16.3.1 (Turbopack, app router) · React 19.2 · `@xyflow/react` v12 · `zustand` (new) · `@nanisoft/architecture` · `@nanisoft/identity` · vitest 4 (architecture only) · pnpm monorepo.

## Global Constraints

- **Modified Next.js (AGENTS.md):** read `node_modules/.pnpm/next@16.3.1_*/node_modules/next/dist/docs/` before writing Next code. `dynamic({ ssr: false })` is forbidden inside Server Components — it stays inside the `'use client'` wrapper (`playground-client.tsx`), exactly as 09 did.
- **Pure core boundary:** `packages/architecture/src/playground-state.ts` and `playbook.ts` must NOT import React, Next, Zustand, or React Flow. They import only from sibling architecture modules.
- **Jade rule:** `color.jade` / `role.accent` is reserved for the **live/active** state only — the active node ring, the active (flowing) edge, the active phase band, the narrative "now" marker. Never decorative, never on a count. **Teal** = done (done node ring, done edge, done phase band, done step-list rows).
- **No pure white/black:** backgrounds are bone (`#F4EFE6`); the existing `globals.css` `body` rule already enforces this.
- **Fonts:** Satoshi (`--font-satoshi`) + JetBrains Mono (`--font-mono`) are wired in `apps/playground/app/layout.tsx`. Data/labels use `font.data` (JetBrains Mono).
- **Reduced motion:** the existing `globals.css` `@media (prefers-reduced-motion: reduce)` block suppresses animations globally. Active state must still be visible without motion (the inline jade border/edge carries the state; the CSS animation is the motion layer on top).
- **Seed is authoritative over the prototype:** both view-logs are on `P-1042` (`VL-001 j.harper→P-1042`, `VL-002 m.okafor→P-1042`). m.okafor's view is `ok` (backed by `memberof G-SR`); j.harper's is the anomaly. Bronze holds only `{products, viewLogs}` (4 rows: 2 products + 2 view-logs) — NOT the prototype's 10 rows (the architecture model does not track ad_groups/ad_users in Bronze).
- **Forge is the step-10 actor:** the architecture model has only `forge` in the transform stage; steps 8, 9, 10 all use `forge` as actor with edge `forge→bedrock`.
- **No vitest in the playground:** the pure core is tested in `packages/architecture`; the playground is verified at render time (build + Playwright a11y/console + a dev-only store hook + human visual confirm). This matches 09's stance.
- **Branch:** `feat/10-lakehouse-state-playbook-engine` (already created and checked out). Commit per task.
- **No-vision verification:** the agent has no vision — verify via `pnpm -r build`, console messages, the Playwright accessibility snapshot, `browser_evaluate` against the dev-only `window.__playground` store hook, and a human visual confirm.

---

## File Structure

**`packages/architecture` (pure core):**
- **Create** `src/playground-state.ts` — `PlaybookStep` type, `PlaygroundState` type, `blankState()`, `applyStep()`, `reduceToCursor()`, `deriveStatus()`, `exportState()`/`importState()`, `InvalidStateError`, `StepStatus`.
- **Create** `src/playbook.ts` — the 22-step flagship `SENSITIVE_PRODUCT_VIEW_AUDIT: PlaybookStep[]`.
- **Create** `tests/playbook.test.ts` + `tests/playground-state.test.ts`.
- **Modify** `src/index.ts` — re-export the new modules.

**`apps/playground` (reactive shell):**
- **Create** `app/_store/usePlayground.ts` — Zustand store (thin wrapper over the pure core) + a dev-only `window.__playground` hook.
- **Create** `app/_inspector/Inspector.tsx` — Bronze/Silver/Gold/Schema/Audit tabs + counts.
- **Create** `app/_controls/Controls.tsx` — Run/Pause, Step, Reset, Export, Import.
- **Create** `app/_spine/Narrative.tsx` — current-step narrative + step list + progress bar.
- **Modify** `app/_spine/spine-graph.ts` — replace the hardcoded platform-id list with a model-derived selection.
- **Modify** `app/_spine/NodeChip.tsx` — add a `status` prop (jade active / teal done).
- **Modify** `app/_spine/PhaseBand.tsx` — add a `status` prop.
- **Modify** `app/_spine/Spine.tsx` — become controlled (reads the store + `deriveStatus`).
- **Modify** `app/globals.css` — add the `spine-ripple` + `spine-flow` keyframes.
- **Modify** `app/playground-client.tsx` — 2-column layout composing spine + narrative + controls + inspector.
- **Modify** `package.json` — add `zustand`.

---

## Task 1: Pure state machinery — `playground-state.ts`

**Files:**
- Create: `packages/architecture/src/playground-state.ts`
- Test: `packages/architecture/tests/playground-state.test.ts`

**Interfaces:**
- Consumes: `SEED`, `SCHEMA_REGISTRY`, `conformToGold`, `detectAnomalies`, `getFinding` from `./dataset`; `PHASES` from `./components`; `SeedDataset`, `Finding`, `PhaseId` types.
- Produces: `PlaybookStep` type, `PlaygroundState` type, `StepStatus` type, `blankState(): PlaygroundState`, `applyStep(state, step): PlaygroundState`, `reduceToCursor(steps, target): PlaygroundState`, `deriveStatus(steps, cursor): StepStatus`, `exportState(state): string`, `importState(json): PlaygroundState`, `InvalidStateError`. Task 2's `playbook.ts` imports `PlaybookStep`, `PlaygroundState`, `blankState` from here.

- [ ] **Step 1: Write the failing test**

Create `packages/architecture/tests/playground-state.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  applyStep,
  blankState,
  deriveStatus,
  exportState,
  importState,
  InvalidStateError,
  reduceToCursor,
  type PlaybookStep,
} from '../src/index';
import { SEED } from '../src/dataset';

// A tiny fake playbook to test the machinery independent of the real flagship.
const fake: PlaybookStep[] = [
  { n: 1, phase: 'schema', actor: 'blueprint', edge: ['blueprint', 'bridge'], title: 't1', desc: 'd1', apply: (s) => { s.schemaRegistry = { Product: { name: 'Product', fields: [] } }; } },
  { n: 2, phase: 'schema', actor: 'bridge', edge: ['bridge', 'bedrock'], title: 't2', desc: 'd2', apply: () => {} },
];

describe('blankState — SPEC §4.5/§4.6', () => {
  it('starts with empty lakehouse + registry + audit, sources present, cursor 0', () => {
    const s = blankState();
    expect(s.cursor).toBe(0);
    expect(s.finding).toBeNull();
    expect(s.schemaRegistry).toEqual({});
    expect(s.gold).toEqual({ nodes: [], edges: [] });
    expect(s.bronze).toEqual({ products: [], viewLogs: [] });
    expect(s.silver).toEqual({ extProduct: [], extViewLog: [] });
    expect(s.auditLog).toEqual([]);
    // sources present (the fixed rows ingestion reads)
    expect(s.products).toBe(SEED.products);
    expect(s.viewLogs).toBe(SEED.viewLogs);
  });
});

describe('applyStep / reduceToCursor — immutability + cursor', () => {
  it('applyStep returns a new state with cursor advanced, original untouched', () => {
    const before = blankState();
    const after = applyStep(before, fake[0]);
    expect(before.cursor).toBe(0); // unchanged
    expect(after.cursor).toBe(1);
    expect(after.schemaRegistry.Product).toBeDefined();
    expect(after).not.toBe(before);
  });

  it('reduceToCursor(0) equals blankState', () => {
    expect(reduceToCursor(fake, 0)).toEqual(blankState());
  });

  it('reduceToCursor(2) applies both steps', () => {
    const s = reduceToCursor(fake, 2);
    expect(s.cursor).toBe(2);
    expect(s.schemaRegistry.Product).toBeDefined();
  });

  it('reduceToCursor clamps past the end', () => {
    const s = reduceToCursor(fake, 99);
    expect(s.cursor).toBe(2);
  });
});

describe('deriveStatus — SPEC §4.3 reactivity', () => {
  it('cursor 0: no active, empty dones', () => {
    const st = deriveStatus(fake, 0);
    expect(st.activeNodeId).toBeNull();
    expect(st.activeEdge).toBeNull();
    expect(st.activePhase).toBeNull();
    expect([...st.doneNodeIds]).toEqual([]);
  });

  it('cursor 1: active = step 1 actor/edge/phase; that actor also in done (active overrides)', () => {
    const st = deriveStatus(fake, 1);
    expect(st.activeNodeId).toBe('blueprint');
    expect(st.activeEdge).toEqual({ from: 'blueprint', to: 'bridge' });
    expect(st.activePhase).toBe('schema');
    expect(st.doneNodeIds.has('blueprint')).toBe(true);
  });

  it('cursor at end: no active, all done', () => {
    const st = deriveStatus(fake, 2);
    expect(st.activeNodeId).toBeNull();
    expect(st.doneNodeIds.has('blueprint')).toBe(true);
    expect(st.doneNodeIds.has('bridge')).toBe(true);
    expect(st.doneEdgeIds.has('blueprint__bridge')).toBe(true);
    expect(st.doneEdgeIds.has('bridge__bedrock')).toBe(true);
  });
});

describe('export / import — SPEC §4.5 persistence', () => {
  it('roundtrips a played state preserving cursor', () => {
    const played = reduceToCursor(fake, 2);
    const json = exportState(played);
    const back = importState(json);
    expect(back).toEqual(played);
  });

  it('rejects non-JSON', () => {
    expect(() => importState('not json')).toThrow(InvalidStateError);
  });

  it('rejects an object missing required fields', () => {
    expect(() => importState('{}')).toThrow(InvalidStateError);
  });

  it('rejects a non-number cursor', () => {
    const played = reduceToCursor(fake, 1);
    const bad = JSON.parse(exportState(played));
    bad.cursor = 'x';
    expect(() => importState(JSON.stringify(bad))).toThrow(InvalidStateError);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @nanisoft/architecture test`
Expected: FAIL — the imports from `../src/index` do not exist yet (the new module is not created or not exported).

- [ ] **Step 3: Write the implementation**

Create `packages/architecture/src/playground-state.ts`:

```ts
/**
 * Pure playground state engine — the lakehouse + playbook reducer.
 *
 * Framework-agnostic: no React, no Zustand, no React Flow. The Zustand store in
 * apps/playground wraps this; the reducer + status derivation are unit-tested
 * here. See `.scratch/nanosoft-digital-twin/SPEC.md` §4.4 (engine) / §4.5 (state).
 *
 * Reset semantics = blank-slate replay (design decision 1): the lakehouse starts
 * empty; the playbook builds Bronze → Silver → Gold from step 1.
 */
import { PHASES } from './components';
import {
  SCHEMA_REGISTRY,
  SEED,
  type Finding,
  type PhaseId as _PhaseId,
} from './dataset';
import type { PhaseId } from './types';
import type { SeedDataset } from './dataset';

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
    schemaRegistry: {},
    bronze: { products: [], viewLogs: [] },
    silver: { extProduct: [], extViewLog: [] },
    gold: { nodes: [], edges: [] },
    auditLog: [],
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
 * include every applied step's actor/edge (including the currently-active one);
 * the spine renders active > done > idle so an edge that is both shows active.
 * At cursor === steps.length there is no active step (run complete, all done).
 */
export function deriveStatus(steps: readonly PlaybookStep[], cursor: number): StepStatus {
  const doneNodeIds = new Set<string>();
  const doneEdgeIds = new Set<string>();
  const applied = Math.min(cursor, steps.length);
  for (let i = 0; i < applied; i++) {
    const s = steps[i];
    doneNodeIds.add(s.actor);
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
  'schemaRegistry', 'bronze', 'silver', 'gold', 'auditLog', 'finding', 'cursor',
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
  return p as unknown as PlaygroundState;
}
```

Note: `SCHEMA_REGISTRY` is imported but unused in this module (it is used by `playbook.ts` in Task 2). Remove the unused `SCHEMA_REGISTRY` import before committing if the linter flags it — keep only what is used. (`PHASES` is also unused here; remove it too. The only imports this module needs are `SEED`, `Finding`, `SeedDataset`, `PhaseId`.) After writing, trim the imports to:

```ts
import { SEED, type Finding, type SeedDataset } from './dataset';
import type { PhaseId } from './types';
```

- [ ] **Step 4: Wire the exports in `src/index.ts`**

Add to `packages/architecture/src/index.ts` (after the mock-tool specs block):

```ts
// ── Playground state engine + playbook ───────────────────────────────────────
export {
  InvalidStateError,
  applyStep,
  blankState,
  deriveStatus,
  exportState,
  importState,
  reduceToCursor,
} from './playground-state';
export type {
  PlaybookStep,
  PlaygroundState,
  StepStatus,
} from './playground-state';
```

(`SENSITIVE_PRODUCT_VIEW_AUDIT` is exported in Task 2.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @nanisoft/architecture test`
Expected: PASS — all existing 26 tests + the new `playground-state.test.ts` tests green.

- [ ] **Step 6: Commit**

```bash
git add packages/architecture/src/playground-state.ts packages/architecture/src/index.ts packages/architecture/tests/playground-state.test.ts
git commit -m "feat(architecture): pure playground state engine (ticket 10)

PlaygroundState (= SeedDataset + finding + cursor), blankState, applyStep
(structuredClone immutability), reduceToCursor, deriveStatus, export/import
with InvalidStateError. Framework-agnostic, unit-tested. Blank-slate replay."
```

---

## Task 2: The 22-step flagship playbook — `playbook.ts`

**Files:**
- Create: `packages/architecture/src/playbook.ts`
- Test: `packages/architecture/tests/playbook.test.ts`
- Modify: `packages/architecture/src/index.ts` (add the flagship export)

**Interfaces:**
- Consumes: `PlaybookStep`, `PlaygroundState`, `blankState` from `./playground-state`; `SCHEMA_REGISTRY`, `conformToGold`, `detectAnomalies`, `getFinding` from `./dataset`; `COMPONENT_BY_ID`, `EDGES` from `./components` (test only).
- Produces: `SENSITIVE_PRODUCT_VIEW_AUDIT: PlaybookStep[]` (22 steps). Task 3's store imports it.

- [ ] **Step 1: Write the failing test**

Create `packages/architecture/tests/playbook.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  COMPONENT_BY_ID,
  EDGES,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  reduceToCursor,
} from '../src/index';

const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

describe('flagship structure — SPEC §4.7 (22 steps)', () => {
  it('has exactly 22 steps numbered 1..22', () => {
    expect(STEPS).toHaveLength(22);
    expect(STEPS.map((s) => s.n)).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
  });

  it('every actor is a real component id', () => {
    for (const s of STEPS) {
      expect(COMPONENT_BY_ID[s.actor], `step ${s.n} actor ${s.actor}`).toBeDefined();
    }
  });

  it('every step edge is a real EDGES pair', () => {
    const edgeSet = new Set(EDGES.map((e) => `${e.from}__${e.to}`));
    for (const s of STEPS) {
      if (s.edge) {
        const key = `${s.edge[0]}__${s.edge[1]}`;
        expect(edgeSet.has(key), `step ${s.n} edge ${key}`).toBe(true);
      }
    }
  });

  it('phases progress Schema → Ingestion → Transform → Investigation', () => {
    const phases = STEPS.map((s) => s.phase);
    expect(phases.slice(0, 4)).toEqual(['schema', 'schema', 'schema', 'schema']);
    expect(phases.slice(4, 7)).toEqual(['ingestion', 'ingestion', 'ingestion']);
    expect(phases.slice(7, 10)).toEqual(['transform', 'transform', 'transform']);
    for (const p of phases.slice(10)) expect(p).toBe('investigation');
  });
});

describe('flagship replay — SPEC §4.7 teaching state', () => {
  it('cursor 10 produces Gold 5 nodes / 4 edges (the teaching state)', () => {
    const s = reduceToCursor(STEPS, 10);
    expect(s.cursor).toBe(10);
    expect(s.gold.nodes).toHaveLength(5);
    expect(s.gold.edges).toHaveLength(4);
  });

  it('cursor 7 lands Bronze = 2 products + 2 view-logs (seed-authoritative, not 10)', () => {
    const s = reduceToCursor(STEPS, 7);
    expect(s.bronze.products).toHaveLength(2);
    expect(s.bronze.viewLogs).toHaveLength(2);
  });

  it('cursor 1 authors the SchemaRegistry hinge (Product.Sensitive: bool)', () => {
    const s = reduceToCursor(STEPS, 1);
    const sensitive = s.schemaRegistry.Product?.fields.find((f) => f.name === 'Sensitive');
    expect(sensitive).toBeDefined();
    expect(sensitive?.type).toBe('bool');
  });

  it('cursor 17 sets the finding + marks the anomaly (j.harper→P-1042) and the backed view (m.okafor→P-1042)', () => {
    const s = reduceToCursor(STEPS, 17);
    expect(s.finding).not.toBeNull();
    expect(s.finding?.user).toBe('j.harper');
    expect(s.finding?.product).toBe('P-1042');
    const harper = s.gold.edges.find((e) => e.from === 'j.harper' && e.to === 'P-1042' && e.kind === 'viewed');
    const okafor = s.gold.edges.find((e) => e.from === 'm.okafor' && e.to === 'P-1042' && e.kind === 'viewed');
    expect(harper?.status).toBe('anomalous');
    expect(okafor?.status).toBe('ok');
  });

  it('cursor 22 completes with 3 audit entries', () => {
    const s = reduceToCursor(STEPS, 22);
    expect(s.cursor).toBe(22);
    expect(s.auditLog).toHaveLength(3);
    expect(s.auditLog[0].decision).toBe('allow');
  });

  it('cursor 22 has no finding-edge left unmarked among viewed edges', () => {
    const s = reduceToCursor(STEPS, 22);
    for (const e of s.gold.edges) {
      if (e.kind === 'viewed') expect(e.status).toMatch(/anomalous|ok/);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @nanisoft/architecture test`
Expected: FAIL — `SENSITIVE_PRODUCT_VIEW_AUDIT` is not exported yet.

- [ ] **Step 3: Write the implementation**

Create `packages/architecture/src/playbook.ts`:

```ts
/**
 * The flagship playbook — Sensitive Product View Audit — mirrored from
 * `resources/TrueAccess_Schema_to_Visualization_Sequence.mermaid` (22 beats →
 * 22 steps). See SPEC §4.7.
 *
 * Each step's `apply` fn mutates a *clone* of the state (the reducer clones
 * before calling it) and reuses the package's existing conform/detect/find
 * functions: step 10 calls `conformToGold`, step 17 calls `getFinding` +
 * `detectAnomalies`. Most steps are narrate-only (`apply: () => {}`) — they light
 * the spine and advance the story; the mutate fn is non-empty only where the
 * lakehouse/registry/audit actually changes.
 *
 * Adaptations from the prototype, per the design spec:
 *  - Forge is the step-10 actor (no separate "Scoring" node in the model);
 *    steps 8/9/10 all use `forge` + edge `forge→bedrock`.
 *  - Both view-logs are on P-1042 (m.okafor's view is `ok`, j.harper's is the
 *    anomaly) — the architecture seed is authoritative over the prototype.
 */
import { SCHEMA_REGISTRY, conformToGold, detectAnomalies, getFinding } from './dataset';
import type { PlaybookStep, PlaygroundState } from './playground-state';

const TS = '2026-08-14T09:12:00Z';

export const SENSITIVE_PRODUCT_VIEW_AUDIT: PlaybookStep[] = [
  // ── Phase 1: Schema ───────────────────────────────────────────────────────
  {
    n: 1, phase: 'schema', actor: 'blueprint', edge: ['blueprint', 'bridge'],
    title: 'Author defines ObjectType Product',
    desc: 'A Schema Author opens DataGerry and defines ObjectType Product with a field Sensitive: bool.',
    apply: (s) => { s.schemaRegistry = structuredClone(SCHEMA_REGISTRY); },
  },
  {
    n: 2, phase: 'schema', actor: 'bridge', edge: ['blueprint', 'bridge'],
    title: 'DataGerry emits the type',
    desc: 'DataGerry pushes the new Type/Relation to the DataGerry Bridge.',
    apply: () => {},
  },
  {
    n: 3, phase: 'schema', actor: 'bridge', edge: ['bridge', 'bedrock'],
    title: 'Bridge writes the DDL',
    desc: 'Bridge generates CREATE TABLE ext_product in Bedrock (Bronze shell ready).',
    apply: () => {},
  },
  {
    n: 4, phase: 'schema', actor: 'bridge', edge: ['bridge', 'atlas'],
    title: 'Atlas refreshes its schema cache',
    desc: 'Bridge refreshes Atlas’s SchemaRegistry cache; Atlas acks.',
    apply: () => {},
  },

  // ── Phase 2: Ingestion ────────────────────────────────────────────────────
  {
    n: 5, phase: 'ingestion', actor: 'airbyte', edge: ['sql-fleet', 'airbyte'],
    title: 'Airbyte extracts product + view-log records',
    desc: 'Airbyte pulls Product rows and view-logs from the SQL Server Fleet source.',
    apply: () => {},
  },
  {
    n: 6, phase: 'ingestion', actor: 'airbyte', edge: ['active-directory', 'airbyte'],
    title: 'Airbyte extracts groups + users',
    desc: 'Airbyte pulls group membership and users from Active Directory (Workday HR for employees).',
    apply: () => {},
  },
  {
    n: 7, phase: 'ingestion', actor: 'airbyte', edge: ['airbyte', 'forge'],
    title: 'Raw rows land in Bronze',
    desc: 'Airbyte lands raw records into Bronze: ext_product (2) + view_logs (2).',
    apply: (s) => { s.bronze = { products: s.products, viewLogs: s.viewLogs }; },
  },

  // ── Phase 3: Transform ────────────────────────────────────────────────────
  {
    n: 8, phase: 'transform', actor: 'forge', edge: ['forge', 'bedrock'],
    title: 'Forge reads the cached schema',
    desc: 'Forge reads the current Product schema (cached from the Bridge sync) so it conforms the right columns.',
    apply: () => {},
  },
  {
    n: 9, phase: 'transform', actor: 'forge', edge: ['forge', 'bedrock'],
    title: 'Forge writes conformed Silver',
    desc: 'Forge + dbt write conformed Silver ext_product rows with SCD2 snapshots.',
    apply: (s) => { s.silver = { extProduct: s.products, extViewLog: s.viewLogs }; },
  },
  {
    n: 10, phase: 'transform', actor: 'forge', edge: ['forge', 'bedrock'],
    title: 'Forge writes Gold graph_nodes + graph_edges',
    desc: 'Confidence scoring + dbt write Gold: graph_nodes (Products, Users, Groups) and graph_edges (viewed, memberof).',
    apply: (s) => { s.gold = conformToGold(s); },
  },

  // ── Phase 4: Investigation ────────────────────────────────────────────────
  {
    n: 11, phase: 'investigation', actor: 'compass', edge: ['compass', 'atlas'],
    title: 'Analyst opens Compass, runs the use-case',
    desc: 'A Security Analyst opens Compass and runs Sensitive Product View Audit. Compass asks Atlas for the use-case steps.',
    apply: () => {}, openTool: 'compass',
  },
  {
    n: 12, phase: 'investigation', actor: 'atlas', edge: ['atlas', 'opa'],
    title: 'Atlas asks OPA: can this user run this use-case?',
    desc: 'Atlas consults OPA with the user + use-case. (In the playground OPA is mocked — no real policy engine.)',
    apply: () => {},
  },
  {
    n: 13, phase: 'investigation', actor: 'opa', edge: ['opa', 'atlas'],
    title: 'OPA returns allow',
    desc: 'OPA returns allow. (Mocked Rego evaluation.)',
    apply: () => {},
  },
  {
    n: 14, phase: 'investigation', actor: 'atlas', edge: null,
    title: 'Atlas writes the audit log',
    desc: 'Atlas writes an audit-log entry for the run before executing.',
    apply: (s) => {
      s.auditLog.push({ ts: TS, actor: 'analyst', useCase: 'sensitive-product-view-audit', decision: 'allow', detail: 'OPA allowed Sensitive Product View Audit' });
    },
  },
  {
    n: 15, phase: 'investigation', actor: 'atlas', edge: ['atlas', 'overlook'],
    title: 'Atlas runs the seeded SQL via Overlook',
    desc: 'Atlas asks Overlook to run the seeded query: views edges vs group membership.',
    apply: () => {},
  },
  {
    n: 16, phase: 'investigation', actor: 'overlook', edge: ['overlook', 'bedrock'],
    title: 'Overlook reads Gold graph_nodes + graph_edges',
    desc: 'Overlook reads the Gold graph from Bedrock and joins views to memberships.',
    apply: () => {},
  },
  {
    n: 17, phase: 'investigation', actor: 'overlook', edge: ['overlook', 'atlas'],
    title: 'Overlook returns an anomalous view',
    desc: 'Overlook finds j.harper viewed sensitive P-1042 with no group membership backing it.',
    apply: (s) => {
      s.finding = getFinding(s);
      const anomalous = new Set(detectAnomalies(s.gold, s).map((e) => e.id));
      for (const e of s.gold.edges) {
        if (e.kind !== 'viewed') {
          e.status = null;
        } else {
          e.status = anomalous.has(e.id) ? 'anomalous' : 'ok';
        }
      }
    },
  },
  {
    n: 18, phase: 'investigation', actor: 'atlas', edge: null,
    title: 'Atlas returns the highlighted path + narrative steps',
    desc: 'Atlas sends Compass the highlighted traversal path and the narrative steps that explain it.',
    apply: () => {},
  },
  {
    n: 19, phase: 'investigation', actor: 'compass', edge: null,
    title: 'Compass renders the traversal',
    desc: 'Compass renders the highlighted path: j.harper → viewed → P-1042 (sensitive), with the missing memberof edge shown as a gap.',
    apply: () => {}, openTool: 'compass', final: true,
  },
  {
    n: 20, phase: 'investigation', actor: 'compass', edge: null,
    title: 'Compass shows the exposure to the analyst',
    desc: 'The analyst sees the sensitive exposure in plain language: j.harper can view Payroll-NG but is not in G-SR.',
    apply: (s) => {
      s.auditLog.push({ ts: TS, actor: 'analyst', useCase: 'sensitive-product-view-audit', decision: 'allow', detail: '1 anomalous view surfaced: j.harper → P-1042 (Payroll-NG)' });
    },
  },
  {
    n: 21, phase: 'investigation', actor: 'superset', edge: ['superset', 'overlook'],
    title: 'Superset can pin the finding as a dashboard',
    desc: '(Optional) Superset pins the anomalous-views query as an investigative dashboard for compliance.',
    apply: () => {},
  },
  {
    n: 22, phase: 'investigation', actor: 'watchtower', edge: null,
    title: 'Watchtower observes the whole run',
    desc: 'Watchtower records the run end-to-end. The twin is settled. Export the state or reset to play again.',
    apply: (s) => {
      s.auditLog.push({ ts: TS, actor: 'system', useCase: 'sensitive-product-view-audit', decision: 'allow', detail: 'run complete — 22 steps' });
    },
  },
];
```

- [ ] **Step 4: Add the flagship export to `src/index.ts`**

Append to the playground block added in Task 1:

```ts
export { SENSITIVE_PRODUCT_VIEW_AUDIT } from './playbook';
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @nanisoft/architecture test`
Expected: PASS — all architecture tests green (existing 26 + Task 1 + Task 2 suites).

- [ ] **Step 6: Typecheck the package**

Run: `pnpm --filter @nanisoft/architecture exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/architecture/src/playbook.ts packages/architecture/src/index.ts packages/architecture/tests/playbook.test.ts
git commit -m "feat(architecture): 22-step flagship playbook (ticket 10)

SENSITIVE_PRODUCT_VIEW_AUDIT mirrored from the mermaid. apply fns reuse
conformToGold (step 10) + getFinding/detectAnomalies (step 17). Forge is
the step-10 actor; both view-logs on P-1042 (seed-authoritative)."
```

---

## Task 3: Zustand store — `usePlayground.ts`

**Files:**
- Create: `apps/playground/app/_store/usePlayground.ts`
- Modify: `apps/playground/package.json` (add `zustand`)

**Interfaces:**
- Consumes: `SENSITIVE_PRODUCT_VIEW_AUDIT`, `applyStep`, `blankState`, `exportState`, `importState`, `InvalidStateError`, `PlaygroundState` from `@nanisoft/architecture`.
- Produces: `usePlayground` (Zustand store), `STEP_PACE_MS`. Tasks 5–7 consume `usePlayground` + `STEP_PACE_MS`.

- [ ] **Step 1: Add the `zustand` dependency**

Run from the repo root:

```bash
pnpm --filter @nanisoft/playground add zustand
```

Expected: `zustand` (v5.x) is added to `apps/playground/package.json` `dependencies` and installed. If pnpm reports a React 19 peer-dependency conflict, re-run with `--config.strict-peer-dependencies=false` and note it in the commit body.

- [ ] **Step 2: Verify a clean workspace build**

Run: `pnpm -r build`
Expected: green (nothing imports `zustand` yet; confirms the install did not break the workspace).

- [ ] **Step 3: Create the store**

Create `apps/playground/app/_store/usePlayground.ts`:

```ts
'use client';

import { create } from 'zustand';
import {
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  applyStep,
  blankState,
  exportState as exportPlaygroundState,
  importState as importPlaygroundState,
  InvalidStateError,
  type PlaygroundState,
} from '@nanisoft/architecture';

/** The flagship playbook steps. */
export const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

/** Auto-run pace (SPEC §4.4 — ~1.1s/step, tunable). */
export const STEP_PACE_MS = 1100;

// Module-level interval handle (single-instance playground).
let timer: ReturnType<typeof setInterval> | null = null;
function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

interface PlaygroundStore {
  state: PlaygroundState;
  running: boolean;
  /** Advance one step; stops at the end. */
  step: () => void;
  /** Begin auto-run. */
  run: () => void;
  /** Pause auto-run. */
  pause: () => void;
  /** Reset to the blank-slate pre-pipeline state. */
  reset: () => void;
  /** Serialize state for export. */
  exportJson: () => string;
  /** Replace state from exported JSON. Returns ok or an error message. */
  importJson: (json: string) => { ok: true } | { ok: false; error: string };
}

export const usePlayground = create<PlaygroundStore>((set, get) => ({
  state: blankState(),
  running: false,

  step: () => {
    const { state } = get();
    if (state.cursor >= STEPS.length) {
      clearTimer();
      set({ running: false });
      return;
    }
    const next = applyStep(state, STEPS[state.cursor]);
    set({ state: next });
    if (next.cursor >= STEPS.length) {
      clearTimer();
      set({ running: false });
    }
  },

  run: () => {
    const { state, running } = get();
    if (running) return;
    if (state.cursor >= STEPS.length) return;
    set({ running: true });
    timer = setInterval(() => get().step(), STEP_PACE_MS);
  },

  pause: () => {
    clearTimer();
    set({ running: false });
  },

  reset: () => {
    clearTimer();
    set({ state: blankState(), running: false });
  },

  exportJson: () => exportPlaygroundState(get().state),

  importJson: (json) => {
    try {
      const imported = importPlaygroundState(json);
      clearTimer();
      set({ state: imported, running: false });
      return { ok: true };
    } catch (e) {
      const error = e instanceof InvalidStateError ? e.message : 'invalid state';
      return { ok: false, error };
    }
  },
}));

// Dev-only hook so Playwright can drive the store without the Controls UI
// (used by ticket 10 render verification). Stripped in production builds.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  (window as unknown as { __playground?: typeof usePlayground }).__playground = usePlayground;
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @nanisoft/playground exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/app/_store/usePlayground.ts apps/playground/package.json pnpm-lock.yaml
git commit -m "feat(playground): Zustand store over the pure engine (ticket 10)

Thin shell wrapping applyStep/blankState/export+import. Auto-run at
STEP_PACE_MS=1100, single-step, reset. Dev-only window.__playground hook
for Playwright render verification."
```

---

## Task 4: Fix the 09 platform-id hardcode in `spine-graph.ts`

**Files:**
- Modify: `apps/playground/app/_spine/spine-graph.ts:76-79` and `:169`

**Interfaces:**
- Consumes: `COMPONENTS`, `Component` from `@nanisoft/architecture` (new import).
- Produces: the same `buildSpineGraph()` output, with the platform-band node ids derived from the model instead of a hardcoded list.

- [ ] **Step 1: Add the `COMPONENTS` import**

In `apps/playground/app/_spine/spine-graph.ts`, extend the existing `@nanisoft/architecture` import block (line 9–17) to also import `COMPONENTS` and the `Component` type is already imported. Change:

```ts
import {
  COMPONENT_BY_ID,
  EDGES,
  OBSERVER_COMPONENTS,
  PHASES,
  PIPELINE_SPINE,
  STAGE_COMPONENTS,
  type Component,
} from '@nanisoft/architecture';
```

to:

```ts
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
```

- [ ] **Step 2: Replace the hardcoded `renderedIds()` platform list**

Replace the `renderedIds()` function (the block at lines ~76–79):

```ts
function renderedIds(): Set<string> {
  const stageIds = Object.values(STAGE_COMPONENTS).flat();
  return new Set([...stageIds, ...OBSERVER_COMPONENTS, 'anchor', 'conveyor', 'openbao']);
}
```

with:

```ts
/** Platform/ops nodes rendered above the spine (derived, not hardcoded):
 *  platform-kind nodes minus Watchtower (which is the observer). */
const PLATFORM_COMPONENTS: string[] = COMPONENTS.filter(
  (c) => c.kind === 'platform' && c.id !== 'watchtower',
).map((c) => c.id);

function renderedIds(): Set<string> {
  const stageIds = Object.values(STAGE_COMPONENTS).flat();
  return new Set([...stageIds, ...OBSERVER_COMPONENTS, ...PLATFORM_COMPONENTS]);
}
```

- [ ] **Step 3: Replace the hardcoded `platformIds` in `buildSpineGraph()`**

Replace the line `const platformIds = ['anchor', 'conveyor', 'openbao'];` (inside `buildSpineGraph`, ~line 169) with:

```ts
  const platformIds = PLATFORM_COMPONENTS;
```

- [ ] **Step 4: Typecheck + build**

Run:
```bash
pnpm --filter @nanisoft/playground exec tsc --noEmit && pnpm -r build
```
Expected: green. The spine still renders the same 19 nodes (anchor/conveyor/openbao are exactly the platform-kind nodes minus watchtower).

- [ ] **Step 5: Verify the spine is unchanged structurally**

Run (background): `pnpm --filter @nanisoft/playground dev`
Wait for the `Local: http://localhost:3001` line.

Using Playwright:
- `browser_navigate` → `http://localhost:3001`
- `browser_console_messages` with `level: "error"` → expect no errors.
- `browser_find` for `Anchor`, `Conveyor`, `OpenBao`, `Watchtower` → all four still present (the platform band is unchanged).

- [ ] **Step 6: Stop the dev server and commit**

```bash
git add apps/playground/app/_spine/spine-graph.ts
git commit -m "fix(playground): derive spine platform ids from the model

Replaces the hardcoded ['anchor','conveyor','openbao'] list (09 carry-
forward) with COMPONENTS.filter(platform && id!=='watchtower') — the same
derivation pattern used for OBSERVER_COMPONENTS."
```

---

## Task 5: Reactive spine — `NodeChip` / `PhaseBand` / `Spine` + keyframes

**Files:**
- Modify: `apps/playground/app/_spine/NodeChip.tsx`
- Modify: `apps/playground/app/_spine/PhaseBand.tsx`
- Modify: `apps/playground/app/_spine/Spine.tsx`
- Modify: `apps/playground/app/globals.css`

**Interfaces:**
- Consumes: `usePlayground` from `../_store/usePlayground`; `deriveStatus`, `SENSITIVE_PRODUCT_VIEW_AUDIT`, `PHASES`, `color`, `surface` from `@nanisoft/identity` / `@nanisoft/architecture`; `buildSpineGraph` + types from `./spine-graph`.
- Produces: a controlled spine that reacts to the store cursor (jade active node + flowing edge, teal done, phase band tracking).

- [ ] **Step 1: Add the keyframes to `globals.css`**

Append to `apps/playground/app/globals.css` (after the existing reduced-motion block):

```css
/* ── Spine reactivity (ticket 10) ───────────────────────────────────────────
   Keyframes generated from @nanisoft/identity's motion variants: `ripple`
   (radial outward pulse — the active node beckon) and `traverse` (a wavefront
   flowing along the active edge). Brand easing cubic-bezier(.32,.72,0,1).
   Reduced motion is handled by the global @media block above (animations
   suppressed); the inline jade border/edge carries the active state without
   motion, so content/state stays visible and still. */

@keyframes spine-ripple {
  0%, 100% { box-shadow: 0 0 0 0 rgba(20, 167, 122, 0); }
  50%      { box-shadow: 0 0 0 6px rgba(20, 167, 122, 0.18); }
}
.spine-node-active {
  animation: spine-ripple 1.1s cubic-bezier(.32, .72, 0, 1) infinite;
}

@keyframes spine-flow {
  to { stroke-dashoffset: -24; }
}
.spine-edge-active {
  animation: spine-flow 0.7s linear infinite;
}
```

- [ ] **Step 2: Add `status` to `NodeChip.tsx`**

Replace the full contents of `apps/playground/app/_spine/NodeChip.tsx`:

```tsx
'use client';

import { Handle, Position } from '@xyflow/react';
import type { Component } from '@nanisoft/architecture';
import { color, font, radius, surface } from '@nanisoft/identity';
import { SOURCE_HANDLE, TARGET_HANDLE, type HandleSide } from './spine-graph';

export const CHIP_W = 180;
export const CHIP_H = 64;

export type NodeStatus = 'idle' | 'active' | 'done';

const SIDES: HandleSide[] = ['top', 'right', 'bottom', 'left'];
const POS: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};
const HANDLE_STYLE = { opacity: 0, width: 1, height: 1 } as const;

function realNameLine(c: Component): string | null {
  if (c.kind === 'custom') return null;
  if (c.realName && c.realName !== c.codename) return c.realName;
  return null;
}

function borderFor(status: NodeStatus): string {
  if (status === 'active') return `1px solid ${color.jade}`;
  if (status === 'done') return `1px solid ${color.teal}`;
  return `1px solid ${surface.light.border}`;
}

export function NodeChip({ data }: { data: { component: Component; status: NodeStatus } }) {
  const c = data.component;
  const sub = realNameLine(c);
  const status = data.status;
  return (
    <div
      className={status === 'active' ? 'spine-node-active' : undefined}
      style={{
        width: CHIP_W,
        minHeight: CHIP_H,
        borderRadius: radius.inner,
        background: surface.light.elevated,
        border: borderFor(status),
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
        <Handle key={`s-${side}`} id={SOURCE_HANDLE[side]} type="source" position={POS[side]} style={HANDLE_STYLE} isConnectable={false} />
      ))}
      {SIDES.map((side) => (
        <Handle key={`t-${side}`} id={TARGET_HANDLE[side]} type="target" position={POS[side]} style={HANDLE_STYLE} isConnectable={false} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Add `status` to `PhaseBand.tsx`**

Replace the full contents of `apps/playground/app/_spine/PhaseBand.tsx`:

```tsx
'use client';

import { color, font, radius, surface } from '@nanisoft/identity';

export type PhaseStatus = 'idle' | 'active' | 'done';

/**
 * A phase band — a labeled rectangle spanning its phase's columns, rendered as
 * a non-interactive React Flow node below the spine. `status` reflects the
 * playbook cursor: active phase = jade, done phases = teal, idle = sunken.
 * The neutral Sources band is always idle (it is not one of the 4 phases).
 */
export function PhaseBand({ data }: { data: { name: string; width: number; subtle?: boolean; status: PhaseStatus } }) {
  const { subtle, status } = data;
  const isSources = subtle;
  const bg =
    !isSources && status === 'active' ? color.jade
    : isSources ? 'transparent'
    : surface.light.sunken;
  const fg =
    !isSources && status === 'active' ? surface.light.bg
    : !isSources && status === 'done' ? color.teal
    : surface.light.textMuted;
  const border =
    !isSources && status === 'active' ? `1px solid ${color.jade}`
    : !isSources && status === 'done' ? `1px solid ${color.teal}`
    : `1px ${isSources ? 'dashed' : 'solid'} ${surface.light.border}`;
  return (
    <div
      style={{
        width: data.width,
        height: 40,
        borderRadius: radius.inner,
        background: bg,
        border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: font.data,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: fg,
      }}
    >
      {data.name}
    </div>
  );
}
```

- [ ] **Step 4: Make `Spine.tsx` controlled**

Replace the full contents of `apps/playground/app/_spine/Spine.tsx`:

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
import { PHASES, SENSITIVE_PRODUCT_VIEW_AUDIT, deriveStatus } from '@nanisoft/architecture';
import { buildSpineGraph, type SpineEdge, type SpineNode } from './spine-graph';
import { NodeChip, CHIP_W, CHIP_H, type NodeStatus } from './NodeChip';
import { PhaseBand, type PhaseStatus } from './PhaseBand';
import { usePlayground } from '../_store/usePlayground';

const nodeTypes: NodeTypes = { chip: NodeChip, phase: PhaseBand };
const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

const PETROL_SOFT = color.petrolSoft; // solid idle data-flow edges
const PETROL_TINT = color.petrolTint; // dotted idle platform/observe edges
const JADE = color.jade;              // active edge
const TEAL = color.teal;              // done edge

function orderOf(phaseId: string): number {
  return PHASES.findIndex((p) => p.id === phaseId);
}

function chipStatus(id: string, active: string | null, done: Set<string>): NodeStatus {
  if (id === active) return 'active';
  if (done.has(id)) return 'done';
  return 'idle';
}

function phaseStatusFor(phaseId: string, activePhase: string | null, cursor: number): PhaseStatus {
  if (phaseId === 'sources') return 'idle';
  if (activePhase === phaseId) return 'active';
  // done when this phase's last step has been applied
  const lastN = Math.max(...STEPS.filter((s) => s.phase === phaseId).map((s) => s.n));
  return cursor >= lastN ? 'done' : 'idle';
}

function toRFNode(
  n: SpineNode,
  active: string | null,
  done: Set<string>,
  activePhase: string | null,
  cursor: number,
): RFNode {
  if (n.kind === 'chip') {
    return {
      id: n.id,
      type: 'chip',
      position: n.position,
      data: { component: n.component, status: chipStatus(n.id, active, done) },
      width: CHIP_W,
      height: CHIP_H,
      draggable: false,
      selectable: false,
      focusable: false,
    };
  }
  const phaseId = n.id.replace('phase-', '');
  return {
    id: n.id,
    type: 'phase',
    position: n.position,
    data: {
      name: n.phase!.name,
      width: n.phase!.width,
      subtle: n.phase!.subtle,
      status: phaseStatusFor(phaseId, activePhase, cursor),
    },
    width: n.phase!.width,
    height: 40,
    draggable: false,
    selectable: false,
    focusable: false,
  };
}

function toRFEdge(e: SpineEdge, activeEdgeId: string | null, doneEdgeIds: Set<string>): RFEdge {
  const isActive = activeEdgeId === e.id;
  const isDone = !isActive && doneEdgeIds.has(e.id);
  let stroke = e.dotted ? PETROL_TINT : PETROL_SOFT;
  let strokeWidth = 1.5;
  let dasharray = e.dotted ? '2 5' : undefined;
  let className: string | undefined;
  if (isActive) {
    stroke = JADE;
    strokeWidth = 2.2;
    dasharray = '6 6';
    className = 'spine-edge-active';
  } else if (isDone) {
    stroke = TEAL;
    strokeWidth = 1.8;
  }
  return {
    id: e.id,
    source: e.from,
    target: e.to,
    type: 'smoothstep',
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
    style: { stroke, strokeWidth, strokeDasharray: dasharray },
    className,
    pathOptions: { borderRadius: 12 },
  } as RFEdge;
}

export default function Spine() {
  const { nodes, edges } = useMemo(() => buildSpineGraph(), []);
  const cursor = usePlayground((s) => s.state.cursor);
  const status = useMemo(() => deriveStatus(STEPS, cursor), [cursor]);
  const activeEdgeId = status.activeEdge ? `${status.activeEdge.from}__${status.activeEdge.to}` : null;

  return (
    <ReactFlow
      nodes={nodes.map((n) => toRFNode(n, status.activeNodeId, status.doneNodeIds, status.activePhase, cursor))}
      edges={edges.map((e) => toRFEdge(e, activeEdgeId, status.doneEdgeIds))}
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

- [ ] **Step 5: Typecheck + build**

Run:
```bash
pnpm --filter @nanisoft/playground exec tsc --noEmit && pnpm -r build
```
Expected: green. If `@xyflow/react`'s `RFEdge` type does not accept `className`, cast the object as `RFEdge` (the `pathOptions` field already requires a cast; the same cast covers `className`).

- [ ] **Step 6: Verify the spine reacts (no Controls yet — drive via the dev hook)**

Run (background): `pnpm --filter @nanisoft/playground dev`
Wait for `Local: http://localhost:3001`.

Using Playwright:
- `browser_navigate` → `http://localhost:3001`
- `browser_console_messages` with `level: "error"` → expect no errors.
- `browser_evaluate` with function:
  ```js
  () => { const s = window.__playground; s.getState().step(); s.getState().step(); return s.getState().state.cursor; }
  ```
  Expected: returns `2`.
- `browser_evaluate` with function:
  ```js
  () => { const el = document.querySelector('.spine-node-active'); return el ? el.textContent : null; }
  ```
  Expected: returns a string containing `Bridge` (step 2's actor is `bridge`, rendered as "Bridge"). This confirms the active node carries the jade class.
- Reset: `browser_evaluate` with `() => { window.__playground.getState().reset(); return window.__playground.getState().state.cursor; }` → expected `0`, and `.spine-node-active` should now be absent (evaluate returns `null`).

- [ ] **Step 7: Stop the dev server and commit**

```bash
git add apps/playground/app/globals.css apps/playground/app/_spine/NodeChip.tsx apps/playground/app/_spine/PhaseBand.tsx apps/playground/app/_spine/Spine.tsx
git commit -m "feat(playground): reactive spine (ticket 10)

Controlled React Flow reading deriveStatus(cursor): jade ring + ripple
on the active node, jade flowing active edge, teal done nodes/edges, phase
band tracking the active phase. CSS keyframes from identity motion variants
(no motion dep). prefers-reduced-motion degrades to static jade/teal."
```

---

## Task 6: Inspector — Bronze/Silver/Gold/Schema/Audit

**Files:**
- Create: `apps/playground/app/_inspector/Inspector.tsx`

**Interfaces:**
- Consumes: `usePlayground` from `../_store/usePlayground`; `color`, `font`, `radius`, `surface` from `@nanisoft/identity`.
- Produces: `<Inspector />` showing the live state, used by Task 8's composition.

- [ ] **Step 1: Create the Inspector**

Create `apps/playground/app/_inspector/Inspector.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { color, font, radius, surface } from '@nanisoft/identity';
import { usePlayground } from '../_store/usePlayground';

const TABS = ['Bronze', 'Silver', 'Gold', 'Schema', 'Audit'] as const;
type Tab = (typeof TABS)[number];

function esc(s: unknown): string {
  return String(s ?? '');
}

export function Inspector() {
  const state = usePlayground((s) => s.state);
  const [tab, setTab] = useState<Tab>('Gold');

  const bronzeRows = state.bronze.products.length + state.bronze.viewLogs.length;
  const silverRows = state.silver.extProduct.length + state.silver.extViewLog.length;

  const cardStyle: React.CSSProperties = {
    background: surface.light.elevated,
    border: `1px solid ${surface.light.border}`,
    borderRadius: radius.card,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 360,
  };
  const labelStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: font.data,
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: surface.light.textMuted,
  };
  const bodyStyle: React.CSSProperties = {
    fontFamily: font.data,
    fontSize: 11.5,
    color: surface.light.text,
    background: surface.light.sunken,
    borderRadius: radius.inner,
    padding: 10,
    flex: 1,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.7,
  };
  const rowBorder: React.CSSProperties = { borderBottom: `1px dashed ${surface.light.border}`, padding: '3px 0' };
  const emptyStyle: React.CSSProperties = { opacity: 0.55, fontStyle: 'italic' };
  const k: React.CSSProperties = { color: color.teal };
  const j: React.CSSProperties = { color: color.jade };

  let body: React.ReactNode;
  if (tab === 'Bronze') {
    body = bronzeRows === 0 ? <div style={emptyStyle}>Bronze empty — no tables yet.</div> : (
      <>
        <div style={rowBorder}><span style={k}>ext_product</span> · {state.bronze.products.length} rows</div>
        <div style={rowBorder}><span style={k}>view_logs</span> · {state.bronze.viewLogs.length} rows</div>
      </>
    );
  } else if (tab === 'Silver') {
    body = silverRows === 0 ? <div style={emptyStyle}>Silver empty — transform has not run.</div> : (
      <>
        <div style={rowBorder}><span style={k}>ext_product</span> · {state.silver.extProduct.length} rows · conformed + SCD2</div>
        <div style={rowBorder}><span style={k}>view_logs</span> · {state.silver.extViewLog.length} rows · conformed</div>
      </>
    );
  } else if (tab === 'Gold') {
    body = (
      <>
        <div style={rowBorder}><span style={k}>graph_nodes</span> · <span style={j}>{state.gold.nodes.length}</span></div>
        {state.gold.nodes.map((n) => (
          <div key={n.id} style={rowBorder}>&nbsp;&nbsp;{esc(n.id)} <span style={k}>{esc(n.kind)}</span>{n.sensitive ? <span style={j}> · sensitive</span> : null}</div>
        ))}
        <div style={{ ...rowBorder, marginTop: 6 }}><span style={k}>graph_edges</span> · <span style={j}>{state.gold.edges.length}</span></div>
        {state.gold.edges.map((e) => {
          const dec = e.status === 'anomalous' ? <span style={j}> · anomalous</span> : e.status === 'ok' ? <span style={{ color: color.teal }}> · ok</span> : null;
          return <div key={e.id} style={rowBorder}>&nbsp;&nbsp;{esc(e.from)} <span style={k}>-{esc(e.kind)}-&gt;</span> {esc(e.to)}{dec}</div>;
        })}
      </>
    );
  } else if (tab === 'Schema') {
    const types = Object.keys(state.schemaRegistry);
    body = types.length === 0 ? <div style={emptyStyle}>SchemaRegistry empty — no types defined yet.</div> : types.map((t) => {
      const obj = state.schemaRegistry[t];
      return (
        <div key={t} style={rowBorder}>
          <span style={k}>{esc(t)}</span> · table ext_product<br />
          &nbsp;&nbsp;{obj.fields.map((f) => (
            <span key={f.name} style={{ marginRight: 12 }}>
              {f.name === 'Sensitive' ? <span style={j}>{f.name}</span> : <span style={k}>{f.name}</span>}:{f.type}
            </span>
          ))}
        </div>
      );
    });
  } else {
    body = state.auditLog.length === 0 ? <div style={emptyStyle}>audit_log empty — no runs yet.</div> : state.auditLog.map((a, i) => (
      <div key={i} style={rowBorder}><span style={k}>{esc(a.ts)}</span> · {esc(a.actor)} · {esc(a.useCase)} · <span style={j}>{esc(a.decision)}</span><br />&nbsp;&nbsp;{esc(a.detail)}</div>
    ));
  }

  const counts: { label: string; value: number; accent?: 'teal' | 'jade' }[] = [
    { label: 'Bronze', value: bronzeRows },
    { label: 'Silver', value: silverRows, accent: 'teal' },
    { label: 'Gold nodes', value: state.gold.nodes.length, accent: 'teal' },
    { label: 'Gold edges', value: state.gold.edges.length, accent: 'jade' },
    { label: 'Audit', value: state.auditLog.length },
  ];

  return (
    <div style={cardStyle}>
      <p style={labelStyle}>shared in-browser state · live</p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {counts.map((c) => (
          <div key={c.label} style={{ fontFamily: font.data, fontSize: 10, color: surface.light.textMuted }}>
            {c.label}
            <br />
            <b style={{
              fontSize: 15,
              color: c.accent === 'jade' ? color.jade : c.accent === 'teal' ? color.teal : surface.light.text,
            }}>{c.value}</b>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: font.data,
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: t === tab ? surface.light.bg : 'transparent',
              border: `1px solid ${surface.light.border}`,
              color: t === tab ? surface.light.text : surface.light.textMuted,
              padding: '5px 10px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >{t}</button>
        ))}
      </div>
      <div style={bodyStyle} aria-label="inspector-state">{body}</div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + build**

Run:
```bash
pnpm --filter @nanisoft/playground exec tsc --noEmit && pnpm -r build
```
Expected: green.

- [ ] **Step 3: Commit**

```bash
git add apps/playground/app/_inspector/Inspector.tsx
git commit -m "feat(playground): state inspector (ticket 10)

Bronze/Silver/Gold/Schema/Audit tabs + counts, reading the live store.
Jade reserved for the Gold-edges count + audit decision + Sensitive field;
teal for done-flavored counts. Updates after every step."
```

---

## Task 7: Narrative + Controls

**Files:**
- Create: `apps/playground/app/_spine/Narrative.tsx`
- Create: `apps/playground/app/_controls/Controls.tsx`

**Interfaces:**
- Consumes: `usePlayground`, `STEP_PACE_MS`, `STEPS` from `../_store/usePlayground`; `color`, `font`, `radius`, `surface` from `@nanisoft/identity`.
- Produces: `<Narrative />` + `<Controls />`, used by Task 8's composition.

- [ ] **Step 1: Create the Narrative**

Create `apps/playground/app/_spine/Narrative.tsx`:

```tsx
'use client';

import { color, font, radius, surface } from '@nanisoft/identity';
import { SENSITIVE_PRODUCT_VIEW_AUDIT } from '@nanisoft/architecture';
import { usePlayground, STEPS } from '../_store/usePlayground';

export function Narrative() {
  const cursor = usePlayground((s) => s.state.cursor);
  const total = STEPS.length;
  const step = cursor > 0 ? SENSITIVE_PRODUCT_VIEW_AUDIT[cursor - 1] : null;

  const cardStyle: React.CSSProperties = {
    background: surface.light.sunken,
    borderRadius: radius.inner,
    padding: '12px 14px',
    marginTop: 12,
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontFamily: font.data, fontSize: 11, letterSpacing: '0.04em', color: color.teal }}>
        step {cursor} / {total}{step ? ` · phase: ${step.phase}` : ''}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', margin: '2px 0 6px', color: surface.light.text }}>
        {step ? step.title : 'Press Run to step the twin.'}
      </div>
      <div style={{ color: surface.light.textMuted, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
        {step ? step.desc : 'The playbook engine will animate the Sensitive Product View Audit through every phase. Each step mutates the shared lakehouse state and writes the audit log where the real system would.'}
      </div>

      {/* progress bar */}
      <div style={{ height: 6, borderRadius: 9999, background: surface.light.border, overflow: 'hidden', marginTop: 12 }}>
        <div style={{ height: '100%', width: `${(cursor / total) * 100}%`, background: color.jade, transition: 'width 0.4s cubic-bezier(.32,.72,0,1)' }} />
      </div>

      {/* step list */}
      <div style={{ maxHeight: 170, overflow: 'auto', borderTop: `1px solid ${surface.light.border}`, marginTop: 10, paddingTop: 8 }}>
        {SENSITIVE_PRODUCT_VIEW_AUDIT.map((s, i) => {
          const cls = i + 1 < cursor ? 'done' : i + 1 === cursor ? 'now' : '';
          const colorFor = cls === 'done' ? color.teal : cls === 'now' ? color.jade : surface.light.textMuted;
          return (
            <div key={s.n} style={{ display: 'flex', gap: 8, padding: '3px 0', fontFamily: font.data, fontSize: 10.5, color: colorFor }}>
              <span style={{ width: 22 }}>{String(s.n).padStart(2, '0')}</span>
              <span>{s.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the Controls**

Create `apps/playground/app/_controls/Controls.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { color, font, radius, surface } from '@nanisoft/identity';
import { usePlayground, STEPS } from '../_store/usePlayground';

export function Controls() {
  const running = usePlayground((s) => s.running);
  const cursor = usePlayground((s) => s.state.cursor);
  const step = usePlayground((s) => s.step);
  const run = usePlayground((s) => s.run);
  const pause = usePlayground((s) => s.pause);
  const reset = usePlayground((s) => s.reset);
  const exportJson = usePlayground((s) => s.exportJson);
  const importJson = usePlayground((s) => s.importJson);

  const [ioOpen, setIoOpen] = useState(false);
  const [ioText, setIoText] = useState('');
  const [ioMsg, setIoMsg] = useState('');

  const atEnd = cursor >= STEPS.length;

  const btn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: `1px solid ${surface.light.border}`,
    background: surface.light.elevated,
    color: surface.light.text,
    fontFamily: font.voice,
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: 9999,
  };
  const primary: React.CSSProperties = { ...btn, background: color.jade, color: surface.light.bg, borderColor: color.jade };
  const disabled: React.CSSProperties = { ...btn, opacity: 0.4, cursor: 'not-allowed' };

  function onExport() {
    const json = exportJson();
    setIoText(json);
    setIoMsg('state exported — paste a new state and click Import, or copy this.');
    setIoOpen(true);
  }

  function onImport() {
    if (!ioOpen) {
      setIoText('');
      setIoMsg('paste exported JSON here, then click Import again.');
      setIoOpen(true);
      return;
    }
    const res = importJson(ioText);
    setIoMsg(res.ok ? 'imported ✓ — state replaced.' : `invalid: ${res.error}`);
  }

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {running ? (
          <button style={primary} onClick={pause}>⏸ Pause</button>
        ) : (
          <button style={atEnd ? disabled : primary} onClick={run} disabled={atEnd}>▶ Run playbook</button>
        )}
        <button style={atEnd ? disabled : btn} onClick={step} disabled={atEnd}>Step →</button>
        <button style={btn} onClick={reset}>Reset</button>
        <button style={btn} onClick={onExport}>Export state</button>
        <button style={btn} onClick={onImport}>Import state</button>
      </div>
      {ioOpen && (
        <>
          <textarea
            value={ioText}
            onChange={(e) => setIoText(e.target.value)}
            placeholder="paste exported JSON here"
            style={{
              width: '100%',
              height: 64,
              fontFamily: font.data,
              fontSize: 10,
              background: surface.light.sunken,
              color: surface.light.text,
              border: `1px solid ${surface.light.border}`,
              borderRadius: 8,
              padding: 8,
            }}
          />
          {ioMsg && <div style={{ fontFamily: font.data, fontSize: 11, color: surface.light.textMuted }}>{ioMsg}</div>}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + build**

Run:
```bash
pnpm --filter @nanisoft/playground exec tsc --noEmit && pnpm -r build
```
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add apps/playground/app/_spine/Narrative.tsx apps/playground/app/_controls/Controls.tsx
git commit -m "feat(playground): narrative + controls (ticket 10)

Narrative: current step number/phase/title/desc + jade progress bar +
step list (teal done / jade now / muted pending). Controls: Run/Pause,
Step, Reset, Export, Import over the store actions."
```

---

## Task 8: Compose the playground + full render verification

**Files:**
- Modify: `apps/playground/app/playground-client.tsx`

**Interfaces:**
- Consumes: `Spine` (dynamic) from `./_spine/Spine`; `Narrative` from `./_spine/Narrative`; `Controls` from `./_controls/Controls`; `Inspector` from `./_inspector/Inspector`; `APP_NAME`, `ARCHITECTURE_VERSION` from `@nanisoft/architecture`; `font`, `IDENTITY_VERSION`, `surface` from `@nanisoft/identity`.

- [ ] **Step 1: Rewrite `playground-client.tsx` with the 2-column layout**

Replace the full contents of `apps/playground/app/playground-client.tsx`:

```tsx
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { APP_NAME, ARCHITECTURE_VERSION } from '@nanisoft/architecture';
import { font, IDENTITY_VERSION, radius, surface } from '@nanisoft/identity';
import { Narrative } from './_spine/Narrative';
import { Controls } from './_controls/Controls';
import { Inspector } from './_inspector/Inspector';

// ssr:false lives INSIDE this 'use client' wrapper (never in a Server Component).
const Spine = dynamic(() => import('./_spine/Spine'), {
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
          <p style={{ margin: '4px 0 0', color: surface.light.textMuted, fontSize: 14, maxWidth: '70ch' }}>
            The digital-twin pipeline, stepped live. Run the Sensitive Product View Audit and watch the twin move through Schema → Ingestion → Transform → Investigation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', fontFamily: font.data, fontSize: 12, color: surface.light.textMuted }}>
          <span>arch v{ARCHITECTURE_VERSION}</span>
          <span>identity v{IDENTITY_VERSION}</span>
          <Link href="/tokens" style={{ color: surface.light.textMuted, textDecoration: 'underline' }}>tokens</Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '0 32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, alignItems: 'start' }}>
          {/* left: spine + narrative + controls */}
          <div>
            <div
              style={{
                width: '100%',
                height: '70vh',
                minHeight: 520,
                borderRadius: radius.card,
                border: `1px solid ${surface.light.border}`,
                overflow: 'hidden',
                background: surface.light.elevated,
              }}
            >
              <Spine />
            </div>
            <Narrative />
            <Controls />
          </div>
          {/* right: inspector */}
          <Inspector />
        </div>
        {/* stack on narrow screens */}
        <style>{`@media (max-width: 980px) { main > div { grid-template-columns: 1fr !important; } }`}</style>
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
        <span>19 components · 4 phases · jade = the live step, teal = done</span>
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

- [ ] **Step 2: Full workspace build**

Run: `pnpm -r build`
Expected: green (both apps + architecture). If `@xyflow/react`'s edge `className` causes a type error in `Spine.tsx`, confirm the `as RFEdge` cast is present (Task 5 Step 4).

- [ ] **Step 3: Start the dev server**

Run (background): `pnpm --filter @nanisoft/playground dev`
Wait for the `Local: http://localhost:3001` line.

- [ ] **Step 4: Verify console is clean**

Using Playwright:
- `browser_navigate` → `http://localhost:3001`
- `browser_console_messages` with `level: "error"` → expect no errors and no warnings.

- [ ] **Step 5: Verify the controls + inspector render (a11y)**

- `browser_snapshot`
- `browser_find` for each of: `Run playbook`, `Step`, `Reset`, `Export state`, `Import state`, `Bronze`, `Silver`, `Gold`, `Schema`, `Audit` → all present.

- [ ] **Step 6: Verify a full run + the teaching state (no-vision, via the dev hook + Gold tab)**

- `browser_evaluate` with function:
  ```js
  () => { const s = window.__playground; for (let i = 0; i < 22; i++) s.getState().step(); return { cursor: s.getState().state.cursor, goldNodes: s.getState().state.gold.nodes.length, goldEdges: s.getState().state.gold.edges.length, audit: s.getState().state.auditLog.length, findingUser: s.getState().state.finding?.user }; }
  ```
  Expected: `{ cursor: 22, goldNodes: 5, goldEdges: 4, audit: 3, findingUser: 'j.harper' }`.

- `browser_evaluate` to click the Gold tab and read the anomalous row:
  ```js
  () => { const btns = [...document.querySelectorAll('button')]; const gold = btns.find(b => b.textContent === 'Gold'); gold?.click(); return document.querySelector('[aria-label="inspector-state"]')?.textContent; }
  ```
  Expected: the returned text contains `j.harper`, `viewed`, `P-1042`, and `anomalous` (the finding surfaced as a Gold edge).

- [ ] **Step 7: Verify export → reset → import roundtrips**

- `browser_evaluate`:
  ```js
  () => { const s = window.__playground; const json = s.getState().exportJson(); s.getState().reset(); const before = s.getState().state.cursor; const res = s.getState().importJson(json); return { beforeReset: before, afterImport: s.getState().state.cursor, ok: res.ok }; }
  ```
  Expected: `{ beforeReset: 0, afterImport: 22, ok: true }` (reset cleared to 0; import restored cursor 22).

- [ ] **Step 8: Verify prefers-reduced-motion degrades gracefully**

- `browser_evaluate`:
  ```js
  () => { const s = window.__playground; s.getState().reset(); s.getState().step(); s.getState().step(); const active = document.querySelector('.spine-node-active'); return active ? active.getAttribute('style') : null; }
  ```
  Then emulate reduced motion: `browser_evaluate` to inject the media query is not necessary — instead assert the active node's inline border is jade regardless (the inline style carries the state):
  Expected: the returned style string contains `#14A77A` (jade border), confirming the active state is visible without relying on the animation. (The global `@media (prefers-reduced-motion)` block suppresses the `spine-ripple`/`spine-flow` animations; this step confirms the jade state still shows.)

- [ ] **Step 9: Human visual confirm**

Ask the human to open `http://localhost:3001` and confirm:
- At rest (Reset): the spine is idle (petrol chips/edges), no jade, the phase bands neutral, the inspector shows empty Bronze/Silver/Gold.
- Press Run: the active node gets a jade ring + soft pulse, the active edge flows jade, done nodes/edges turn teal, the phase band tracks the active phase, the narrative + step list advance, the inspector updates after each step.
- The run completes at step 22 with no errors; the Gold tab shows the anomalous `j.harper → P-1042` edge.
- The layout is a 2-column grid on desktop (spine+narrative+controls left, inspector right) and stacks on narrow width.
Wait for their confirmation.

- [ ] **Step 10: Stop the dev server and commit**

```bash
git add apps/playground/app/playground-client.tsx
git commit -m "feat(playground): compose reactive spine + inspector + controls (ticket 10)

2-column layout (spine + narrative + controls left, inspector right),
stacking under 980px. Subtitle now reflects the live engine. Render-
verified: build green, console clean, full 22-step run produces Gold
5/4 + the anomaly + 3 audit entries, export/reset/import roundtrips."
```

---

## Self-Review (completed during planning)

**1. Spec coverage:**
- Zustand store (Bronze/Silver/Gold + SchemaRegistry + audit_log; session-only + export/import + reset) → Task 3 store over `PlaygroundState`; reset = `blankState()`; export/import in Task 1 + wired in Task 3. ✓
- Declarative playbook engine (ordered phase-steps with actor + active edge + narrative + mutate; flagship 22-step mirrored from the mermaid) → Task 2 `SENSITIVE_PRODUCT_VIEW_AUDIT`; 22-step table; mirrored from `TrueAccess_Schema_to_Visualization_Sequence.mermaid`. ✓
- Controls (auto-run + single-step + reset; ~1.1s tunable) → Task 7 `Controls` + `STEP_PACE_MS = 1100`. ✓
- Spine reacts (actor jade + active edge animates; done teal; phase band tracks) → Task 5 controlled `Spine` + `NodeChip`/`PhaseBand`/edge status. ✓
- Inspector shows state after every step → Task 6 `Inspector` reading the store. ✓
- 09 carry-forward platform-id fix → Task 4. ✓
- Vitest for the pure core → Tasks 1 + 2. ✓

**2. Placeholder scan:** none — every code step contains the full file content; verification steps have exact `browser_evaluate` scripts and expected results.

**3. Type consistency:**
- `PlaybookStep`, `PlaygroundState`, `StepStatus` defined in Task 1 (`playground-state.ts`) and re-exported from `index.ts`; consumed in Task 2 (`playbook.ts`), Task 3 (store), Task 5 (`Spine.tsx`). ✓
- `NodeStatus` / `PhaseStatus` defined in Task 5 (`NodeChip`/`PhaseBand`) and consumed in `Spine.tsx`. ✓
- `STEP_PACE_MS` + `STEPS` exported from Task 3 store and consumed in Tasks 5 + 7. ✓
- `usePlayground` actions `step/run/pause/reset/exportJson/importJson` (Task 3) match the Controls calls (Task 7). ✓
- Edge id convention `from__to` is produced in `deriveStatus` (Task 1) and `spine-graph.ts` (09, `${e.from}__${e.to}`) and consumed in `Spine.tsx` `activeEdgeId` (Task 5). ✓
- `InvalidStateError` thrown in `importState` (Task 1) and caught in `importJson` (Task 3). ✓