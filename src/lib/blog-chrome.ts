// Nanisoft blog chrome — the chrome-only fields the blog *presentation* renders
// that are not page metadata: per-post tags, the sticky-sidebar ToC headings,
// reading time, and the lead-paragraph excerpt shown on the index card.
//
// This is a chrome-only sibling to `src/lib/blog.ts`. The decision (recorded in
// ticket impl/06): blog tags + headings stay in a chrome-only module rather than
// extending the SEO/data module, so `blog.ts` (and its existing tests) remain
// the single source for post metadata + canonical ordering, and the chrome can
// evolve without a data-shape change. Both modules key off the same slugs and
// are kept in lockstep by `blog-chrome.test.ts` (every `allBlogs` post has a
// chrome entry).
//
// Tag accents reuse the 5 category accent tokens (`chrome/accents`) — the dot is
// the accent, the label stays ink (the design rule: no inline small accent
// text on the shared background). Heading ids match the explicit `id` attributes
// on the `<h2>` sections in each post's MDX body, so the sticky `PostTOC` links
// resolve to the right section.

import type { CategoryId } from '@/components/chrome/accents'

/** A blog tag — a label plus the category accent its dot carries. */
export interface PostTag {
  label: string
  /** Category accent id; the dot is the accent, the label stays ink. */
  category: CategoryId
}

/** A ToC heading — `id` matches the explicit id on the post's `<h2>` section. */
export interface PostHeading {
  id: string
  label: string
}

/** Chrome-only fields for a single post, keyed by slug. */
export interface PostChrome {
  /** Accent-dot tags shown on the index card + post meta. */
  tags: PostTag[]
  /** Section headings rendered in the sticky sidebar ToC. */
  headings: PostHeading[]
  /** Reading time in minutes (chrome-only decoration). */
  readingMinutes: number
  /** Lead-paragraph excerpt shown on the featured index card. */
  excerpt: string
}

/** The chrome record for every production post, keyed by slug. */
export const blogChrome: Record<string, PostChrome> = {
  'why-we-built-nanisoft': {
    tags: [
      { label: 'Origin', category: 'core' },
      { label: 'Suite', category: 'ingestion' },
    ],
    headings: [
      { id: 'the-gap', label: 'The gap' },
      { id: 'the-answer', label: 'The answer' },
      { id: 'the-first-chapter', label: 'The first chapter' },
    ],
    readingMinutes: 4,
    excerpt:
      'Large organizations don\'t buy their security stack in one piece. They inherit an enterprise suite — authentication, authorization, endpoint, VPN, network security — and then they build. Every gap that suite leaves uncovered becomes an internal tool, a custom integration, or a team that holds the answer in their head.',
  },
  'every-path-mapped': {
    tags: [
      { label: 'Atlas', category: 'core' },
      { label: 'Attack paths', category: 'query-traversal' },
    ],
    headings: [
      { id: 'paths-not-assets', label: 'Paths, not assets' },
      { id: 'the-live-map', label: 'The live map' },
      { id: 'from-the-map', label: 'From the map' },
    ],
    readingMinutes: 5,
    excerpt:
      'A system is not a list of assets. It is a set of paths — the routes by which something moves from an ingress point to something it can touch. Most security work is spent reconstructing those paths after the fact, in a spreadsheet or a ticket, and then watching the reconstruction go stale.',
  },
  'one-suite-over-point-tools': {
    tags: [
      { label: 'Architecture', category: 'interfaces' },
      { label: 'Suite', category: 'ingestion' },
    ],
    headings: [
      { id: 'the-seams', label: 'The seams' },
      { id: 'one-graph', label: 'One graph, five surfaces' },
      { id: 'start-anywhere', label: 'Start anywhere' },
    ],
    readingMinutes: 4,
    excerpt:
      'Point tools are easy to buy and hard to keep. Each one solves one problem well, and then leaves the seams — the joins between tools, the gaps in coverage, the places where one product\'s model ends and another\'s begins — for the buyer to stitch together.',
  },
  'what-trust-means': {
    tags: [
      { label: 'Trust', category: 'platform-trust' },
      { label: 'Meridian', category: 'platform-trust' },
    ],
    headings: [
      { id: 'the-question', label: 'The question' },
      { id: 'the-lineage', label: 'The lineage' },
      { id: 'audit-ready', label: 'Audit-ready by construction' },
    ],
    readingMinutes: 6,
    excerpt:
      'Trust in a security platform is not a compliance badge you earn once and frame. It is the answer to a specific question: when the platform made this decision, what was it looking at, and can you prove it?',
  },
}

/** Tags for a post (accent-dot pills for the index card + post meta). */
export function tagsFor(slug: string): PostTag[] {
  return blogChrome[slug].tags
}

/** Section headings for a post's sticky sidebar ToC. */
export function headingsFor(slug: string): PostHeading[] {
  return blogChrome[slug].headings
}

/** Reading time in minutes for a post (chrome-only decoration). */
export function readingMinutesFor(slug: string): number {
  return blogChrome[slug].readingMinutes
}

/** Lead-paragraph excerpt for a post's featured index card. */
export function excerptFor(slug: string): string {
  return blogChrome[slug].excerpt
}
