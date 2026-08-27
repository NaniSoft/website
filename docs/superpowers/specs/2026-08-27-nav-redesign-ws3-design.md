# WS3 — Nextra Blog Site (blog.nanisoft.com) Design

> Companion to the nav-redesign effort: WS1 (landing nav + about-us + contact — shipped), WS2 (Nextra docs → docs.nanisoft.com — shipped 2026-08-27), WS3 (Nextra blog → blog.nanisoft.com — this spec).

## Goal

Stand up `apps/blog`, a Nextra blog site that publishes at `blog.nanisoft.com`, carrying mixed engineering + announcement content organized by category. It reuses the cross-site nav already wired across the landing and docs sites, mirrors the nanisoft brand, and deploys as a static site to Cloudflare Pages — the same proven path as the docs site, minus the docs theme's #5008 patch.

## Architecture

A new `apps/blog` Nextra 4.6.1 site using `nextra-theme-blog@4.6.1`, on `next@16.1.7` + webpack (NOT Turbopack; NOT Next 16.2.x+ — Nextra issue #5003), React 19.2.8. Static export: `next.config.mjs` sets `withNextra({ output: 'export', images: { unoptimized: true } })`; `--webpack` is in every build/dev script. A root `mdx-components.tsx` exports `useMDXComponents` merging the theme's defaults (required by Nextra's loader). Deploy = Cloudflare Pages (`wrangler pages deploy out --project-name nanisoft-blog`), NOT the OpenNext Worker path used by the landing app.

The blog theme differs from the docs theme in three ways that simplify WS3 relative to WS2 (per Spike 1):
- **No #5008 patch.** `nextra-theme-blog@4.6.1` has no Zod validation (`safeParse`/`LayoutPropsSchema`). Its `Layout` takes only `children`, `nextThemes`, `banner` — no `pageMap`.
- **Composable.** `Navbar`, `PostCard`, `Footer`, `ThemeSwitch`, `Comments` are exported separately and assembled in the layout. `import 'nextra-theme-blog/style.css'` in the layout provides the base styles. `useMDXComponents` is exported from the package main.
- **Same `nextra()` core pipeline** as docs (already proven on this Next/webpack pin), so the build path is identical.

Structurally `apps/blog` mirrors `apps/docs`: same `next.config.mjs` shape, `mdx-components.tsx`, `tsconfig.json`, flat `eslint.config.mjs`, `package.json` with `dev`/`build`/`cloudflare-build`/`deploy`/`lint` scripts (`--webpack` where applicable), `types/global.d.ts` declaring `*.css`, and a `.gitignore` for `out/` + `.next/`.

## Content Model

**Categories as folders** — the folder is the post-type distinguisher (the "Mixed" content choice):

- `app/engineering/page.mdx` — category index for engineering posts.
- `app/announcements/page.mdx` — category index for announcement posts.
- `app/<category>/<slug>/page.mdx` — a post. Route = `/<category>/<slug>`.
- `app/page.mdx` — home; lists all posts, most-recent first.

**Post frontmatter** (MDX `export const meta = { … }`, the Nextra convention): `title: string`, `date: string` (ISO `YYYY-MM-DD`), `description: string`, `author: string`, `tags: string[]`. `date` drives sort order; `description` feeds PostCard; `tags` are metadata only (no tag pages — out of scope).

**`PostList` component** — the one piece of custom logic. A React server component that:
1. calls `getPageMap()` (from `nextra/page-map`),
2. flattens to the post pages (folders with a `page.mdx` child under a category prefix),
3. filters by an optional route prefix (category) — `undefined`/empty means all,
4. sorts by `date` descending,
5. renders the theme's exported `PostCard` for each, passing `title`/`date`/`description`/`href`.

Home uses `<PostList />` (all). Each category index uses `<PostList prefix="/engineering" />` / `<PostList prefix="/announcements" />`. The component has one responsibility (filter + sort + render) and is independently testable against a fixture pageMap.

**Sidebar / `_meta.js`:** `app/_meta.js` declares the categories for the navbar/sidebar display order: `engineering`, `announcements`. No `type` field (sidebar display, same convention as the docs site). Per-category `_meta.js` is not required unless display order within a category needs control (deferred — natural file order suffices for 1–2 posts).

**Seed content (2 posts, one per category):**
- `app/engineering/producing-the-access-twin/page.mdx` — a real deep-dive: the Bronze → Silver → Gold path that produces the access twin (sources land untouched, identities resolve to one node, facts become graph). Draws on the landing's PLATFORM_FLOW copy for consistency but is standalone prose.
- `app/announcements/hello-nanisoft-blog/page.mdx` — the "why this blog" announcement: what we'll publish here (engineering deep-dives + occasional announcements), who we are, link to docs + playground.

Both posts are real, minimal-but-substantive prose (not lorem ipsum) — enough to exercise the list page, a category index, and a full post render. The landing already substantiates the platform story, so the engineering post cross-links to `docs.nanisoft.com` rather than repeating it.

## Branding (mirror the docs site)

Apply the nanisoft identity — petrol `#0C2A33`, bone `#F4EFE6`, petrolDeep `#08222A`, teal `#2A8C97`, jade `#14A77A`, focus `#1F6E78` — plus the Satoshi font family (via `next/font/local`, copied from `apps/docs/app/fonts/`). Jade is **active/live only** (appears only on an active/`aria-current` state, never as a decorative background/border). No pure `#000000` / `#FFFFFF`. Dark-mode primary = teal (the same sanctioned deviation as the docs site — legibility on petrolDeep).

Mechanism: a `globals.css` imported in the layout that overrides the blog theme's CSS hooks with the brand values, plus the Satoshi `--font-satoshi` variable applied to the theme's body/font token.

**Caveat (carried from WS2's lesson):** the blog theme's CSS-variable surface is NOT the same as `nextra-theme-docs`. The brief's exact variable names will be wrong until verified. The first implementation task MUST read the installed `nextra-theme-blog@4.6.1/dist/style.css` (and the theme's exported CSS) to discover the real tokens it exposes, then override those — falling back to a targeted CSS layer on the theme's actual class/variable names if the `--nextra-*` / `--x-*` names from the docs theme aren't present. The verified token names + the mapping are recorded in a code comment at the top of `globals.css`, exactly as the docs site did. This is an implementation-time discovery step, not a spec gap.

## Cross-Site Navigation

A `BlogNavbar` component reuses `crossNavLinks` from `@nanisoft/identity` (already shipped + tested in WS2): Docs → `https://docs.nanisoft.com`, Blog → `https://blog.nanisoft.com`, About us → `https://nanisoft.com/about-us`, Contact us → `https://nanisoft.com/about-us#contact`. All are `external: true` and render `target="_blank" rel="noopener noreferrer"`. The wordmark `nanisoft` links to `https://nanisoft.com` same-tab (the brand anchor — same convention as the docs site). Category links (Engineering / Announcements) appear in the navbar. The blog's own nav link may carry `aria-current` when appropriate; jade applies only there.

The repo grep gate applies: no literal "request a demo" and no `mailto:` links anywhere in `apps/blog`.

## CI / Deploy

Append a `deploy-blog` job to `.github/workflows/deploy.yml`, mirroring `deploy-docs` (and deploy-landing/playground): `checkout@v5` / `pnpm@v6` / `node@v5-24`, `needs: [verify, e2e]`, `if` push-to-main only, two-step `cloudflare-build` then `wrangler pages deploy out --project-name nanisoft-blog` with `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` env on the deploy step only. The existing `verify` job already runs `pnpm -r run build`, so `apps/blog` is gated on PRs once it exists. A custom-domain comment (`blog.nanisoft.com`) is included for the user to bind manually after the first deploy.

## Testing & Gates

- **`PostList` unit test** — `apps/blog` (or a co-located test) verifies the filter + sort logic against a fixture pageMap: (a) prefix filter returns only posts under that category, (b) empty prefix returns all, (c) posts sort by `date` descending, (d) non-post pages (category indexes, home) are excluded. Real assertions on the filter/sort, not mocks of PostCard. This is the only custom logic in the app.
- **Reused, no new test:** `@nanisoft/identity` `crossNavLinks` (already covered by `crossNav.test.ts`).
- **Standard gates:** `pnpm -r run lint` (0 errors), `pnpm -r run test` (all green incl. the new PostList test), `pnpm -r run build` (blog produces `out/` with index + category + post routes). Lint warnings on `_meta.js` anonymous default exports are acceptable (same as docs).
- **Brand/grep gate:** no "request a demo", no `mailto:`, no pure black/white, jade only on active — verified on the built `out/index.html` + generated CSS during the self-review task.

## Global Constraints (carry into the plan, verbatim)

- Pinned versions: `next@16.1.7`, `nextra@4.6.1`, `nextra-theme-blog@4.6.1`, `react@19.2.8` / `react-dom@19.2.8`. NO Next 16.2.x+ (#5003). 16.0.x fallback.
- `next.config.mjs`: `output: 'export'` + `images: { unoptimized: true }`, wrapped in `nextra()`.
- `--webpack` in `dev` and `build`/`cloudflare-build` scripts.
- Root `mdx-components.tsx` exporting `useMDXComponents` (merging theme defaults) — required.
- **No #5008 patch** for the blog theme (it has no Zod validation). Do not carry over the docs patch.
- `import 'nextra-theme-blog/style.css'` in the layout. Layout takes `children` / `nextThemes` / `banner` only — no `pageMap` prop. `Navbar` / `PostCard` / `Footer` composed in the layout; `getPageMap()` used inside `PostList` (a server component), not as a Layout prop.
- Brand: petrol `#0C2A33`, bone `#F4EFE6`, petrolDeep `#08222A`, teal `#2A8C97`, jade `#14A77A` (active only), focus `#1F6E78`. No pure black/white. Satoshi font. Dark-mode primary = teal (sanctioned).
- Cross-site nav external links: `target="_blank"` + `rel="noopener noreferrer"`. No "request a demo" / no `mailto:` in `apps/blog`.
- Deploy = Cloudflare Pages (`wrangler pages deploy out --project-name nanisoft-blog`), NOT OpenNext.
- pnpm 11 `allowBuilds`: `sharp: false` already set workspace-wide (blog uses unoptimized images). `patchedDependencies` is not extended (no blog patch).
- `apps/blog` pins `typescript@6.0.3` to match `apps/docs` (consistency across the two Nextra apps; the repo's 5.9 standard stays for landing/playground). Accepted per WS2 review.
- The AGENTS.md "This is NOT the Next.js you know" block must not be stripped from any diff.

## Out of Scope (deferred follow-ups)

RSS/Atom feed (`feed.xml`), tag pages / tag routing, author pages, comments (`Comments` is exported but unused), search, pagination (the PostList renders all for now — fine for a launch-sized blog), and a custom 404 beyond the theme default. Each can be added later without restructuring.

## Open Items for the User (post-merge, independent of code)

- Confirm `CLOUDFLARE_API_TOKEN` scope covers Cloudflare Pages:Edit (same token used by deploy-landing/playground/docs — likely already satisfied; confirm before first `deploy-blog`).
- Bind `blog.nanisoft.com` custom domain to the `nanisoft-blog` Pages project after the first successful deploy.
- Manual smoke: visit `blog.nanisoft.com`, `/engineering`, `/announcements`, and a post; click the cross-site nav links.