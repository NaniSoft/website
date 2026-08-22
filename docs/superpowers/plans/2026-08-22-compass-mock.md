# Compass mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the fifth mocked-tool overlay — Compass — the climax: a traversal graph showing the finding as edges (jade anomalous viewed, dashed missing memberof, teal backed) + narrative + drill-into-node, auto-opening at the finding step (step 19) as the one mid-run auto-open. Compass writes nothing; its canonical action is drill-into-node (local UI state).

**Architecture:** Pure domain core (`packages/architecture`, framework-agnostic, vitest) gains `compassTraversal(state, cursor)` (a pure derivation mirroring `airflowDagStatus`). `apps/playground` gains `CompassOverlay.tsx` + one line in the `tool-content.ts` registry + one `useEffect` in `playground-client.tsx` (the auto-open). No state field, no `tool-actions.ts`, no `playbook.ts`, no store/chrome change.

**Tech Stack:** Next.js 16.3.1 (stock, modified — see Global Constraints), pnpm monorepo, `@xyflow/react` ^12 (untouched), Zustand ^5, `@nanisoft/architecture` + `@nanisoft/identity` (workspace), vitest 4 (architecture package only).

## Global Constraints

- **AGENTS.md (modified Next.js):** read the relevant guide in `apps/playground/node_modules/next/dist/docs/` before writing Next code. `'use client'` wrapper + `dynamic({ssr:false})` stays INSIDE the client wrapper — the 09/10/11 `page.tsx` Server → `playground-client.tsx` `'use client'` → `dynamic(ssr:false)` `Spine` pattern is untouched. `CompassOverlay` is a plain `'use client'` component (like `AirflowOverlay`); `playground-client.tsx` is already `'use client'` — adding a `useEffect` there is standard (confirmed against the `05-server-and-client-components.md` guide: lifecycle logic / `useEffect` is a documented Client Component use case).
- **No vision workflow:** verify via `pnpm -r build`, console messages, Playwright MCP a11y snapshot, live JS state (`window.__playground.getState()`), + a human visual confirm (deferred — operator AFK).
- **Add vitest for any pure logic** (architecture package; `environment: node`, `tests/**/*.test.ts`). React components verify via build + Playwright MCP.
- **Jade = single locked accent, live/active only; teal = done.** Jade appears only on the anomalous `viewed` edge (the live finding) + the sensitive-product accent ring. Teal for backed/ok edges + memberof. Petrol for pending + the dashed missing gap. No pure white/black.
- **Pure core must not import React/Next/Zustand/React Flow.**
- **Identity tokens:** `color`, `surface`, `font`, `radius` from `@nanisoft/identity`. Global `prefers-reduced-motion` guard in `globals.css` suppresses animations.
- Run architecture tests with `pnpm --filter @nanisoft/architecture test`. The playground has no test script.
- Commit on the branch `feat/15-compass-mock` (already checked out). Do NOT merge to main.

---

## File Structure

**`packages/architecture` (pure + vitest):**
- Modify `src/overlay.ts` — add `compassTraversal(state, cursor)` + `CompassNode`/`CompassEdge`/`CompassEdgeStatus`/`CompassNarrativeStep`/`CompassTraversal` types (next to `airflowDagStatus`).
- Modify `src/index.ts` — re-export `compassTraversal` + the new types.
- Extend `tests/overlay.test.ts` (compassTraversal).

**`apps/playground` (React shell):**
- Create `app/_overlay/CompassOverlay.tsx` — the traversal-graph mock body + drill-into detail panel.
- Modify `app/_overlay/tool-content.ts` — add `compass: CompassOverlay`.
- Modify `app/playground-client.tsx` — add the auto-open `useEffect` + `useRef` guard.

Nothing else changes: `ToolOverlay.tsx`, `usePlayground.ts`, `Spine.tsx`, `NodeChip.tsx`, `globals.css` are untouched. `compass` is already `fullUi: true`; `openTool`/`closeTool` already exist; `MOCK_TOOL_BY_COMPONENT['compass']` already carries the text. No new dependency, no new state field.

---

### Task 1: Pure core — `compassTraversal` derivation

