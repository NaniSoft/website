import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E config.
 *
 * `webServer` boots the app on demand and waits for the port to respond.
 * Locally it uses the dev server (`pnpm dev`, port 8000). In CI it uses the
 * production build (`pnpm start`, port 7000) — `next dev` triggers the
 * OpenNext-for-Cloudflare dev init (`initOpenNextCloudflareForDev` in
 * next.config.ts) which needs wrangler bindings and is unsuitable for a
 * headless CI run. The CI job builds before running `pnpm e2e`.
 */
const isCI = Boolean(process.env.CI)
const port = isCI ? 7000 : 8000
const command = isCI ? 'pnpm start' : 'pnpm dev'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command,
    url: `http://localhost:${port}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
