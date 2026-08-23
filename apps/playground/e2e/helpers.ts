import type { Page } from '@playwright/test';

/**
 * No-vision e2e helpers for the playground (ticket 17).
 *
 * Assertion channels (design D2 — never screenshots):
 *  - real UI interaction through roles/accessible names;
 *  - live store state via the dev-only `window.__playground` Zustand hook
 *    (read-only reads; the only deliberate write is Spec B's programmatic
 *    re-application of a step, which is itself the store's own `step()`);
 *  - DOM/SVG structure where visual semantics carry meaning.
 */

/** Minimal shape of the exported PlaygroundState JSON the specs assert on. */
export interface ExportedState {
  cursor: number;
  finding: Record<string, unknown> | null;
  gold: { nodes: unknown[]; edges: unknown[] };
  auditLog: unknown[];
  [k: string]: unknown;
}

export interface StoreRead {
  cursor: number;
  running: boolean;
  overlayComponent: string | null;
  /** `exportJson()` of the live state at read time. */
  json: string;
}

interface PlaygroundHook {
  getState(): {
    state: { cursor: number };
    running: boolean;
    overlay: { componentId: string } | null;
    exportJson(): string;
    step(): void;
  };
}

/**
 * Read the live store without mutating anything. Returns primitives only
 * (crosses the Node↔browser boundary), plus the full exported-state JSON.
 */
export async function readStore(page: Page): Promise<StoreRead> {
  return page.evaluate(() => {
    const hook = (window as unknown as { __playground?: PlaygroundHook }).__playground;
    if (!hook) throw new Error('window.__playground missing (dev-only hook)');
    const s = hook.getState();
    return {
      cursor: s.state.cursor,
      running: s.running,
      overlayComponent: s.overlay ? s.overlay.componentId : null,
      json: s.exportJson(),
    };
  });
}

/** Parse an exported-state JSON string (helper for assertions in Node). */
export function parseState(json: string): ExportedState {
  return JSON.parse(json) as ExportedState;
}

/** Reset through the real Controls button. */
export async function resetViaUi(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.waitForFunction(() => {
    const hook = (window as unknown as { __playground?: PlaygroundHook | undefined }).__playground;
    return !!hook && hook.getState().state.cursor === 0;
  });
}

/** Click the real "Step →" button until the cursor reaches `target`. */
export async function stepTo(page: Page, target: number): Promise<void> {
  for (let i = 0; i < 40; i++) {
    const { cursor } = await readStore(page);
    if (cursor >= target) return;
    await page.getByRole('button', { name: 'Step →' }).click();
    // One click advances exactly one step; wait past the cursor we started from.
    await page.waitForFunction(
      (from) => {
        const hook = (window as unknown as { __playground?: PlaygroundHook | undefined }).__playground;
        return !!hook && hook.getState().state.cursor > (from as number);
      },
      cursor,
    );
  }
  throw new Error(`stepTo(${target}) did not converge in 40 clicks`);
}

/** Open a full-UI tool overlay via its spine chip (role=button node). */
export async function openToolChip(page: Page, codename: string): Promise<void> {
  await page.getByRole('button', { name: `Open ${codename} mock` }).click();
  await expectDialog(page, codename);
}

/** Wait until the tool dialog with the given codename is open. */
export async function expectDialog(page: Page, codename: string): Promise<void> {
  const dialog = page.locator('[role="dialog"][aria-label="' + codename + '"]');
  await dialog.waitFor({ state: 'visible' });
}

/** Close any open tool dialog via its close button. */
export async function closeOverlay(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Close overlay' }).click();
}

/** Console/pageerror collector wired before navigation (no-vision error gate). */
export interface ConsoleCollector {
  errors: string[];
  pageErrors: string[];
}

export function makeConsoleCollector(page: Page): ConsoleCollector {
  const collector: ConsoleCollector = { errors: [], pageErrors: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') collector.errors.push(m.text());
  });
  page.on('pageerror', (e) => collector.pageErrors.push(String(e)));
  return collector;
}
