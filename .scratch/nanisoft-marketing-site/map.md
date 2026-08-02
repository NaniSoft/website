# Wayfinder map — Nanisoft marketing site

## Destination

The spec for the Nanisoft marketing/product website: a single-locale (`en`) Nextra 4
(App Router) site that **keeps the existing dark-first theme, tsparticles, motion
wrappers, and customized components**, and adds **the-guild.dev's marketing anatomy on
top**. Homepage composes: Hero (graph visualization with a highlighted path), an
industry-segment trust strip, a category-grouped Products grid, a 4-card Services
section, Get in touch, Recommended reading. Plus pages: `/en/products`,
`/en/blog` (+4 seed posts), `/en/about` (minimal), `/en/changelog`. A Nextra navbar with
a grouped **Products mega-menu**, Blog, About, Contact, a GitHub icon, and a
**dark-default** theme toggle. A footer with flagship product links, Resources (Press
Kit), Company (About/Blog), and env-configured social. Copy is
business-focused; **no fabricated logos, metrics, people, or account URLs.**

The way is clear when the six frontier decisions/prototypes resolve and the spec is
ready to hand to implementation.

> **Spec ready** — [spec.md](./spec.md) (`Status: ready-for-agent`). Synthesizes the
> destination + all six settled tickets into one implementation handoff. Published as
> local markdown per `docs/agents/issue-tracker.md` (set up 2026-08-03).

## Notes

- **Skills every session should consult:** `frontend-design:frontend-design` (visual
  fidelity; new sections must blend with the existing theme), `mattpocock-skills:grilling`
  - `mattpocock-skills:domain-modeling` (working decision tickets),
    `mattpocock-skills:prototype` (prototype tickets).
- **Reference codebase:** `guild-website/` (the actual the-guild.dev source; gitignored
  at `/guild-website/`). Mirror its structure/behavior/visual approach for forms, mail,
  layouts, and components — but **implement in OUR stack** (Next 16 App Router, Nextra 4,
  Tailwind 4, Shadcn/Radix, our tokens, `MotionWrapper`, `PanelParticles`). Do **not**
  import `@theguild/components` (their internal kit; wrong stack). New components must
  blend with the existing look and feel.
- **Honor `CLAUDE.md` constraints:** TS 5.9 (not 7), `zod` ~4.3.6, `@tsparticles/*` v4,
  pnpm 11 `allowBuilds`, no Prettier, no Nextra locale proxy, no re-add of demo auth.
  Verify with `pnpm check` and `pnpm build` when routing/metadata change.
- **No fabrication:** no company logos, testimonials, usage numbers, real people, or
  account URLs. Use env-configured values with graceful omission/fallback when unset.
- **Locale:** single-locale `en` stays; marketing home at `/en`; the `/`→`/en` redirect
  stays. Do not flatten to clean `/`.
- **Tone:** technical, confident, understated. No hype adjectives. Business-focused —
  describe what each product does and why it matters, not how it's built.

### Settled spec (from destination-naming grilling, not tickets)

1. **Architecture:** keep Nextra, build marketing on top (homepage = `layout:'full'` MDX
   composing React section components). Don't remove theme/particles/colors/custom
   components.
2. **Template content:** remove all demo content (docs examples, `ai-demo`, demo
   `login`/`auth`, `introduction`); repurpose `upgrade`/"What's New" into a real
   Changelog. Fresh nav: Products (dropdown) / Blog / About / Contact.
3. **Product surface:** one `/en/products` page holds the full 21-product,
   category-grouped grid. Cards are link-cards (name + one line) anchoring within that
   page. No per-product pages this phase. Homepage shows the same grid as a section.
4. **Products dropdown:** grouped mega-menu by the 5 categories (Core, Ingestion,
   Query & Traversal, Interfaces, Platform & Trust), linking to `/en/products#category`
   and `#product` anchors.
