import { defineConfig } from '@playwright/test';

/**
 * Landing overflow-check project (responsiveness sweep). One chromium project
 * against `next dev` on :3000 running a single spec, `e2e/overflow.spec.ts`,
 * that walks the plan's viewport matrix and asserts the page-level scroll law.
 * Layout-law checks only — the functional test surface stays the vitest suite
 * in `tests/`. Invoke via `pnpm --filter @nanisoft/landing test:overflow`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
