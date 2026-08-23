# Code audit — landing app + deployment vs map/SPEC claims (2026-08-23)

Auditor: read-only sweep of the current working tree (git history squashed to 2 commits; hashes ignored).
Claims audited against: `.scratch/nanosoft-digital-twin/map.md` (Build progress §50–64, Frontier §64) and `SPEC.md` (§2 identity, §3 landing, §5 deployment).
Known pre-existing env issue NOT counted against any ticket: apps/landing contact e2e specs failing locally.

---

## [18] Landing shell — wordmark nav + positioning + re-theme + retire

**VERDICT: not-started** (0 of 5 acceptance checkboxes met; two isolated identity precursors exist: W3 favicon, JetBrains Mono)

Ticket acceptance criteria (verbatim from `.scratch/nanosoft-digital-twin/issues/18-landing-shell-retheme.md`):
> - [ ] TopNav renders the W1 wordmark + positioning line (nanisoft = digital twin of the IT estate); Footer re-themed; all in tokens from 08
> - [ ] Retired from the landing: ChatPanel, CommandCenter, the Agents demo, LogoCloud, Testimonial (no longer rendered)
> - [ ] Kept components (Problem, Platform, UseCases, Integrations, FinalCTA) remain but re-themed in nanisoft tokens as placeholders for the narrative sections (ticket 21)
> - [ ] "TrueAccess" retired everywhere on the landing; no Sentinel/Datalake-demo branding remains
> - [ ] `apps/landing` builds and the page renders the shell without the retired components

Per-criterion audit:

- **Fonts — UNMET (Satoshi absent; JetBrains Mono present but predates the re-theme).**
  - `apps/landing/app/layout.tsx:2` loads `Inter, JetBrains_Mono` from `next/font/google`; `layout.tsx:8–18` configures `--font-inter` + `--font-mono`. No Satoshi is loaded anywhere (no `next/font/local`, no fontsource dep in `apps/landing/package.json`, no public fonts dir). Repo-wide grep of `apps/landing` for `satoshi` (case-insensitive): zero matches.
  - Body still binds Inter: `app/globals.css:34` `font-family: var(--font-inter), 'Inter', ...`.
  - JetBrains Mono (`globals.css:40`, used via `.mono`) matches the identity's "data" face, but it shipped with the original Sentinel build, not ticket 18.
  - Contrast: `packages/identity/src/tokens.ts:114–119` defines the target (`voice` = Satoshi via `var(--font-satoshi)`; `data` = JetBrains Mono) — the landing consumes neither variable.
- **Tokens consumed from packages/identity — UNMET.**
  - Zero occurrences of petrol/bone/jade values or names in landing source (grep `petrol|jade|bone|satoshi` over `apps/landing` excluding build dirs: no matches).
  - `app/globals.css:1–27` defines the OLD Sentinel palette: light primary `#1E5BFF` (blue), accent `#00C2D6`; dark primary `#3B82F6`, accent `#22D3EE` — none are the identity's petrol `#0C2A33` / bone `#F4EFE6` / teal `#2A8C97` / jade `#14A77A`.
  - Only identity imports in the app: `layout.tsx:4–5` (`APP_NAME` from architecture, `IDENTITY_VERSION` from identity, used as a metadata tag at `layout.tsx:26`). The comment at `layout.tsx:24–25` states outright: "full token consumption (re-theme to the nanisoft 'Living Map' palette/type/wordmark) arrives in ticket 18."
