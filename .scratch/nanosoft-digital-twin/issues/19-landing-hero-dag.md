# 19 — Landing hero — reactive digital-twin graph DAG

**What to build:** The landing hero — a reactive, mouse-driven directed-acyclic pipeline graph (pure spectacle, no buttons) with the wordmark + positioning line over it; the jade wavefront flowing through the real architecture's DAG.

**Blocked by:** 07 (`packages/architecture` model + seeded dataset), 08 (nanisoft identity system), 18 (Landing shell).

**Status:** done (2026-08-23)

- [x] Hero renders a directed left→right DAG of the real architecture (from the model in 07): orthogonal routing, soft 90° bends + arrowheads, a jade wavefront flowing through; Watchtower as a cross-cutting observer
- [x] Mouse-reactive (live, reacts to pointer) with no buttons — pure spectacle; wordmark + positioning line overlaid
- [x] ~~Built with the validated stack (react-force-graph-2d or @xyflow/react)~~ **Executed as hand-rolled SVG derived from the model — zero new deps** (coordinator-approved departure per work-item-1 latitude: force-graph is canvas force-physics = the forbidden scattered mesh; xyflow's drag/pan/zoom machinery is dead weight in a no-button spectacle; both still need bespoke wavefront/proximity code. Rationale matrix: `docs/superpowers/specs/2026-08-23-landing-hero-dag-design.md`) as a client component (no `dynamic({ssr:false})` in a Server Component — client wrapper)
- [x] Motion uses the four principles from 08; `prefers-reduced-motion` degrades to a static end-state (wavefront settled, content intact)
- [x] Replaces the current KnowledgeGraph hero; the landing renders the new hero at the top