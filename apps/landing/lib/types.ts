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
  /**
   * The real OSS product this entry runs. For entries nanisoft codenames
   * (Trailhead, Forge, …), this is the wrapped product from
   * `@nanisoft/architecture`; for entries already named by their real product
   * (Airbyte, OPA, …), `realName` equals `name`. Omitted renders as just `name`.
   */
  realName?: string;
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

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}
export interface NavGroup {
  label: string;
  items: readonly NavItem[];
}
export interface NavConfig {
  groups: readonly NavGroup[];
  links: readonly NavItem[];
}
