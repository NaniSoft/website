# CLAUDE.md

Guidance for Claude Code working in this repository. The app is **nanisoft.com** — a
multilingual documentation + product-landing site built on the Next.js 16 + Nextra 4
starter. It is deployed to **Cloudflare Workers** (via OpenNext) on the custom domain
**www.nanisoft.com**. There is no database / backend at this time.

## Tech Stack & Versions

- Next.js 16, React 19, App Router
- Nextra 4 (`nextra` + `nextra-theme-docs` 4) — MDX docs framework
- Tailwind CSS 4 (CSS-based config, no `tailwind.config.js`)
- TypeScript, Shadcn UI / Radix primitives, Aceternity registry, Iconify, lucide-react
- `next-sitemap` (sitemap + robots), `pagefind` (static search index)
- Node 24+, pnpm 11+ (this repo currently uses pnpm 11 via corepack)

## Commands

```bash
pnpm dev      # next dev --turbopack -p 8000  (local dev server)
pnpm build    # next build  (postbuild also runs next-sitemap + pagefind)
pnpm lint     # eslint --fix .
pnpm start    # next start -p 7000  (production server, not used for Cloudflare)
```

Cloudflare build/deploy scripts (see Deployment below):

```bash
pnpm cloudflare-build   # opennextjs-cloudflare build
pnpm preview            # cloudflare-build && opennextjs-cloudflare preview
pnpm deploy             # cloudflare-build && wrangler deploy
```

For runtime changes, verify with the narrowest useful command — usually `pnpm lint`,
or `pnpm build` when routing/metadata/static params change. `pnpm build` runs the
`postbuild` step (sitemap + pagefind) so it exercises those integrations too.

## Project Structure

```
next.config.ts                 Nextra config + Next i18n (no runtime bindings yet)
src/app/[lang]/layout.tsx      Localized Nextra shell (Navbar/Banner/Search/Footer)
src/app/[lang]/[[...mdxPath]]/page.tsx   Catch-all MDX route
src/app/[lang]/_components/    ThirdPartyScripts (analytics)
src/app/[lang]/styles/         index.css (Tailwind 4 + tokens + Nextra overrides), overrides.css
src/app/_dictionaries/         get-dictionary.ts (dynamic dictionary import)
src/content/en/                English MDX content tree + _meta.tsx (mirroring pattern retained for future locales)
src/i18n/                      index.ts (typed dictionaries), en.ts, ai-demo.ts
src/hooks/                     useServerLocale.ts, useLocale.ts
src/widgets/                   navbar-extras, locale-toggle, theme-toggle, auth-button, mobile-menu-auth
src/components/                HomepageHero, AIDemoLanding, auth/, ui/ (Shadcn), CustomFooter, ...
src/lib/utils.ts               cn() helper
public/                        static assets (img/)
components.json                Shadcn config + Aceternity registry
next-sitemap.config.mjs        siteUrl from SITE_URL, generates robots.txt
wrangler.jsonc                 Cloudflare Worker config (name, main, assets)
open-next.config.ts            OpenNext Cloudflare config (defineCloudflareConfig)
```

Path alias: `@/*` → `src/*` (see `tsconfig.json`).

## Architecture

### Routing & i18n
- `next.config.ts` declares `locales: ['en']`, `defaultLocale: 'en'`, and
  `unstable_shouldAddLocaleToLinks: true` so Nextra links keep their locale prefix.
  A `redirects` rule sends the bare root `/` → `/en` (the default locale).
- The App Router segment `src/app/[lang]` makes language explicit in the URL, so
  English pages live at `/en/...`. The `[lang]` segment and the i18n plumbing are
  retained so a second language can be added later without restructuring routes.
- MDX content lives under `src/content/en`. The **mirroring** pattern (one content
  tree per locale + a paired `_meta.tsx`) is retained: when you add a second
  language, create its tree under `src/content/<lang>` and add the MDX + `_meta.tsx`
  entry in **every** supported language.
- `src/app/[lang]/[[...mdxPath]]/page.tsx` is the catch-all Nextra route.
  `generateStaticParamsFor('mdxPath')` supplies params; `importPage()` loads the
  localized MDX module; `generateMetadata` delegates to MDX page metadata.
