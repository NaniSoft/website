import { expect, type Page } from '@playwright/test'

/**
 * Nanisoft marketing site — e2e shared fixtures.
 *
 * `expect(...)` from `@playwright/test` matches our vitest-style usage and is
 * the supported form (the `expect` package used in vitest unit tests is not
 * wired into Playwright). Keep helpers + the agreed string constants here —
 * single source for selectors and the small bits of shared behavior / data
 * the specs reach for. Keep them in lockstep with the typed data modules
 * (`src/lib/products.ts`, `src/lib/blog.ts`, `src/lib/site-config.ts`).
 */

/** Apex → /en redirect path. `next.config.ts` adds the redirect rule. */
export const EN_PATH = /\/en/

/** Agreed UI copy lists — sourced from the data modules and HomeSections. */
export const PRODUCT_CATEGORIES = [
  'Core',
  'Ingestion',
  'Query & Traversal',
  'Interfaces',
  'Platform & Trust',
] as const

/** All four seed blog post titles (reverse-chronological). */
export const SEED_BLOG_HEADLINES = [
  'Why we built Nanisoft',
  'Every path into your systems, mapped',
  'The case for one suite over a stack of point tools',
  'What trust means in a security platform',
] as const

/** Industry-segment badges rendered by the homepage trust strip. */
export const INDUSTRIES = [
  'Financial Services',
  'Healthcare',
  'Critical Infrastructure',
  'Government',
  'Retail',
] as const

/**
 * Open the navbar Products mega-menu on desktop. Mobile behavior of the mega-
 * menu inside Nextra's slide-out is a sharpen-during-implementation item (per
 * the spec) — these specs run on desktop Chrome only.
 */
export async function openProductsMegaMenu(page: Page) {
  // resize to a safe desktop viewport to avoid the Nextra mobile slide-out
  await page.setViewportSize({ width: 1280, height: 900 })
  const trigger = page.getByRole('button', { name: /^Products/ }).first()
  await trigger.click()
  await expect(page.getByRole('menu')).toBeVisible()
}
