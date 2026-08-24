# Map: UI cohesion pass — responsive, unified, explanation-first

## Destination

All refinements implemented and verified on `main` and pushed: vertical-only
page scrolling everywhere (mobile through 1920/landscape), one mode-aware
palette across landing + playground, a simplified "estate to answer" hero,
zero sales asks replaced by a single "Open the playground" path.

## Notes

- Domain: nanisoft marketing landing (`apps/landing`) + interactive
  playground (`apps/playground`), pnpm monorepo, Next 16.3.1 (breaking vs
  training data — read each app's `node_modules/next/dist/docs/` before
  coding), brand tokens from `@nanisoft/identity`.
- **Execution override:** the human partner carried implementation INTO this
  effort — tickets are executed to done, not just decided.
- **AFK run:** human is away from keyboard; controller picks best judgment
  on open details; subagent-driven sequential execution directly on `main`
  (explicitly authorized); push to remote + verify publish at the end.
- Skills every session should consult: superpowers:subagent-driven-development
  (execution), frontend-design / dataviz instincts for the hero work.

## Decisions so far

- [Destination shape — implemented changes, not a spec](issues/01-destination-shape.md) — execution override recorded in Notes.
- [Scroll law — page never scrolls horizontally; hero pan exception](issues/02-scroll-law.md) — later narrowed: new hero restacks vertically, so no pan remains anywhere.
- [Sales surface → one exploration path](issues/03-remove-sales.md) — demo route + mailto deleted; nav + closing become "Open the playground"; footer Contact stays.
- [Colors unify mode-aware, hues unchanged](issues/04-color-unification.md) — playground mirrors landing's data-theme contract; identity stays single source of truth.
- [Hero story — "estate to answer" medallion journey](issues/05-hero-story.md) — sources → Land → Conform → Graph → Serve, ending on the answered access question.
- [Hero interaction — self-running loop, alive under the hand](issues/06-hero-interaction.md) — ~7s cycle, subtle pointer life, static settled frame for reduced motion.
- [No prototype round — straight to implementation](issues/07-no-prototype.md) — AFK override; design judgment locked in plan Task 4.

## Not yet specified

- Hero motion micro-details (exact badge reveal timing, glyph choreography) —
  graduate only if Task 4's review shows they matter; otherwise they live in
  the implementer's hands per the locked design.
- Playground small-screen ergonomics beyond overflow elimination (e.g.
  whether Controls/Inspector should collapse on phones).
- Follow-ups recommended by the final whole-branch review (2026-08-24) —
  **all four resolved 2026-08-24** (same-day AFK run): (a) identity token
  decision landed as `role.onAccent` = petrol — reads on jade at ~4.9:1 in
  BOTH modes (bone was ~2.7:1 light); enforced by a computed WCAG test in
  identity; both apps' `--color-on-accent` updated, IDENTITY_VERSION → 0.2.0.
  (b) `THEME_STORAGE_KEY` + `themeBootstrapScript` now exported from
  `@nanisoft/identity/src/theme.ts`; the four app-code literals collapsed to
  the one constant (e2e/vitest specs keep raw literals deliberately — they
  pin the contract). (c) `e2e` job in deploy.yml runs both overflow matrices
  on every push/PR and gates both deploy jobs. (d) README rewritten
  (was a pre-reset Sentinel fossil) with the per-origin theme note: same-key
  contract per origin; subdomain deployments start consistent, no live-sync.
  Known dev-only artifact, deliberately not "fixed": React logs "script tag
  while rendering" when the root layout Fast-Refreshes — the bootstrap only
  needs to run pre-paint on load; providers reconcile afterwards. Clean
  loads (the user path) are console-clean in both apps, both modes; full
  CTA/nav regression passed same day (theme radios, anchors, scroll-driven
  stages 01→04, all four playground CTAs incl. a real click through to the
  live playground.nanisoft.com, playground auto-run to step 22 + overlay
  close + reset, /tokens page).

## Execution record

Charted 2026-08-23, executed 2026-08-23/24 via subagent-driven development,
directly on `main` as authorized: commits `ed47a89..8c96d87` (7 task commits
+ 1 final-review fix). All gates green at close: landing vitest 61/61,
playground e2e 50/50, themed overflow matrix 54/54 across 320–1920 +
1366×768 landscape, lint clean, both app builds pass, cross-app mode sync
verified. Final whole-branch review: ready to push after one docs fix
(applied).

## Out of scope

- Any funnel artifacts: pricing pages, request forms, analytics.
- Footer link targets and information architecture (links may dangle; not
  this effort).
- Identity palette values themselves — consumers adapt to identity, never
  the reverse.
