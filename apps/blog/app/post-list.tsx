import { getPageMap } from 'nextra/page-map'
import { collectPosts, type PageMapItem } from '@/lib/posts'
import PostCard from './post-card'

/**
 * Renders the blog's post list. `prefix` filters to one category (e.g.
 * "/engineering"); `tag` filters to one tag (the /tags/[tag] pages); omit both
 * for the home page (all posts, newest-first).
 *
 * `collectPosts` is the same enumeration every list on the blog uses — the
 * Nextra page map, filtered to two-segment routes carrying a frontmatter
 * `date`. The card markup comes from ./post-card (brand card surface + ISO
 * date); the surface itself is the `<li class="post-card">`, styled in
 * globals.css. The `PageMapItem` interface in `lib/posts.ts` is a minimal
 * structural subset of Nextra's richer union (`Folder | MdxFile | MetaJsonFile`);
 * we bridge the two via `as unknown as` at the call site rather than weakening
 * `collectPosts`'s parameter type.
 */
export default async function PostList({
  prefix,
  tag,
}: {
  prefix?: string
  tag?: string
}) {
  const pageMap = (await getPageMap()) as unknown as PageMapItem[]
  const posts = collectPosts(pageMap, prefix).filter((post) =>
    tag ? post.tags.includes(tag) : true,
  )

  if (posts.length === 0) {
    return <p className="post-list-empty">Nothing published here yet.</p>
  }

  return (
    <ul className="post-list">
      {posts.map((post) => (
        <li key={post.route} className="post-card">
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  )
}
