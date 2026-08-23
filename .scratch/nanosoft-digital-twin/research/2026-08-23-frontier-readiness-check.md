# Frontier Readiness Check — independent verification of tickets 06–18 + 22 "done" statuses

Date: 2026-08-23 · Auditor: read-only verification pass against HEAD `8a85024`
Scope: re-run every load-bearing claim from `.scratch/nanosoft-digital-twin/map.md` against the actual tree. No source files were modified by this audit (one new file only: this document).

---

## Check 1 — HEAD and working tree

Command: `git rev-parse HEAD && git log -1 --oneline && git status --porcelain`

```
8a850248a5a1a1df9ca4f87e2d2cf91e5d28a619
8a85024 docs(nanosoft): close tickets 17+18 — done-lines, ticket records, Frontier → [19][20][21]
(empty porcelain output)
```

**PASS at audit start.**

Mid-audit observation (faithful record): at ~14:51 local — while this audit's build/e2e commands were running — `git status` began reporting:

```
 M .scratch/nanosoft-digital-twin/SPEC.md
 M .scratch/nanosoft-digital-twin/map.md
```

LastWriteTime on both files is 2026-08-23 14:51:23 / 14:51:36. None of the audit's commands (`vitest run`, `next build`, `playwright test`) write to `.scratch/*.md`; the diffs are documentation prose updates (ticket 18 landing notes, ticket 01 findings-file provenance). This is a **concurrent out-of-band edit**, not an artifact of the audit. Re-check scoped to code: `git status --porcelain -- apps packages .github` → empty. The audited tree itself never changed.

## Check 2 — Unit suites

Filter names resolved from each workspace `package.json`: `@nanisoft/architecture`, `@nanisoft/identity`, `@nanisoft/landing` (all `"test": "vitest run"`).

### packages/architecture
Command: `pnpm --filter @nanisoft/architecture test`
```
 Test Files  5 passed (5)
      Tests  124 passed (124)
   Duration  1.34s
```
**PASS — 124/124 as claimed.**

### packages/identity
Command: `pnpm --filter @nanisoft/identity test`
```
 Test Files  3 passed (3)
      Tests  34 passed (34)
   Duration  712ms
```
**PASS — 34/34 as claimed.**

### apps/landing vitest
Command: `pnpm --filter @nanisoft/landing test`
```
 Test Files  4 passed (4)
      Tests  18 passed (18)
   Duration  60.72s
```
**PASS — 18/18 across exactly 4 suites as claimed.**

## Check 3 — Builds

### apps/landing
Command: `pnpm build` in `apps/landing` → exit code 0.
Route table excerpt:
```
┌ ○ /
├ ○ /_not-found
├ ƒ /api/demo-request
└ ○ /icon.svg
ƒ  (Dynamic)  server-rendered on demand
```
**PASS — exit 0; `/api/demo-request` marked `ƒ (Dynamic)`.** (Next.js 16.3.1 Turbopack.)

### apps/playground
Command: `pnpm build` in `apps/playground` → exit code 0.
Routes `/`, `/tokens`, `/icon.svg`, `/_not-found` all static.
**PASS.**

## Check 4 — Playground Playwright e2e

Config: `C:\Users\dpven\source\website\apps\playground\playwright.config.ts` (boots its own dev server via `[WebServer] $ next dev -p 3001`, observed in output).
Command: `pnpm test:e2e` in `apps/playground` → exit code 0.
```
Running 10 tests using 1 worker
  ok  1 [chromium] smoke: dev server serves the playground with a live store hook (2.1s)
  ok  2 [chromium] smoke: pure core imports into the spec process (22 flagship steps) (4ms)
  ok  3 [chromium] A — full auto-run: 22 steps, stops at the end, no console errors... (26.3s)
  ok  4–7 [chromium] B — DataGerry/Airflow/Atlas/Trino canonical actions ... like applyStep
  ok  8–9 [chromium] B — Compass drill-into / Superset filter are UI-local (read lens)
  ok 10 [chromium] C — inspector evolves across 22 steps; three read lenses show the finding (9.9s)
  10 passed (1.4m)
```
**PASS — 10/10 on first run, no retry needed (~1.4m as predicted).**

