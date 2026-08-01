import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))

// Vitest is configured for jsdom + React Testing Library.
//
// - `@vitejs/plugin-react` gives JSX/TSX the same transform the app uses.
// - `globals: false` favours explicit `import { describe, it, expect } from
//   'vitest'` over polluting the global namespace (no tsconfig `types`
//   change needed, and antfu stays happy).
// - `passWithNoTests` lets `pnpm test` and the pre-commit gate succeed before
//   any spec files exist, so adding the tooling never blocks the team.
// - The `@` alias mirrors tsconfig `paths` so specs import app code the same
//   way the app imports itself.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    passWithNoTests: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'public', 'dist', 'build'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.{ts,tsx}',
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/types/**',
        'src/assets/**',
        'src/content/**',
        'src/i18n/**',
      ],
    },
  },
})
