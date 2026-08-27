# WS3 — Nextra blog site (blog.nanisoft.com) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a new `apps/blog` workspace app — a Nextra blog site (`nextra-theme-blog@4.6.1` on Next 16.1.7 + webpack, `output: 'export'`) organized by category (`engineering/`, `announcements/`) with a custom `PostList` component, branded with the nanisoft petrol/bone/teal/jade identity, deployed to Cloudflare Pages at `blog.nanisoft.com`.

**Architecture:** `apps/blog` is a standalone Next 16.1.7 App-Router app in the pnpm workspace, sibling to `apps/docs` (WS2) and `apps/landing`/`apps/playground` (Next 16.3.1). Nextra wraps the config. Unlike the docs theme, `nextra-theme-blog@4.6.1` has **no Zod validation** (no #5008 patch) and is **composable** — its `Layout` takes only `children`/`nextThemes`/`banner` (no `pageMap` prop), and `Navbar`/`PostCard`/`Footer`/`ThemeSwitch`/`Comments` are exported separately and assembled in the layout; `import 'nextra-theme-blog/style.css'` provides base styles. (Spike 1 verified this against the installed 4.6.1 dist. Context7 shows an older config-file API for the blog theme — Task 1 confirms which one 4.6.1 actually exposes and Task 2 follows the installed API.) Posts live one level deep under a category folder (`/<category>/<slug>`); a pure `collectPosts(pageMap, prefix?)` function filters the Nextra page map by route shape + `frontMatter.date` and sorts newest-first; a thin async `PostList` server component renders the theme's `PostCard` for each. Brand is injected by overriding the blog theme's CSS variables in a `globals.css` (the exact variable names are discovered in Task 1 and recorded in a code comment, exactly as WS2 did for the docs theme), plus a `next/font/local` Satoshi loader copied from `apps/docs`. Cross-site nav reuses the `crossNavLinks` list already shipped in `@nanisoft/identity` (WS2). Deploy is `wrangler pages deploy out` (static export), wired as a `deploy-blog` CI job gated on `verify` + `e2e`.

**Tech Stack:** Next.js 16.1.7 (App Router, **webpack only**), React 19.2.8, Nextra 4.6.1 + nextra-theme-blog 4.6.1, MDX, `@nanisoft/identity` (workspace:*), `next/font/local`, vitest 4.1.11 (one pure-function unit test), Cloudflare Pages (wrangler 4), TypeScript 6.0.3.

## Global Constraints

- **Pinned versions (from Spike 1 — use exactly):** `next@16.1.7`, `react@19.2.8`, `react-dom@19.2.8`, `nextra@4.6.1`, `nextra-theme-blog@4.6.1`. **Do NOT use Next 16.2.x+** (Nextra issue #5003). 16.0.x is the fallback if 16.1.7 fails for a reason not seen in the spike. The landing/playground apps stay on 16.3.1; docs is on 16.1.7 — a different Next pin per workspace app is fine in pnpm.
- **Mandatory config:** `next.config.mjs` must be `nextra()` wrapping `{ output: 'export', images: { unoptimized: true } }` — `images.unoptimized` is mandatory for static export. Build/dev scripts must force **webpack**: `next build --webpack` / `next dev --webpack` (Next 16 defaults to Turbopack; Nextra breaks on Turbopack). `apps/blog` dev port is `3003` (docs is 3002, landing 3000, playground 3001).
- **`mdx-components.tsx` is required at the app root** — it exports `useMDXComponents` merging the theme's defaults. Without it the build fails `Can't resolve 'next-mdx-import-source-file'`.
- **NO #5008 patch for the blog theme.** `nextra-theme-blog@4.6.1` has no Zod validation. Do NOT carry over the docs patch or add a `patchedDependencies` entry for the blog theme. Task 1 confirms the installed `dist` has no `safeParse`/`LayoutPropsSchema`.
- **Blog theme API (verify in Task 1, then follow in Task 2):** Spike 1 found 4.6.1 composable — `Layout` props are `children`/`nextThemes`/`banner` only (NO `pageMap` prop); `Navbar`, `PostCard`, `Footer`, `ThemeSwitch`, `Comments` exported separately; `import 'nextra-theme-blog/style.css'` in the layout; `useMDXComponents` exported from the package main. Context7 shows an older `theme.config.js` API (`footer`/`head`/`readMore`/`navs`/`darkMode` via `nextra({ theme, themeConfig })`). **Task 1 reads the installed `node_modules/nextra-theme-blog/dist` and records which API 4.6.1 exposes; Task 2 implements the layout against the installed API.** The composable path below is the primary; if the installed theme uses the config-file API instead, Task 2 switches to `nextra({ theme: 'nextra-theme-blog', themeConfig: './blog.config.js' })` + a `blog.config.js` with `footer`/`navs`, and renders `BlogNavbar` accordingly.
- **Brand tokens (same as WS2 docs):** petrol `#0C2A33` (HSL 194/62/12), bone `#F4EFE6` (RGB 244,239,230), petrolDeep `#08222A` (RGB 8,34,42), teal `#2A8C97` (HSL 186/57/38, dark-mode primary — sanctioned deviation for legibility on petrolDeep), jade `#14A77A` (**active/live only** — `aria-current` states, never decorative), focus `#1F6E78`. No purple, no neon, no pure black, no pure white. Satoshi via `next/font/local` (copy the 5 woff2 files from `apps/docs/app/fonts/`). The blog theme's CSS-variable surface DIFFERS from `nextra-theme-docs` — Task 1 discovers the real variable names in `dist/style.css`; Task 2 maps the brand values above onto those real names and records the mapping in a `globals.css` comment (same discipline as WS2).
- **Cross-site nav reuses `crossNavLinks` from `@nanisoft/identity`** (already shipped + tested in WS2 — `packages/identity/src/crossNav.ts`). Do NOT modify `@nanisoft/identity` in this plan. External links render `target="_blank"` + `rel="noopener noreferrer"`. The wordmark `nanisoft` links to `https://nanisoft.com` same-tab (brand anchor — same convention as `apps/docs/app/docs-navbar.tsx`). The repo grep gate applies: **no literal "request a demo" and no `mailto:` links** anywhere in `apps/blog`.
- **Deploy target is Cloudflare Pages (static `out/`), NOT the OpenNext Worker path** used by landing/playground. The blog app has no server runtime. `wrangler pages deploy out --project-name nanisoft-blog`. The custom domain `blog.nanisoft.com` is added in the Cloudflare dashboard (one-time, manual).
- **`sharp: false` is already set workspace-wide** in `pnpm-workspace.yaml` `allowBuilds` (blog uses unoptimized images, never invokes sharp). Do NOT add a blog `patchedDependencies` entry (no blog patch).
- **`apps/blog` pins `typescript@6.0.3`** to match `apps/docs` (consistency across the two Nextra apps; the repo's 5.9 standard stays for landing/playground). Accepted per WS2 review.
- **Before writing Next.js code**, read the relevant guide in `apps/blog/node_modules/next/dist/docs/` (per the AGENTS.md convention — this is Next 16 with breaking changes). Do not strip any AGENTS.md warning block from diffs.
- Each task ends with a green build (`next build --webpack` produces `out/`) where the task changes the build, the named test passing where the task adds testable logic, and a commit. Keep commits scoped to one task.

---

## File Structure

- `apps/blog/package.json` — new; workspace app `@nanisoft/blog`, pinned deps, scripts (`dev`/`build`/`start`/`lint`/`test`/`cloudflare-build`/`deploy`). No `pnpm.patchedDependencies`.
- `apps/blog/tsconfig.json` — new; strict TS, `@/*` path alias to the app root, `jsx: react-jsx` (mirror `apps/docs/tsconfig.json`).
- `apps/blog/next.config.mjs` — new; `nextra()` wrapping `{ output: 'export', images: { unoptimized: true } }`.
- `apps/blog/mdx-components.tsx` — new; `useMDXComponents` merging `nextra-theme-blog` defaults.
- `apps/blog/vitest.config.ts` — new; `environment: 'node'`, `include: ['tests/**/*.test.ts']` (mirror `packages/identity/vitest.config.ts`).
- `apps/blog/types/global.d.ts` — new; `declare module '*.css'` (mirror `apps/docs/types/global.d.ts`).
- `apps/blog/.gitignore` — new; ignores `node_modules/`, `.next/`, `out/`, `*.tsbuildinfo` (mirror `apps/docs/.gitignore`).
- `apps/blog/eslint.config.mjs` — new; flat config importing `eslint-config-next/core-web-vitals` + `/typescript` (mirror `apps/docs/eslint.config.mjs`).
- `apps/blog/app/layout.tsx` — new; async root layout: composable blog `Layout` + `BlogNavbar` + Satoshi font + brand `globals.css` import + `nextra-theme-blog/style.css` import.
- `apps/blog/app/blog-navbar.tsx` — new; renders `crossNavLinks` + wordmark + category links (mirror `apps/docs/app/docs-navbar.tsx`).
- `apps/blog/app/globals.css` — new; brand CSS variable overrides mapped onto the blog theme's real variables (discovered in Task 1) + Satoshi font var + jade-on-active + focus ring.
- `apps/blog/app/not-found.tsx` — new; plain 404 so `404.html` is emitted (mirror `apps/docs/app/not-found.tsx`).
- `apps/blog/app/fonts/*.woff2` — copied from `apps/docs/app/fonts/` (Satoshi family).
- `apps/blog/lib/posts.ts` — new; pure `collectPosts(pageMap, prefix?)` function + `Post`/`PageMapItem` types. The only custom logic; unit-tested.
- `apps/blog/tests/posts.test.ts` — new; vitest tests for `collectPosts` against a fixture page map (filter + sort + exclude-index).
- `apps/blog/app/post-list.tsx` — new; async server component: `getPageMap()` + `collectPosts` + render the theme's `PostCard` per post.
- `apps/blog/app/page.mdx` — new; blog home; renders `<PostList />` (all posts, newest-first).
- `apps/blog/app/engineering/page.mdx` — new; engineering category index; renders `<PostList prefix="/engineering" />`.
- `apps/blog/app/announcements/page.mdx` — new; announcements category index; renders `<PostList prefix="/announcements" />`.
- `apps/blog/app/engineering/producing-the-access-twin/page.mdx` — new; seed engineering post (frontmatter + prose).
- `apps/blog/app/announcements/hello-nanisoft-blog/page.mdx` — new; seed announcement post (frontmatter + prose).
- `.github/workflows/deploy.yml` — modify; add `deploy-blog` job (Cloudflare Pages, gated on `verify` + `e2e`).

---

### Task 1: Scaffold `apps/blog` + install pinned deps + verify the blog-theme API

**Files:**
- Create: `apps/blog/package.json`
- Create: `apps/blog/tsconfig.json`
- Create: `apps/blog/next.config.mjs`
- Create: `apps/blog/mdx-components.tsx`
- Create: `apps/blog/vitest.config.ts`
- Create: `apps/blog/types/global.d.ts`
- Create: `apps/blog/.gitignore`
- Create: `apps/blog/eslint.config.mjs`
- Modify: `pnpm-lock.yaml` (after install)

**Interfaces:**
- Produces: a workspace app `@nanisoft/blog` that installs cleanly. Consumed by every later task. No build yet (Task 2 builds). This task's gate is `pnpm install` succeeding AND a recorded verification of the installed `nextra-theme-blog@4.6.1` API (exports, `Layout` signature, `PostCard` props, `style.css` CSS variables, confirmation there is no `safeParse`/Zod schema). The verification findings are written into a comment block at the top of `apps/blog/app/globals.css` (created in Task 2) — for Task 1, record them in the task report so Task 2 can read them.

- [ ] **Step 1: Create `apps/blog/package.json`**

```json
{
  "name": "@nanisoft/blog",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --webpack -p 3003",
    "build": "next build --webpack",
    "start": "next start -p 3003",
    "lint": "eslint .",
    "test": "vitest run",
    "cloudflare-build": "next build --webpack",
    "deploy": "wrangler pages deploy out --project-name nanisoft-blog"
  },
  "dependencies": {
    "@nanisoft/identity": "workspace:*",
    "next": "16.1.7",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "nextra": "4.6.1",
    "nextra-theme-blog": "4.6.1"
  },
  "devDependencies": {
    "@types/node": "26.2.0",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.4",
    "eslint": "9.39.5",
    "eslint-config-next": "16.1.7",
    "typescript": "6.0.3",
    "vitest": "4.1.11",
    "wrangler": "^4.125.0"
  }
}
```

> No `pnpm.patchedDependencies` block — the blog theme has no patch. `vitest@4.1.11` is already on the workspace `minimumReleaseAgeExclude` list in `pnpm-workspace.yaml`, so the install won't stall on release-age. `eslint-config-next@16.1.7` is included now (WS2 learned the plan must list it explicitly).

- [ ] **Step 2: Create `apps/blog/tsconfig.json`** (mirror `apps/docs/tsconfig.json` exactly)

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
    "paths": {
      "@/*": ["./*"]
    },
    "plugins": [{ "name": "next" }],
    "incremental": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules", "out", ".next"]
}
```

- [ ] **Step 3: Create `apps/blog/next.config.mjs`**

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

> This is the composable-path config (no `theme`/`themeConfig`). If Step 8 verification finds 4.6.1 uses the config-file API instead, Task 2 changes this to `nextra({ theme: 'nextra-theme-blog', themeConfig: './blog.config.js' })` and adds `apps/blog/blog.config.js`.

- [ ] **Step 4: Create `apps/blog/mdx-components.tsx`**

```tsx
import { useMDXComponents as getThemeComponents } from 'nextra-theme-blog'

const themeComponents = getThemeComponents()

export function useMDXComponents(components: Record<string, unknown>) {
  return { ...themeComponents, ...components }
}
```

> If Step 8 verification finds `useMDXComponents` is NOT exported from `nextra-theme-blog` main, export a passthrough instead: `export function useMDXComponents(c: Record<string, unknown>) { return c }`. Record which in the report.

- [ ] **Step 5: Create `apps/blog/vitest.config.ts`** (mirror `packages/identity/vitest.config.ts`)

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 6: Create `apps/blog/types/global.d.ts`**

```ts
// Ambient CSS module declarations for side-effect style imports.
// Next 16 does not ship these globally; the docs app declares the same.
declare module '*.css'
```

- [ ] **Step 7: Create `apps/blog/.gitignore`** (mirror `apps/docs/.gitignore`)

```gitignore
node_modules/
.next/
out/
*.tsbuildinfo
```

- [ ] **Step 8: Create `apps/blog/eslint.config.mjs`** (mirror `apps/docs/eslint.config.mjs`)

```js
// Flat config (ESLint 9+/10). `next lint` was removed in Next 16, so linting
// runs through `eslint .` directly. eslint-config-next exposes its presets as
// subpath exports: core-web-vitals and the TypeScript rules. Each subpath
// exports a `Linter.Config[]` (flat-config array), so we default-import and
// spread it — same pattern as apps/docs, apps/landing and apps/playground.
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: ['out/**', '.next/**', 'node_modules/**', 'next-env.d.ts', '**/*.mdx'],
  },
];

