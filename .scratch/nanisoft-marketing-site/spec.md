# Nanisoft marketing site

Type: spec
Status: ready-for-agent

## Problem Statement

The site at `nanisoft.com` is a single-locale (`en`) Nextra 4 marketing/product
site for **Nanisoft**, a company that builds the cybersecurity tools large
organizations otherwise build in-house — filling the gaps enterprise security
suites leave uncovered. Today the codebase is still the repurposed
`nextjs-nextra-starter` template: placeholder brand metadata (`"My Nextra
Starter"`, the upstream repo URL), a demo auth flow, template docs/examples, an
`ai-demo` page, and a `"What's New"` page of starter-template release notes. The
homepage renders only a hero; there is no products surface, no blog, no about
page, no real contact path, and no real changelog. A visitor cannot learn what
Nanisoft sells, who it is for, how to get in touch, or what has shipped.

We need to replace the template shell with a real marketing anatomy — kept on
the existing dark-first theme, tsparticles, motion wrappers, and customized
components — that presents the Nanisoft suite, earns trust, captures leads, and
reads as a confident, understated cybersecurity company site, with no fabricated
logos, metrics, people, or account URLs.

## Solution

Keep the Nextra 4 / Next.js 16 App Router architecture and the existing
dark-first theme, `PanelParticles`, `MotionWrapper`, tokens, and Shadcn/Aceternity
UI primitives. Build the marketing site **on top of** Nextra (homepage = a
`layout:'full'` MDX page composing React section components). Remove all demo
content. Add real brand metadata. The homepage composes: an animated **Hero**
(SVG graph visualization with one highlighted path, text-left/graph-right split),
a **trust strip** of industry-segment badges, a category-grouped **Products**
grid, a 4-card **Services** section, a **Get in touch** contact form, and a
**Recommended reading** blog teaser. New pages: `/en/products`, `/en/blog` (with
4 seed posts), `/en/about` (minimal), and `/en/changelog` (renamed from
`/en/upgrade`). The navbar gains a grouped **Products mega-menu**, Blog, About,
Contact, a GitHub icon, and a **dark-default** theme toggle. The footer carries
flagship product links, Resources (Press Kit), Company (About/Blog), and
env-configured social links. The contact form submits same-origin to an in-app
Next.js route handler that verifies a Cloudflare Turnstile token and delivers
via Resend, with `mailto:` fallback when unprovisioned. Single-locale `en` stays;
the `/`→`/en` redirect stays.

## User Stories

1. As a first-time visitor, I want to land on a homepage that immediately tells
   me what Nanisoft does, so that I know within seconds whether it is relevant
   to me.
2. As a first-time visitor, I want the homepage headline to name the flagship
   products (Atlas, Bedrock, Keystone), so that I understand what the suite is
   anchored by.
3. As a first-time visitor, I want the hero to show an animated graph of "every
   path into a system" with one path highlighted, so that the value proposition
   ("see every path before someone else does") is communicated visually.
4. As a first-time visitor, I want the hero to include a clear primary CTA
   ("Explore the Platform"), so that I know where to go next.
5. As a security buyer in a regulated industry, I want to see a trust strip
   naming the industry segments Nanisoft is built for (Financial Services,
   Healthcare, Critical Infrastructure, Government, Retail), so that I know
   the tooling is aimed at environments like mine.
6. As a security engineer, I want to browse a Products grid grouped by the five
   categories (Core, Ingestion, Query & Traversal, Interfaces, Platform &
   Trust), so that I can understand the full suite at a glance.
7. As a security engineer, I want each product card to show a name and a
   one-line description, so that I can scan 21 products without reading pages.
8. As a security engineer, I want each product card to link to a dedicated
   products page anchored to that product, so that I can jump to detail.
9. As a security engineer, I want the homepage products grid to be collapsible
   by category, so that the page stays dense and readable.
10. As an IT decision-maker, I want a Services section offering Assessment,
    Implementation, Managed Operation, and Open Source Support, so that I know
    Nanisoft offers more than tools.
11. As an IT decision-maker, I want each service card to carry a one-line
    description and a short checklist, so that I can compare services quickly.
12. As a prospective customer, I want a "Get in touch" section with a contact
    form (name, email, notes), so that I can request more information.
