# 18 — Landing shell — wordmark nav + positioning + re-theme + retire

**What to build:** The rebranded `apps/landing` shell — TopNav with the wordmark + positioning line, Footer, all in nanisoft tokens — with the non-fitting Sentinel/Datalake components retired and the kept components held as re-themed placeholders for the narrative sections.

**Blocked by:** 08 (nanisoft identity system).

**Status:** done — merged to main (`0faef41` via merge commit; coordinator-integrated & verified 2026-08-23: landing build exit 0, vitest **18/18** across 4 suites, identity **34/34**). One additive cross-package change beyond `apps/landing`: identity `wordmarkSvg` gained an `ink` option (the W1 mark was petrol-on-petrol invisible in dark mode), covered by new identity tests. The retired components' now-dead KG dependency family (`KGCanvas`/`KGFilteredCanvas`/`KGListView`/`KnowledgeGraph(+Lazy)`/`NodeInspector`/`StatStrip`, `lib/graph-data.ts`, `lib/chat-transcripts.ts`, the `react-force-graph-2d` dep) was removed in the same pass per the approved design doc; the demo-request API route is untouched (live on Cloudflare). Deferred to 19–21: hero DAG replacement, architecture spine section, narrative copy rewrite (kept copy intact except Sentinel name swaps), playground bridge CTA, human visual confirm (house precedent from ticket 11).

- [x] TopNav renders the W1 wordmark + positioning line (nanisoft = digital twin of the IT estate); Footer re-themed; all in tokens from 08 — new `Wordmark.tsx` renders inline `wordmarkSvg` mode-aware; positioning line derived from `BRAND.tagline`; zero hand-rolled hexes
- [x] Retired from the landing: ChatPanel, CommandCenter, the Agents demo, LogoCloud, Testimonial (no longer rendered) — deleted along with the dead KG family above; page renders none of them
- [x] Kept components (Problem, Platform, UseCases, Integrations, FinalCTA) remain but re-themed in nanisoft tokens as placeholders for the narrative sections (ticket 21) — token/style migration + de-branding only; copy intact except Sentinel name swaps
- [x] "TrueAccess" retired everywhere on the landing; no Sentinel/Datalake-demo branding remains — BRAND.name→nanisoft, metadata, UseCases heading, sales mailto, `'sentinel-theme'`→`'nanisoft-theme'`; grep sweep clean outside negative test assertions
- [x] `apps/landing` builds and the page renders the shell without the retired components — build exit 0 with `/api/demo-request` still dynamic; tests assert the five kept section ids and absence of retired markers