export default config;
```

- [ ] **Step 9: Install**

Run: `pnpm install`
Expected: exit 0. No `ERR_PNPM_IGNORED_BUILDS` for `sharp` (already `sharp: false` workspace-wide). If pnpm inserts a `sharp: …` placeholder into `pnpm-workspace.yaml`, set it to `false` (it is already — confirm it stays `false` and committed).

- [ ] **Step 10: Verify the installed `nextra-theme-blog@4.6.1` API (authoritative for Task 2 + Task 3)**

Read these files under `apps/blog/node_modules/nextra-theme-blog/dist/` and record the findings in the task report:

1. **Exports + `Layout` signature.** Inspect `dist/layout.js` (and `package.json` `exports`/`main`). Confirm: (a) there is NO `LayoutPropsSchema` / `safeParse` (no #5008 patch needed); (b) what props `Layout` accepts (spike says `children`/`nextThemes`/`banner` only — confirm); (c) whether `Navbar`, `PostCard`, `Footer`, `ThemeSwitch`, `Comments` are named exports (spike says yes).
2. **`PostCard` props.** Inspect the `PostCard` export (likely `dist/post-card.js` or in `dist/index.js`). Record the exact prop names it accepts (expected: `title`, `date`, `description`, `href`/`route`, possibly `author`/`tags`). Task 3's `post-list.tsx` passes these.
3. **`useMDXComponents` export.** Confirm it is exported from the package main (spike says yes). If not, Step 4's fallback applies.
4. **CSS variables.** Read `dist/style.css` (the file imported by `import 'nextra-theme-blog/style.css'`). List the CSS custom properties the theme defines (e.g. `--nextra-*`, `--x-*`, or its own `--blog-*`/hex-based tokens). These are the real names Task 2's `globals.css` must override — record them verbatim. Note whether the theme exposes HSL-component vars (like docs) or direct color vars.
5. **Config-file vs composable.** Confirm whether 4.6.1 reads a `theme.config.js` (`footer`/`head`/`readMore`/`navs`/`darkMode`) or is purely composable. This determines Task 2's layout approach.

Record all five findings in the report under a `## Blog theme API (Task 1 verification)` heading. These findings are Task 2 + Task 3's source of truth — they override any assumption in this plan.

