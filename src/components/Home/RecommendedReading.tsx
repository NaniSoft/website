// Homepage recommended reading — the latest posts surfaced as link cards.
// The 4 most recent posts (`allBlogs.slice(0, 4)`); reverse-chronological
// order is already guaranteed by `allBlogs`. Quiet plain-bg section labelled
// with the shared `SectionLabel` primitive. Post cards are anchors, so they
// inherit the global `hive-focus` ring and the `:target` sticky offset.

import { SectionLabel } from '@/components/chrome'
import { allBlogs, formatDate, postUrl } from '@/lib/blog'

export function RecommendedReading() {
  const posts = allBlogs.slice(0, 4)
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14">
      <SectionLabel>Recommended reading</SectionLabel>
      <h2 className="mb-8 text-2xl font-medium tracking-tight sm:text-3xl">
        From the blog
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map(post => (
          <a
            key={post.slug}
            href={postUrl(post)}
            className="group block rounded-2xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(post.date)}
            </div>
            <h3 className="mt-2 text-base font-medium transition-colors group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
              {post.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {post.description}
            </p>
          </a>
        ))}
      </div>
    </section>
  )
}
