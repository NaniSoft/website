/**
 * The mocked-tool overlay chrome — pure, framework-agnostic (SPEC §4.8).
 *
 * `overlayReducer` is the open/close state for the uniform overlay shell; the
 * Zustand store in apps/playground wraps it. `beckonToolId` derives which
 * full-UI node should ripple (the active step's `openTool`). `dataGerrySyncStatus`
 * drives the DataGerry sync-status line. None of this imports React/Next/Zustand.
 */
import type { PlaybookStep, PlaygroundState } from './playground-state';
import type { Finding, GoldNode } from './dataset';

/** Which tool overlay is open, plus the cursor at open time (so a tool knows
 *  whether its canonical action is still live or already done). null = closed. */
export type OverlayState = { componentId: string; openedAtCursor: number } | null;

export type OverlayAction =
  | { type: 'open'; componentId: string; cursor: number }
  | { type: 'close' }
  | { type: 'reset' };

export function overlayReducer(state: OverlayState, action: OverlayAction): OverlayState {
  switch (action.type) {
    case 'open':
      return { componentId: action.componentId, openedAtCursor: action.cursor };
    case 'close':
    case 'reset':
      return null;
  }
}

/**
 * The component id whose full-UI overlay should beckon (ripple) at this cursor —
 * the active step's `openTool`, or null. SPEC §4.8: auto-run = beckon (the active
 * tool's node pulses to invite a click; overlays do NOT auto-open mid-run).
 */
export function beckonToolId(steps: readonly PlaybookStep[], cursor: number): string | null {
  if (cursor <= 0 || cursor >= steps.length) return null;
  return steps[cursor - 1].openTool ?? null;
}

export interface DataGerrySyncStatus {
  authored: boolean;
  bedrock: boolean;
  atlas: boolean;
}

/**
 * DataGerry sync-status line (SPEC §4.8): Bridge → Bedrock (ext_product) → Atlas
 * (SchemaRegistry). `authored`/`bedrock` are state-derived (steps 1/3 write);
 * `atlas` is cursor-derived (Atlas acks the cache refresh at step 4 — the
 * registry already IS Atlas's cache, so no separate state slot).
 */
export function dataGerrySyncStatus(state: PlaygroundState, cursor: number): DataGerrySyncStatus {
  const authored = !!state.schemaRegistry.Product?.fields.some((f) => f.name === 'Sensitive');
  const bedrock = state.bridgedTables.includes('ext_product');
  const atlas = cursor >= 4;
  return { authored, bedrock, atlas };
}

// ── Airflow / Trailhead DAG run-state (SPEC §4.8) ─────────────────────────────

export type AirflowTaskState = 'pending' | 'running' | 'success';

export interface AirflowTask {
  id: string;
  /** Airflow-shaped task label, e.g. `extract_SQLFleet`, `load_Bronze`. */
  label: string;
  /** The playbook step number (step.n) this task maps to. */
  stepN: number;
  state: AirflowTaskState;
}

export interface AirflowDag {
  id: 'ingestion' | 'transform';
  title: string;
  tasks: AirflowTask[];
  /** [from, to] task-id edges (the DAG shape). */
  edges: [string, string][];
}

export interface AirflowRunLogLine {
  dagId: 'ingestion' | 'transform';
  run: number;
  status: 'running' | 'success';
  text: string;
}

export interface AirflowDagStatus {
  ingestion: AirflowDag;
  transform: AirflowDag;
  /** Up to 2 lines (ingestion, then transform), each appearing as its DAG starts. */
  runLog: AirflowRunLogLine[];
  /** Trigger enabled only at the load_Bronze beckon cursor, Bronze not yet loaded. */
  canTrigger: boolean;
  /** The ingestion DAG has been run (Bronze populated). */
  triggered: boolean;
}

/** Ingestion DAG tasks: 3 parallel extracts feeding one load (SPEC §4.8). */
const INGESTION_DEFS = [
  { id: 'extract_sqlfleet', label: 'extract_SQLFleet', stepN: 5 },
  { id: 'extract_ad', label: 'extract_AD', stepN: 6 },
  { id: 'extract_workday', label: 'extract_Workday', stepN: 6 },
  { id: 'load_bronze', label: 'load_Bronze', stepN: 7 },
] as const;
const INGESTION_EDGES: [string, string][] = [
  ['extract_sqlfleet', 'load_bronze'],
  ['extract_ad', 'load_bronze'],
  ['extract_workday', 'load_bronze'],
];