- [ ] **Step 11: Commit**

```bash
git add apps/blog/package.json apps/blog/tsconfig.json apps/blog/next.config.mjs \
  apps/blog/mdx-components.tsx apps/blog/vitest.config.ts apps/blog/types/global.d.ts \
  apps/blog/.gitignore apps/blog/eslint.config.mjs pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "feat(blog): scaffold apps/blog Nextra site with pinned deps"
```

---

### Task 2: Root layout (composable) + brand CSS + Satoshi font + not-found

**Files:**
- Create: `apps/blog/app/layout.tsx`
- Create: `apps/blog/app/blog-navbar.tsx`
- Create: `apps/blog/app/globals.css`
- Create: `apps/blog/app/not-found.tsx`
- Create: `apps/blog/app/page.mdx` (minimal placeholder — Task 4 replaces with the real home)
- Copy: `apps/blog/app/fonts/*.woff2` from `apps/docs/app/fonts/`

**Interfaces:**
- Consumes: Task 1's recorded blog-theme API (exports, `Layout` props, CSS variables). `crossNavLinks` + `NavLink` from `@nanisoft/identity`.
- Produces: a building blog app (`pnpm -F @nanisoft/blog build` → `out/index.html` + `out/404.html`) with the brand applied. Consumed by Tasks 3–6.

