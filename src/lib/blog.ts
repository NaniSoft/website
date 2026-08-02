// Nanisoft blog — typed data module driving the /en/blog index and the
// homepage "Recommended reading" (allBlogs.slice(0, 4)). Reverse-chronological;
// one source so the index and the homepage teaser never diverge.
//
// Posts live as MDX under src/content/en/blog/<slug>.mdx (the body); this module
// holds the metadata + the canonical ordering. Seed posts are authored
// "Nanisoft Team" and grounded in the real Nanisoft framing — no fabricated
// metrics, customer names, or competitor names.

export interface BlogPost {
  /** URL slug; matches the MDX file name under src/content/en/blog/. */
  slug: string
  title: string
  description: string
  /** ISO date (YYYY-MM-DD). */
  date: string
  author: string
}

// SEO length bounds mirrored from the blog data-module pattern. Titles and
// descriptions are kept within these so search and social shares read cleanly.
export const SEO_TITLE_MIN = 14
export const SEO_TITLE_MAX = 70
export const SEO_DESC_MIN = 70
export const SEO_DESC_MAX = 160

/** Permalink for a blog post: /en/blog/<slug>. */
export function postUrl(post: Pick<BlogPost, 'slug'>): string {
  return `/en/blog/${post.slug}`
}

/** Deterministic en-US long date ("August 3, 2026") for display. */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Reverse-chronological (newest first).
export const allBlogs: BlogPost[] = [
  {
    slug: 'why-we-built-nanisoft',
    title: 'Why we built Nanisoft',
    description:
      'Large organizations fill the gaps left by enterprise security suites with custom in-house tools. Nanisoft replaces that build with one cohesive suite.',
    date: '2026-08-03',
    author: 'Nanisoft Team',
  },
  {
    slug: 'every-path-mapped',
    title: 'Every path into your systems, mapped',
    description:
      'Atlas keeps a live map of every route through your systems so the path an attacker would take is visible before they take it.',
    date: '2026-07-21',
    author: 'Nanisoft Team',
  },
  {
    slug: 'one-suite-over-point-tools',
    title: 'The case for one suite over a stack of point tools',
    description:
      'Point tools each solve one problem and leave the seams exposed. A single suite reading from one graph closes the gaps between them.',
    date: '2026-07-02',
    author: 'Nanisoft Team',
  },
  {
    slug: 'what-trust-means',
    title: 'What trust means in a security platform',
    description:
      'Trust is not a badge you earn once. It is the verifiable lineage behind every decision the platform makes — audit-ready, by construction.',
    date: '2026-06-15',
    author: 'Nanisoft Team',
  },
]
