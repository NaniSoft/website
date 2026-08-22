# 20 — Landing architecture section — scroll-animated shared-spine + bridge CTA

**What to build:** The "how we build it" section — an interactive shared-spine (reusing the playground's spine render + `packages/architecture`) scroll-animated through the four phases, ending in a bridge CTA to playground.nanisoft.com.

**Blocked by:** 09 (Playground spine rendered from the model), 18 (Landing shell).

**Status:** ready-for-agent

- [ ] The section reuses the spine render from 09 + the model from 07 to show the directed pipeline
- [ ] Scroll-animated through Schema → Ingestion → Transform → Investigation (the phase band advances as you scroll)
- [ ] Bridge CTA links to playground.nanisoft.com
- [ ] Tokens from 08 applied; motion honors `prefers-reduced-motion`
- [ ] Sits within the landing shell (18) in narrative position "how we build it"