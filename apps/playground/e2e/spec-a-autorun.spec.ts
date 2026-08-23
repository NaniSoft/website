import { expect, test } from '@playwright/test';
import { makeConsoleCollector, readStore, resetViaUi } from './helpers';

/**
 * Spec A — ticket 17 criterion 1: a complete auto-run of the 22-step flagship
 * advances the spine through all six tools without errors and ends stopped at
 * step 22. No-vision: the run is observed through the Narrative text, the
 * Investigation phase band's computed done-color (teal), the visited tool
 * chips' border colors, and the live store (cursor/running). Console errors +
 * page errors are collected across the whole run and must be zero.
 */

const TEAL_DONE = 'rgb(42, 140, 151)'; // color.teal — done chips/bands

test('A — full auto-run: 22 steps, stops at the end, no console errors, spine shows the done state', async ({ page }) => {
  const collector = makeConsoleCollector(page);
  await page.goto('/');
  await expect(page.locator('.react-flow')).toBeVisible();
  await resetViaUi(page);

  await page.getByRole('button', { name: '▶ Run playbook' }).click();

  // Auto-run paces ~1.1s/step → ~25s for 22 steps; the store flips running=false
  // when it applies the last step (stop-at-end).
  await page.waitForFunction(
    () => {
      const hook = (window as unknown as {
        __playground?: { getState(): { state: { cursor: number }; running: boolean } };
      }).__playground;
      return !!hook && hook.getState().state.cursor === 22 && !hook.getState().running;
    },
    { timeout: 90_000 },
  );

  const store = await readStore(page);
  expect(store.cursor).toBe(22);
  expect(store.running).toBe(false);

  // "Without errors" — strict gate over the whole navigation + run.
  expect(collector.errors, `console errors: ${collector.errors.join(' | ')}`).toEqual([]);
  expect(collector.pageErrors, `page errors: ${collector.pageErrors.join(' | ')}`).toEqual([]);

  // Spine shows the done state: narrative reads step 22 / 22 in investigation.
  await expect(page.getByText(/step 22 \/ 22 · phase: investigation/)).toBeVisible();

  // The Investigation phase band is done (computed teal text).
  const band = page.locator('div', { hasText: /^Investigation$/ }).last();
  await expect(band).toBeVisible();
  await expect
    .poll(async () => band.evaluate((el) => getComputedStyle(el).color), { timeout: 5_000 })
    .toBe(TEAL_DONE);

  // Every path tool node was visited (done = teal border): Blueprint (DataGerry),
  // Trailhead (Airflow), Atlas, Overlook (Trino), Compass.
  for (const codename of ['Blueprint', 'Trailhead', 'Atlas', 'Overlook', 'Compass']) {
    const chip = page.getByRole('button', { name: `Open ${codename} mock` });
    await expect
      .poll(() => chip.evaluate((el) => getComputedStyle(el).borderColor), { timeout: 5_000 })
      .toBe(TEAL_DONE);
  }
});
