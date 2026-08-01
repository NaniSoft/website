# CLAUDE.md — nanisoft.com

This file is the **single source of truth** for this repository. It supersedes
and replaces the former upstream README and the `.agents/skills/nextjs-nextra-starter-distill`
distillation skill, both of which have been deleted. If anything in the code
diverges from what is written here, **trust the code**, then update this file.

The site is the **nanisoft company site** — a single-locale (`en`) Next.js 16 +
Nextra 4 documentation / marketing site deployed to **Cloudflare Workers via
OpenNext**. It was repurposed from the upstream `nextjs-nextra-starter`
template; the template's marketing copy, demo auth, and repo links are still
present as placeholders (see [Limitations](#limitations--replace-before-production)).

---

## Tech stack

| Layer           | Choice                                                            |
| --------------- | ----------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack dev)                            |
| Content         | Nextra 4 (`nextra-theme-docs` 4)                                  |
| UI              | React 19, Tailwind CSS 4, Shadcn/Radix, Aceternity                |
| Animation       | `framer-motion` / `motion`, `tailwindcss-animate`                 |
| Particles       | `@tsparticles/*` v4                                               |
| i18n            | Single locale `en` (Nextra i18n + typed dictionary)               |
| Validation      | `zod` (pinned `~4.3.6` — see [Constraints](#version-constraints)) |
| Search          | `pagefind` (postbuild)                                            |
| Sitemap         | `next-sitemap`                                                    |
| Tests           | Vitest + Testing Library (unit), Playwright (E2E)                 |
| Lint            | `@antfu/eslint-config` + layered enterprise plugins               |
| Deploy          | Cloudflare Workers via `@opennextjs/cloudflare`                   |
| Package manager | pnpm 11 (`packageManager: pnpm@11.18.0`)                          |
| Node            | `>=24` (CI uses Node 24)                                          |

---

## Commands

```bash
pnpm dev              # next dev --turbopack -p 8000
pnpm build            # next build (postbuild: next-sitemap + pagefind)
pnpm start            # next start -p 7000 (production server)

pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint .
pnpm lint:fix         # eslint --fix .
pnpm format           # alias of lint:fix (there is NO Prettier)
pnpm format:check     # alias of lint
pnpm test             # vitest (watch)
pnpm test:run          # vitest run (CI / pre-build)
pnpm test:coverage    # vitest run --coverage
pnpm e2e              # playwright test
pnpm e2e:install      # playwright install --with-deps chromium
pnpm check            # typecheck + lint + format:check + test:run (the full local gate)

# Cloudflare (the worker build can't run on Windows without Developer Mode — see Deploy)
pnpm cloudflare-build
pnpm preview          # cloudflare-build + opennextjs-cloudflare preview
pnpm deploy           # cloudflare-build + opennextjs-cloudflare deploy
pnpm cf-typegen       # wrangler types → cloudflare-env.d.ts
```

CI gate (`.github/workflows/deploy.yml`, `verify` job) runs
`typecheck → lint → test:run → build`, then deploys on push to `main`.

---

## Final code structure

```
src/
  app/
    [lang]/                       # single locale segment (en)
      [[...mdxPath]]/page.tsx     # Nextra catch-all MDX route
      _components/ThemeProvider.tsx
      layout.tsx                  # Nextra shell: Navbar/Banner/Search/Footer/LastUpdated
      not-found.ts
      styles/
        index.css                 # Tailwind 4 + tokens + Shadcn vars + Nextra overrides
        overrides.css             # focused global overrides
    _dictionaries/get-dictionary.ts   # dynamic dictionary import + getDirection
  assets/images/                  # hero-tile-dark.svg, hero-tile-light.svg
  components/
    AIDemoLanding/                 # AI SaaS landing page + islands (EntryCard, interactions)
    CustomFooter/
    HomepageHero/                  # homepage hero (Section, Setup, SetupHero.module.css)
    MotionWrapper/                 # FadeIn, Flash (reusable motion wrappers)
    PanelParticles/               # tsparticles v4 wrapper
    ScrollProgressBar/
    ThemeSwitcher/
    TitleBadge/
    auth/                          # demo login (login-form.tsx + login-form.client.tsx)
    ui/                            # Shadcn/Radix + Aceternity primitives
  content/en/                      # localized MDX content tree
    _meta.tsx                      # Nextra nav records + page layout behavior
    index.mdx, introduction.mdx, ai-demo.mdx, login.mdx, upgrade.mdx
    docs/_meta.tsx, docs/index.mdx, docs/i18n.mdx
    docs/examples/{test-tailwind.mdx, theme-update.mdx}
  hooks/                           # getServerLocale, useLocale, useBreakpoint, index
  i18n/                            # index (typed dictionary helpers), en.ts, ai-demo.ts
  lib/                             # utils.ts (+ utils.test.ts)
  mdx-components.ts                # Nextra MDX component overrides (Pre, withIcons)
  test/setup.ts                    # vitest + Testing Library + ts-reset
  types/global.d.ts                # ts-reset side-effect import
  widgets/                         # Nextra navbar extensions: auth-button, mobile-menu-auth,
                                  #   navbar-extras, theme-toggle
```

Root config of note: `next.config.ts`, `tsconfig.json`, `eslint.config.js`,
`.editorconfig`, `vitest.config.ts`, `playwright.config.ts`, `commitlint.config.mjs`,
`.lintstagedrc.json`, `next-sitemap.config.mjs`, `postcss.config.mjs`,
`open-next.config.ts`, `wrangler.jsonc`, `pnpm-workspace.yaml`, `components.json`.

---

## Architecture

### Routing and Nextra shell

- `next.config.ts` wraps the Next config with `createWithNextra` and declares
  the single locale (`locales: ['en']`, `defaultLocale: 'en'`).
- `src/app/[lang]/layout.tsx` is the localized Nextra shell. It awaits
  `params`, resolves `lang`, builds the Nextra `pageMap` via `getPageMap(lang)`,
  and composes `Layout`, `Navbar` (with `<NavbarExtras />`), `Banner`,
  `Search`, `Footer` (with `<CustomFooter />`), `LastUpdated`, and a global
  `<Toaster />`. `dir` comes from `getDirection(lang)` (`'ltr'` for `en`).
- `src/app/[lang]/[[...mdxPath]]/page.tsx` is the catch-all Nextra MDX route.
  `importPage` loads localized MDX content/TOC/metadata; `useMDXComponents`
  wraps pages with the theme.
- `src/app/[lang]/_components/ThemeProvider.tsx` mounts `next-themes`.
- There is **no** Nextra locale proxy/middleware: it is incompatible with
  OpenNext (see [Deploy](#deploy)). The apex `/` → `/en` redirect is a
  `redirects()` rule in `next.config.ts`, which OpenNext supports.

### Content and navigation

- `src/content/en/` is the only content tree (single-locale). `_meta.tsx`
  files drive Nextra navigation and page-level layout (`theme.layout: 'full'`
  for full-screen pages like home / `ai-demo` / `login`).
- `src/mdx-components.ts` customizes MDX (code blocks via `Pre`, `withIcons`).

### i18n

- `src/i18n/index.ts` exports the typed dictionary system: language key
  types, nested-key typing, path lookup, and interpolation.
- `src/i18n/en.ts` holds UI copy; `src/i18n/ai-demo.ts` shapes AI-landing copy.
- `src/hooks/getServerLocale.ts` → server-side typed `t()` (async, awaits the
  dictionary). `src/hooks/useLocale.ts` → client-side `t()` via `useParams`.
- `src/app/_dictionaries/get-dictionary.ts` dynamically imports the dictionary
  and exports `getDirection`.

### Styling

- `src/app/[lang]/styles/index.css` imports Tailwind 4, Nextra docs styles,
  Tailwind plugins, Iconify, typography; defines design tokens, dark-mode
  variant behavior, Shadcn-compatible CSS variables, and Nextra override
  classes. `overrides.css` holds focused global overrides.
- `components.json` points Shadcn at `index.css`, aliases UI paths, registers
  the Aceternity registry.

### UI and product surfaces

- `HomepageHero` — homepage experience. `AIDemoLanding` — AI SaaS landing page
  and interactive islands. `auth/` — demo login. `widgets/` — Nextra navbar
  extensions (locale is single, so no locale toggle). `components/ui/` —
  Shadcn/Radix + Aceternity primitives. `MotionWrapper`, `PanelParticles`,
  `ScrollProgressBar`, `TitleBadge`, `CustomFooter`, `ThemeSwitcher` are
  reusable presentation pieces.

---

## Extension guide

Always inspect current source before editing. Verify with `pnpm lint`;
add `pnpm build` when routing, static params, or metadata change.

### Add a docs page

1. Add the `.mdx` under `src/content/en/docs` (+ the relevant subfolder).
2. Add/update the nearest `_meta.tsx` entry so the page is navigable.
3. Use shared React components (from `src/components`) only when the page
   needs interactive or repeated UI.
4. Keep reusable UI copy in `src/i18n/en.ts`, not inline in MDX.

### Add a top-level page (e.g. a product page)

1. Create the `.mdx` under `src/content/en/` and a `_meta.tsx` record.
2. For full-screen pages set `theme.layout: 'full'` and decide `toc`,
   `navbar`, `footer`, `timestamp`.
3. Build the page UI in `src/components/<FeatureName>` and render it from MDX.
4. `pnpm build` to exercise static params/metadata.

### Add a landing-page section

1. Add copy fields to `src/i18n/en.ts` (and `ai-demo.ts` if changing the AI
   demo copy shape) — update the TypeScript copy shapes when needed.
2. Add a small section component near `HomepageHero` / `AIDemoLanding`.
3. Keep it responsive and preserve dark-mode classes; stay on the existing
   token system. `pnpm lint`.

### Add / rename a language (currently single-locale)

Touch **all** of: `next.config.ts` (`i18n.locales`), `src/i18n/index.ts`,
`src/i18n/<lang>.ts`, `src/app/_dictionaries/get-dictionary.ts`,
`src/app/[lang]/layout.tsx` (the `i18n=[...]` array), `src/content/<lang>/`
(mirror MDX + `_meta.tsx`), `src/widgets/*`. Do **not** re-add a Nextra
locale proxy (incompatible with OpenNext — see Deploy). With >2 locales,
replace the simple locale UI with a menu.

### Add Shadcn / Radix / Aceternity components

1. Use the existing aliases from `components.json`.
2. Add primitives under `src/components/ui`.
3. Keep styling aligned with existing tokens. Prefer `lucide-react` for icons
   where a match exists; use Iconify classes for brand/stack icons that
   already follow the project pattern. `pnpm lint`.

### Customize brand / theme / navigation / footer / metadata

Touch `layout.tsx`, `CustomFooter/index.tsx`, `styles/index.css`,
`src/i18n/en.ts`, `public/img/favicon.svg`, `next-sitemap.config.mjs`.
Update `metadataBase`, title, description, favicon, canonical; adjust CSS
variables/tokens; update footer links. Set the production `SITE_URL`.

Common mistakes: leaving demo URLs / analytics IDs / the upstream repo
link; changing token names Shadcn components depend on.

### Update search / sitemap / deployment

1. Confirm whether `pagefind` output (`public/_pagefind`) belongs in the
   deploy artifact.
2. Set the production `SITE_URL`.
3. `pnpm build` to exercise `postbuild` (next-sitemap + pagefind).

---

## Tooling and config decisions

### Lint: antfu, no Prettier, layered enterprise plugins

- **Kept `@antfu/eslint-config`**; there is **no Prettier**. antfu's stylistic
  rules ARE the formatter (`format` / `format:check` alias `eslint --fix .` /
  `eslint .`). Do not add Prettier later without re-deciding — it would
  reformat the whole repo.
- antfu already bundles equivalents of unicorn, perfectionist/sort,
  unused-imports, import-x, typescript-eslint, react, react-hooks. We layer
  on the genuinely complementary plugins (registered in a separate appended
  flat-config object so their rule namespaces resolve):
  **`sonarjs`** (code smells), **`security`** (unsafe patterns),
  **`promise`** (async hygiene), **`boundaries`** (architecture). Rule sets
  are **curated**, not each plugin's full `recommended` (security/sonarjs
  recommended are noisy; several sonarjs rules need type-info and would break
  the build).
- **Rule severity split:** correctness + debug-footgun rules are `error`
  (the build fails on them) — `no-console`, `no-debugger`, `no-alert`,
  `no-eval`, `no-param-reassign`, `unused-imports/no-unused-vars`,
  `react-hooks/rules-of-hooks`. Noisy heuristics stay `warn` so they surface
  without forcing changes that could alter rendering/animation:
  `react-hooks/exhaustive-deps`, `react/no-array-index-key`, the `sonarjs`
  smell rules, `security/detect-*`, `promise/valid-params`, `boundaries/*`.
- **`react-hooks` plugin** is registered explicitly (antfu@9 does NOT
  register it; ESLint 10 hard-fails with "could not find plugin react-hooks"
  otherwise). antfu fuses `plugins` into the same config object as `rules`.
- **`@eslint-react` ships every rule under the `react` namespace** (DOM =
  `react/dom-*`, hooks-extra = `react/*`). The `react-dom/*` /
  `react-hooks-extra/*` namespaces some configs use do not exist and are
  silent no-ops — use the real rule ids.
- **boundaries v7 gotchas:** the rule is `boundaries/dependencies` (not the
  deprecated `element-types`); selectors are nested objects
  `{ element: { type: 'lib' } }` / `{ element: { types: { anyOf: [...] } } }`;
  element descriptors use `partialMatch: false` (not the deprecated `mode`).
  The default policy is `allow` and only explicit disallows fire (as `warn`);
  `lib` / `i18n` are leaves and must not climb into `app`/`components`/`hooks`,
  and `hooks` must not climb into `app`.
- `next-env.d.ts` is in `ignores` — Next 16 rewrites its `import` line on
  every dev/build, so linting it is pure churn.
- **`security/detect-unsafe-regex` false-positives** are disabled inline with
  a justification at `src/components/AIDemoLanding/interactions.tsx` and
  `src/i18n/index.ts`. Do NOT globally weaken the rule; add a scoped
  `eslint-disable-next-line` for genuine false positives.

### TypeScript: enterprise strictness, no behavior risk

`tsconfig.json` enables `strict` plus `noImplicitReturns`,
`noFallthroughCasesInSwitch`, `noImplicitOverride`, `noUnusedLocals`,
`noUnusedParameters`, `forceConsistentCasingInFileNames`,
`verbatimModuleSyntax` (with `isolatedModules`), `target: ES2022`. We
**intentionally do NOT** enable `noUncheckedIndexedAccess` or
`exactOptionalPropertyTypes` — both generate heavy null-check churn and the
`?.` / `??` defaults they imply can subtly alter UI behavior. antfu's
`ts/consistent-type-imports` auto-fixes the `import type` surface that
`verbatimModuleSyntax` requires (`eslint --fix`).

### Git hooks and commit conventions

- **Husky 9** (`core.hooksPath → .husky/_` shims; `.husky/_/.gitignore` is
  `*` — shims are generated, not committed): `pre-commit` runs
  `pnpm typecheck && pnpm lint-staged`; `commit-msg` runs
  `pnpm exec commitlint --edit "$1"` (Conventional Commits via
  `@commitlint/config-conventional`).
- `lint-staged` (`.lintstagedrc.json`) runs `eslint --fix` on
  `*.{ts,tsx,js,jsx,mjs,cjs}`.
- **Vitest is NOT in the pre-commit hook** — it's CI-gated (`test:run` in the
  verify job). `vitest.config.ts` has `passWithNoTests: true` so `pnpm test`
  succeeds before any spec exists.
- `@total-typescript/ts-reset` is imported once in `src/types/global.d.ts`
  (applies to the whole TS program) and again in `src/test/setup.ts` for tests.

### Playwright

CI-aware: local uses `pnpm dev` (port 8000); CI uses `pnpm start` (port 7000)
because `next dev` triggers the OpenNext dev init which needs wrangler
bindings. The `e2e` job runs only on PRs so it never blocks the push-to-main
deploy path. Install browsers: `pnpm e2e:install`.

---

## Version constraints

Do not blindly re-bump past these (discovered 2026-08-01):

- **TypeScript stays on 5.9.x, NOT 7.x.** TS 7.0's native ("go") rewrite breaks
  Nextra's twoslash toolchain (`Cannot read properties of undefined
(reading 'readFile')` on every MDX page). Keep `^5.9.3` until Nextra/twoslash
  publish TS-7-compatible versions.
- **`zod` pinned `~4.3.6`.** nextra@4.6.1 requires `zod: ^4.1.12`, but 4.4.x
  added stricter `nonoptional` validation that rejects the `children` value
  nextra passes → every page 500s at build. No newer nextra exists. Re-test by
  removing the override when nextra next releases.
- **`@tsparticles/*` is v4.** v3's `initParticlesEngine` is gone. `PanelParticles`
  wraps `<Particles>` in `<ParticlesProvider init={async engine => loadFull(engine)}>`
  (init stable via `useCallback([])`). `loadFull` (from `tsparticles`) and
  `ISourceOptions` (from `@tsparticles/engine`) are unchanged in v4.
- **pnpm 11 build-script gating.** `pnpm build`'s preflight re-runs
  `pnpm install`, which **fails on ignored build scripts**. Keep the
  `allowBuilds:` map in `pnpm-workspace.yaml` (`esbuild`, `workerd`, `sharp`,
  `@tsparticles/engine`, `@parcel/watcher`, `unrs-resolver`) `true`. pnpm
  `overrides:` live in `pnpm-workspace.yaml` — `pnpm.overrides` in
  `package.json` is no longer read.
- **pnpm 11 supply-chain trust policy.** `trustPolicy: no-downgrade` rejects
  packages whose publish-time provenance is weaker than an earlier version.
  Two deep transitives had no provenance while a newer version does, so they
  hard-fail; overrides pin to provenance-having versions
  (`eslint-import-resolver-typescript: 4.4.5`, `semver: 7.8.5`). Going forward,
  adding any dep may re-trigger this — fix by overriding that package to a
  provenance-publishing version, **never** by relaxing the policy.
- **CI actions must be node-24 majors** to avoid the Node 20 deprecation
  warning: `actions/checkout@v5`, `actions/setup-node@v5`,
  `pnpm/action-setup@v6` (no `version` key — resolved from
  `packageManager`). `engines.node` = `>=24.x`.

---

## Deploy

The site deploys to **Cloudflare Workers via `@opennextjs/cloudflare`**
(worker name `nanisoft`, see `wrangler.jsonc`). The GitHub Action runs
`pnpm build` (verify gate) then `pnpm run deploy` =
`pnpm cloudflare-build && opennextjs-cloudflare deploy` on `ubuntu-latest`.

Two non-obvious gotchas:

1. **The Nextra locale proxy is incompatible with OpenNext** (re-checked
   against `@opennextjs/cloudflare@1.20.2`). `nextra/locales` middleware runs
   on the Node.js runtime; Next.js 16 renamed `middleware`→`proxy`, made
   proxy default to the Node.js runtime, and forbids `runtime: 'edge'` in
   proxy config; OpenNext does not support Node.js middleware. Fix (kept):
   no proxy file; the `/`→`/en` redirect is a `redirects()` rule in
   `next.config.ts`. This is the correct single-locale Nextra setup, not a
   workaround. Do **not** re-add `nextra/locales` proxy or `runtime: 'edge'`.
2. **`opennextjs-cloudflare build` fails locally on Windows** with
   `EPERM: symlink` (Windows lacks symlink privileges unless Developer
   Mode/admin is enabled). It does NOT affect the Ubuntu CI.
   `pnpm build` (plain next build) passes locally and is the CI gate. To
   verify the worker build locally, enable Developer Mode or use WSL.

---

## Limitations & replace-before-production

The site was repurposed from the upstream `nextjs-nextra-starter` template.
The following are demo/placeholder values that must be replaced before this
is a real production site:

- **Demo auth.** `src/components/auth/login-form*` uses `localStorage` and an
  `auth:userEmail` key / `auth:changed` custom event as the auth mechanism,
  with a fake Google login and a hard-coded demo email. Replace with a real
  provider/session model (cookies, server revalidation, route protection).
- **Placeholder metadata.** `layout.tsx` still ships `title = 'My Nextra
Starter'`, a generic description, `docsRepositoryBase` and the `repo`
  constant pointing at `https://github.com/pdsuwwz/nextjs-nextra-starter`,
  and a hard-coded canonical `https://www.nanisoft.com`. Replace with real
  brand metadata, repo, and canonical.
- **`SITE_URL` fallback.** `next-sitemap.config.mjs` falls back to
  `https://example.com` when `SITE_URL` is unset. CI sets
  `SITE_URL=https://www.nanisoft.com`; ensure it is set wherever `postbuild`
  runs.
- **Analytics.** Any analytics IDs (Google Analytics / Baidu) referenced by
  the template are project-specific — keep only what belongs to nanisoft.
- **DOM-coupled widgets.** `src/widgets/mobile-menu-auth.tsx` selects against
  Nextra mobile-nav markup; recheck selectors when upgrading Nextra.
- **Nextra override classes** in `src/app/[lang]/styles/index.css` may break
  when Nextra markup changes — re-verify on Nextra upgrades.
- **Disclaimer.** This template is a technical reference. Dependent
  frameworks (Next.js/Nextra/Tailwind) carry version-iteration risk;
  third-party components (e.g. Shadcn UI) follow their upstream repos; and
  environment changes can cause build exceptions. Users must run their own
  security audits and production validation, and accept responsibility for
  consequences of use or modification.

---

## Do / don't

- **Do** verify with `pnpm check` (and `pnpm build` when routing/metadata
  changes) before committing.
- **Do** keep UI copy in `src/i18n/en.ts`, not inline in MDX.
- **Do** preserve Nextra, locale, theme, and MDX integration points unless
  explicitly asked to replace them.
- **Don't** add Prettier, re-enable `noUncheckedIndexedAccess`/
  `exactOptionalPropertyTypes`, or globally weaken `security/detect-unsafe-regex`.
- **Don't** re-add a Nextra locale proxy / `runtime: 'edge'` in proxy config.
- **Don't** bump TypeScript to 7.x or `zod` past 4.3.x (see Constraints).
- **Don't** copy the demo auth, placeholder analytics, static metadata, or
  upstream product copy into production without replacing them.
- **Don't** "restore" `AICyberCarousel`, `feat/cyber-knowledge-hub`, or a
  "branding package" — that work was intentionally discarded when the repo
  history was reset to the Nextra-starter-based app.
