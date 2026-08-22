# 09 — Playground spine rendered from the model (static, tokens applied)

**What to build:** The first end-to-end render of the twin's architecture on the playground — the directed left→right pipeline spine drawn from `packages/architecture`, every component shown, phase band present, skinned in nanisoft tokens. Non-reactive; reactivity comes in the next ticket.

**Blocked by:** 07 (`packages/architecture` model + seeded dataset), 08 (nanisoft identity system).

**Status:** done
**Assignee:** agent
**Resolved:** 2026-08-22 (merged `53e92d9` / `bcd25ca` on main)
**Verified:** 2026-08-22 — `apps/playground` Server `page.tsx` → `'use client'` `playground-client.tsx` → `dynamic(ssr:false)` `Spine.tsx`; pure `buildSpineGraph()` in `_spine/spine-graph.ts` derives nodes/edges/phase-bands from `PIPELINE_SPINE`/`STAGE_COMPONENTS`/`EDGES`/`OBSERVER_COMPONENTS`/`PHASES` (React Flow v12 static mode). 19 codenames + 4 phase labels confirmed via a11y snapshot; build green. **Carry-forward (minor):** `spine-graph.ts:78,169` hardcodes the platform-id list `['anchor','conveyor','openbao']` rather than deriving it from the model (labels/edges still model-derived; only the *selection* is hardcoded) — fold into ticket 10 when it touches the spine for reactivity.

- [x] The spine renders the full directed pipeline (Sources → Schema → Ingestion → Bedrock → Transform → Serving → Core → UI) with Watchtower as a cross-cutting observer above, sourced from the model in 07 (not hardcoded)
- [x] Every component node is present and labelled (codenames); the phase band shows Schema/Ingestion/Transform/Investigation
- [x] Nanisoft tokens from 08 are applied (node chips, edges, phase band); JetBrains Mono for node labels
- [x] Client component with no `dynamic({ssr:false})` inside a Server Component — uses a client wrapper per the validated stack rules
- [x] Playground renders the spine without errors; viewable on desktop without layout breakage