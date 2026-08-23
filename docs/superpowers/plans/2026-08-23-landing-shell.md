# Plan — landing shell re-theme (ticket 18)

Design: `docs/superpowers/specs/2026-08-23-landing-shell-design.md`. Branch `feat/18-landing-shell` (worktree). No push (origin push auto-deploys Cloudflare workers).

## Phase A — retire (TDD: update tests to expect the post-retirement page, watch them fail, then delete)

1. Update `tests/page.test.tsx`: nanisoft brand assertions; positioning line; `/Sentinel/i` absent; retired-section markers absent (Agents h2, KG h2, testimonial author).
2. Update `tests/data.test.ts`: drop CHAT_TRANSCRIPTS + secondary-CTA cases. Delete `tests/hero-hover-preview.test.tsx`, `tests/graph-data.test.ts`.
3. Delete components/libs per design; strip page.tsx to shell + kept sections; Hero → single column minus CommandCenter/secondary CTA; trim types.ts; remove react-force-graph-2d dep; prune canvas stub in tests/setup.ts.
4. Gate: lint + build + test green.

## Phase B — re-theme

5. Download Satoshi woff2 ×5 from Fontshare into `app/fonts/`.
6. `layout.tsx`: localFont Satoshi (`--font-satoshi`) + JetBrains Mono (`--font-mono`), drop Inter; metadata de-Sentinel'd; storage key `nanisoft-theme`.
7. `globals.css`: semantic token remap both modes + radius lock + wordmark font rule + focus/skip-link/selection on tokens.
8. `components/theme/tokens.ts`: antd themes from identity values (radiusLG=20 override, colorTextLightSolid, Button.primaryColor); ThemeProvider storage key.
9. New `components/Wordmark.tsx` (mode-aware inline W1); rewrite TopNav (wordmark + positioning line + anchors + pill CTA) and Footer (wordmark + tagline).
10. De-brand data strings; UseCases gradient de-accenting.

## Phase C — verify

11. Gates: grep sweeps (Sentinel/TrueAccess/Inter/sentinel-theme/retired imports all zero), `lint`, `build`, `test`.
12. Code review skill over the branch diff; fix findings; commit series on the branch.

Deferred to 19–21: hero DAG, architecture spine section, narrative copy, playground bridge CTA, human visual confirm.
