# Findings — Deployment for the nanisoft digital-twin platform

> wayfinder research ticket 02 · branch `research/deployment`
> Question: where should the two apps (`apps/landing`, `apps/playground`) deploy,
> and how are the subdomains `nanisoft.com` + `playground.nanisoft.com` wired?
> Prerequisite: ticket 01 confirmed this is **stock Next.js 16.3.1** (not a fork),
> a pnpm monorepo of two independent Next.js apps + shared `packages/architecture`,
> where subdomain serving is a deployment/DNS/platform concern (no build constraint).

## TL;DR recommendation

- **Both apps on Vercel (Pro)** is the easiest, fully-supported path — Vercel is the
  *only* verified Next.js adapter besides Bun, auto-detects Next 16.3, and handles
  the two-subdomain wiring with zero reverse-proxy ops. Pin Next to **16.3.1+**
  (avoid the 16.3.0 `output:'standalone'`+adapter crash bug, #96646 — fixed in
  16.3.1).
- **Cloudflare (`@opennextjs/cloudflare`) is a viable lower-cost edge alternative**
  but carries an open compatibility gap: `proxy.ts` (the Next 16 middleware rename)
  is **not yet officially supported** (issue #1277; fix pending PR #1309). It works
  today only if you keep `middleware.ts` and build with `--webpack` (Turbopack has
  open bugs). Use it only if cost/edge latency justify the workaround.
- **Self-hosted/K8s** matches the org's K8s ethos but is the heaviest ops path and
  buys nothing for two marketing/simulator surfaces. Defer unless there is a
  hard reason (data residency, no external PaaS, etc.).
- **Split-per-app is allowed** but not recommended here — both surfaces are
  low-traffic and one platform minimizes ops. **Decision flagged for user input**
  (below): cost tolerance, existing registrar, and whether the org already runs a
  K8s cluster it wants to reuse.

---

## Platform 1 — Vercel

### Compatibility verdict: Fully supported (verified adapter)

Vercel is the reference **verified adapter** for Next.js
(`node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md` lines
84-85 list only Vercel + Bun as verified; "Cloudflare and Netlify are working on
verified adapters" and currently route through their own integrations).
Vercel announced Next.js 16.3 support on **2026-08-04** (blog "Next.js 16.3
support on Vercel"). Version is auto-detected from `package.json`/lockfile at
build time; the adapter (`nextjs/adapter-vercel`) is injected via
`NEXT_ADAPTER_PATH` — no `adapterPath` in your config needed.

### Next 16 caveats on Vercel
- **Turbopack is default** for `next build` on Vercel (16.3 enables Turbopack's
  filesystem disk cache → up to 5.5x faster CI builds).
- **`middleware.ts` → `proxy.ts`** (deprecated, not removed in 16; old file still
  runs on Edge with a warning, will be removed in a future major). Vercel serves
  `proxy.ts` like any framework file; default runtime flipped to **Node.js**
  (`runtime:'edge'` in `proxy.ts` throws). Codemod:
  `npx @next/codemod@canary middleware-to-proxy .`.
- **`adapterPath` stable top-level since 16.2** (commit 97f4209); you do not set
  it on Vercel.
- **Bug to avoid: 16.3.0 `output:'standalone'` + adapter crashes the build**
  (issue #96646, `ENOENT .next/next-server.js.nft.json`; fix in PR #97287, merged
  2026-08-14). **This repo is already 16.3.1, so the bug is fixed.** If you ever
  set `output:'standalone'` in a config that also deploys to Vercel, guard it:
  `output: process.env.VERCEL ? undefined : 'standalone'` (standalone output is
  unused on Vercel).
- Edge runtime still available; Vercel KV/Postgres deprecated → use Upstash/Neon.
- ISR / image optimization / Server Actions all work; 16.3 adds ISR + PPR
  observability.

### Wiring two projects + two subdomains (pnpm monorepo)
Per Vercel monorepo docs (updated 2026-07-21) and domains docs (2026-06-08):
- **Two separate Vercel Projects**, one per app. Import the same Git repo twice;
  set each project's **Root Directory** to `apps/landing` / `apps/playground`
  (dashboard, or `rootDirectory` in each app's `vercel.json`).
- **pnpm workspaces auto-detected** from the repo-root `pnpm-workspace.yaml`.
  Pin pnpm via **repo-root** `package.json` `packageManager` (nested
  `packageManager` is *not* read — vercel/vercel#10687).
- With `apps/*` in the workspace glob + unique `name` per package + explicit
  inter-package deps, Vercel auto-skips building unchanged apps on a commit
  (GitHub only).
- **Domains:** assign `nanisoft.com` (apex) to the `landing` project and
  `playground.nanisoft.com` (subdomain) to the `playground` project, each in
  **Settings → Domains**. Apex → **A record** to Vercel's anycast IP (e.g.
  `76.76.21.21`, shown in dashboard); subdomain → **CNAME** `playground` →
  `cname.vercel-dns.com`. Easiest path: point nameservers at Vercel (or set the
  A/CNAME at a third-party registrar). Wildcard not needed for one named
  subdomain. First-time domain add to a team may require a TXT ownership record.

### Cost posture
Per vercel.com/pricing (updated 2026-07-29):

| | Hobby | Pro |
|---|---|---|
| Price | $0/mo | $20/mo (incl. $20 usage credit) |
| Bandwidth | 100 GB/mo included, **hard cap — project pauses on exceed** | 1 TB/mo, then ~$0.15/GB |
| Edge requests | 1M/mo | 10M/mo, then ~$2/1M |
| Image opt | 5K transforms/mo | on-demand |
| Builds | $0.0035/CPU-min on non-standard machines | same |
| **Use restriction** | **Personal, non-commercial only** | Commercial OK |

**For a commercial `nanisoft.com` you must be on Pro ($20/mo).** Pro's 1 TB is
ample for two small sites; main overage risk is image-optimization / function
CPU, covered by the $20 credit. Hobby pauses at 100 GB and forbids commercial use.

### Build/config changes required
- Ensure each app's `next.config.mjs` does **not** set `output:'standalone'`
  (unused on Vercel; the 16.3.0 standalone+adapter bug is moot at 16.3.1 but
  standalone is pointless on Vercel anyway).
- Repo-root `package.json` sets `"packageManager": "pnpm@<version>"`.
- If any `middleware.ts` exists, rename to `proxy.ts` and ensure no
  `runtime:'edge'` (Node runtime only in Next 16 proxy).

---

## Platform 2 — Cloudflare (`@opennextjs/cloudflare`)

### Compatibility verdict: Partial / mostly-yes, with an open `proxy.ts` gap

Current adapter **`@opennextjs/cloudflare@1.20.2`** (published 2026-07-21).
OpenNext's docs state "all minor and patch versions of Next.js 16 and the latest
minors of Next.js 14 and 15 are supported," Turbopack listed as supported. The
peer-dep range effectively requires `next >= 16.2.11` (16.0.0–16.2.2 excluded,
per PR #1203/#1313). **So Next 16.3.1 is in the supported range on paper.**

The hard caveat is the **`middleware`→`proxy` rename**: OpenNext does **not** yet
officially recognize `proxy.ts` (issue #1277; fix pending PR #1309 + rebase #1320
onto v1.20.2, verified end-to-end on a real Worker, awaiting maintainer merge as
of Aug 2026). Documented workaround until merged: **keep `middleware.ts` (emits
a Next 16 deprecation warning) and build with `next build --webpack`** rather
than Turbopack.

### Unsupported / limited features (per opennext.js.org/cloudflare + issue tracker)
- **Edge runtime** — not recommended; use Node.js runtime
  (`@cloudflare/next-on-pages` was Edge-only, which is why it's deprecated).
- **Node Middleware (15.2+) / `proxy.ts` (16)** — not yet officially supported
  (#1277; fix pending #1309/#1320).
- **Turbopack builds** — listed as supported, but several open bugs (#1305,
  #1317, #1326); **webpack is the safer path today**.
- **`cacheComponents`** — prod crash (#1130).
- **`setImmediate`** — crash when uploading via CF API bypassing wrangler
  (#1269).
- **Cache interception + PPR** — incompatible.
- **Worker size**: 3 MiB (free) / 10 MiB (paid) compressed; global DB clients
  unsupported (must be request-scoped); Windows dev needs WSL.
- Supported: App/Pages Router, Route Handlers, Dynamic routes, SSG, SSR, ISR,
  Middleware (`middleware.ts`), Image Optimization (via Cloudflare Images), PPR,
  `after`, `'use cache'`, streaming, Server Actions, `next/font`, `next/image`.

> Note on the repo-side evidence: the in-repo Next 16 docs
> (`01-getting-started/17-deploying.md` lines 89-99, "Other Platforms") list
> Cloudflare's *own* Next.js integration as **not built on the public Adapter API
> and not verified by the Next.js team** — feature support "may vary." OpenNext
> is a third-party community adapter (not Cloudflare's first-party integration),
> so the same caveat applies: it is not a Next.js-verified adapter.

### Wiring two apps + two subdomains (pnpm monorepo)
Pattern: **one Workers project per app, one `wrangler.jsonc` per app, one custom
domain per project.** OpenNext deploys to **Workers + Workers Assets**, not Pages.
- `apps/landing/wrangler.jsonc` → `name = "landing"`, `assets` binding,
  `compatibility_flags: ["nodejs_compat"]`, `compatibility_date ≥ 2025-04-01`,
  `routes: [{ pattern: "nanisoft.com", custom_domain: true }]`.
- `apps/playground/wrangler.jsonc` → same,
  `routes: [{ pattern: "playground.nanisoft.com", custom_domain: true }]`.
- Per-app build/deploy:
  `pnpm --filter landing exec opennextjs-cloudflare build && opennextjs-cloudflare deploy`.
- Monorepo: path-based includes so shared-package changes only rebuild
  dependents. Remove any `runtime = "edge"`; keep `middleware.ts` (not
  `proxy.ts`) and build with `--webpack` until #1309 lands.
- `.open-next` / `.worker-next` → `.gitignore`.

### Cost posture (two small sites)
- **Free tier:** 100k Workers requests/day, 10 ms CPU/invocation, 128 MB,
  3 MiB Worker, 100 custom domains/project, static-asset requests
  free/unlimited. Two low-traffic Next.js sites (mostly-static + SSR-on-demand)
  easily fit free. ISR writes need KV (free: 100k reads/day, 1k writes/day) or R2.
- **Paid ($5/mo):** 10M req/mo included (+$0.30/M), 30M CPU-ms/mo (+$0.02/M),
  10 MiB Worker, no daily cap. No egress/throughput charges; asset requests free.
- A two-site setup almost certainly stays free; $5/mo is the headroom tier if you
  exceed 100k/day or need bigger Workers / more CPU.

### Alternatives
- **`@cloudflare/next-on-pages`** — **deprecated** (npm deprecation notice points
  to OpenNext). Was Pages+Edge-only; superseded.
- **Workers Assets + static/SSR** — OpenNext already uses Workers Assets under
  the hood; there is no separate first-party Next SSR adapter to migrate to.
  Cloudflare's own docs route Next.js users to OpenNext.
- **Static export (`output:'export'`)** — viable for the *landing* (and arguably
  the playground, which is client-first per ticket 01) on plain Cloudflare Pages
  with **zero adapter risk**, since static HTML/CSS/JS needs no Node runtime. But
  static export is **unsupported for**: rewrites/redirects/headers/proxy/ISR/
  image-opt/dynamic-routes-without-`generateStaticParams`/Server Actions/draft
  mode (`node_modules/next/dist/docs/01-app/02-guides/static-exports.md` lines
  274-300). Both apps are largely client/SSG-shaped so this is a real low-cost
  fallback — see "Per-app split" below.

### Build/config changes required
- Add `@opennextjs/cloudflare` dev-dep to each app.
- One `wrangler.jsonc` per app (custom domain per project).
- **Keep `middleware.ts` (do not rename to `proxy.ts`)** and build with
  `next build --webpack` until #1309 lands (or avoid middleware/proxy entirely —
  both apps are client-first and likely need no request-time middleware).
- Remove any `runtime:'edge'`; use Node.js runtime + `nodejs_compat`.

---

## Platform 3 — Self-hosted / Kubernetes

### Compatibility verdict: Fully supported (all features)

Per in-repo docs (`01-getting-started/17-deploying.md` lines 40-55,
`02-guides/self-hosting.md`, `02-guides/custom-server.md`,
`03-api-reference/05-config/01-next-config-js/output.md`):
- **Docker / Kubernetes** deployments support **all** Next.js features.
- `output:'standalone'` produces `.next/standalone/server.js` + traced deps (no
  `node_modules` install needed in the image) — the recommended container path
  (in-repo template: `vercel/next.js` `examples/with-docker`).
- **Monorepo tracing:** set `outputFileTracingRoot` to the monorepo root in each
  app's `next.config.mjs` (`output.md` lines 69-78, 131-143) so files in
  `packages/architecture` are traced into each app's standalone output.
- **Custom server is incompatible with `output:'standalone'`**
  (`custom-server.md` line 14) — use standalone's minimal `server.js`, or a custom
  server with `next({ dir: 'apps/landing' })`, not both.
- Reverse proxy (nginx/Caddy/Traefik) recommended in front
  (`self-hosting.md` lines 13-15); route the two hostnames to the two app
  containers.
- **Multi-instance (K8s HA):** needs shared `cacheHandler` (Redis) +
  `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (consistent across pods) + `deploymentId`
  for version-skew protection (`self-hosting.md` lines 185-233). Streaming needs
  proxy buffering disabled (`X-Accel-Buffering: no`, lines 237-259).

### Wiring two apps + two subdomains
- One Docker image per app (or one shared image built twice with different
  `dir`). Each app's `output:'standalone'` build → image → K8s Deployment +
  Service behind an Inress/Gateway routing `nanisoft.com` → landing Service and
  `playground.nanisoft.com` → playground Service.
- DNS: A records for `nanisoft.com` and `playground.nanisoft.com` → the
  ingress/LB external IP; TLS via cert-manager (Let's Encrypt) or the proxy's
  ACME. Hostname-based routing at the Ingress/Proxy level (Traefik IngressRoute
  / nginx Ingress host rules / Caddy labels).

### Cost posture
- Highest ops cost: cluster management, patching, TLS, monitoring, on-call.
  No per-request/egress charges on your own infra, but you pay for the compute
  (nodes) 24/7 even at zero traffic. If the org already runs a K8s cluster (the
  TrueAccess stack doc, `resources/TrueAccess_MVP_Stack_and_Licensing.md`, is
  explicitly "run in production, on Kubernetes"), reusing a corner of an existing
  cluster is "free at the margin" — otherwise standing one up for two
  marketing/simulator surfaces is overkill.

### Build/config changes required
- Each app's `next.config.mjs` sets `output:'standalone'` +
  `outputFileTracingRoot: <monorepo root>`.
- Dockerfile per app (copy `.next/standalone`, `.next/static`, `public`).
- Ingress/proxy host rules + TLS.

---

## Recommendation

### Default: both apps on Vercel (Pro, $20/mo)
Rationale: Vercel is the *only* Next.js-verified adapter besides Bun; Next 16.3.1
is fully supported; the two-subdomain + pnpm-monorepo wiring is native and
zero-ops; image optimization, ISR, PPR, Server Actions all work; no `proxy.ts`
adapter gap. This is the lowest-risk, lowest-effort path and the platform the
framework vendor itself runs on.

### Per-app split (allowed, optional)
A split can make sense to optimize cost or latency per surface:
- **Landing on Vercel** (apex, marketing, benefits from Vercel's global image
  optimization + edge CDN) + **playground on Cloudflare/OpenNext** (free tier,
  client-first app has little server surface) — **only if the playground uses no
  `proxy.ts`/middleware** (it shouldn't: client-first per ticket 01) and you
  accept the `--webpack` + `middleware.ts` workaround until #1309 lands.
- **Both apps static-export to Cloudflare Pages** (free, zero adapter) — viable
  only if neither app needs server features (Server Actions, ISR, image opt,
  rewrites). The landing's hero is `dynamic({ssr:false})` (client-only); the
  playground is client-first session-only state. **Static export is a genuine
  low-cost fallback if you confirm neither app needs any server feature** —
  verify when the apps are built.

### When to prefer K8s self-hosting
Only if there is a hard reason: existing cluster you already operate (matches
the TrueAccess stack ethos), data-residency/air-gap requirement, or a policy
against external PaaS. Otherwise the ops overhead is unjustified for two
marketing/simulator surfaces.

### Build/config changes summary (recommended path — Vercel)
- Repo-root `package.json`: `"packageManager": "pnpm@<version>"`.
- Keep Next at 16.3.1 (avoids the 16.3.0 standalone+adapter crash, #96646).
- Do **not** set `output:'standalone'` in app configs deployed to Vercel.
- Rename any `middleware.ts` → `proxy.ts`; ensure no `runtime:'edge'` (Next 16
  proxy is Node-only).
- Two Vercel projects, Root Directory `apps/landing` and `apps/playground`;
  domains `nanisoft.com` (apex, A record) and `playground.nanisoft.com`
  (subdomain, CNAME) assigned per project.

## Open inputs (need user decision — not resolved here)

1. **Cost tolerance / commercial-use posture.** Vercel Hobby forbids commercial
   use and pauses at 100 GB; a commercial `nanisoft.com` requires Vercel **Pro
   ($20/mo)**. Cloudflare Workers free tier permits commercial use. K8s is
   "free at the margin" only if a cluster already exists. **Which cost posture
   is acceptable?**
2. **Existing registrar / DNS host.** Apex A-record + subdomain CNAME (or
   nameservers-at-Vercel) is easy on any registrar; but if the org already hosts
   DNS somewhere (e.g. Cloudflare), a hybrid (DNS at Cloudflare, apps on Vercel)
   is fine. **Where is `nanisoft.com` currently registered / DNS-hosted?**
3. **Existing infrastructure.** Does the org already run a K8s cluster it wants
   these to live on (matching the TrueAccess stack ethos), or is a managed PaaS
   acceptable? **Is there an existing cluster to reuse?**
4. **Server-feature needs per app.** Static-export-to-Cloudflare-Pages (free,
   zero adapter) is viable **only if neither app uses Server Actions / ISR /
   image opt / rewrites / proxy**. Confirm when the apps are built; this gates
   whether the cheapest path is available.

## Sources

- In-repo Next 16 docs: `node_modules/next/dist/docs/01-app/01-getting-started/17-deploying.md`,
  `.../02-guides/deploying-to-platforms.md`, `.../02-guides/self-hosting.md`,
  `.../02-guides/custom-server.md`, `.../02-guides/static-exports.md`,
  `.../03-api-reference/05-config/01-next-config-js/{output,adapterPath}.md`.
- Vercel: https://vercel.com/blog/vercel-supports-next-js-16-3 (2026-08-04);
  https://vercel.com/docs/monorepos (2026-07-21);
  https://github.com/vercel/vercel/issues/10687 (packageManager at repo root);
  https://vercel.com/docs/domains/working-with-domains (2026-06-08);
  https://vercel.com/pricing + https://vercel.com/docs/pricing (2026-07-29).
- Next.js: https://nextjs.org/blog/next-16-3 (2026-08-03);
  https://github.com/vercel/next.js/issues/96646 (standalone+adapter crash);
  https://github.com/vercel/next.js/pull/97287 (fix).
- OpenNext / Cloudflare: https://www.npmjs.com/package/@opennextjs/cloudflare
  (1.20.2, 2026-07-21); https://opennext.js.org/cloudflare (support matrix);
  https://github.com/opennextjs/opennextjs-cloudflare/issues/1277 (proxy.ts);
  https://github.com/opennextjs/opennextjs-cloudflare/pull/1309 (pending fix);
  https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/;
  https://developers.cloudflare.com/workers/platform/pricing/ + /limits/.
- Org ethos: `resources/TrueAccess_MVP_Stack_and_Licensing.md` (K8s-native
  stack).