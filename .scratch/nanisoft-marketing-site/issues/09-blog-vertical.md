# 09 — Blog vertical: data module + 4 seed posts + `/en/blog` index & posts + tests

**What to build:** A working blog. A visitor can open `/en/blog` and browse a reverse-chronological index, then read any of 4 seed posts — each with title, description, date, and author "Nanisoft Team", grounded in the real Nanisoft framing with no fabricated metrics. A typed data module drives both the index and individual posts so the homepage "Recommended reading" (ticket 17) can deterministically take the first four.

**Blocked by:** 07 — Foundation (clean shell before adding blog).

**Status:** ready-for-agent

- [ ] Typed blog data module (reverse-chronological; mirrors the `all-blogs.ts` pattern for consistency) under `src/lib` (or `src/content/en/blog/` per the Nextra blog pattern — pick the one consistent with the reference approach and note it).
- [ ] 4 seed posts authored "Nanisoft Team", grounded framing, no fabricated metrics; titles/descriptions satisfy the SEO length rules.
- [ ] `/en/blog` index lists posts reverse-chronologically; each post page renders title/description/date/author.
- [ ] Vitest at the `src/lib` seam: posts are reverse-chronological; exactly 4 seed posts exist; titles/descriptions satisfy SEO length rules; `allBlogs.slice(0, 4)` returns the 4 most-recent in order.
- [ ] `pnpm check` + `pnpm build` green (new routes / static params).
