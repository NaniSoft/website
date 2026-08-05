import type { MetaRecord } from 'nextra'

// Posts are hidden from the nav — the top-level "Blog" nav item points at
// /en/blog (the index). Each post is routed at /en/blog/<slug>. Posts render at
// `layout: 'full'` so the editorial `PostLayout` (sticky sidebar ToC + tag list
// + newsletter) owns the page; Nextra's docs sidebar + TOC do not compete with
// it. `toc: false` keeps Nextra's own table-of-contents off the post.
const postTheme = {
  layout: 'full',
  toc: false,
  copyPage: false,
  timestamp: false,
} as const

export default {
  'why-we-built-nanisoft': {
    display: 'hidden',
    type: 'page',
    title: 'Why we built Nanisoft',
    theme: postTheme,
  },
  'every-path-mapped': {
    display: 'hidden',
    type: 'page',
    title: 'Every path into your systems, mapped',
    theme: postTheme,
  },
  'one-suite-over-point-tools': {
    display: 'hidden',
    type: 'page',
    title: 'The case for one suite over a stack of point tools',
    theme: postTheme,
  },
  'what-trust-means': {
    display: 'hidden',
    type: 'page',
    title: 'What trust means in a security platform',
    theme: postTheme,
  },
} satisfies MetaRecord
