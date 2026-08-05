import type { ReactNode } from 'react'

import { NewsletterPlaceholder, PostTOC, SectionLabel, TagList } from '@/components/chrome'
import { formatDate } from '@/lib/blog'
import { headingsFor, readingMinutesFor, tagsFor } from '@/lib/blog-chrome'

interface PostLayoutProps {
  /** Post slug; looks up the chrome-only tags + ToC headings + reading time. */
  slug: string
  title: string
  description: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  author: string
  /** The MDX post body (with the `<h2 id="...">` sections the ToC links to). */
  children: ReactNode
}

// Blog post page — editorial chrome (variant A). A sticky sidebar
// table-of-contents sits beside the prose so long reads are navigable; a tag
// list + reading time sit in the meta row; the no-op newsletter placeholder
// closes the page. Post typography aligns with the site chrome: medium-weight
// headings (`prose-headings:font-medium`) + tight tracking, on the Tailwind
// typography prose base. The sticky aside reads `--nextra-navbar-height` so it
// pins below the navbar; anchor targets clear the navbar via the global
// `:target { scroll-margin-top }` rule. Server component — no client runtime.
//
// Posts render at `theme.layout: 'full'` (see src/content/en/blog/_meta.tsx)
// so Nextra's docs sidebar + TOC do not compete with this layout.
export function PostLayout({
  slug,
  title,
  description,
  date,
  author,
  children,
}: PostLayoutProps) {
  const headings = headingsFor(slug)
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <SectionLabel>
        Post ·
        {' '}
        {formatDate(date)}
      </SectionLabel>
      <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
        <span>{author}</span>
        <span aria-hidden>·</span>
        <span>
          {readingMinutesFor(slug)}
          {' '}
          min read
        </span>
        <span aria-hidden>·</span>
        <TagList tags={tagsFor(slug)} />
      </div>
      <hr className="my-10 border-beige-300 dark:border-neutral-800" />
      <div className="grid gap-12 lg:grid-cols-[1fr_240px]">
        <article className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-medium prose-headings:tracking-tight prose-p:leading-relaxed">
          {children}
        </article>
        <aside className="lg:sticky lg:top-[var(--nextra-navbar-height)] lg:self-start">
          <PostTOC headings={headings} />
        </aside>
      </div>
      <div className="mt-16">
        <NewsletterPlaceholder layout="inline-card" />
      </div>
    </section>
  )
}
