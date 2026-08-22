# Cloudflare Workers Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `git push` to `main` deploy both monorepo Next.js apps to Cloudflare Workers via OpenNext — `apps/landing` → the existing `nanisoft` worker (nanisoft.com + www), `apps/playground` → a new `nanisoft-playground` worker (playground.nanisoft.com).

**Architecture:** One GitHub Actions workflow with a `verify` gate plus two parallel deploy jobs. Each app gets its own `open-next.config.ts` + `wrangler.jsonc` and a `deploy` script; `pnpm --filter <app> run deploy` runs OpenNext from that app's directory so it reads that app's wrangler config. `opennextjs-cloudflare build` runs `next build` internally, so no separate build step is needed.

**Tech Stack:** pnpm 11.18.0 monorepo, Next.js 16.3.1, `@opennextjs/cloudflare` ^1.20.2 (brings `wrangler` ^4 transitively), GitHub Actions, Cloudflare Workers.

## Global Constraints

- `packageManager`: `pnpm@11.18.0` (from root `package.json`); the workflow uses `pnpm/action-setup@v6` which resolves the version from `packageManager` — do not pin a pnpm version in the workflow.
- Node 24 in CI (`actions/setup-node@v5`, `node-version: 24`, `cache: pnpm`).
- Worker names are exactly `nanisoft` (landing) and `nanisoft-playground` (playground) — these are referenced in `wrangler.jsonc` `name` fields and the workflow job names.
- `compatibility_date`: `2026-08-01`; `compatibility_flags`: `["nodejs_compat", "global_fetch_strictly_public"]` (matches the existing live worker so the in-place update is non-disruptive).
- CI secrets used: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` — already present on the user's existing repo; never commit secrets.
- Shared packages `@nanisoft/architecture` and `@nanisoft/identity` export TS source (`./src/index.ts`); `next build` transpiles them — do not add a package build step to the deploy path.
- Repo convention: do not commit generated `AGENTS.md`/`CLAUDE.md`/`next-env.d.ts`/`tsconfig.tsbuildinfo` (already in `.gitignore`).

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/landing/open-next.config.ts` (create) | OpenNext config for the landing app — default `defineCloudflareConfig({})`. |
| `apps/landing/wrangler.jsonc` (create) | Wrangler config: worker `nanisoft`, entry `.open-next/worker.js`, static assets, compat flags. |
| `apps/landing/package.json` (modify) | Add `cloudflare-build` + `deploy` scripts and the `@opennextjs/cloudflare` devDep. |
| `apps/landing/next.config.mjs` (modify) | Add `images: { unoptimized: true }` so no Cloudflare IMAGES binding is required. |
| `apps/playground/open-next.config.ts` (create) | OpenNext config for the playground app. |
| `apps/playground/wrangler.jsonc` (create) | Wrangler config: worker `nanisoft-playground`. |
| `apps/playground/package.json` (modify) | Add `cloudflare-build` + `deploy` scripts and the `@opennextjs/cloudflare` devDep. |
| `apps/playground/next.config.mjs` (modify) | Add `images: { unoptimized: true }`. |
| `.gitignore` (modify) | Ignore OpenNext/wrangler build artifacts (`.open-next/`, `.wrangler/`). |
| `.github/workflows/deploy.yml` (create) | The `verify` + `deploy-landing` + `deploy-playground` workflow. |

---

### Task 1: Wire the landing app for OpenNext

**Files:**
- Create: `apps/landing/open-next.config.ts`
- Create: `apps/landing/wrangler.jsonc`
- Modify: `apps/landing/package.json`
- Modify: `apps/landing/next.config.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `pnpm --filter @nanisoft/landing run cloudflare-build` (builds `.open-next/` in `apps/landing`) and `pnpm --filter @nanisoft/landing run deploy` (builds + deploys worker `nanisoft`). Task 3's workflow calls these.

- [ ] **Step 1: Add build artifacts to `.gitignore`**

Append to `.gitignore` (after the existing `next-env.d.ts` / `tsconfig.tsbuildinfo` block):

```gitignore

# OpenNext (Cloudflare Workers) build output + wrangler local state
.open-next/
.wrangler/
```

- [ ] **Step 2: Create `apps/landing/open-next.config.ts`**

```ts
// OpenNext config for the landing app (worker `nanisoft`).
// See https://opennext.js.org/cloudflare
import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default defineCloudflareConfig({})
```

- [ ] **Step 3: Create `apps/landing/wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "nanisoft",
  "compatibility_date": "2026-08-01",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

- [ ] **Step 4: Add scripts + devDep to `apps/landing/package.json`**

In the `scripts` block, add after the existing `"build"` entry:

