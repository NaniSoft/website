# 20 — Landing architecture section — scroll-animated shared-spine + bridge CTA

**What to build:** The "how we build it" section — an interactive shared-spine (reusing the playground's spine render + `packages/architecture`) scroll-animated through the four phases, ending in a bridge CTA to playground.nanisoft.com.

**Blocked by:** 09 (Playground spine rendered from the model), 18 (Landing shell).

**Status:** done (2026-08-23)

- [x] The section renders the directed pipeline from the model (07) via **a landing-local pure derivation** (`lib/spine-graph.ts`, reuse-strategy option b — batch-safe; literal reuse of 09's render was out of bounds during the parallel batch. Carry-forward: lift the shared derivation into `packages/architecture` and repoint both apps)
- [x] Scroll-animated through Schema → Ingestion → Transform → Investigation (the phase band advances as you scroll)
- [x] Bridge CTA links to playground.nanisoft.com
- [x] Tokens from 08 applied; motion honors `prefers-reduced-motion`
- [x] Sits within the landing shell (18) in narrative position "how we build it" *(integration: placed after Platform — ticket 21 repurposed Platform as how-we-build-it part one ending in a hand-off into this section)*