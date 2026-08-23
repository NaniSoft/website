import { expect, test } from '@playwright/test';
import { applyStep, SENSITIVE_PRODUCT_VIEW_AUDIT, type PlaygroundState } from '@nanisoft/architecture';
import { closeOverlay, openToolChip, parseState, readStore, resetViaUi, stepTo } from './helpers';

/**
 * Spec B — ticket 17 criterion 2: single-step mode exposes each tool's one
 * canonical action, and performing it mutates/reads exactly what auto-run does
 * (one code path). The four store-wired tools are proven by deep comparison:
 * the live state after the real button click must equal `applyStep(prev,
 * STEPS[prevCursor])` computed in this process from the same pure core.
 *
 * Beckon cursors (STEPS index = cursor of the NEXT step to apply):
 *   DataGerry "Add Sensitive: bool" @0 · Airflow "Run this DAG" @6 ·
 *   Atlas "Evaluate authz" @13 · Trino "Run query" @15.
 *
 * DELIBERATE EXCEPTIONS (documented per SPEC §4.8 — read lenses, not bugs to
 * fix): Compass drill-into and the Superset filter are UI-local interactions.
 * They must NOT touch the lakehouse; Spec B asserts their store JSON is
 * byte-identical before/after while the UI-local state visibly changes.
 */

/** Perform a canonical action button and return { beforeJson, afterJson }. */
async function performCanonicalAction(
  page: import('@playwright/test').Page,
  codename: string,
  buttonName: string | RegExp,
): Promise<{ beforeJson: string; afterJson: string }> {
  await openToolChip(page, codename);
  const beforeJson = (await readStore(page)).json;
  await page.getByRole('button', { name: buttonName }).click();
  // The action applies one step synchronously via store.step().
  const after = await readStore(page);
  expect(after.cursor).toBe(parseState(beforeJson).cursor + 1);
  return { beforeJson, afterJson: after.json };
}

/** Assert after === applyStep(parsed-before, STEPS[beforeCursor]) — one code path. */
function expectSameStepAsProgrammatic(beforeJson: string, afterJson: string) {
  const prev = parseState(beforeJson) as unknown as PlaygroundState;
  const expected = applyStep(prev, SENSITIVE_PRODUCT_VIEW_AUDIT[prev.cursor]);
  expect(afterJson).toBe(JSON.stringify(expected));
}

test('B — DataGerry canonical action authors Sensitive: bool exactly like applyStep', async ({ page }) => {
  await page.goto('/');
  await resetViaUi(page);
  const { beforeJson, afterJson } = await performCanonicalAction(page, 'Blueprint', 'Add Sensitive: bool');
  expectSameStepAsProgrammatic(beforeJson, afterJson);
  // Visible mutation: the authored field row (exact span) + the spent action.
  await expect(page.getByText('Sensitive', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sensitive: bool — already authored' })).toBeVisible();
});

test('B — Airflow canonical action lands Bronze exactly like applyStep', async ({ page }) => {
  await page.goto('/');
  await resetViaUi(page);
  await stepTo(page, 6); // steps 1–6 applied; step 7 (load_Bronze) is next
  const { beforeJson, afterJson } = await performCanonicalAction(page, 'Trailhead', 'Run ingestion DAG');
  expectSameStepAsProgrammatic(beforeJson, afterJson);
  const bronze = parseState(afterJson).bronze as { products: unknown[]; viewLogs: unknown[] };
  expect(bronze.products).toHaveLength(2);
  expect(bronze.viewLogs).toHaveLength(2);
  await expect(page.getByText(/DAG run #1 · ingestion/)).toBeVisible();
});

test('B — Atlas canonical action writes the audit entry exactly like applyStep', async ({ page }) => {
  await page.goto('/');
  await resetViaUi(page);
  await stepTo(page, 13); // step 14 (audit write) is next
  const { beforeJson, afterJson } = await performCanonicalAction(page, 'Atlas', 'Evaluate authz decision');
  expectSameStepAsProgrammatic(beforeJson, afterJson);
  expect(parseState(afterJson).auditLog).toHaveLength(1);
  // NB: the button carries a static aria-label; its visible text flips.
  await expect(page.getByText('Audit entry written')).toBeVisible();
  await expect(page.getByText('ALLOW', { exact: true })).toBeVisible(); // OPA decision pill
});

test('B — Trino canonical action reads Gold into results exactly like applyStep', async ({ page }) => {
  await page.goto('/');
  await resetViaUi(page);
  await stepTo(page, 15); // step 16 (Overlook reads Gold) is next
  const { beforeJson, afterJson } = await performCanonicalAction(page, 'Overlook', 'Run seeded SQL query');
  expectSameStepAsProgrammatic(beforeJson, afterJson);
  // Read lens: the anomalous row surfaces (derived pre-finding).
  await expect(page.locator('[aria-label="query results"]')).toBeVisible();
  await expect(page.locator('[aria-label="j.harper anomalous view of P-1042"]')).toBeVisible();
});

test('B — Compass drill-into is UI-local (read lens): selection changes, store untouched', async ({ page }) => {
  await page.goto('/');
  await resetViaUi(page);
  await stepTo(page, 19); // climax auto-opens Compass (no chip click needed)
  await expect(page.locator('[role="dialog"][aria-label="Compass"]')).toBeVisible();
  const beforeJson = (await readStore(page)).json;
  await page.locator('[aria-label="inspect j.harper"]').click();
  await expect(page.locator('[aria-label="compass node detail"]')).toContainText('no backing group membership');
  const afterJson = (await readStore(page)).json;
  expect(afterJson).toBe(beforeJson); // the deliberate exception: no lakehouse mutate
});

test('B — Superset filter is UI-local (read lens): rows filter, store untouched', async ({ page }) => {
  await page.goto('/');
  await resetViaUi(page);
  await stepTo(page, 19); // post-Gold (step 10) so the dashboard has data
  await closeOverlay(page); // close the auto-opened Compass
  await openToolChip(page, 'Superset');
  const toggle = page.getByRole('button', { name: 'Toggle sensitive only' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  const beforeJson = (await readStore(page)).json;
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  // Filtered bar list: only the sensitive product remains.
  await expect(page.getByRole('button', { name: /Drill into Payroll-NG/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Drill into Inventory-NG/ })).toHaveCount(0);
  const afterJson = (await readStore(page)).json;
  expect(afterJson).toBe(beforeJson); // the deliberate exception: no lakehouse mutate
});
