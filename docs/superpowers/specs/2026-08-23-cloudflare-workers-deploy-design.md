# Cloudflare Workers deployment for the nanisoft monorepo

**Date:** 2026-08-23
**Status:** Approved (design)
**Scope:** Deployment infrastructure only — no application feature changes beyond the minimal Next.js config tweaks OpenNext requires.

## Goal

Make a single `git push` to `main` deploy both Next.js apps in this pnpm monorepo to Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`), reusing the GitHub secrets and the existing `nanisoft` worker already wired up in the user's Cloudflare-connected repo.

- `apps/landing` → worker **`nanisoft`** → `nanisoft.com` + `www.nanisoft.com` (existing worker; updated in place).
- `apps/playground` → worker **`nanisoft-playground`** → `playground.nanisoft.com` (new worker; created on first deploy).

## Why Workers via OpenNext (not Pages)

The existing site already deploys to Cloudflare Workers via OpenNext (`opennextjs-cloudflare build && opennextjs-cloudflare deploy`), using repo-level secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. The landing app has an API route (`app/api/demo-request`), so it needs a runtime rather than static hosting. Matching the existing setup means the user can wipe the old repo, paste this repo's contents, push, and both sites go live with no new Cloudflare project provisioning.

`opennextjs-cloudflare build` runs `next build` internally (via `@opennextjs/aws`'s `buildNextjsApp`), so the per-app `deploy` script is self-contained — no separate `next build` step is needed in the workflow.

## Context from the codebase

- Monorepo: `pnpm-workspace.yaml` globs `apps/*` and `packages/*`. Root `package.json` `packageManager` is `pnpm@11.18.0`; Node 24 is used by the reference workflow.
- Apps: `apps/landing` (`@nanisoft/landing`, has `test`/`lint`/`build` scripts) and `apps/playground` (`@nanisoft/playground`, has `lint`/`build`, no `test`).
- Shared packages `@nanisoft/architecture` and `@nanisoft/identity` export **source** (`exports["."].default = "./src/index.ts"`), so `next build` transpiles them as part of each app build — no separate package build step is required for deployment.
- Neither app references `SITE_URL` / `NEXT_PUBLIC_SITE_URL`, so the workflow does not pass it.

## Architecture

One workflow file: `.github/workflows/deploy.yml`. Three jobs.

### `verify` (gate)

- **Triggers:** `push` to `main`, PRs against `main`, `workflow_dispatch`.
- **Steps:** checkout → `pnpm/action-setup@v6` (version resolved from `packageManager`) → `actions/setup-node@v5` (Node 24, `cache: pnpm`) → `pnpm install --frozen-lockfile` → `pnpm -r run lint` → `pnpm -r run test` → `pnpm -r run build`.
- `pnpm -r run <script>` runs only in packages that define the script, so the missing `test` script on `apps/playground` is not an error.
- `timeout-minutes: 15`.

### `deploy-landing` (push to main only)

- `needs: verify`; `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`.
- Same setup steps as `verify` (checkout, pnpm, node, `pnpm install --frozen-lockfile`).
- **Deploy step:** `pnpm --filter @nanisoft/landing run deploy`. `pnpm --filter` sets the working directory to `apps/landing`, so OpenNext reads `apps/landing/wrangler.jsonc` and deploys worker `nanisoft`.
- **Env:** `CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}`, `CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}`.
- `timeout-minutes: 20`.

### `deploy-playground` (push to main only)

- Same as `deploy-landing` but `pnpm --filter @nanisoft/playground run deploy`, deploying worker `nanisoft-playground`.
- Runs in parallel with `deploy-landing` (both only `need: verify`).

### Concurrency

`concurrency: { group: cloudflare-deploy-${{ github.ref }}, cancel-in-progress: true }` — a new push cancels the in-flight run for the same ref.

## Files added

| File | Contents |
|---|---|
| `apps/landing/open-next.config.ts` | `defineCloudflareConfig({})` (default). |
| `apps/landing/wrangler.jsonc` | `name: "nanisoft"`, `main: ".open-next/worker.js"`, `assets.directory: ".open-next/assets"` with binding `ASSETS`, `compatibility_date: "2026-08-01"`, `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`. |
| `apps/playground/open-next.config.ts` | `defineCloudflareConfig({})`. |
| `apps/playground/wrangler.jsonc` | Same as landing but `name: "nanisoft-playground"`. |
| `.github/workflows/deploy.yml` | The workflow above. |

Intentionally omitted from the reference site's config: the R2 incremental cache (`services` self-reference binding) and the `images` binding. Both are optional optimizations; a minimal config deploys cleanly and can be layered back later.

## Files edited

- `apps/landing/package.json`, `apps/playground/package.json`:
  - Add devDependency `@opennextjs/cloudflare` (version matched to the reference site's `^1.20.2`; `wrangler` is provided transitively).
  - Add scripts: `"cloudflare-build": "opennextjs-cloudflare build"`, `"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"`.
- `apps/landing/next.config.mjs`, `apps/playground/next.config.mjs`:
  - Add `images: { unoptimized: true }` so `next/image` does not require the Cloudflare IMAGES binding at runtime. Reversible if paid image optimization is wanted later.
- `pnpm-lock.yaml`: regenerated by `pnpm install` after the devDependency is added.

## "Wipe and paste" operating procedure

1. Copy this repo's contents into the existing Cloudflare-connected repo (removing old files), then `git push` to `main`.
2. The existing repo's secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) are reused unchanged.
3. On push: `verify` builds the monorepo; `deploy-landing` updates the existing `nanisoft` worker in place (nanisoft.com + www stay live); `deploy-playground` creates the `nanisoft-playground` worker.

## One-time manual steps (performed by the user in the Cloudflare dashboard)

- After the first `deploy-playground` run creates the `nanisoft-playground` worker: add custom domain `playground.nanisoft.com` to that worker and add the DNS record Cloudflare prompts for (CNAME `playground` → the worker, or A/AAAA as directed). The `nanisoft` worker's custom domains are already configured.
- Confirm `CLOUDFLARE_API_TOKEN` has permission to deploy Workers and manage custom domains (the existing token already does, since the current site uses custom domains).

## Verification

- Local: `pnpm install` (regenerates lockfile), then `pnpm --filter @nanisoft/landing run cloudflare-build` and `pnpm --filter @nanisoft/playground run cloudflare-build` succeed, producing `.open-next/` in each app. `pnpm -r run build` and `pnpm -r run test` stay green.
- CI: the `verify` job is green on a PR; a push to `main` lands both deploy jobs successfully.

## Out of scope

- R2 incremental cache, Cloudflare Images binding, observability settings — can be added later.
- E2E (Playwright) job — the reference site had one; not adding it here because this repo has no Playwright setup. Can be added when e2e tests exist.
- Application code changes beyond the `images.unoptimized` config tweak.