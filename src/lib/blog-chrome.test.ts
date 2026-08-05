import type { BlogPost } from './blog'

import type { CategoryId } from '@/components/chrome/accents'

import { describe, expect, it } from 'vitest'

import { allBlogs } from './blog'
import {
  blogChrome,
  excerptFor,
  headingsFor,
  readingMinutesFor,
  tagsFor,
} from './blog-chrome'

// Chrome-only blog fields (tags, headings, reading time, excerpt) live here, not
// in `src/lib/blog.ts` — the SEO/data module and its existing tests stay
// untouched. This module is the single source for everything the blog *chrome*
// renders that is not page metadata. Every assertion is external behavior:
// every production post has a chrome entry, accents are valid category ids,
// and heading ids are unique within a post (so the sticky ToC links resolve).
describe('blog-chrome', () => {
  it('provides a chrome entry for every production post', () => {
    for (const post of allBlogs) {
      const chrome = blogChrome[post.slug]
      expect(chrome, `chrome for "${post.slug}"`).toBeDefined()
      expect(chrome.tags.length).toBeGreaterThan(0)
      expect(chrome.headings.length).toBeGreaterThanOrEqual(2)
      expect(chrome.readingMinutes).toBeGreaterThan(0)
      expect(chrome.excerpt.length).toBeGreaterThan(0)
    }
  })

  it('every tag carries a valid category accent id', () => {
    const valid: CategoryId[] = [
      'core',
      'ingestion',
      'query-traversal',
      'interfaces',
      'platform-trust',
    ]
    for (const post of allBlogs) {
      for (const tag of blogChrome[post.slug].tags) {
        expect(valid, `tag "${tag.label}" on "${post.slug}"`).toContain(tag.category)
      }
    }
  })

  it('heading ids are unique within each post', () => {
    for (const post of allBlogs) {
      const ids = blogChrome[post.slug].headings.map(h => h.id)
      expect(new Set(ids).size, `headings on "${post.slug}"`).toBe(ids.length)
    }
  })

  it('accessors return the same record fields as the direct lookup', () => {
    const post: BlogPost = allBlogs[0]
    expect(tagsFor(post.slug)).toBe(blogChrome[post.slug].tags)
    expect(headingsFor(post.slug)).toBe(blogChrome[post.slug].headings)
    expect(readingMinutesFor(post.slug)).toBe(blogChrome[post.slug].readingMinutes)
    expect(excerptFor(post.slug)).toBe(blogChrome[post.slug].excerpt)
  })
})
