import { expect, test } from '@playwright/test'

import { EN_PATH } from './fixtures'

/**
 * Apex `/` → `/en` redirect — held by a `redirects()` rule in `next.config.ts`
 * (OpenNext-compatible; no Nextra locale proxy). The /en must continue to
 * resolve even after new pages land.
 */
test.describe('apex redirect', () => {
  test('GET / redirects to /en', async ({ page }) => {
    const res = await page.goto('/')
    await expect(page).toHaveURL(EN_PATH)
    expect(res?.ok(), 'redirect target responded with a non-OK status').toBeTruthy()
  })
})
