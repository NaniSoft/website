# 16 — Superset mock (sandbox-only)

**What to build:** The off-path dashboard mock — a pre-built dashboard over live Gold, reached by clicking the Superset node (no guided step), explorable from the seed before the flagship runs.

**Blocked by:** 11 (Tool-overlay framework + DataGerry mock).

**Status:** done — merged to main (`0a2a27a`; verified 2026-08-22)

- [x] Reached by clicking the Superset node (no guided step in the flagship); off the flagship path
- [x] Dashboard grid + filter bar: (1) bar — products by exposure count, (2) table — users with anomalous views (`j.harper` flagged), (3) donut — views by source system
- [x] Canonical action: apply a filter / drill-down (toggle "sensitive only", or click a bar to drill a source system) → re-queries Gold → dashboard re-renders
- [x] Reads Gold client-side (derives exposure = `viewed` edge with no `memberof` backing = exposed); writes nothing; a "query path: Superset → Trino → Gold" label notes the real routing
- [x] Explorable before the flagship runs, from the seed