```json
    "cloudflare-build": "opennextjs-cloudflare build",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
```

In the `devDependencies` block, add:

```json
    "@opennextjs/cloudflare": "^1.20.2",
```

- [ ] **Step 5: Add `images.unoptimized` to `apps/landing/next.config.mjs`**

Replace the existing `nextConfig` object:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next/image` optimization on Cloudflare Workers needs the IMAGES binding
  // (paid). Disable it so the worker runs with no extra bindings; revisit
  // when we want Cloudflare Images.
  images: {
    unoptimized: true,
  },
  // antd 6 and @ant-design/icons 6 ship ESM, so Next 16/Turbopack bundles them
  // natively. The old antd-5-era `transpilePackages` list (and its rc-* entries)
  // is no longer needed and, under Turbopack, actually breaks React resolution
  // inside those packages (createContext is not a function). Removed.
};
```

- [ ] **Step 6: Install the new devDep (regenerates the lockfile)**

Run from the repo root:

```bash
pnpm install
```

Expected: `@opennextjs/cloudflare` (and transitive `wrangler`) is added; `pnpm-lock.yaml` is updated. No "missing peer dependency" errors for `wrangler`.

- [ ] **Step 7: Verify the landing OpenNext build locally**

Run:

```bash
pnpm --filter @nanisoft/landing run cloudflare-build
```

Expected: `next build` runs, then OpenNext bundles the worker; `apps/landing/.open-next/worker.js` and `apps/landing/.open-next/assets/` exist. (Do NOT run `deploy` locally — that would push to the live `nanisoft` worker.)

- [ ] **Step 8: Commit**

```bash
git add .gitignore apps/landing/open-next.config.ts apps/landing/wrangler.jsonc apps/landing/package.json apps/landing/next.config.mjs pnpm-lock.yaml
git commit -m "deploy(landing): wire OpenNext for Cloudflare Workers (nanisoft)"
```

---

### Task 2: Wire the playground app for OpenNext

**Files:**
- Create: `apps/playground/open-next.config.ts`
- Create: `apps/playground/wrangler.jsonc`
- Modify: `apps/playground/package.json`
- Modify: `apps/playground/next.config.mjs`

**Interfaces:**
- Produces: `pnpm --filter @nanisoft/playground run cloudflare-build` (builds `.open-next/` in `apps/playground`) and `pnpm --filter @nanisoft/playground run deploy` (builds + deploys worker `nanisoft-playground`). Task 3's workflow calls `deploy`.

- [ ] **Step 1: Create `apps/playground/open-next.config.ts`**

```ts
// OpenNext config for the playground app (worker `nanisoft-playground`).
// See https://opennext.js.org/cloudflare
import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default defineCloudflareConfig({})
```

- [ ] **Step 2: Create `apps/playground/wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "nanisoft-playground",
  "compatibility_date": "2026-08-01",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

- [ ] **Step 3: Add scripts + devDep to `apps/playground/package.json`**

In the `scripts` block, add after the existing `"build"` entry:

```json
    "cloudflare-build": "opennextjs-cloudflare build",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
```

In the `devDependencies` block, add:

```json
    "@opennextjs/cloudflare": "^1.20.2",
```

- [ ] **Step 4: Add `images.unoptimized` to `apps/playground/next.config.mjs`**

Replace the existing `nextConfig` object:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next/image` optimization on Cloudflare Workers needs the IMAGES binding
  // (paid). Disable it so the worker runs with no extra bindings; revisit
  // when we want Cloudflare Images.
  images: {
    unoptimized: true,
  },
};
```

- [ ] **Step 5: Install the new devDep (regenerates the lockfile)**

Run from the repo root:

```bash
pnpm install
```

Expected: lockfile updated for the playground's new devDep; no errors.

- [ ] **Step 6: Verify the playground OpenNext build locally**

Run:

```bash
pnpm --filter @nanisoft/playground run cloudflare-build
```

Expected: `next build` runs, then OpenNext bundles the worker; `apps/playground/.open-next/worker.js` and `apps/playground/.open-next/assets/` exist. (Do NOT run `deploy` locally — that would create the live `nanisoft-playground` worker before the custom domain is configured.)

- [ ] **Step 7: Commit**

```bash
git add apps/playground/open-next.config.ts apps/playground/wrangler.jsonc apps/playground/package.json apps/playground/next.config.mjs pnpm-lock.yaml
git commit -m "deploy(playground): wire OpenNext for Cloudflare Workers (nanisoft-playground)"
```

---

### Task 3: Add the GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the `cloudflare-build`/`deploy` scripts and per-app `wrangler.jsonc` from Tasks 1 & 2; the repo-level `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets on the user's existing repo.
- Produces: on push to `main`, both workers are deployed; on PRs, only `verify` runs.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: CI / Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: cloudflare-deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Lint, Test, Build
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v6
        # pnpm version is resolved from package.json `packageManager` (pnpm@11.18.0)
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Lint
        run: pnpm -r run lint
      - name: Unit tests
        # pnpm -r runs only in packages that define the script; apps/playground
        # and the shared packages without a `test` script are skipped silently.
        run: pnpm -r run test
      - name: Build
        run: pnpm -r run build

  deploy-landing:
    name: Deploy landing → nanisoft worker
    needs: verify
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
      - name: Build and deploy
        # `pnpm --filter` runs the script from apps/landing, so OpenNext reads
        # apps/landing/wrangler.jsonc and deploys worker `nanisoft` (nanisoft.com
        # + www.nanisoft.com), updating the existing worker in place.
        run: pnpm --filter @nanisoft/landing run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy-playground:
    name: Deploy playground → nanisoft-playground worker
    needs: verify
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
      - name: Build and deploy
        # Deploys worker `nanisoft-playground`. On the first run this creates
        # the worker; afterwards add the playground.nanisoft.com custom domain
        # + DNS record in the Cloudflare dashboard (one-time, manual).
        run: pnpm --filter @nanisoft/playground run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

