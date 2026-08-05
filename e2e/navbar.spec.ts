import { expect, test } from '@playwright/test'

import { openProductsMegaMenu, PRODUCT_CATEGORIES } from './fixtures'

/**
 * Navbar (ticket 02) — sticky chrome with a Radix NavigationMenu Products
 * mega-menu (3-column, 5 categories, ~300ms close delay) on desktop and a
 * framer-motion slide-out on mobile. These specs stay at the user-visible
 * seam: the mega-menu category + flagship-product links resolve to
 * `/en/products#<slug>` anchors, the top-level Blog/About/Changelog/Contact
 * links resolve, the GitHub icon links to the configured org, and the mobile
 * hamburger reveals the navigation.
 *
 * Roles: the navbar is `<nav aria-label="Navigation Menu">`; the Products
 * trigger is a `button`; panel entries are `link`s (Radix NavigationMenuLink).
 */
test.describe('navbar', () => {
  test('Products mega-menu groups + flagship links resolve to /en/products anchors', async ({ page }) => {
    await page.goto('/en')
    const nav = await openProductsMegaMenu(page)

    // The five category headings are present as links.
    for (const cat of PRODUCT_CATEGORIES) {
      await expect(nav.getByRole('link', { name: cat })).toBeVisible()
    }

    // Spot-check a category anchor + a flagship-product anchor.
    await expect(nav.getByRole('link', { name: 'Core' }))
      .toHaveAttribute('href', '/en/products#core')
    await expect(nav.getByRole('link', { name: 'Atlas' }))
      .toHaveAttribute('href', '/en/products#atlas')
  })

  test('mega-menu stays open while moving toward content and closes on far pointer-leave', async ({ page }) => {
    await page.goto('/en')
    const nav = await openProductsMegaMenu(page)

    // Hover a panel link — the ~300ms close delay should keep the panel open
    // while the pointer is over content.
    const atlas = nav.getByRole('link', { name: 'Atlas' })
    await atlas.hover()
    await expect(atlas).toBeVisible()

    // Move the pointer well clear of the navbar + panel and wait past the
    // close delay; the panel should dismiss.
    await page.mouse.move(10, 880)
    await expect(nav.getByRole('link', { name: 'Atlas' })).toBeHidden()
  })

  test('Blog, About, Changelog, and Contact links resolve', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('link', { name: /^Blog$/i }).first()).toHaveAttribute('href', '/en/blog')
    await expect(page.getByRole('link', { name: /^About$/i }).first()).toHaveAttribute('href', '/en/about')
    await expect(page.getByRole('link', { name: /^Changelog$/i }).first()).toHaveAttribute('href', '/en/changelog')
    await expect(page.getByRole('link', { name: /^Contact$/i }).first()).toHaveAttribute('href', '/en/contact')
  })

  test('GitHub icon links to the configured org in a new tab', async ({ page }) => {
    await page.goto('/en')
    // The GitHub icon is an anchor with aria-label="GitHub". `.first()` keeps
    // this strict-mode-safe if the footer also renders a GitHub link.
    const gh = page.getByRole('link', { name: /^GitHub$/ }).first()
    await expect(gh).toBeVisible()
    await expect(gh).toHaveAttribute('href', /github\.com\/nanisoft/)
    await expect(gh).toHaveAttribute('target', '_blank')
  })

  test('mobile hamburger reveals the navigation with a Products group', async ({ page }) => {
    // Mobile viewport — below the lg (64rem / 1024px) navbar breakpoint.
    await page.setViewportSize({ width: 500, height: 900 })
    await page.goto('/en')

    // Open the mobile slide-out via the hamburger button.
    await page.getByRole('button', { name: 'Menu' }).click()
    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(mobileNav).toBeVisible()

    // Expand the Products accordion via its `<summary>` (Playwright's typed
    // `getByRole` doesn't include the `summary` role, so locate by tag). The
    // summary also carries a `▾` chevron, so a substring match is used.
    await mobileNav.locator('summary', { hasText: 'Products' }).click()
    await expect(mobileNav.getByRole('link', { name: 'Core' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Platform & Trust' })).toBeVisible()
  })
})