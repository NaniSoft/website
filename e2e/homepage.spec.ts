import { expect, test } from '@playwright/test'

import {
  INDUSTRIES,
  SEED_BLOG_HEADLINES,
} from './fixtures'

/**
 * Homepage composition (ticket 17) — external-behavior e2e against
 * `pnpm start` (port 7000 in CI). Asserts the homepage renders the hero plus
 * every section composed from `src/components/HomeSections` and that the
 * primary CTA links to the Products page. Stays at the user-visible seam
 * (headings, anchor links, primary CTA href) — not markup.
 */
test.describe('homepage composition', () => {
  test('hero carries the primary CTA to /en/products', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const cta = page.getByRole('link', { name: /Explore the Platform/i }).first()
    await expect(cta).toBeVisible()
    await expect(cta).toHaveAttribute('href', '/en/products')
  })

  test('trust strip renders the five industry-segment badges', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText('Built for teams in environments like these', { exact: false })).toBeVisible()
    for (const industry of INDUSTRIES) {
      await expect(page.getByText(industry, { exact: true }).first()).toBeVisible()
    }
  })

  test('products grid shows the open category with anchor links into /en/products', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText(/products, one graph/i)).toBeVisible()
    // Scope to the products grid: anchor links start with `/en/products#`.
    // The hero "flagship pill" is a non-link span, but if it ever became a
    // link we'd want this assertion to stay unambiguous.
    const atlas = page.locator('a[href="/en/products#atlas"]').first()
    await expect(atlas).toBeVisible()
    await expect(atlas).toHaveAttribute('href', '/en/products#atlas')
  })

  test('services section renders all four service cards', async ({ page }) => {
    await page.goto('/en')
    for (const service of ['Assessment', 'Implementation', 'Managed Operation', 'Open Source Support']) {
      await expect(page.getByRole('heading', { name: service })).toBeVisible()
    }
  })

  test('get in touch renders the heading + the contact form', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('heading', { name: /attack paths/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible()
  })

  test('recommended reading lists all four seed blog posts', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText('Recommended reading')).toBeVisible()
    for (const headline of SEED_BLOG_HEADLINES) {
      await expect(page.getByRole('heading', { name: headline })).toBeVisible()
    }
  })
})