- [ ] **Step 2: Validate the workflow YAML**

Run:

```bash
pnpm dlx yaml-lint .github/workflows/deploy.yml
```

If `yaml-lint` is unavailable, fall back to a Node one-liner that parses the file:

```bash
node -e "require('node:fs').readFileSync('.github/workflows/deploy.yml','utf8')" && echo "readable"
```

Expected: no YAML syntax errors. (Full actionlint is not required; structural correctness is enough since the commands are already verified locally in Tasks 1 & 2 and Step 3 below.)

- [ ] **Step 3: Run the `verify` job's commands locally to confirm they pass**

Run from the repo root:

```bash
pnpm install --frozen-lockfile
pnpm -r run lint
pnpm -r run test
pnpm -r run build
```

Expected: all four succeed (this is exactly what the `verify` job runs). If lint/test/build were already green before this work, they remain green.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add Cloudflare Workers deploy workflow (landing + playground)"
```

---

### Task 4: Final whole-monorepo verification

**Files:** none (verification + commit of any lockfile drift).

- [ ] **Step 1: Confirm both apps still build via OpenNext in one pass**

Run:

```bash
pnpm --filter @nanisoft/landing run cloudflare-build
pnpm --filter @nanisoft/playground run cloudflare-build
```

Expected: both succeed; `apps/landing/.open-next/worker.js` and `apps/playground/.open-next/worker.js` both exist.

- [ ] **Step 2: Confirm the working tree is clean (only intended files tracked)**

Run:

```bash
git status
```

Expected: clean, or only untracked build artifacts that are now gitignored (`.open-next/`, `.wrangler/`). No stray `wrangler.jsonc`/`open-next.config.ts` untracked — those are committed in Tasks 1 & 2.

- [ ] **Step 3: Remind the user of the one-time manual Cloudflare steps**

Tell the user (do not script these):
1. After the first push to `main` creates the `nanisoft-playground` worker, add custom domain `playground.nanisoft.com` to it in the Cloudflare dashboard and add the DNS record Cloudflare prompts for.
2. Confirm the repo's `CLOUDFLARE_API_TOKEN` secret has Workers deploy + custom-domain permissions (the existing token already does, since the current site uses custom domains).
3. To go live: wipe the existing repo's contents, paste this repo's contents, push to `main`.

---

## Self-Review

**Spec coverage:**
- Workers via OpenNext for both apps → Tasks 1 & 2. ✓
- Worker names `nanisoft` / `nanisoft-playground` → wrangler.jsonc in Tasks 1 & 2. ✓
- `verify` + two parallel deploy jobs, concurrency, triggers → Task 3. ✓
- `images.unoptimized` → Tasks 1 & 2. ✓
- `.gitignore` for `.open-next/` → Task 1. ✓
- Lockfile regen → Steps 6 of Tasks 1 & 2. ✓
- Manual custom-domain + DNS step → Task 4 Step 3. ✓
- "Wipe and paste" operating procedure → Task 4 Step 3. ✓
- R2/Images binding intentionally omitted → not added (correct). ✓

**Placeholder scan:** none — all code blocks contain final content.

**Type/name consistency:** worker names (`nanisoft`, `nanisoft-playground`), script names (`cloudflare-build`, `deploy`), package names (`@nanisoft/landing`, `@nanisoft/playground`), and the `pnpm --filter` targets are identical across all tasks and the workflow. ✓