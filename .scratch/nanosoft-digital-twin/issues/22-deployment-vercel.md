# 22 — Deployment — two apps to Cloudflare Workers via OpenNext (apex + subdomain)

**What to build:** Both apps live on their fixed domains — nanisoft.com (apex + www) and playground.nanisoft.com — deployed from the pnpm monorepo as two Cloudflare Workers via `@opennextjs/cloudflare` at Next 16.3.1, gated by CI on push to `main`.

**Blocked by:** ~~17, 19, 20, 21~~ — executed out of order (deploy infra shipped 2026-08-22 before the landing re-theme; nanisoft.com serves pre-retheme content until 18–21 land).

**Status:** done — Cloudflare Workers chosen over the recorded Vercel-Pro default (ticket-02 research); infra merged to main (deploy fix `a24f776`; earlier history squashed), CI deploy green 2026-08-22, both domains verified live 2026-08-23. Design: `docs/superpowers/specs/2026-08-23-cloudflare-workers-deploy-design.md`. Optional polish (R2 incremental cache, Cloudflare Images binding) deliberately deferred.

- [x] Two Workers over the pnpm monorepo — `nanisoft` (landing → nanisoft.com + www, existing worker updated in place) and `nanisoft-playground` (playground → playground.nanisoft.com) — via `@opennextjs/cloudflare` ^1.20.2 + per-app `wrangler.jsonc`; `.github/workflows/deploy.yml` verify-gates (lint/test/build) then deploys both in parallel on push to `main`
- [x] Platform decision resolved de facto: Cloudflare Workers/OpenNext — free, commercial-OK, reuses the existing `nanisoft` worker + `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` secrets; the landing's API route needs a runtime (rules out static export); no K8s cluster in play. The four "open deployment inputs" from ticket 02 are answered by this choice; Vercel Pro remains the documented alternative (`research/deployment-findings.md`)
- [x] Apex `nanisoft.com` + `www.nanisoft.com` resolve to the deployed landing (HTTP 200, verified 2026-08-23); `playground.nanisoft.com` custom domain wired to the `nanisoft-playground` worker (HTTP 200, serves the playground, verified 2026-08-23)
- [x] Next pinned 16.3.1 — the 16.3.0 standalone+adapter crash (#96646) is avoided
- [x] Both deployed URLs load their respective apps (landing serves the pre-retheme Sentinel-branded shell until tickets 18–21 land — a content gap, not a deployment one)
