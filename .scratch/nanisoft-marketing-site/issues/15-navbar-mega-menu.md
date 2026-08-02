# 15 — Navbar: Products mega-menu + Blog/About/Contact + GitHub icon

**What to build:** A Nextra navbar that lets a visitor jump anywhere from any page. A grouped Products mega-menu by the five categories linking to `/en/products#category` and `#product` anchors, plus Blog, About, Contact, a GitHub icon, and the dark-default theme toggle (already switched in ticket 07). Mobile behavior of the mega-menu inside Nextra's mobile nav sharpens during implementation.

**Blocked by:** 08 — Products vertical (the mega-menu grouping/anchors derive from the products data module).

**Status:** ready-for-agent

- [ ] Products mega-menu grouped by the 5 categories, links resolve to `/en/products#category` and `#product` anchors.
- [ ] Blog, About, Contact nav items resolve to their routes (`/en/blog`, `/en/about`, Contact → the homepage get-in-touch section / contact path).
- [ ] GitHub icon links to `NEXT_PUBLIC_GITHUB_URL`; omitted (not shown broken) when unset.
- [ ] Dark-default theme toggle present (theme-default already set in 07).
- [ ] Mobile: mega-menu usable inside Nextra's mobile nav (confirm during build; recheck Nextra mobile-nav selectors).
- [ ] `pnpm check` + `pnpm build` green.
