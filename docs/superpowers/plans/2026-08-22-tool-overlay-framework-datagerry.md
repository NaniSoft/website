# Tool-overlay framework + DataGerry mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the mocked-tool overlay framework (uniform chrome + open/close + beckon off the ticket-10 spine) and the first tool instance — DataGerry/Blueprint schema authoring — establishing the one-code-path pattern (the overlay's canonical action IS a playbook step).

**Architecture:** Pure domain core (`packages/architecture`, framework-agnostic, vitest) holds the overlay chrome reducer, beckon derivation, sync-status derivation, and the `authorSensitiveProductField` canonical-action mutate. `apps/playground` holds the thin Zustand shell + React/React Flow rendering: a `ToolOverlay` chrome shell + a `TOOL_CONTENT` registry (single drop-in point for tickets 12–16) + the DataGerry body, wired into a split-pane spine card. The overlay's "Add Sensitive: bool" button calls `store.step()` — the same `applyStep` auto-run uses.

**Tech Stack:** Next.js 16.3.1 (stock, modified — see Global Constraints), pnpm monorepo, `@xyflow/react` ^12, Zustand ^5, `@nanisoft/architecture` + `@nanisoft/identity` (workspace), vitest 4 (architecture package only).

## Global Constraints

- **AGENTS.md (modified Next.js):** read the relevant guide in `node_modules/next/dist/docs/` (resolved from the consuming app's directory) before writing any Next code. Heed deprecation notices. `'use client'` wrapper + `dynamic({ssr:false})` stays INSIDE the client wrapper (never in a Server Component) — follow the 09/10 pattern (`page.tsx` Server → `playground-client.tsx` `'use client'` → `dynamic(ssr:false)` `Spine`).
- **No vision workflow:** verify via `pnpm -r build`, console messages, Playwright MCP a11y snapshot, live JS state (`window.__playground.getState()`), + a human visual confirm (the human confirm is deferred — operator AFK; a11y + build + live-state stand in).
- **Add vitest for any pure logic** (architecture package; `environment: node`, `tests/**/*.test.ts`). React components have no unit-test runner in the playground — verify via build + Playwright MCP.
- **Jade = single locked accent, live/active only; teal = done. No pure white/black.** Jade appears only on: the beckoning tool node ripple, the live `Sensitive` field, the active sync stage, and the enabled action button's accent.
- **Pure core must not import React/Next/Zustand/React Flow.** The overlay React lives in `apps/playground`.
- **Identity tokens:** `color`, `surface`, `font`, `radius`, `easing` from `@nanisoft/identity`; motion variants `ripple`/`settle` + `withReducedMotion`. Shape lock: card radius 20, inner 12, buttons pills.
- Run tests from the repo root with `pnpm -r run test` (architecture + identity + landing). The playground has no test script.
- Commit on the branch `feat/11-tool-overlay-framework-datagerry` (already checked out).

---

## File Structure

**`packages/architecture` (pure + vitest):**
- Create `src/tool-actions.ts` — `authorSensitiveProductField(state)` (the DataGerry canonical-action mutate; idempotent).
- Create `src/overlay.ts` — `OverlayState`/`OverlayAction` types, `overlayReducer`, `beckonToolId`, `dataGerrySyncStatus`.
- Modify `src/dataset.ts` — add `bridgedTables: string[]` to `SeedDataset`; `createSeed()` sets `['ext_product']`.
- Modify `src/playground-state.ts` — `blankState()` drafted-`Product` registry + `bridgedTables: []`; `STATE_FIELDS` + import validation.
- Modify `src/playbook.ts` — step 1 `apply` → `authorSensitiveProductField`; step 1 `openTool: 'blueprint'`; step 3 `apply` → push `'ext_product'`.
- Modify `src/index.ts` — re-export new symbols.
- Create `tests/tool-actions.test.ts`, `tests/overlay.test.ts`; modify `tests/playground-state.test.ts`, `tests/seed.test.ts`, `tests/playbook.test.ts`.

**`apps/playground` (React shell):**
- Modify `app/_store/usePlayground.ts` — `overlay` state + `openTool`/`closeTool`.
- Modify `app/globals.css` — `.spine-node-beckon` (ripple) + `.spine-node-open` (no ripple); drop `.spine-node-active`.
- Modify `app/_spine/NodeChip.tsx` — clickable full-UI nodes; `beckon`/`open` styling.
- Modify `app/_spine/Spine.tsx` — `beckonToolId` + overlay wiring + `onPaneClick` + `ReactFlowProvider`/`useReactFlow` re-fit.
- Create `app/_overlay/ToolOverlay.tsx` — uniform chrome shell.
- Create `app/_overlay/DataGerryOverlay.tsx` — DataGerry mock body.
- Create `app/_overlay/tool-content.ts` — `TOOL_CONTENT` registry.
- Modify `app/playground-client.tsx` — split-pane spine card.

---

### Task 1: Pure core — `bridgedTables` + drafted-`Product` blank state

**Files:**
- Modify: `packages/architecture/src/dataset.ts` (the `SeedDataset` interface ~line 157, `createSeed()` ~line 301)
- Modify: `packages/architecture/src/playground-state.ts` (`blankState()` ~line 71, `STATE_FIELDS` ~line 146, `importState` ~line 165)
- Test: `packages/architecture/tests/playground-state.test.ts`, `packages/architecture/tests/seed.test.ts`

**Interfaces:**
- Produces: `SeedDataset.bridgedTables: string[]`; `blankState().schemaRegistry = { Product: { name: 'Product', fields: [id,name,owner_group] } }`; `blankState().bridgedTables = []`; `SEED.bridgedTables = ['ext_product']`; `importState` requires `bridgedTables` to be an array.

- [ ] **Step 1: Write the failing tests**

Append to `packages/architecture/tests/playground-state.test.ts`, inside the `describe('blankState …')` block, after the existing `schemaRegistry` assertion (replace the line `expect(s.schemaRegistry).toEqual({});` with the drafted-Product assertion + add bridgedTables):

```ts
  // SPEC §4.8: Product is drafted (id/name/owner_group) pre-pipeline; step 1
  // authors the Sensitive: bool field — the definitional hinge.
  expect(s.schemaRegistry).toEqual({
    Product: {
      name: 'Product',
      fields: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'owner_group', type: 'string' },
      ],
    },
  });
  // SPEC §4.8: the Bridge writes the ext_product table schema (step 3); empty pre-pipeline.
  expect(s.bridgedTables).toEqual([]);
```

Add a new describe block at the end of `playground-state.test.ts`:

```ts
describe('bridgedTables — SPEC §4.8 (Bridge writes ext_product)', () => {
  it('blankState starts with no bridged tables', () => {
    expect(blankState().bridgedTables).toEqual([]);
  });

  it('importState rejects a state missing bridgedTables', () => {
    const played = reduceToCursor(fake, 1);
    const bad = JSON.parse(exportState(played));
    delete bad.bridgedTables;
    expect(() => importState(JSON.stringify(bad))).toThrow(InvalidStateError);
  });

  it('importState rejects a non-array bridgedTables', () => {
    const played = reduceToCursor(fake, 1);
    const bad = JSON.parse(exportState(played));
    bad.bridgedTables = 'nope';
    expect(() => importState(JSON.stringify(bad))).toThrow(InvalidStateError);
  });

  it('roundtrips bridgedTables unchanged', () => {
    const played = reduceToCursor(fake, 1);
    played.bridgedTables = ['ext_product'];
    const back = importState(exportState(played));
    expect(back.bridgedTables).toEqual(['ext_product']);
  });
});
```

Append to `packages/architecture/tests/seed.test.ts`, inside the `describe('seeded dataset — SPEC §4.6 counts')` block:

```ts
  it('SEED carries ext_product as already bridged (the seed is the post-run teaching state)', () => {
    expect(SEED.bridgedTables).toEqual(['ext_product']);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nanisoft/architecture run test`
Expected: FAIL — `s.bridgedTables` is undefined; `s.schemaRegistry` is `{}` (not the drafted Product); `SEED.bridgedTables` undefined.

- [ ] **Step 3: Implement — `dataset.ts`**

In `packages/architecture/src/dataset.ts`, add `bridgedTables` to the `SeedDataset` interface (after `auditLog`):

```ts
  /** Atlas writes here on the authz step; empty in the seed. */
  auditLog: AuditEntry[];
  /** Tables the DataGerry Bridge has written DDL for (SPEC §4.8). Empty pre-pipeline; SEED = ['ext_product']. */
  bridgedTables: string[];
```

In `createSeed()`, add `bridgedTables: ['ext_product'],` (next to `auditLog: []`):

```ts
    auditLog: [],
    bridgedTables: ['ext_product'],
```

- [ ] **Step 4: Implement — `playground-state.ts` blankState**

In `packages/architecture/src/playground-state.ts`, replace the `schemaRegistry: {},` line in `blankState()` with the drafted Product, and add `bridgedTables: []`:

```ts
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
```

- [ ] **Step 5: Implement — `playground-state.ts` STATE_FIELDS + import validation**

Add `'bridgedTables'` to the `STATE_FIELDS` array (after `'auditLog'`):

```ts
const STATE_FIELDS = [
  'products', 'users', 'groups', 'groupMemberships', 'viewLogs',
  'schemaRegistry', 'bronze', 'silver', 'gold', 'auditLog', 'bridgedTables', 'finding', 'cursor',
] as const;
```

In `importState`, after the `auditLog` array check, add a `bridgedTables` array check:

```ts
  if (!Array.isArray(p.auditLog)) {
    throw new InvalidStateError('auditLog must be an array');
  }
  if (!Array.isArray(p.bridgedTables)) {
    throw new InvalidStateError('bridgedTables must be an array');
  }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @nanisoft/architecture run test`
Expected: PASS (all architecture tests green, including the new ones).

- [ ] **Step 7: Commit**

```bash
git add packages/architecture/src/dataset.ts packages/architecture/src/playground-state.ts packages/architecture/tests/playground-state.test.ts packages/architecture/tests/seed.test.ts
git commit -m "feat(arch): bridgedTables + drafted-Product blank state (ticket 11)"
```

---

### Task 2: Pure core — `authorSensitiveProductField` canonical action

**Files:**
- Create: `packages/architecture/src/tool-actions.ts`
- Modify: `packages/architecture/src/index.ts` (re-export)
- Test: `packages/architecture/tests/tool-actions.test.ts`

**Interfaces:**
- Produces: `authorSensitiveProductField(state: PlaygroundState): void` — idempotently pushes `{ name: 'Sensitive', type: 'bool' }` onto `state.schemaRegistry.Product.fields` (creates `Product` defensively if absent).

- [ ] **Step 1: Write the failing test**

Create `packages/architecture/tests/tool-actions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  authorSensitiveProductField,
  blankState,
  reduceToCursor,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
} from '../src/index';

const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

describe('authorSensitiveProductField — SPEC §4.8 DataGerry canonical action', () => {
  it('adds Sensitive: bool to a drafted Product (3 fields → 4)', () => {
    const s = blankState();
    expect(s.schemaRegistry.Product.fields.map((f) => f.name)).toEqual(['id', 'name', 'owner_group']);
    authorSensitiveProductField(s);
    const sensitive = s.schemaRegistry.Product.fields.find((f) => f.name === 'Sensitive');
    expect(sensitive).toEqual({ name: 'Sensitive', type: 'bool' });
    expect(s.schemaRegistry.Product.fields).toHaveLength(4);
  });

  it('is idempotent (a second call adds no duplicate)', () => {
    const s = blankState();
    authorSensitiveProductField(s);
    authorSensitiveProductField(s);
    const sens = s.schemaRegistry.Product.fields.filter((f) => f.name === 'Sensitive');
    expect(sens).toHaveLength(1);
    expect(s.schemaRegistry.Product.fields).toHaveLength(4);
  });

  it('creates Product defensively if absent', () => {
    const s = blankState();
    s.schemaRegistry = {};
    authorSensitiveProductField(s);
    expect(s.schemaRegistry.Product.fields).toEqual([{ name: 'Sensitive', type: 'bool' }]);
  });

  it('is the same mutate step 1 applies (one code path)', () => {
    const s = reduceToCursor(STEPS, 1);
    const sens = s.schemaRegistry.Product.fields.find((f) => f.name === 'Sensitive');
    expect(sens).toEqual({ name: 'Sensitive', type: 'bool' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @nanisoft/architecture run test -- tool-actions`
Expected: FAIL — `authorSensitiveProductField` is not exported (and step 1 still does the wholesale clone, so the "one code path" test's `Sensitive` is present but via the old path; the import fails first).

- [ ] **Step 3: Implement — `tool-actions.ts`**

Create `packages/architecture/src/tool-actions.ts`:

```ts
/**
 * Per-tool canonical-action mutates (SPEC §4.8). Each is the *one honest act* a
 * single-stepping learner performs, and is also what auto-run's playbook step
 * calls — one code path per tool. Mutates a *clone* of the state (the reducer
 * clones before calling `apply`), so these are plain mutation code.
 */
import type { PlaygroundState } from './playground-state';

/**
 * DataGerry / Blueprint canonical action — the definitional hinge (SPEC §4.8):
 * add the `Sensitive: bool` field to the `Product` ObjectType before any data
 * flows. Idempotent (a no-op if `Sensitive` is already present). Creates the
 * `Product` ObjectType defensively if it is absent.
 *
 * Used by step 1's `apply` AND by the overlay's "Add Sensitive: bool" button —
 * the one code path.
 */
export function authorSensitiveProductField(state: PlaygroundState): void {
  let product = state.schemaRegistry.Product;
  if (!product) {
    product = { name: 'Product', fields: [] };
    state.schemaRegistry.Product = product;
  }
  if (!product.fields.some((f) => f.name === 'Sensitive')) {
    product.fields.push({ name: 'Sensitive', type: 'bool' });
  }
}
```

- [ ] **Step 4: Re-export from `index.ts`**

In `packages/architecture/src/index.ts`, add a new export section after the mock-tool-specs block:

```ts
// ── Tool canonical actions ───────────────────────────────────────────────────
export { authorSensitiveProductField } from './tool-actions';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @nanisoft/architecture run test -- tool-actions`
Expected: the first three tests PASS; the "one code path" test still FAILS (step 1 hasn't been rewired yet — it still does the wholesale clone). That's expected; Task 4 rewires step 1.

- [ ] **Step 6: Commit**

```bash
git add packages/architecture/src/tool-actions.ts packages/architecture/src/index.ts packages/architecture/tests/tool-actions.test.ts
git commit -m "feat(arch): authorSensitiveProductField canonical action (ticket 11)"
```

---

### Task 3: Pure core — overlay reducer + beckon + sync-status

**Files:**
- Create: `packages/architecture/src/overlay.ts`
- Modify: `packages/architecture/src/index.ts` (re-export)
- Test: `packages/architecture/tests/overlay.test.ts`

**Interfaces:**
- Produces:
  - `OverlayState = { componentId: string; openedAtCursor: number } | null`
  - `OverlayAction = { type: 'open'; componentId: string; cursor: number } | { type: 'close' } | { type: 'reset' }`
  - `overlayReducer(state: OverlayState, action: OverlayAction): OverlayState`
  - `beckonToolId(steps: readonly PlaybookStep[], cursor: number): string | null`
  - `DataGerrySyncStatus = { authored: boolean; bedrock: boolean; atlas: boolean }`
  - `dataGerrySyncStatus(state: PlaygroundState, cursor: number): DataGerrySyncStatus`

- [ ] **Step 1: Write the failing test**

Create `packages/architecture/tests/overlay.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  beckonToolId,
  dataGerrySyncStatus,
  overlayReducer,
  blankState,
  reduceToCursor,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  type OverlayState,
} from '../src/index';

const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

describe('overlayReducer — SPEC §4.8 chrome state', () => {
  it('opens with the component id + cursor recorded', () => {
    const s = overlayReducer(null, { type: 'open', componentId: 'blueprint', cursor: 0 });
    expect(s).toEqual({ componentId: 'blueprint', openedAtCursor: 0 });
  });
  it('open replaces an existing overlay (no stacking)', () => {
    let s: OverlayState = null;
    s = overlayReducer(s, { type: 'open', componentId: 'blueprint', cursor: 0 });
    s = overlayReducer(s, { type: 'open', componentId: 'compass', cursor: 11 });
    expect(s).toEqual({ componentId: 'compass', openedAtCursor: 11 });
  });
  it('close → null', () => {
    let s: OverlayState = overlayReducer(null, { type: 'open', componentId: 'blueprint', cursor: 0 });
    s = overlayReducer(s, { type: 'close' });
    expect(s).toBeNull();
  });
  it('reset → null', () => {
    let s: OverlayState = overlayReducer(null, { type: 'open', componentId: 'blueprint', cursor: 0 });
    s = overlayReducer(s, { type: 'reset' });
    expect(s).toBeNull();
  });
});

describe('beckonToolId — SPEC §4.8 auto-run = beckon', () => {
  it('cursor 0 → null (no active step)', () => {
    expect(beckonToolId(STEPS, 0)).toBeNull();
  });
  it('cursor 1 → blueprint (step 1 openTool)', () => {
    expect(beckonToolId(STEPS, 1)).toBe('blueprint');
  });
  it('cursor 11 → compass (step 11 openTool)', () => {
    expect(beckonToolId(STEPS, 11)).toBe('compass');
  });
  it('cursor 22 → null (run complete)', () => {
    expect(beckonToolId(STEPS, 22)).toBeNull();
  });
});

describe('dataGerrySyncStatus — SPEC §4.8 Bridge → Bedrock → Atlas', () => {
  it('blank state → none done', () => {
    const s = dataGerrySyncStatus(blankState(), 0);
    expect(s).toEqual({ authored: false, bedrock: false, atlas: false });
  });
  it('after step 1 → authored only', () => {
    const s = dataGerrySyncStatus(reduceToCursor(STEPS, 1), 1);
    expect(s).toEqual({ authored: true, bedrock: false, atlas: false });
  });
  it('after step 3 → authored + bedrock', () => {
    const s = dataGerrySyncStatus(reduceToCursor(STEPS, 3), 3);
    expect(s).toEqual({ authored: true, bedrock: true, atlas: false });
  });
  it('at cursor 4 → all three (Atlas acks the cache refresh)', () => {
    const s = dataGerrySyncStatus(reduceToCursor(STEPS, 4), 4);
    expect(s).toEqual({ authored: true, bedrock: true, atlas: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @nanisoft/architecture run test -- overlay`
Expected: FAIL — symbols not exported. (Note: the `after step 3 → bedrock` and `cursor 4 → atlas` cases also depend on Task 4 wiring step 3; they will fail until Task 4. That's fine — Task 4 makes them pass. The reducer + beckon + `after step 1` cases pass once this task's code lands.)

- [ ] **Step 3: Implement — `overlay.ts`**

Create `packages/architecture/src/overlay.ts`:

```ts
/**
 * The mocked-tool overlay chrome — pure, framework-agnostic (SPEC §4.8).
 *
 * `overlayReducer` is the open/close state for the uniform overlay shell; the
 * Zustand store in apps/playground wraps it. `beckonToolId` derives which
 * full-UI node should ripple (the active step's `openTool`). `dataGerrySyncStatus`
 * drives the DataGerry sync-status line. None of this imports React/Next/Zustand.
 */
import type { PlaybookStep, PlaygroundState } from './playground-state';

/** Which tool overlay is open, plus the cursor at open time (so a tool knows
 *  whether its canonical action is still live or already done). null = closed. */
export type OverlayState = { componentId: string; openedAtCursor: number } | null;

export type OverlayAction =
  | { type: 'open'; componentId: string; cursor: number }
  | { type: 'close' }
  | { type: 'reset' };

export function overlayReducer(state: OverlayState, action: OverlayAction): OverlayState {
  switch (action.type) {
    case 'open':
      return { componentId: action.componentId, openedAtCursor: action.cursor };
    case 'close':
    case 'reset':
      return null;
  }
}

/**
 * The component id whose full-UI overlay should beckon (ripple) at this cursor —
 * the active step's `openTool`, or null. SPEC §4.8: auto-run = beckon (the active
 * tool's node pulses to invite a click; overlays do NOT auto-open mid-run).
 */
export function beckonToolId(steps: readonly PlaybookStep[], cursor: number): string | null {
  if (cursor <= 0 || cursor >= steps.length) return null;
  return steps[cursor - 1].openTool ?? null;
}

export interface DataGerrySyncStatus {
  authored: boolean;
  bedrock: boolean;
  atlas: boolean;
}

/**
 * DataGerry sync-status line (SPEC §4.8): Bridge → Bedrock (ext_product) → Atlas
 * (SchemaRegistry). `authored`/`bedrock` are state-derived (steps 1/3 write);
 * `atlas` is cursor-derived (Atlas acks the cache refresh at step 4 — the
 * registry already IS Atlas's cache, so no separate state slot).
 */
export function dataGerrySyncStatus(state: PlaygroundState, cursor: number): DataGerrySyncStatus {
  const authored = !!state.schemaRegistry.Product?.fields.some((f) => f.name === 'Sensitive');
  const bedrock = state.bridgedTables.includes('ext_product');
  const atlas = cursor >= 4;
  return { authored, bedrock, atlas };
}
```

- [ ] **Step 4: Re-export from `index.ts`**

In `packages/architecture/src/index.ts`, add after the tool-actions export:

```ts
// ── Overlay chrome + derivations ──────────────────────────────────────────────
export { overlayReducer, beckonToolId, dataGerrySyncStatus } from './overlay';
export type { OverlayState, OverlayAction, DataGerrySyncStatus } from './overlay';
```

- [ ] **Step 5: Run test to verify the reducer + beckon + authored cases pass**

Run: `pnpm --filter @nanisoft/architecture run test -- overlay`
Expected: `overlayReducer` and `beckonToolId` tests PASS; `dataGerrySyncStatus` `after step 1` PASSES; `after step 3` + `cursor 4` FAIL on `bedrock` (step 3 not yet wired). Task 4 makes them pass.

- [ ] **Step 6: Commit**

```bash
git add packages/architecture/src/overlay.ts packages/architecture/src/index.ts packages/architecture/tests/overlay.test.ts
git commit -m "feat(arch): overlay reducer + beckon + DataGerry sync-status (ticket 11)"
```

---

### Task 4: Wire the pure core into the playbook (steps 1 + 3)

**Files:**
- Modify: `packages/architecture/src/playbook.ts` (step 1 ~line 26, step 3 ~line 38)
- Test: `packages/architecture/tests/playbook.test.ts`

**Interfaces:**
- Consumes: `authorSensitiveProductField` (Task 2).
- Produces: step 1 `apply` calls `authorSensitiveProductField`; step 1 has `openTool: 'blueprint'`; step 3 `apply` pushes `'ext_product'` into `bridgedTables`.

- [ ] **Step 1: Write the failing tests**

Append to `packages/architecture/tests/playbook.test.ts`, inside the `describe('flagship replay …')` block:

```ts
  it('step 1 carries openTool: blueprint (the DataGerry beckon)', () => {
    expect(STEPS[0].openTool).toBe('blueprint');
  });

  it('cursor 3 bridges the ext_product table schema', () => {
    const s = reduceToCursor(STEPS, 3);
    expect(s.bridgedTables).toContain('ext_product');
  });

  it('cursor 1 authors Sensitive via the shared canonical action (no duplicate on replay)', () => {
    const s = reduceToCursor(STEPS, 1);
    const sens = s.schemaRegistry.Product.fields.filter((f) => f.name === 'Sensitive');
    expect(sens).toHaveLength(1);
    expect(sens[0].type).toBe('bool');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @nanisoft/architecture run test -- playbook`
Expected: FAIL — `STEPS[0].openTool` is undefined; `bridgedTables` doesn't contain `ext_product` at cursor 3.

- [ ] **Step 3: Implement — rewire step 1**

In `packages/architecture/src/playbook.ts`, add the import at the top (with the other imports):

```ts
import { authorSensitiveProductField } from './tool-actions';
```

Replace step 1 (the `{ n: 1, … }` object) with:

```ts
  {
    n: 1, phase: 'schema', actor: 'blueprint', edge: ['blueprint', 'bridge'],
    title: 'Author defines ObjectType Product',
    desc: 'A Schema Author opens DataGerry and adds the `Sensitive: bool` field to the drafted Product ObjectType — the definitional hinge, authored before any data flows.',
    apply: (s) => { authorSensitiveProductField(s); },
    openTool: 'blueprint',
  },
```

- [ ] **Step 4: Implement — rewire step 3**

Replace step 3 (the `{ n: 3, … }` object) with:

```ts
  {
    n: 3, phase: 'schema', actor: 'bridge', edge: ['bridge', 'bedrock'],
    title: 'Bridge writes the DDL',
    desc: 'Bridge generates CREATE TABLE ext_product in Bedrock (Bronze shell ready).',
    apply: (s) => { if (!s.bridgedTables.includes('ext_product')) s.bridgedTables.push('ext_product'); },
  },
```

- [ ] **Step 5: Run the full architecture suite to verify it passes**

Run: `pnpm --filter @nanisoft/architecture run test`
Expected: PASS — all architecture tests green (playbook, playground-state, overlay, tool-actions, seed). The Task 3 `dataGerrySyncStatus` `after step 3` + `cursor 4` cases now pass.

- [ ] **Step 6: Commit**

```bash
git add packages/architecture/src/playbook.ts packages/architecture/tests/playbook.test.ts
git commit -m "feat(arch): wire step 1 + step 3 to the canonical actions (ticket 11)"
```

---

### Task 5: Store — overlay state + open/close

**Files:**
- Modify: `apps/playground/app/_store/usePlayground.ts`

**Interfaces:**
- Consumes: `overlayReducer`, `OverlayState` (Task 3).
- Produces: `usePlayground` gains `overlay: OverlayState`, `openTool(componentId: string)`, `closeTool()`; `reset` + `importJson` clear the overlay.

- [ ] **Step 1: Read the Next.js client-component docs (AGENTS.md rule)**

Read the relevant guide in `apps/playground/node_modules/next/dist/docs/` for client components / hooks (confirm no breaking change to `'use client'` Zustand usage). Note: this file is already `'use client'` and uses Zustand identically to ticket 10; this task only adds store fields.

- [ ] **Step 2: Implement — add overlay to the store**

In `apps/playground/app/_store/usePlayground.ts`, update the imports from `@nanisoft/architecture` to include `overlayReducer` + the `OverlayState` type:

```ts
import {
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  applyStep,
  blankState,
  exportState as exportPlaygroundState,
  importState as importPlaygroundState,
  InvalidStateError,
  overlayReducer,
  type OverlayState,
  type PlaygroundState,
} from '@nanisoft/architecture';
```

Add `overlay` + `openTool` + `closeTool` to the `PlaygroundStore` interface (after `running: boolean;`):

```ts
  running: boolean;
  /** The open tool overlay (null = closed). SPEC §4.8. */
  overlay: OverlayState;
  /** Open a full-UI tool overlay for a component id. */
  openTool: (componentId: string) => void;
  /** Close the open tool overlay. */
  closeTool: () => void;
```

In the `create(...)` body, add `overlay: null,` after `running: false,`, and add the two actions (after `pause`):

```ts
  overlay: null,

  openTool: (componentId) =>
    set((s) => ({
      overlay: overlayReducer(s.overlay, {
        type: 'open',
        componentId,
        cursor: s.state.cursor,
      }),
    })),

  closeTool: () => set((s) => ({ overlay: overlayReducer(s.overlay, { type: 'close' }) })),
```

In `reset`, clear the overlay (replace the existing `reset` body):

```ts
  reset: () => {
    clearTimer();
    set({ state: blankState(), running: false, overlay: null });
  },
```

In `importJson`'s success branch, clear the overlay (replace the `set({ state: imported, running: false });` line):

```ts
      clearTimer();
      set({ state: imported, running: false, overlay: null });
      return { ok: true };
```

- [ ] **Step 3: Verify the playground builds**

Run: `pnpm --filter @nanisoft/playground run build`
Expected: build succeeds (no type errors; the new store fields are unused by the shell until Tasks 6–8, which is fine).

- [ ] **Step 4: Commit**

```bash
git add apps/playground/app/_store/usePlayground.ts
git commit -m "feat(playground): overlay state + open/close in the store (ticket 11)"
```

---

### Task 6: Spine — beckon/open classes + clickable nodes + re-fit

**Files:**
- Modify: `apps/playground/app/globals.css`
- Modify: `apps/playground/app/_spine/NodeChip.tsx`
- Modify: `apps/playground/app/_spine/Spine.tsx`

**Interfaces:**
- Consumes: `beckonToolId` (Task 3), `overlay`/`openTool`/`closeTool` (Task 5).
- Produces: full-UI nodes are clickable (mouse + keyboard) → `openTool`; the beckoning tool node gets `.spine-node-beckon` (ripple); an open tool's node gets `.spine-node-open` (no ripple); `onPaneClick` closes; the spine re-`fitView`s when the pane splits.

- [ ] **Step 1: Implement — `globals.css` beckon/open classes**

In `apps/playground/app/globals.css`, replace the `.spine-node-active` rule (keep the `@keyframes spine-ripple`) and add the two new classes:

```css
@keyframes spine-ripple {
  0%, 100% { box-shadow: 0 0 0 0 rgba(20, 167, 122, 0); }
  50%      { box-shadow: 0 0 0 6px rgba(20, 167, 122, 0.18); }
}
/* The beckon: a full-UI tool node that is the active step's openTool AND whose
   overlay is not open — invites a click. (The jade active border is inline via
   NodeChip's borderFor; this class only adds the ripple.) */
.spine-node-beckon {
  animation: spine-ripple 1.1s cubic-bezier(.32, .72, 0, 1) infinite;
}
/* The node's overlay is open — no ripple (reads as "opened", not "inviting"). */
.spine-node-open {
  animation: none;
}

@keyframes spine-flow {
  to { stroke-dashoffset: -24; }
}
.spine-edge-active {
  animation: spine-flow 0.7s linear infinite;
}
```

- [ ] **Step 2: Implement — `NodeChip.tsx` clickable + beckon/open**

In `apps/playground/app/_spine/NodeChip.tsx`, extend the `data` type and make full-UI chips interactive. Replace the `export function NodeChip({ data }: { data: { component: Component; status: NodeStatus } })` signature and the outer `<div>` opening tag. New signature:

```ts
export function NodeChip({
  data,
}: {
  data: {
    component: Component;
    status: NodeStatus;
    /** This node is the active step's beckoning tool (ripple). */
    beckon: boolean;
    /** This node's overlay is currently open (no ripple). */
    open: boolean;
    /** Open this node's overlay (set by Spine from the store). */
    onOpenTool: (id: string) => void;
  };
}) {
  const c = data.component;
  const sub = realNameLine(c);
  const status = data.status;
  const clickable = c.fullUi;
  const className = data.open ? 'spine-node-open' : data.beckon ? 'spine-node-beckon' : undefined;
```

Replace the outer `<div className={status === 'active' ? 'spine-node-active' : undefined} style={{ … }}>` with the interactive version (add `role`, `tabIndex`, `aria-label`, `onClick`, `onKeyDown`, and `cursor` to the existing style object — keep all the existing style props):

```tsx
  return (
    <div
      className={className}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Open ${c.codename} mock` : undefined}
      onClick={clickable ? () => data.onOpenTool(c.id) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                data.onOpenTool(c.id);
              }
            }
          : undefined
      }
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
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
```

Keep the rest of `NodeChip` (the codename/subline/handles) unchanged.

- [ ] **Step 3: Implement — `Spine.tsx` beckon + overlay wiring + re-fit**

In `apps/playground/app/_spine/Spine.tsx`:

Update imports — add `useEffect`, `ReactFlowProvider`, `useReactFlow`, `beckonToolId`, and the store overlay actions. Replace the import block at the top:

```ts
'use client';