- [ ] **Step 1: Copy the Satoshi fonts**

Run: `cp apps/docs/app/fonts/*.woff2 apps/blog/app/fonts/` (create `apps/blog/app/fonts/` first).
Expected: 5 files — `Satoshi-Regular.woff2`, `Satoshi-Italic.woff2`, `Satoshi-Medium.woff2`, `Satoshi-Bold.woff2`, `Satoshi-BoldItalic.woff2`.

- [ ] **Step 2: Create `apps/blog/app/blog-navbar.tsx`** (mirror `apps/docs/app/docs-navbar.tsx`, add category links)

```tsx
import Link from 'next/link'
import type { NavLink } from '@nanisoft/identity'

/**
 * Cross-site + category bar for the blog. Mirrors apps/docs/app/docs-navbar.tsx:
 * the wordmark is the literal 'nanisoft' and links same-tab to the marketing
 * site; the shared crossNavLinks list is the same data the landing/docs render.
 * Category links (Engineering / Announcements) are internal routes on this site.
 */
export default function BlogNavbar({ links }: { links: readonly NavLink[] }) {
  return (
    <nav
      aria-label="Cross-site"
      style={{ display: 'flex', gap: 16, alignItems: 'center' }}
    >
      <Link
        href="https://nanisoft.com"
        style={{ fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
      >
        nanisoft
      </Link>
      <Link href="/engineering" style={{ color: 'inherit', textDecoration: 'none' }}>
        Engineering
      </Link>
      <Link href="/announcements" style={{ color: 'inherit', textDecoration: 'none' }}>
        Announcements
      </Link>
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

> If Task 1 found the config-file API, this component is unused and nav is configured via `navs` in `blog.config.js` instead — record that in the report and skip rendering it in Step 3.

- [ ] **Step 3: Create `apps/blog/app/layout.tsx`** (composable path — adjust if Task 1 found the config-file API)

```tsx
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Layout } from 'nextra-theme-blog'
import 'nextra-theme-blog/style.css'
import { crossNavLinks } from '@nanisoft/identity'
import BlogNavbar from './blog-navbar'
import './globals.css'

// Satoshi is the voice face (UI/body/headings). Mirrors apps/docs/app/layout.tsx:
// Regular, Italic, Medium, Bold, BoldItalic. `variable` exposes --font-satoshi
// on <html> so globals.css can point the theme's font token at it.
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

export const metadata: Metadata = {
  title: { template: '%s — nanisoft blog', default: 'nanisoft blog' },
  description:
    'Engineering deep-dives and announcements from the nanisoft digital twin of the IT estate.',
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className={satoshi.variable} suppressHydrationWarning>
      <body>
        <Layout nextThemes={{ defaultTheme: 'system' }}>
          <BlogNavbar links={crossNavLinks} />
          {children}
        </Layout>
      </body>
    </html>
  )
}
```

> **Adapt per Task 1's findings:** (a) If `Layout` accepts a `banner` prop and you want a banner, add it. (b) If the theme has a dedicated `navbar` slot on `Layout` (a prop), move `<BlogNavbar>` there instead of nesting it above `{children}`. (c) If `Layout` does NOT wrap children with chrome and `Navbar`/`Footer` are separate exports, import and render them as siblings: `<Navbar><BlogNavbar links={crossNavLinks} /></Navbar>` above `<Layout>` and `<Footer>…</Footer>` below. (d) If Task 1 found the config-file API, replace this file with: `nextra({ theme: 'nextra-theme-blog', themeConfig: './blog.config.js' })` in `next.config.mjs` + create `apps/blog/blog.config.js` exporting `{ footer: <span>{new Date().getFullYear()} · nanisoft</span>, navs: [{ url: 'https://docs.nanisoft.com', name: 'Docs' }, { url: 'https://nanisoft.com', name: 'nanisoft' }], darkMode: true, readMore: 'Read more →' }`, and drop the explicit `Layout`/`BlogNavbar` imports. The composable path above is the default per Spike 1.

- [ ] **Step 4: Create `apps/blog/app/globals.css`** (brand overlay — map the values below onto the blog theme's REAL variables recorded in Task 1 Step 10.4)

```css
/*
 * nanisoft brand overlay on nextra-theme-blog.
 *
 * Values mapped from @nanisoft/identity (same as apps/docs/app/globals.css):
 *   base = petrol + bone · secondary = teal · accent = jade (live/active only)
 *   No purple, no neon, no pure black, no pure white.
 *
 * IMPORTANT — the blog theme's REAL variable API (verified in Task 1 Step 10.4
 *   against nextra-theme-blog@4.6.1/dist/style.css):
 * [PASTE THE REAL VARIABLE NAMES RECORDED IN TASK 1 HERE.]
 * The hex/HSL values below are the brand source of truth; the variable names
 * that receive them are the theme's real names (which differ from the docs
 * theme). If the blog theme exposes HSL-component vars like the docs theme, use
 * the HSL values; if it exposes direct color vars, use the hex values.
 */

:root {
  /* Primary = petrol #0C2A33 ≈ hsl(194, 62%, 12%). */
  /* Page background (light) = bone #F4EFE6 ≈ rgb(244, 239, 230). */
  /* Map these onto the blog theme's primary + background variables. */
}

.dark {
  /* Dark mode: background petrolDeep #08222A ≈ rgb(8, 34, 42);
     primary shifts to teal #2A8C97 ≈ hsl(186, 57%, 38%) for legibility. */
}

/* Satoshi font — the localFont loader in layout.tsx defines --font-satoshi.
   Point the blog theme's body/font token at it (use the real font var name
   from Task 1; --x-font-sans if the blog theme uses the same Tailwind v4
   tokens as the docs theme, otherwise the theme's own font variable). */
