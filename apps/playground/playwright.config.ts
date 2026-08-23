import { defineConfig } from '@playwright/test';

/**
 * Playwright config for the playground e2e suite (ticket 17 close-out).
 *
 * App-level (not root): only the playground has e2e scope, `apps/landing` is a
 * separate surface, and this matches the repo's per-package test-config pattern
 * (vitest configs also live per package). Invoke via
 * `pnpm --filter @nanisoft/playground test:e2e`.
 *
 * The webServer runs the DEV server on :3001 — required, because the specs'
 * state-assertion channel is the dev-only `window.__playground` store hook
 * (stripped in production builds). See the design doc:
 * `docs/superpowers/specs/2026-08-23-flagship-verification-design.md`.
 *
 * Specs are no-vision: they assert via accessibility roles/text, DOM/SVG
 * attributes, and live store state — never screenshots.
 */
export default defineConfig({
  testDir: './e2e',
  // Single shared dev server + single-instance in-browser store: serial it is.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
