# 17 — Flagship playbook end-to-end verification

**What to build:** The full guided Sensitive Product View Audit demonstrably works across all six tools — the teaching spine's three-read-lens (Trino=row / Compass=edges / Superset=chart) and three-write-surface (DataGerry=author / Airflow=ingest / Atlas=govern) contrast is visible, and the twin is queryable and visualizable end to end.

**Blocked by:** 11 (Tool-overlay framework + DataGerry), 12 (Airflow), 13 (Trino), 14 (Atlas+OPA), 15 (Compass), 16 (Superset).

**Status:** ready-for-agent — partially pre-proven (2026-08-23 audit): criterion 3 is already demonstrated by green unit tests (overlay derivations asserted across the full 22-step run; architecture 122/122). Remaining: criterion 4 needs a ~10-line unit test roundtripping a *complete* 22-step run (existing coverage only exercises a fake 2-step playbook); criteria 1/2/5 need committed browser-level specs — **no Playwright setup exists in the tree** (earlier no-vision runs were ad-hoc/uncommitted), so this close-out bootstraps Playwright + committed e2e specs and fixes whatever they catch.

- [ ] A complete auto-run of the 22-step flagship advances the spine through all six tools without errors, ending stopped at step 22
- [ ] Single-step mode exposes each tool's one canonical action; performing each mutates/reads the same state auto-run does (one code path holds across all six)
- [x] The three read lenses show the same finding (`j.harper / P-1042`) differently; the three write surfaces each write their target (SchemaRegistry / Bronze / audit_log) — proven by existing green unit tests (122/122)
- [ ] export → reset → import roundtrips a complete run preserving the finding
- [ ] An inspector shows the lakehouse state evolve across the full run