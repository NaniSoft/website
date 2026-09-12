import Link from 'next/link'
import { formatIsoDate } from '../lib/date'
import CategoryPill from './category-pill'

/**
 * The app's MDX `wrapper` — it replaces nextra-theme-blog's own wrapper
 * (h1 + <Meta> + children) because the theme's byline cannot be fixed from CSS
 * alone:
 *
 *   - its date renders `dateObj.toLocaleDateString()` (locale-dependent, e.g.
 *     27/8/2026); the blog's one date format is ISO, from `formatIsoDate`;
 *   - it always renders <Meta>, whose empty div on index pages carries an
 *     `x:mb-8` (32px) margin with nothing inside it — the dead gap under the
 *     home/category headings;
 *   - its GoBack control calls `router.back()`, a dead end for deep links; the
 *     byline carries a category pill instead (.category-pill).
 *
 * Tag chips keep the theme's `.nextra-tag` class and `/tags/<tag>` hrefs, which
 * the /tags/[tag] pages now resolve; their pill styling lives in globals.css.
 * Everything else about the page (prose, headings, code) is untouched.
 */
interface WrapperMetadata {
  title?: string
  date?: string
  author?: string
  tags?: string[]
}

export default function MdxWrapper({
  children,
  metadata,
}: {
  children: React.ReactNode
  metadata?: WrapperMetadata
}) {
  const { title, date, author, tags } = metadata ?? {}
  const iso = date ? formatIsoDate(date) : undefined
  return (
    <>
      {(title || iso) && (
        <header className="post-header">
          {title && <h1>{title}</h1>}
          {/* `nanisoft · 2026-08-27` — mono, muted, no locale. Author first,
              then the date, then where the post lives and what it is tagged. */}
          {iso && (
            <p className="post-byline" data-pagefind-ignore="all">
              <span className="post-byline-author">{author || 'nanisoft'}</span>
              <span className="post-byline-sep" aria-hidden="true">
                ·
              </span>
              <time dateTime={iso}>{iso}</time>
              <CategoryPill />
              {(tags ?? []).map((tag) => (
                <Link key={tag} href={`/tags/${tag}`} className="nextra-tag">
                  {tag}
                </Link>
              ))}
            </p>
          )}
        </header>
      )}
      {children}
    </>
  )
}
