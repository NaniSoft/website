import { expect, test } from '@playwright/test';
// Proves the pure core is importable from the spec process (workspace TS source
// resolved through the pnpm symlink) — the one-code-path comparison in Spec B
// depends on this.
import { SENSITIVE_PRODUCT_VIEW_AUDIT } from '@nanisoft/architecture';
import { readStore } from './helpers';

test('smoke: dev server serves the playground with a live store hook', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /nanisoft playground/i })).toBeVisible();
  // The spine (client-only React Flow canvas) mounts.
  await expect(page.locator('.react-flow')).toBeVisible();
  // Dev-only store hook present; fresh boot = blank state at cursor 0.
  const store = await readStore(page);
  expect(store.cursor).toBe(0);
  expect(store.running).toBe(false);
});

test('smoke: pure core imports into the spec process (22 flagship steps)', () => {
  expect(SENSITIVE_PRODUCT_VIEW_AUDIT).toHaveLength(22);
});