- Typed dictionary access: `src/i18n/index.ts` builds `i18nConfig` from the
  registered dictionaries (currently just `en`) with typed dotted keys
  (`NestedKeyOf`), runtime lookup (`getNestedValue`), and `interpolateString`.
  `useServerLocale(lang)` (server) and `useLocale()` (client) return
  `{ currentLocale, t }`.
- Rule: **shared UI copy goes in `src/i18n` dictionaries; long-form page content goes
  in `src/content/{lang}` MDX.** Don't hard-code product copy in components.

### Nextra shell
- `src/app/[lang]/layout.tsx` composes `Layout`, `Navbar`, `Banner`, `Search`,
  `Footer`, `LastUpdated` from `nextra-theme-docs` / `nextra/components`, passing
  localized `pageMap`, `i18n`, `toc`, `lastUpdated`, `footer`, `navbar`, `nextThemes`.
- `_meta.tsx` files control navigation and page-level chrome: `display: 'hidden'`
  for hidden pages, `theme.layout: 'full'` for landing/login pages, plus `toc`,
  `navbar`, `footer`, `timestamp`, `copyPage`. Titles may be React nodes.
- `src/widgets/navbar-extras.tsx` injects locale/theme/auth/mobile-auth widgets.
- Rule: extend the shell through Nextra component props first; reach for DOM
  selectors only when Nextra exposes no slot (e.g. `mobile-menu-auth.tsx`).

### MDX
- `src/mdx-components.ts` is the central MDX component override point (customizes
  code blocks with `Pre` / `withIcons`). Keep route logic thin — build page
  experiences in React components and render them from MDX entries.

### Styling & UI
- `src/app/[lang]/styles/index.css` imports Tailwind 4, Nextra styles, plugins
  (Iconify, typography) and defines `@theme` tokens + Shadcn-compatible CSS vars.
  `@custom-variant dark` makes dark mode follow the `.dark` class.
- `components.json` points Shadcn at that CSS file, aliases `@/components`,
  `@/lib`, `@/components/ui`, `@/hooks`, and registers the Aceternity registry.
- Rule: preserve token names used by Shadcn primitives unless updating all consumers.

### Auth (demo only — replace before production)
- `src/components/auth/login-form.tsx` writes `auth:userEmail` to `localStorage`.
- `src/widgets/auth-button.tsx` reads that key and listens for `storage` +
  custom `auth:changed` events. Components delay user-specific UI until mounted
  to avoid hydration mismatch. Fake Google login uses a timeout + hard-coded email.
- Treat as a UI flow demo. Replace with real sessions/cookies/OAuth before production.

## Common Workflows

- **Add a docs page:** add `.mdx` under `src/content/<lang>/docs` for every
  supported locale (currently only `en`), update the nearest `_meta.tsx`, run
  `pnpm lint` (+ `pnpm build` if routing changed).
- **Add a top-level page:** add localized MDX + `_meta.tsx` records; for full-screen
  product pages set `theme.layout: 'full'`; build UI in `src/components/<Feature>`
  and render from MDX.
- **Add/rename a language:** update `next.config.ts` (`locales`/`defaultLocale`),
  add a dictionary in `src/i18n/`, register it in `i18nConfig`, add the dynamic
  import in `get-dictionary.ts`, mirror the MDX tree + `_meta.tsx` under
  `src/content/<lang>`, add the locale to the Nextra `Layout` `i18n` prop and to
  `LOCALE_META` in `locale-toggle.tsx`. The `LocaleToggle` is locale-list-driven
  (toggles between two locales); replace it with a menu if you support more than two.
- **Add a landing section:** add copy to the dictionary(ies), update copy shapes,
  add a section component near `HomepageHero`/`AIDemoLanding`, keep it responsive
  and dark-mode safe, run `pnpm lint`.
- **Add Shadcn/Radix/Aceternity components:** use existing `components.json` aliases,
  drop primitives in `src/components/ui`, align styling with tokens, prefer lucide
  icons, run `pnpm lint`.
- **Brand/theme/metadata:** edit `layout.tsx` (metadataBase, title, favicon),
  `CustomFooter`, `styles/index.css` tokens, `src/i18n` copy, `public/img/favicon.svg`,
  and set `SITE_URL` in `next-sitemap.config.mjs`.

## Environment

- `SITE_URL` — canonical site URL, used by `next-sitemap.config.mjs` for the sitemap
  and robots. Set to `https://www.nanisoft.com` in production/CI. Locally it lives in
  `.env`; for local Worker dev use `.dev.vars` (copy from `.dev.vars.example`).
