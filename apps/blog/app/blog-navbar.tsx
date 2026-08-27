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
      style={{ display: 'flex', gap: 16, alignItems: 'center' }}
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