import { describe, expect, it } from 'vitest'
import { formatIsoDate } from '../lib/date'

describe('formatIsoDate', () => {
  it('normalises a frontmatter ISO date to YYYY-MM-DD', () => {
    expect(formatIsoDate('2026-08-27')).toBe('2026-08-27')
  })

  it('accepts a Date object', () => {
    expect(formatIsoDate(new Date('2026-08-28'))).toBe('2026-08-28')
  })

  it('truncates the time part of a datetime string', () => {
    expect(formatIsoDate('2026-09-01T14:30:00.000Z')).toBe('2026-09-01')
  })

  it('returns an empty string for an unparseable date', () => {
    expect(formatIsoDate('not-a-date')).toBe('')
  })
})