- Analytics IDs in `src/app/[lang]/_components/ThirdPartyScripts.tsx` (Google
  Analytics + Baidu) are currently hard-coded starter placeholders — replace or
  remove before production.

## Deployment — Cloudflare Workers (OpenNext)

The site deploys to **Cloudflare Workers** via `@opennextjs/cloudflare` (the modern
unified Cloudflare runtime for Next.js), not the legacy Pages product. CI/CD runs
through `.github/workflows/deploy.yml` (lint + build on PRs, build + `wrangler deploy`
on pushes to `main`).

Required **GitHub repository secrets**:
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token (use the "Edit Cloudflare Workers"
  template). Used by `wrangler deploy` in CI.
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID.

(There is no Supabase / database — the starter template's Supabase env was removed.)

Custom domain **www.nanisoft.com** is configured on the Worker in the Cloudflare
dashboard (Workers & Pages → the worker → Settings → Domains & Routes → add custom
domain). The zone must be on the same Cloudflare account. `SITE_URL` and the Next.js
`metadataBase` are set to `https://www.nanisoft.com`.

Build flow: `pnpm cloudflare-build` runs `opennextjs-cloudflare build`, which
internally runs `pnpm build` (i.e. `next build` **and** the `postbuild` sitemap +
pagefind step) then bundles the Worker into `.open-next/` (gitignored).
`wrangler deploy` uploads the Worker from `.open-next/worker.js` using the config
in `wrangler.jsonc`. OpenNext also requires `open-next.config.ts` in the repo root
(default `defineCloudflareConfig()`).

> **Next.js 16 + middleware caveat:** the Nextra locale `proxy` (`src/proxy.ts`)
> was removed for Cloudflare. Next.js 16 runs the proxy (formerly middleware) on
> the **Node.js runtime only** — the `runtime` config option throws in a proxy
> file — and `@opennextjs/cloudflare` does not support Node.js middleware. In-site
> links already carry a locale prefix (`unstable_shouldAddLocaleToLinks`) and the
> `LocaleToggle` widget switches locales client-side, so navigation is intact; a
> `redirects` rule in `next.config.ts` sends bare `/` → `/en` (the default locale).
> What's lost: automatic `Accept-Language` negotiation. If that's needed later,
> either wait for OpenNext Node-middleware support or implement locale routing as
> a Worker-level hook.
>
> Note: the starter is on Next.js 16. The OpenNext build uses
> `--dangerouslyUseUnsupportedNextVersion` as a guard while OpenNext catches up to
> Next 16. If a future `@opennextjs/cloudflare` release supports Next 16 natively,
> that flag can be removed from the `cloudflare-build` script.

## Gotchas

- **Lint is pre-existing-broken & non-blocking in CI.** `@antfu/eslint-config@8.2.0`
  predates the `eslint-plugin-react-hooks@7.x` rewrite, so the `react-hooks` plugin
  isn't registered and `pnpm lint` errors out. The CI `lint` step is
  `continue-on-error: true`; `pnpm build` still gates. To fix for real, align the two
  (bump `@antfu/eslint-config` to v9, or pin `eslint-plugin-react-hooks` to v5).
- `src/widgets/locale-toggle.tsx` is locale-list-driven (reads registered locales
  from `i18nConfig`; toggles between two, renders nothing with one) and imports the
  internal Next path `next/dist/client/add-base-path`.
- `src/widgets/mobile-menu-auth.tsx` uses DOM selectors against Nextra mobile nav
  markup — recheck selectors when upgrading Nextra.
- Nextra override classes in `src/app/[lang]/styles/index.css` may break when
  Nextra markup changes.
- `pagefind` output (`public/_pagefind`, gitignored) is generated by `postbuild`;
  confirm the deployment target expects it.
- Replace before production: `localStorage` auth, `auth:changed` event, fake Google
  login, static metadata / the `SITE_URL` fallback, and the starter analytics IDs.
  (Repo links already point to `https://github.com/NaniSoft/website` and author/
  copyright attribution to `NaniSoft`; review these if the org/repo changes.)
- Starter-demo content (`src/content/en/docs/index.mdx`, `docs/examples/*`) is
  leftover template demo copy, not nanisoft product content — remove or replace
  when building out real docs.