# Navigation redesign + About-us page + Nextra blog & docs sites

**Date:** 2026-08-27
**Status:** Approved (design)
**Scope:** Landing nav redesign, `/about-us` page with contact form, two new Nextra sites (docs + blog) under `docs.nanisoft.com` and `blog.nanisoft.com`.

## Context

The monorepo is a pnpm workspace (`apps/*` + `packages/*`) on Next 16.3.1 / React 19.2.8 / TS 6.0.3, deployed per-app to Cloudflare Workers via OpenNext from CI on push to `main`. Today `apps/landing` is a single-route marketing site; its nav (`components/TopNav.tsx`) holds three in-page anchors (Platform, Use cases, Integrations) and a "Open the playground" pill that is the site's only commercial ask (also present in FinalCTA, UseCases, Footer). There is no blog, docs, MDX, or content infrastructure.

The reference for the About/Contact pattern is the-guild.dev (About Us + Contact as separate routes on the main domain); here they become **sections within a single `/about-us` page** on the landing site, per requirement.

### Key compatibility constraint

Nextra 4.6.1 (Dec 2025) supports **Next.js 16.0.x–16.1.x with webpack only**; Turbopack is broken and **16.2.x+ is not supported by any Nextra release** ([issue #5003](https://github.com/shuding/nextra/issues/5003)). Nextra v5 is pre-alpha. Because the new blog/docs apps are separate workspace apps with their own `package.json`, they pin to a Nextra-compatible Next version while `apps/landing` and `apps/playground` stay on 16.3.1.

## Decision: Nextra static export on Cloudflare Pages (Approach B)

Docs and blog are static content sites. They use Nextra's `output: 'export'` deployed to **Cloudflare Pages** with custom domains, rather than OpenNext Workers. This avoids the unproven OpenNext + webpack + Nextra-on-Next-16 combination and keeps ops light. The playground remains a Worker because it is interactive; docs/blog do not need a server runtime.

Rejected alternatives:
- **A — Nextra + OpenNext Workers:** one deploy mechanism, but OpenNext + webpack + Nextra on Next 16 is unproven and needs a spike; heavier infra for static content.
- **C — Fumadocs on Next 16.3.1 + OpenNext:** no version drift but violates the stated "Nextra" requirement and lacks a first-class blog template.

## Workstreams

WS1 (landing) ships independently. WS2 (docs) and WS3 (blog) are independent of each other. Nav links to docs/blog activate in the same PR that deploys each site (or point at a "coming soon" stub until then).

### WS1 — Landing: nav + about-us + contact form

**Navigation redesign — `apps/landing/components/TopNav.tsx`**
- Remove the "Open the playground" `PillButton` from the header ask cluster; keep `ThemeToggle`. The playground pill remains in FinalCTA, UseCases, and Footer (unchanged).
- Replace the flat `NAV_ITEMS` with a structure rendered via antd `Dropdown`:
  - **Product ▾** → Platform (`#platform`), Use cases (`#use-cases`), Integrations (`#integrations`) — in-page anchors, smooth-scroll preserved.
  - **Docs ▾** → Documentation (`https://docs.nanisoft.com`), White papers (`https://docs.nanisoft.com/white-papers`).
  - **Blog** → `https://blog.nanisoft.com`.
  - **About us** → `/about-us`.
  - **Contact us** → `/about-us#contact`.
- External links open in a new tab with `rel="noopener noreferrer"`.

**About-us page — `apps/landing/app/about-us/page.tsx`**
- Composes, in order: **Our story / mission** → **What we do / capabilities** → **Open source / community** → **Contact** (`#contact`). Built with the same antd + `@nanisoft/identity` tokens as the homepage sections. No team/people section.

**Contact form + Worker route**
- New landing-app server route `apps/landing/app/api/contact/route.ts` (POST), running in the **existing landing OpenNext worker** (no new worker).
- Fields: name, email, message, plus a honeypot. Validated with zod. Honeypot + basic rate limiting; success/error surfaced inline via antd `message`.
- On submit: store the row in a **Cloudflare D1** binding (`CONTACT_DB`) and notify via **Resend** (`RESEND_API_KEY` env) to a configured inbox.
- Bindings + vars added to `apps/landing/wrangler.jsonc`. A protected `/admin/submissions` read path is out of scope for now (later work).

### WS2 — Docs site — `apps/docs` (Nextra)
- `nextra@4.6.1` + `nextra-theme-docs@4.6.1`, **Next 16.0.x/16.1.x + webpack** (no Turbopack), `output: 'export'`.
- `_meta.json` top-level doc sections plus a `white-papers/` subsection whose MDX entries are the white papers.
- Seeded with the theme example content + one placeholder white paper, ready to replace.
- Deployed to **Cloudflare Pages**, custom domain `docs.nanisoft.com` (DNS added once, like playground).

### WS3 — Blog site — `apps/blog` (Nextra)
- `nextra@4.6.1` + `nextra-theme-blog@4.6.1`, same Next/webpack/export setup as docs.
- `content/` MDX posts; seeded with the template example + one real "hello" post.
- Deployed to **Cloudflare Pages**, custom domain `blog.nanisoft.com`.

### Cross-site nav & shared brand
- Each Nextra site's navbar is configured through its own theme config (Nextra owns its navbar) to render: **nanisoft wordmark → nanisoft.com**, then Docs, Blog, About, Contact.
- We **share link config, not a React component** — the sites run different Next versions, so a shared component risks version mismatch. The link list lives in `@nanisoft/identity` (or a tiny shared json) and each site renders it through its own theme.
- `@nanisoft/identity` tokens (petrol/bone/teal/jade palette + Satoshi typography) are injected into each Nextra site's CSS + theme config so docs/blog read as the same brand. Light touch: override colors/fonts, keep Nextra's layout.

### Deploy & CI
- `apps/blog` and `apps/docs` added (covered by `apps/*` workspace). Each has a wrangler Pages config and a `cloudflare-build` script producing the static `out/` directory.
- `.github/workflows/deploy.yml` adds `deploy-blog` and `deploy-docs` jobs (Cloudflare Pages, on push to `main`, gated on `verify`). The `CLOUDFLARE_API_TOKEN` secret's scope must cover Pages.
- Landing worker gains D1 + Resend bindings.

## Open risks / spikes (confirm first in the plan)

1. **Spike 1 (Nextra build):** confirm Nextra 4.6.1 builds with `output: 'export'` on the highest Next patch it supports (try 16.1.x, fall back to 16.0.x). Track [issue #5003](https://github.com/shuding/nextra/issues/5003) for 16.2+ support.
2. **Security advisory in 16.0.x** (patched in 16.2.5): mitigated for docs/blog because they are **static exports** with no server runtime to exploit.
3. **Spike 2 (contact route):** confirm D1 + Resend work on the existing landing OpenNext worker for the contact route.
4. **Custom domains** `blog.nanisoft.com` / `docs.nanisoft.com` added to Pages manually (one-time, like playground).

## Phasing

1. WS1 — nav + about-us + contact form (landing). Ships independently.
2. WS2 — docs site + Docs/White-papers nav links.
3. WS3 — blog site + Blog nav link.