/**
 * The component / phase / edge model — the architecture graph.
 *
 * Seeded from `resources/TrueAccess_MVP_Architecture.mermaid` and de-branded:
 * "TrueAccess" is retired everywhere; component codenames are kept. The real
 * off-the-shelf product each codename wraps is recorded in `realName`.
 *
 * Classification note: the mermaid's `classDef` (and SPEC §3.5: "own only Atlas +
 * Compass + the Bridge + Scout") makes the four *custom* components Atlas,
 * Compass, Bridge, and Scout. DataGerry is off-the-shelf (AGPLv3); its codename
 * is `blueprint`. SPEC §1's "Custom (4)" wording is read as the schema-definition
 * *surface* (DataGerry + the custom Bridge), not DataGerry itself being built.
 *
 * See `.scratch/nanosoft-digital-twin/SPEC.md` §1.
 */

import type { Component, Edge, Phase } from './types';
import { OBSERVER_COMPONENTS, STAGE_COMPONENTS } from './types';

/** The four phases, in spine order (Schema → Ingestion → Transform → Investigation). */
export const PHASES: Phase[] = [
  {
    id: 'schema',
    name: 'Schema',
    order: 1,
    description:
      'Schema definition — author the ObjectType (e.g. add Sensitive:bool to Product), bridge to Bedrock DDL, refresh the Atlas SchemaRegistry cache.',
  },
  {
    id: 'ingestion',
    name: 'Ingestion',
    order: 2,
    description:
      'Orchestrate extraction from source systems and land raw rows in Bronze, independent of Atlas.',
  },
  {
    id: 'transform',
    name: 'Transform',
    order: 3,
    description:
      'Conform, snapshot (SCD2), and confidence-score the raw rows into Silver tables and the Gold graph (graph_nodes + graph_edges).',
  },
  {
    id: 'investigation',
    name: 'Investigation',
    order: 4,
    description:
      'Query, govern, and visualize the Gold graph — surface the finding (Trino row, Compass edges, Superset dashboard).',
  },
];

/**
 * All components (nodes) in the architecture graph.
 *
 * Storage sub-nodes from the mermaid (Nessie's Postgres/S3, DataGerry's
 * MongoDB/RabbitMQ, Atlas's Postgres) are folded into their parent component's
 * description rather than modelled as separate nodes, to keep the spine a
 * component-level DAG.
 */
