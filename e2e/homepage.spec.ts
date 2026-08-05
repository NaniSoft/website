import { expect, test } from '@playwright/test'

import {
  INDUSTRIES,
  PRODUCT_CATEGORIES,
} from './fixtures'

/**
 * Homepage composition (impl ticket 03) — external-behavior e2e against
 * `pnpm start` (port 7000 in CI). Covers the tabs-over-split hero (variant A),
 * the trust band, and the ecosystem, plus the partial section order
 * Hero → TrustBand → Ecosystem. Stays at the user-visible seam (headings, tab
 * roles, anchor hrefs, the active-tab highlight) — not markup. The remaining
 * below-fold sections (Services / GetInTouch / RecommendedReading) stay
 * composed from `HomeSections` until impl ticket 04 restyles them; the contact
 * form is covered by `contact.spec.ts`.
 */
test.describe('homepage composition', () => {
  test('hero renders a tab per category with the gateway (Query & Traversal) active by default', async ({ page }) => {
    await page.goto('/en')
    const tablist = page.getByRole('tablist', { name: 'Product categories' })
    for (const name of PRODUCT_CATEGORIES) {
      await expect(tablist.getByRole('tab', { name })).toBeVisible()
    }
    // Query & Traversal is the pinned gateway — the default active tab.
    const gateway = tablist.getByRole('tab', { name: 'Query & Traversal' })
    await expect(gateway).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { level: 1, name: 'Traverse the graph in milliseconds' })).toBeVisible()
  })

  test('the active tab carries the accent dot and a bottom-border highlight', async ({ page }) => {
    await page.goto('/en')
    const gateway = page.getByRole('tab', { name: 'Query & Traversal' })
    // The accent dot is non-transparent on the active tab.
    const dot = gateway.locator('span').first()
    await expect(dot).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    // The bottom-border highlight is non-transparent on the active tab...
    await expect(gateway).not.toHaveCSS('border-bottom-color', 'rgba(0, 0, 0, 0)')
    // ...and transparent on an inactive tab.
    const core = page.getByRole('tab', { name: 'Core' })
    await expect(core).toHaveAttribute('aria-selected', 'false')
    await expect(core).toHaveCSS('border-bottom-color', 'rgba(0, 0, 0, 0)')
  })

  test('switching tabs cross-fades the hero panel to the new category', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('heading', { level: 1, name: 'Traverse the graph in milliseconds' })).toBeVisible()
    await page.getByRole('tab', { name: 'Core' }).click()
    // The new heading fades in; the old one is gone (AnimatePresence mode="wait").
    await expect(page.getByRole('heading', { level: 1, name: 'Map every path into your systems' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Traverse the graph in milliseconds' })).toHaveCount(0)
    // Core is now the active tab.
    await expect(page.getByRole('tab', { name: 'Core' })).toHaveAttribute('aria-selected', 'true')
  })

  test('the gateway hero carries a primary and a secondary CTA into /en/products', async ({ page }) => {
    await page.goto('/en')
    const primary = page.getByRole('link', { name: 'Explore Pathfinder' })
    const secondary = page.getByRole('link', { name: 'View all products' })
    await expect(primary).toBeVisible()
    await expect(secondary).toBeVisible()
    await expect(primary).toHaveAttribute('href', '/en/products#query-traversal')
    await expect(secondary).toHaveAttribute('href', '/en/products#query-traversal')
  })

  test('trust band renders the ten industry-segment badges', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText('Built for teams in environments like these', { exact: false })).toBeVisible()
    for (const industry of INDUSTRIES) {
      await expect(page.getByText(industry, { exact: true }).first()).toBeVisible()
    }
  })

  test('ecosystem renders five collapsible groups open by default with anchor links into /en/products', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('heading', { level: 2, name: 'One suite where point tools leave seams' })).toBeVisible()
    const groups = page.locator('section').filter({ hasText: 'One suite where point tools leave seams' }).locator('details')
    await expect(groups).toHaveCount(5)
    // All five are open by default.
    for (const group of await groups.all()) {
      await expect(group).toHaveAttribute('open', '')
    }
    // Each category name is rendered as a summary.
    for (const name of PRODUCT_CATEGORIES) {
      await expect(groups.filter({ hasText: name }).first()).toBeVisible()
    }
    // An open group's product grid surfaces anchor links into /en/products.
    const atlas = page.locator('a[href="/en/products#atlas"]').first()
    await expect(atlas).toBeVisible()
    await expect(atlas).toHaveAttribute('href', '/en/products#atlas')
  })

  test('ecosystem groups collapse on toggle', async ({ page }) => {
    await page.goto('/en')
    const groups = page.locator('section').filter({ hasText: 'One suite where point tools leave seams' }).locator('details')
    const core = groups.filter({ hasText: 'Core' }).first()
    await expect(core).toHaveAttribute('open', '')
    // Atlas is visible while open.
    const atlas = core.locator('a[href="/en/products#atlas"]')
    await expect(atlas).toBeVisible()
    await core.locator('summary').click()
    await expect(core).not.toHaveAttribute('open', '')
    await expect(atlas).toBeHidden()
  })

  test('renders the hero, trust band, and ecosystem in order', async ({ page }) => {
    await page.goto('/en')
    const hero = page.getByRole('heading', { level: 1 }).first()
    const trust = page.getByText('Built for teams in environments like these', { exact: false })
    const ecosystem = page.getByRole('heading', { level: 2, name: 'One suite where point tools leave seams' })
    await expect(hero).toBeVisible()
    await expect(trust).toBeVisible()
    await expect(ecosystem).toBeVisible()
    const heroY = await hero.boundingBox().then(b => b?.y ?? 0)
    const trustY = await trust.boundingBox().then(b => b?.y ?? 0)
    const ecoY = await ecosystem.boundingBox().then(b => b?.y ?? 0)
    expect(heroY).toBeLessThan(trustY)
    expect(trustY).toBeLessThan(ecoY)
  })
})
