import type { MetaRecord } from 'nextra'

export default {
  // Homepage — full-screen, hidden from nav (apex `/` redirects to `/en`).
  index: {
    type: 'page',
    display: 'hidden',
    theme: {
      copyPage: false,
      timestamp: false,
      layout: 'full',
      toc: false,
    },
  },
  // Products — full 21-product grid; reached via the navbar mega-menu (ticket
  // 15), not the auto-nav. Hidden here so the mega-menu owns Products navigation.
  products: {
    type: 'page',
    display: 'hidden',
    title: 'Products',
    theme: {
      copyPage: false,
      toc: false,
    },
  },
  // Blog — visible main-nav item. Index lists posts reverse-chronologically;
  // individual posts are hidden from nav (see src/content/en/blog/_meta.tsx).
  blog: {
    type: 'page',
    title: 'Blog',
    theme: {
      copyPage: false,
      toc: false,
    },
  },
  // About — visible main-nav item. Minimal origin story; no fabricated people.
  about: {
    type: 'page',
    title: 'About',
    theme: {
      copyPage: false,
      toc: false,
    },
  },
  // Changelog — footer-linked, not main-nav. Content lands via the
  // `Changelog` component (src/lib/changelog.ts) in ticket 10.
  changelog: {
    type: 'page',
    display: 'hidden',
    title: 'Changelog',
    theme: {
      copyPage: false,
      toc: false,
    },
  },
} satisfies MetaRecord
