# Landing shell re-theme (ticket 18) — design

**Date:** 2026-08-23
**Status:** Approved
**Scope:** `apps/landing` only — shell (TopNav/Footer), token re-skin, retirement of the Sentinel-Datalake-demo components, de-branding. Copy rewrite is ticket 21; hero DAG is ticket 19; architecture section is ticket 20.

## Goal

`apps/landing` renders the nanisoft shell: W1 wordmark + positioning line in the nav, re-themed footer, every rendered surface on `@nanisoft/identity` tokens (petrol/bone base, teal secondary, jade locked to live/active only), Satoshi + JetBrains Mono loaded, shape lock 20/12/pill, dark and light both re-skinned — with the five retired components no longer rendered anywhere and no Sentinel/TrueAccess branding left.

## Token architecture (three layers)

1. **Primitives:** `@nanisoft/identity` (`color`, `surface`, `radius`, `font`, `easing`) — unchanged, consumed verbatim.
2. **Semantic CSS vars:** `app/globals.css` re-mapped from identity values in both modes:
   - light: bg=bone, elev=boneElev, sunken/border=boneSunken, text=ink, muted=inkMuted
   - dark: bg=petrol, elev=petrolMid, sunken=petrolDeep, border=petrolSoft, text=bone, muted=petrolTint
   - `--color-primary` = petrol (light) / boneElev (dark) — the interactive base, monochrome-inverted per mode; new `--color-on-primary` = bone / petrol.
   - `--color-secondary` = teal (supporting marks, focus ring); `--color-accent` = jade (**live/active only**).
   - Shape lock: `--radius-card: 20px`, `--radius-inner: 12px`, `--radius-pill: 9999px`.
   - Functional status colors (success/warning/danger) keep their existing generic hues — they are not brand hues.
3. **antd theme:** `components/theme/tokens.ts` rewritten to consume identity hexes directly: seed `borderRadius: radius.inner` (12), map override `borderRadiusLG: radius.card` (20 — genRadius would otherwise derive 14), `fontFamily: font.voice`, per-mode colorPrimary/colorBg/colorText as above, `colorTextLightSolid` = bone/petrol (never pure white on solid fills). Buttons become pills via `shape="round"` (antd v6 `components.Button` accepts no global-radius override; round sets borderRadius = controlHeight = true pill).

## Typography

Satoshi is a Fontshare font (not Google Fonts): download woff2 (400, 400i, 500, 700, 700i — ITF Free Font License, commercial use permitted) into `apps/landing/app/fonts/` and load via `next/font/local` with variable `--font-satoshi`. JetBrains Mono stays `next/font/google` (`--font-mono`). Inter is removed entirely. Identity's `font.voice`/`font.data` hooks then resolve. The W1 SVG uses `font-family="'Satoshi', …"` as a presentation attribute; a `.wordmark svg text { font-family: var(--font-satoshi), … }` CSS rule overrides it so the mark renders in the real webfont.

## Shell

- **TopNav:** W1 wordmark (inline `wordmarkSvg`, mask bg = mode surface) + positioning line "digital twin of the IT estate"; plain anchor links (#platform/#use-cases/#integrations) replace the dead-key antd Menu; ThemeToggle + pill "Request a demo" → #final-cta; the `/signin` link goes (no such route). Scroll blur kept.
- **Footer:** wordmark on elevated surface + BRAND tagline (= positioning line); column structure and legal bar unchanged.
- **Metadata:** title "nanisoft — digital twin of the IT estate", de-Sentinel'd description (plain tone, SPEC §2). Storage key `'sentinel-theme'` → `'nanisoft-theme'` (bootstrap script + ThemeProvider).

## Retirement scope

The five named components (ChatPanel, CommandCenter, Agents, LogoCloud, Testimonial) plus their now-dead dependency family, which is the Datalake-demo showcase ticket 19 replaces and which drags excluded colors onto the rendered surface (NodeInspector used antd purple/magenta presets):

- Components: Agents, ChatPanel, CommandCenter, LogoCloud, Testimonial, StatStrip, NodeInspector, KGCanvas, KGFilteredCanvas, KGListView, KnowledgeGraph, KnowledgeGraphLazy.
- Libs: `lib/chat-transcripts.ts`, `lib/graph-data.ts`; `lib/types.ts` trimmed to Integration/UseCase.
- Tests: `hero-hover-preview.test.tsx`, `graph-data.test.ts` deleted; data/page/a11y/theme tests updated.
- Deps: `react-force-graph-2d` removed (no remaining importer). `motion` stays (Hero).
- The demo-request API route is untouched (live on Cloudflare).

Hero becomes a single-column placeholder (CommandCenter gone; secondary CTA dropped because its `#agents` anchor dies with the Agents demo — SPEC §3 hero has no buttons anyway; primary CTA/metrics/trust row stay for ticket 21 to rewrite).

Jade discipline on the kept surface: the hero eyebrow live-dot pulse keeps accent (a genuine live indicator); UseCases decorative accent gradients become neutral/teal-tinted sunken covers.

## De-branding sweep (rendered surface + metadata + tests)

`BRAND.name` → 'nanisoft'; HERO.sub name swap ("Sentinel Lake unifies" → "nanisoft unifies"); FINAL_CTA sales mailto → hello@nanisoft.com; TESTIMONIAL deleted with its component; tests assert nanisoft and assert absence of /Sentinel/i.

## Verification (no-vision, house precedent from ticket 11)

No Playwright this batch. Green gates: `pnpm --filter @nanisoft/landing lint && build && test`; grep sweeps prove zero `Sentinel|TrueAccess|Inter|sentinel-theme|react-force-graph` occurrences in `apps/landing` source and zero retired-component imports. Human visual confirm deferred (19–21 will continue on this shell).
