# WS2 — Nextra docs site (docs.nanisoft.com, incl. white papers) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a new `apps/docs` workspace app — a Nextra docs site (`nextra-theme-docs@4.6.1` on Next 16.1.7 + webpack, `output: 'export'`) whose content includes a `white-papers/` subsection, branded with the nanisoft petrol/bone/teal/jade identity, deployed to Cloudflare Pages at `docs.nanisoft.com`.

**Architecture:** `apps/docs` is a standalone Next 16.1.7 App-Router app in the pnpm workspace, separate from `apps/landing` (Next 16.3.1) and `apps/playground` (Next 16.3.1). Nextra wraps the config; the root layout is **async** and passes `pageMap={await getPageMap()}` from `nextra/page-map` (Nextra 4.6.1 has no `pageMap` default and rejects `logo`/`project` props). The `nextra-theme-docs@4.6.1` `Layout` has a Zod bug (#5008) that crashes every page at prerender — fixed by a committed `pnpm patch` that re-includes `children` before `safeParse`. Brand is injected by overriding Nextra's CSS variables in a `globals.css` mapped from `@nanisoft/identity` tokens (same petrol/bone/teal/jade + Satoshi typography as the landing), plus a `next/font/local` Satoshi loader (font files copied from `apps/landing/app/fonts`). A shared cross-site nav link list is added to `@nanisoft/identity` and rendered through the docs theme's `navbar` prop. Deploy is `wrangler pages deploy out` (static export), wired as a `deploy-docs` CI job gated on `verify`.

**Tech Stack:** Next.js 16.1.7 (App Router, **webpack only**), React 19.2.8, Nextra 4.6.1 + nextra-theme-docs 4.6.1, MDX, `@nanisoft/identity` (workspace:*), `next/font/local`, Cloudflare Pages (wrangler 4), TypeScript 6.0.3.

## Global Constraints

- **Pinned versions (from Spike 1 — use exactly):** `next@16.1.7`, `react@19.2.8`, `react-dom@19.2.8`, `nextra@4.6.1`, `nextra-theme-docs@4.6.1`. **Do NOT use Next 16.2.x+** (Nextra issue #5003 — unsupported, "metadata export through client wrapper" error). 16.0.x is the fallback if 16.1.7 fails for a reason not seen in the spike. The landing and playground apps stay on 16.3.1 — a different Next pin per workspace app is fine in pnpm.
- **Mandatory config:** `next.config.mjs` must be `nextra()` wrapping `{ output: 'export', images: { unoptimized: true } }` — `images.unoptimized` is mandatory for static export. Build/dev scripts must force **webpack**: `next build --webpack` / `next dev --webpack` (Next 16 defaults to Turbopack; Nextra breaks on Turbopack).
- **`mdx-components.tsx` is required at the app root** — it exports `useMDXComponents` merging the theme's default components. Without it the build fails `Can't resolve 'next-mdx-import-source-file'`.
- **#5008 patch is mandatory:** `nextra-theme-docs@4.6.1`'s `dist/layout.js` does `({ children, ...themeConfig } = t0)` then `LayoutPropsSchema.safeParse(themeConfig)`, but the strict Zod schema requires `children` + `pageMap`, so every page crashes at prerender (`Invalid input: expected nonoptional, received undefined → at children`). Fix via `pnpm patch nextra-theme-docs` changing `safeParse(themeConfig)` → `safeParse({ children, ...themeConfig })`. Productionize as a committed `patches/nextra-theme-docs@4.6.1.patch` + `pnpm.patchedDependencies` in `apps/docs/package.json`. **Never hand-edit `node_modules`** — the patch file is the source of truth and must be committed.
- **4.6.1 Layout props:** `logo` and `project` are NOT valid `Layout` props (the schema rejects them). `pageMap` has no default — the layout MUST be async and pass `pageMap={await getPageMap()}`. Valid config keys: `sidebar`, `docsRepositoryBase`, `navbar`, `footer`, `banner`, `nextThemes`, `toc`, `search`, `editLink`, `feedback`, `navigation`, `i18n`, `lastUpdated`. Confirm the `navbar` prop's exact shape against the installed theme's `dist/schemas.js` (`LayoutPropsSchema`) before relying on it — Spike 1 confirmed the key exists but did not exercise it.
- **Brand tokens come from `@nanisoft/identity`** (petrol/bone/teal/jade + Satoshi). Jade (`--color-accent`) is live/active only — never decorative. No purple, no neon, no pure black, no pure white (ink is near-black petrol `#102A30`; bone is off-white `#F4EFE6`). Override Nextra's CSS variables (`--nextra-primary`, `--nextra-bg`, `--nextra-text`, etc. — confirm the exact names against the installed theme's CSS) to these values in `globals.css`; keep Nextra's layout, only recolor/reglyph. Shape lock: card 20 / inner 12 / buttons pill.
- **Deploy target is Cloudflare Pages (static `out/`), NOT the OpenNext Worker path** used by landing/playground. The docs app has no server runtime. `wrangler pages deploy out --project-name nanisoft-docs`. The custom domain `docs.nanisoft.com` is added in the Cloudflare dashboard (one-time, manual — same as playground).
- **Before writing Next.js code**, read the relevant guide in `apps/docs/node_modules/next/dist/docs/` (per the AGENTS.md convention — this is Next 16 with breaking changes). Do not strip any AGENTS.md warning block from diffs.
- **The landing `NAV` constant already points** `Documentation` → `https://docs.nanisoft.com` and `White papers` → `https://docs.nanisoft.com/white-papers` (set in WS1). Those URLs are correct for this site; do not touch `apps/landing` in this plan.
- Each task ends with a green build (`next build --webpack` produces `out/`) where the task changes the build, and a commit. Keep commits scoped to one task.

---

## File Structure

- `apps/docs/package.json` — new; workspace app `@nanisoft/docs`, pinned deps, `pnpm.patchedDependencies` for the #5008 patch.
- `apps/docs/tsconfig.json` — new; strict TS, `@/*` path alias to the app root, `jsx: react-jsx`, target/lib for Node 24.
- `apps/docs/next.config.mjs` — new; `nextra()` wrapping `{ output: 'export', images: { unoptimized: true } }`.
- `apps/docs/mdx-components.tsx` — new; `useMDXComponents` merging theme defaults.
- `apps/docs/app/layout.tsx` — new; async root layout: `getPageMap()` + themed `Layout` + Satoshi font + brand globals import.
- `apps/docs/app/globals.css` — new; brand CSS variable overrides mapped from `@nanisoft/identity` onto Nextra's theme vars.
- `apps/docs/app/page.mdx` — new; docs home page.
- `apps/docs/app/index.meta` — see `_meta.json` (Nextra uses `_meta.json` per directory).
- `apps/docs/app/_meta.json` — new; top-level nav: index + docs sections + `white-papers` (type `folder`/`menu`).
- `apps/docs/app/getting-started.mdx`, `apps/docs/app/architecture.mdx` — new; seeded doc pages.
- `apps/docs/app/white-papers/_meta.json` — new; white-paper entries.
- `apps/docs/app/white-papers/access-twin.mdx` — new; one placeholder white paper.
- `apps/docs/app/not-found.tsx` — new; plain 404 (no `Layout`) so `/_not-found` prerenders (without it the static export omits `404.html`).
- `apps/docs/app/fonts/*.woff2` — copied from `apps/landing/app/fonts/` (Satoshi family).
- `apps/docs/eslint.config.mjs` — new; flat config (lints `.ts`/`.tsx`, ignores `.mdx`).
- `apps/docs/patches/nextra-theme-docs@4.6.1.patch` — generated by `pnpm patch`; the #5008 fix.
- `apps/docs/.gitignore` — new; ignores `out/`, `.next/`, `node_modules/`.
- `packages/identity/src/crossNav.ts` — new; the shared cross-site nav link list (data only, no React).
- `packages/identity/src/index.ts` — modify; re-export `crossNav` exports.
- `packages/identity/tests/crossNav.test.ts` — new; asserts the link list destinations + no banned phrases.
- `.github/workflows/deploy.yml` — modify; add `deploy-docs` job (Cloudflare Pages, gated on `verify`).

---

### Task 1: Scaffold `apps/docs` + install pinned deps + apply the #5008 patch

**Files:**
- Create: `apps/docs/package.json`
- Create: `apps/docs/tsconfig.json`
- Create: `apps/docs/next.config.mjs`
- Create: `apps/docs/mdx-components.tsx`
- Create: `apps/docs/.gitignore`
- Create: `apps/docs/patches/nextra-theme-docs@4.6.1.patch` (via `pnpm patch`)
- Modify: `pnpm-lock.yaml` (after install)

**Interfaces:**
- Produces: a workspace app `@nanisoft/docs` that installs cleanly with the #5008 patch applied. Consumed by every later task. No build yet (Task 5 builds) — this task's gate is `pnpm install` succeeding and the patched `layout.js` containing `safeParse({ children, ...themeConfig })`.

- [ ] **Step 1: Create `apps/docs/package.json`**

```json
{
  "name": "@nanisoft/docs",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --webpack -p 3002",
    "build": "next build --webpack",
    "start": "next start -p 3002",
    "lint": "eslint .",
    "cloudflare-build": "next build --webpack",
    "deploy": "wrangler pages deploy out --project-name nanisoft-docs"
  },
  "dependencies": {
    "@nanisoft/identity": "workspace:*",
    "next": "16.1.7",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "nextra": "4.6.1",
    "nextra-theme-docs": "4.6.1"
  },
  "devDependencies": {
    "@types/node": "26.2.0",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.4",
    "eslint": "9.39.5",
    "typescript": "6.0.3",
    "wrangler": "^4.125.0"
  },
  "pnpm": {
    "patchedDependencies": {
      "nextra-theme-docs@4.6.1": "patches/nextra-theme-docs@4.6.1.patch"
    }
  }
}
```

> The `patches/...` entry is filled by `pnpm patch-commit` in Step 4. Add the `pnpm.patchedDependencies` block now with the path shown; `pnpm patch-commit` will write the matching `patchedDependencies` entry automatically — if it duplicates, keep the one `pnpm patch-commit` produces.

- [ ] **Step 2: Create `apps/docs/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "allowJs": true,
    "paths": { "@/*": ["./*"] },
    "baseUrl": ".",
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out", ".next"]
}
```

- [ ] **Step 3: Create `apps/docs/next.config.mjs`, `mdx-components.tsx`, `.gitignore`**

`apps/docs/next.config.mjs`:

```js
import nextra from 'nextra'

const withNextra = nextra({
  search: { codeblocks: false },
})

export default withNextra({
  output: 'export',
  images: { unoptimized: true },
})
```

`apps/docs/mdx-components.tsx`:

```tsx
import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'

const themeComponents = getThemeComponents()

export function useMDXComponents(components: Record<string, unknown>) {
  return { ...themeComponents, ...components }
}
```

`apps/docs/.gitignore`:

```
node_modules/
.next/
out/
*.tsbuildinfo
```

- [ ] **Step 4: Install deps + apply the #5008 patch via `pnpm patch`**

Run from the **repo root** (so pnpm resolves the workspace):

```bash
pnpm install --dir apps/docs
```

Then apply the patch. `pnpm patch` extracts the package to a temp dir and prints its path; edit the one line, then commit the patch:

```bash
pnpm patch nextra-theme-docs@4.6.1
# prints: "Patch base created at <TMPDIR>"
```

Edit `<TMPDIR>/dist/layout.js`: find the line that destructures the props and calls `LayoutPropsSchema.safeParse(themeConfig)` (the `themeConfig` is the rest after `children` is destructured out). Change:

```js
} = LayoutPropsSchema.safeParse(themeConfig);
```

to:

```js
} = LayoutPropsSchema.safeParse({ children, ...themeConfig });
```

Then finalize the patch (run from `apps/docs`):

```bash
pnpm patch-commit <TMPDIR>
```

`pnpm patch-commit` writes `apps/docs/patches/nextra-theme-docs@4.6.1.patch` and adds the `pnpm.patchedDependencies` entry to `apps/docs/package.json`. Re-run `pnpm install --dir apps/docs` so the patch is applied to `node_modules`.

- [ ] **Step 5: Verify the patch is applied**

Run (from `apps/docs`):

```bash
grep -n "safeParse({ children" node_modules/nextra-theme-docs/dist/layout.js
```

Expected: one match. If absent, the patch was not applied — re-run Step 4.

- [ ] **Step 6: Commit**

```bash
git add apps/docs pnpm-lock.yaml
git commit -m "feat(docs): scaffold apps/docs Nextra site with #5008 zod patch"
```

---

### Task 2: Root layout (async, getPageMap) + brand CSS + Satoshi font + not-found

**Files:**
- Create: `apps/docs/app/layout.tsx`
- Create: `apps/docs/app/globals.css`
- Create: `apps/docs/app/not-found.tsx`
- Create: `apps/docs/app/page.mdx` (minimal home — content fleshed out in Task 4)
- Copy: `apps/landing/app/fonts/*.woff2` → `apps/docs/app/fonts/`

**Interfaces:**
- Consumes: `@nanisoft/identity` tokens (`color`, `font`), `getPageMap` from `nextra/page-map`, `Layout` from `nextra-theme-docs`.
- Produces: a branded async root layout that renders without the #5008 crash. The brand CSS overrides Nextra's theme variables with the nanisoft palette. Consumed by every content page (Task 4).

- [ ] **Step 1: Copy the Satoshi webfonts**

Copy the Satoshi `.woff2` files the landing already self-hosts so the docs site uses the real voice face, not a system fallback:

```bash
mkdir -p apps/docs/app/fonts
cp apps/landing/app/fonts/Satoshi-*.woff2 apps/docs/app/fonts/
```

Verify: `ls apps/docs/app/fonts/` shows Regular, Italic, Medium, Bold, BoldItalic woff2 files (match the set `apps/landing/app/layout.tsx` loads — Regular, Italic, Medium, Bold, BoldItalic).

- [ ] **Step 2: Create `apps/docs/app/globals.css` (brand overrides)**

Override Nextra's CSS variables with the nanisoft identity. Confirm the exact `--nextra-*` variable names against the installed theme's CSS (`apps/docs/node_modules/nextra-theme-docs/dist/` — look for the `:root` / `[data-theme]` variable block) and adjust the names below to match. The hex values are fixed by the identity and must not change:

```css
/*
 * nanisoft brand overlay on nextra-theme-docs. Values mapped from
 * @nanisoft/identity (SPEC §2 "Living Map"). Confirm the --nextra-* variable
 * names against the installed theme's CSS and rename as needed — the hex
 * values are the brand source of truth, not the variable names.
 *
 *   base = petrol + bone · secondary = teal · accent = jade (live/active only)
 *   No purple, no neon, no pure black, no pure white.
 */

:root {
  --nextra-primary: #0C2A33;        /* color.petrol — primary text/links in light */
  --nextra-bg: #F4EFE6;             /* color.bone — page background (light) */
  --nextra-bg-dark: #08222A;        /* color.petrolDeep — page background (dark) */
  --nextra-text: #102A30;           /* color.ink — body text (light) */
  --nextra-text-dark: #F4EFE6;      /* color.bone — body text (dark) */
  --nextra-border: #EAE2D3;         /* color.boneSunken — hairline borders (light) */
  --nextra-secondary: #2A8C97;      /* color.teal — supporting marks */
  /* Jade is reserved for live/active states only — expose it as the accent
     so active nav/links read as "live", never as a decorative fill. */
  --nextra-accent: #14A77A;         /* color.jade — active/live only */
  --nextra-focus: #1F6E78;          /* darkened teal — focus ring (passes 3:1 on bone) */
  --nextra-radius: 20px;            /* shape lock: card 20 */
}

/* Satoshi is the voice (UI/body/headings); JetBrains Mono is the data face.
   The font loader in layout.tsx defines --font-satoshi / --font-mono. */
:root {
  --font-satoshi: 'Satoshi', system-ui, -apple-system, sans-serif;
  --nextra-font-sans: var(--font-satoshi), 'Satoshi', system-ui, -apple-system, sans-serif;
  --nextra-font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace;
}

body {
  font-family: var(--nextra-font-sans);
}
```

> If the installed theme exposes the active nav link / search ring via different variables (e.g. `--nextra-navbar-border`, `--nextra-search-bg`), add overrides for those too so the brand reads consistently. Keep Nextra's layout and component structure; only recolor.

- [ ] **Step 3: Create `apps/docs/app/layout.tsx`**

```tsx
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Layout } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'
import { crossNavLinks, BRAND } from '@nanisoft/identity'
import DocsNavbar from './docs-navbar'
import './globals.css'

const satoshi = localFont({
  src: [
    { path: './fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Satoshi-Italic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
    { path: './fonts/Satoshi-BoldItalic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
})

const config = {
  logo: <span style={{ fontWeight: 700 }}>{BRAND.name}</span>,
  project: { link: 'https://nanisoft.com' },
  sidebar: { autoCollapse: true },
  docsRepositoryBase: 'https://github.com/durgaprasadreddyv/website/tree/main/apps/docs',
  navbar: <DocsNavbar links={crossNavLinks} />,
  footer: { text: `${new Date().getFullYear()} · nanisoft` },
  nextThemes: { defaultTheme: 'system', forcedTheme: undefined },
}

export const metadata: Metadata = {
  title: { template: '%s — nanisoft docs', default: 'nanisoft docs' },
  description: 'Documentation and white papers for the nanisoft digital twin of the IT estate.',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={satoshi.variable} suppressHydrationWarning>
      <body>
        <Layout {...config} pageMap={await getPageMap()}>
          {children}
        </Layout>
      </body>
    </html>
  )
}
```

> **Read the installed theme before finalizing the `config` keys.** Spike 1 confirmed `logo`/`project` are NOT valid `Layout` props in 4.6.1 (the `LayoutPropsSchema` is a `z.strictObject` that rejects unknown keys) — the `logo`/`project` shown above are the classic Nextra API and will be **rejected** here. Inspect `apps/docs/node_modules/nextra-theme-docs/dist/schemas.js` (`LayoutPropsSchema`): drop any config key not in the schema, and render the wordmark + project link inside the `navbar` component instead. `sidebar`, `docsRepositoryBase`, `navbar`, `footer`, `nextThemes` are confirmed-valid. The `pageMap={await getPageMap()}` and the async layout are mandatory — keep them.

- [ ] **Step 4: Create `apps/docs/app/docs-navbar.tsx`**

A small client-safe component rendering the shared cross-site links (Task 3 adds the `crossNavLinks`/`BRAND` exports to identity; if Task 3 has not landed yet, stub the import and resolve it there). It renders the wordmark → nanisoft.com plus the cross-site destinations:

```tsx
import Link from 'next/link'

export type NavLink = { label: string; href: string; external?: boolean }

export default function DocsNavbar({ links }: { links: readonly NavLink[] }) {
  return (
    <nav aria-label="Cross-site" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Link href="https://nanisoft.com" style={{ fontWeight: 700 }}>nanisoft</Link>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target={l.external ? '_blank' : undefined}
          rel={l.external ? 'noopener noreferrer' : undefined}
        >
          {l.label}
        </a>
      ))}
    </nav>
  )
}
```

- [ ] **Step 5: Create `apps/docs/app/not-found.tsx`** (so the export emits `404.html`)

```tsx
export default function NotFound() {
  return (
    <div style={{ padding: '96px 24px', maxWidth: 640, margin: '0 auto' }}>
      <h1>404 — page not found</h1>
      <p>This page does not exist in the nanisoft docs.</p>
    </div>
  )
}
```

> A plain component (no `<Layout>`) — the root layout already wraps every route. Without a `not-found` route the static export omits `404.html`; Spike 1 required this file to prerender `/_not-found`.

- [ ] **Step 6: Create a minimal `apps/docs/app/page.mdx`** (content expanded in Task 4)

```mdx
# nanisoft docs

Documentation and white papers for the nanisoft digital twin of the IT estate.
```

- [ ] **Step 7: Smoke-build to confirm the #5008 fix holds at render**

```bash
cd apps/docs && node ./node_modules/next/dist/bin/next build --webpack
```

> Use the direct `next` binary (not `pnpm run build`) if pnpm's pre-run deps check trips `ERR_PNPM_IGNORED_BUILDS` for `sharp` — Spike 1 hit this and `NPM_CONFIG_VERIFY_DEPS_BEFORE_RUN=false` did not disable it. Prefer `pnpm -F @nanisoft/docs build` first; fall back to the direct binary only if it fails.

Expected: `✓ Generating static pages`, `out/index.html` + `out/404.html` produced. If prerender crashes with `expected nonoptional, received undefined → at children`, the #5008 patch is not applied — re-check Task 1 Step 5.

- [ ] **Step 8: Commit**

```bash
git add apps/docs/app apps/docs
git commit -m "feat(docs): async root layout with getPageMap, brand CSS, Satoshi font, 404"
```

---

### Task 3: Shared cross-site nav link list in `@nanisoft/identity`

**Files:**
- Create: `packages/identity/src/crossNav.ts`
- Modify: `packages/identity/src/index.ts`
- Test: `packages/identity/tests/crossNav.test.ts`

**Interfaces:**
- Consumes: nothing (pure data).
- Produces: `crossNavLinks` (`readonly NavLink[]`) and `BRAND` re-export guarantee — a framework-agnostic list of cross-site destinations (Docs, Blog, About, Contact) each site renders through its own theme. Consumed by `apps/docs` (Task 2 navbar) and later WS3 (`apps/blog`). `NavLink = { label: string; href: string; external?: boolean }`.

> The identity package is plain TypeScript with no React boundary; this keeps the cross-site link config shared without shipping a component across Next-version boundaries (the design decision: "share link config, not a React component").

- [ ] **Step 1: Write the failing test**

Create `packages/identity/tests/crossNav.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { crossNavLinks } from '../src/crossNav'

describe('crossNavLinks', () => {
  it('lists the four cross-site destinations with correct hrefs', () => {
    const labels = crossNavLinks.map((l) => l.label)
    expect(labels).toEqual(['Docs', 'Blog', 'About us', 'Contact us'])

    const docs = crossNavLinks.find((l) => l.label === 'Docs')!
    expect(docs.href).toBe('https://docs.nanisoft.com')
    expect(docs.external).toBe(true)

    const blog = crossNavLinks.find((l) => l.label === 'Blog')!
    expect(blog.href).toBe('https://blog.nanisoft.com')
    expect(blog.external).toBe(true)

    const about = crossNavLinks.find((l) => l.label === 'About us')!
    expect(about.href).toBe('https://nanisoft.com/about-us')
    expect(about.external).toBe(true)

    const contact = crossNavLinks.find((l) => l.label === 'Contact us')!
    expect(contact.href).toBe('https://nanisoft.com/about-us#contact')
    expect(contact.external).toBe(true)
  })

  it('carries no banned ask phrases or mailto links', () => {
    const dump = JSON.stringify(crossNavLinks).toLowerCase()
    expect(dump.includes('demo')).toBe(false)
    expect(dump.includes('mailto')).toBe(false)
  })

  it('has no bare href="#" anchors', () => {
    for (const l of crossNavLinks) expect(l.href).not.toBe('#')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @nanisoft/identity test`
Expected: FAIL — `crossNavLinks` is not exported from `../src/crossNav`.

- [ ] **Step 3: Implement `packages/identity/src/crossNav.ts`**

```ts
/**
 * Cross-site navigation — the link list shared by every nanisoft site (docs,
 * blog, landing) so the brand bar is consistent across Next-version boundaries.
 * Each site renders this list through its own theme; we share the data, not a
 * React component (the sites run different Next versions — see the WS2 design).
 *
 * Destinations point at the public domains, so every entry is `external`.
 * About/Contact live as sections on the landing site (the-guild.dev pattern).
 */

export interface NavLink {
  label: string
  href: string
  external?: boolean
}

export const crossNavLinks: readonly NavLink[] = [
  { label: 'Docs', href: 'https://docs.nanisoft.com', external: true },
  { label: 'Blog', href: 'https://blog.nanisoft.com', external: true },
  { label: 'About us', href: 'https://nanisoft.com/about-us', external: true },
  { label: 'Contact us', href: 'https://nanisoft.com/about-us#contact', external: true },
] as const
```

Re-export from `packages/identity/src/index.ts` (add near the other exports):

```ts
export { crossNavLinks } from './crossNav'
export type { NavLink } from './crossNav'
```

> `BRAND` is referenced in Task 2's layout. The identity package does not currently export `BRAND` (the landing keeps its own `BRAND` in `apps/landing/lib/data.ts`). Rather than couple docs to the landing's data file, add a tiny `brand.ts` to identity OR replace the `BRAND` usage in `layout.tsx` with the literal string `'nanisoft'`. Prefer the literal in `layout.tsx` (one site, one wordmark) and drop the `BRAND` import — keep this task scoped to the link list. If you add `brand.ts`, test it the same way and re-export it.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @nanisoft/identity test`
Expected: PASS (existing identity tests + the new crossNav suite).

- [ ] **Step 5: Build the identity package** (the workspace consumes it via `src/index.ts`; confirm it still type-checks)

Run: `pnpm -F @nanisoft/identity build`
Expected: PASS (tsc emits `dist/`).

- [ ] **Step 6: Commit**

```bash
git add packages/identity/src/crossNav.ts packages/identity/src/index.ts packages/identity/tests/crossNav.test.ts packages/identity/dist
git commit -m "feat(identity): add shared cross-site nav link list for docs/blog"
```

---

### Task 4: Content structure — `_meta.json` sections + seeded pages + white-papers subsection

**Files:**
- Modify: `apps/docs/app/page.mdx` (flesh out the home)
- Create: `apps/docs/app/_meta.json`
- Create: `apps/docs/app/getting-started.mdx`
- Create: `apps/docs/app/architecture.mdx`
- Create: `apps/docs/app/white-papers/_meta.json`
- Create: `apps/docs/app/white-papers/access-twin.mdx`

**Interfaces:**
- Consumes: Nextra's `_meta.json` convention (per-directory nav order/types) + the layout from Task 2.
- Produces: a navigable docs tree: home + two doc pages + a `white-papers` subsection with one placeholder white paper. The `/white-papers` route is what the landing `NAV` "White papers" link points at (`https://docs.nanisoft.com/white-papers`).

- [ ] **Step 1: Create `apps/docs/app/_meta.json`**

```json
{
  "index": { "title": "Home", "type": "page" },
  "getting-started": { "title": "Getting started", "type": "page" },
  "architecture": { "title": "Architecture", "type": "page" },
  "white-papers": { "title": "White papers", "type": "menu" }
}
```

> `"type": "menu"` makes `white-papers` a sidebar menu whose children come from `white-papers/_meta.json`. Confirm the exact `type` vocabulary (`page` / `menu` / `separator`) against the installed Nextra's `_meta` docs in `apps/docs/node_modules/nextra/dist/` or the Nextra guide; adjust if 4.6.1 renamed a value. The `/white-papers` index route resolves to the first child or a generated index — verify in Step 5 that `out/white-papers/index.html` (or the first child's HTML) exists and the landing link target loads.

- [ ] **Step 2: Flesh out `apps/docs/app/page.mdx`**

```mdx
# nanisoft docs

The nanisoft digital twin turns an organization's IT estate into a queryable
graph — directories, databases, and applications as nodes; access and activity
as edges. This is the engineering documentation, plus [white papers](/white-papers).

## Where to start

- **[Getting started](/getting-started)** — the mental model: Bronze → Silver → Gold, and how a traversal is asked.
- **[Architecture](/architecture)** — the platform components and how Atlas serves the graph.
- **[White papers](/white-papers)** — long-form positions on access traversal, blast radius, and estate modeling.
```

- [ ] **Step 3: Create `apps/docs/app/getting-started.mdx`**

```mdx
# Getting started

The twin is **produced, not assembled**. Source data lands untouched in Bronze,
is conformed and resolved in Silver, and resolves into the Gold graph — nodes
and edges — that Atlas serves.

## The layers

| Layer | Holds | Rule |
| --- | --- | --- |
| Bronze | Raw source data | Nothing is interpreted at the door |
| Silver | Conformed, resolved facts | One person, one node |
| Gold | The graph (nodes + edges) | This graph is the twin |

A question — "who can reach this system?" — is answered by **traversal**, not
by stitched exports. Atlas checks each traversal against policy and writes an
audit trail.
```

- [ ] **Step 4: Create `apps/docs/app/architecture.mdx`**

```mdx
# Architecture

The platform composes off-the-shelf open-source products behind codenames and
builds four components in-house.

## Built in house

- **Atlas** — the core engine: traversal API, policy enforcement, audit log.
- **Compass** — the traversal UI: explore the twin as a graph.
- **DataGerry Bridge** — syncs authored schema into the lakehouse and the engine.
- **Scout** — connectors for internal systems no catalog covers.

See the [getting started](/getting-started) guide for the Bronze→Gold flow the
platform orchestrates.
```

- [ ] **Step 5: Create `apps/docs/app/white-papers/_meta.json`**

```json
{
  "access-twin": { "title": "The access twin", "type": "page" }
}
```

- [ ] **Step 6: Create `apps/docs/app/white-papers/access-twin.mdx`**

```mdx
# The access twin

*Placeholder white paper — replace with the full position.*

Access traversal is the first use-case for the nanisoft twin: trace every path
between a person and a sensitive product — group memberships, direct grants,
inherited rights — and surface the views that have no membership backing them.

## Why a graph

A question that crosses three systems is three exports and a spreadsheet in a
classic estate. On the twin it is a single traversal against a graph that
already agrees with itself, because it was produced from conformed facts under
quality gates — not assembled at question time.

## What comes next

Blast radius and stale-access cleanup fall out of the same graph, without new
connectors. This paper covers the access twin; later papers cover each.
```

- [ ] **Step 7: Build and verify the content tree renders**

```bash
pnpm -F @nanisoft/docs build
```

Expected: `✓ Generating static pages`; `out/` contains `index.html`, `getting-started.html` (or `getting-started/index.html`), `architecture.html`, `white-papers/access-twin.html`, and `404.html`. Open `out/index.html` and confirm the sidebar lists Home / Getting started / Architecture / White papers, and the White papers menu expands to "The access twin".

- [ ] **Step 8: Commit**

```bash
git add apps/docs/app
git commit -m "feat(docs): content tree with getting-started, architecture, white-papers subsection"
```

---

### Task 5: Lint config + full build + `out/` verification

**Files:**
- Create: `apps/docs/eslint.config.mjs`
- Create: `apps/docs/next-env.d.ts` (generated by `next build`; commit it)

**Interfaces:** none (verification gate).

- [ ] **Step 1: Create `apps/docs/eslint.config.mjs`**

```js
import next from 'eslint-config-next'

export default [
  ...next,
  {
    ignores: ['out/', '.next/', 'node_modules/', '**/*.mdx'],
  },
]
```

> `eslint-config-next` is a devDep. If its flat-config export shape differs in this version, fall back to a minimal flat config that lints `.ts`/`.tsx` with `eslint`'s recommended rules and ignores `.mdx` — the goal is `pnpm -F @nanisoft/docs lint` exits 0, not a particular rule set. Confirm against `apps/docs/node_modules/eslint-config-next/`.

- [ ] **Step 2: Lint**

Run: `pnpm -F @nanisoft/docs lint`
Expected: no errors. Fix inline.

- [ ] **Step 3: Full production build**

Run: `pnpm -F @nanisoft/docs build`
Expected: success, `out/` produced. Confirm the route list includes `/`, `/getting-started`, `/architecture`, `/white-papers/access-twin`, and `/_not-found`.

- [ ] **Step 4: Verify `out/` is a complete static site**

```bash
ls apps/docs/out
```

Expected: `index.html`, `404.html`, `_next/` (assets), and the per-route HTML files. Confirm `<title>` in `out/index.html` reads `nanisoft docs` (or the metadata default). Confirm the brand CSS variables are present in the generated CSS (grep `out/_next/static/css/` for `--nextra-primary` or `#0C2A33`).

- [ ] **Step 5: Verify the workspace-wide gates still pass**

Run from repo root:

```bash
pnpm -r run lint
pnpm -r run test
pnpm -r run build
```

Expected: all green. `pnpm -r run build` now builds `apps/docs` too (it has a `build` script) — confirm the docs build is in the output. The landing and playground builds are unchanged.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/eslint.config.mjs apps/docs/next-env.d.ts apps/docs
git commit -m "chore(docs): lint config, build verification, out/ static-site check"
```

---

### Task 6: Cloudflare Pages deploy config + CI `deploy-docs` job

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Create: `apps/docs/.nextrc` / no-op (none needed — Pages reads `out/` directly)
- Document: custom-domain step (manual)

**Interfaces:**
- Consumes: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets (already used by the landing/playground deploy jobs). The token's scope must cover Cloudflare **Pages** (confirm with the user if the existing token was scoped to Workers only).
- Produces: a `deploy-docs` CI job that, on push to `main`, builds `out/` and runs `wrangler pages deploy out --project-name nanisoft-docs`. The project is created on first deploy (or in the dashboard); the custom domain is added once, manually.

- [ ] **Step 1: Add the `deploy-docs` job to `.github/workflows/deploy.yml`**

Append after `deploy-playground`:

```yaml
  deploy-docs:
    name: Deploy docs → docs.nanisoft.com (Pages)
    needs: [verify, e2e]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Build static export
        # Produces apps/docs/out — the static site Cloudflare Pages serves.
        run: pnpm --filter @nanisoft/docs run cloudflare-build
      - name: Deploy to Cloudflare Pages
        # `wrangler pages deploy` creates the `nanisoft-docs` project on first
        # run. After the first deploy, add the docs.nanisoft.com custom domain
        # + DNS record in the Cloudflare dashboard (one-time, manual — same as
        # the playground worker domain).
        run: pnpm --filter @nanisoft/docs run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

> The `deploy` script is `wrangler pages deploy out --project-name nanisoft-docs`. If `wrangler pages deploy` needs `--branch main` or a commit message flag for the Pages deployment, add them — confirm against the installed `wrangler` CLI (`wrangler pages deploy --help`). The landing `NAV` already points White papers at `https://docs.nanisoft.com/white-papers`; that path resolves once the content tree (Task 4) is live.

- [ ] **Step 2: Confirm the `verify` job builds docs on PRs**

The existing `verify` job runs `pnpm -r run build`, which now includes `apps/docs` (Task 5 confirmed). No change needed — but confirm the `verify` job's `Build` step log shows the docs build, so PRs gate the docs site before merge.

- [ ] **Step 3: Custom domain (manual, user action)**

After the first successful `deploy-docs` run creates the `nanisoft-docs` Pages project, the user adds `docs.nanisoft.com` as a custom domain in the Cloudflare Pages dashboard (and the DNS record, if Cloudflare DNS doesn't auto-add it). Record this in the commit message / a follow-up note. This is the same one-time manual step as the playground's custom domain.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(docs): add deploy-docs Cloudflare Pages job for docs.nanisoft.com"
```

---

### Task 7: Whole-site self-review + manual smoke

**Files:** none (verification + any inline fixes).

- [ ] **Step 1: Re-run all gates from the repo root**

```bash
pnpm -r run lint && pnpm -r run test && pnpm -r run build
```

Expected: green. The docs build produces `out/`; landing/playground unchanged.

- [ ] **Step 2: Brand check**

Open `apps/docs/out/index.html` (or `pnpm -F @nanisoft/docs dev` and visit `localhost:3002`). Confirm:
- The page reads as nanisoft: petrol/bone surfaces, Satoshi voice face, no purple/neon/pure-black/pure-white.
- Jade appears only on the active/live nav state, not as a decorative fill.
- The cross-site navbar links (Docs / Blog / About us / Contact us) point at the correct external hrefs and open in a new tab with `noopener`.
- The sidebar lists Home / Getting started / Architecture / White papers, and White papers expands to "The access twin".

- [ ] **Step 3: Landing-link target check**

Confirm `https://docs.nanisoft.com/white-papers` (the landing `NAV` "White papers" href) resolves to the white-papers index/first child on the deployed site. Locally, `out/white-papers/access-twin.html` exists; confirm the `/white-papers` route serves it (Nextra generates an index for a `menu`-typed folder — verify the exact generated path in `out/` and adjust the landing href or the `_meta` type if they mismatch).

- [ ] **Step 4: Patch durability check**

Confirm a fresh `pnpm install --dir apps/docs` re-applies the #5008 patch (the patch file is committed, `pnpm.patchedDependencies` references it). Run:

```bash
rm -rf apps/docs/node_modules && pnpm install --dir apps/docs
grep -n "safeParse({ children" apps/docs/node_modules/nextra-theme-docs/dist/layout.js
```

Expected: the grep matches. If not, the `pnpm.patchedDependencies` entry or patch path is wrong.

- [ ] **Step 5: Commit any verification fixes**

```bash
git add -A
git commit -m "chore(docs): whole-site verification fixes for WS2 docs launch"
```

- [ ] **Step 6: Manual smoke (user)**

Ask the user to: push to `main`, watch `deploy-docs` go green, add the `docs.nanisoft.com` custom domain in the Cloudflare dashboard, then visit `docs.nanisoft.com` and `docs.nanisoft.com/white-papers` and confirm the brand + nav + content render. Then click the landing's Docs dropdown → "Documentation" and "White papers" to confirm the cross-site links land on the right pages.

---

## Self-Review (completed)

**Spec coverage (WS2 only):** Nextra docs site on Next 16.1.7 + webpack + `output:'export'` → Tasks 1–2 (config + layout). `nextra-theme-docs@4.6.1` with the #5008 patch → Task 1 Step 4. `pageMap={await getPageMap()}`, no `logo`/`project` (read schema, render in navbar) → Task 2 Step 3 + the read-the-schema note. `mdx-components.tsx` required → Task 1 Step 3. `_meta.json` top-level doc sections + `white-papers/` subsection with one placeholder white paper → Task 4. Branded with identity tokens (petrol/bone/teal/jade + Satoshi) → Task 2 Steps 1–2. Cross-site nav shared via `@nanisoft/identity` link config rendered through the docs navbar → Task 3 + Task 2 Step 4. Cloudflare Pages deploy + `deploy-docs` CI job + custom domain → Task 6. WS3 (blog) is out of scope — it gets its own plan and reuses the `crossNavLinks` from Task 3.

**Placeholder scan:** the only intentional placeholder content is the white-paper body ("Placeholder white paper — replace with the full position."), which is the stated seed content. The `REPLACE_WITH_D1_DATABASE_ID`-style placeholder is WS1's, not present here. No `TODO`/`TBD` in code. The two "confirm against the installed theme" notes (Layout config keys in Task 2, `_meta` type vocabulary in Task 4) are verification steps with concrete fallbacks, not placeholders — they pin the values the spike did not exercise and tell the implementer exactly where to read the truth.

**Type consistency:** `NavLink` (Task 3 `crossNav.ts`) matches the `NavLink` type re-exported from `@nanisoft/identity` and the prop shape `DocsNavbar` consumes in Task 2 Step 4. `crossNavLinks` named consistently across Task 3's test, implementation, and Task 2's layout import. `getPageMap` / `Layout` / `useMDXComponents` usage matches the spike-validated signatures.

**Open notes:** (1) The `logo`/`project` keys in Task 2 Step 3's `config` object are the classic Nextra API and **will be rejected** by 4.6.1's `LayoutPropsSchema` — the step explicitly instructs dropping them and rendering the wordmark/project link inside `DocsNavbar` instead. The implementer must read `dist/schemas.js` before finalizing. (2) The exact `--nextra-*` CSS variable names and `_meta` `type` vocabulary are to be confirmed against the installed theme; the brand hex values and intent are fixed. (3) The Cloudflare API token's scope must cover Pages — confirm with the user if it was issued Workers-only. (4) `next-env.d.ts` is generated by `next build`; commit it. (5) WS1's pending D1 provisioning is independent of WS2 — WS2 has no server runtime and no D1 dependency.