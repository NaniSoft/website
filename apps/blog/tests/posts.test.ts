import { describe, expect, it } from 'vitest'
import { collectPosts, type PageMapItem } from '../lib/posts'

// Fixture mirroring the Nextra page map for the blog (home + 2 categories,
// each with an index page + one post). Posts carry frontMatter.date.
const pageMap: PageMapItem[] = [
  { name: 'index', route: '/', title: 'Home', frontMatter: {} },
  {
    name: 'engineering',
    route: '/engineering',
    title: 'Engineering',
    frontMatter: {},
    children: [
      { name: 'index', route: '/engineering', title: 'Engineering', frontMatter: {} },
      {
        name: 'producing-the-access-twin',
        route: '/engineering/producing-the-access-twin',
        title: 'Producing the access twin',
        frontMatter: {
          title: 'Producing the access twin',
          date: '2026-08-27',
          description: 'Bronze to Gold.',
          author: 'nanisoft',
          tags: ['architecture', 'access'],
        },
      },
    ],
  },
  {
    name: 'announcements',
    route: '/announcements',
    title: 'Announcements',
    frontMatter: {},
    children: [
      { name: 'index', route: '/announcements', title: 'Announcements', frontMatter: {} },
      {
        name: 'hello-nanisoft-blog',
        route: '/announcements/hello-nanisoft-blog',
        title: 'Hello, nanisoft blog',
        frontMatter: {
          title: 'Hello, nanisoft blog',
          date: '2026-08-28',
          description: 'Why this blog exists.',
          author: 'nanisoft',
          tags: ['meta'],
        },
      },
    ],
  },
]

describe('collectPosts', () => {
  it('returns all posts sorted newest-first when no prefix is given', () => {
    const posts = collectPosts(pageMap)
    expect(posts).toHaveLength(2)
    expect(posts[0].route).toBe('/announcements/hello-nanisoft-blog') // 2026-08-28
    expect(posts[1].route).toBe('/engineering/producing-the-access-twin') // 2026-08-27
  })

  it('filters to one category when a prefix is given', () => {
    expect(collectPosts(pageMap, '/engineering').map((p) => p.route)).toEqual([
      '/engineering/producing-the-access-twin',
    ])
    expect(collectPosts(pageMap, '/announcements').map((p) => p.route)).toEqual([
      '/announcements/hello-nanisoft-blog',
    ])
  })

  it('excludes the home page and category index pages', () => {
    const routes = collectPosts(pageMap).map((p) => p.route)
    expect(routes).not.toContain('/')
    expect(routes).not.toContain('/engineering')
    expect(routes).not.toContain('/announcements')
  })

  it('maps frontmatter onto the Post shape', () => {
    const [post] = collectPosts(pageMap, '/engineering')
    expect(post).toEqual({
      route: '/engineering/producing-the-access-twin',
      title: 'Producing the access twin',
      date: '2026-08-27',
      description: 'Bronze to Gold.',
      author: 'nanisoft',
      tags: ['architecture', 'access'],
    })
  })

  it('returns an empty array when the category has no posts', () => {
    expect(collectPosts(pageMap, '/nope')).toEqual([])
  })
})