/** Transform DAG tasks: linear Forge → Silver → Gold (passive, phase 3). */
const TRANSFORM_DEFS = [
  { id: 'forge', label: 'Forge', stepN: 8 },
  { id: 'silver', label: 'Silver', stepN: 9 },
  { id: 'gold', label: 'Gold', stepN: 10 },
] as const;
const TRANSFORM_EDGES: [string, string][] = [
  ['forge', 'silver'],
  ['silver', 'gold'],
];

/**
 * Per-task run-state from the cursor: `running` = the active step
 * (cursor === stepN, matching the spine's jade active node); `success` =
 * cursor > stepN; else `pending`. `extract_AD` + `extract_Workday` both map to
 * step 6 → they run in parallel. `load_Bronze` shows running at cursor 7 and
 * success at cursor 8 (a 1-step offset after Bronze lands — "task running, data
 * landing"), matching the spine's active/done cadence.
 */
function taskStateFor(stepN: number, cursor: number): AirflowTaskState {
  if (cursor > stepN) return 'success';
  if (cursor === stepN) return 'running';
  return 'pending';
}

/**
 * The Airflow DAG run-state — a pure derivation from `(state, cursor)`
 * (SPEC §4.8), mirroring `dataGerrySyncStatus`. Drives both the ingestion DAG
 * (4 tasks + trigger) and the passive transform DAG (3 tasks). The run log
 * gains one line per DAG run as it starts. No persisted DAG state — it is a
 * pure function of the cursor (the trigger flags are `cursor === 6` and
 * `bronze.products.length > 0`).
 */
export function airflowDagStatus(state: PlaygroundState, cursor: number): AirflowDagStatus {
  const bronzePopulated = state.bronze.products.length > 0;

  const ingestion: AirflowDag = {
    id: 'ingestion',
    title: 'Ingestion DAG',
    tasks: INGESTION_DEFS.map((d) => ({ ...d, state: taskStateFor(d.stepN, cursor) })),
    edges: INGESTION_EDGES,
  };
  const transform: AirflowDag = {
    id: 'transform',
    title: 'Transform DAG',
    tasks: TRANSFORM_DEFS.map((d) => ({ ...d, state: taskStateFor(d.stepN, cursor) })),
    edges: TRANSFORM_EDGES,
  };

  const runLog: AirflowRunLogLine[] = [];
  if (cursor >= 5) {
    const success = cursor >= 8; // load_Bronze success at cursor > 7
    runLog.push({
      dagId: 'ingestion',
      run: 1,
      status: success ? 'success' : 'running',
      text: success
        ? `DAG run #1 · ingestion · success · loaded ${state.bronze.products.length} products · ${state.bronze.viewLogs.length} view-logs`
        : 'DAG run #1 · ingestion · running · 4 tasks',
    });
  }
  if (cursor >= 8) {
    const success = cursor >= 11; // gold success at cursor > 10
    runLog.push({
      dagId: 'transform',
      run: 2,
      status: success ? 'success' : 'running',
      text: success
        ? `DAG run #2 · transform · success · Gold ${state.gold.nodes.length} nodes / ${state.gold.edges.length} edges`
        : 'DAG run #2 · transform · running · 3 tasks',
    });
  }

  return {
    ingestion,
    transform,
    runLog,
    // Step 7 (load_Bronze) is index 6 in STEPS; at cursor 6 it is the next step
    // to apply, so store.step() runs loadBronze. Bronze must not be loaded yet.
    canTrigger: cursor === 6 && !bronzePopulated,
    triggered: bronzePopulated,
  };
}

// ── Trino / Overlook query surface (SPEC §4.8) ────────────────────────────────

/**
 * The Atlas-seeded SQL (SPEC §4.8) — pre-written; the user *runs* it, does not
 * author it. The header line is the provenance ("Query seeded by Atlas:
 * Sensitive Product View Audit"). The query joins `viewed` edges to product
 * nodes and checks for a backing `memberof` edge to the product's owner group.
 */
export const TRINO_SEEDED_SQL = `-- Query seeded by Atlas: Sensitive Product View Audit
SELECT v.user, v.product, p.label AS product_name,
       p.sensitive, p.owner_group,
       CASE WHEN EXISTS (SELECT 1 FROM graph_edges m
                        WHERE m.from = v.user AND m.to = p.owner_group
                          AND m.kind = 'memberof')
            THEN 'memberof' ELSE 'no-backing' END AS backing
FROM graph_edges v
JOIN graph_nodes p ON p.id = v.product AND p.kind = 'product'
WHERE v.kind = 'viewed';`;

