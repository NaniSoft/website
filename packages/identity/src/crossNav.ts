/**
 * Cross-site navigation — the link list shared by every nanisoft site (docs,
 * blog, landing) so the brand bar is consistent across Next-version boundaries.
 * Each site renders this list through its own theme; we share the data, not a
 * React component (the sites run different Next versions — see the WS2 design).
 *
 * Destinations point at the public domains, so every entry is `external`.
 * About/Contact live as sections on the landing site (the-guild.dev pattern).
 */

export interface NavLink {
  label: string
  href: string
  external?: boolean
}

export const crossNavLinks: readonly NavLink[] = [
  { label: 'Docs', href: 'https://docs.nanisoft.com', external: true },
  { label: 'Blog', href: 'https://blog.nanisoft.com', external: true },
  { label: 'About us', href: 'https://nanisoft.com/about-us', external: true },
  { label: 'Contact us', href: 'https://nanisoft.com/about-us#contact', external: true },
] as const