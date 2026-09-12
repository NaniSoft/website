/**
 * Post collection logic for the blog. `collectPosts` is a pure function over the
 * Nextra page map so it is unit-testable without a Next build. A "post" is a
 * page one level deep under a category (`/<category>/<slug>`) that carries a
 * `frontMatter.date` string. Home (`/`) and category indexes (`/<category>`)
 * are excluded by route shape. Sort is newest-first by ISO `date` (string
 * comparison is correct for `YYYY-MM-DD`).
 */

export interface PageMapItem {
  name: string
  route: string
  title?: string
  frontMatter?: Record<string, unknown>
  children?: PageMapItem[]
}

export interface Post {
  route: string
  title: string
  date: string
  description: string
  author: string
  tags: string[]
}

function flatten(items: PageMapItem[], acc: PageMapItem[] = []): PageMapItem[] {
  for (const it of items) {
    acc.push(it)
    if (it.children) flatten(it.children, acc)
  }
  return acc
}

/** A post route is exactly two segments: /<category>/<slug>. With `category`,
 *  the first segment must equal it. */
function isPostRoute(route: string, category?: string): boolean {
  if (!route.startsWith('/')) return false
  const segments = route.split('/').filter(Boolean)
  if (segments.length !== 2) return false
  return category ? segments[0] === category : true
}

/** Distinct tags across `posts`, alphabetical — the source of truth for both
 *  `/tags` (the index) and `/tags/[tag]` (`generateStaticParams`), so the two
 *  can never drift apart. */
export function collectTags(posts: Post[]): string[] {
  return [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) =>
    a.localeCompare(b),
  )
}

export function collectPosts(pageMap: PageMapItem[], prefix?: string): Post[] {
  const category = prefix ? prefix.replace(/^\//, '') : undefined
  return flatten(pageMap)
    .filter(
      (it) =>
        it.frontMatter !== undefined &&
        typeof it.frontMatter.date === 'string' &&
        isPostRoute(it.route, category),
    )
    .map((it) => {
      const fm = it.frontMatter as Record<string, unknown>
      return {
        route: it.route,
        title: String(fm.title ?? it.title ?? it.name),
        date: fm.date as string,
        description: String(fm.description ?? ''),
        author: String(fm.author ?? ''),
        tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}