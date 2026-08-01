import { expect, test } from '@playwright/test'

/**
 * Smoke test — guards the app boots and the apex redirect works. Keep this
 * broad and content-agnostic so it survives copy/markdown changes. Add
 * feature-specific specs alongside this file as the app grows.
 */
test.describe('smoke', () => {
  test('apex "/" redirects to the English locale and renders', async ({ page }) => {
    const response = await page.goto('/')

    // next.config.ts redirects "/" -> "/en" (temporary, 307).
    await expect(page).toHaveURL(/\/en/)
    expect(response?.ok(), 'homepage responded with a non-OK status').toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
  })
})