13. As a prospective customer, I want the contact form to validate my input
    inline, so that I am told about errors before submitting.
14. As a prospective customer, I want the contact form to be protected by
    Cloudflare Turnstile, so that I am not competing with bots for attention.
15. As a prospective customer, I want a clear success state after submitting
    the contact form, so that I know my message was received.
16. As a prospective customer, I want a clear error state with a `mailto:`
    fallback if delivery fails, so that I can still reach Nanisoft when the
    form is broken or unprovisioned.
17. As a returning visitor, I want a "Recommended reading" section surfacing the
    latest blog posts, so that I can catch up on Nanisoft's thinking.
18. As a visitor, I want a `/en/products` page holding the full 21-product,
    category-grouped grid with anchor navigation, so that I can study the suite
    in depth.
19. As a visitor, I want the Products navbar item to be a grouped mega-menu by
    the five categories, so that I can jump to a category or product from any
    page.
20. As a visitor, I want a `/en/blog` index listing all posts in
    reverse-chronological order, so that I can browse Nanisoft's writing.
21. As a visitor, I want to read 4 seed blog posts authored "Nanisoft Team",
    so that the blog is not empty on launch and demonstrates its format.
22. As a visitor, I want each blog post to have a title, description, date, and
    author, so that I can judge relevance before reading.
23. As a visitor, I want a `/en/about` page with an origin-story paragraph and a
    "more coming" note, so that I understand who Nanisoft is without fabricated
    people or team photos.
24. As a visitor, I want a `/en/changelog` page (renamed from `/en/upgrade`,
    labeled "Changelog") with one inaugural "Introducing Nanisoft" entry, so
    that I can see what has shipped and the format future entries will follow.
25. As a visitor, I want the Changelog reachable from the footer, so that it is
    discoverable without crowding the main nav.
26. As a visitor, I want the navbar logo to read "Nanisoft" (no emoji), so that
    the brand is presented cleanly.
27. As a visitor, I want the site's browser title and meta description to reflect
    Nanisoft's real positioning, so that search and social shares look real.
28. As a visitor, I want a dark-default theme that I can toggle, so that the
    site opens in the dark-first aesthetic it is designed for.
29. As a visitor, I want a GitHub icon in the navbar linking to the real
    Nanisoft GitHub, so that I can find the source.
30. As a visitor, I want a footer with flagship product links (Atlas, Bedrock,
    Keystone, Compass, Sentinel, Meridian), a Resources group (Press Kit), a
    Company group (About, Blog), and social links, so that I can navigate from
    the bottom of any page.
31. As a visitor, I want any social link that Nanisoft has not configured to be
    omitted rather than shown as a broken icon, so that the footer never shows
    dead links.
32. As a developer/operator, I want all social, contact, and Turnstile values
    to be env-configured with graceful omission/fallback when unset, so that
    the site never ships broken before provisioning is complete.
33. As a developer/operator, I want the contact form to submit same-origin to
    an in-app route handler deployed with the existing Cloudflare Worker, so
    that there is no separate service to build or operate.
34. As a developer/operator, I want the contact route handler to verify the
    Turnstile token server-side and deliver via Resend, so that submissions are
    bot-protected and actually arrive.
35. As a developer/operator, I want secrets (Turnstile secret, Resend key,
    from/to addresses) to live as Cloudflare Worker secrets, so that they never
    enter the repo or the GitHub Action.
36. As a developer/operator, I want the contact endpoint to return a unified
    `{status, message}` contract, so that the client feedback layer is one
    shared handler.
37. As a maintainer, I want the Changelog and blog to be driven by typed data
    modules (not per-entry MDX sprawl), so that the lists stay sortable and the
    homepage can surface "latest" deterministically.
38. As a maintainer, I want the homepage "Recommended reading" to be the first
    four blog entries from the blog data module, so that it stays current
    without manual curation.
39. As a maintainer, I want demo auth, the `ai-demo` page, template docs, and
    the `introduction` page removed, so that the site carries only real
    Nanisoft content.
40. As a maintainer, I want the existing theme, particles, motion wrappers,
    tokens, and Shadcn/Aceternity primitives preserved, so that the new
    marketing surfaces blend with the established look and feel.