export interface TrinoResultRow {
  user: string;
  userName: string;
  product: string;
  productName: string;
  sensitive: boolean;
  ownerGroup: string;
  backing: 'memberof' | 'no-backing';
  anomalous: boolean;
  edgeId: string;
}

export interface TrinoResults {
  sql: string;
  rows: TrinoResultRow[];
  /** The seeded query has been run (step 16 applied). */
  queryRun: boolean;
  /** The "Run query" button is enabled (step 16 is the next step to apply). */
  canRun: boolean;
}

/**
 * The Trino/Overlook query results — a pure derivation from `(state, cursor)`
 * (SPEC §4.8), mirroring `dataGerrySyncStatus` / `airflowDagStatus`. Reads only
 * `state.gold` (the query is over the Gold graph); writes nothing.
 *
 * `canRun = cursor === 15` (step 16 — `STEPS[15]` — is the next step to apply,
 * mirroring Airflow's `cursor === 6` for step 7). `queryRun = cursor >= 16`
 * (step 16 applied). Rows populate only after the query is run.
 *
 * Anomaly rule (SPEC §4.8/§4.9): once step 17 has flagged `edge.status`, prefer
 * the explicit flag (`'anomalous'` / `'ok'`); before that, derive — a `viewed`
 * edge is anomalous when the viewed product is `sensitive` AND the viewer has
 * no `memberof` edge to the product's `ownerGroup` (exactly `detectAnomalies`'s
 * rule, recomputed here from Gold so the finding shows at the read step).
 */
export function trinoResults(state: PlaygroundState, cursor: number): TrinoResults {
  // Step 16 (Overlook reads Gold) is index 15 in STEPS; at cursor 15 it is the
  // next step to apply, so store.step() runs the read. Mirrors `airflowDagStatus`.
  const canRun = cursor === 15;
  const queryRun = cursor >= 16;

  const rows: TrinoResultRow[] = [];
  if (queryRun) {
    const nodes = new Map(state.gold.nodes.map((n) => [n.id, n]));
    const membersByUser = new Map<string, Set<string>>();
    for (const e of state.gold.edges) {
      if (e.kind !== 'memberof') continue;
      if (!membersByUser.has(e.from)) membersByUser.set(e.from, new Set());
      membersByUser.get(e.from)!.add(e.to);
    }
    for (const e of state.gold.edges) {
      if (e.kind !== 'viewed') continue;
      const productNode = nodes.get(e.to);
      if (!productNode || productNode.kind !== 'product') continue;
      const userNode = nodes.get(e.from);
      const ownerGroup = productNode.ownerGroup ?? '';
      const groups = membersByUser.get(e.from) ?? new Set<string>();
      const hasBacking = groups.has(ownerGroup);
      let anomalous: boolean;
      if (e.status === 'anomalous') anomalous = true;
      else if (e.status === 'ok') anomalous = false;
      else anomalous = !!productNode.sensitive && !hasBacking;
      rows.push({
        user: e.from,
        userName: userNode?.label ?? e.from,
        product: e.to,
        productName: productNode.label,
        sensitive: !!productNode.sensitive,
        ownerGroup,
        backing: hasBacking ? 'memberof' : 'no-backing',
        anomalous,
        edgeId: e.id,
      });
    }
  }

  return { sql: TRINO_SEEDED_SQL, rows, queryRun, canRun };
}

// ── Atlas + OPA authz-and-audit (SPEC §4.8) ────────────────────────────────────

export interface AtlasLogLine {
  method: 'GET' | 'POST';
  path: string;
  status: number;
  /** Optional response body snippet, e.g. `{allow:true}` or `[finding]`. */
  body?: string;
}

export interface AtlasOpaStatus {
  /** OPA decision — true once OPA returns allow (cursor ≥ 13). False = pending. */
  allow: boolean;
  /** Static read-only Rego snippet (the policy OPA evaluates). */
  rego: string;
  /** The Atlas request/response log, cursor-derived (up to 4 lines). */
  log: AtlasLogLine[];
}

/** The static ~3-line Rego policy OPA evaluates (SPEC §4.8). Read-only in the card. */
export const ATLAS_REGO =
  'package nanisoft.authz\n' +
  'allow if {\n' +
  '  input.user == "analyst"\n' +
  '  input.use_case == "sensitive-product-view-audit"\n' +
  '}';

