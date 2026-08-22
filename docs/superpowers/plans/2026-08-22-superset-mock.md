# Superset mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the sixth/sandbox mocked-tool overlay — Superset — the off-path, read-lens dashboard over live Gold: a pre-built dashboard grid (bar / table / donut) + filter bar, reached by clicking the Superset node (no guided step), explorable from the seed before the flagship finding. Canonical action = filter/drill-down (local UI state, no mutate). Drops into the ticket-11/12 framework with no chrome/store/state/playbook changes.

**Architecture:** Pure domain core (`packages/architecture`, framework-agnostic, vitest) gains `supersetDashboard(state, cursor)` (a pure derivation, mirroring `airflowDagStatus`). `apps/playground` gains only `SupersetOverlay.tsx` + one line in the `tool-content.ts` registry. The overlay holds local filter state and re-derives the dashboard from `supersetDashboard(state)` on every render; it has NO `store.step()` button and writes nothing. No `openTool` is added to any step (Superset never beckons).

**Tech Stack:** Next.js 16.3.1 (stock, modified — see Global Constraints), pnpm monorepo, `@xyflow/react` ^12, Zustand ^5, `@nanisoft/architecture` + `@nanisoft/identity` (workspace), vitest 4 (architecture package only).

## Global Constraints

- **AGENTS.md (modified Next.js):** read the relevant guide in `apps/playground/node_modules/next/dist/docs/` before writing Next code. Heed deprecation notices. `'use client'` wrapper + `dynamic({ssr:false})` stays INSIDE the client wrapper (never in a Server Component) — the 09/10/11 `page.tsx` → `playground-client.tsx` `'use client'` → `dynamic(ssr:false)` `Spine` pattern is untouched by this ticket.
- **No vision workflow:** verify via `pnpm -r build`, console messages, Playwright MCP a11y snapshot, live JS state (`window.__playground.getState()`), + a human visual confirm (deferred — operator AFK; a11y + build + live-state stand in).
- **Add vitest for any pure logic** (architecture package; `environment: node`, `tests/**/*.test.ts`). React components have no unit-test runner in the playground — verify via build + Playwright MCP.
- **Jade = single locked accent, live/active only; teal = done/backed; petrol = neutral. No pure white/black.** Jade appears only on: the anomalous state (the `j.harper` table row + the sensitive product's exposure bar) and the active filter accent. Backed/neutral chart marks are teal/petrol. The donut uses teal + petrol (jade reserved for the anomalous state only).
- **Pure core must not import React/Next/Zustand/React Flow.** The overlay React lives in `apps/playground`.
- **Identity tokens:** `color` (`jade`, `teal`, `petrolSoft`), `surface`, `font` (`data`, `voice`), `radius` (`inner`, `card`) from `@nanisoft/identity`. Shape lock: card radius 20, inner 12, buttons pills.
- **dataviz skill:** invoke BEFORE writing any chart code (Task 3). The bar / table / donut must read as one system — elegant, accessible, consistent in light + dark — nanisoft tokens, jade reserved for the live/anomalous state only.
- Run tests from the worktree root with `pnpm --filter @nanisoft/architecture vitest run`. The playground has no test script.
- Commit on the branch `feat/16-superset-mock` (already checked out). Do NOT merge to main.

---

## File Structure

**`packages/architecture` (pure + vitest):**
- Modify `src/overlay.ts` — add `supersetDashboard(state, cursor)` + `SupersetExposureRow`/`SupersetAnomalousUserRow`/`SupersetSourceSystem`/`SupersetSourceRow`/`SupersetDashboard` types (after `airflowDagStatus`).
- Modify `src/index.ts` — re-export `supersetDashboard` + the new types.
- Extend `tests/overlay.test.ts` (supersetDashboard, including the from-seed + before-step-17 cases).

**`apps/playground` (React shell):**
- Create `app/_overlay/SupersetOverlay.tsx` — the dashboard mock body (query-path label + filter bar + bar + table + donut + fidelity footer).
- Modify `app/_overlay/tool-content.ts` — add `superset: SupersetOverlay` (the single registration point).

Nothing else changes: `ToolOverlay.tsx`, `usePlayground.ts`, `Spine.tsx`, `NodeChip.tsx`, `playground-client.tsx`, `globals.css`, `playbook.ts` are untouched. `superset` is already `fullUi: true` (node already clickable); `openTool`/`closeTool` already exist; `MOCK_TOOL_BY_COMPONENT['superset']` already carries the canonical-action/shows/reads/writes/fidelity text. No new dependency, no new state field.

---

### Task 1: Pure core — `supersetDashboard` derivation

**Files:**
- Modify: `packages/architecture/src/overlay.ts` (append after `airflowDagStatus`)
- Modify: `packages/architecture/src/index.ts` (the `// ── Overlay chrome + derivations ──` block)
- Test: `packages/architecture/tests/overlay.test.ts` (append a describe block)

**Interfaces:**
- Produces `supersetDashboard(state: PlaygroundState, cursor: number): SupersetDashboard` (cursor unused — derivation is of Gold only) + the five types listed above.

- [ ] **Step 1: Write the failing tests**

Append to `packages/architecture/tests/overlay.test.ts`. Add `supersetDashboard` + `SEED` to the import from `'../src/index'`:

```ts
import {
  airflowDagStatus,
  beckonToolId,
  dataGerrySyncStatus,
  overlayReducer,
  blankState,
  reduceToCursor,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  SEED,
  supersetDashboard,
  type OverlayState,
} from '../src/index';
```

Append the new describe block:

```ts
describe('supersetDashboard — SPEC §4.8 Superset read lens (sandbox)', () => {
  // A PlaygroundState built from the SEED (populated Gold) at cursor 0 — the
  // "from the seed before the flagship runs" case.
  const seedState = () => ({ ...SEED, finding: null, cursor: 0 });

  it('from seed → products by exposure count (P-1042 exposed once, P-2210 zero)', () => {
    const d = supersetDashboard(seedState(), 0);
    expect(d.products).toHaveLength(2);
    const p1042 = d.products.find((p) => p.productId === 'P-1042')!;
    expect(p1042).toMatchObject({ productName: 'Payroll-NG', sensitive: true, exposureCount: 1, viewCount: 2 });
    const p2210 = d.products.find((p) => p.productId === 'P-2210')!;
    expect(p2210).toMatchObject({ productName: 'Inventory-NG', sensitive: false, exposureCount: 0, viewCount: 0 });
  });

  it('from seed → anomalous users table flags j.harper on P-1042', () => {
    const d = supersetDashboard(seedState(), 0);
    expect(d.anomalousUsers).toHaveLength(1);
    expect(d.anomalousUsers[0]).toMatchObject({
      user: 'j.harper',
      userLabel: 'Jordan Harper',
      productId: 'P-1042',
      productName: 'Payroll-NG',
      ownerGroup: 'G-SR',
      edgeId: 'e:viewed:j.harper:P-1042',
    });
  });

  it('from seed → views by source system: SQL Server Fleet (viewed) + Active Directory (memberof)', () => {
    const d = supersetDashboard(seedState(), 0);
    expect(d.sources).toEqual([
      { sourceSystem: 'SQL Server Fleet', edgeKind: 'viewed', count: 2 },
      { sourceSystem: 'Active Directory', edgeKind: 'memberof', count: 2 },
    ]);
  });

  it('blank state (cursor 0, empty Gold) → well-formed empty datasets, no crash', () => {
    const d = supersetDashboard(blankState(), 0);
    expect(d.products).toHaveLength(2);
    expect(d.products.every((p) => p.exposureCount === 0 && p.viewCount === 0)).toBe(true);
    expect(d.anomalousUsers).toEqual([]);
    expect(d.sources).toEqual([
      { sourceSystem: 'SQL Server Fleet', edgeKind: 'viewed', count: 0 },
      { sourceSystem: 'Active Directory', edgeKind: 'memberof', count: 0 },
    ]);
  });

  it('before the flagship finding (cursor 10, Gold populated, finding null) → full dashboard', () => {
    const s = reduceToCursor(SENSITIVE_PRODUCT_VIEW_AUDIT, 10);
    const d = supersetDashboard(s, 10);
    expect(d.products.find((p) => p.productId === 'P-1042')!.exposureCount).toBe(1);
    expect(d.anomalousUsers).toHaveLength(1);
    expect(d.anomalousUsers[0].user).toBe('j.harper');
    expect(d.sources.map((r) => r.count)).toEqual([2, 2]);
  });

  it('after the flagship finding (cursor 17, statuses set) → same dashboard (derives independently of edge.status)', () => {
    const before = supersetDashboard(reduceToCursor(SENSITIVE_PRODUCT_VIEW_AUDIT, 10), 10);
    const after = supersetDashboard(reduceToCursor(SENSITIVE_PRODUCT_VIEW_AUDIT, 17), 17);
    expect(after).toEqual(before);
  });

  it('cursor 22 → same dashboard (Superset reads the same Gold)', () => {
    const d = supersetDashboard(reduceToCursor(SENSITIVE_PRODUCT_VIEW_AUDIT, 22), 22);
    expect(d.anomalousUsers).toHaveLength(1);
    expect(d.sources.map((r) => r.count)).toEqual([2, 2]);
  });

  it('cursor parameter is unused — same state at different cursors yields the same dashboard', () => {
    const state = seedState();
    expect(supersetDashboard(state, 0)).toEqual(supersetDashboard(state, 17));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @nanisoft/architecture vitest run tests/overlay.test.ts`
Expected: FAIL — `supersetDashboard` is not exported (import error). The existing `overlayReducer`/`beckonToolId`/`dataGerrySyncStatus`/`airflowDagStatus` tests stay green.

- [ ] **Step 3: Implement — `overlay.ts`**

In `packages/architecture/src/overlay.ts`, append after `airflowDagStatus`:

```ts
// ── Superset dashboard (SPEC §4.8 — sandbox-only read lens) ────────────────────

export type SupersetSourceSystem = 'SQL Server Fleet' | 'Active Directory';

export interface SupersetExposureRow {
  productId: string;
  productName: string;
  sensitive: boolean;
  /** Unbacked viewed edges to this product (exposure = viewed with no memberof backing). */
  exposureCount: number;
  /** Total viewed edges to this product. */
  viewCount: number;
}

export interface SupersetAnomalousUserRow {
  user: string;
  userLabel: string;
  productId: string;
  productName: string;
  /** The anomalous viewed edge. */
  edgeId: string;
  ownerGroup: string;
}

export interface SupersetSourceRow {
  sourceSystem: SupersetSourceSystem;
  edgeKind: 'viewed' | 'memberof';
  count: number;
}

export interface SupersetDashboard {
  /** Bar — products by exposure count (all products, unfiltered). */
  products: SupersetExposureRow[];
  /** Table — users with anomalous views (sensitive + unbacked). */
  anomalousUsers: SupersetAnomalousUserRow[];
  /** Donut — views by source system (Gold edges by contributing source). */
  sources: SupersetSourceRow[];
}

/**
 * The Superset dashboard datasets — a pure derivation from Gold (SPEC §4.8/§4.9),
 * mirroring `dataGerrySyncStatus`/`airflowDagStatus`. Superset is a sandbox-only
 * read lens: it writes nothing; its canonical action (filter / drill-down) is
 * UI-local in the overlay, NOT a lakehouse mutate (the deliberate exception to
 * the one-code-path pattern). The `cursor` parameter is unused — the derivation
 * is of Gold only — so the dashboard is explorable from the seed before the
 * flagship finding runs.
 *
 * Exposure = a `viewed` edge where the viewer has no `memberof` edge to the
 * viewed product's `ownerGroup` (SPEC §4.8: "viewed edge with no memberof backing
 * = exposed"). An anomalous view (the table) = an exposure on a sensitive product
 * (matching `detectAnomalies`). The exposure is derived here from scratch — it
 * does NOT read `state.finding` or `state.gold.edges[*].status`, so it surfaces
 * the exposure before the flagship finding step (17) marks the edges.
 *
 * The donut's "views by source system" renders the Gold graph's edges by their
 * feeding source system: `viewed` edges → SQL Server Fleet (the access logs),
 * `memberof` edges → Active Directory (the group memberships) — the only
 * multi-category source breakdown the minimal seed supports.
 */
export function supersetDashboard(state: PlaygroundState, _cursor: number): SupersetDashboard {
  const membersOf = new Map<string, Set<string>>();
  for (const m of state.groupMemberships) {
    if (!membersOf.has(m.user)) membersOf.set(m.user, new Set());
    membersOf.get(m.user)!.add(m.group);
  }
  const products = new Map(state.products.map((p) => [p.id, p]));
  const users = new Map(state.users.map((u) => [u.id, u]));

  const viewedEdges = state.gold.edges.filter((e) => e.kind === 'viewed');
  const memberofEdges = state.gold.edges.filter((e) => e.kind === 'memberof');

  // Bar — products by exposure count (one row per product in the dimension table).
  const productsMap = new Map<string, SupersetExposureRow>();
  for (const p of state.products) {
    productsMap.set(p.id, {
      productId: p.id,
      productName: p.name,
      sensitive: p.sensitive,
      exposureCount: 0,
      viewCount: 0,
    });
  }
  for (const e of viewedEdges) {
    const row = productsMap.get(e.to);
    if (!row) continue; // a view of a product not in the dimension table — skip
    row.viewCount += 1;
    const product = products.get(e.to);
    const groups = membersOf.get(e.from) ?? new Set<string>();
    if (product?.ownerGroup && !groups.has(product.ownerGroup)) {
      row.exposureCount += 1;
    }
  }
  const productRows = [...productsMap.values()];

  // Table — users with anomalous views (sensitive + unbacked). Derived from
  // scratch (independent of `edge.status`), so it works before step 17.
  const anomalousUsers: SupersetAnomalousUserRow[] = [];
  for (const e of viewedEdges) {
    const product = products.get(e.to);
    if (!product || !product.sensitive) continue;
    const groups = membersOf.get(e.from) ?? new Set<string>();
    if (!groups.has(product.ownerGroup)) {
      anomalousUsers.push({
        user: e.from,
        userLabel: users.get(e.from)?.displayName ?? e.from,
        productId: e.to,
        productName: product.name,
        edgeId: e.id,
        ownerGroup: product.ownerGroup,
      });
    }
  }

  // Donut — views by source system (Gold edges by contributing source).
  const sources: SupersetSourceRow[] = [
    { sourceSystem: 'SQL Server Fleet', edgeKind: 'viewed', count: viewedEdges.length },
    { sourceSystem: 'Active Directory', edgeKind: 'memberof', count: memberofEdges.length },
  ];

  return { products: productRows, anomalousUsers, sources };
}
```

- [ ] **Step 4: Re-export from `index.ts`**

In `packages/architecture/src/index.ts`, update the overlay derivations export block:

```ts
// ── Overlay chrome + derivations ──────────────────────────────────────────────
export {
  overlayReducer,
  beckonToolId,
  dataGerrySyncStatus,
  airflowDagStatus,
  supersetDashboard,
} from './overlay';
export type {
  OverlayState,
  OverlayAction,
  DataGerrySyncStatus,
  AirflowTaskState,
  AirflowTask,
  AirflowDag,
  AirflowRunLogLine,
  AirflowDagStatus,
  SupersetSourceSystem,
  SupersetExposureRow,
  SupersetAnomalousUserRow,
  SupersetSourceRow,
  SupersetDashboard,
} from './overlay';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @nanisoft/architecture vitest run tests/overlay.test.ts`
Expected: PASS — all `supersetDashboard` tests pass; existing overlay tests stay green.

- [ ] **Step 6: Run the full architecture suite**

Run: `pnpm --filter @nanisoft/architecture vitest run`
Expected: PASS — all architecture tests green (overlay, playbook, playground-state, seed, tool-actions).

- [ ] **Step 7: Commit**

```bash
git add packages/architecture/src/overlay.ts packages/architecture/src/index.ts packages/architecture/tests/overlay.test.ts
git commit -m "feat(arch): supersetDashboard derivation (ticket 16)"
```

---

### Task 2: Read the Next.js client-component docs (AGENTS.md rule)

- [ ] **Step 1: Read the relevant guide**

Read the relevant guide in `apps/playground/node_modules/next/dist/docs/` for client components. `SupersetOverlay` is a plain `'use client'` component with no Next.js APIs (no `dynamic`, no Server Component) — identical in shape to `DataGerryOverlay.tsx`/`AirflowOverlay.tsx` — so no deprecation applies. Confirm `'use client'` + `useState` usage is unchanged. This step is the AGENTS.md compliance check; record any deprecation noticed.

---

### Task 3: Shell — `SupersetOverlay.tsx` + register in `tool-content.ts`

**Files:**
- Create: `apps/playground/app/_overlay/SupersetOverlay.tsx`
- Modify: `apps/playground/app/_overlay/tool-content.ts` (add the `superset` entry)

**Interfaces:**
- Consumes: `supersetDashboard`, `SupersetExposureRow`, `SupersetAnomalousUserRow`, `SupersetSourceRow` (Task 1); `usePlayground` (existing). Identity tokens `color`, `font`, `radius`, `surface`. `useState` (local filter state).
- Produces: `SupersetOverlay` — the dashboard mock body. Registered as `TOOL_CONTENT['superset']`. NO `store.step()` button.

- [ ] **Step 1: Invoke the dataviz skill (BEFORE writing chart code)**

Invoke the `dataviz` skill. Apply its method to the bar / table / donut: a form heuristic, the nanisoft color formula (jade reserved for the live/anomalous state only; teal = backed/done; petrol = neutral), mark specs, and interaction rules. The three charts must read as one system — elegant, accessible (roles/labels/contrast), consistent in light + dark. No chart-builder; pre-built SVG/CSS charts.

- [ ] **Step 2: Implement — `SupersetOverlay.tsx`**

Create `apps/playground/app/_overlay/SupersetOverlay.tsx`. Structure (per the design doc §"Superset mock content"):
- Local state: `const [sensitiveOnly, setSensitiveOnly] = useState(false); const [drillProductId, setDrillProductId] = useState<string | null>(null);`
- `const d = supersetDashboard(state, state.cursor);` (re-derived every render via `usePlayground((s) => s.state)`).
- Query-path label (top): "query path: Superset → Trino → Gold" + "mocked · reads in-browser Gold directly (no query engine wired)".
- Filter bar: "Sensitive only" toggle pill (`aria-pressed`, jade when active) + a "clear drill" pill when `drillProductId` set.
- Bar panel: products (filtered by `sensitiveOnly` + `drillProductId`), height = `exposureCount`; sensitive product bar jade, non-sensitive petrol; bars clickable (`role="button"`, set/toggle `drillProductId`); drilled bar emphasized (jade border). Product labels + counts in `font.data`. Zero-exposure products render a minimal baseline.
- Table panel: anomalous users (filtered by `drillProductId`); `j.harper` row jade-flagged with "no backing membership" status; `role="table"`/`aria-label`; `font.data`.
- Donut panel: 2 slices (SQL Server Fleet = `viewed`, Active Directory = `memberof`), teal + petrol; legend with counts + percentages; sub-caption "Gold edges by contributing source system"; `role="img"`/`aria-label`.
- Fidelity footer: "mocked · dashboard surface only · SQL Lab/dataset editor/row-level security/alerting/cache hidden".
- Tokens: `surface.light` panes, `radius.inner`, `font.data`/`font.voice`. Jade only for anomalous state + active filter. No pure white/black. No `store.step()` button.

- [ ] **Step 3: Register the overlay**

In `apps/playground/app/_overlay/tool-content.ts`, add the `superset` entry:

```ts
import type { ComponentType } from 'react';
import { AirflowOverlay } from './AirflowOverlay';
import { DataGerryOverlay } from './DataGerryOverlay';
import { SupersetOverlay } from './SupersetOverlay';

/**
 * The single registration point for mocked-tool overlay content (SPEC §4.8).
 * Tickets 12–16 add their tool body here; the uniform chrome (`ToolOverlay`)
 * stays unchanged. Keyed by component id.
 */
export const TOOL_CONTENT: Record<string, ComponentType> = {
  blueprint: DataGerryOverlay,
  trailhead: AirflowOverlay,
  superset: SupersetOverlay,
};
```

- [ ] **Step 4: Verify the playground builds**

Run: `pnpm --filter @nanisoft/playground build`
Expected: build succeeds (no type errors; `supersetDashboard` + types exported by `@nanisoft/architecture`; `superset` is a known component id).

- [ ] **Step 5: Commit**

```bash
git add apps/playground/app/_overlay/SupersetOverlay.tsx apps/playground/app/_overlay/tool-content.ts
git commit -m "feat(playground): Superset mock overlay + register superset (ticket 16)"
```

---

### Task 4: Integration verification

**Files:**
- Verify only (no source changes unless a check fails).

- [ ] **Step 1: Full architecture test suite**

Run: `pnpm --filter @nanisoft/architecture vitest run`
Expected: all green (overlay incl. new `supersetDashboard` tests, playbook, playground-state, seed, tool-actions).

- [ ] **Step 2: Full build**

Run: `pnpm --filter @nanisoft/playground build`
Expected: playground builds clean.

- [ ] **Step 3: Start the playground dev server**

Run (background): `pnpm --filter @nanisoft/playground dev`
Wait for the "Ready" line on `http://localhost:3001`.

- [ ] **Step 4: Playwright MCP — open + a11y + from-seed render + filter reactivity**

Using the Playwright MCP browser tools against `http://localhost:3001`:
- Navigate to `http://localhost:3001`; assert console is clean.
- Click the `Superset` node → assert `role="dialog"` `aria-label="Superset"`, the "mocked" badge, the "query path: Superset → Trino → Gold" label, the filter bar, and the three dashboard panels (bar, table, donut).
- **From-seed render:** at a fresh playground (cursor 0), the dashboard renders from live Gold. At cursor 0 (blankState, empty Gold) the bar shows both products at 0 exposure, the table is empty, the donut shows 0/0. Step the playbook to cursor 10 (Gold populated, before the finding) via `window.__playground.getState().step()` repeated, or the Controls → assert the bar shows P-1042 at 1 exposure (jade) + P-2210 at 0; the table shows the `j.harper` row; the donut shows SQL Fleet 2 / Active Directory 2. This confirms the dashboard renders from the seeded Gold before the flagship finding runs.
- Toggle "Sensitive only" → the bar hides P-2210; the table unchanged; the donut unchanged. Click the P-1042 bar → the bar emphasizes P-1042; the table filters to the j.harper row; the "clear drill" pill appears. Clear the drill → back to the unfiltered view.
- Esc closes the overlay; `window.__playground.getState().overlay` → `null`.
- Take a final a11y snapshot; assert no `role="dialog"` remains after close.

- [ ] **Step 5: Stop the dev server**

Stop the background dev process.

- [ ] **Step 6: Human visual confirm (deferred — operator AFK)**

Record in the final report: the split-pane Superset dashboard, the jade anomalous flag on j.harper + the sensitive exposure bar, the donut, and the filter reactivity are pending the operator's visual confirm on return. The a11y + build + live-state checks stand in until then.

- [ ] **Step 7: Final report**

Report: the no-openTool / no-mutate rationale, the exposure derivation, files changed, new test count, verification result (incl. from-seed render), branch name (`feat/16-superset-mock`). Confirm committed on the branch and the main repo was not touched. Do NOT merge to main.

---

## Self-Review

**Spec coverage:**
- Reached by clicking the Superset node (no guided step); off the flagship path → `superset` is `fullUi: true` (`NodeChip` calls `onOpenTool`); no `openTool` on any step; step 21 untouched. ✓
- Dashboard grid + filter bar: bar / table / donut → `SupersetOverlay.tsx` (Task 3) renders the 3-panel grid + filter bar from `supersetDashboard` (Task 1). ✓
- Canonical action: filter / drill-down → re-queries Gold → re-renders → local filter state (Task 3); overlay re-derives `supersetDashboard(state)` every render + row-filters; no `store.step()`, no write. ✓
- Reads Gold client-side (exposure = viewed edge with no memberof backing = exposed); writes nothing; "query path: Superset → Trino → Gold" label → `supersetDashboard` derivation (Task 1); no write; query-path label (Task 3). ✓
- Explorable before the flagship runs, from the seed → derivation is of Gold only (cursor unused); from-seed + cursor-10 tests (Task 1) + cursor-10 render verification (Task 4). ✓

**Placeholder scan:** none — every step has real code or real commands.

**Type consistency:** `supersetDashboard(state, cursor): SupersetDashboard` (Task 1) — `SupersetExposureRow`/`SupersetAnomalousUserRow`/`SupersetSourceRow` (Task 1) imported in Task 3. Re-exports in `index.ts` (Task 1) match the overlay imports (Task 3). The `edgeId` in `SupersetAnomalousUserRow` (`e:viewed:j.harper:P-1042`) matches `conformToGold`'s edge id format. ✓