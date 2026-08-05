// Nanisoft changelog — typed reverse-chronological array (mirrors the blog
// data-module pattern) rendered by the `Changelog` component at /en/changelog.
// One source so the list stays sortable and the route isn't per-entry MDX
// sprawl. No fabricated metrics, dates, or customer names.

export interface ChangelogSection {
  heading: string
  text: string
}

/**
 * The 4 changelog kinds the tabbed filter (variant C, impl ticket 07) filters
 * on. `launch` is reserved for inaugural/launch entries; the rest are the
 * normal ongoing kinds. Mirrors the variant-C prototype's kind set so the
 * filter tabs are stable.
 */
export type ChangelogKind = 'launch' | 'feature' | 'fix' | 'security'

export interface ChangelogEntry {
  /** ISO date (YYYY-MM-DD). */
  date: string
  title: string
  /** One-line summary. */
  summary: string
  author: string
  /** Filter kind — drives the tabbed filter on /en/changelog. */
  kind: ChangelogKind
  /** Ordered framing sections. */
  body: ChangelogSection[]
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
export const allChangelog: ChangelogEntry[] = [
  {
    date: '2026-08-03',
    title: 'Introducing Nanisoft',
    summary:
      'Nanisoft launches with the Core trio and four more categories — twenty-one products that replace the custom in-house gap-fillers large organizations otherwise build.',
    author: 'Nanisoft Team',
    kind: 'launch',
    body: [
      {
        heading: 'The problem',
        text: 'Large organizations inherit an enterprise security suite and then fill the gaps it leaves with custom in-house tools — integrations, scripts, and tribal knowledge that are expensive to build and fragile to keep. When the people who built them move on, the gaps quietly reopen.',
      },
      {
        heading: 'The approach',
        text: 'Nanisoft replaces that custom build with one cohesive suite. Every tool reads from a single live graph of every path into a system — ingress, identity, traversal, data — so the route an attacker would take is visible before they take it, and so each tool’s answer is the next tool’s starting point.',
      },
      {
        heading: 'The first chapter',
        text: 'The Core trio — Atlas, Bedrock, and Keystone — anchors the suite, with four more categories of tooling: Ingestion, Query & Traversal, Interfaces, and Platform & Trust. Twenty-one products in all, each doing one job and legible to the next.',
      },
      {
        heading: 'More coming',
        text: 'This is the first chapter, not the whole story. We will keep this changelog honest about what shipped and what is next — no invented milestones, no named customers, no fabricated numbers.',
      },
    ],
  },
]

/** The inaugural changelog entry. */
export const inauguralEntry: ChangelogEntry = allChangelog[0]!