/**
 * The Atlas + OPA authz-and-audit status — a pure derivation from `(state,
 * cursor)` (SPEC §4.8), mirroring `dataGerrySyncStatus` / `airflowDagStatus`.
 *
 * OPA is stateless (reads the static `ATLAS_REGO` policy, writes nothing); the
 * audit write is Atlas's (step 14's `apply`, already in `auditLog`). The decision
 * and the request log are pure functions of the cursor:
 *  - `GET use-cases/.../steps → 200`        at cursor ≥ 11 (Compass asks Atlas, step 11)
 *  - `POST /authz/check → 200 {allow:true}` at cursor ≥ 13 (OPA returns allow, step 13)
 *  - `POST /audit/log → 201`               at cursor ≥ 14 (Atlas writes the audit entry, step 14)
 *  - `GET /traversal/query → 200 [finding]` at cursor ≥ 18 (Atlas serves the traversal,
 *    step 18 — a log line only; the finding traversal is Compass's climax).
 * `allow = cursor >= 13`. The traversal result is never visualized here.
 */
export function atlasOpaStatus(state: PlaygroundState, cursor: number): AtlasOpaStatus {
  const log: AtlasLogLine[] = [];
  if (cursor >= 11) {
    log.push({ method: 'GET', path: '/use-cases/sensitive-product-view-audit/steps', status: 200 });
  }
  if (cursor >= 13) {
    log.push({ method: 'POST', path: '/authz/check', status: 200, body: '{allow:true}' });
  }
  if (cursor >= 14) {
    log.push({ method: 'POST', path: '/audit/log', status: 201 });
  }
  if (cursor >= 18) {
    log.push({ method: 'GET', path: '/traversal/query', status: 200, body: '[finding]' });
  }
  return { allow: cursor >= 13, rego: ATLAS_REGO, log };
}

// ── Compass traversal graph (SPEC §4.8 — the climax) ──────────────────────────

/** The playbook step number of the finding/climax step (step 19, `final: true`). */
const COMPASS_CLIMAX_STEP = 19;

export type CompassNodeKind = 'user' | 'product' | 'group';

export interface CompassNode {
  id: string;
  kind: CompassNodeKind;
  label: string;
  /** Present on product nodes only. */
  sensitive?: boolean;
  /** Present on product nodes only — the backing owner group. */
  ownerGroup?: string;
}

export type CompassEdgeStatus = 'anomalous' | 'ok' | 'backed' | 'pending' | 'gap';

export interface CompassEdge {
  id: string;
  from: string;
  to: string;
  kind: 'viewed' | 'memberof';
  /** Display class derived from the Gold edge `status` + the `missing` flag. */
  status: CompassEdgeStatus;
  /** True for the synthesized missing-memberof gap (no Gold edge backs it). */
  missing: boolean;
}

export interface CompassNarrativeStep {
  n: number;
  text: string;
}

export interface CompassTraversal {
  /** True once the finding is set AND the cursor is at/after the climax step. */
  ready: boolean;
  /** A pre-climax status line (rendered before the traversal is ready). */
  status: string;
  nodes: CompassNode[];
  edges: CompassEdge[];
  /** 3 narrative lines, populated when ready. */
  narrative: CompassNarrativeStep[];
  /** Per-node drill-into detail text, populated when ready. */
  details: Record<string, string>;
  /** The structured finding, once set (null before step 17). */
  finding: Finding | null;
}

function compassNodeFrom(g: GoldNode): CompassNode {
  return {
    id: g.id,
    kind: g.kind,
    label: g.label,
    ...(g.sensitive !== undefined ? { sensitive: g.sensitive } : {}),
    ...(g.ownerGroup !== undefined ? { ownerGroup: g.ownerGroup } : {}),
  };
}

/** Map a Gold edge's (status, kind, missing) to a Compass display class. */
function edgeStatusFor(
  kind: 'viewed' | 'memberof',
  status: 'anomalous' | 'ok' | null,
  missing: boolean,
): CompassEdgeStatus {
  if (missing) return 'gap';
  if (kind === 'viewed') {
    if (status === 'anomalous') return 'anomalous';
    if (status === 'ok') return 'ok';
    return 'pending';
  }
  // memberof edges have no `status` (null) — they are the backing access.
  return 'backed';
}

