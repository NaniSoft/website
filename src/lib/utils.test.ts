import { describe, expect, it } from 'vitest'
import { cn } from './utils'

// Exercises the Vitest + React Testing Library + ts-reset toolchain so the
// pipeline has a real spec to run (and proves `@`-less relative imports,
// jsdom env, and jest-dom matchers all resolve). Replace/extend as the
// app gains pure logic worth covering.
describe('cn', () => {
  it('merges class names and dedupes conflicting Tailwind utilities', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('handles conditional and falsy inputs', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
  })

  it('returns an empty string for no useful input', () => {
    expect(cn('', false, null, undefined)).toBe('')
  })
})
