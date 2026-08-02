import type { BlogPost } from './blog'

import { describe, expect, it } from 'vitest'
import {
  allBlogs,

  postUrl,
  SEO_DESC_MAX,
  SEO_DESC_MIN,
  SEO_TITLE_MAX,
  SEO_TITLE_MIN,
} from './blog'

// External-behavior tests at the src/lib seam. The blog data module drives both
// the /en/blog index and the homepage "Recommended reading" (allBlogs.slice(0,
// 4)), so ordering, count, authorship, and SEO length rules are pinned here.

describe('blog data module', () => {
  it('contains exactly 4 seed posts', () => {
    expect(allBlogs).toHaveLength(4)
  })

  it('lists posts reverse-chronologically (newest first)', () => {
    const dates = allBlogs.map(p => Date.parse(p.date))
    const sorted = [...dates].sort((a, b) => b - a)
    expect(dates).toEqual(sorted)
  })

  it('authors every post as "Nanisoft Team"', () => {
    for (const post of allBlogs) {
      expect(post.author).toBe('Nanisoft Team')
    }
  })

  it('gives every post a unique slug', () => {
    const slugs = allBlogs.map(p => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('resolves a /en/blog/<slug> URL for every post', () => {
    for (const post of allBlogs) {
      expect(postUrl(post)).toBe(`/en/blog/${post.slug}`)
    }
  })
})

describe('blog SEO length rules', () => {
  it('every title is within the SEO bounds', () => {
    for (const post of allBlogs) {
      const len = post.title.length
      expect(len, `"${post.title}"`).toBeGreaterThanOrEqual(SEO_TITLE_MIN)
      expect(len, `"${post.title}"`).toBeLessThanOrEqual(SEO_TITLE_MAX)
    }
  })

  it('every description is within the SEO bounds', () => {
    for (const post of allBlogs) {
      const len = post.description.length
      expect(len, `"${post.description}"`).toBeGreaterThanOrEqual(SEO_DESC_MIN)
      expect(len, `"${post.description}"`).toBeLessThanOrEqual(SEO_DESC_MAX)
    }
  })
})

describe('recommended reading', () => {
  it('allBlogs.slice(0, 4) returns the 4 most-recent posts in order', () => {
    const recommended: BlogPost[] = allBlogs.slice(0, 4)
    expect(recommended).toHaveLength(4)
    expect(recommended.map(p => p.slug)).toEqual(allBlogs.map(p => p.slug))
  })
})