5. **Flagship:** hero line names **Atlas, Bedrock, Keystone** (Core trio). Footer
   flagship 6 = Atlas, Bedrock, Keystone, Compass, Sentinel, Meridian.
6. **Blog:** Nextra blog under `src/content/en/blog/`; `lib/all-blogs.ts`-style data;
   seed 4 posts authored **"Nanisoft Team"**, grounded in the real framing (no fabricated
   metrics). "Recommended reading" = `allBlogs.slice(0, 4)`.
7. **Contact form:** mirror guild's `ui/get-in-touch-section.tsx` pattern (validated
   form, Cloudflare Turnstile, success state) → env-configured endpoint; `mailto:`
   fallback when unset. Exact stack + backend = tickets 03/04.
8. **Newsletter:** ~~mirror guild's `ui/components/newsletter.tsx` (Beehiiv-style, toast)
   → env-configured endpoint; graceful state when unset.~~ **DEFERRED** (2026-08-02) — see
   Out of scope. The newsletter section, the `/api/newsletter-subscribe` route, and Beehiiv
   provisioning are removed from this effort for now; may return as a fresh effort if the
   destination is redrawn to include it.
9. **Hero visual:** custom animated SVG graph component (nodes + edges + one highlighted
   path in the accent gradient, framer-motion/MotionWrapper). Not guild's tabbed
   switcher. Fidelity = ticket 01.
10. **Routing:** keep `/en` locale root.
11. **Social:** env-configured (`NEXT_PUBLIC_GITHUB_URL`, `_LINKEDIN_URL`, `_DISCORD_URL`,
    `_YOUTUBE_URL`); omit any that are unset.
12. **About:** minimal — origin story paragraph + a one-line "more coming" note. No
    roadmap section, no fabricated people.

## Decisions so far

