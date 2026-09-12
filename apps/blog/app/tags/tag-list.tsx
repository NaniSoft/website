import Link from 'next/link'
import { getPageMap } from 'nextra/page-map'
import { collectPosts, collectTags, type PageMapItem } from '@/lib/posts'

/**
 * Every tag on the blog as a `.nextra-tag` pill, linking to its archive at
 * /tags/<tag>. The tag set comes from the same `collectPosts` enumeration the
 * archives use, so an index entry always has a page behind it.
 */
export default async function TagList() {
  const pageMap = (await getPageMap()) as unknown as PageMapItem[]
  const tags = collectTags(collectPosts(pageMap))
  return (
    <p className="tag-list">
      {tags.map((tag) => (
        <Link key={tag} href={`/tags/${tag}`} className="nextra-tag">
          {tag}
        </Link>
      ))}
    </p>
  )
}