export const COMPONENTS: Component[] = [
  // --- Custom (4): the things nanisoft actually builds ---
  {
    id: 'atlas',
    codename: 'Atlas',
    realName: null,
    kind: 'custom',
    phase: 'investigation',
    fullUi: true,
    description:
      'Core engine + API (FastAPI in the real arch; mocked in the playground). Owns the traversal API, authz enforcement, audit log, and use-case step serving. Backed by a Postgres operational store.',
  },
  {
    id: 'compass',
    codename: 'Compass',
    realName: null,
    kind: 'custom',
    phase: 'investigation',
    fullUi: true,
    description:
      'Traversal UI — graph exploration of the twin. The product’s differentiated value: render the finding as edges (anomalous viewed edge, dashed missing memberof gap, teal backed access) with drill-into-node detail.',
  },
  {
    id: 'bridge',
    codename: 'DataGerry Bridge',
    realName: null,
    kind: 'custom',
    phase: 'schema',
    fullUi: false,
    description:
      'Thin sync from DataGerry to Bedrock DDL (CREATE/ALTER ext_product) and the Atlas SchemaRegistry cache. A CronJob in the real architecture.',
  },
  {
    id: 'scout',
    codename: 'Scout',
    realName: null,
    kind: 'custom',
    phase: 'ingestion',
    fullUi: false,
    description:
      'Residual bespoke connectors for the few internal source systems the off-the-shelf connector catalog does not cover.',
  },

  // --- Off-the-shelf, codenamed (named in the spine) ---
  {
    id: 'blueprint',
    codename: 'Blueprint',
    realName: 'DataGerry',
    kind: 'offshelf',
    phase: 'schema',
    fullUi: true,
    description:
      'Schema definition — Type/Field editor + sync bridge. Backed by its own MongoDB + RabbitMQ. The `Sensitive: bool` field is authored here before any data flows.',
  },
  {
    id: 'trailhead',
    codename: 'Trailhead',
    realName: 'Airflow',
    kind: 'offshelf',
    phase: 'ingestion',
    fullUi: true,
    description:
      'Orchestration — DAGs. Triggers the ingestion DAG (Airbyte → Source → Bronze) and orchestrates the transform DAG (Forge → Silver → Gold).',
  },
  {
    id: 'forge',
    codename: 'Forge',
    realName: 'Spark + dbt',
    kind: 'offshelf',
    phase: 'transform',
    fullUi: false,
    description:
      'Transform / conform / SCD2 (dbt models) + confidence scoring (thin custom PySpark). Reads the cached Product schema; writes Silver tables and Gold graph_nodes/graph_edges to Bedrock.',
  },
  {
    id: 'bedrock',
    codename: 'Bedrock',
    realName: 'Nessie (Iceberg catalog, Postgres, S3)',
    kind: 'offshelf',
    phase: 'transform',
    fullUi: false,
    description:
      'The lakehouse — Bronze (raw) → Silver (conformed) → Gold (graph_nodes + graph_edges), plus the SchemaRegistry-backed tables. Catalog = Nessie over Postgres, storage = S3/MinIO.',
  },
  {
    id: 'overlook',
    codename: 'Overlook',
    realName: 'Trino',
    kind: 'offshelf',
    phase: 'investigation',
    fullUi: true,
    description:
      'Query engine over Bedrock. Runs the Atlas-seeded SQL (Views edges vs group membership) and surfaces the anomalous row.',
  },
  {
    id: 'superset',
    codename: 'Superset',
    realName: 'Apache Superset',
    kind: 'offshelf',
    phase: 'investigation',
    fullUi: true,
    description:
      'Dashboards (sandbox-only; compliance/audit persona). A pre-built dashboard over Gold: products by exposure, users with anomalous views, views by source system.',
  },
  {
    id: 'opa',
    codename: 'OPA',
    realName: 'Open Policy Agent',
    kind: 'offshelf',
    phase: 'investigation',
    fullUi: false,
    description:
      'Authorization decisions. Stateless — reads a static Rego policy and returns allow/deny. Surfaced as a zone inside the Atlas overlay, not its own tool.',
  },

  // --- Off-the-shelf, reactive (unnamed in the spine) ---
  {
    id: 'airbyte',
    codename: 'Airbyte',
    realName: 'Airbyte',
    kind: 'offshelf',
    phase: 'ingestion',
    fullUi: false,
    description: 'Connector platform — extracts AD, Workday HR, and the SQL Server Fleet into Bronze.',
  },
  {
    id: 'openbao',
    codename: 'OpenBao',
    realName: 'OpenBao',
    kind: 'platform',
    phase: null,
    fullUi: false,
    description: 'Secrets management (Vault-API-compatible). Provides secrets to Atlas and Airbyte.',
  },

  // --- Platform / ops ---
  {
    id: 'watchtower',
    codename: 'Watchtower',
    realName: 'Prometheus + Grafana + Loki',
    kind: 'platform',
    phase: null,
    fullUi: false,
    description:
      'Cross-cutting observability — observes Atlas and Trailhead (and the wider stack) from above the spine.',
  },
  {
    id: 'anchor',
    codename: 'Anchor',
    realName: 'OpenTofu / Terraform',
    kind: 'platform',
    phase: null,
    fullUi: false,
    description: 'Infrastructure as code — provisions the core platform.',
  },
  {
    id: 'conveyor',
    codename: 'Conveyor',
    realName: 'ArgoCD',
    kind: 'platform',
    phase: null,
    fullUi: false,
    description: 'GitOps delivery — deploys Atlas, Compass, and the Bridge.',
  },

  // --- Source systems (origin of the spine) ---
  {
    id: 'active-directory',
    codename: 'Active Directory',
    realName: 'Active Directory',
    kind: 'source',
    phase: null,
    fullUi: false,
    description: 'Source system — identity / group membership.',
  },
  {
    id: 'workday',
    codename: 'Workday HR',
    realName: 'Workday HR',
    kind: 'source',
    phase: null,
    fullUi: false,
    description: 'Source system — HR / people records.',
  },
  {
    id: 'sql-fleet',
    codename: 'SQL Server Fleet',
    realName: 'SQL Server Fleet',
    kind: 'source',
    phase: null,
    fullUi: false,
    description: 'Source system — line-of-business SQL databases.',
  },

  // --- Personas (people who drive the phases) ---
  {
    id: 'schema-author',
    codename: 'Schema Author',
    realName: null,
    kind: 'person',
    phase: 'schema',
    fullUi: false,
    description: 'Defines the ObjectType Product and authors the Sensitive: bool field in Blueprint.',
  },
  {
    id: 'analyst',
    codename: 'Security Analyst',
    realName: null,
    kind: 'person',
    phase: 'investigation',
    fullUi: false,
    description: 'Opens Compass and runs the Sensitive Product View Audit use-case.',
  },
  {
    id: 'compliance',
    codename: 'Compliance / Audit',
    realName: null,
    kind: 'person',
    phase: 'investigation',
    fullUi: false,
    description: 'Reviews the Superset dashboards over Gold.',
  },
  {
    id: 'platform-engineer',
    codename: 'Platform Engineer',
    realName: null,
    kind: 'person',
    phase: null,
    fullUi: false,
    description: 'Manages the platform via the Atlas API.',
  },
];

