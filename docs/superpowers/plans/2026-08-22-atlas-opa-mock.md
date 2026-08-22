# Atlas + OPA Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the fourth mocked-tool overlay (Atlas + OPA) — the authz-and-audit "govern" surface that teaches the twin is governed.

**Architecture:** Pure derivation `atlasOpaStatus(state, cursor)` in `packages/architecture/src/overlay.ts` (mirrors `airflowDagStatus`); step 14 gains `openTool: 'atlas'` (its existing audit-log `apply` is the one mutate — no new canonical-action fn); a new `AtlasOpaOverlay.tsx` client component renders two zones (OPA decision card + Atlas request log) and registers under `atlas` in `tool-content.ts`. One code path: the overlay's "Evaluate authz" button calls `store.step()`.

**Tech Stack:** TypeScript (pure core, vitest) · React client component (`'use client'`) · Zustand store (unchanged) · `@nanisoft/identity` tokens.

## Global Constraints

- Worktree root: `C:/Users/dpven/source/repos/lp/.worktrees/ticket-14`. Branch: `feat/14-atlas-opa-mock` (already checked out — do NOT create branches/worktrees; commit on this branch; do NOT merge to main).
- Pure core (`packages/architecture`) imports no React/Next/Zustand/React Flow. Derivations are pure functions of `(state, cursor)`.
- One code path: the overlay's canonical-action button calls `store.step()` — the same `applyStep` auto-run uses. No new fn in `tool-actions.ts`; step 14's existing `apply` is the only audit write.
- Identity tokens (SPEC §2): jade = single locked accent, live/active only (ALLOW decision + enabled button); teal = done/success statuses; petrol/petrolSoft = pending; no pure white/black. `font.data` = JetBrains Mono (Rego + log); `font.voice` = Satoshi (button). `radius.inner` = 12; buttons are pills.
- OPA is stateless (reads a static Rego policy, writes nothing). The audit write is Atlas's. The traversal result is a hand-off to Compass (a log line only — never rendered here).
- Hard rule (AGENTS.md): modified Next.js — read `apps/playground/node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` before playground code. (Done for this plan: the new overlay is a `'use client'` component, identical pattern to `AirflowOverlay.tsx` — no new Next.js APIs, server/client boundaries, routing, or data fetching; no deprecation notices apply.)
- All shell commands run from the worktree root: prefix with `cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && ...`.

---

## File Structure

**`packages/architecture` (pure + unit-tested):**
- `src/overlay.ts` (modify, append) — add `AtlasLogLine`, `AtlasOpaStatus` types + `atlasOpaStatus(state, cursor)` + the static `ATLAS_REGO` snippet.
- `src/index.ts` (modify) — re-export `atlasOpaStatus` + the two types.
- `src/playbook.ts` (modify, one line) — step 14 gains `openTool: 'atlas'`.
- `tests/overlay.test.ts` (modify, append) — `atlasOpaStatus` test block.
- `tests/playbook.test.ts` (modify, append) — step 14 `openTool` + beckon assertions.

**`apps/playground` (reactive shell):**
- `app/_overlay/AtlasOpaOverlay.tsx` (create) — the two-zone mock body.
- `app/_overlay/tool-content.ts` (modify, one line) — register `atlas: AtlasOpaOverlay`.

No other files change.

---

### Task 1: Pure derivation `atlasOpaStatus` + types (TDD)

**Files:**
- Modify: `packages/architecture/src/overlay.ts` (append after `airflowDagStatus`, ~line 193).
- Modify: `packages/architecture/src/index.ts` (overlay re-export block, ~lines 101–111).
- Test: `packages/architecture/tests/overlay.test.ts` (append a new `describe` block).

**Interfaces:**
- Consumes: `PlaygroundState` from `./playground-state` (already imported in `overlay.ts`); `SENSITIVE_PRODUCT_VIEW_AUDIT`, `blankState`, `reduceToCursor` from `../src/index` (already imported in the test).
- Produces: `atlasOpaStatus(state: PlaygroundState, cursor: number): AtlasOpaStatus`; `AtlasLogLine` `{ method: 'GET'|'POST'; path: string; status: number; body?: string }`; `AtlasOpaStatus` `{ allow: boolean; rego: string; log: AtlasLogLine[] }`. Also exports the constant `ATLAS_REGO` string (so the test can assert against it and the overlay reuses it).