## Check 5 — Static spot-checks

### 5a. Theme name, metadata, fonts
- `'sentinel-theme'`: **zero occurrences** anywhere under `apps/landing` (case-insensitive sweep `sentinel|trueaccess` matched only test-assertion lines, below).
- `'nanisoft-theme'`: present in 3 files — `apps/landing/app/layout.tsx:41` (localStorage key in theme bootstrap), `apps/landing/components/theme/ThemeProvider.tsx`, `apps/landing/tests/theme.test.tsx`.
- Metadata (`apps/landing/app/layout.tsx:31-36`): title `nanisoft — digital twin of the IT estate`; description `nanisoft builds a living digital twin of your organization's IT estate…`. Contains "digital twin", no "Sentinel".
- Inter: **removed.** Case-insensitive grep for `Inter` hits only `esModuleInterop`, `interface`, and prose comments — no `next/font/google` Inter import. Font imports are `apps/landing/app/layout.tsx:2` `next/font/local` and `:3` `JetBrains_Mono` from `next/font/google`.
- Satoshi: exactly 5 woff2 under `apps/landing/app/fonts/` (Regular, Italic, Medium, Bold, BoldItalic), declared in `localFont({ src: [...] })` at `layout.tsx:13-23`.

**PASS.**

### 5b. Retired components
Grep (case-insensitive) for `ChatPanel|CommandCenter|LogoCloud|Testimonial` across `apps/landing`: single hit is a *comment* at `apps/landing/tests/page.test.tsx:60` listing what must NOT render. Glob for `**/*{ChatPanel,CommandCenter,LogoCloud,Testimonial}*`: no files. `AgentsDemo|agents-demo|AgentShowcase`: no matches. Component inventory (`apps/landing/components/**`): Problem, FinalCTA, Footer, Hero, Integrations, PillButton, Platform, TopNav, UseCases, Wordmark, theme/{ThemeToggle,ThemeProvider,tokens} — nothing retired.
`react-force-graph-2d` in any `**/package.json` repo-wide: **no matches** (it survives only as prose in map.md decision history).
**PASS.**

### 5c. Identity exports and PillButton
- `packages/identity/src/index.ts:25` — `export { wordmarkSvg, monogramSvg } from './wordmark';`
- `ink` option: `packages/identity/src/wordmark.ts:35` — `ink?: Hex;` inside `WordmarkOptions` (doc comment: "pass the light-surface text color when the mark sits on a dark/petrol surface"); exercised by `packages/identity/tests/wordmark.test.ts:51` `wordmarkSvg({ ink: color.bone })`.
- `PillButton`: `apps/landing/components/PillButton.tsx` exists; consumed by `Hero.tsx`, `TopNav.tsx`, `FinalCTA.tsx`.
**PASS.**

### 5d. Deploy workflow
`.github/workflows/deploy.yml` exists. Job `verify` ("Lint, Test, Build") runs `pnpm -r run lint` → `pnpm -r run test` → `pnpm -r run build`. Both deploy jobs declare `needs: verify` and gate on push to main: `deploy-landing` → "Deploy landing → nanisoft worker" (`pnpm --filter @nanisoft/landing run deploy`), `deploy-playground` → "Deploy playground → nanisoft-playground worker".
**PASS.**

### 5e. Bridge CTA absence
Case-insensitive grep for `playground\.nanisoft\.com` across all of `apps/landing`: **0 occurrences**. (Ticket 21 scope correctly not started.)
**PASS.**

### 5f. Playground overlays
Directory `apps/playground/app/_overlay/` contains exactly: `DataGerryOverlay.tsx`, `AirflowOverlay.tsx`, `TrinoOverlay.tsx`, `AtlasOpaOverlay.tsx`, `CompassOverlay.tsx`, `SupersetOverlay.tsx`, plus shared chrome `ToolOverlay.tsx` and registry `tool-content.ts`.
`tool-content.ts` registers all six, keyed by node id:
```ts
export const TOOL_CONTENT: Record<string, ComponentType> = {
  blueprint: DataGerryOverlay,
  trailhead: AirflowOverlay,
  overlook: TrinoOverlay,
  atlas: AtlasOpaOverlay,
  compass: CompassOverlay,
  superset: SupersetOverlay,
};
```
**PASS.**

