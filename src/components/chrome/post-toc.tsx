import type { PostHeading } from '@/lib/blog-chrome'

interface PostTOCProps {
  /** Section headings; `id` matches the explicit id on the post's `<h2>`. */
  headings: PostHeading[]
}

/**
 * Sticky sidebar table-of-contents for a blog post. A `<nav>` of in-page
 * anchor links — one per `<h2>` section — that inherits the global
 * `.hive-focus` ring (it is a list of anchors). The sticky offset reads
 * `--nextra-navbar-height` so the ToC stays pinned below the navbar; anchor
 * targets clear the navbar via the global `:target { scroll-margin-top }` rule.
 *
 * Renders nothing when there are no headings (a headingless post has no ToC).
 */
export function PostTOC({ headings }: PostTOCProps) {
  if (headings.length === 0) {
    return null
  }
  return (
    <nav aria-label="Table of contents" className="text-sm">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        On this page
      </div>
      <ul className="flex flex-col gap-2 border-l border-beige-300 dark:border-neutral-800">
        {headings.map(h => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="-ml-px block border-l border-transparent pl-3 text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-white"
            >
              {h.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
