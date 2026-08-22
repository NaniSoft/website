Type: research
Status: resolved
Blocked by:

## Question

This repo runs a **modified Next.js** with breaking changes (per AGENTS.md — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`; read the relevant guide in `node_modules/next/dist/docs/` before concluding anything). What does this build actually support, and what are the hard constraints, for:

1. A **pnpm monorepo** with two Next.js apps (`apps/landing`, `apps/playground`) + a shared `packages/architecture` (workspace package consumed by both apps). Does the app-router / project structure allow this? Any config deviations from stock Next.js?
2. **Client-side interactivity** for the playground: heavy client components, in-browser state, a flow-graph spine, and mocked tool UIs with animation. What motion / canvas / graph-rendering libraries are known to work with this build? Any SSR / client-component constraints?
3. **Subdomain routing/serving** — is there anything in this modified build that affects serving one app at nanisoft.com and another at playground.nanisoft.com?

Resolve by reading the docs in `node_modules/next/dist/docs/` (resolved from the repo root) and the modified source where relevant. Output a concise findings report: what's supported, what's constrained, and recommended stack choices (state management, graph-rendering lib, motion lib) *verified* against this build. Save findings on branch `research/nextjs-capability` and link from this ticket.

This gates the playground prototype (ticket 04) and the deployment research (ticket 02).

## Answer

> Full report: [`research/nextjs-capability-findings.md`](../../../research/nextjs-capability-findings.md) (branch `research/nextjs-capability`, commit 1a0275f).

### Headline correction

**This is stock Next.js 16.3.1 from `vercel/next.js`, not a fork.** Verified at
`node_modules/next/package.json`. The AGENTS.md "hard rule" block is the
**standard auto-generated agent-rules block** written by `next dev` for AI
agents (`node_modules/next/dist/server/lib/generate-agent-files.js`). Its
"NOT the Next.js you know" wording warns it differs from *older Next.js
(training data)*, not from stock Next.js. The "breaking changes" are the real
Next.js 16 upgrade changes (`docs/01-app/02-guides/upgrading/version-16.md`).

### (1) pnpm monorepo — two apps + shared package: SUPPORTED

Each app is an **independent Next.js project** with its own `next.config.mjs`;
there is no built-in `apps/*` multi-app project convention, but the CLI accepts
a path to a Next.js app in a monorepo (`next typegen ./apps/web`). Docs confirm
`apps/web` importing `packages/ui` via `transpilePackages`
(`docs/.../05-config/01-next-config-js/transpilePackages.md` line 26).
**`packages/architecture` is a pnpm workspace package.** `pnpm-workspace.yaml`
exists but has no `packages:` glob — add `packages: [apps/*, packages/*]`.
**No config deviation from stock Next.js is required.** Prefer shipping
`packages/architecture` as built ESM; under default Turbopack the old
`transpilePackages` list "actually breaks React resolution" per the existing
`next.config.mjs` comment, so verify before adding it.

### (2) Client interactivity for the playground: SUPPORTED (already proven)

`'use client'` works (21 components use it), `motion/react` (motion v13.1.0,
React 19 peer `^18||^19`) works in `Hero.tsx`, `react-force-graph-2d` works via
`dynamic(...,{ssr:false})` in `KGCanvas.tsx`. **Hard constraint:** `dynamic(...,
{ssr:false})` is **forbidden inside Server Components in Next 16** — use a
`'use client'` wrapper (existing pattern: `KnowledgeGraphLazy.tsx`). Browser
APIs must be guarded in `useEffect`/`dynamic({ssr:false})`; React context needs
a client provider (existing `ThemeProvider` pattern); only `NEXT_PUBLIC_` env
vars reach the client; Server→Client props must be serializable. **Recommended
playground posture: client-first app** (a `'use client'` root shell owns all
state) to sidestep the Server/Client boundary.

### (3) Subdomain serving: NO BUILD CONSTRAINT

No built-in subdomain-based multi-app routing exists. **Multi-Zones is
path-based** (rewrites + `assetPrefix` to route *paths* to other zones'
domains; `docs/.../02-guides/multi-zones.md`), not subdomain-based.
`nanisoft.com` + `playground.nanisoft.com` are **two different hostnames = two
independent Next.js deployments** — the hostname routing is a deployment/DNS/
reverse-proxy/platform concern (ticket 02), not a Next.js build constraint.
Available serving modes: `next start` / `output:'standalone'` /
`output:'export'` / Build Adapters (`adapterPath`, Vercel + Bun verified) /
custom server. Nothing in this build prevents the two-subdomain setup.

### Recommended playground stack (verified against this build)

- **State:** **Zustand** (lightweight, React 19 compatible v4.5.6+/v5, arrives
  transitively with @xyflow/react; fits session-only + export/import + reset).
- **Graph:** **`@xyflow/react` (React Flow v12)** for the structured flow-graph
  spine (peer `react >=17` → React 19 OK; ensure `zustand >= 4.5.6`; custom
  nodes render antd + motion; dagre auto-layout; `'use client'`), **plus
  `react-force-graph-2d`** (already installed + proven) for the landing hero
  spectacle. Rejected d3 (low-level) and cytoscape (less React-idiomatic).
- **Motion:** **`motion` v13.1.0** (`motion/react`, already installed + proven;
  React 19 peer). Rejected GSAP (imperative, poorer component fit; only if a
  specific timeline need arises).

### Next 16 deprecations affecting this project

Turbopack default (custom webpack fails build; `--webpack` opt-out) ·
`middleware`→`proxy` (edge runtime NOT supported in proxy; nodejs only) ·
async `cookies`/`headers`/`params`/`searchParams` (sync access removed) ·
`next lint` removed (use ESLint/Biome) · `serverRuntimeConfig`/`publicRuntimeConfig`
removed (use env vars) · parallel routes now require `default.js` ·
`next/image` changes (`minimumCacheTTL` 60s→4h; `qualities` default `[75]`;
`images.domains`→`remotePatterns`) · Node 20.9+ minimum · PPR flag removed
(use `cacheComponents`) · Edge runtime deprecated · `appDir` config legacy.

Gates ticket 04 (playground prototype) and ticket 02 (deployment).