import type { Metadata } from 'next'
import { getPageMap } from 'nextra/page-map'
import { collectPosts, collectTags, type PageMapItem } from '@/lib/posts'
import PostList from '../../post-list'

/**
 * The tag archive — the page every `.nextra-tag` chip links to. Before this
 * route existed, article headers rendered tags as links to /tags/*, which 404'd
 * on a static export: dead ends wearing the brand's pill.
 *
 * Same data source as every other list on the blog: the Nextra page map, via
 * `collectPosts`. `generateStaticParams` covers exactly the tag set that
 * `collectTags` derives from those posts, so the chips and the archive can
 * never drift apart; `dynamicParams = false` makes any other tag a hard 404
 * (mandatory under `output: 'export'`, where nothing can render on demand).
 *
 * Not an MDX page — a `.tsx` route, so the app's MDX wrapper does not run here
 * and the heading/byline are rendered by the page itself.
 */
export const dynamicParams = false

export async function generateStaticParams(): Promise<{ tag: string }[]> {
  const pageMap = (await getPageMap()) as unknown as PageMapItem[]
  return collectTags(collectPosts(pageMap)).map((tag) => ({ tag }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const { tag } = await params
  return { title: tag }
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag } = await params
  const pageMap = (await getPageMap()) as unknown as PageMapItem[]
  const count = collectPosts(pageMap).filter((post) =>
    post.tags.includes(tag),
  ).length

  return (
    <header className="tag-page">
      <h1>{tag}</h1>
      <p className="post-byline">
        <span className="post-byline-author">
          {count} {count === 1 ? 'post' : 'posts'}
        </span>
      </p>
      <PostList tag={tag} />
    </header>
  )
}
