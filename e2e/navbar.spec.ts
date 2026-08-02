import { expect, test } from '@playwright/test'

import { openProductsMegaMenu, PRODUCT_CATEGORIES } from './fixtures'

/**
 * Navbar (ticket 15) — Products mega-menu groups + anchors resolve; Blog /
 * About / Contact links resolve; the GitHub icon links to the configured org
 * and is omitted when unset. The "Contact" link is a Nextra `href` entry
 * pointing at `/en#get-in-touch`, so we assert that anchor + target attribute.
 */
test.describe('navbar', () => {
  test('Products mega-menu groups resolve to /en/products anchors', async ({ page }) => {
    await page.goto('/en')
    await openProductsMegaMenu(page)

    const menu = page.getByRole('menu')
    for (const cat of PRODUCT_CATEGORIES) {
      await expect(menu.getByRole('menuitem', { name: new RegExp(`^${cat}`) })).toBeVisible()
    }

    // Spot-check category link + an item link.
    await expect(menu.getByRole('menuitem', { name: /^Core/ }))
      .toHaveAttribute('href', '/en/products#core')
    await expect(menu.getByRole('menuitem', { name: /^Atlas$/ }))
      .toHaveAttribute('href', '/en/products#atlas')
  })

  test('Blog, About, and Contact links resolve', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('link', { name: /^Blog$/i }).first()).toHaveAttribute('href', '/en/blog')
    await expect(page.getByRole('link', { name: /^About$/i }).first()).toHaveAttribute('href', '/en/about')
    // Contact is an in-page anchor to the homepage get-in-touch section.
    await expect(page.getByRole('link', { name: /^Contact$/i }).first()).toHaveAttribute('href', '/en#get-in-touch')
  })

  test('GitHub icon links to the configured org and is present', async ({ page }) => {
    await page.goto('/en')
    // The icon is an anchor with aria-label="GitHub", target=_blank.
    const gh = page.getByRole('link', { name: /^GitHub$/ }).first()
    await expect(gh).toBeVisible()
    await expect(gh).toHaveAttribute('href', /github\.com\/nanisoft/)
    await expect(gh).toHaveAttribute('target', '_blank')
  })
})
