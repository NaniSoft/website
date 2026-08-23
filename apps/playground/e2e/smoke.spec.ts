import { expect, test, type Page } from '@playwright/test';
// Proves the pure core is importable from the spec process (workspace TS source
// resolved through the pnpm symlink) — the one-code-path comparison in Spec B
// depends on this.
import { SENSITIVE_PRODUCT_VIEW_AUDIT } from '@nanisoft/architecture';
import { color } from '@nanisoft/identity';
import { readStore, rgbOf } from './helpers';

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

// ── Mode-aware theme (shared contract with the landing) ──────────────────────
// The storage key + <html data-theme> reflection mirror apps/landing's
// ThemeProvider exactly; these specs pin the observable half of that contract:
// default resolution, toggle → surfaces flip, reload persistence, stored-mode
// boot (what a landing-set mode looks like here), and OS-preference fallback.

const htmlLoc = (page: Page) => page.locator('html');

test.describe('theme', () => {
  test('defaults to light on a light-system browser and toggles dark via chrome', async ({ page }) => {
    await page.goto('/');
    await expect(htmlLoc(page)).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', rgbOf(color.bone));
    // A real elevated surface flips too (spine card), not just the body.
    await expect(page.locator('.spine-card')).toHaveCSS('background-color', rgbOf(color.boneElev));

    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await expect(htmlLoc(page)).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', rgbOf(color.petrol));
    await expect(page.locator('.spine-card')).toHaveCSS('background-color', rgbOf(color.petrolMid));
  });

  test('reload persists the toggled mode', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Dark', exact: true }).click();
    await expect(htmlLoc(page)).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(htmlLoc(page)).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', rgbOf(color.petrol));
    // Back to light still works after the round-trip.
    await page.getByRole('button', { name: 'Light', exact: true }).click();
    await expect(htmlLoc(page)).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', rgbOf(color.bone));
  });

  test('a pre-stored shared key boots dark without any toggle (landing ↔ playground parity)', async ({ page }) => {
    // Simulates the landing app having written its mode: same localStorage key,
    // read by the layout's inline script before first paint.
    await page.addInitScript(() => localStorage.setItem('nanisoft-theme', 'dark'));
    await page.goto('/');
    await expect(htmlLoc(page)).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', rgbOf(color.petrol));
  });

  test('system preference is honored when nothing is stored', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await expect(htmlLoc(page)).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body')).toHaveCSS('background-color', rgbOf(color.petrol));

    // Live OS drift while mode='system' re-resolves (ThemeSync reconciles).
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(htmlLoc(page)).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', rgbOf(color.bone));
  });
});
