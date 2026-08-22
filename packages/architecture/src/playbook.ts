/**
 * The flagship playbook — Sensitive Product View Audit — mirrored from
 * `resources/TrueAccess_Schema_to_Visualization_Sequence.mermaid` (22 beats →
 * 22 steps). See SPEC §4.7.
 *
 * Each step's `apply` fn mutates a *clone* of the state (the reducer clones
 * before calling it) and reuses the package's existing conform/detect/find
 * functions: step 10 calls `conformToGold`, step 17 calls `getFinding` +
 * `detectAnomalies`. Most steps are narrate-only (`apply: () => {}`) — they light
 * the spine and advance the story; the mutate fn is non-empty only where the
 * lakehouse/registry/audit actually changes.
 *
 * Adaptations from the prototype, per the design spec:
 *  - Forge is the step-10 actor (no separate "Scoring" node in the model);
 *    steps 8/9/10 all use `forge` + edge `forge→bedrock`.
 *  - Both view-logs are on P-1042 (m.okafor's view is `ok`, j.harper's is the
 *    anomaly) — the architecture seed is authoritative over the prototype.
 */
import { conformToGold, detectAnomalies, getFinding } from './dataset';
import { authorSensitiveProductField, loadBronze } from './tool-actions';
import type { PlaybookStep, PlaygroundState } from './playground-state';

const TS = '2026-08-14T09:12:00Z';

