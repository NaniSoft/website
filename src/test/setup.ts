import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
// Global test setup — runs before every Vitest test file.
//
// jest-dom's `/vitest` entry auto-extends Vitest's `expect` with DOM matchers
// (toBeInTheDocument, toHaveValue, ...). ts-reset is re-imported here so the
// test program sees the tightened built-in types too (it's ambient, so
// importing twice is a no-op).
import '@testing-library/jest-dom/vitest'
import '@total-typescript/ts-reset'

// Unmount React trees between tests so the jsdom document stays clean and
// tests can't leak state into each other.
afterEach(() => {
  cleanup()
})