- [ ] **Step 1: Write the failing tests**

Append to `packages/architecture/tests/overlay.test.ts` (after the `airflowDagStatus` block). Add `atlasOpaStatus` to the import from `'../src/index'`:

```ts
import {
  airflowDagStatus,
  atlasOpaStatus,
  beckonToolId,
  dataGerrySyncStatus,
  overlayReducer,
  blankState,
  reduceToCursor,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  type OverlayState,
} from '../src/index';
```

Then append this block at the end of the file:

```ts
describe('atlasOpaStatus — SPEC §4.8 Atlas + OPA authz-and-audit', () => {
  it('rego is the constant 3-line snippet', () => {
    const s = atlasOpaStatus(blankState(), 0);
    expect(s.rego).toBe(
      'package nanisoft.authz\n' +
        'allow if {\n' +
        '  input.user == "analyst"\n' +
        '  input.use_case == "sensitive-product-view-audit"\n' +
        '}',
    );
  });

  it('cursor 0 → allow false, empty log', () => {
    const s = atlasOpaStatus(blankState(), 0);
    expect(s.allow).toBe(false);
    expect(s.log).toEqual([]);
  });

  it('cursor 10 → still empty log (Compass has not asked Atlas yet)', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 10), 10);
    expect(s.allow).toBe(false);
    expect(s.log).toEqual([]);
  });

  it('cursor 11 → GET use-cases/steps → 200 only; allow false', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 11), 11);
    expect(s.allow).toBe(false);
    expect(s.log).toEqual([
      { method: 'GET', path: '/use-cases/sensitive-product-view-audit/steps', status: 200 },
    ]);
  });

  it('cursor 12 → same as 11 (authz check not yet complete); allow false', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 12), 12);
    expect(s.allow).toBe(false);
    expect(s.log).toHaveLength(1);
  });

  it('cursor 13 → adds POST /authz/check → 200 {allow:true}; allow true', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 13), 13);
    expect(s.allow).toBe(true);
    expect(s.log).toEqual([
      { method: 'GET', path: '/use-cases/sensitive-product-view-audit/steps', status: 200 },
      { method: 'POST', path: '/authz/check', status: 200, body: '{allow:true}' },
    ]);
  });

  it('cursor 14 → adds POST /audit/log → 201 (the canonical action result)', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 14), 14);
    expect(s.allow).toBe(true);
    expect(s.log).toHaveLength(3);
    expect(s.log[2]).toEqual({ method: 'POST', path: '/audit/log', status: 201 });
  });

  it('cursor 17 → still 3 lines (traversal not yet served)', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 17), 17);
    expect(s.log).toHaveLength(3);
  });

  it('cursor 18 → adds GET /traversal/query → 200 [finding] (log line only)', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 18), 18);
    expect(s.allow).toBe(true);
    expect(s.log).toHaveLength(4);
    expect(s.log[3]).toEqual({ method: 'GET', path: '/traversal/query', status: 200, body: '[finding]' });
  });

  it('cursor 22 → 4 lines, allow true', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 22), 22);
    expect(s.allow).toBe(true);
    expect(s.log).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && pnpm --filter @nanisoft/architecture vitest run tests/overlay.test.ts`
Expected: FAIL — `atlasOpaStatus is not exported` (or not a function).

- [ ] **Step 3: Implement `atlasOpaStatus` + types in `overlay.ts`**

Append to `packages/architecture/src/overlay.ts` (after the `airflowDagStatus` function):

