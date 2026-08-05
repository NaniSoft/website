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
  // `layout: 'full'` gives the editorial index (featured + uniform stack) the
  // full content width for its 2-col featured card; Nextra's TOC sidebar stays
  // off (`toc: false`).
  blog: {
    type: 'page',
    title: 'Blog',
    theme: {
      layout: 'full',
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
  // Contact — visible main-nav item. No dedicated page; links to the homepage
  // get-in-touch section (rendered by the contact form, ticket 13/17). Nextra
  // renders `href` items as nav links in both the desktop navbar and the mobile
  // slide-out, so no custom mobile wiring is needed.
  contact: {
    title: 'Contact',
    href: '/en#get-in-touch',
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
