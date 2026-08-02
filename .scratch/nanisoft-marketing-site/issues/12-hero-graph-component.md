# 12 — Hero graph component

**What to build:** The homepage hero's animated SVG graph (the winning Variant A "Split"): text left, animated graph right, stacking to a single column on mobile. The graph is a system-paths mesh (nodes: ingress / identity / network / service / api / edge / data / repo / asset) with one highlighted path ingress→identity→service→data→asset that draws in via `pathLength`, hot nodes springing in staggered and glowing, alternate edges dimmed. The headline and the highlighted path share the blue (`#3b82f6`) → purple (`#a855f7`) → pink (`#f472b6`) accent gradient. `PanelParticles` sits behind the split as a full-bleed layer. Non-interactive for now (interactivity is a sharpen-later fog item). Built with `MotionWrapper`/framer-motion idioms, blending with the existing dark-first theme.

**Blocked by:** 07 — Foundation (so the component drops into a clean homepage shell, not the old `HomepageHero`/`AIDemoLanding` wiring).

**Status:** ready-for-agent

- [ ] Hero renders the text-left / graph-right split; stacks single-column on mobile.
- [ ] Copy: headline "See Every Path Into Your Systems Before Someone Else Does", a flagship pill "Atlas, Bedrock, Keystone", a one-sentence subtext, primary CTA "Explore the Platform" → `/en/products`.
- [ ] SVG graph: the 9-node mesh + the highlighted ingress→identity→service→data→asset path drawn in via `pathLength`; hot nodes spring in staggered and glow; alternate edges dimmed.
- [ ] Headline + highlighted path share the blue→purple→pink accent gradient.
- [ ] `PanelParticles` behind the split, full-bleed; no particles elsewhere.
- [ ] `frontend-design` review: the hero blends with the existing dark-first theme/tokens.
- [ ] `pnpm check` green.
