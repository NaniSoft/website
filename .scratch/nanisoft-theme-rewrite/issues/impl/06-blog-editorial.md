# 06 — Blog (editorial index + post)

**What to build:** The blog in editorial chrome (variant A, review-gated — the user flips the switcher and confirms at implementation time). The index shows a featured post plus a uniform stack of the remaining posts, so the latest writing is highlighted and the archive is scannable. The post page has a sticky sidebar table-of-contents (so long reads are navigable), a tag list, and the newsletter placeholder, with post typography aligned with the site chrome. Applies to our 4 nanisoft posts only — guild blog posts, their images, and the guild `logos` page are out of scope.

**Blocked by:** 01 (tokens, `NewsletterPlaceholder` chrome primitive, font), 02 (navbar + footer chrome).

**Status:** ready-for-agent

- [x] Blog index renders a featured post + a uniform stack of the remaining posts (our 4 nanisoft posts).
- [x] Post page renders a sticky sidebar table-of-contents.
- [x] Tag list renders on posts (`TagList` chrome primitive).
- [x] Newsletter placeholder renders on the blog surface (`NewsletterPlaceholder`).
- [x] Post typography aligns with the site chrome (medium-weight headings, tight tracking).
- [x] `PostTOC` + `TagList` chrome primitives land in `src/components/chrome/` (one shared home).
- [x] `.hive-focus` on all post links and tags; sticky offset uses `--nextra-navbar-height`.
- [x] No "guild" string and no `@theguild/*` import in any new file.
- [x] e2e: blog index featured + stack of 4; post page sticky sidebar ToC + tag list + newsletter placeholder.
- [x] `pnpm check` green; `pnpm build` green (routing + static params for posts).

## Notes

- Review-gated on variant A (Editorial). If the user picks a different variant at implementation time, update this ticket's chrome description accordingly.
- Open, low-risk decision for this ticket: whether blog tags extend `src/lib/blog.ts` or stay in a chrome-only module (`src/lib/blog-chrome.ts`). Pick one and record it.
- Replaces the first-pass `Blog` component functionally; the old file is deleted in ticket 08.

## Answer / resolution (2026-08-05)

Landed. `pnpm check` + `pnpm build` green; blog e2e 6/6; sibling e2e green modulo the
documented pre-existing contact-env failures. Resolved decisions:

- **Blog tags + headings + reading time + excerpt stay in a chrome-only module
  (`src/lib/blog-chrome.ts`), NOT in `src/lib/blog.ts`.** `blog.ts` (the SEO/data
  module + its existing tests) stays the single source for post metadata +
  canonical ordering; the chrome-only sibling holds everything the blog
  *presentation* renders that is not page metadata (tags, sticky-ToC headings,
  reading time, featured-card excerpt). Both key off the same slugs and are kept
  in lockstep by `blog-chrome.test.ts` (every `allBlogs` post has a chrome
  entry). Resolves the ticket's open decision.
- **Variant A (Editorial) confirmed.** Featured post (the newest) as a large
  accent-bordered card with excerpt + tags + reading time; the remaining three
  as a uniform stacked list. Sticky sidebar `PostTOC` on the post page; `TagList`
  + `NewsletterPlaceholder` (inline-card) on the post.
- **Posts switched to `type: 'page'` + `layout: 'full'`** in `blog/_meta.tsx`
  so Nextra's docs sidebar + TOC do not compete with `PostLayout`'s own sticky
  sidebar ToC. The blog index also moved to `layout: 'full'` so the editorial
  featured card (2-col, max-w-6xl) gets the full content width — matching the
  homepage pattern. The frontmatter `title` is NOT auto-injected as an h1 by
  Nextra (verified in the theme source: `remark-mdx-title` only sets
  `file.data.title` for nav/metadata), so `PostLayout` owns the post h1 — no
  duplicate h1.
- **Posts gained 2–3 grounded `<h2 id="...">` sections each.** The posts were
  headingless flat prose; the sticky ToC required section headings. Sections are
  split from the existing paragraphs (no fabricated content); the explicit `id`s
  match the headings list in `blog-chrome.ts` so `PostTOC` links resolve.
- **`PostTOC` + `TagList` landed in `src/components/chrome/`** (one shared home,
  per the centralization contract). Tag accents reuse the 5 category accent
  tokens via `chrome/accents` — the dot is the accent, the label stays ink
  (the design rule). `.hive-focus` is inherited globally (anchors + buttons);
  the sticky offset reads `--nextra-navbar-height` (no hardcoded 64/80/82).
- **Old first-pass `PostMeta.tsx` is now unreferenced** (posts switched to
  `PostLayout`); `BlogIndex.tsx` was rewritten in place. `PostMeta.tsx` is
  deleted in ticket 08 with the rest of the `Blog/` sweep — expand-contract.

## Code-review follow-ups (2026-08-05)

Two-axis `/code-review` (Standards + Spec) ran against the work. No hard
standards violations; 5 baseline-smell judgement calls and 2 partial spec
findings. Addressed:

- **Duplicated meta row → `PostMetaRow`** (Standards #1). The
  `author · date · N min read` row appeared identically in the featured card and
  the stacked items; extracted into `src/components/Blog/PostMetaRow.tsx` and
  used in both. Lives in `Blog/`, not `chrome/`, because it is blog-card-specific
  (not a cross-surface primitive like `PostTOC`/`TagList`). `PostLayout` keeps
  its own inline meta row — a different shape (no date, folds `TagList` in, at
  `text-sm`), not a duplicate.
- **Redundant scroll-margin dropped** (Standards #2). Removed
  `prose-headings:scroll-mt-[var(--nextra-navbar-height)]` from `PostLayout`;
  the global `:target { scroll-margin-top: var(--nextra-navbar-height) }` rule
  in `index.css` already clears the navbar for ToC anchor navigation.
- **Empty-array guard** (Standards #5). `BlogIndex` now early-returns the
  surface chrome if `allBlogs` is ever empty, instead of throwing on
  `featured.title`.
- **Newsletter on the blog index** (Spec partial). Added
  `NewsletterPlaceholder layout="inline-card"` at the foot of `/en/blog` so the
  "blog surface" closes with a subscribe prompt (US 38); the post page keeps its
  inline newsletter. Scoped the index e2e's "exactly three stacked posts" h3
  count to h3s that link to a post page, so the newsletter primitive's own h3
  does not inflate it.
- **`.hive-focus` on tags** (Spec partial) — non-actionable. `TagList` pills are
  non-interactive `<span>`s (no tag routes exist in scope); making decorative
  spans focusable would be an a11y anti-pattern. The global hive-focus ring
  applies to all interactive post links (featured card, stacked cards, ToC
  anchors, newsletter form) as intended. The checklist's "hive-focus on tags"
  assumed interactivity the spec doesn't require.
- **Skipped** Standards #3 (Primitive Obsession on `slug: string`) and #4 (data
  clump on the PostLayout props) — a branded `BlogSlug` type / shared `PostMeta`
  type would add speculative generality for no current need.

Gate: `pnpm check` green, `pnpm build` green (routing + static params for
posts), blog e2e 6/6. Sibling e2e green modulo the documented pre-existing
local-env failures (contact: unset `NEXT_PUBLIC_CONTACT_ENDPOINT` + turbopack
route stub; navbar mega-menu: turbopack-dev hover, confirmed failing on the
stashed base too).