import '@xyflow/react/dist/style.css';
import { useEffect, useMemo } from 'react';
import {
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  SmoothStepEdge,
  useReactFlow,
  type Edge as RFEdge,
  type EdgeTypes,
  type Node as RFNode,
  type NodeTypes,
} from '@xyflow/react';
import { color, surface } from '@nanisoft/identity';
import { PHASES, SENSITIVE_PRODUCT_VIEW_AUDIT, deriveStatus, beckonToolId } from '@nanisoft/architecture';
import { buildSpineGraph, type SpineEdge, type SpineNode } from './spine-graph';
import { NodeChip, CHIP_W, CHIP_H, type NodeStatus } from './NodeChip';
import { PhaseBand, type PhaseStatus } from './PhaseBand';
import { usePlayground } from '../_store/usePlayground';
```

Update `toRFNode` to accept `beckonId`, `openId`, and `onOpenTool`, and pass them into chip data. Change the `toRFNode` signature and the chip `data`:

```ts
function toRFNode(
  n: SpineNode,
  active: string | null,
  done: Set<string>,
  activePhase: string | null,
  cursor: number,
  beckonId: string | null,
  openId: string | null,
  onOpenTool: (id: string) => void,
): RFNode {
  if (n.kind === 'chip') {
    return {
      id: n.id,
      type: 'chip',
      position: n.position,
      data: {
        component: n.component,
        status: chipStatus(n.id, active, done),
        beckon: beckonId === n.id,
        open: openId === n.id,
        onOpenTool,
      },
      width: CHIP_W,
      height: CHIP_H,
      draggable: false,
      selectable: false,
      focusable: false,
    };
  }
  // … phase node branch unchanged …
```

(Leave the phase-node branch exactly as it is.)

Replace the `export default function Spine()` with a provider-wrapped inner component that reads overlay state and re-fits:

```tsx
function SpineInner() {
  const { nodes, edges } = useMemo(() => buildSpineGraph(), []);
  const cursor = usePlayground((s) => s.state.cursor);
  const overlay = usePlayground((s) => s.overlay);
  const openTool = usePlayground((s) => s.openTool);
  const closeTool = usePlayground((s) => s.closeTool);
  const { fitView } = useReactFlow();

  const status = useMemo(() => deriveStatus(STEPS, cursor), [cursor]);
  const beckonId = useMemo(() => beckonToolId(STEPS, cursor), [cursor]);
  const activeEdgeId = status.activeEdge ? `${status.activeEdge.from}__${status.activeEdge.to}` : null;
  const openId = overlay?.componentId ?? null;

  // Re-fit when the split-pane opens/closes so the slimmed spine keeps the
  // active node in view (rAF lets the new CSS width + React Flow's ResizeObserver settle).
  useEffect(() => {
    const raf = requestAnimationFrame(() => fitView({ padding: 0.2 }));
    return () => cancelAnimationFrame(raf);
  }, [fitView, openId]);

  return (
    <ReactFlow
      nodes={nodes.map((n) =>
        toRFNode(n, status.activeNodeId, status.doneNodeIds, status.activePhase, cursor, beckonId, openId, openTool),
      )}
      edges={edges.map((e) => toRFEdge(e, activeEdgeId, status.doneEdgeIds))}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onPaneClick={closeTool}
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

export default function Spine() {
  return (
    <ReactFlowProvider>
      <SpineInner />
    </ReactFlowProvider>
  );
}
```

Keep the module-level `nodeTypes`, `edgeTypes`, `STEPS`, color constants, `orderOf`, `chipStatus`, `phaseStatusFor`, and `toRFEdge` exactly as they are.

- [ ] **Step 4: Verify the playground builds**

Run: `pnpm --filter @nanisoft/playground run build`
Expected: build succeeds. (The overlay opens a `null` content for now — `ToolOverlay` lands in Task 7; clicking a node sets `overlay` but nothing renders yet. That's fine for this task's build gate.)

- [ ] **Step 5: Commit**

```bash
git add apps/playground/app/globals.css apps/playground/app/_spine/NodeChip.tsx apps/playground/app/_spine/Spine.tsx
git commit -m "feat(playground): beckon/open spine nodes + clickable + re-fit (ticket 11)"
```

---

### Task 7: Overlay framework — chrome shell + registry + DataGerry body

**Files:**
- Create: `apps/playground/app/_overlay/DataGerryOverlay.tsx`
- Create: `apps/playground/app/_overlay/ToolOverlay.tsx`
- Create: `apps/playground/app/_overlay/tool-content.ts`

**Interfaces:**
- Consumes: `MOCK_TOOL_BY_COMPONENT`, `COMPONENT_BY_ID`, `dataGerrySyncStatus` (Tasks 3/4); `usePlayground` (Task 5).
- Produces: `ToolOverlay` (uniform chrome shell) renders `TOOL_CONTENT[componentId]`; `TOOL_CONTENT` registry (DataGerry first entry); `DataGerryOverlay` (schema editor + "Add Sensitive: bool" action calling `store.step()` + sync-status line).

- [ ] **Step 1: Implement — `DataGerryOverlay.tsx`**

Create `apps/playground/app/_overlay/DataGerryOverlay.tsx`:

```tsx
'use client';

import { color, font, radius, surface } from '@nanisoft/identity';
import { dataGerrySyncStatus } from '@nanisoft/architecture';
import { usePlayground, STEPS } from '../_store/usePlayground';

/** The cursor at which DataGerry's canonical action is live (step 1 is next). */
const BECKON_CURSOR = STEPS.findIndex((s) => s.openTool === 'blueprint');

export function DataGerryOverlay() {
  const state = usePlayground((s) => s.state);
  const step = usePlayground((s) => s.step);

  const product = state.schemaRegistry.Product;
  const fields = product?.fields ?? [];
  const hasSensitive = fields.some((f) => f.name === 'Sensitive');
  const canAct = state.cursor === BECKON_CURSOR && !hasSensitive;

  const sync = dataGerrySyncStatus(state, state.cursor);

  const label: React.CSSProperties = {
    margin: 0,
    fontFamily: font.data,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: surface.light.textMuted,
  };
  const row: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 8px',
    borderRadius: radius.inner,
    fontFamily: font.data,
    fontSize: 12,
  };
  const stage = (done: boolean, text: string) => (
    <span style={{ color: done ? color.jade : surface.light.textMuted }}>
      {done ? '✓ ' : '○ '}
      {text}
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, minHeight: 180 }}>
        {/* left: ObjectTypes */}
        <div style={{ background: surface.light.sunken, borderRadius: radius.inner, padding: 8 }}>
          <p style={label}>ObjectTypes</p>
          <div
            style={{
              ...row,
              background: surface.light.elevated,
              border: `1px solid ${color.teal}`,
              marginTop: 6,
              fontWeight: 700,
              color: surface.light.text,
            }}
          >
            Product
          </div>
        </div>
        {/* right: fields */}
        <div style={{ background: surface.light.sunken, borderRadius: radius.inner, padding: 8 }}>
          <p style={label}>Fields · Product</p>
          {fields.map((f) => (
            <div
              key={f.name}
              style={{
                ...row,
                color: f.name === 'Sensitive' ? color.jade : surface.light.text,
                fontWeight: f.name === 'Sensitive' ? 700 : 400,
              }}
            >
              <span>{f.name}</span>
              <span style={{ color: surface.light.textMuted }}>{f.type}</span>
            </div>
          ))}
          {!hasSensitive && (
            <div style={{ ...row, opacity: 0.5, fontStyle: 'italic', color: surface.light.textMuted }}>
              <span>＋ Sensitive</span>
              <span>bool</span>
            </div>
          )}
        </div>
      </div>

      {/* canonical action — one code path: store.step() */}
      <button
        onClick={step}
        disabled={!canAct}
        style={{
          alignSelf: 'flex-start',
          fontFamily: font.voice,
          fontSize: 13,
          fontWeight: 600,
          padding: '9px 18px',
          borderRadius: 9999,
          cursor: canAct ? 'pointer' : 'not-allowed',
          border: `1px solid ${canAct ? color.jade : surface.light.border}`,
          background: canAct ? color.jade : 'transparent',
          color: canAct ? surface.light.bg : surface.light.textMuted,
        }}
      >
        {hasSensitive ? 'Sensitive: bool — already authored' : 'Add Sensitive: bool'}
      </button>

      {/* sync-status line: Bridge → Bedrock (ext_product) → Atlas */}
      <div
        style={{
          background: surface.light.sunken,
          borderRadius: radius.inner,
          padding: '8px 10px',
          fontFamily: font.data,
          fontSize: 11,
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
        }}
        aria-label="datagerry-sync-status"
      >
        {stage(sync.authored, 'Blueprint authored')}
        <span style={{ color: surface.light.textMuted }}>→</span>
        {stage(sync.bedrock, 'Bedrock: ext_product created')}
        <span style={{ color: surface.light.textMuted }}>→</span>
        {stage(sync.atlas, 'Atlas: SchemaRegistry refreshed')}
      </div>

      <p style={{ ...label, marginTop: 2 }}>
        mocked · schema authoring surface only · DataGerry’s Section/Relation/Granularity richness is hidden
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Implement — `tool-content.ts` registry**

Create `apps/playground/app/_overlay/tool-content.ts`:

```ts
import type { ComponentType } from 'react';
import { DataGerryOverlay } from './DataGerryOverlay';

/**
 * The single registration point for mocked-tool overlay content (SPEC §4.8).
 * Tickets 12–16 add their tool body here; the uniform chrome (`ToolOverlay`)
 * stays unchanged. Keyed by component id.
 */
export const TOOL_CONTENT: Record<string, ComponentType> = {
  blueprint: DataGerryOverlay,
};
```

- [ ] **Step 3: Implement — `ToolOverlay.tsx` chrome shell**

Create `apps/playground/app/_overlay/ToolOverlay.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { color, font, radius, surface } from '@nanisoft/identity';
import { COMPONENT_BY_ID, MOCK_TOOL_BY_COMPONENT } from '@nanisoft/architecture';
import { usePlayground } from '../_store/usePlayground';
import { TOOL_CONTENT } from './tool-content';

/**
 * The uniform mocked-tool overlay chrome (SPEC §4.8): title bar = codename +
 * real-name subline + a "mocked" badge + close; body = the tool's content from
 * the TOOL_CONTENT registry. Structured-echo fidelity — the real tool's info
 * shape in nanisoft tokens, not its colors/fonts/icons. Split-pane (not modal),
 * so the dialog focuses itself + closes on Esc but does not trap Tab.
 */
export function ToolOverlay() {
  const overlay = usePlayground((s) => s.overlay);
  const closeTool = usePlayground((s) => s.closeTool);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlay) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTool();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlay, closeTool]);

  if (!overlay) return null;
  const component = COMPONENT_BY_ID[overlay.componentId];
  const tool = MOCK_TOOL_BY_COMPONENT[overlay.componentId];
  const Content = TOOL_CONTENT[overlay.componentId];
  if (!component || !tool || !Content) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={component.codename}
      tabIndex={-1}
      style={{
        height: '100%',
        boxSizing: 'border-box',
        background: surface.light.elevated,
        color: surface.light.text,
        fontFamily: font.voice,
        display: 'flex',
        flexDirection: 'column',
        outline: 'none',
      }}
    >
      {/* title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          borderBottom: `1px solid ${surface.light.border}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{component.codename}</span>
          {component.realName && (
            <span style={{ fontFamily: font.data, fontSize: 11, color: surface.light.textMuted }}>
              {component.realName}
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: font.data,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: surface.light.textMuted,
            border: `1px solid ${surface.light.border}`,
            borderRadius: 9999,
            padding: '2px 8px',
          }}
        >
          mocked
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={closeTool}
          aria-label="Close overlay"
          style={{
            fontFamily: font.data,
            fontSize: 14,
            border: `1px solid ${surface.light.border}`,
            background: 'transparent',
            color: surface.light.text,
            borderRadius: 8,
            padding: '2px 9px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Content />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the playground builds**

Run: `pnpm --filter @nanisoft/playground run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/playground/app/_overlay/DataGerryOverlay.tsx apps/playground/app/_overlay/ToolOverlay.tsx apps/playground/app/_overlay/tool-content.ts
git commit -m "feat(playground): ToolOverlay chrome + DataGerry mock body (ticket 11)"
```

---

### Task 8: Split-pane layout in `playground-client.tsx`

**Files:**
- Modify: `apps/playground/app/playground-client.tsx`

**Interfaces:**
- Consumes: `ToolOverlay` (Task 7), `usePlayground.overlay` (Task 5).
- Produces: the spine card becomes a CSS grid that splits spine | tool when a tool is open; the ≤980px stack rule extends to the tool pane.

- [ ] **Step 1: Implement — split the spine card**

In `apps/playground/app/playground-client.tsx`, add the imports:

```ts
import { ToolOverlay } from './_overlay/ToolOverlay';
import { usePlayground } from './_store/usePlayground';
```

Inside `PlaygroundClient`, read the overlay state (add near the top of the component body, before the `return`):

```ts
  const overlayOpen = usePlayground((s) => s.overlay !== null);
```

Replace the spine-card `<div>` (the one wrapping `<Spine />` with `width:'100%', height:'70vh', …`) with a split-grid that renders the tool pane when open. Give the card `className="spine-card"`:

```tsx
            <div
              className="spine-card"
              style={{
                display: 'grid',
                gridTemplateColumns: overlayOpen ? 'minmax(280px, 0.6fr) minmax(360px, 0.4fr)' : '1fr',
                width: '100%',
                height: '70vh',
                minHeight: 520,
                borderRadius: radius.card,
                border: `1px solid ${surface.light.border}`,
                overflow: 'hidden',
                background: surface.light.elevated,
              }}
            >
              <div style={{ position: 'relative', overflow: 'hidden', minWidth: 0 }}>
                <Spine />
              </div>
              {overlayOpen && (
                <div
                  style={{
                    overflow: 'auto',
                    minWidth: 0,
                    borderLeft: `1px solid ${surface.light.border}`,
                  }}
                >
                  <ToolOverlay />
                </div>
              )}
            </div>
```

- [ ] **Step 2: Implement — narrow-screen stack rule**

Update the existing `<style>` block at the bottom of `<main>` to also stack the spine card when a tool is open on narrow screens. Replace the `<style>{`@media (max-width: 980px) { main > div { grid-template-columns: 1fr !important; } }`}</style>` with:

```tsx
        <style>{`
          @media (max-width: 980px) {
            main > div { grid-template-columns: 1fr !important; }
            .spine-card { grid-template-columns: 1fr !important; grid-template-rows: minmax(280px, 0.5fr) 1fr !important; }
            .spine-card > div + div { border-left: none !important; border-top: 1px solid ${surface.light.border}; }
          }
        `}</style>
```

- [ ] **Step 3: Verify the playground builds**

Run: `pnpm --filter @nanisoft/playground run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/playground/app/playground-client.tsx
git commit -m "feat(playground): split-pane spine card for tool overlays (ticket 11)"
```

---

### Task 9: Integration verification + merge to main

**Files:**
- Verify only (no source changes unless a check fails).

- [ ] **Step 1: Full test suite**

Run: `pnpm -r run test`
Expected: all green (architecture incl. new overlay/tool-actions tests, identity, landing).

- [ ] **Step 2: Full build**

Run: `pnpm -r run build`
Expected: both apps build clean (landing + playground).

- [ ] **Step 3: Start the playground dev server**

Run (background): `pnpm --filter @nanisoft/playground run dev`
Wait for the "Ready" / compiled line on `http://localhost:3001`.

- [ ] **Step 4: Playwright MCP — open + a11y + action + live state**

Using the Playwright MCP browser tools against `http://localhost:3001`:
- Navigate to `http://localhost:3001`; take an a11y snapshot; assert console is clean (no errors/warnings from our code).
- Click the `Blueprint` node → assert an a11y node with `role="dialog"` and `aria-label="Blueprint"` appears, the "mocked" badge text is present, and the `Product` ObjectType + fields (`id`, `name`, `owner_group`) are visible.
- Assert the "Add Sensitive: bool" button is enabled (cursor 0, `Sensitive` not yet present).
- Evaluate `window.__playground.getState().state.schemaRegistry.Product.fields.map(f => f.name)` → expect `['id','name','owner_group']` (no `Sensitive` yet).
- Click "Add Sensitive: bool" → assert `Sensitive` appears in the field list; evaluate `window.__playground.getState().state.schemaRegistry.Product.fields.map(f => f.name)` → expect to include `'Sensitive'`; evaluate `window.__playground.getState().state.cursor` → expect `1`.
- Step the playbook to cursor 3 (via the Controls "Step →" button twice) → assert the sync-status line shows "Bedrock: ext_product created"; evaluate `window.__playground.getState().state.bridgedTables` → expect `['ext_product']`.
- Press Escape → assert the dialog disappears (overlay closed); evaluate `window.__playground.getState().overlay` → expect `null`.
- Re-open Blueprint (click the node) at cursor 3 → assert the action button is disabled ("already authored" — `Sensitive` present).
- Take a final a11y snapshot; assert no `role="dialog"` remains after close.

- [ ] **Step 5: Stop the dev server**

Stop the background dev process.

- [ ] **Step 6: Human visual confirm (deferred — operator AFK)**

Record in the final report: the split-pane layout, jade beckon ripple on the active `blueprint` node, the `Sensitive` field landing jade, and the sync-status line animating are pending the operator's visual confirm on return. The a11y + build + live-state checks above stand in until then.

- [ ] **Step 7: Merge to main**

```bash
git checkout main
git merge --no-ff feat/11-tool-overlay-framework-datagerry -m "Merge ticket 11: tool-overlay framework + DataGerry mock"
```

(Do not delete the feature branch — leave it for reference until the operator confirms.)

- [ ] **Step 8: Final report + stop**

Report: what was built, verification results (tests/build/a11y/live-state), the one deferred item (human visual confirm), and the merge. Then stop.

---

## Self-Review

**Spec coverage:**
- Overlay chrome (codename + mocked badge + structured-echo) → Task 7 `ToolOverlay.tsx`. ✓
- Auto-run = beckon (active tool node pulses; no auto-open; single-step pauses at beckoning node) → Task 6 `.spine-node-beckon` + `beckonToolId`; step 1 `openTool:'blueprint'` (Task 4); overlay opens only on click (Task 6). ✓
- DataGerry mock (left ObjectTypes / right fields + Sensitive jade; sync-status Bridge→Bedrock→Atlas) → Task 7 `DataGerryOverlay.tsx` + `dataGerrySyncStatus` (Task 3). ✓
- Canonical action (add Sensitive: bool) → `authorSensitiveProductField` (Task 2) + button calls `store.step()` (Task 7). ✓
- One code path (auto-run same mutate; state writes registry + Bridge writes ext_product; reads none) → step 1 `apply` = `authorSensitiveProductField` (Task 4); step 3 `apply` pushes `ext_product` (Task 4); button = `step()` (Task 7). ✓
- Clicking the DataGerry full-UI node opens the overlay; presentation picked (split-pane) → Task 6 clickable + Task 8 split-pane. ✓
- Framework established for tickets 12–16 → `TOOL_CONTENT` registry (Task 7) + uniform `ToolOverlay` chrome. ✓

**Placeholder scan:** none — every step has real code or real commands.

**Type consistency:** `OverlayState`/`OverlayAction` (Task 3) used by the store (Task 5) and `ToolOverlay` (Task 7) — names match. `beckonToolId` (Task 3) used in `Spine` (Task 6) — matches. `authorSensitiveProductField` (Task 2) used in step 1 (Task 4) — matches. `dataGerrySyncStatus` (Task 3) used in `DataGerryOverlay` (Task 7) — matches. `TOOL_CONTENT: Record<string, ComponentType>` (Task 7) keyed by `blueprint` — matches `overlay.componentId`. `onOpenTool: (id: string) => void` (Task 6 NodeChip data) matches `openTool` (Task 5). ✓