:root {
  --font-satoshi: 'Satoshi', system-ui, -apple-system, sans-serif;
}
body {
  font-family: var(--font-satoshi), 'Satoshi', system-ui, -apple-system, sans-serif;
}

/* Jade #14A77A is reserved for live/active states only — never decorative. */
nav a[aria-current='page'],
nav a[aria-current='true'] {
  color: #14A77A;
}

/* Focus ring = darkened teal #1F6E78. */
:where(a, button, input, [tabindex]):focus-visible {
  outline-color: #1F6E78;
}
```

> The `[PASTE …]` line is the ONE place this plan defers to Task 1's discovery — it is not a placeholder to ship. The implementer replaces it with the real variable names recorded in Task 1 Step 10.4 and writes the actual override declarations (e.g. `--nextra-primary-hue: 194deg;` or `--blog-bg: #F4EFE6;` — whichever the theme exposes). The brand hex/HSL values are fixed above. Commit only with the real names filled in.

- [ ] **Step 5: Create `apps/blog/app/not-found.tsx`** (mirror `apps/docs/app/not-found.tsx`)

```tsx
export default function NotFound() {
  return <p>Not found.</p>
}
```

- [ ] **Step 6: Create a minimal `apps/blog/app/page.mdx`** (placeholder home — Task 4 replaces it)

```mdx
# nanisoft blog

Engineering deep-dives and announcements from the nanisoft team.
```

- [ ] **Step 7: Build and verify**

