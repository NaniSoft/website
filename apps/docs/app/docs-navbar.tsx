import Link from 'next/link'
import { wordmarkSvg, color, type NavLink } from '@nanisoft/identity'

/**
 * Cross-site brand segment rendered through nextra-theme-docs' `navbar` prop
 * (a `reactNode` slot in `LayoutPropsSchema` — the 4.6.1 theme has no
 * `logo`/`project` props, so the wordmark + project link live here). The
 * theme's own navbar provides the sticky bar, the theme switch and the
 * sidebar toggle around this segment; styling lives in globals.css
 * (.docs-nav-*).
 *
 * The wordmark is the W1 mark from @nanisoft/identity, rendered in both modes
 * server-side (this is a server component — CSS picks the variant by the
 * `.dark` class next-themes puts on <html>): `bg` masks the font's native "i"
 * dot so it must equal the surface the bar sits on (bone in light, petrol in
 * dark); `ink` inverts to stay visible. Jade stays the single accent either
 * way.
 */
const wordmarkLight = wordmarkSvg({ bg: color.bone, ink: color.petrol, height: 26 })
const wordmarkDark = wordmarkSvg({ bg: color.petrol, ink: color.bone, height: 26 })

/** The docs' own entry in the shared cross-site list — a self-link is noise. */
const SELF_ORIGIN = 'https://docs.nanisoft.com'

export default function DocsNavbar({ links }: { links: readonly NavLink[] }) {
  return (
    <nav aria-label="Cross-site" className="docs-nav-segment">
      <Link
        href="https://nanisoft.com"
        className="docs-nav-brand"
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
      <span className="docs-nav-rule" aria-hidden="true" />
      {links
        .filter((l) => l.href !== SELF_ORIGIN)
        .map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="docs-nav-link"
            target={l.external ? '_blank' : undefined}
            rel={l.external ? 'noopener noreferrer' : undefined}
          >
            {l.label}
          </a>
        ))}
    </nav>
  )
}
