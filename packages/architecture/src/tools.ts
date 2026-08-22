/**
 * The six full-UI mock-tool specs + their canonical actions (SPEC §4.8).
 *
 * Interaction posture is hybrid: auto-run performs each step programmatically;
 * single-step exposes each tool's *one canonical action*, mutating state the
 * same way. Fidelity is "structured echo" — the real tool's information shape
 * rendered in nanisoft tokens, with a "mocked" badge — not a literal clone.
 *
 * The six tools, in pipeline order:
 *   1. Blueprint  (DataGerry)   — schema authoring   (Phase 1)
 *   2. Trailhead (Airflow)      — orchestration       (Phase 2/3)
 *   3. Overlook  (Trino)        — query               (Phase 4)
 *   4. Atlas + OPA              — authz + traversal API (Phase 4, hub)
 *   5. Compass                   — traversal UI        (Phase 4, climax)
 *   6. Superset                  — dashboard           (sandbox)
 */

import type { PhaseId } from './types';

export interface MockTool {
  /** Component id this overlay is attached to. */
  component: string;
  codename: string;
  /** Real off-the-shelf product echoed (null for the in-house Atlas/Compass). */
  realName: string | null;
  phase: PhaseId | null;
  /** The single honest act a single-stepping learner performs. */
  canonicalAction: string;
  /** What the overlay shows (its information structure, in nanisoft tokens). */
  shows: string;
  /** State this tool reads. */
  reads: string[];
  /** State this tool writes. */
  writes: string[];
  /** Fidelity / what-is-hidden note. */
  fidelity: string;
}

export const MOCK_TOOLS: MockTool[] = [
  {
    component: 'blueprint',
    codename: 'Blueprint',
    realName: 'DataGerry',
    phase: 'schema',
    canonicalAction:
      'Add the `Sensitive: bool` field to the `Product` ObjectType — the definitional hinge ("sensitive" is authored before data flows).',
    shows:
      'Schema/type editor: left list of ObjectTypes (Product), right pane fields (id, name, owner_group, + Sensitive added jade). Sync-status line animates Bridge → Bedrock (ext_product created) → Atlas (SchemaRegistry refreshed).',
    reads: [],
    writes: ['SchemaRegistry[Product].fields += {Sensitive: bool}', 'Bridge writes ext_product table schema'],
    fidelity:
      'Minimal — one ObjectType, ~4 fields, only Sensitive interactive. DataGerry’s Section/Relation/Granularity richness is hidden.',
  },
  {
    component: 'trailhead',
    codename: 'Trailhead',
    realName: 'Airflow',
    phase: 'ingestion',
    canonicalAction:
      'Trigger the ingestion DAG ("run this DAG") → Airbyte → Source → Bronze.',
    shows:
      'DAG graph + per-task run-state + trigger. Ingestion DAG: extract_AD / extract_Workday / extract_SQLFleet → load_Bronze, pending → running (jade) → success (teal), one-line run log. Phase 3 (auto-run only): a second smaller DAG (Forge → Silver → Gold) animates as orchestrated.',
    reads: [],
    writes: ['bronze.products', 'bronze.view_logs'],
    fidelity:
      'Minimal — one ingestion DAG, ~3 tasks; transform DAG passive. Scheduler/variables/connections/retries/SLA/Gantt hidden.',
  },
  {
    component: 'overlook',
    codename: 'Overlook',
    realName: 'Trino',
    phase: 'investigation',
    canonicalAction:
      'Run the seeded SQL query (SQL pre-written, Atlas-seeded — header "Query seeded by Atlas: Sensitive Product View Audit"; the user runs, does not author SQL).',
    shows:
      'SQL console — editor + run button + results table; the anomalous row (j.harper / P-1042 / viewed / no-backing) highlighted. The finding as a table row.',
    reads: ['Gold graph_nodes', 'Gold graph_edges'],
    writes: [],
    fidelity:
      'Minimal — one seeded, pre-written query; results table with the anomalous row. Catalog/RBAC/federation/history/EXPLAIN hidden.',
  },
  {
    component: 'atlas',
    codename: 'Atlas',
    realName: null,
    phase: 'investigation',
    canonicalAction:
      'Evaluate the authz decision (OPA card: user=analyst, use-case=Sensitive Product View Audit → ALLOW) → Atlas writes the audit-log entry. Teaches the twin is governed.',
    shows:
      'One overlay, two zones — OPA decision card (input → ALLOW + read-only ~3-line Rego snippet, focal interactive); Atlas request/response log (GET use-cases/.../steps → 200, POST /authz/check → 200 {allow:true}, POST /audit/log → 201, GET /traversal/query → 200 [finding], context, non-interactive).',
    reads: ['SchemaRegistry'],
    writes: ['audit_log'],
    fidelity:
      'Minimal — one authz decision, ~3-line Rego snippet, ~4-call log. Confidence/trust state machine, temporal-ledger internals, Celery, full FastAPI surface, OPA bundle management hidden. The traversal result stays a hand-off to Compass (not Atlas’s action).',
  },
  {
    component: 'compass',
    codename: 'Compass',
    realName: null,
    phase: 'investigation',
    canonicalAction:
      'Drill into a node — click `j.harper` → "viewed P-1042 (sensitive: true), no backing group membership"; click `P-1042` → "sensitive: true, Payroll-NG." Graph exploration is Compass’s differentiated value.',
    shows:
      'Traversal graph showing the finding as edges: jade anomalous `viewed` edge, dashed missing `memberof` gap, teal backed access + narrative steps. Climax auto-opens at the finding step. Drill-into-node detail panel.',
    reads: ['Atlas traversal response (path + narrative)'],
    writes: [],
    fidelity:
      'Most faithful of the six (Compass is the product’s own value; the structured-echo rule does not apply). Traversal highlight + path + drill-into-node detail. Node-within-node containment deferred (build carry-forward).',
  },
  {
    component: 'superset',
    codename: 'Superset',
    realName: 'Apache Superset',
    phase: 'investigation',
    canonicalAction:
      'Apply a filter / drill-down (toggle "sensitive only", or click a bar to drill a source system) → re-queries Gold → dashboard re-renders.',
    shows:
      'Dashboard grid + filter bar — (1) bar: products by exposure count, (2) table: users with anomalous views (j.harper flagged), (3) donut: views by source system. A "query path: Superset → Trino → Gold" label notes real routing; the mock reads in-browser Gold directly (client-side) — no real query engine wired.',
    reads: ['Gold (deriving exposure client-side: viewed edge with no memberof backing = exposed)'],
    writes: [],
    fidelity:
      'Minimal — 2–3 charts, one filter interaction, pre-built (no chart-builder). SQL Lab/dataset editor/row-level security/alerting/cache hidden. Off the flagship path (sandbox-only; reached by clicking the Superset node, no guided step).',
  },
];

/** Lookup by component id. */
export const MOCK_TOOL_BY_COMPONENT: Record<string, MockTool> = Object.fromEntries(
  MOCK_TOOLS.map((t) => [t.component, t]),
);