```ts
// ── Atlas + OPA authz-and-audit (SPEC §4.8) ────────────────────────────────────

export interface AtlasLogLine {
  method: 'GET' | 'POST';
  path: string;
  status: number;
  /** Optional response body snippet, e.g. `{allow:true}` or `[finding]`. */
  body?: string;
}

export interface AtlasOpaStatus {
  /** OPA decision — true once OPA returns allow (cursor ≥ 13). False = pending. */
  allow: boolean;
  /** Static read-only Rego snippet (the policy OPA evaluates). */
  rego: string;
  /** The Atlas request/response log, cursor-derived (up to 4 lines). */
  log: AtlasLogLine[];
}

/** The static ~3-line Rego policy OPA evaluates (SPEC §4.8). Read-only in the card. */
export const ATLAS_REGO =
  'package nanisoft.authz\n' +
  'allow if {\n' +
  '  input.user == "analyst"\n' +
  '  input.use_case == "sensitive-product-view-audit"\n' +
  '}';

/**
 * The Atlas + OPA authz-and-audit status — a pure derivation from `(state,
 * cursor)` (SPEC §4.8), mirroring `dataGerrySyncStatus` / `airflowDagStatus`.
 *
 * OPA is stateless (reads the static `ATLAS_REGO` policy, writes nothing); the
 * audit write is Atlas's (step 14's `apply`, already in `auditLog`). The decision
 * and the request log are pure functions of the cursor:
 *  - `GET use-cases/.../steps → 200`   at cursor ≥ 11 (Compass asks Atlas, step 11)
 *  - `POST /authz/check → 200 {allow:true}` at cursor ≥ 13 (OPA returns allow, step 13)
 *  - `POST /audit/log → 201`           at cursor ≥ 14 (Atlas writes the audit entry, step 14)
 *  - `GET /traversal/query → 200 [finding]` at cursor ≥ 18 (Atlas serves the traversal,
 *    step 18 — a log line only; the finding traversal is Compass's climax).
 * `allow = cursor >= 13`. The traversal result is never visualized here.
 */
export function atlasOpaStatus(state: PlaygroundState, cursor: number): AtlasOpaStatus {
  const log: AtlasLogLine[] = [];
  if (cursor >= 11) {
    log.push({ method: 'GET', path: '/use-cases/sensitive-product-view-audit/steps', status: 200 });
  }
  if (cursor >= 13) {
    log.push({ method: 'POST', path: '/authz/check', status: 200, body: '{allow:true}' });
  }
  if (cursor >= 14) {
    log.push({ method: 'POST', path: '/audit/log', status: 201 });
  }
  if (cursor >= 18) {
    log.push({ method: 'GET', path: '/traversal/query', status: 200, body: '[finding]' });
  }
  return { allow: cursor >= 13, rego: ATLAS_REGO, log };
}
```

- [ ] **Step 4: Re-export from `index.ts`**

In `packages/architecture/src/index.ts`, update the overlay export block. Change the value export line (around line 101):

```ts
export { overlayReducer, beckonToolId, dataGerrySyncStatus, airflowDagStatus, atlasOpaStatus, ATLAS_REGO } from './overlay';
```

And update the type export (around lines 102–111) to add the two new types — append inside the existing `export type { ... } from './overlay';` block:

```ts
export type {
  OverlayState,
  OverlayAction,
  DataGerrySyncStatus,
  AirflowTaskState,
  AirflowTask,
  AirflowDag,
  AirflowRunLogLine,
  AirflowDagStatus,
  AtlasLogLine,
  AtlasOpaStatus,
} from './overlay';
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && pnpm --filter @nanisoft/architecture vitest run tests/overlay.test.ts`
Expected: PASS (all `atlasOpaStatus` cases + the existing overlay tests).

- [ ] **Step 6: Commit**

