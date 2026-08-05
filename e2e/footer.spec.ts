import { expect, test } from '@playwright/test'

import { FLAGSHIP_PRODUCTS } from './fixtures'

/**
 * Footer (ticket 02) — 4-column site footer with flagship product links,
 * Resources + Company groups, and configured social icons. Unconfigured
 * socials are omitted (omit-rather-than-break). On mobile the link columns
 * collapse into `<details>`/`<summary>` accordions.
 *
 * Runs at desktop width by default (Playwright's default viewport) so the
 * `FooterColumn` client component forces the `<details>` open and the links
 * are in the accessibility tree. The last test drops to a mobile viewport to
 * assert the accordion collapse/expand behavior.
 */
test.describe('footer', () => {
  test('flagship product links resolve to /en/products anchors', async ({ page }) => {
    await page.goto('/en')
    const footer = page.locator('footer')
    for (const name of FLAGSHIP_PRODUCTS) {
      await expect(footer.getByRole('link', { name: new RegExp(`^${name}$`) }).first())
        .toHaveAttribute('href', new RegExp(`/en/products#${name.toLowerCase()}`))
    }
  })

  test('Resources + Company groups resolve and Press Kit is omitted when unset', async ({ page }) => {
    await page.goto('/en')
    const footer = page.locator('footer')
    // Resources: Documentation, Blog, Changelog.
    await expect(footer.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', '/en/docs')
    await expect(footer.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/en/blog')
    await expect(footer.getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', '/en/changelog')
    // Company: About, Contact.
    await expect(footer.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/en/about')
    await expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/en/contact')
    // Press Kit is omitted when its env var is empty (the default in this build).
    await expect(footer.getByRole('link', { name: 'Press Kit' })).toHaveCount(0)
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

  test('mobile: link columns collapse into accordions that expand on tap', async ({ page }) => {
    // Mobile viewport — below the lg (64rem / 1024px) footer breakpoint.
    await page.setViewportSize({ width: 500, height: 900 })
    await page.goto('/en')

    const footer = page.locator('footer')
    // On mobile the Products column starts collapsed, so the Atlas link is
    // not in the accessibility tree (closed <details> content is excluded).
    const atlas = footer.getByRole('link', { name: 'Atlas' })
    await expect(atlas).toHaveCount(0)

    // Expand the Products accordion via its `<summary>` (Playwright's typed
    // `getByRole` doesn't include the `summary` role, so locate by tag). Substring
    // match — the summary also carries a `▾` chevron, so an anchored `^Products$`
    // regex would miss it; among the three footer summaries only this one contains
    // "Products".
    await footer.locator('summary', { hasText: 'Products' }).click()
    await expect(footer.getByRole('link', { name: 'Atlas' })).toBeVisible()
  })
})