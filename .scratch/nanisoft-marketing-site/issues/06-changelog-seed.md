# Changelog seed: empty or one inaugural post

Type: grilling
Status: closed
Blocked by: (none)

## Question

The "What's New" page is repurposed into a real Changelog (the `upgrade` nav item). Does
it launch **empty** (a "no entries yet" / "coming soon" state, structure ready for real
entries) or with **one inaugural post** (e.g., "Nanisoft launches" / introducing the
suite) authored **"Nanisoft Team"**?

**Recommendation:** one inaugural post grounded in the real launch framing (origin story

- the suite as first chapter), no fabricated metrics — so the Changelog isn't empty on
  day one and the page demonstrates its format.

## Answer

Resolved 2026-08-03 via grilling.

**Decision:** the Changelog launches with **one inaugural post** (not empty).

**Page placement (confirmed from settled spec, not re-grilled):** rename the
`/en/upgrade` route to **`/en/changelog`**; nav label **"Changelog"** (drop the
"What's New" label + `TitleBadge`); it is a **footer-linked page, not a main-nav
item** (the fresh main nav is Products / Blog / About / Contact per the map).

**Data structure:** a **data module + component**, not MDX-per-entry and not a
single growing MDX file. Concretely:

- `src/lib/changelog.ts` exports a typed, **reverse-chronological** array of
  entries `{ date, title, summary, body }` (mirror the blog's `all-blogs.ts`
  pattern from settled spec #6 for consistency).
- A `Changelog` React component renders the feed on the `/en/changelog` page.
- Structured data so the homepage can later surface "latest changes" and the
  list stays sortable as it grows.

**Inaugural post (first entry in the array):**

- **Author:** `Nanisoft Team` (no fabricated individual — per the no-fabrication
  rule).
- **Title:** `Introducing Nanisoft`
- **Date:** `2026-08-03` (the confirmed launch date).
- **Framing/structure** (grounded; no fabricated metrics, dates, or customer
  names):
  1. **The problem** — large organizations build custom in-house tools to fill
     the gaps enterprise security suites (authentication, endpoint, VPN,
     network, etc.) leave uncovered.
  2. **The approach** — Nanisoft builds those missing tools as one cohesive,
     category-spanning suite, so each org stops reinventing them.
  3. **The first chapter** — the suite today: Core (Atlas, Bedrock, Keystone)
     plus Ingestion, Query & Traversal, Interfaces, and Platform & Trust — 21
     products, one stack.
  4. **What's next** — one understated line: more coming. No fabricated roadmap
     dates.

The entry demonstrates the Changelog's format so future entries have a template
to match. No new fog graduates from this answer; remaining "Not yet specified"
items (final copy polish, mobile mega-menu, search-on-homepage, hero
interactivity) graduate during implementation, not from this ticket.