- [Hero graph visualization prototype](issues/01-hero-graph-prototype.md) — **Variant A "Split" wins**: text left, animated SVG graph right; blue->purple->pink accent gradient on the highlighted path + headline; graph = system-paths mesh with one highlighted ingress->identity->service->data->asset route (draws in via pathLength, hot nodes glow); PanelParticles behind; two-column, stacks on mobile. Full 3-variant prototype on branch `prototype/hero-graph`.
- [Marketing sections + particles placement prototype](issues/02-sections-and-particles-prototype.md) — **Variant A "Hero-only particles, compact editorial" wins**: PanelParticles behind the hero ONLY; sections below on plain bg in a single dense max-w-5xl column (trust-strip row -> collapsible products <details> -> services 4-up -> get-in-touch -> newsletter). Particles are the hero's exclusive ambient moment; the blue->purple->pink accent gradient carries the signature down the page quietly. Trust strip = segment BADGES not logos. Full 3-variant prototype on branch `prototype/marketing-sections`.
- [Form stack: mirror guild (formik+yup) or our stack (rhf+zod)](issues/03-form-stack-decision.md) — **react-hook-form + zod** for the contact form (reuses pinned zod; no formik/yup); **newsletter stays a raw `<form>`** with a zod email check (mirrors guild's asymmetry); **reuse `sonner`** for feedback (no react-hot-toast); **no confetti**; **raw Turnstile widget** (no Turnstile lib, token read at submit, sitekey env-gated); **unified `{status,message}` response contract** to env-configured endpoints with `mailto:`/coming-soon fallbacks. Net-new deps: exactly one — `react-hook-form`. Unblocks ticket 04.
- [Contact form backend provisioning](issues/04-backend-provisioning.md) — **Self-hosted in-app: `src/app/api/contact-us/route.ts`** on the existing `nanisoft` CF Worker via OpenNext (no separate utils Worker; zero new infra). Server-side Turnstile verify → **Resend** delivery → ticket-03 `{status,message}` contract. Secrets (Turnstile secret, Resend key, from/to addresses) set as CF Worker secrets via `wrangler secret put`; `NEXT_PUBLIC_CONTACT_ENDPOINT=/api/contact-us` + empty `NEXT_PUBLIC_TURNSTILE_SITEKEY` slot in `wrangler.jsonc` `vars`; `.dev.vars.example` committed (test sitekey). Newsletter half deferred (Out of scope). One value pending: the public Turnstile sitekey — fill-in-the-blank, non-blocking, no re-open needed.
- [Brand metadata + real links](issues/05-brand-metadata-and-links.md) — title + nav logo = **`Nanisoft`** (drop emoji); description = _"Nanisoft builds the cybersecurity tools that large organizations otherwise build in-house — filling the gaps left by enterprise security suites"_; `repo` / `docsRepositoryBase` / `NEXT_PUBLIC_GITHUB_URL` all = **`https://github.com/nanisoft`**; canonical + `metadataBase` + `SITE_URL` keep `https://www.nanisoft.com`; favicon stays the starter triangle + og-image left unset — both **deferred pending a real Nanisoft brand mark** (no fabricated logo); competitor names omitted from meta/copy for now. Positioning locked for downstream copy: gap-filling cyber tools that replace custom in-house builds.
- [Changelog seed](issues/06-changelog-seed.md) — launches with **one inaugural post**, not empty. Route `/en/upgrade` → **`/en/changelog`**, nav label **"Changelog"** (drop "What's New" + `TitleBadge`), **footer-linked, not main nav**. Structure = **data module + component** (`src/lib/changelog.ts` typed reverse-chronological array `{ date, title, summary, body }` + a `Changelog` component, mirroring the blog's `all-blogs.ts`). Inaugural entry: author **"Nanisoft Team"**, title **"Introducing Nanisoft"**, date **2026-08-03**, framing = problem (custom in-house gap-fillers) → approach (one cohesive suite) → first chapter (Core trio + 4 categories, 21 products) → "more coming" (no fabricated metrics/dates/customers).

## Not yet specified

- Final copy polish for the 21 product one-line descriptions and the 4 blog seed posts
  (graduates after the products/blog data modules exist).
- Mobile behavior of the Products mega-menu inside Nextra's mobile nav (graduates during
  nav build).
- Whether/how Nextra Search appears on the marketing homepage (lean: keep, on-theme) —
  confirm during nav build.
- Performance/bundle impact of new deps — **cleared**. Ticket 03 rejected react-confetti,
  react-hot-toast, formik+yup; the only client additions are `react-hook-form` (small) and
  the Turnstile script (loaded once, only when `NEXT_PUBLIC_TURNSTILE_SITEKEY` is set). Ticket
  04 chose in-app route handlers, which add **zero** client bundle. No perf/bundle fog left.
- OpenNext/Cloudflare compatibility of new client components, the blog's routes, and the
  contact API route handler (`/api/contact-us`) — verify during build. Route handlers on
  the Workers runtime are standard OpenNext support; verify at build.

- Whether the hero graph is interactive (hover/click nodes to highlight or drill) or purely decorative — sharpens when hero implementation begins; the Variant A prototype is non-interactive.

## Out of scope

- Real authentication / session model (demo auth removed; a marketing site needs none).
- Multi-locale / i18n expansion (single-locale `en` stays).
- Flattening URLs to clean `/` (keep `/en` locale root).
- Per-product detail pages (cards anchor within one `/en/products` page this phase).
- Real blog content beyond the 4 "Nanisoft Team" seed posts.
- Real team/founders content or team photos (About is minimal).
- Fabricated client logos, testimonials, or usage metrics (never — industry-segment
  badges instead).
- A Cloudflare og-image worker (static og image this phase).
- Newsletter signup (deferred 2026-08-02 — was Settled spec #8; the newsletter section,
  `/api/newsletter-subscribe` route, and Beehiiv provisioning are dropped from this effort
  for now). May return as a fresh effort if the destination is redrawn to include it; do
  not resume ticket 04's newsletter half.
- Restoring discarded `AICyberCarousel` / `feat/cyber-knowledge-hub` / "branding
  package" work (per `CLAUDE.md`).