### 5g. Remaining "Sentinel" strings in apps/landing (full enumeration)
Case-insensitive pattern `sentinel` over `apps/landing` (ripgrep; respects gitignore, so `.next`/`.open-next`/`node_modules` excluded):

| File | Matches | Lines |
|---|---|---|
| `apps/landing/tests/data.test.ts` | 3 | :21 `'carries no Sentinel/TrueAccess branding…'`, :26 `expect(dump.includes('Sentinel')).toBe(false);` |
| `apps/landing/tests/page.test.tsx` | 3 | :56 `'no longer renders the retired Sentinel-demo components'`, :64 comment, :65 `expect(screen.queryAllByText(/Sentinel/i)).toHaveLength(0);` |

Total: **6 occurrences, all inside tests that assert Sentinel's absence.** Zero in app/components/lib source copy; zero "Sentinel Lake"; zero `'sentinel-theme'`. This exceeds the expected state (the map anticipated placeholder copy possibly still pending ticket 21 — there is none).

---

## Verdict table

| Claim | Expected | Actual | Verdict |
|---|---|---|---|
| HEAD `8a85024`, tree clean | 8a85024, clean | 8a85024, porcelain empty at audit start | CONFIRMED |
| Working tree stays untouched by audit | clean | apps/packages/.github clean throughout; two `.scratch` docs (SPEC.md, map.md) modified at 14:51 by a concurrent non-audit process | CONFIRMED (code tree) — see Check 1 note |
| architecture unit tests | 124/124 | 124/124 (5 files) | CONFIRMED |
| identity unit tests | 34/34 | 34/34 (3 files) | CONFIRMED |
| landing vitest | 18/18 across 4 suites | 18/18 across 4 suites | CONFIRMED |
| landing `next build` | exit 0; `/api/demo-request` dynamic | exit 0; route listed `ƒ /api/demo-request` | CONFIRMED |
| playground `next build` | exit 0 | exit 0 | CONFIRMED |
| Playwright e2e | 10/10 (~60s) | 10/10 in 1.4m, first attempt | CONFIRMED |
| No `'sentinel-theme'`; `'nanisoft-theme'` instead | absent / present | 0 hits; key in layout.tsx:41, ThemeProvider, theme.test | CONFIRMED |
| Metadata says "digital twin", not "Sentinel" | yes | layout.tsx:31-36 exact match | CONFIRMED |
| Inter removed | no next/font/google Inter | none; only localFont + JetBrains_Mono imports | CONFIRMED |
| Satoshi via next/font/local (5 woff2) + JetBrains Mono | yes | 5 woff2 in app/fonts/, localFont src array of 5; JetBrains_Mono google import | CONFIRMED |
| ChatPanel / CommandCenter / Agents demo / LogoCloud / Testimonial retired | absent | absent (only negative-assertion comments in tests) | CONFIRMED |
| `react-force-graph-2d` not in any package.json | absent | 0 matches repo-wide package.json files | CONFIRMED |
| identity `wordmarkSvg` with `ink` option | yes | index.ts:25 export; wordmark.ts:35 `ink?: Hex`; tested at wordmark.test.ts:51 | CONFIRMED |
| PillButton exists in landing | yes | components/PillButton.tsx; used by Hero/TopNav/FinalCTA | CONFIRMED |
| deploy.yml gates + workers `nanisoft`, `nanisoft-playground` | lint/test/build before deploys | `verify` job (lint→test→build); both deploy jobs `needs: verify` | CONFIRMED |
| Zero `playground.nanisoft.com` refs in landing | 0 | 0 (case-insensitive) | CONFIRMED |
| Six tool overlays exist + registered | blueprint/trailhead/overlook/atlas/compass/superset | 6 overlay files; TOOL_CONTENT maps all six ids | CONFIRMED |
| Remaining "Sentinel" strings enumerated | enumerate; placeholders may remain | 6 occurrences, all in absence-asserting tests; zero in shipped copy | CONFIRMED (cleaner than expected) |

**Overall: 20/20 claims CONFIRMED. No FAILED rows. One environmental observation recorded (concurrent `.scratch` doc edits mid-audit, outside the audited code surface).**
