import { getPageMap } from 'nextra/page-map'
import { collectPosts, type PageMapItem } from '@/lib/posts'
import { PostCard } from 'nextra-theme-blog'

/**
 * Renders the blog's post list. `prefix` filters to one category (e.g.
 * "/engineering"); omit it for the home page (all posts, newest-first).
 *
 * `PostCard` (nextra-theme-blog@4.6.1) takes a single `post` object shaped as
 * `{ route, frontMatter: BlogMetadata }` — not flat props — so each `Post` from
 * `collectPosts` is mapped into that shape here. `PostCard` only reads `title`,
 * `date`, and `description` from `frontMatter`; `author` is included because the
 * theme types it as `author?: string`. `tags` is omitted because the installed
 * `BlogMetadata` types it as `tags?: []` (empty-tuple), which rejects `string[]`
 * — a theme type bug we sidestep rather than weaken with a cast. The
 * `PageMapItem` interface in `lib/posts.ts` is a minimal structural subset of
 * Nextra's richer union (`Folder | MdxFile | MetaJsonFile`); we bridge the two
 * via `as unknown as` at the call site rather than weakening `collectPosts`'s
 * parameter type.
 */
export default async function PostList({ prefix }: { prefix?: string }) {
  const pageMap = (await getPageMap()) as unknown as PageMapItem[]
  const posts = collectPosts(pageMap, prefix)
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {posts.map((p) => (
        <li key={p.route}>
          <PostCard
            post={{
              route: p.route,
              frontMatter: {
                title: p.title,
                date: p.date,
                description: p.description,
                author: p.author,
              },
            }}
          />
        </li>
      ))}
    </ul>
  )
}