```bash
cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && git add packages/architecture/src/overlay.ts packages/architecture/src/index.ts packages/architecture/tests/overlay.test.ts && git commit -m "feat(arch): atlasOpaStatus pure derivation + types (ticket 14)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Wire `openTool: 'atlas'` on step 14 (TDD)

**Files:**
- Modify: `packages/architecture/src/playbook.ts` (step 14, ~line 114 — add one line).
- Test: `packages/architecture/tests/playbook.test.ts` (append assertions).

**Interfaces:**
- Consumes: `SENSITIVE_PRODUCT_VIEW_AUDIT` (already in the test import); `beckonToolId` from `../src/index`.
- Produces: step 14 now carries `openTool: 'atlas'`; `beckonToolId(STEPS, 14)` returns `'atlas'` (the node beckons post-write). No change to step 14's `apply`.

- [ ] **Step 1: Write the failing tests**

Append to `packages/architecture/tests/playbook.test.ts`. First check the existing import line for `SENSITIVE_PRODUCT_VIEW_AUDIT` and `beckonToolId`; if `beckonToolId` is not imported, add it to the import from `'../src/index'`. Then append:

```ts
describe('Atlas + OPA — step 14 openTool (ticket 14)', () => {
  const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

  it('step 14 carries openTool: atlas (the audit-write mutate beckons)', () => {
    const step14 = STEPS.find((s) => s.n === 14);
    expect(step14).toBeDefined();
    expect(step14?.openTool).toBe('atlas');
  });

  it('step 14 apply still pushes exactly one audit-log entry (existing mutate unchanged)', () => {
    const state = reduceToCursor(STEPS, 14);
    expect(state.auditLog).toHaveLength(1);
    expect(state.auditLog[0].actor).toBe('analyst');
    expect(state.auditLog[0].decision).toBe('allow');
    expect(state.auditLog[0].detail).toContain('OPA allowed');
  });

  it('beckonToolId at cursor 14 returns atlas (post-write observe invite)', () => {
    expect(beckonToolId(STEPS, 14)).toBe('atlas');
  });

  it('steps 12 and 13 remain narrate-only (no openTool, no audit write)', () => {
    const step12 = STEPS.find((s) => s.n === 12);
    const step13 = STEPS.find((s) => s.n === 13);
    expect(step12?.openTool).toBeUndefined();
    expect(step13?.openTool).toBeUndefined();
    const state13 = reduceToCursor(STEPS, 13);
    expect(state13.auditLog).toHaveLength(0);
  });
});
```

If `reduceToCursor` is not already imported in `playbook.test.ts`, add it to the import from `'../src/index'`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && pnpm --filter @nanisoft/architecture vitest run tests/playbook.test.ts`
Expected: FAIL — "expected 'atlas' to be 'undefined'" (step 14 has no `openTool` yet) and `beckonToolId(STEPS, 14)` returns `null`.

- [ ] **Step 3: Add `openTool: 'atlas'` to step 14**

In `packages/architecture/src/playbook.ts`, the step 14 object is:

```ts
  {
    n: 14, phase: 'investigation', actor: 'atlas', edge: null,
    title: 'Atlas writes the audit log',
    desc: 'Atlas writes an audit-log entry for the run before executing.',
    apply: (s) => {
      s.auditLog.push({ ts: TS, actor: 'analyst', useCase: 'sensitive-product-view-audit', decision: 'allow', detail: 'OPA allowed Sensitive Product View Audit' });
    },
  },
```

Add `openTool: 'atlas',` after the `apply` fn (before the closing brace):

```ts
    apply: (s) => {
      s.auditLog.push({ ts: TS, actor: 'analyst', useCase: 'sensitive-product-view-audit', decision: 'allow', detail: 'OPA allowed Sensitive Product View Audit' });
    },
    openTool: 'atlas',
  },
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && pnpm --filter @nanisoft/architecture vitest run tests/playbook.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full architecture suite**

Run: `cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && pnpm --filter @nanisoft/architecture vitest run`
Expected: PASS (all suites — overlay, playbook, playground-state, seed, tool-actions).

- [ ] **Step 6: Commit**

```bash
cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && git add packages/architecture/src/playbook.ts packages/architecture/tests/playbook.test.ts && git commit -m "feat(arch): wire step 14 openTool:atlas (ticket 14)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: `AtlasOpaOverlay.tsx` two-zone shell + registration

**Files:**
- Create: `apps/playground/app/_overlay/AtlasOpaOverlay.tsx`.
- Modify: `apps/playground/app/_overlay/tool-content.ts` (add one entry).
- Reference: `apps/playground/app/_overlay/AirflowOverlay.tsx` (the pattern to mirror — `'use client'`, `usePlayground`, `color/font/radius/surface` from `@nanisoft/identity`, `BECKON_CURSOR = STEPS.findIndex(...)`).

**Interfaces:**
- Consumes: `atlasOpaStatus`, `type AtlasLogLine` from `@nanisoft/architecture`; `usePlayground`, `STEPS` from `../_store/usePlayground`; `color, font, radius, surface` from `@nanisoft/identity`.
- Produces: a named export `AtlasOpaOverlay` (registered as `atlas` in `TOOL_CONTENT`). No props. Reads `state` + `step` from the store; reads `atlasOpaStatus(state, state.cursor)` for the decision/rego/log.

