import type { MetaRecord } from 'nextra'

// Posts are hidden from the nav — the top-level "Blog" nav item points at
// /en/blog (the index). Each post is still routed at /en/blog/<slug>.
export default {
  'why-we-built-nanisoft': { display: 'hidden', title: 'Why we built Nanisoft' },
  'every-path-mapped': { display: 'hidden', title: 'Every path into your systems, mapped' },
  'one-suite-over-point-tools': { display: 'hidden', title: 'The case for one suite over a stack of point tools' },
  'what-trust-means': { display: 'hidden', title: 'What trust means in a security platform' },
} satisfies MetaRecord
