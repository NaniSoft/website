# 17 — Homepage composition

**What to build:** The homepage, end to end — the integration slice that composes every prior vertical into one experience. A visitor lands on a `layout:'full'` page that flows top to bottom: Hero (graph + CTA "Explore the Platform") → trust strip (industry-segment badges) → collapsible products grid → 4-card Services → Get in touch (contact form) → Recommended reading (latest 4 blog posts). Below the hero, sections sit on a plain background in a single dense `max-w-5xl` column; the accent gradient carries the signature down the page quietly; particles are the hero's exclusive ambient moment.

**Blocked by:** 08 — Products vertical (products grid), 09 — Blog vertical (recommended reading = `allBlogs.slice(0, 4)`), 12 — Hero graph component, 13 — Contact form client (Get in touch).

**Status:** ready-for-agent

- [ ] Homepage (`layout:'full'` MDX composing React section components) renders, top to bottom: Hero → trust strip → products grid → Services → Get in touch → Recommended reading.
- [ ] Trust strip = industry-segment badges (Financial Services, Healthcare, Critical Infrastructure, Government, Retail), framed "built for teams in environments like these" — no fabricated logos.
- [ ] Products grid = collapsible `<details>` per the 5 categories; cards = name + one-line description linking to `/en/products#anchor`; 21 products total.
- [ ] Services = 4 cards (Assessment / Implementation / Managed Operation / Open Source Support), name + one line + short checklist.
- [ ] Get in touch = rounded panel: heading + copy on one side, contact form (ticket 13) on the other.
- [ ] Recommended reading = `allBlogs.slice(0, 4)` as link cards.
- [ ] Single dense `max-w-5xl` column below the hero on a plain background; accent gradient used quietly (dots, headline clip, primary CTA); no particles below the hero. Stacks to one column on mobile.
- [ ] `frontend-design` review: sections blend with the existing dark-first theme/tokens.
- [ ] `pnpm check` + `pnpm build` green.
