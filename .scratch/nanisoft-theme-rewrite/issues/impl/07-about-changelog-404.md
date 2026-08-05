# 07 — About, changelog, 404

**What to build:** The about page wrapped in the shared site chrome (so it feels part of the site); a changelog surface (tabbed filter and/or chronological list — variant C's tabbed filter is the carry-forward) so visitors can see what has changed over time; and a new 404 page (via Nextra `NotFoundPage`) that does not dead-end on a broken link. All three render in the shared chrome.

**Blocked by:** 01 (tokens, chrome primitives, font), 02 (navbar + footer chrome).

**Status:** ready-for-agent

- [ ] About page renders in the shared site chrome (navbar + footer + typography).
- [ ] Changelog surface renders (tabbed filter and/or chronological list).
- [ ] 404 page renders via `NotFoundPage` and offers a way forward (does not dead-end).
- [ ] `.hive-focus` on all links; sticky offset uses `--nextra-navbar-height`.
- [ ] No "guild" string and no `@theguild/*` import in any new file.
- [ ] e2e: about, changelog, and 404 render in the shared chrome.
- [ ] `pnpm check` green; `pnpm build` green (routing + 404 + metadata).

## Notes

- Replaces the first-pass `Changelog` component functionally; the old file is deleted in ticket 08.
- Changelog variant is review-gated like the blog; variant C (tabbed filter) is the carry-forward, optionally combined with a chronological list.