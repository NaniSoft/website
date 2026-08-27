import Link from 'next/link'
import type { NavLink } from '@nanisoft/identity'

/**
 * Cross-site brand bar rendered through nextra-theme-docs' `navbar` prop
 * (a `reactNode` slot in `LayoutPropsSchema` — the 4.6.1 theme has no
 * `logo`/`project` props, so the wordmark + project link live here).
 *
 * The wordmark is the literal 'nanisoft' string (@nanisoft/identity does not
 * export a `BRAND` constant) and links to the marketing site. The shared
 * `crossNavLinks` list is the same data the landing/blog render, so the bar
 * reads as one brand across Next-version boundaries.
 */
export default function DocsNavbar({ links }: { links: readonly NavLink[] }) {
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