/**
 * The Compass traversal graph — a pure derivation from `(state, cursor)`
 * (SPEC §4.8), mirroring `airflowDagStatus`/`dataGerrySyncStatus`. Shows the
 * finding **as edges**: the anomalous `viewed` edge (jade), the synthesized
 * missing `memberof` gap (dashed), and the backed access (teal). `ready` gates
 * the climax render (cursor >= 19, the finding step); before that the overlay
 * shows the raw Gold graph shape with a status line. The narrative + per-node
 * drill-into `details` are populated only when ready. The selected-node state
 * is UI-local (overlay), NOT part of this derivation — Compass writes nothing.
 */
export function compassTraversal(state: PlaygroundState, cursor: number): CompassTraversal {
  const finding = state.finding;
  const ready = finding !== null && cursor >= COMPASS_CLIMAX_STEP;

  const nodes = state.gold.nodes.map(compassNodeFrom);

  const edges: CompassEdge[] = state.gold.edges.map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    kind: e.kind,
    status: edgeStatusFor(e.kind, e.status, false),
    missing: false,
  }));

  // Synthesize the missing memberof gap from the finding (SPEC §4.6/§4.8).
  if (finding && finding.missingMembership) {
    const gapId = `e:missing:${finding.user}:${finding.ownerGroup}`;
    if (!edges.some((e) => e.id === gapId)) {
      edges.push({
        id: gapId,
        from: finding.user,
        to: finding.ownerGroup,
        kind: 'memberof',
        status: 'gap',
        missing: true,
      });
    }
  }

  let status = '';
  if (finding === null) {
    status = 'Querying Atlas for the traversal path…';
  } else if (!ready) {
    status = 'Atlas returned the highlighted path — rendering traversal…';
  }

  let narrative: CompassNarrativeStep[] = [];
  let details: Record<string, string> = {};
  if (ready && finding) {
    const userLabel = state.users.find((u) => u.id === finding.user)?.displayName ?? finding.user;
    const group = state.groups.find((g) => g.id === finding.ownerGroup);
    const groupLabel = group?.name ?? finding.ownerGroup;
    const backed = state.groupMemberships
      .map((m) => m.user)
      .filter((u) => u !== finding.user);
    const backedLabels = backed.map((u) => state.users.find((x) => x.id === u)?.id ?? u);

    narrative = [
      { n: 1, text: `${finding.user} viewed ${finding.product} (${finding.productName}) — sensitive: ${finding.sensitive}` },
      { n: 2, text: `${finding.user} has no memberof edge to ${finding.ownerGroup} (${groupLabel}) — the backing group for ${finding.product}` },
      { n: 3, text: `${backedLabels.join(' and ')} both hold memberof → ${finding.ownerGroup} — backed access` },
    ];

    details = {
      [finding.user]: `viewed ${finding.product} (sensitive: ${finding.sensitive}), no backing group membership`,
      [finding.product]: `sensitive: ${finding.sensitive}, ${finding.productName}`,
      [finding.ownerGroup]: `${groupLabel} — owner group of ${finding.product} (${finding.productName})`,
    };
    // Backed users: distinguish a viewer with backing (m.okafor) from a member
    // with no view (a.chen). A backed viewer of the sensitive product → "ok";
    // a backed member who did not view → "backed access".
    const viewers = new Set(
      state.viewLogs.filter((v) => v.product === finding.product).map((v) => v.user),
    );
    for (const u of backed) {
      details[u] = viewers.has(u)
        ? `viewed ${finding.product} — backing membership ${finding.ownerGroup} present (ok)`
        : `memberof ${finding.ownerGroup} — backed access`;
    }
    // Any remaining nodes (e.g. a group with no detail yet) keep a generic line.
    for (const n of nodes) {
      if (!(n.id in details)) {
        if (n.kind === 'group') details[n.id] = `${n.label}`;
        else details[n.id] = `${n.label}`;
      }
    }
    void userLabel;
  }

  return { ready, status, nodes, edges, narrative, details, finding };
}

// ── Superset dashboard (SPEC §4.8 — sandbox-only read lens) ────────────────────

export type SupersetSourceSystem = 'SQL Server Fleet' | 'Active Directory';

export interface SupersetExposureRow {
  productId: string;
  productName: string;
  sensitive: boolean;
  /** Unbacked viewed edges to this product (exposure = viewed with no memberof backing). */
  exposureCount: number;
  /** Total viewed edges to this product. */
  viewCount: number;
}

export interface SupersetAnomalousUserRow {
  user: string;
  userLabel: string;
  productId: string;
  productName: string;
  /** The anomalous viewed edge. */
  edgeId: string;
  ownerGroup: string;
}

