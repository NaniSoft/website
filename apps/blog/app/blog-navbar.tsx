'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeSwitch } from 'nextra-theme-blog'
import { wordmarkSvg, color, type NavLink } from '@nanisoft/identity'
import { SELF_ORIGIN } from '../lib/site'

/**
 * Cross-site + category bar for the blog.
 *
 * nextra-theme-blog@4.6.1's <Layout> renders NO navbar of its own (its props
 * are children/nextThemes/banner — verified in dist/components/layout.d.mts);
 * <Navbar>, <ThemeSwitch> and <Footer> are building blocks the app composes.
 * This bar follows the landing's nav grammar: wordmark left, links right,
 * theme toggle at the far right. Styling lives in globals.css (.site-nav-*).
 *
 * Rendered as a sibling BEFORE <Layout> so the bar sits outside the theme's
 * <article> prose wrapper. The mode variant of the wordmark is chosen by CSS
 * (.dark class on <html> from next-themes) — this is a client component only
 * for usePathname; there is deliberately no second theme provider up here.
 *
 * The wordmark is the W1 mark from @nanisoft/identity, rendered in both modes
 * server-side: `bg` masks the font's native "i" dot so it must equal the
 * surface the bar sits on (bone in light, petrol in dark); `ink` inverts to
 * stay visible. Jade stays the single accent in the mark either way.
 */
const wordmarkLight = wordmarkSvg({ bg: color.bone, ink: color.petrol, height: 26 })
const wordmarkDark = wordmarkSvg({ bg: color.petrol, ink: color.bone, height: 26 })

export default function BlogNavbar({ links }: { links: readonly NavLink[] }) {
  const pathname = usePathname()
  return (
    <header className="site-nav">
      <nav aria-label="Cross-site" className="site-nav-inner">
        <Link
          href="https://nanisoft.com"
          className="site-nav-brand"
          aria-label="nanisoft — marketing site"
        >
          {/* No inline `display` here — the .wordmark-* class rules in
              globals.css own it, so only the mode's variant shows. */}
          <span
            className="wordmark wordmark-light"
            style={{ height: 26 }}
            dangerouslySetInnerHTML={{ __html: wordmarkLight }}
          />
          <span
            className="wordmark wordmark-dark"
            aria-hidden="true"
            style={{ height: 26 }}
            dangerouslySetInnerHTML={{ __html: wordmarkDark }}
          />
        </Link>
        <span className="site-nav-rule" aria-hidden="true" />
        <Link
          href="/engineering"
          className="site-nav-link"
          aria-current={pathname?.startsWith('/engineering') ? 'page' : undefined}
        >
          Engineering
        </Link>
        <Link
          href="/announcements"
          className="site-nav-link"
          aria-current={pathname?.startsWith('/announcements') ? 'page' : undefined}
        >
          Announcements
        </Link>
        {links
          .filter((l) => l.href !== SELF_ORIGIN)
          .map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="site-nav-link"
              target={l.external ? '_blank' : undefined}
              rel={l.external ? 'noopener noreferrer' : undefined}
            >
              {l.label}
            </a>
          ))}
        <span className="site-nav-toggle">
          <ThemeSwitch />
        </span>
      </nav>
    </header>
  )
}