**Files:**
- Modify: `packages/architecture/src/overlay.ts` (append after `airflowDagStatus`)
- Modify: `packages/architecture/src/index.ts` (the `// ── Overlay chrome + derivations ──` block)
- Test: `packages/architecture/tests/overlay.test.ts` (append a describe block)

**Interfaces:**
- Produces: `compassTraversal(state, cursor): CompassTraversal` + the types listed above. Reads `state.gold` (nodes/edges, with `status` set at step 17) + `state.finding`. Synthesizes the missing-memberof gap edge from the finding.

- [ ] **Step 1: Write the failing tests**

Append to `packages/architecture/tests/overlay.test.ts`. Add `compassTraversal` + `type CompassTraversal` to the import from `'../src/index'`.

Append the new describe block (per the design doc's testing section): blank state (cursor 0) → not ready, querying; cursor 10 → 5 nodes / 4 edges, no gap, viewed pending, memberof backed, not ready; cursor 17 → 5 nodes / 5 edges (missing gap synthesized), anomalous/ok/backed/gap, not ready, finding non-null; cursor 19 → ready, 3 narrative lines, 5 detail entries; cursor 22 → ready, still populated; missing-gap edge shape.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @nanisoft/architecture test -- overlay`
Expected: FAIL — `compassTraversal` is not exported.

- [ ] **Step 3: Implement — `overlay.ts`**

Append after `airflowDagStatus`: the types + `compassTraversal` per the design doc. `COMPASS_CLIMAX_STEP = 19` (constant with a comment referencing step 19, `final: true`). Edge status derived from `gold.status` + `missing`. Missing-memberof gap synthesized when `state.finding?.missingMembership` — edge `{ id: 'e:missing:<user>:<ownerGroup>', from: finding.user, to: finding.ownerGroup, kind: 'memberof', status: 'gap', missing: true }`. `ready = state.finding !== null && cursor >= COMPASS_CLIMAX_STEP`. Narrative + details populated only when `ready`.

- [ ] **Step 4: Re-export from `index.ts`**

Add `compassTraversal` to the value export and the new types to the type export in the overlay derivations block.

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @nanisoft/architecture test`
Expected: PASS — all `compassTraversal` tests pass; existing 86 tests stay green.

- [ ] **Step 6: Commit**

```bash
git add packages/architecture/src/overlay.ts packages/architecture/src/index.ts packages/architecture/tests/overlay.test.ts
git commit -m "feat(arch): compassTraversal derivation (ticket 15)"
```

---

### Task 2: Shell — `CompassOverlay.tsx` + register in `tool-content.ts`

**Files:**
- Create: `apps/playground/app/_overlay/CompassOverlay.tsx`
- Modify: `apps/playground/app/_overlay/tool-content.ts` (add the `compass` entry)

**Interfaces:**
- Consumes: `compassTraversal`, `CompassNode`, `CompassEdge` (Task 1); `usePlayground` (existing). Identity tokens.
- Produces: `CompassOverlay` — the traversal-graph body + drill-into detail panel. Registered as `TOOL_CONTENT['compass']`.

- [ ] **Step 1: Implement — `CompassOverlay.tsx`**

Create `apps/playground/app/_overlay/CompassOverlay.tsx`: `'use client'`; reads `state` from the store; computes `compassTraversal(state, state.cursor)`; `useState<string|null>` for the selected node. Renders: pre-climax status line (when `!ready`), the 3-column SVG traversal graph (node chips positioned over an SVG edge layer), the narrative (when ready), the drill-into detail panel (selected node → `details[id]`), and the fidelity footer. Node chips clickable → `setSelected(id)`. Jade for anomalous, dashed petrol for the gap, teal for backed/ok, petrol for pending. `role="group"` / `role="status"` a11y.

- [ ] **Step 2: Register the overlay**

In `apps/playground/app/_overlay/tool-content.ts`, add `compass: CompassOverlay`.

- [ ] **Step 3: Verify the playground builds**

Run: `pnpm --filter @nanisoft/playground build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/playground/app/_overlay/CompassOverlay.tsx apps/playground/app/_overlay/tool-content.ts
git commit -m "feat(playground): Compass traversal overlay + register compass (ticket 15)"
```

---

### Task 3: Auto-open — the one climax hook in `playground-client.tsx`

**Files:**
- Modify: `apps/playground/app/playground-client.tsx` (add `useEffect` + `useRef` + `STEPS`/`openTool` subscriptions)

**Interfaces:**
- Consumes: `usePlayground` (`state.cursor`, `openTool`), `STEPS` (to find `final` step).
- Produces: the auto-open — when `cursor` reaches the finding step (19) and the guard hasn't fired and no overlay is open, call `openTool('compass')`. The only auto-open.

- [ ] **Step 1: Implement the `useEffect`**

In `playground-client.tsx`: import `useEffect`, `useRef` from React; `STEPS` from the store module; compute `FINDING_STEP_N = STEPS.find((s) => s.final)?.n ?? 19`. Subscribe to `cursor` + `openTool`. Add the `autoOpenedFinding` ref + the effect (per the design doc). The effect is keyed on `[cursor, openTool]` (NOT `overlay`), reads `usePlayground.getState().overlay` to avoid clobbering an open overlay, and resets the ref when `cursor < FINDING_STEP_N`.

- [ ] **Step 2: Verify the build**

Run: `pnpm --filter @nanisoft/playground build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/playground/app/playground-client.tsx
git commit -m "feat(playground): Compass auto-open at the finding step (ticket 15)"
```

---

### Task 4: Verification

- [ ] **Step 1: Full test suite**

Run: `pnpm --filter @nanisoft/architecture test`
Expected: all green (86 + new `compassTraversal` tests).

- [ ] **Step 2: Full build**

Run: `pnpm --filter @nanisoft/playground build`
Expected: playground builds clean.

- [ ] **Step 3: Start the playground dev server** (background) on :3001.

- [ ] **Step 4: Playwright MCP — auto-open + drill-into + graph**

- Navigate to `http://localhost:3001`; assert console clean.
- Fresh reset → `window.__playground.getState().state.cursor === 0`; `overlay === null`.
- Single-step to cursor 19 (18 `step()` calls via `window.__playground.getState().step()`) → assert `overlay` is `{ componentId: 'compass', openedAtCursor: 19 }` (the climax auto-open); a11y snapshot shows `role="dialog"` `aria-label="Compass"`.
- Press Esc → `overlay === null`; one more `step()` (cursor 20) → overlay does NOT re-open (guard fired).
- `reset()` → `cursor 0`; step back to 19 → auto-open fires again.
- With Compass open at 19: click the `j.harper` node → the detail panel (`role="status"`) contains "no backing group membership"; click `P-1042` → contains "sensitive: true".
- Auto-run to 19: fresh reset → run auto-run (`window.__playground.getState().run()`); poll until `cursor === 19`; assert `overlay.componentId === 'compass'`.
- Existing overlays still work: open DataGerry / Airflow manually at any cursor; no auto-open for them at any cursor.

- [ ] **Step 5: Stop the dev server.**

- [ ] **Step 6: Human visual confirm (deferred — operator AFK)** — the jade anomalous edge, dashed gap, teal backed edges, drill-into panel, climax auto-open.

- [ ] **Step 7: Final report** — auto-open (only one), no-mutate rationale, files, test count, verification, branch. Do NOT merge to main.

---

## Self-Review

**Spec coverage:** traversal graph as edges (Task 1 derivation + Task 2 render) ✓; climax auto-open (Task 3, the only one) ✓; drill-into-node canonical action (Task 2, local UI state, no mutate) ✓; reads Atlas response + Gold, writes nothing (Task 1 reads gold/finding only) ✓; most faithful, node-within-node deferred (footer, no such work) ✓.

**Placeholder scan:** none — every step has real code.

**Type consistency:** `compassTraversal(state, cursor): CompassTraversal` (Task 1) consumed by `CompassOverlay` (Task 2); `CompassNode`/`CompassEdge` (Task 1) imported in Task 2; `details: Record<string,string>` (Task 1) read by the detail panel (Task 2). `FINDING_STEP_N` (Task 3) = step 19's `n` = `COMPASS_CLIMAX_STEP` (Task 1) — both reference the same finding step. ✓