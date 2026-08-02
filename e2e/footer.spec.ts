import { expect, test } from '@playwright/test'

/**
 * Footer (ticket 16) — flagship product links, Resources (Press Kit), Company
 * (About / Blog / Changelog), and social icons all resolve. Footer social
 * icons that are not configured should be absent (next-ticket notes carry the
 * omit-rather-than-break rule, so we assert the GitHub icon is present and
 * the unset ones are absent when their env var is empty).
 */
test.describe('footer', () => {
  test('flagship product links resolve to /en/products anchors', async ({ page }) => {
    await page.goto('/en')
    // Footer lists the six flagship products + the three Company links.
    for (const name of ['Atlas', 'Bedrock', 'Keystone', 'Compass', 'Sentinel', 'Meridian']) {
      await expect(page.locator('footer').getByRole('link', { name: new RegExp(`^${name}$`) }).first())
        .toHaveAttribute('href', new RegExp(`/en/products#${name.toLowerCase()}`))
    }
  })

  test('Company group links to About, Blog, and Changelog', async ({ page }) => {
    await page.goto('/en')
    const footer = page.locator('footer')
    await expect(footer.getByRole('link', { name: /^About$/ })).toHaveAttribute('href', '/en/about')
    await expect(footer.getByRole('link', { name: /^Blog$/ })).toHaveAttribute('href', '/en/blog')
    await expect(footer.getByRole('link', { name: /^Changelog$/ })).toHaveAttribute('href', '/en/changelog')
  })

  test('configured social icons are present, unconfigured ones are omitted', async ({ page }) => {
    await page.goto('/en')
    const footer = page.locator('footer')
    // GitHub always configured (see src/lib/site-config.ts).
    await expect(footer.getByRole('link', { name: 'GitHub' })).toBeVisible()
    // The other three are omitted when their env var is unset (the default in
    // this build), so they should NOT be in the footer.
    await expect(footer.getByRole('link', { name: 'LinkedIn' })).toHaveCount(0)
    await expect(footer.getByRole('link', { name: 'Discord' })).toHaveCount(0)
    await expect(footer.getByRole('link', { name: 'YouTube' })).toHaveCount(0)
  })
})
