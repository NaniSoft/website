import { expect, test } from '@playwright/test'

import { PRODUCT_CATEGORIES, SEED_BLOG_HEADLINES } from './fixtures'

/**
 * Pages — `/en/products`, `/en/blog`, `/en/about`, `/en/changelog` return 200
 * and render the agreed top-level content. The Changelog should show the
 * inaugural "Introducing Nanisoft" entry (ticket 06 seed) as the newest (and
 * first) entry.
 */
test.describe('marketing pages render', () => {
  test('/en/products lists the full suite with category + product anchors', async ({ page }) => {
    const res = await page.goto('/en/products')
    expect(res?.ok(), 'products responded with a non-OK status').toBeTruthy()
    await expect(page.getByRole('heading', { level: 1, name: /One platform, five surfaces/i })).toBeVisible()
    for (const cat of PRODUCT_CATEGORIES) {
      // exact: the inline detail sections render "<product> is part of <cat>"
      // h2s — a substring match would resolve to several headings.
      await expect(page.getByRole('heading', { name: cat, exact: true })).toBeVisible()
    }
    // Atlas (Core flagship) anchors within the page.
    await expect(page.locator('#atlas')).toBeVisible()
  })

  test('/en/products renders all 21 inline product detail sections', async ({ page }) => {
    await page.goto('/en/products')
    // One inline `#<slug>-detail` section per product, rendered through the
    // uniform ProductPageTemplate on the same page (no per-product routes).
    await expect(page.locator('[id$="-detail"]')).toHaveCount(21)
    // Each detail section exposes its product as an h1.
    await expect(page.getByRole('heading', { level: 1, name: 'Atlas' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Pathfinder' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Aegis' })).toBeVisible()
  })

  test('clicking a product card scrolls to its inline #<slug>-detail section', async ({ page }) => {
    await page.goto('/en/products')
    // The Atlas card is an anchor link to #atlas-detail (no route transition).
    await page.locator('#atlas').click()
    await expect(page).toHaveURL(/#atlas-detail$/)
    await expect(page.locator('#atlas-detail')).toBeVisible()
  })

  test('a shareable /en/products#<slug> deep-link lands below the sticky navbar', async ({ page }) => {
    await page.goto('/en/products#atlas')
    await expect(page.locator('#atlas')).toBeVisible()
    const nav = page.getByRole('navigation', { name: 'Navigation Menu' })
    const navBox = await nav.boundingBox()
    const targetBox = await page.locator('#atlas').boundingBox()
    expect(navBox).not.toBeNull()
    expect(targetBox).not.toBeNull()
    // The target's top sits at or below the navbar's bottom — the scroll-margin
    // (`--nextra-navbar-height`) cleared it from under the sticky navbar.
    expect(targetBox!.y).toBeGreaterThanOrEqual(navBox!.y + navBox!.height - 1)
  })

  test('/en/blog lists all four seed posts', async ({ page }) => {
    const res = await page.goto('/en/blog')
    expect(res?.ok(), 'blog responded with a non-OK status').toBeTruthy()
    await expect(page.getByRole('heading', { level: 1, name: /Notes from Nanisoft/i })).toBeVisible()
    for (const headline of SEED_BLOG_HEADLINES) {
      await expect(page.getByRole('heading', { name: headline })).toBeVisible()
    }
  })

  test('/en/about renders the minimal origin story', async ({ page }) => {
    const res = await page.goto('/en/about')
    expect(res?.ok(), 'about responded with a non-OK status').toBeTruthy()
    await expect(page.getByRole('heading', { level: 1, name: 'About' })).toBeVisible()
    await expect(page.getByText(/Nanisoft builds the cybersecurity tools/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /^changelog$/i }).first()).toHaveAttribute('href', '/en/changelog')
  })

  test('/en/changelog shows the inaugural entry as the newest', async ({ page }) => {
    const res = await page.goto('/en/changelog')
    expect(res?.ok(), 'changelog responded with a non-OK status').toBeTruthy()
    await expect(page.getByRole('heading', { level: 1, name: /What shipped/i })).toBeVisible()

    // The inaugural entry is the newest (and only) entry; its h2 sits above
    // every other entry. Assert that by checking the first h2 is "Introducing
    // Nanisoft".
    const firstH2 = page.getByRole('heading', { level: 2 }).first()
    await expect(firstH2).toHaveText(/Introducing Nanisoft/)

    // Title, author, and the framed date appear together on the entry.
    await expect(page.getByText(/Nanisoft Team\s*·\s*August 3, 2026/i)).toBeVisible()

    // The four agreed framing sections.
    for (const heading of ['The problem', 'The approach', 'The first chapter', 'More coming']) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    }
  })
})