- **Shape-lock radii — UNMET.** No 20/12/pill system anywhere; ad-hoc radii persist (`globals.css:56` focus outline radius 4, `globals.css:63` skip link radius 8, `TopNav.tsx:48` logo square radius 6, antd defaults elsewhere). `packages/identity/src/tokens.ts:89–93` (card 20 / inner 12 / pill 9999) unreferenced.
- **Wordmark/favicon — PARTIAL.**
  - W1 wordmark: UNMET. `components/TopNav.tsx:42–53` and `Footer.tsx:25–35` render a gradient square (`linear-gradient(var(--color-primary), var(--color-accent))`) plus `BRAND.name` text — which is **"Sentinel Lake"** (`lib/data.ts:4`), not the nanisoft W1 mark, and there is no positioning line.
  - Favicon: MET. `app/icon.svg:1–7` IS the W3 monogram generated from `@nanisoft/identity monogramSvg(32)` — petrol `#0C2A33` background, bone strokes, node+dot mark.
- **Dark + light modes — PARTIAL.** Modes exist and work (`ThemeProvider`/`ThemeToggle`, `data-theme` bootstrap script `layout.tsx:29–41`, dark block `globals.css:15–27`, reduced-motion guards `globals.css:46–70`), but the entire token set is the old Sentinel palette, and the storage key is still `'sentinel-theme'` (`layout.tsx:32`, `components/theme/ThemeProvider.tsx:26`).
- **Retire list — UNMET.** All five components still exist AND still render:
  - `app/page.tsx:4,21` LogoCloud; `:7,25` Agents; `:10,28` Testimonial; `:12,24` KnowledgeGraphLazy section.
  - ChatPanel + CommandCenter render inside the hero: `Hero.tsx:7,78` → `CommandCenter.tsx:9,64` → `ChatPanel`.
- **"No Sentinel branding" — UNMET.** No literal `TrueAccess` string anywhere in the app (that half passes), but Sentinel branding is pervasive: `lib/data.ts:4` `name: 'Sentinel Lake'`; `data.ts:12` hero sub; `data.ts:113` testimonial quote; `data.ts:126` `sales@sentinellake.example`; `layout.tsx:21` metadata title "Sentinel Lake — Security Data Lake & Knowledge Graph"; `Agents.tsx:48`; `UseCases.tsx:17`; tests still assert it (`tests/page.test.tsx:23`, `tests/a11y.test.tsx:46`).
- Build health: not re-run in this audit; tests/configs present (`vitest.config.mts`, 6 suites under `tests/`).

---

## [19] Landing hero — reactive digital-twin graph DAG

**VERDICT: not-started**

- No DAG hero exists. The rendered hero is the original Sentinel marketing hero: `components/Hero.tsx` — eyebrow tag, H1/sub copy, **two buttons** (`Hero.tsx:46–51` "Request a demo" / "Watch 2-min walkthrough" — violates the "no buttons, pure spectacle" requirement), customer-logo strip (`Hero.tsx:52–61`), metrics row, and the legacy `CommandCenter` panel (`Hero.tsx:78`).
- `react-force-graph-2d@1.29.1` IS a dependency (`apps/landing/package.json:22`) but is used only by the legacy scattered-mesh knowledge-graph canvases: `components/KGCanvas.tsx:9` and `components/KGFilteredCanvas.tsx:8` (`dynamic(() => import('react-force-graph-2d'), { ssr: false })` — notably inside non-client-wrapper usage patterns ticket 19 was meant to replace). `@xyflow/react` is absent from the landing entirely (it lives in `apps/playground/package.json:16`).
- Nothing consumes the `packages/architecture` model to draw any pipeline: the app's only architecture import is the string constant `APP_NAME` (`app/layout.tsx:4`). No jade wavefront, no orthogonal routing, no Watchtower observer, no mouse-reactive DAG component exists in `apps/landing/components/`.
- "Replaces the current KnowledgeGraph hero": nothing was replaced — `KnowledgeGraphLazy` still renders mid-page (`page.tsx:24`) and the old hero stands at the top (`page.tsx:20`).
- No motion-principles/reduced-motion hero implementation (only generic `globals.css:46–51` duration clamp).

---

## [20] Landing architecture section — scroll-animated shared-spine + bridge CTA

**VERDICT: not-started**