export const SENSITIVE_PRODUCT_VIEW_AUDIT: PlaybookStep[] = [
  // ── Phase 1: Schema ───────────────────────────────────────────────────────
  {
    n: 1, phase: 'schema', actor: 'blueprint', edge: ['blueprint', 'bridge'],
    title: 'Author defines ObjectType Product',
    desc: 'A Schema Author opens DataGerry and adds the `Sensitive: bool` field to the drafted Product ObjectType — the definitional hinge, authored before any data flows.',
    apply: (s) => { authorSensitiveProductField(s); },
    openTool: 'blueprint',
  },
  {
    n: 2, phase: 'schema', actor: 'bridge', edge: ['blueprint', 'bridge'],
    title: 'DataGerry emits the type',
    desc: 'DataGerry pushes the new Type/Relation to the DataGerry Bridge.',
    apply: () => {},
  },
  {
    n: 3, phase: 'schema', actor: 'bridge', edge: ['bridge', 'bedrock'],
    title: 'Bridge writes the DDL',
    desc: 'Bridge generates CREATE TABLE ext_product in Bedrock (Bronze shell ready).',
    apply: (s) => { if (!s.bridgedTables.includes('ext_product')) s.bridgedTables.push('ext_product'); },
  },
  {
    n: 4, phase: 'schema', actor: 'bridge', edge: ['bridge', 'atlas'],
    title: 'Atlas refreshes its schema cache',
    desc: 'Bridge refreshes Atlas’s SchemaRegistry cache; Atlas acks.',
    apply: () => {},
  },

  // ── Phase 2: Ingestion ────────────────────────────────────────────────────
  {
    n: 5, phase: 'ingestion', actor: 'airbyte', edge: ['sql-fleet', 'airbyte'],
    title: 'Airbyte extracts product + view-log records',
    desc: 'Airbyte pulls Product rows and view-logs from the SQL Server Fleet source.',
    apply: () => {},
  },
  {
    n: 6, phase: 'ingestion', actor: 'airbyte', edge: ['active-directory', 'airbyte'],
    title: 'Airbyte extracts groups + users',
    desc: 'Airbyte pulls group membership and users from Active Directory (Workday HR for employees).',
    apply: () => {},
  },
  {
    n: 7, phase: 'ingestion', actor: 'airbyte', edge: ['airbyte', 'forge'],
    title: 'Raw rows land in Bronze',
    desc: 'Airbyte lands raw records into Bronze: ext_product (2) + view_logs (2).',
    apply: (s) => { loadBronze(s); },
    openTool: 'trailhead',
  },

  // ── Phase 3: Transform ────────────────────────────────────────────────────
  {
    n: 8, phase: 'transform', actor: 'forge', edge: ['forge', 'bedrock'],
    title: 'Forge reads the cached schema',
    desc: 'Forge reads the current Product schema (cached from the Bridge sync) so it conforms the right columns.',
    apply: () => {},
  },
  {
    n: 9, phase: 'transform', actor: 'forge', edge: ['forge', 'bedrock'],
    title: 'Forge writes conformed Silver',
    desc: 'Forge + dbt write conformed Silver ext_product rows with SCD2 snapshots.',
    apply: (s) => { s.silver = { extProduct: s.products, extViewLog: s.viewLogs }; },
  },
  {
    n: 10, phase: 'transform', actor: 'forge', edge: ['forge', 'bedrock'],
    title: 'Forge writes Gold graph_nodes + graph_edges',
    desc: 'Confidence scoring + dbt write Gold: graph_nodes (Products, Users, Groups) and graph_edges (viewed, memberof).',
    apply: (s) => { s.gold = conformToGold(s); },
  },

  // ── Phase 4: Investigation ────────────────────────────────────────────────
  {
    n: 11, phase: 'investigation', actor: 'compass', edge: ['compass', 'atlas'],
    title: 'Analyst opens Compass, runs the use-case',
    desc: 'A Security Analyst opens Compass and runs Sensitive Product View Audit. Compass asks Atlas for the use-case steps.',
    apply: () => {}, openTool: 'compass',
  },
  {
    n: 12, phase: 'investigation', actor: 'atlas', edge: ['atlas', 'opa'],
    title: 'Atlas asks OPA: can this user run this use-case?',
    desc: 'Atlas consults OPA with the user + use-case. (In the playground OPA is mocked — no real policy engine.)',
    apply: () => {},
  },
  {
    n: 13, phase: 'investigation', actor: 'opa', edge: ['opa', 'atlas'],
    title: 'OPA returns allow',
    desc: 'OPA returns allow. (Mocked Rego evaluation.)',
    apply: () => {},
  },
  {
    n: 14, phase: 'investigation', actor: 'atlas', edge: null,
    title: 'Atlas writes the audit log',
    desc: 'Atlas writes an audit-log entry for the run before executing.',
    apply: (s) => {
      s.auditLog.push({ ts: TS, actor: 'analyst', useCase: 'sensitive-product-view-audit', decision: 'allow', detail: 'OPA allowed Sensitive Product View Audit' });
    },
    openTool: 'atlas',
  },
  {
    n: 15, phase: 'investigation', actor: 'atlas', edge: ['atlas', 'overlook'],
    title: 'Atlas runs the seeded SQL via Overlook',
    desc: 'Atlas asks Overlook to run the seeded query: views edges vs group membership.',
    apply: () => {},
  },
  {
    n: 16, phase: 'investigation', actor: 'overlook', edge: ['overlook', 'bedrock'],
    title: 'Overlook reads Gold graph_nodes + graph_edges',
    desc: 'Overlook reads the Gold graph from Bedrock and joins views to memberships.',
    apply: () => {},
    openTool: 'overlook',
  },
  {
    n: 17, phase: 'investigation', actor: 'overlook', edge: ['overlook', 'atlas'],
    title: 'Overlook returns an anomalous view',
    desc: 'Overlook finds j.harper viewed sensitive P-1042 with no group membership backing it.',
    apply: (s) => {
      s.finding = getFinding(s);
      const anomalous = new Set(detectAnomalies(s.gold, s).map((e) => e.id));
      for (const e of s.gold.edges) {
        if (e.kind !== 'viewed') {
          e.status = null;
        } else {
          e.status = anomalous.has(e.id) ? 'anomalous' : 'ok';
        }
      }
    },
  },
  {
    n: 18, phase: 'investigation', actor: 'atlas', edge: null,
    title: 'Atlas returns the highlighted path + narrative steps',
    desc: 'Atlas sends Compass the highlighted traversal path and the narrative steps that explain it.',
    apply: () => {},
  },
  {
    n: 19, phase: 'investigation', actor: 'compass', edge: null,
    title: 'Compass renders the traversal',
    desc: 'Compass renders the highlighted path: j.harper → viewed → P-1042 (sensitive), with the missing memberof edge shown as a gap.',
    apply: () => {}, openTool: 'compass', final: true,
  },
  {
    n: 20, phase: 'investigation', actor: 'compass', edge: null,
    title: 'Compass shows the exposure to the analyst',
    desc: 'The analyst sees the sensitive exposure in plain language: j.harper can view Payroll-NG but is not in G-SR.',
    apply: (s) => {
      s.auditLog.push({ ts: TS, actor: 'analyst', useCase: 'sensitive-product-view-audit', decision: 'allow', detail: '1 anomalous view surfaced: j.harper → P-1042 (Payroll-NG)' });
    },
  },
  {
    n: 21, phase: 'investigation', actor: 'superset', edge: ['superset', 'overlook'],
    title: 'Superset can pin the finding as a dashboard',
    desc: '(Optional) Superset pins the anomalous-views query as an investigative dashboard for compliance.',
    apply: () => {},
  },
  {
    n: 22, phase: 'investigation', actor: 'watchtower', edge: null,
    title: 'Watchtower observes the whole run',
    desc: 'Watchtower records the run end-to-end. The twin is settled. Export the state or reset to play again.',
    apply: (s) => {
      s.auditLog.push({ ts: TS, actor: 'system', useCase: 'sensitive-product-view-audit', decision: 'allow', detail: 'run complete — 22 steps' });
    },
  },
];