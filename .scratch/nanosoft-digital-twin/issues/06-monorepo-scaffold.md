# 06 — Monorepo scaffold + relocate landing

**What to build:** A working pnpm monorepo where both apps and the shared package build and run. The existing single-app Next.js landing moves into `apps/landing` and stays green; `apps/playground` is a second client app with a placeholder page; `packages/architecture` is a workspace package both apps import. This is the foundation every later ticket builds on.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] `pnpm-workspace.yaml` lists `apps/*` and `packages/*`; `pnpm install` succeeds from repo root
- [x] `apps/landing` is the relocated existing Next.js app; it builds, lints, and its existing vitest suite passes with imports/paths updated for the new location
- [x] `apps/playground` is a Next.js client app that runs on its own port and renders a placeholder page
- [x] `packages/architecture` builds and is importable by both apps (both import a trivial export from it)
- [x] `pnpm -r dev` launches both apps; `pnpm -r build` builds both apps green

## Verification (executed 2026-08-21)

- `pnpm install` → 4 workspace projects (root + `@nanisoft/landing` + `@nanisoft/playground` + `@nanisoft/architecture`), 532 packages, 17.8s.
- `pnpm -r run build` → architecture `tsc` Done (emits `dist`); landing `next build` Done (5 routes incl. `/api/demo-request`, `/icon.svg`); playground `next build` Done (3 routes). Both apps import `@nanisoft/architecture` (Turbopack auto-transpiles the workspace package from source).
- `pnpm -r run lint` → both apps `eslint .` Done.
- `pnpm -r run test` → landing vitest: 6 files / 19 tests pass.
- `pnpm -r run dev` → landing Ready on `http://localhost:3000`, playground Ready on `http://localhost:3001` (concurrent, pnpm 11 workspace concurrency). Curl: landing HTTP 200 with `data-app="nanisoft"`; playground HTTP 200 rendering `nanisoft playground` (interpolates `APP_NAME`/`ARCHITECTURE_VERSION` from `@nanisoft/architecture`).

## Notes / deviations

- **pnpm committed; npm lockfile removed.** `package-lock.json` was `git rm`'d — SPEC decision 5 mandates a pnpm monorepo. Root `package.json` is now a workspace root (`name: nanisoft`, `packageManager: pnpm@11.18.0`, scripts delegating to `pnpm -r`). All app deps live in each app's `package.json`.
- **`packages/architecture` exports point at source (`src/index.ts`), not `dist`.** Next 16's Turbopack (default for both dev and build) auto-transpiles workspace packages from source under both routers, so apps import the TS directly with zero build-order coupling. The `build` script (`tsc → dist`) is a compile check and a fallback for any non-Turbopack consumer.
- **`pnpm -r dev` runs both concurrently** (pnpm 11 runs independent workspace scripts with concurrency 4), so the literal `pnpm -r dev` launches both apps. Root `pnpm dev` is also wired (`pnpm -r --parallel run dev`) as a guaranteed-parallel alias.
- Tracked app files relocated with `git mv` (history preserved); `app/layout.tsx` gained the trivial `@nanisoft/architecture` import (`data-app={APP_NAME}` on `<html>`).