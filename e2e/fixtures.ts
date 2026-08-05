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

/** The six flagship products, rendered as footer + mega-menu item links. */
export const FLAGSHIP_PRODUCTS = [
  'Atlas',
  'Bedrock',
  'Keystone',
  'Compass',
  'Sentinel',
  'Meridian',
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
 * Open the navbar Products mega-menu on desktop. The navbar is a Radix
 * NavigationMenu (`<nav aria-label="Navigation Menu">`); the Products trigger
 * is a `button` and the panel content surfaces as `link`s (Radix renders
 * NavigationMenuLink as role=link, not menuitem). Hover opens the panel with
 * the ~300ms close-delay; we wait for a known link to be visible before
 * returning the nav scope so callers can assert against it. Mobile behavior of
 * the mega-menu inside the framer-motion slide-out is covered separately in
 * navbar.spec.ts.
 */
export async function openProductsMegaMenu(page: Page) {
  // Resize to a safe desktop viewport so the desktop navbar (not the mobile
  // slide-out) is rendered.
  await page.setViewportSize({ width: 1280, height: 900 })
  const nav = page.getByRole('navigation', { name: 'Navigation Menu' })
  const trigger = nav.getByRole('button', { name: 'Products' })
  await trigger.hover()
  // Wait for the panel to mount + the Radix viewport to size before returning.
  await expect(nav.getByRole('link', { name: 'Core' })).toBeVisible()
  return nav
}