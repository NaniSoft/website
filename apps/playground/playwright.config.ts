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
 * (stripped in production builds).
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
    // Desktop-class viewport: the spine graph is authored for desktop widths
    // (React Flow's minZoom clamp means it needs a ~1100px+ spine card to fit,
    // i.e. a ≳1540px window beside the inspector rail). The default 1280x720
    // clips the leftmost nodes half-out of the canvas.
    viewport: { width: 1680, height: 900 },
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
