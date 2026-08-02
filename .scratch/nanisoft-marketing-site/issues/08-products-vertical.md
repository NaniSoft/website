# 08 — Products vertical: data module + `/en/products` page + tests

**What to build:** The Nanisoft suite is queryable and browsable end to end. A visitor can open `/en/products` and see all 21 products grouped by the five categories (Core, Ingestion, Query & Traversal, Interfaces, Platform & Trust), with `#category` and `#product` anchor navigation so a card or mega-menu link jumps straight to a product. The data is a single typed module so the homepage grid (ticket 17) and the navbar mega-menu (ticket 15) derive from the same source.

**Blocked by:** 07 — Foundation (clean shell before adding product surface).

**Status:** ready-for-agent

- [ ] `src/lib/products.ts`: 21 products across the 5 categories, typed; a stable `/en/products#<slug>` anchor derived per product; a mega-menu grouping derivation that matches the grid grouping.
- [ ] `/en/products` page renders the full 21-product, category-grouped grid with working `#category` and `#product` anchors.
- [ ] Vitest at the `src/lib` seam: 21 products group into exactly the 5 categories; every product resolves a stable anchor slug; mega-menu grouping matches grid grouping.
- [ ] Cards show name + one-line description, no product logos, link to `/en/products#anchor`.
- [ ] `pnpm check` + `pnpm build` green (new route / static params).