- No such component exists. There is no scroll-driven spine, phase band, or "how we build it" section anywhere in `apps/landing/components/` (full file listing checked).
- The landing consumes none of `packages/architecture`'s model exports (components/phases/spine edges) — only `APP_NAME` (`app/layout.tsx:4`). The spine render that ticket 20 would reuse lives solely in `apps/playground/app/_spine/`.
- Bridge CTA to playground.nanisoft.com: absent. Grep for `playground\.|nanisoft\.com` across `apps/landing`: zero matches.
- Tokens/reduced-motion criterion moot until the section exists.

---

## [21] Landing narrative sections + re-theme reused components

**VERDICT: not-started**

- None of the five narrative beats exist. Current sections carry the original Sentinel-Datalake-demo copy, driven by `lib/data.ts`:
  - Problem cards = fragmented sources / temporal context / forensic answers (`data.ts:28–44`) — not "what it is".
  - Platform flow Ingest→Normalize→Graph→Query (`data.ts:46–60`) — not the architecture story.
  - UseCases = M&A due diligence / incident response / continuous compliance (`data.ts:62–90`, heading "Where teams use Sentinel Lake." at `UseCases.tsx:17`) — not "what it unlocks" (no access-traversal flagship mention).
  - No "our approach" buy-first/compose-OSS section (no 16-off-the-shelf/4-custom framing anywhere).
  - FinalCTA = "Bring every signal into one model." → `/api/demo-request` + `mailto:sales@sentinellake.example` (`data.ts:123–128`, `app/api/demo-request/route.ts`) — not "try it in the playground" (zero links to playground.nanisoft.com).
- Re-theme criterion unmet: kept components (Problem/Platform/UseCases/Integrations/FinalCTA) all style off the old CSS variables (`--color-*`), not nanisoft tokens.
- Tone/copy criterion unmet: hype-adjacent marketing claims persist (e.g. `data.ts:19` "p95 query <200 ms", `data.ts:118` "Cut audit prep from weeks to hours", testimonial metrics `data.ts:117–121`).
- Component codenames: n/a — nothing references Atlas/Compass/etc. because the narrative wasn't built.

---

## [22] Deployment

**VERDICT: drifted** — deployment infrastructure is fully built and wired for Cloudflare Workers (OpenNext), directly contradicting the ticket/SPEC/map's Vercel-Pro recommendation and its "blocked on open deployment inputs" status. Not graded "complete" because (a) the platform contradicts the written ticket, (b) live-URL resolution can't be verified read-only here, and (c) one documented manual DNS step remains.

Actual deploy reality (file:line):

