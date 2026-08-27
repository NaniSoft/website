import Link from 'next/link'
import type { NavLink } from '@nanisoft/identity'

/**
 * Cross-site + category bar for the blog. Mirrors apps/docs/app/docs-navbar.tsx:
 * the wordmark is the literal 'nanisoft' and links same-tab to the marketing
 * site; the shared crossNavLinks list is the same data the landing/docs render.
 * Category links (Engineering / Announcements) are internal routes on this site.
 *
 * Rendered as a sibling BEFORE nextra-theme-blog's <Layout> (not inside it) so
 * the navbar sits outside the theme's <article class="x:prose"> wrapper — prose
 * typography would otherwise style the nav links. The .dark class is applied to
 * <html> by next-themes (attribute: 'class'), so dark-mode styling still
 * cascades to the navbar even though it's outside <Layout>.
 */
export default function BlogNavbar({ links }: { links: readonly NavLink[] }) {
  return (
    <nav
      aria-label="Cross-site"
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        // Align the navbar's content box with the <article> column. The article
        // is <article class="x:container x:px-4 x:prose ...">: its centering comes
        // from the theme's `article { margin-inline: auto }` element selector, its
        // width cap from `x:prose { max-width: 65ch }`, and its horizontal padding
        // from `x:px-4` (`calc(var(--x-spacing) * 4)` = 1rem). x:container itself
        // only sets width:100% + breakpoint max-widths (up to 96rem) and does NOT
        // center or pad, so matching it literally would leave the nav at the
        // viewport edge. We mirror the article's actual effective box instead.
        maxWidth: '65ch',
        marginInline: 'auto',
        paddingInline: 'calc(var(--x-spacing) * 4)',
      }}
    >
      <Link
        href="https://nanisoft.com"
        style={{ fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
      >
        nanisoft
      </Link>
      <Link href="/engineering" style={{ color: 'inherit', textDecoration: 'none' }}>
        Engineering
      </Link>
      <Link href="/announcements" style={{ color: 'inherit', textDecoration: 'none' }}>
        Announcements
      </Link>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target={l.external ? '_blank' : undefined}
          rel={l.external ? 'noopener noreferrer' : undefined}
        >
          {l.label}
        </a>
      ))}
    </nav>
  )
}