41. As a maintainer, I want the `/`→`/en` redirect and single-locale `en`
    routing preserved, so that the deploy stays OpenNext-compatible.
42. As a mobile visitor, I want the homepage to stack to a single column (copy
    then graph, then sections) and the Products mega-menu to work inside
    Nextra's mobile nav, so that the site is usable on a phone.

## Implementation Decisions

### Architecture

- **Keep Nextra; build marketing on top.** The homepage remains a
  `layout:'full'` MDX page composing React section components. Do not remove the
  theme, `PanelParticles`, motion wrappers, tokens, or customized components.
- **No new locale infrastructure.** Single-locale `en` stays; the `/`→`/en`
  `redirects()` rule stays; no Nextra locale proxy is re-added (OpenNext-
  incompatible per `CLAUDE.md`).
- **No new infra for the contact backend.** The contact form submits
  same-origin to an in-app Next.js route handler deployed with the existing
  `nanisoft` Cloudflare Worker via OpenNext — no separate utils Worker.

### Template content removal / repurposing

- Remove: template docs examples, `ai-demo` page + its landing component
  wiring, demo `login`/`auth` flow + the navbar auth widgets, `introduction`
  page.
- Repurpose: the `/en/upgrade` route becomes `/en/changelog`; the "What's New"
  label + `TitleBadge` become "Changelog"; it moves from main nav to footer.
- Fresh main nav: **Products (mega-menu) / Blog / About / Contact**.

### Homepage composition (top to bottom)

1. **Hero** — text-left / animated-SVG-graph-right two-column split (stacks
   single-column on mobile). Copy (placeholder pending polish): headline "See
   Every Path Into Your Systems Before Someone Else Does"; a flagship pill
   "Atlas, Bedrock, Keystone"; a one-sentence subtext; a primary CTA "Explore
   the Platform" → `/en/products`. The headline and the highlighted graph path
   share the blue (`#3b82f6`) → purple (`#a855f7`) → pink (`#f472b6`) accent
   gradient so they read as one idea. `PanelParticles` sits behind the split
   content as a full-bleed layer (particles are the hero's _exclusive_ ambient
   moment — no particles elsewhere). Graph = a system-paths mesh (nodes:
   ingress / identity / network / service / api / edge / data / repo / asset)
   with one highlighted path ingress→identity→service→data→asset drawn in via
   `pathLength`; hot nodes spring in staggered and glow; alternate edges are
   dimmed. Built with `MotionWrapper`/framer-motion idioms. (Non-interactive
   for now; interactivity is a sharpen-later fog item.)
2. **Trust strip** — industry-segment **badges** (Financial Services, Healthcare,
   Critical Infrastructure, Government, Retail), framed as "built for teams in
   environments like these." Not a logo marquee — no fabricated logos. Compact
   inline row form.
3. **Products grid** — collapsible `<details>` per the five categories (Core,
   Ingestion, Query & Traversal, Interfaces, Platform & Trust), cards = name +
   one-line description linking to `/en/products#anchor`. 21 products total, no
   product logos.
4. **Services** — 4 cards (Assessment / Implementation / Managed Operation /
   Open Source Support), name + one line + a short checklist, `cols=4`.
5. **Get in touch** — rounded panel: heading + copy on one side, the contact
   form on the other (see Contact form).
6. **Recommended reading** — the first 4 entries from the blog data module
   (`allBlogs.slice(0, 4)`), as link cards.

- Below the hero, sections sit on a plain background in a single dense
  `max-w-5xl` column. The accent gradient carries the signature down the page
  quietly (accent dots, headline clip, primary CTA) — no second particles
  layer.

### New pages

- **`/en/products`** — one page holds the full 21-product, category-grouped grid
  with `#category` and `#product` anchor navigation. No per-product detail pages
  this phase; cards anchor within this page.
- **`/en/blog`** — Nextra blog under the content tree, driven by a typed data
  module (mirrors the blog data-module pattern for consistency). Seed 4 posts
  authored "Nanisoft Team", grounded in the real framing (no fabricated metrics).
  Blog index lists reverse-chronologically.
- **`/en/about`** — minimal: origin-story paragraph + a one-line "more coming"
  note. No roadmap section, no fabricated people, no team photos.
