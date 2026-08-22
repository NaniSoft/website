Type: research
Status: resolved
Blocked by: 01

## Question

Where should the two apps deploy, and how are the subdomains wired? Domains are fixed: **nanisoft.com** (landing) and **playground.nanisoft.com** (playground).

Evaluate against this **modified Next.js** — the capability findings from ticket 01 are a prerequisite (the build is non-standard, so deploy compatibility must be verified, not assumed):

- **Vercel** — native Next.js host; two projects + custom domains.
- **Cloudflare (Pages/Workers via OpenNext)** — edge; OpenNext adapter compatibility with this modified build is the key unknown.
- **Self-hosted / Kubernetes** — matches the architecture's own K8s ethos; heaviest ops.

Output a recommendation: which platform for each app (they may differ), how the two subdomains wire, and any build/config changes the modified Next.js requires to deploy. Save findings on branch `research/deployment` and link from this ticket.

## Answer

> Full report: [`research/deployment-findings.md`](../../../research/deployment-findings.md)
> (branch `research/deployment`, commit ae8a96f).

### Per-platform verdict

- **Vercel — fully supported (verified adapter).** The only Next.js-verified
  adapter besides Bun; Next 16.3.1 supported (announced 2026-08-04). Auto-detects
  version, auto-injects `nextjs/adapter-vercel` via `NEXT_ADAPTER_PATH`. Caveat:
  16.3.0 had a `output:'standalone'`+adapter crash (#96646, fixed in 16.3.1 — this
  repo is already 16.3.1). `middleware.ts`→`proxy.ts` (Node-only runtime) handled
  natively. Two-project + pnpm-monorepo wiring is native (Root Directory per
  project; repo-root `packageManager`). **Pro $20/mo required for commercial use**
  (Hobby forbids commercial + pauses at 100 GB).
- **Cloudflare (`@opennextjs/cloudflare` v1.20.2) — partial / mostly-yes, open
  `proxy.ts` gap.** Next 16.3.x is in the supported peer-dep range (>=16.2.11),
  BUT `proxy.ts` (the Next 16 middleware rename) is **not yet officially
  supported** (issue #1277; fix pending PR #1309). Works today only with the
  workaround: keep `middleware.ts` + build with `--webpack` (Turbopack has open
  bugs). Not a Next.js-verified adapter (in-repo `17-deploying.md` lists
  Cloudflare under "Other Platforms," own integration, not on the public Adapter
  API). Free tier permits commercial use; $5/mo headroom tier.
- **Self-hosted / K8s — fully supported (all features), heaviest ops.**
  `output:'standalone'` Docker images per app + `outputFileTracingRoot` (monorepo
  root) behind a reverse proxy (nginx/Caddy/Traefik) routing the two hostnames.
  Multi-instance needs shared `cacheHandler` + `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
  + `deploymentId`. Matches the org's K8s ethos
  (`resources/TrueAccess_MVP_Stack_and_Licensing.md`) but overkill for two
  marketing/simulator surfaces unless a cluster already exists.

### Recommendation

**Default: both apps on Vercel (Pro, $20/mo)** — lowest-risk, lowest-effort,
only verified adapter, native two-subdomain + monorepo wiring. Per-app split
allowed: landing on Vercel + playground on Cloudflare (free) is viable *only if*
the playground uses no `proxy.ts`/middleware (client-first per ticket 01) and you
accept the `--webpack` workaround until #1309 lands. Both-apps static-export to
Cloudflare Pages (free, zero adapter) is a genuine fallback **only if neither
app uses Server Actions / ISR / image opt / rewrites / proxy** — confirm when the
apps are built. K8s only if a hard reason (existing cluster, air-gap, no-PaaS
policy).

### Build/config changes (recommended path — Vercel)

Repo-root `package.json` `"packageManager": "pnpm@<version>"`; keep Next at
16.3.1; do **not** set `output:'standalone'` (unused on Vercel); rename any
`middleware.ts`→`proxy.ts` (no `runtime:'edge'`); two Vercel projects with Root
Directory `apps/landing` + `apps/playground`; domains `nanisoft.com` (apex, A
record) + `playground.nanisoft.com` (subdomain, CNAME) assigned per project.

### Open inputs (flagged for user — not resolved here)

1. Cost tolerance / commercial-use posture (Vercel Pro $20/mo vs Cloudflare free).
2. Existing registrar / DNS host for nanisoft.com.
3. Existing infrastructure — is there a K8s cluster to reuse (matches TrueAccess
   ethos) or is managed PaaS acceptable?
4. Per-app server-feature needs (gates the static-export-to-Cloudflare-Pages
   free fallback: only if neither app uses Server Actions/ISR/image-opt/rewrites/
   proxy — confirm when built).

Gates ticket 04 (playground prototype) and the eventual build/handoff.