import Link from 'next/link'

import { NewsletterPlaceholder, SectionLabel, TagList } from '@/components/chrome'
import { allBlogs, postUrl } from '@/lib/blog'
import { excerptFor, readingMinutesFor, tagsFor } from '@/lib/blog-chrome'

import { PostMetaRow } from './PostMetaRow'

// /en/blog index — editorial chrome (variant A). The latest post is featured
// (a large accent-bordered card with an excerpt + tags + reading time); the
// remaining posts render as a uniform stacked list so the archive is scannable.
// Reverse-chronological order is already guaranteed by `allBlogs`. Server
// component — the data modules are the single source. Each card links to the
// post page and inherits the global `.hive-focus` ring.
export function BlogIndex() {
  const [featured, ...rest] = allBlogs
  if (!featured) {
    // No posts yet — render the surface chrome, not a throw on property access.
    return (
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <SectionLabel>Blog</SectionLabel>
        <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
          Notes from Nanisoft
        </h1>
      </section>
    )
  }
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <SectionLabel>Blog</SectionLabel>
      <header className="mb-10 max-w-3xl">
        <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
          Notes from Nanisoft
        </h1>
        <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          Thinking on security graphs, the suite, and the gaps left by enterprise tools.
        </p>
      </header>

      {/* Featured post — large card with excerpt + tags + reading time. */}
      <article className="mb-12 grid gap-8 rounded-3xl border border-beige-300 p-8 lg:grid-cols-[1.4fr_1fr] dark:border-neutral-800">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Featured
          </div>
          <h2 className="text-3xl font-medium tracking-tight">
            <Link href={postUrl(featured)} className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
              {featured.title}
            </Link>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
            {featured.description}
          </p>
          <PostMetaRow
            author={featured.author}
            date={featured.date}
            readingMinutes={readingMinutesFor(featured.slug)}
          />
          <div className="mt-4">
            <TagList tags={tagsFor(featured.slug)} />
          </div>
        </div>
        <aside className="rounded-2xl border border-beige-300 bg-beige-100 p-5 text-sm leading-relaxed text-zinc-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-zinc-300">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Excerpt
          </div>
          {excerptFor(featured.slug)}
        </aside>
      </article>

      {/* Uniform stack — every remaining post gets the same shape. */}
      <ul className="flex flex-col divide-y divide-beige-300 border-t border-beige-300 dark:divide-neutral-800 dark:border-neutral-800">
        {rest.map(post => (
          <li key={post.slug} className="py-7">
            <article className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
              <div>
                <h3 className="text-xl font-medium tracking-tight">
                  <Link href={postUrl(post)} className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-200">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {post.description}
                </p>
                <PostMetaRow
                  author={post.author}
                  date={post.date}
                  readingMinutes={readingMinutesFor(post.slug)}
                />
              </div>
              <div>
                <TagList tags={tagsFor(post.slug)} />
              </div>
            </article>
          </li>
        ))}
      </ul>

      {/* Newsletter placeholder — the blog surface closes with a subscribe
          prompt (US 38). The post page renders the same primitive inline. */}
      <div className="mt-16">
        <NewsletterPlaceholder layout="inline-card" />
      </div>
    </section>
  )
}
