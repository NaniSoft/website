# 07 — `packages/architecture` model + seeded dataset

**What to build:** The one source of truth for the digital-twin architecture — the component/phase/edge model (de-branded from `resources/`, codenames kept) plus the seeded dataset that carries the planted anomaly — consumable by both the landing's architecture section and the playground.

**Blocked by:** 06 (Monorepo scaffold + relocate landing).

**Status:** done

- [x] Exports the components (Atlas, Compass, Trailhead, Forge, Bedrock, Overlook, Blueprint, Watchtower, Anchor, Conveyor + the off-the-shelf nodes), the 4 phases (Schema → Ingestion → Transform → Investigation), and the directed pipeline-spine edges (Sources → Schema → Ingestion → Bedrock → Transform → Serving → Core → UI, Watchtower observer) — seeded from `resources/` with "TrueAccess" retired
- [x] Exports the seeded dataset: 2 products, 4 users, 2 groups, 2 view-logs, with the planted anomaly (j.harper has `viewed → P-1042` but no `memberof`; m.okafor + a.chen both have `memberof → G-SR`; P-1042 = Payroll-NG, `sensitive: true`)
- [x] Exports the mock-tool specs (the six full-UI tools + their canonical actions)
- [x] Unit tests assert the seed produces the teaching state: Gold 5 nodes / 4 edges, anomaly present, SchemaRegistry `Product/Sensitive:bool`
- [x] Both apps can import the model types/values without build errors