/** Lookup by id. */
export const COMPONENT_BY_ID: Record<string, Component> = Object.fromEntries(
  COMPONENTS.map((c) => [c.id, c]),
);

/**
 * Directed edges between components, de-branded from the mermaid.
 *
 * Solid = data flow along the spine. Dotted = the platform/ops cross-cut
 * (provisions / deploys / secrets / observes) — Watchtower observes from above.
 */
export const EDGES: Edge[] = [
  // Sources → ingestion
  { from: 'active-directory', to: 'airbyte', label: 'extract', style: 'solid' },
  { from: 'workday', to: 'airbyte', label: 'extract', style: 'solid' },
  { from: 'sql-fleet', to: 'airbyte', label: 'extract', style: 'solid' },

  // Ingestion
  { from: 'trailhead', to: 'airbyte', label: 'triggers', style: 'solid' },
  { from: 'trailhead', to: 'scout', label: 'triggers', style: 'solid' },
  { from: 'airbyte', to: 'forge', label: 'raw → Bronze', style: 'solid' },
  { from: 'scout', to: 'forge', label: 'raw → Bronze', style: 'solid' },

  // Schema → Bedrock + Atlas
  { from: 'schema-author', to: 'blueprint', label: 'defines schema', style: 'solid' },
  { from: 'blueprint', to: 'bridge', label: 'Type/Relation API', style: 'solid' },
  { from: 'bridge', to: 'bedrock', label: 'generates DDL', style: 'solid' },
  { from: 'bridge', to: 'atlas', label: 'refreshes SchemaRegistry cache', style: 'solid' },

  // Transform → lakehouse
  { from: 'trailhead', to: 'forge', label: 'orchestrates', style: 'solid' },
  { from: 'forge', to: 'bedrock', label: 'writes Silver/Gold', style: 'solid' },

  // Serving / query
  { from: 'overlook', to: 'bedrock', label: 'queries', style: 'solid' },
  { from: 'superset', to: 'overlook', label: 'SQL', style: 'solid' },

  // Core: Atlas ↔ Overlook (seeded query path), Atlas ↔ OPA (authz)
  { from: 'atlas', to: 'overlook', label: 'run seeded SQL', style: 'solid' },
  { from: 'overlook', to: 'atlas', label: 'finding', style: 'solid' },
  { from: 'atlas', to: 'opa', label: 'authz check', style: 'solid' },
  { from: 'opa', to: 'atlas', label: 'allow', style: 'solid' },

  // UI / personas
  { from: 'compass', to: 'atlas', label: 'traversal query', style: 'solid' },
  { from: 'analyst', to: 'compass', label: 'opens', style: 'solid' },
  { from: 'compliance', to: 'superset', label: 'views dashboards', style: 'solid' },
  { from: 'platform-engineer', to: 'atlas', label: 'manages via API', style: 'solid' },

  // Platform / ops cross-cut (dotted)
  { from: 'anchor', to: 'atlas', label: 'provisions', style: 'dotted' },
  { from: 'conveyor', to: 'atlas', label: 'deploys', style: 'dotted' },
  { from: 'conveyor', to: 'compass', label: 'deploys', style: 'dotted' },
  { from: 'conveyor', to: 'bridge', label: 'deploys', style: 'dotted' },
  { from: 'openbao', to: 'atlas', label: 'secrets', style: 'dotted' },
  { from: 'openbao', to: 'airbyte', label: 'secrets', style: 'dotted' },
  { from: 'watchtower', to: 'atlas', label: 'observes', style: 'dotted' },
  { from: 'watchtower', to: 'trailhead', label: 'observes', style: 'dotted' },
];

/** Convenience: ids of every component the spine + observer reference. */
export function spineComponentIds(): string[] {
  const stages = Object.values(STAGE_COMPONENTS).flat();
  return [...new Set([...stages, ...OBSERVER_COMPONENTS])];
}