export interface SupersetSourceRow {
  sourceSystem: SupersetSourceSystem;
  edgeKind: 'viewed' | 'memberof';
  count: number;
}

export interface SupersetDashboard {
  /** Bar — products by exposure count (all products, unfiltered). */
  products: SupersetExposureRow[];
  /** Table — users with anomalous views (sensitive + unbacked). */
  anomalousUsers: SupersetAnomalousUserRow[];
  /** Donut — views by source system (Gold edges by contributing source). */
  sources: SupersetSourceRow[];
}

/**
 * The Superset dashboard datasets — a pure derivation from Gold (SPEC §4.8/§4.9),
 * mirroring `dataGerrySyncStatus`/`airflowDagStatus`. Superset is a sandbox-only
 * read lens: it writes nothing; its canonical action (filter / drill-down) is
 * UI-local in the overlay, NOT a lakehouse mutate (the deliberate exception to
 * the one-code-path pattern). The `cursor` parameter is unused — the derivation
 * is of Gold only — so the dashboard is explorable from the seed before the
 * flagship finding runs.
 *
 * Exposure = a `viewed` edge where the viewer has no `memberof` edge to the
 * viewed product's `ownerGroup` (SPEC §4.8: "viewed edge with no memberof backing
 * = exposed"). An anomalous view (the table) = an exposure on a sensitive product
 * (matching `detectAnomalies`). The exposure is derived here from scratch — it
 * does NOT read `state.finding` or `state.gold.edges[*].status`, so it surfaces
 * the exposure before the flagship finding step (17) marks the edges.
 *
 * The donut's "views by source system" renders the Gold graph's edges by their
 * feeding source system: `viewed` edges → SQL Server Fleet (the access logs),
 * `memberof` edges → Active Directory (the group memberships) — the only
 * multi-category source breakdown the minimal seed supports.
 */
export function supersetDashboard(state: PlaygroundState, _cursor: number): SupersetDashboard {
  const membersOf = new Map<string, Set<string>>();
  for (const m of state.groupMemberships) {
    if (!membersOf.has(m.user)) membersOf.set(m.user, new Set());
    membersOf.get(m.user)!.add(m.group);
  }
  const products = new Map(state.products.map((p) => [p.id, p]));
  const users = new Map(state.users.map((u) => [u.id, u]));

  const viewedEdges = state.gold.edges.filter((e) => e.kind === 'viewed');
  const memberofEdges = state.gold.edges.filter((e) => e.kind === 'memberof');

  // Bar — products by exposure count (one row per product in the dimension table).
  const productsMap = new Map<string, SupersetExposureRow>();
  for (const p of state.products) {
    productsMap.set(p.id, {
      productId: p.id,
      productName: p.name,
      sensitive: p.sensitive,
      exposureCount: 0,
      viewCount: 0,
    });
  }
  for (const e of viewedEdges) {
    const row = productsMap.get(e.to);
    if (!row) continue; // a view of a product not in the dimension table — skip
    row.viewCount += 1;
    const product = products.get(e.to);
    const groups = membersOf.get(e.from) ?? new Set<string>();
    if (product?.ownerGroup && !groups.has(product.ownerGroup)) {
      row.exposureCount += 1;
    }
  }
  const productRows = [...productsMap.values()];

  // Table — users with anomalous views (sensitive + unbacked). Derived from
  // scratch (independent of `edge.status`), so it works before step 17.
  const anomalousUsers: SupersetAnomalousUserRow[] = [];
  for (const e of viewedEdges) {
    const product = products.get(e.to);
    if (!product || !product.sensitive) continue;
    const groups = membersOf.get(e.from) ?? new Set<string>();
    if (!groups.has(product.ownerGroup)) {
      anomalousUsers.push({
        user: e.from,
        userLabel: users.get(e.from)?.displayName ?? e.from,
        productId: e.to,
        productName: product.name,
        edgeId: e.id,
        ownerGroup: product.ownerGroup,
      });
    }
  }

  // Donut — views by source system (Gold edges by contributing source).
  const sources: SupersetSourceRow[] = [
    { sourceSystem: 'SQL Server Fleet', edgeKind: 'viewed', count: viewedEdges.length },
    { sourceSystem: 'Active Directory', edgeKind: 'memberof', count: memberofEdges.length },
  ];

  return { products: productRows, anomalousUsers, sources };
}
