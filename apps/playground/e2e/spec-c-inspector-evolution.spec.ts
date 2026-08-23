import { expect, test } from '@playwright/test';
import { closeOverlay, openToolChip, resetViaUi, stepTo } from './helpers';

/**
 * Spec C — ticket 17 criteria 3 + 5: the inspector shows the lakehouse state
 * evolve across the full run, and the three read lenses surface the same
 * finding differently (Trino = table row, Compass = edges, Superset = chart).
 *
 * CAUTION (SPEC §6 carry-forward): the live store boots on `blankState()` whose
 * Gold is EMPTY until ~step 10 — the pre-run Superset dashboard renders empty
 * charts. This spec asserts the boot emptiness as reality and only reads
 * dashboard DATA after Gold exists. Resolving boot-from-seed is out of scope.
 */

const JADE = '#14A77A'; // anomalous viewed edge stroke

test('C — inspector evolves across 22 steps; three read lenses show the finding', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.react-flow')).toBeVisible();
  await resetViaUi(page);

  // The live-counts row sits beside the "shared in-browser state · live" label;
  // each block's textContent is `<label><value>` (e.g. "Gold edges4").
  const countsRow = page.locator(
    'xpath=//p[text()="shared in-browser state · live"]/following-sibling::div[1]',
  );
  const tabs = page.locator('[aria-label="inspector-state"]').locator('xpath=preceding-sibling::div[1]');
  const body = page.locator('[aria-label="inspector-state"]');

  // 1. Boot: blank lakehouse (documented carry-forward — NOT seeded data).
  await expect(countsRow).toHaveText(/Bronze0/);
  await expect(countsRow).toHaveText(/Gold nodes0/);
  await expect(countsRow).toHaveText(/Audit0/);

  // 2. Schema tab: drafted Product has no Sensitive field yet.
  await tabs.getByRole('button', { name: 'Schema' }).click();
  await expect(body).toContainText('id:string');
  await expect(body).toContainText('owner_group:string');
  await expect(body).not.toContainText('Sensitive:bool');

  // 3. DataGerry action → SchemaRegistry gains Sensitive: bool.
  await openToolChip(page, 'Blueprint');
  await page.getByRole('button', { name: 'Add Sensitive: bool' }).click();
  await expect(body).toContainText('Sensitive:bool');
  await closeOverlay(page);

  // 4. Step 7 — Bronze lands.
  await stepTo(page, 7);
  await expect(countsRow).toHaveText(/Bronze4/); // 2 products + 2 view-logs
  await tabs.getByRole('button', { name: 'Bronze', exact: true }).click();
  await expect(body).toContainText('ext_product · 2 rows');
  await expect(body).toContainText('view_logs · 2 rows');

  // 5. Step 10 — Gold conforms to the teaching graph.
  await stepTo(page, 10);
  await expect(countsRow).toHaveText(/Gold nodes5/);
  await expect(countsRow).toHaveText(/Gold edges4/);
  await tabs.getByRole('button', { name: 'Gold' }).click();
  await expect(body).toContainText('P-1042 product');
  await expect(body).toContainText('· sensitive');

  // 6. Step 14 — Atlas writes the audit entry.
  await stepTo(page, 14);
  await expect(countsRow).toHaveText(/Audit1/);
  await tabs.getByRole('button', { name: 'Audit' }).click();
  await expect(body).toContainText('OPA allowed Sensitive Product View Audit');

  // 7. Read lens 1 — Trino: the finding as an anomalous TABLE ROW (step 16 ran
  // via stepping; rows derive pre-finding).
  await stepTo(page, 16);
  await openToolChip(page, 'Overlook');
  const results = page.locator('[aria-label="query results"]');
  await expect(results).toBeVisible();
  await expect(results.locator('[aria-label="j.harper anomalous view of P-1042"]')).toBeVisible();
  await expect(results.locator('[aria-label="m.okafor view of P-1042"]')).toBeVisible();
  // Overlays never stack (store guard); the learner returns to the spine
  // before the climax so the ONE auto-open can fire.
  await closeOverlay(page);

  // 8. Read lens 2 — Compass auto-opens at step 19 (the ONE climax auto-open):
  // the finding as EDGES — jade anomalous viewed + dashed missing-memberof gap.
  await stepTo(page, 19);
  const dialog = page.locator('[role="dialog"][aria-label="Compass"]');
  await expect(dialog).toBeVisible(); // opened WITHOUT clicking the Compass chip
  await expect(dialog.locator('svg line[stroke-dasharray="4 4"]')).toHaveCount(1);
  await expect(dialog.locator(`svg line[stroke="${JADE}"]`)).toHaveCount(1);
  await expect(dialog.getByRole('list')).toContainText('j.harper viewed P-1042');
  await expect(dialog.getByRole('list')).toContainText('no memberof edge to G-SR');
  // Drill-into detail (canonical action): j.harper's "why".
  await dialog.locator('[aria-label="inspect j.harper"]').click();
  await expect(dialog.locator('[aria-label="compass node detail"]')).toContainText('no backing group membership');

  // 9. Run completes; audit reaches 3 entries.
  await stepTo(page, 22);
  await expect(countsRow).toHaveText(/Audit3/);
  await closeOverlay(page);

  // 10. Read lens 3 — Superset: the finding as a DASHBOARD (post-run only,
  // per the boot-empty-Gold caution above).
  await openToolChip(page, 'Superset');
  const bar = page.locator('section[aria-label="Products by exposure count"]');
  await expect(bar).toBeVisible();
  await expect(bar.getByRole('button', { name: /Drill into Payroll-NG/ })).toContainText('1 exposed · 2 views');
  const table = page.locator('section[aria-label="Users with anomalous views"]');
  await expect(table).toContainText('j.harper');
  await expect(table).toContainText('no backing membership');
  const donut = page.locator('section[aria-label="Views by source system"]');
  await expect(donut).toContainText('SQL Server Fleet');
  await expect(donut).toContainText('Active Directory');
  await expect(donut).toContainText('2 · 50%');
});
