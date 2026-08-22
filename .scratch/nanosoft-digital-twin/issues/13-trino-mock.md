# 13 — Trino / Overlook mock

**What to build:** The query mock that surfaces the finding as a table row — run the Atlas-seeded SQL (read-only) and see the anomalous row highlighted.

**Blocked by:** 11 (Tool-overlay framework + DataGerry mock).

**Status:** done — merged to main (`77b217a`, fast-forward; verified 2026-08-22)

- [x] SQL console: editor (pre-written, seeded by Atlas — header "Query seeded by Atlas: Sensitive Product View Audit") + run button + results table
- [x] Canonical action: run the seeded SQL query (the user runs it; does not author SQL)
- [x] Results table shows the anomalous row (`j.harper / P-1042 / viewed / no-backing`) highlighted; the finding as a table row
- [x] Reads Gold (`graph_nodes`/`graph_edges`); writes nothing — pure read surface
- [x] Reuses the overlay chrome + one-code-path pattern from 11