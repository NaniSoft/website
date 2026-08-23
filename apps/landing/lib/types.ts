// Shared data shapes for the landing's copy constants. The retired demo
// graph/chat types (GraphNode, GraphEdge, ChatTranscript, …) were removed
// with their components in ticket 18 — git history keeps them.

export type StackRole =
  | 'Orchestration'
  | 'Transform'
  | 'Lakehouse'
  | 'Query'
  | 'Schema'
  | 'Observability'
  | 'Ingestion'
  | 'Entity resolution'
  | 'Quality gates'
  | 'Dashboards'
  | 'Authorization'
  | 'Secrets'
  | 'Databases'
  | 'Cache'
  | 'Infrastructure as code'
  | 'GitOps';

/** An off-the-shelf product the platform is composed from (codenames kept). */
export interface StackProduct {
  name: string;
  role: StackRole;
}

/** A component nanisoft builds itself. */
export interface CustomComponent {
  name: string;
  blurb: string;
}

export interface UseCase {
  title: string;
  illustration: 'graph' | 'shield' | 'clock';
  bullets: [string, string, string];
  status: 'available' | 'planned';
}
