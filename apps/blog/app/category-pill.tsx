'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * The category pill that replaces nextra-theme-blog's GoBack control in the
 * post byline. The theme's GoBack calls `router.back()`, which is a dead end
 * for every deep-linked reader (most of a blog's traffic); the pill instead
 * names the section the post lives in and links to its index.
 *
 * `usePathname` is the only way to know the route here — the MDX wrapper is
 * route-agnostic (Nextra hands it `{ children, metadata }`). This mirrors the
 * theme's own GoBack, which is a client component reading the same hook; the
 * static export still renders the correct href per page. Rendered only inside
 * a post byline, so a single-segment path (home, category index) never shows
 * it.
 *
 * Non-jade, non-live: it is a sunken tag-mono pill (.category-pill), not a
 * status or an accent.
 */
export default function CategoryPill() {
  const segments = usePathname()?.split('/').filter(Boolean) ?? []
  if (segments.length < 2) return null
  return (
    <Link href={`/${segments[0]}`} className="category-pill">
      {segments[0]}
    </Link>
  )
}
