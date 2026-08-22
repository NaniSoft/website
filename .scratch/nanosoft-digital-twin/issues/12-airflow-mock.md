# 12 — Airflow / Trailhead mock

**What to build:** The orchestration mock — trigger the ingestion DAG and watch Bronze fill. Pipeline phase-2 trigger plus the passive phase-3 transform DAG.

**Blocked by:** 11 (Tool-overlay framework + DataGerry mock).

**Status:** done — merged to main (merge `d347840`, 2026-08-22). 86/86 tests green. Presentation = split-pane (reused from 11, SPEC §6).

- [x] Ingestion DAG shown: `extract_AD / extract_Workday / extract_SQLFleet → load_Bronze`, with per-task run-state pending → running (jade) → success (teal) + a one-line run log + a trigger control
- [x] Canonical action: trigger the ingestion DAG ("run this DAG") → Airbyte → Source → Bronze
- [x] Writes Bronze (`bronze.products`, `bronze.view_logs`); reads none (DAG config static)
- [x] Phase-3 transform DAG (`Forge → Silver → Gold`) animates as orchestrated in auto-run only (not a separate action)
- [x] Reuses the overlay chrome + one-code-path pattern from 11; same mutate whether auto-run or single-step