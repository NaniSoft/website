/**
 * Shared types for the nanisoft digital-twin architecture model.
 *
 * Everything here is framework-agnostic plain TypeScript — no React, no Next.js,
 * no server/client boundaries — so the package can be consumed identically by
 * the landing (architecture section) and the playground (simulator state).
 */

/** Kinds of node in the architecture graph. */
export type ComponentKind =
  | 'custom' // built in-house (Atlas, Compass, Bridge, Scout)
  | 'offshelf' // off-the-shelf product, named in the spine
  | 'platform' // platform / ops (Anchor, Conveyor, OpenBao, Watchtower)
  | 'source' // a source system feeding the pipeline
  | 'person'; // a human persona driving a phase

/** The four pipeline phases, in spine order. */
export type PhaseId = 'schema' | 'ingestion' | 'transform' | 'investigation';

/** A phase band of the pipeline (tracks the active step in the playground). */
export interface Phase {
  id: PhaseId;
  name: string;
  /** 1-based order along the spine. */
  order: number;
  description: string;
}

/**
 * A component (node) in the architecture graph.
 *
 * `codename` is the identifier kept after de-branding ("TrueAccess" retired);
 * `realName` records the off-the-shelf product it wraps, or null when custom.
 */
export interface Component {
  /** Stable kebab-case id (also the codename, slugified). */
  id: string;
  /** Codename shown in the UI. */
  codename: string;
  /** The real off-the-shelf product this wraps, or null if built in-house. */
  realName: string | null;
  kind: ComponentKind;
  /** Which phase this component primarily belongs to (null = cross-cutting). */
  phase: PhaseId | null;
  /** Whether this node carries a full mocked tool overlay in the playground. */
  fullUi: boolean;
  description: string;
}

export type EdgeStyle = 'solid' | 'dotted';

/**
 * A directed edge between two components. Solid = data flow; dotted =
 * provisioning / deploy / secrets / observe (the platform + Watchtower cross-cut).
 */
export interface Edge {
  from: string;
  to: string;
  label?: string;
  style?: EdgeStyle;
}

/** Ordered stages of the directed pipeline spine, left → right. */
export const PIPELINE_SPINE = [
  'sources',
  'schema',
  'ingestion',
  'bedrock',
  'transform',
  'serving',
  'core',
  'ui',
] as const;

export type SpineStage = (typeof PIPELINE_SPINE)[number];

/** Components at each spine stage. Watchtower is exported separately (observer). */
export const STAGE_COMPONENTS: Record<SpineStage, string[]> = {
  sources: ['active-directory', 'workday', 'sql-fleet'],
  schema: ['blueprint', 'bridge'],
  ingestion: ['airbyte', 'scout', 'trailhead'],
  bedrock: ['bedrock'],
  transform: ['forge'],
  serving: ['overlook', 'superset'],
  core: ['atlas', 'opa'],
  ui: ['compass'],
};

/** Cross-cutting observer(s) rendered above the spine. */
export const OBSERVER_COMPONENTS: string[] = ['watchtower'];