# nanisoft — website

The nanisoft web presence as a pnpm monorepo: the marketing landing and the
interactive playground, sharing brand identity and architecture packages.
Deployed to Cloudflare Workers via OpenNext (CI on push to `main`).

## Layout

- `apps/landing` — marketing landing (`@nanisoft/landing`, dev on :3000)
- `apps/playground` — in-browser digital-twin playground (`@nanisoft/playground`, dev on :3001)
- `packages/identity` — the "Living Map" brand system: palette, shape lock,
  typography, motion, wordmark, and the cross-app theme contract
  (`THEME_STORAGE_KEY` + no-FOUC bootstrap script). Single source of truth —
  apps consume it verbatim and never redefine a hex.
- `packages/architecture` — shared domain model of the IT estate

## Develop

```
pnpm install
pnpm dev          # both apps in parallel
```

Or per app:

```
pnpm --filter @nanisoft/landing dev       # http://localhost:3000
pnpm --filter @nanisoft/playground dev    # http://localhost:3001
```

## Test

```
pnpm test                 # vitest suites across all packages
pnpm lint                 # eslint everywhere
pnpm build                # both apps must build
```

Playwright e2e (each boots its own dev server):

```
pnpm --filter @nanisoft/landing run test:overflow     # themed overflow scroll-law matrix
pnpm --filter @nanisoft/playground run test:e2e       # full playground suite incl. overflow matrix
```

Both overflow matrices also run as a CI job on every push/PR; the deploy jobs
wait on them, so a horizontal-scroll regression blocks publishing.

## Deploy

Pushes to `main` run lint → tests → builds → overflow matrices → deploy both
apps to Cloudflare Workers (worker `nanisoft` for nanisoft.com /
www.nanisoft.com, worker `nanisoft-playground` for the playground subdomain).

## Theming

Theme is stored in `localStorage.nanisoft-theme` as `light` | `dark` | `system`
(the key is `THEME_STORAGE_KEY` from `@nanisoft/identity`). The initial value
is applied by an inline bootstrap script — the same constant rendered by both
apps' `app/layout.tsx` — before React hydrates, so there's no theme flash on a
hard reload. Toggle from either app's top nav, or follow the OS preference.

**Per-origin note:** localStorage is scoped per origin, so mode persistence is
too. Landing and playground deployed under one origin share the setting
instantly; as separate subdomains each deployment starts consistent with
itself (same key, same contract), but toggling in one does not live-sync to
the other.

## Notes

- No sales surface or API layer: the single ask is the nav's "Open the
  playground" pill, which links out to the playground app.
