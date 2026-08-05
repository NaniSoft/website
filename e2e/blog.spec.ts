import { expect, test } from '@playwright/test'

import { SEED_BLOG_HEADLINES } from './fixtures'

/**
 * Blog editorial chrome (impl ticket 06) — external-behavior e2e against
 * `pnpm dev` (port 8000 locally, `pnpm start` on 7000 in CI). Covers the two
 * blog surfaces:
 *
 *  - `/en/blog` — the editorial index: one featured post (the newest) plus a
 *    uniform stack of the remaining three, every post linking to its page.
 *  - `/en/blog/<slug>` — the post page: a sticky sidebar table-of-contents
 *    (`PostTOC`), the tag list (`TagList`), and the newsletter placeholder, with
 *    the post's section headings navigable from the ToC.
 *
 * Stays at the user-visible seam (headings, link hrefs, the ToC nav, the tag
 * pills' accent dots, the no-op newsletter form) — not markup. The shared chrome
 * primitives (`PostTOC`, `TagList`, `NewsletterPlaceholder`) are also covered by
 * their component tests; this is the integration seam.
 */

const FEATURED_SLUG = 'why-we-built-nanisoft'
const FEATURED_TITLE = 'Why we built Nanisoft'
// Tags authored for the featured post in src/lib/blog-chrome.ts.
const FEATURED_TAGS = ['Origin', 'Suite']
// ToC headings authored for the featured post (match the <h2 id="..."> in its MDX).
const FEATURED_TOC = [
  { id: 'the-gap', label: 'The gap' },
  { id: 'the-answer', label: 'The answer' },
  { id: 'the-first-chapter', label: 'The first chapter' },
]

test.describe('blog index (editorial)', () => {
  test('renders a featured post plus a uniform stack of all four posts', async ({ page }) => {
    const res = await page.goto('/en/blog')
    expect(res?.ok(), 'blog responded with a non-OK status').toBeTruthy()

    await expect(page.getByRole('heading', { level: 1, name: /Notes from Nanisoft/i })).toBeVisible()

    // The newest post is featured (an h2 with a "Featured" eyebrow); the other
    // three render as a uniform stacked list (h3s). All four headlines appear.
    await expect(page.getByText('Featured', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: FEATURED_TITLE })).toBeVisible()
    for (const headline of SEED_BLOG_HEADLINES) {
      await expect(page.getByRole('heading', { name: headline })).toBeVisible()
    }
    // Exactly three stacked (non-featured) posts — h3 level, each linking to its
    // page (scoped so the newsletter primitive's own h3 does not inflate the
    // count).
    const stackedHeadings = page.getByRole('heading', { level: 3 }).filter({
      has: page.locator('a[href^="/en/blog/"]'),
    })
    await expect(stackedHeadings).toHaveCount(3)

    // The blog surface closes with the newsletter placeholder (US 38).
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible()
  })

  test('every post card links to its /en/blog/<slug> page', async ({ page }) => {
    await page.goto('/en/blog')
    const featuredLink = page.getByRole('heading', { level: 2, name: FEATURED_TITLE }).locator('a')
    await expect(featuredLink).toHaveAttribute('href', `/en/blog/${FEATURED_SLUG}`)
    for (const slug of ['every-path-mapped', 'one-suite-over-point-tools', 'what-trust-means']) {
      // The stacked post titles are h3 links to /en/blog/<slug>.
      const link = page.locator(`h3 a[href="/en/blog/${slug}"]`)
      await expect(link).toBeVisible()
    }
  })
})

test.describe('blog post page', () => {
  test('renders a sticky sidebar table-of-contents with one link per section', async ({ page }) => {
    await page.goto(`/en/blog/${FEATURED_SLUG}`)
    await expect(page.getByRole('heading', { level: 1, name: FEATURED_TITLE })).toBeVisible()

    const toc = page.getByRole('navigation', { name: 'Table of contents' })
    await expect(toc).toBeVisible()
    for (const h of FEATURED_TOC) {
      await expect(toc.getByRole('link', { name: h.label })).toHaveAttribute('href', `#${h.id}`)
    }
    // Each ToC link resolves to a real section heading in the body.
    for (const h of FEATURED_TOC) {
      await expect(page.getByRole('heading', { level: 2, name: h.label })).toHaveAttribute('id', h.id)
    }
  })

  test('ToC links scroll to their section (anchor resolves, not a route change)', async ({ page }) => {
    await page.goto(`/en/blog/${FEATURED_SLUG}`)
    const toc = page.getByRole('navigation', { name: 'Table of contents' })
    await toc.getByRole('link', { name: 'The answer' }).click()
    await expect(page).toHaveURL(new RegExp(`#${FEATURED_TOC[1].id}$`))
    await expect(page.locator(`#${FEATURED_TOC[1].id}`)).toBeVisible()
  })

  test('renders the tag list with accent dots', async ({ page }) => {
    await page.goto(`/en/blog/${FEATURED_SLUG}`)
    for (const label of FEATURED_TAGS) {
      await expect(page.getByText(label, { exact: true })).toBeVisible()
    }
    // The dots carry the category accent data attribute (the dot is the
    // accent, the label stays ink — the design rule).
    const dots = page.locator('[data-accent]')
    expect(await dots.count()).toBeGreaterThanOrEqual(FEATURED_TAGS.length)
  })

  test('renders the no-op newsletter placeholder', async ({ page }) => {
    await page.goto(`/en/blog/${FEATURED_SLUG}`)
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible()
    const button = page.getByRole('button', { name: 'Subscribe' })
    await expect(button).toBeVisible()
    await expect(button).toBeDisabled()
    await expect(page.locator('[data-newsletter-form]')).toBeVisible()
  })
})