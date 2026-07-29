# NaniSoft Cybersecurity Knowledge Hub — Redesign Spec

Date: 2026-07-29
Status: Approved-for-implementation (goal-directed)

## Goal

Redesign the template landing page into a cybersecurity knowledge hub. The site
will publish articles, blogs, courses, tutorials, and whitepapers across security
subdomains (IAM, Application Security, Network Security, Governance, etc.), with a
featured AI×Cyber axis split into **AI for Cyber** and **Cyber for AI**. An About page
frames NaniSoft as a credible senior-practitioner collective offering vCISO / control
setup / AI-era defense advisory engagements.

## Constraints

- Stick to Nextra's built-in layout and theme. **No new custom React components.**
  Landing, About, and section pages are native Nextra MDX using built-in
  `Cards`, `Card`, `Callout` from `nextra/components`. Nav is configured purely via
  `_meta.tsx`. This keeps Next.js/Nextra upgrades painless.
- Single locale (`en`) — i18n plumbing retained but only English populated.
- `pnpm lint` is pre-existing-broken (react-hooks plugin not registered); `pnpm build`
  is the verification gate (it also runs the postbuild sitemap + pagefind step).

## Decisions (from brainstorming)

1. **Content depth**: real polished copy for the landing page and About; section and
   subdomain category pages get short coherent placeholder stubs.
2. **Nav taxonomy**: by content type — `Blog · Courses · Whitepapers · AI×Cyber · About`,
   with subdomains nested under each content section.
3. **About**: org-only (mission, approach, service framing, contact CTA). No individual bios.
4. **Landing**: pure native Nextra MDX (no custom hero component).
5. **Cleanup**: remove all template leftovers — ai-demo, introduction, docs/examples,
   login, HomepageHero, AIDemoLanding, auth components, ai-demo dictionary.

## New content tree

```
src/content/en/
├── _meta.tsx                 top-level nav (Home hidden; 5 visible sections)
├── index.mdx                 landing — native MDX, full layout
├── about.mdx                 org-only About
├── blog/
│   ├── _meta.tsx             IAM · Application Security · Network Security · Governance
│   ├── index.mdx             section intro
│   ├── iam/index.mdx         stub
│   ├── app-security/index.mdx        stub
│   ├── network-security/index.mdx    stub
│   └── governance/index.mdx          stub
├── courses/                  same shape as blog (4 subdomain stubs)
├── whitepapers/
│   ├── _meta.tsx
│   └── index.mdx             section intro (no subdomain split yet)
├── ai-cyber/
│   ├── _meta.tsx             AI for Cyber · Cyber for AI
│   ├── index.mdx             section intro explaining the split
│   ├── ai-for-cyber/index.mdx    stub
│   └── cyber-for-ai/index.mdx    stub
```

## Top-level `_meta.tsx`

- `index`: `type: 'page'`, `display: 'hidden'`, `theme: { layout: 'full', toc: false,
  timestamp: false, copyPage: false }` (keeps current full-bleed landing).
- `blog`, `courses`, `whitepapers`, `ai-cyber`, `about`: `type: 'page'` with display
  titles. These five appear in the navbar.
- Section `_meta.tsx` files order + title the subdomain children
  (`iam: 'IAM'`, `app-security: 'Application Security'`, etc.).

## Landing page (`index.mdx`)

Native MDX, `theme.layout: 'full'`. Sections:

1. **Hero** — NaniSoft wordmark + tagline (cybersecurity knowledge for the AI era) +
   one-line subtitle covering articles/courses/whitepapers, the four domains, and AI×Cyber.
2. **What you'll find here** — `<Cards>` row linking Blog, Courses, Whitepapers, AI×Cyber.
3. **AI×Cyber split** — two `<Card>`/`<Callout>` blocks: *AI for Cyber* (using AI to
   detect/defend/respond) and *Cyber for AI* (securing models, agents, data pipelines).
4. **Coverage** — short list/cards of IAM, Application Security, Network Security, Governance.
5. **CTA** — link to About (engage NaniSoft for vCISO / control setup) + "Start reading".

## About page (`about.mdx`)

Native MDX, org-only:

- **Mission** — democratize cybersecurity knowledge; help orgs stand up controls and
  navigate AI-era threats.
- **Approach / what we believe** — practitioner-first, AI-aware, governance-grounded.
- **Services framing** — vCISO engagement, security control setup & implementation,
  AI-era defense advisory, program design. Tone: credible senior practitioners.
- **Contact CTA** — placeholder email + GitHub link.

## Dictionary (`src/i18n/en.ts`) cleanup

- `systemTitle`: `🚀 My Nextra Starter` → `NaniSoft`.
- `banner`: rewrite to a cyber-relevant one-liner.
- Remove now-unused keys (consumed only by deleted components/pages):
  `featureList`, `homeEnhance`, `faqs`, `aiDemo`, `auth`, `badgeTitle`, `featureSupport`,
  `getStarted`.
- Keep: `search`, `themeSwitcher`, `lastUpdated`, `pageTitle`, `backToTop`.

## `layout.tsx` + footer

- Update the hard-coded og `title`/`description` to NaniSoft cyber metadata.
- `CustomNavbar` logo reads `t('systemTitle')` → updates via dictionary.
- `CustomFooter` already shows NaniSoft + CC + toggles → leave as-is.
- Remove the no-op `BaiduTrack`.

## Deletions

- `src/content/en/introduction.mdx`, `login.mdx`, `ai-demo.mdx`, `docs/` subtree.
- `src/components/HomepageHero/`, `src/components/AIDemoLanding/`, `src/components/auth/`.
- `src/i18n/ai-demo.ts`.
- Confirm staged removal of already-deleted `auth-button.tsx`, `mobile-menu-auth.tsx`.

## Section/category stubs

Each subdomain `index.mdx`: a short heading + one sentence on what the category covers +
a `<Callout>` "No articles published yet — check back soon." Coherent but clearly placeholder.

## Branding (light)

- Replace `public/img/favicon.svg` with a simple shield-themed favicon (pure SVG).
- OG image: deferred (future task).

## Verification

- `pnpm build` to confirm routes, `_meta`, and static params resolve (postbuild runs
  sitemap + pagefind). Lint is pre-existing-broken and not a gate.