- [ ] **Step 1: Create the overlay component**

Create `apps/playground/app/_overlay/AtlasOpaOverlay.tsx`:

```tsx
'use client';

import type { CSSProperties } from 'react';
import { color, font, radius, surface } from '@nanisoft/identity';
import { atlasOpaStatus, type AtlasLogLine } from '@nanisoft/architecture';
import { usePlayground, STEPS } from '../_store/usePlayground';

/**
 * Atlas + OPA mock — the "govern" write surface (SPEC §4.8/§4.9). One overlay,
 * two zones: an OPA decision card (focal interactive — input → ALLOW + a
 * read-only ~3-line Rego snippet) and an Atlas request/response log (context,
 * non-interactive). The "Evaluate authz" button calls store.step() — the same
 * applyStep auto-run uses (one code path) — and applies step 14 (the audit-log
 * write, the only mutate). OPA is stateless (static Rego, writes nothing); the
 * audit write is Atlas's. The traversal result is a hand-off to Compass — a log
 * line only, never rendered here. Jade = ALLOW (live); teal = success statuses;
 * petrol = pending.
 */

/** The cursor at which Atlas's canonical action is live (step 14 is next). */
const BECKON_CURSOR = STEPS.findIndex((s) => s.openTool === 'atlas');

const label: CSSProperties = {
  margin: 0,
  fontFamily: font.data,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: surface.light.textMuted,
};

function DecisionPill({ allow }: { allow: boolean }) {
  return (
    <span
      style={{
        fontFamily: font.data,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '3px 10px',
        borderRadius: 9999,
        border: `1px solid ${allow ? color.jade : color.petrolSoft}`,
        color: allow ? color.jade : surface.light.textMuted,
        background: allow ? 'rgba(20, 167, 122, 0.10)' : 'transparent',
      }}
    >
      {allow ? 'ALLOW' : 'pending'}
    </span>
  );
}

function LogLine({ line }: { line: AtlasLogLine }) {
  const success = line.status >= 200 && line.status < 300;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <span
        style={{
          fontFamily: font.data,
          fontSize: 11,
          fontWeight: 700,
          color: line.method === 'POST' ? color.teal : surface.light.text,
          minWidth: 38,
        }}
      >
        {line.method}
      </span>
      <span style={{ fontFamily: font.data, fontSize: 11, color: surface.light.text, flex: 1 }}>
        {line.path}
      </span>
      <span style={{ fontFamily: font.data, fontSize: 11, color: success ? color.teal : surface.light.textMuted }}>
        → {line.status}
      </span>
      {line.body && (
        <span style={{ fontFamily: font.data, fontSize: 11, color: surface.light.textMuted }}>{line.body}</span>
      )}
    </div>
  );
}

export function AtlasOpaOverlay() {
  const state = usePlayground((s) => s.state);
  const step = usePlayground((s) => s.step);

  const status = atlasOpaStatus(state, state.cursor);
  const auditWritten = state.auditLog.length > 0;
  const canAct = state.cursor === BECKON_CURSOR && !auditWritten;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14 }}>
      {/* Zone 1 — OPA decision card (focal interactive) */}
      <div
        role="group"
        aria-label="OPA decision"
        style={{
          background: surface.light.sunken,
          borderRadius: radius.inner,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={label}>OPA · authz decision</p>
          <DecisionPill allow={status.allow} />
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...label, letterSpacing: '0.06em' }}>user</span>
            <span style={{ fontFamily: font.data, fontSize: 12, color: surface.light.text }}>analyst</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...label, letterSpacing: '0.06em' }}>use-case</span>
            <span style={{ fontFamily: font.data, fontSize: 12, color: surface.light.text }}>
              Sensitive Product View Audit
            </span>
          </div>
        </div>

        <div>
          <p style={{ ...label, marginBottom: 4 }}>Rego · static policy</p>
          <pre
            style={{
              margin: 0,
              padding: '8px 10px',
              background: surface.light.elevated,
              borderRadius: radius.inner,
              border: `1px solid ${surface.light.border}`,
              fontFamily: font.data,
              fontSize: 11,
              lineHeight: 1.5,
              color: surface.light.text,
              whiteSpace: 'pre',
              overflow: 'auto',
            }}
          >
            {status.rego}
          </pre>
        </div>

        <button
          onClick={step}
          disabled={!canAct}
          aria-label="Evaluate authz decision"
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
          {auditWritten ? 'Audit entry written' : 'Evaluate authz'}
        </button>

        <p style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }}>
          OPA is stateless · reads a static Rego policy · writes nothing
        </p>
      </div>

      {/* Zone 2 — Atlas request/response log (context, non-interactive) */}
      <div
        role="log"
        aria-label="Atlas request log"
        style={{
          background: surface.light.sunken,
          borderRadius: radius.inner,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <p style={label}>Atlas · request log</p>
        {status.log.length === 0 ? (
          <span style={{ fontFamily: font.data, fontSize: 11, color: surface.light.textMuted }}>no requests yet</span>
        ) : (
          status.log.map((line, i) => <LogLine key={i} line={line} />)
        )}
      </div>

      <p style={{ ...label, marginTop: 2 }}>
        mocked · authz + audit surface only · confidence/trust state machine, temporal-ledger, Celery, full FastAPI
        surface, OPA bundle management hidden
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Register the overlay**

In `apps/playground/app/_overlay/tool-content.ts`, add the import + entry. The file becomes:

```ts
import type { ComponentType } from 'react';
import { AirflowOverlay } from './AirflowOverlay';
import { AtlasOpaOverlay } from './AtlasOpaOverlay';
import { DataGerryOverlay } from './DataGerryOverlay';