- **`/en/changelog`** — renamed from `/en/upgrade`. Driven by a typed data
  module (`{ date, title, summary, body }`, reverse-chronological array) + a
  `Changelog` component (mirrors the blog data-module pattern for consistency).
  Inaugural entry: author "Nanisoft Team", title "Introducing Nanisoft", date
  2026-08-03, framing = problem (custom in-house gap-fillers) → approach (one
  cohesive suite) → first chapter (Core trio + 4 categories, 21 products) →
  "more coming" (no fabricated metrics/dates/customers). Footer-linked, not
  main-nav.

### Navbar / theme / footer

- **Navbar:** grouped **Products mega-menu** by the five categories, linking to
  `/en/products#category` and `#product` anchors; plus Blog, About, Contact; a
  GitHub icon; and a **dark-default** theme toggle. `nextThemes.defaultTheme`
  changes from `'system'` to dark-default. (Mobile behavior of the mega-menu
  inside Nextra's mobile nav is a sharpen-during-implementation item.)
- **Footer:** flagship product links (Atlas, Bedrock, Keystone, Compass,
  Sentinel, Meridian); a Resources group (Press Kit); a Company group (About,
  Blog); env-configured social links. Any unset social link is omitted, not
  shown broken.
- **Brand metadata:** title and nav logo = `Nanisoft` (drop emoji and "My Nextra
  Starter"). Description / og:description = "Nanisoft builds the cybersecurity
  tools that large organizations otherwise build in-house — filling the gaps
  left by enterprise security suites." `repo` / `docsRepositoryBase` /
  `NEXT_PUBLIC_GITHUB_URL` = `https://github.com/nanisoft`. Canonical +
  `metadataBase` + `SITE_URL` keep `https://www.nanisoft.com`. Favicon stays the
  starter triangle (branded favicon deferred pending a real brand mark).
  og-image left unset this phase. Competitor names omitted from meta/copy for
  now.

### Contact form (client)

- **react-hook-form + zod** (reuses the pinned `zod ~4.3.6`; no formik/yup) on
  the existing Shadcn form primitives. Schema = `{ name, email, notes }` — the
  Turnstile token is **not** a modeled field; it is read at submit time from
  the Turnstile-injected hidden `cf-turnstile-response` input and rides along
  in the POST payload.
- **Turnstile (client):** raw `<div class="cf-turnstile" data-sitekey={env}>` +
  Cloudflare's script loaded once. No Turnstile React lib. Sitekey env-gated via
  `NEXT_PUBLIC_TURNSTILE_SITEKEY`: unset → widget not rendered (contact form
  still posts to the in-app route; server skips verification).
- **Feedback layer:** reuse `sonner` (`toast.success/error`) against the existing
  global `<Toaster position="top-center" />`. No `react-hot-toast`, no
  `react-confetti`.
- **Submit contract:** POST JSON to `NEXT_PUBLIC_CONTACT_ENDPOINT`
  (`/api/contact-us`, same-origin). Payload `{ name, email, notes,
'cf-turnstile-response': token }`. Unified response shape
  `{ status: 'success' | 'error', message: string }` → one shared response
  handler drives toasts + inline states.
- **Degradation:** when `NEXT_PUBLIC_CONTACT_ENDPOINT` is unset, the form falls
  back to a `mailto:` link prefilled with name/email/notes. On error response,
  show the inline message plus a `mailto:` link.

### Contact form (server)

- An in-app Next.js route handler (`/api/contact-us`) deployed with the existing
  `nanisoft` Cloudflare Worker via OpenNext. It: verifies the Turnstile token
  server-side (when a sitekey/secret is configured), delivers via **Resend**, and
  returns the unified `{ status, message }` contract. When the Turnstile
  sitekey/secret are unset, verification is skipped (the form still works). When
  Resend secrets are unset, the handler returns `error`.
- **Secrets** = Cloudflare Worker secrets (`wrangler secret put` against
  `nanisoft`): `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_ADDRESS`,
  `CONTACT_TO_ADDRESS`. Public vars in `wrangler.jsonc` `vars`:
  `NEXT_PUBLIC_TURNSTILE_SITEKEY` (empty until provisioned), and
  `NEXT_PUBLIC_CONTACT_ENDPOINT = /api/contact-us`. (The `wrangler.jsonc` slots
  and the `.dev.vars.example` local-dev mirror — test Turnstile sitekey
  `1x00000000000000000000AA`, always passes — are already committed.)
- **Net-new dependency: exactly one — `react-hook-form`.** `zod` reused,
  `sonner` reused, Shadcn primitives reused. Rejected: formik, yup,
  react-hot-toast, react-confetti, any Turnstile React lib.

### Env var map

| Var                                                                          | Scope                            | Unset behavior                                 |
| ---------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITEKEY`                                              | public (`wrangler.jsonc` `vars`) | widget not rendered; server skips verification |
| `NEXT_PUBLIC_CONTACT_ENDPOINT`                                               | public                           | `mailto:` fallback                             |
| `TURNSTILE_SECRET_KEY`                                                       | CF Worker secret                 | contact returns error                          |
| `RESEND_API_KEY`                                                             | CF Worker secret                 | contact returns error                          |
| `RESEND_FROM_ADDRESS`                                                        | CF Worker secret                 | contact returns error                          |
| `CONTACT_TO_ADDRESS`                                                         | CF Worker secret                 | defaults to `RESEND_FROM_ADDRESS`              |
| `NEXT_PUBLIC_GITHUB_URL` / `_LINKEDIN_URL` / `_DISCORD_URL` / `_YOUTUBE_URL` | public                           | that icon/link omitted                         |

### Constraints honored

- TypeScript stays 5.9.x (not 7). `zod` pinned `~4.3.6`. `@tsparticles/*` v4.
  pnpm 11 `allowBuilds` respected. No Prettier. No Nextra locale proxy / no
  `runtime: 'edge'`. Demo auth removed (not re-added). Verify with
  `pnpm check` and `pnpm build` (routing/metadata/static-params change).

## Testing Decisions

A good test here tests **external behavior** (inputs → observable outputs,
contracts, ordering, degradation), never implementation details (markup shape,
class names, animation timing). Visual fidelity of the hero/sections/nav is
governed by the frontend-design review, not by automated DOM assertions — we do
not add component-render tests that couple to markup. Two seams, both reusing
existing infrastructure (no new seam type):

### Seam 1 — Vitest unit, at the `src/lib` seam (existing `utils.test.ts`)

Pure logic and contracts, mocked side effects:

- **Products data module:** 21 products group into exactly the 5 categories;
  every product resolves a stable `/en/products#anchor` slug; the mega-menu
  grouping derivation matches the grid grouping.
- **Changelog data module:** entries are reverse-chronological; the inaugural
  "Introducing Nanisoft" entry is present with the agreed title/date/author and
  the four framing sections.
- **Blog data module:** posts are reverse-chronological; 4 seed posts exist,
  authored "Nanisoft Team"; titles/descriptions satisfy the SEO length rules
  mirrored from the blog data-module pattern.
- **Recommended reading:** `allBlogs.slice(0, 4)` returns the 4 most-recent posts
  in order.
- **Contact zod schema:** accepts valid `{name,email,notes}`; rejects empty
  name, invalid email, missing fields with the right error paths.
- **Contact route handler** (`/api/contact-us`) with Turnstile `fetch` and the
  Resend client mocked: returns `{status:'success', message}` on a valid token
  - successful Resend send; returns `{status:'error', ...}` when Turnstile
    verification fails; returns `{status:'error', ...}` when Resend fails; skips
    verification and still succeeds when the sitekey/secret are unset (degradation);
    returns `{status:'error', ...}` when Resend secrets are unset. Asserted at the
    handler boundary with no real network and no real email.

### Seam 2 — Playwright e2e (existing suite, `pnpm start` port 7000)

External page/form behavior:

- Homepage renders hero + all six sections; the primary CTA links to
  `/en/products`.
- `/en/products`, `/en/blog`, `/en/about`, `/en/changelog` return 200 and render
  expected top-level content; `/en/changelog` shows the inaugural entry.
- Navbar Products mega-menu groups + anchors resolve; Blog/About/Contact links
  resolve; GitHub icon links to the configured org and is omitted when unset.
- Footer flagship product links, Resources, Company, and social links resolve;
  unset social links are absent.
- Contact form: with the test Turnstile sitekey configured, a valid submission
  renders the success toast + inline "thank you" panel; an error response
  renders the error toast + inline `mailto:` fallback. With the sitekey unset,
  the Turnstile widget is absent and the form still posts to the in-app route.
- The `/`→`/en` redirect holds.

Prior art: `src/lib/utils.test.ts` (Vitest unit) and the existing Playwright
suite (e2e against `pnpm start`). No Testing Library render tests, no MSW.

## Out of Scope

- Real authentication / session model (demo auth removed; a marketing site needs
  none).
- Multi-locale / i18n expansion (single-locale `en` stays).
- Flattening URLs to clean `/` (keep `/en` locale root).
- Per-product detail pages (cards anchor within one `/en/products` page this
  phase).
- Real blog content beyond the 4 "Nanisoft Team" seed posts.
- Real team/founders content or team photos (About is minimal).
- Fabricated client logos, testimonials, usage metrics, customer names, or
  account URLs (never — industry-segment badges instead).
- A Cloudflare og-image worker (static og image this phase; og-image left unset
  pending a real brand mark).
- Branded favicon (deferred pending a Nanisoft brand mark; starter triangle
  stays).
- **Newsletter signup (deferred 2026-08-02).** The newsletter section, the
  `/api/newsletter-subscribe` route, and Beehiiv provisioning are removed from
  this effort. May return as a fresh effort if the destination is redrawn; do
  not resume the newsletter half of the form/backend decisions.
- Restoring discarded `AICyberCarousel` / `feat/cyber-knowledge-hub` /
  "branding package" work (per `CLAUDE.md`).
- Final copy polish for the 21 product one-liners and the 4 blog seed posts
  (graduates after the products/blog data modules exist).
- Hero graph interactivity (hover/click to highlight or drill) — the chosen
  variant is non-interactive; interactivity sharpens during implementation.
- Mobile behavior of the Products mega-menu inside Nextra's mobile nav
  (graduates during nav build).
- Whether Nextra Search appears on the marketing homepage (confirm during nav
  build; lean: keep, on-theme).

## Further Notes

- **Positioning locked for downstream copy:** Nanisoft builds cybersecurity
  tools that fill the gaps left by large enterprise security suites
  (authentication, authorization, endpoint, VPN, network security) — the tools
  large organizations otherwise build as custom in-house solutions. Competitor
  names are omitted from meta/copy for now.
- **Tone:** technical, confident, understated. No hype adjectives. Business-
  focused — describe what each product does and why it matters, not how it is
  built.
- **Reference codebase:** `guild-website/` (gitignored) mirrors structure/
  behavior/visual approach for forms, mail, layouts, and components — but
  implementation stays in our stack (Next 16 App Router, Nextra 4, Tailwind 4,
  Shadcn/Radix, our tokens, `MotionWrapper`, `PanelParticles`). Do not import
  `@theguild/components`. New components must blend with the existing look and
  feel.
- **Provisioning status (contact backend):** the four CF Worker secrets are set
  on `nanisoft` (values not recorded). `NEXT_PUBLIC_CONTACT_ENDPOINT` is wired.
  `NEXT_PUBLIC_TURNSTILE_SITEKEY` is the one value still pending — the `vars`
  slot exists but is empty; dropping it in is a fill-in-the-blank, not an open
  decision. The site works without it.
- **Fog carried into implementation (verify during build):** OpenNext/Cloudflare
  compatibility of new client components, the blog routes, and the
  `/api/contact-us` route handler. Route handlers on the Workers runtime are
  standard OpenNext support; verify at `pnpm build` / `pnpm preview`.
- **Issue tracker note:** Issues and specs for this repo live as local markdown
  under `.scratch/<feature-slug>/` per `docs/agents/issue-tracker.md` (set up
  2026-08-03). The `ready-for-agent` triage state is recorded as the `Status:`
  line at the top of this file; the five canonical role strings live in
  `docs/agents/triage-labels.md`.
- **Prototype branches captured:** the full hero-graph 3-variant prototype lives
  on throwaway branch `prototype/hero-graph`; the marketing-sections 3-variant
  prototype on `prototype/marketing-sections`. Both are reference-only; the
  winning visual language (Variant A in each) is recorded in the resolved
  tickets and folded into this spec.
