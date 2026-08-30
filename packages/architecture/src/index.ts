/**
 * @nanisoft/architecture — the one source of truth for the digital-twin
 * architecture model, consumed by both the landing (architecture section) and
 * the playground (simulator).
 *
 * Ticket 07 populates the model: the component/phase/edge graph (de-branded,
 * codenames kept), the seeded dataset carrying the planted
 * anomaly, and the six mock-tool specs. Both apps import this package via
 * `workspace:*`; it is plain TypeScript with no React/Next.js boundaries.
 */

/** Public-facing product name. */
export const APP_NAME = 'nanisoft';

/** Schema version of the architecture model. Bumped when the model changes. */
export const ARCHITECTURE_VERSION = '0.1.0';

// ── Model: components, phases, edges ─────────────────────────────────────────
export {
  COMPONENTS,
  COMPONENT_BY_ID,
  EDGES,
  PHASES,
  spineComponentIds,
} from './components';

export {
  OBSERVER_COMPONENTS,
  PIPELINE_SPINE,
  STAGE_COMPONENTS,
} from './types';
export type {
  Component,
  ComponentKind,
  Edge,
  EdgeStyle,
  Phase,
  PhaseId,
  SpineStage,
} from './types';

// ── Seeded dataset + Gold / anomaly logic ─────────────────────────────────────
export {
  conformToGold,
  createSeed,
  detectAnomalies,
  getFinding,
  GROUPS,
  GROUP_MEMBERSHIPS,
  PRODUCTS,
  SCHEMA_REGISTRY,
  SEED,
  USERS,
  VIEW_LOGS,
} from './dataset';
export type {
  AuditEntry,
  Finding,
  GoldEdge,
  GoldEdgeKind,
  GoldGraph,
  GoldNode,
  GoldNodeKind,
  Group,
  GroupMembership,
  Product,
  SchemaField,
  SchemaFieldType,
  SchemaObjectType,
  SchemaRegistry,
  SeedDataset,
  User,
  ViewLog,
} from './dataset';

// ── Mock-tool specs ──────────────────────────────────────────────────────────
export { MOCK_TOOL_BY_COMPONENT, MOCK_TOOLS } from './tools';
export type { MockTool } from './tools';

// ── Playground state engine + playbook ───────────────────────────────────────
export {
  InvalidStateError,
  applyStep,
  blankState,
  deriveStatus,
  exportState,
  importState,
  reduceToCursor,
} from './playground-state';
export type {
  PlaybookStep,
  PlaygroundState,
  StepStatus,
} from './playground-state';
export { SENSITIVE_PRODUCT_VIEW_AUDIT } from './playbook';

// ── Tool canonical actions ───────────────────────────────────────────────────
export { authorSensitiveProductField, loadBronze } from './tool-actions';

// ── Overlay chrome + derivations ──────────────────────────────────────────────
export { overlayReducer, beckonToolId, dataGerrySyncStatus, airflowDagStatus, trinoResults, TRINO_SEEDED_SQL, atlasOpaStatus, ATLAS_REGO, compassTraversal, supersetDashboard } from './overlay';
export type {
  OverlayState,
  OverlayAction,
  DataGerrySyncStatus,
  AirflowTaskState,
  AirflowTask,
  AirflowDag,
  AirflowRunLogLine,
  AirflowDagStatus,
  TrinoResultRow,
  TrinoResults,
  AtlasLogLine,
  AtlasOpaStatus,
  CompassNodeKind,
  CompassNode,
  CompassEdgeStatus,
  CompassEdge,
  CompassNarrativeStep,
  CompassTraversal,
  SupersetSourceSystem,
  SupersetExposureRow,
  SupersetAnomalousUserRow,
  SupersetSourceRow,
  SupersetDashboard,
} from './overlay';