Run: `pnpm -F @nanisoft/blog build`
Expected: exit 0; `apps/blog/out/index.html` and `apps/blog/out/404.html` exist. The build must NOT crash with a `safeParse`/`LayoutPropsSchema` error (confirms no #5008 patch is needed). If it does crash with that error, the blog theme DOES have Zod validation in 4.6.1 — stop and report (the spike would be wrong); apply a `pnpm patch` mirroring the docs #5008 fix and re-verify.

- [ ] **Step 8: Confirm brand CSS reached the build**

Run: `grep -l "14A77A" apps/blog/out/_next/static/css/*.css` (jade present) and `grep -l "Satoshi" apps/blog/out/_next/static/css/*.css` (font present).
Expected: at least one CSS file matches each.

- [ ] **Step 9: Commit**

```bash
git add apps/blog/app/layout.tsx apps/blog/app/blog-navbar.tsx apps/blog/app/globals.css \
  apps/blog/app/not-found.tsx apps/blog/app/page.mdx apps/blog/app/fonts
git commit -m "feat(blog): async root layout with brand CSS, Satoshi font, 404"
```

---

### Task 3: `PostList` — pure `collectPosts` + unit test + server component

**Files:**
- Create: `apps/blog/lib/posts.ts`
- Create: `apps/blog/tests/posts.test.ts`
- Create: `apps/blog/app/post-list.tsx`

**Interfaces:**
- Consumes: `getPageMap` from `nextra/page-map`. `PostCard` from `nextra-theme-blog` (props verified in Task 1 Step 10.2). The Nextra `pageMap` shape: an array of items where each item is `{ name, route, title?, frontMatter?, children? }` (folders carry `children`; the home/category-index pages have routes `/` and `/<category>`; posts have routes `/<category>/<slug>` and a `frontMatter.date` string).
- Produces: `collectPosts(pageMap, prefix?)` — a pure function returning `Post[]` sorted newest-first — used by `app/post-list.tsx`, which is used by the home + category index pages in Task 4.

- [ ] **Step 1: Write the failing test `apps/blog/tests/posts.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { collectPosts, type PageMapItem } from '../lib/posts'

// Fixture mirroring the Nextra page map for the blog (home + 2 categories,
// each with an index page + one post). Posts carry frontMatter.date.
const pageMap: PageMapItem[] = [
  { name: 'index', route: '/', title: 'Home', frontMatter: {} },
  {
    name: 'engineering',
    route: '/engineering',
    title: 'Engineering',
    frontMatter: {},
    children: [
      { name: 'index', route: '/engineering', title: 'Engineering', frontMatter: {} },
      {
        name: 'producing-the-access-twin',
        route: '/engineering/producing-the-access-twin',
        title: 'Producing the access twin',
        frontMatter: {
          title: 'Producing the access twin',
          date: '2026-08-27',
          description: 'Bronze to Gold.',
          author: 'nanisoft',
          tags: ['architecture', 'access'],
        },
      },
    ],
  },
  {
    name: 'announcements',
    route: '/announcements',
    title: 'Announcements',
    frontMatter: {},
    children: [
      { name: 'index', route: '/announcements', title: 'Announcements', frontMatter: {} },
      {
        name: 'hello-nanisoft-blog',
        route: '/announcements/hello-nanisoft-blog',
        title: 'Hello, nanisoft blog',
        frontMatter: {
          title: 'Hello, nanisoft blog',
          date: '2026-08-28',
          description: 'Why this blog exists.',
          author: 'nanisoft',
          tags: ['meta'],
        },
      },
    ],
  },
]

describe('collectPosts', () => {
  it('returns all posts sorted newest-first when no prefix is given', () => {
    const posts = collectPosts(pageMap)
    expect(posts).toHaveLength(2)
    expect(posts[0].route).toBe('/announcements/hello-nanisoft-blog') // 2026-08-28
    expect(posts[1].route).toBe('/engineering/producing-the-access-twin') // 2026-08-27
  })

  it('filters to one category when a prefix is given', () => {
    expect(collectPosts(pageMap, '/engineering').map((p) => p.route)).toEqual([
      '/engineering/producing-the-access-twin',
    ])
    expect(collectPosts(pageMap, '/announcements').map((p) => p.route)).toEqual([
      '/announcements/hello-nanisoft-blog',
    ])
  })

  it('excludes the home page and category index pages', () => {
    const routes = collectPosts(pageMap).map((p) => p.route)
    expect(routes).not.toContain('/')
    expect(routes).not.toContain('/engineering')
    expect(routes).not.toContain('/announcements')
  })

  it('maps frontmatter onto the Post shape', () => {
    const [post] = collectPosts(pageMap, '/engineering')
    expect(post).toEqual({
      route: '/engineering/producing-the-access-twin',
      title: 'Producing the access twin',
      date: '2026-08-27',
      description: 'Bronze to Gold.',
      author: 'nanisoft',
      tags: ['architecture', 'access'],
    })
  })

  it('returns an empty array when the category has no posts', () => {
    expect(collectPosts(pageMap, '/nope')).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm -F @nanisoft/blog test`
Expected: FAIL — `collectPosts` is not defined / `../lib/posts` cannot resolve.

- [ ] **Step 3: Implement `apps/blog/lib/posts.ts`**

```ts
/**
 * Post collection logic for the blog. `collectPosts` is a pure function over the
 * Nextra page map so it is unit-testable without a Next build. A "post" is a
 * page one level deep under a category (`/<category>/<slug>`) that carries a
 * `frontMatter.date` string. Home (`/`) and category indexes (`/<category>`)
 * are excluded by route shape. Sort is newest-first by ISO `date` (string
 * comparison is correct for `YYYY-MM-DD`).
 */

export interface PageMapItem {
  name: string
  route: string
  title?: string
  frontMatter?: Record<string, unknown>
  children?: PageMapItem[]
}

export interface Post {
  route: string
  title: string
  date: string
  description: string
  author: string
  tags: string[]
}

function flatten(items: PageMapItem[], acc: PageMapItem[] = []): PageMapItem[] {
  for (const it of items) {
    acc.push(it)
    if (it.children) flatten(it.children, acc)
  }
  return acc
}

/** A post route is exactly two segments: /<category>/<slug>. With `category`,
 *  the first segment must equal it. */
function isPostRoute(route: string, category?: string): boolean {
  if (!route.startsWith('/')) return false
  const segments = route.split('/').filter(Boolean)
  if (segments.length !== 2) return false
  return category ? segments[0] === category : true
}

export function collectPosts(pageMap: PageMapItem[], prefix?: string): Post[] {
  const category = prefix ? prefix.replace(/^\//, '') : undefined
  return flatten(pageMap)
    .filter(
      (it) =>
        it.frontMatter !== undefined &&
        typeof it.frontMatter.date === 'string' &&
        isPostRoute(it.route, category),
    )
    .map((it) => {
      const fm = it.frontMatter as Record<string, unknown>
      return {
        route: it.route,
        title: String(fm.title ?? it.title ?? it.name),
        date: fm.date as string,
        description: String(fm.description ?? ''),
        author: String(fm.author ?? ''),
        tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm -F @nanisoft/blog test`
Expected: PASS — all 5 tests green.

- [ ] **Step 5: Create `apps/blog/app/post-list.tsx`** (async server component)

```tsx
import { getPageMap } from 'nextra/page-map'
import { collectPosts } from '@/lib/posts'
import { PostCard } from 'nextra-theme-blog'

/**
 * Renders the blog's post list. `prefix` filters to one category (e.g.
 * "/engineering"); omit it for the home page (all posts, newest-first).
 * `PostCard` props follow the Task 1 Step 10.2 verification — adapt the prop
 * names there if the installed theme differs.
 */
export default async function PostList({ prefix }: { prefix?: string }) {
  const posts = collectPosts(await getPageMap(), prefix)
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {posts.map((p) => (
        <li key={p.route}>
          <PostCard title={p.title} date={p.date} description={p.description} href={p.route} />
        </li>
      ))}
    </ul>
  )
}
```

> **Adapt per Task 1 Step 10.2:** if `PostCard` is not exported, or its props differ (e.g. it takes `post={{title,date,description,href}}` or named props `route`/`author`), adjust the JSX accordingly. If `PostCard` is unavailable, fall back to a plain anchor card: `<a href={p.route}><h2>{p.title}</h2><time>{p.date}</time><p>{p.description}</p></a>`. Record the chosen shape in the report.

- [ ] **Step 6: Build to confirm the component compiles**

Run: `pnpm -F @nanisoft/blog build`
Expected: exit 0 (the home placeholder from Task 2 still builds; `PostList` is not yet referenced by a page — Task 4 wires it in — but it must compile).

- [ ] **Step 7: Commit**

```bash
git add apps/blog/lib/posts.ts apps/blog/tests/posts.test.ts apps/blog/app/post-list.tsx
git commit -m "feat(blog): add PostList with collectPosts filter/sort + unit test"
```

---

### Task 4: Content tree — home + 2 category indexes + 2 seed posts + full gate

**Files:**
- Modify: `apps/blog/app/page.mdx` (real home rendering `<PostList />`)
- Create: `apps/blog/app/engineering/page.mdx`
- Create: `apps/blog/app/announcements/page.mdx`
- Create: `apps/blog/app/engineering/producing-the-access-twin/page.mdx`
- Create: `apps/blog/app/announcements/hello-nanisoft-blog/page.mdx`

**Interfaces:**
- Consumes: `PostList` from `../post-list` (Task 3).
- Produces: the full blog route tree — `/`, `/engineering`, `/announcements`, `/engineering/producing-the-access-twin`, `/announcements/hello-nanisoft-blog` — all in `out/`.

- [ ] **Step 1: Replace `apps/blog/app/page.mdx` with the real home**

```mdx
import PostList from './post-list'

# nanisoft blog

Engineering deep-dives and announcements from the nanisoft team — on building
the digital twin of the IT estate.

<PostList />
```

- [ ] **Step 2: Create `apps/blog/app/engineering/page.mdx`**

```mdx
import PostList from '../post-list'

# Engineering

How the twin is built and how it thinks.

<PostList prefix="/engineering" />
```

- [ ] **Step 3: Create `apps/blog/app/announcements/page.mdx`**

```mdx
import PostList from '../post-list'

# Announcements

News, releases, and notes from the nanisoft team.

<PostList prefix="/announcements" />
```

- [ ] **Step 4: Create `apps/blog/app/engineering/producing-the-access-twin/page.mdx`**

```mdx
export const meta = {
  title: 'Producing the access twin',
  date: '2026-08-27',
  description: 'How source data becomes the access twin — Bronze to Gold, one resolved node at a time.',
  author: 'nanisoft',
  tags: ['architecture', 'access'],
}

# Producing the access twin

The access twin is not assembled — it is produced. Source data lands untouched,
is conformed until identities are stable, and resolves into a graph that answers
access questions by traversal. This is how a question like "who can reach this
system?" stops being three exports stitched together and becomes one walk of the
graph.

## Land, untouched

Raw source data lands in Bronze. Nothing is interpreted at the door —
directories, HR systems, databases, and applications arrive as they are. The
twin's trustworthiness starts here: every later claim is traceable to a record
that was never silently rewritten on entry.

## Conform to one node

Records are cleaned, joined, and resolved until identities are stable. One
person becomes one node — not a directory entry, a HR row, and a database
account held together by guesswork. Memberships, grants, and activity become
edges on those resolved nodes.

## Resolve into the graph

Conformed facts resolve into the graph: nodes and edges. This graph is the
twin. Access traversal is the first question it answers — trace every path
between a person and a sensitive product, surface views with no membership
backing them, and read each finding as edges, a row, or a chart.

The full platform story — orchestration, versioned layers, quality gates — is
in the [docs](https://docs.nanisoft.com).
```

- [ ] **Step 5: Create `apps/blog/app/announcements/hello-nanisoft-blog/page.mdx`**

```mdx
export const meta = {
  title: 'Hello, nanisoft blog',
  date: '2026-08-28',
  description: 'What we will publish here, and why.',
  author: 'nanisoft',
  tags: ['meta'],
}

# Hello, nanisoft blog

This is the nanisoft blog. We will publish two kinds of thing here:

- **Engineering deep-dives** — how the twin is built and how it thinks, from the
  Bronze-to-Gold pipeline to the traversal engine.
- **Announcements** — releases, milestones, and notes from the team.

The twin is a graph off a real data platform, with quality gates and versioned
layers, that stays trustworthy as the estate changes. We will write about the
decisions behind that, the open-source parts we compose, and the use-cases it
unlocks — access traversal first, blast radius and stale-access cleanup next.

Read the [docs](https://docs.nanisoft.com), or take the in-browser
[playground](https://playground.nanisoft.com) tour to see a query traverse the
twin end to end.
```

- [ ] **Step 6: Build and verify the full route tree**

Run: `pnpm -F @nanisoft/blog build`
Expected: exit 0; these files all exist:
- `apps/blog/out/index.html`
- `apps/blog/out/engineering.html`
- `apps/blog/out/announcements.html`
- `apps/blog/out/engineering/producing-the-access-twin.html`
- `apps/blog/out/announcements/hello-nanisoft-blog.html`

If any route is missing or the build crashes, investigate the `PostList`/`PostCard` wiring (Task 1 Step 10.2 + Task 3 Step 5 adaptation).

- [ ] **Step 7: Run the full repo gate**

Run: `pnpm -r run lint && pnpm -r run test && pnpm -r run build`
Expected: all green. `apps/blog` lint: 0 errors (`_meta`-style anonymous-default-export warnings do not apply — the blog has no `_meta.js`; if any warnings appear, they are benign). `apps/blog` test: 5 `posts.test.ts` tests pass. All apps build.

- [ ] **Step 8: Brand + grep gate on the built site**

Run:
- `grep -rn "request a demo" apps/blog/out apps/blog/app` → no matches.
- `grep -rn "mailto:" apps/blog/out apps/blog/app` → no matches.
- `grep -l "14A77A" apps/blog/out/_next/static/css/*.css` → at least one match (jade).
- `grep -l "Satoshi" apps/blog/out/_next/static/css/*.css` → at least one match (font).
- `grep -oE "(#000000|#FFFFFF)" apps/blog/out/_next/static/css/*.css` → no matches (no pure black/white).

Expected: all as above.

- [ ] **Step 9: Commit**

```bash
git add apps/blog/app/page.mdx apps/blog/app/engineering/page.mdx \
  apps/blog/app/announcements/page.mdx \
  apps/blog/app/engineering/producing-the-access-twin/page.mdx \
  apps/blog/app/announcements/hello-nanisoft-blog/page.mdx
git commit -m "feat(blog): content tree with home, 2 category indexes, 2 seed posts"
```

---

### Task 5: Cloudflare Pages deploy config + CI `deploy-blog` job

**Files:**
- Modify: `.github/workflows/deploy.yml` (append `deploy-blog` job after `deploy-docs`)

**Interfaces:**
- Consumes: the building blog app from Task 4 (`cloudflare-build` script = `next build --webpack` → `out/`).
- Produces: a `deploy-blog` CI job that deploys `apps/blog/out/` to Cloudflare Pages project `nanisoft-blog` on push-to-main, gated on `verify` + `e2e`.

- [ ] **Step 1: Append the `deploy-blog` job to `.github/workflows/deploy.yml`**

Add this job after the `deploy-docs` job (mirror `deploy-docs` exactly — change only the name, the filter, and the project-name):

```yaml
  deploy-blog:
    name: Deploy blog → blog.nanisoft.com (Pages)
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
        # Produces apps/blog/out — the static site Cloudflare Pages serves.
        # `cloudflare-build` is `next build --webpack` (Nextra 4.6.1 static
        # export); verify already runs this same build on PRs via
        # `pnpm -r run build`, so PRs gate the blog site before merge.
        run: pnpm --filter @nanisoft/blog run cloudflare-build
      - name: Deploy to Cloudflare Pages
        # `wrangler pages deploy out --project-name nanisoft-blog` creates the
        # `nanisoft-blog` Pages project on first run. After the first deploy,
        # add the blog.nanisoft.com custom domain + DNS record in the
        # Cloudflare Pages dashboard (one-time, manual — same as docs). The
        # CLOUDFLARE_API_TOKEN secret must have scope covering Cloudflare Pages.
        run: pnpm --filter @nanisoft/blog run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

- [ ] **Step 2: Confirm the job is well-formed**

Run: `grep -nE "^\s+(verify|e2e|deploy-landing|deploy-playground|deploy-docs|deploy-blog):" .github/workflows/deploy.yml`
Expected: all six job IDs listed, `deploy-blog` last. Confirm `deploy-blog`'s `needs: [verify, e2e]` references real job IDs (they are at the top of the file).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci(blog): add deploy-blog Cloudflare Pages job for blog.nanisoft.com"
```

---

### Task 6: Whole-site self-review + manual smoke

**Files:**
- No new files. Verification only; commit only if a fix is needed.

**Interfaces:**
- Consumes: the complete blog site (Tasks 1–5). The deferred-minors discipline from WS2 (park minors for the final whole-branch review, do not fix them here unless a gate genuinely fails).

- [ ] **Step 1: Re-run all gates from the repo root**

Run: `pnpm -r run lint && pnpm -r run test && pnpm -r run build`
Expected: all green (lint 0 errors, all tests pass incl. the 5 `posts.test.ts`, all apps build).

- [ ] **Step 2: Brand check on the built static site (no browser needed)**

Read `apps/blog/out/index.html`:
- Confirm the cross-site nav links (Docs/Blog/About us/Contact us) point at `https://docs.nanisoft.com`, `https://blog.nanisoft.com`, `https://nanisoft.com/about-us`, `https://nanisoft.com/about-us#contact` and render with `target="_blank"` + `rel="noopener noreferrer"`.
- Confirm category links Engineering/Announcements point at `/engineering` + `/announcements`.
- Confirm the home page lists both seed posts (titles present), newest-first (the 2026-08-28 announcement before the 2026-08-27 engineering post).

Read the generated CSS under `apps/blog/out/_next/static/css/*.css`:
- Confirm petrol/bone/teal brand values are present (the variables discovered in Task 1, set in Task 2).
- Confirm jade (`#14A77A`) appears ONLY on an `aria-current` state, not as a decorative background/border.
- Confirm no pure `#000000`/`#FFFFFF`. Confirm Satoshi is the font-family.

- [ ] **Step 3: Route check**

Confirm all five routes resolve in `out/`: `index.html`, `engineering.html`, `announcements.html`, `engineering/producing-the-access-twin.html`, `announcements/hello-nanisoft-blog.html`. Confirm `404.html` exists.

- [ ] **Step 4: Grep gate**

Run: `grep -rn "request a demo" apps/blog/ && grep -rn "mailto:" apps/blog/` → no matches (exclude `node_modules`/`out`/`.next`).

- [ ] **Step 5: Patch-durability / no-patch check**

Run: `rm -rf apps/blog/node_modules && pnpm install`
Then: `grep -n "safeParse" apps/blog/node_modules/nextra-theme-blog/dist/layout.js` → **no matches** (confirms the blog theme has no Zod schema and no patch is needed; the install must still succeed without any `patchedDependencies` for the blog theme).
Then re-build: `pnpm -F @nanisoft/blog build` → green, `out/` produced.

- [ ] **Step 6: Commit (only if a verification fix was needed)**

If any gate above failed and a fix was applied, commit it with `fix(blog): …`. If all gates were green, no commit — report "no fix commit — gates clean".

- [ ] **Step 7: Write the manual-smoke checklist for the user into the report**

The branch is not deployed until merged to main, so the live-site smoke is a user action. Write this checklist into the task report:
1. Push `main` → watch the `deploy-blog` CI job go green.
2. In the Cloudflare Pages dashboard, bind `blog.nanisoft.com` as a custom domain on the `nanisoft-blog` project (+ DNS record).
3. Visit `blog.nanisoft.com` — home lists both posts, newest-first.
4. Visit `blog.nanisoft.com/engineering` + `blog.nanisoft.com/announcements` — each lists its category's post(s).
5. Open a post (`/engineering/producing-the-access-twin`) — title + date + body render.
6. Click the cross-site nav links (Docs/About us/Contact us open new tabs to the right domains; the wordmark goes to nanisoft.com same-tab).
7. Confirm `CLOUDFLARE_API_TOKEN` scope covers Cloudflare Pages:Edit (same token as docs — likely already satisfied; confirm before first deploy).

---

## Self-Review

**1. Spec coverage.** Each spec section maps to a task:
- Architecture (apps/blog, Nextra blog theme, no patch, composable, static export, Cloudflare Pages) → Task 1 + Task 2 + Task 5.
- Content model (categories as folders, post frontmatter, `PostList` component, home + category indexes, 2 seed posts) → Task 3 + Task 4.
- Branding (mirror docs, CSS-token verification caveat, Satoshi, jade-active-only, dark-mode teal) → Task 2 (with Task 1 discovery).
- Cross-site nav (reuse `crossNavLinks`, external noopener, wordmark same-tab, no banned phrases) → Task 2 (`BlogNavbar`) + Task 6 (grep gate).
- CI/deploy (`deploy-blog` job, gated, custom-domain comment) → Task 5.
- Testing (`PostList` unit test, standard gates, brand/grep gate) → Task 3 (test) + Task 4 (gates) + Task 6 (brand/grep).
- Global constraints (pinned versions, `--webpack`, `mdx-components.tsx`, no patch, no `pageMap` prop, brand tokens, deploy target, `sharp:false`, TS 6.0.3, AGENTS.md) → restated in Global Constraints + enforced across tasks.
- Out of scope (RSS, tag pages, author pages, comments, search, pagination) → deliberately no task. Confirmed.

**2. Placeholder scan.** The single `[PASTE …]` line in Task 2 Step 4 is an explicit instruction to fill in Task 1's discovered CSS variable names — it is not a shipped placeholder, and Step 4 forbids committing until it is filled. No other TBD/TODO/"add appropriate error handling"/"similar to Task N" present. All code blocks contain real code. All frontmatter has real values + real prose.

**3. Type consistency.** `Post` / `PageMapItem` / `collectPosts(pageMap, prefix?)` are defined in Task 3 and consumed unchanged in `post-list.tsx` (Task 3 Step 5) and the page.mdx files (Task 4). `PostCard` props are referenced consistently and explicitly tied to Task 1's verification. `crossNavLinks` / `NavLink` are the WS2-shipped names from `@nanisoft/identity` (confirmed in `packages/identity/src/crossNav.ts`).

**Notes for the implementer (controller dispatches):** Task 1's API verification is authoritative — where the plan says "adapt per Task 1", the implementer reads the Task 1 report (or re-inspects `dist`) and follows the installed theme, recording the choice. This mirrors WS2, where the docs theme's real CSS-variable + Layout API differed from the brief and the implementer correctly adapted.