/**
 * The single registration point for mocked-tool overlay content (SPEC §4.8).
 * Tickets 12–16 add their tool body here; the uniform chrome (`ToolOverlay`)
 * stays unchanged. Keyed by component id.
 */
export const TOOL_CONTENT: Record<string, ComponentType> = {
  blueprint: DataGerryOverlay,
  trailhead: AirflowOverlay,
  atlas: AtlasOpaOverlay,
};
```

- [ ] **Step 3: Build the playground to verify it compiles**

Run: `cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && pnpm --filter playground build`
Expected: build succeeds (no TypeScript errors). If a type error appears, fix it before proceeding.

- [ ] **Step 4: Commit**

```bash
cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && git add apps/playground/app/_overlay/AtlasOpaOverlay.tsx apps/playground/app/_overlay/tool-content.ts && git commit -m "feat(playground): Atlas + OPA mock overlay + register atlas (ticket 14)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Verify + final checks

**Files:** none modified.

- [ ] **Step 1: Run the architecture test suite**

Run: `cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && pnpm --filter @nanisoft/architecture vitest run`
Expected: all green.

- [ ] **Step 2: Run the playground build**

Run: `cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && pnpm --filter playground build`
Expected: build succeeds.

- [ ] **Step 3: Self-review with `mattpocock-skills:code-review`**

Invoke the `mattpocock-skills:code-review` skill over the diff (`git diff main...feat/14-atlas-opa-mock`). Fix any findings inline (one-code-path purity, no React imports in the core, identity-token discipline, no traversal visualization).

- [ ] **Step 4: Verification-before-completion**

Invoke `superpowers:verification-before-completion`. Confirm: the pure core is unit-tested and green; the playground builds; `openTool` is bound to step 14 (not 12/13); the audit mutate is not duplicated (no new fn in `tool-actions.ts`); the traversal is a log line only; OPA is stateless. Commit any review fixes.

- [ ] **Step 5: Final commit (if review fixes were made)**

```bash
cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && git add -A && git commit -m "fix(14): code-review fixes

Co-Authored-By: Claude <noreply@anthropic.com>"
```

(If no fixes, skip — the work is already committed across Tasks 1–3.)

- [ ] **Step 6: Confirm branch state**

Run: `cd C:/Users/dpven/source/repos/lp/.worktrees/ticket-14 && git log --oneline main..HEAD | cat && git status --short | cat`
Expected: 3 commits on `feat/14-atlas-opa-mock`, clean tree, main untouched.