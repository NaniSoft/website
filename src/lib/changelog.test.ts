import type { ChangelogEntry } from './changelog'

import { describe, expect, it } from 'vitest'
import { allChangelog, inauguralEntry } from './changelog'

// External-behavior tests at the src/lib seam. The changelog is a typed
// reverse-chronological array (mirrors the blog data-module pattern) so the
// list stays sortable and /en/changelog isn't per-entry MDX sprawl.

describe('changelog data module', () => {
  it('lists entries reverse-chronologically (newest first)', () => {
    const dates = allChangelog.map(e => Date.parse(e.date))
    const sorted = [...dates].sort((a, b) => b - a)
    expect(dates).toEqual(sorted)
  })

  it('has at least the inaugural entry', () => {
    expect(allChangelog.length).toBeGreaterThanOrEqual(1)
  })
})

describe('inaugural entry', () => {
  it('is present with the agreed title, date, and author', () => {
    expect(inauguralEntry).toBeDefined()
    expect(inauguralEntry.title).toBe('Introducing Nanisoft')
    expect(inauguralEntry.date).toBe('2026-08-03')
    expect(inauguralEntry.author).toBe('Nanisoft Team')
  })

  it('has a non-empty summary', () => {
    expect(inauguralEntry.summary.length).toBeGreaterThan(0)
  })

  it('has the four agreed framing sections in order', () => {
    expect(inauguralEntry.body.map(s => s.heading)).toEqual([
      'The problem',
      'The approach',
      'The first chapter',
      'More coming',
    ])
  })

  it('every framing section has non-empty text', () => {
    for (const section of inauguralEntry.body) {
      expect(section.text.length, section.heading).toBeGreaterThan(0)
    }
  })

  it('is the newest entry', () => {
    const newest: ChangelogEntry = allChangelog[0]!
    expect(newest.title).toBe('Introducing Nanisoft')
  })
})