- **Wrangler configs, both apps:** `apps/landing/wrangler.jsonc:4` `"name": "nanisoft"` (main `.open-next/worker.js`, compat date 2026-08-01, flags `nodejs_compat` + `global_fetch_strictly_public`, ASSETS binding); `apps/playground/wrangler.jsonc:4` `"name": "nanisoft-playground"` (same shape). No wrangler.toml anywhere.
- **OpenNext configs:** `apps/landing/open-next.config.ts:5` and `apps/playground/open-next.config.ts` — minimal `defineCloudflareConfig({})` (R2 incremental cache + Images binding deliberately omitted per design doc).
- **Deps:** `@opennextjs/cloudflare ^1.20.2` + `wrangler ^4.125.0` as DIRECT devDependencies in both `apps/landing/package.json:28–29` and `apps/playground/package.json:24–25` (matches memory note: wrangler must be a direct devDep per app). Next pinned `16.3.1` in both (`landing:17`, `playground:17`) — the 16.3.0 #96646 crash is avoided (issue-22 checkbox satisfied, albeit on the wrong platform per ticket).
- **Deploy scripts:** both apps have `"cloudflare-build": "opennextjs-cloudflare build"` and `"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"` (`apps/landing/package.json:8–9`, `apps/playground/package.json:8–9`). Root `package.json:6–12` has no deploy scripts (CI filters per-app).
- **CI:** `.github/workflows/deploy.yml` — job `verify` (lint/test/build gate, Node 24, pnpm 11 via packageManager, lines 15–35) then parallel `deploy-landing` (lines 37–58, `pnpm --filter @nanisoft/landing run deploy` → worker `nanisoft`, secrets `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`) and `deploy-playground` (lines 60–81 → worker `nanisoft-playground`), on push to main only, with concurrency cancellation (lines 10–12).
- **Build artifacts:** `.open-next/` output dirs exist locally in BOTH apps (dated 2026-08-23 ~01:44), each with `assets/` (incl. `assets/BUILD_ID`), `cache/`, `cloudflare/`, `middleware/`, `dynamodb-provider/`, `server-functions/default/` — `opennextjs-cloudflare build` has been executed. Caveat: the top-level `.open-next/worker.js` that both wrangler.jsonc `main` fields point to is **absent** in both apps, so these local builds are partial/interrupted — consistent with the project-memory-documented Windows failure (`EPERM: symlink` in OpenNext's `copyTracedFiles.js`); GitHub Actions (Ubuntu) is the deploy path that matters. `.gitignore:31–33` excludes `.open-next/` + `.wrangler/`.
- **Docs:** `docs/superpowers/specs/2026-08-23-cloudflare-workers-deploy-design.md` (dated today; Status: Approved) and `docs/superpowers/plans/2026-08-23-cloudflare-workers-deploy.md`. Design doc states the mapping (lines 11–13: landing → worker `nanisoft` → `nanisoft.com` + `www.nanisoft.com`; playground → worker `nanisoft-playground` → `playground.nanisoft.com`) and records that **the existing site already deploys to Cloudflare Workers via OpenNext** (line 16) with the `nanisoft` worker's custom domains already configured (line 84). Remaining manual step: attach `playground.nanisoft.com` after first playground deploy (design doc lines 82–85; echoed in workflow comments `deploy.yml:74–77`).
- **Config tweaks for the platform:** `images.unoptimized: true` in both next configs (`apps/landing/next.config.mjs:7–9`, `apps/playground/next.config.mjs:6–8`) to avoid the paid IMAGES binding.
- **What does NOT exist:** no `vercel.json` anywhere in the repo; no Vercel-related deps/scripts/workflows; no `proxy.ts` and no `middleware.ts` in either app (so the SPEC §5-recorded Cloudflare workaround "keep middleware.ts + --webpack" isn't represented — the apps run neither middleware file); README (`README.md`) is still the stale Sentinel-Lake npm-era doc with zero deployment info; root `package.json` has no deploy script.

Reconciliation with claims:

- SPEC §5 "Default recommendation: both apps on Vercel Pro" — **contradicted by reality** (Cloudflare Workers/OpenNext implemented end-to-end). The four "open user inputs" (cost posture, registrar/DNS, cluster, server-feature needs) were resolved de facto by the Cloudflare choice rather than being formally gathered (map §"Not yet specified" last bullet says to gather before build/handoff — didn't happen as described).
- Map Frontier line "`[22]` (deployment) blocked on the open deployment inputs" — **stale/false**: deployment was built (and the landing worker path was already live from the predecessor site per the design doc).
- Issue-22 checkbox-by-checkbox: "Two Vercel projects" refuted (two Cloudflare workers instead); "apex A/CNAME resolve" partially satisfied (nanisoft.com/www already configured on the existing worker; playground domain = documented pending manual step); "open inputs gathered" superseded; "#96646 avoided at 16.3.1" met (`package.json` pins); "deployed URLs load" unverifiable from the working tree (no runtime check performed in this read-only audit).

---

## Inventories

Root `research/` (1 file):
- `research/deployment-findings.md` — ticket-02 deployment research (~19.5 KB): TL;DR recommends Vercel Pro for both apps; Cloudflare (`@opennextjs/cloudflare`) noted as free alternative carrying the then-open `proxy.ts` gap (#1277 / PR #1309) with the keep-`middleware.ts` + `--webpack` workaround; K8s self-hosting deferred; user-input flags (cost/registrar/cluster/server features).
- Note: `map.md` §44 also cites `research/nextjs-capability-findings.md` (ticket 01) — that file does NOT exist under root `research/`.

`.scratch/nanosoft-digital-twin/research/`:
- Did not exist prior to this audit; created now to hold this findings file (`2026-08-23-code-audit-landing-deploy.md`).

---

## SPEC sync deltas

Divergences between SPEC.md/map.md claims and code reality:

1. **Vercel Pro → Cloudflare Workers (the big one).** SPEC §5 + map [02] record Vercel Pro as the decided default and Cloudflare as an "alternative… not a verified adapter"; issue 22 is titled "two apps to Vercel Pro". Reality: full Cloudflare OpenNext deployment built (wrangler.jsonc ×2, open-next.config.ts ×2, per-app deploy scripts, GitHub Actions deploy-on-push, local `.open-next` builds), landing mapped to worker `nanisoft` (nanisoft.com + www, already configured) and playground to `nanisoft-playground` (docs/superpowers/specs/2026-08-23-cloudflare-workers-deploy-design.md:11–13). Decision 15 / ticket 02 need re-recording: Cloudflare is now the implemented platform, not the fallback.
2. **Map Frontier "[22] blocked on open deployment inputs" — false.** Deployment work happened despite the four inputs never being formally gathered/resolved in writing; they were implicitly answered by choosing Cloudflare (cost=free tier, DNS=existing Cloudflare-connected repo, infra=managed Workers, server features=API route requires runtime → Workers not Pages).
3. **The recorded Cloudflare caveats don't match the implementation.** SPEC §5 says Cloudflare works only by keeping `middleware.ts` and building `--webpack` (#1277 workaround); the implemented apps contain neither `middleware.ts` nor `proxy.ts` and no webpack flag — the constraint is stale relative to whatever @opennextjs/cloudflare version resolved (^1.20.2 range).
4. **[18] map shows "unblocked, ready" but no work started** — and worse than neutral: the shell still actively violates three SPEC §3 decisions (retire list still rendered — ChatPanel/CommandCenter/Agents/LogoCloud/Testimonial all live at `page.tsx`; Sentinel branding pervasive incl. metadata title; Inter not Satoshi). Map [08]'s note "`apps/landing` still uses Inter until ticket 18 re-themes it" remains accurate and unactioned.
5. **[19]/[20]/[21] map Frontier says "blocked by 18" — accurate on dependency, but all three are fully not-started**, and the SPEC §3 narrative structure (`what it is → how we build it → what it unlocks → our approach → try it in the playground`) has zero representation in code; no landing surface links to playground.nanisoft.com (bridge CTA absent).
6. **Landing↔architecture integration is one-way and cosmetic:** SPEC §3.3 says the architecture section reuses `packages/architecture`; currently the landing imports only `APP_NAME` (a string) and `IDENTITY_VERSION`. `react-force-graph-2d` is present in the landing but serves only the legacy mesh KG canvases, not the SPEC §2 directed-pipeline hero language.
7. **README/docs drift:** README.md still documents the pre-monorepo Sentinel Lake standalone app ("Next.js 14 · antd v5 · npm") — wrong stack (monorepo is Next 16.3.1/pnpm, antd 6), no deploy instructions; map/SPEC say nothing about this but any handoff reader will be misled. Metadata title/theme-storage keys (`sentinel-theme`) likewise contradict the "TrueAccess retired everywhere" spirit extended to Sentinel branding.
8. **Minor:** map [06] claims "`apps/landing` relocated (builds, vitest 19/19 green)" — test files exist (6 suites); count not re-verified in this audit. Map's cited `research/nextjs-capability-findings.md` is missing from disk while `research/deployment-findings.md` exists.
