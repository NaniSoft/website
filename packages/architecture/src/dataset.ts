/**
 * The seeded dataset — the one scenario the playground resets to.
 *
 * Minimal seed sufficient to teach the flagship use-case (Sensitive Product
 * View Audit), per SPEC §4.6: 2 products, 4 users, 2 groups, 2 view-logs.
 *
 * The planted anomaly (SPEC §4.6): `j.harper` has a `viewed → P-1042` edge but
 * no `memberof` edge; `m.okafor` and `a.chen` both have `memberof → G-SR`;
 * P-1042 = Payroll-NG, `sensitive: true`. The conformed Gold graph therefore
 * has exactly 5 nodes / 4 edges — the teaching state (SPEC §4.7, steps 1–10).
 *
 * The seed is the *teaching state itself* (the reset point), so the SchemaRegistry
 * already carries `Product.Sensitive: bool` — as if DataGerry (Blueprint) had
 * already authored it. The playbook replays the steps from an earlier point;
 * `reset` restores this state.
 */

// ── Domain rows (Bronze / Silver source data) ───────────────────────────────

export interface Product {
  id: string;
  name: string;
  /** Group that owns (and is the backing membership for) this product. */
  ownerGroup: string;
  sensitive: boolean;
}

export interface User {
  id: string;
  displayName: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface ViewLog {
  id: string;
  user: string;
  product: string;
  ts: string;
}

/** A group-membership row (user → group). Absence is what makes a view anomalous. */
export interface GroupMembership {
  user: string;
  group: string;
}

export const PRODUCTS: Product[] = [
  { id: 'P-1042', name: 'Payroll-NG', ownerGroup: 'G-SR', sensitive: true },
  { id: 'P-2210', name: 'Inventory-NG', ownerGroup: 'G-OPS', sensitive: false },
];

export const GROUPS: Group[] = [
  { id: 'G-SR', name: 'Sensitive Reports' },
  { id: 'G-OPS', name: 'Operations' },
];

export const USERS: User[] = [
  { id: 'j.harper', displayName: 'Jordan Harper' },
  { id: 'm.okafor', displayName: 'Mara Okafor' },
  { id: 'a.chen', displayName: 'Alex Chen' },
  { id: 'r.singh', displayName: 'Riya Singh' },
];

/**
 * Group memberships. `j.harper` and `r.singh` have NONE — j.harper's missing
 * membership is the planted anomaly; r.singh simply has no views and no
 * memberships, so the conformer drops them from Gold.
 */
export const GROUP_MEMBERSHIPS: GroupMembership[] = [
  { user: 'm.okafor', group: 'G-SR' },
  { user: 'a.chen', group: 'G-SR' },
];

export const VIEW_LOGS: ViewLog[] = [
  { id: 'VL-001', user: 'j.harper', product: 'P-1042', ts: '2026-08-14T09:12:00Z' },
  { id: 'VL-002', user: 'm.okafor', product: 'P-1042', ts: '2026-08-14T09:40:00Z' },
];

// ── Schema registry ──────────────────────────────────────────────────────────

export type SchemaFieldType = 'string' | 'bool' | 'int';

export interface SchemaField {
  name: string;
  type: SchemaFieldType;
}

export interface SchemaObjectType {
  name: string;
  fields: SchemaField[];
}

export type SchemaRegistry = Record<string, SchemaObjectType>;

/**
 * Seeded SchemaRegistry. `Product.Sensitive: bool` is the definitional hinge
 * — authored by Blueprint (DataGerry) in Phase 1 before any data flows.
 */
export const SCHEMA_REGISTRY: SchemaRegistry = {
  Product: {
    name: 'Product',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'owner_group', type: 'string' },
      { name: 'Sensitive', type: 'bool' },
    ],
  },
};

// ── Gold graph (the conformed teaching state) ───────────────────────────────

export type GoldNodeKind = 'user' | 'product' | 'group';

export interface GoldNode {
  id: string;
  kind: GoldNodeKind;
  label: string;
  /** Present on product nodes only. */
  sensitive?: boolean;
  /** Present on product nodes only — the backing owner group. */
  ownerGroup?: string;
}

export type GoldEdgeKind = 'viewed' | 'memberof';

export interface GoldEdge {
  id: string;
  from: string;
  to: string;
  kind: GoldEdgeKind;
  /** Set by the finding step (step 17): 'anomalous' | 'ok' | null until then. */
  status: 'anomalous' | 'ok' | null;
}

export interface GoldGraph {
  nodes: GoldNode[];
  edges: GoldEdge[];
}

// ── Audit log ────────────────────────────────────────────────────────────────

export interface AuditEntry {
  ts: string;
  actor: string;
  useCase: string;
  decision: 'allow' | 'deny';
  detail: string;
}

// ── The composed seed ────────────────────────────────────────────────────────

export interface SeedDataset {
  products: Product[];
  users: User[];
  groups: Group[];
  groupMemberships: GroupMembership[];
  viewLogs: ViewLog[];
  schemaRegistry: SchemaRegistry;
  /** Raw landings. */
  bronze: { products: Product[]; viewLogs: ViewLog[] };
  /** Conformed tables. */
  silver: { extProduct: Product[]; extViewLog: ViewLog[] };
  /** The conformed graph: graph_nodes + graph_edges. */
  gold: GoldGraph;
  /** Atlas writes here on the authz step; empty in the seed. */
  auditLog: AuditEntry[];
  /** Tables the DataGerry Bridge has written DDL for (SPEC §4.8). Empty pre-pipeline; SEED = ['ext_product']. */
  bridgedTables: string[];
}

/** Resolve a node id to a Gold node (user / product / group). */
function goldNodeFor(id: string, seed: SeedDataset): GoldNode {
  const user = seed.users.find((u) => u.id === id);
  if (user) return { id, kind: 'user', label: user.displayName };
  const product = seed.products.find((p) => p.id === id);
  if (product) {
    return {
      id,
      kind: 'product',
      label: product.name,
      sensitive: product.sensitive,
      ownerGroup: product.ownerGroup,
    };
  }
  const group = seed.groups.find((g) => g.id === id);
  if (group) return { id, kind: 'group', label: group.name };
  // Unknown id (defensive — should not happen for a well-formed seed).
  return { id, kind: 'user', label: id };
}

/**
 * Conform the seed into the Gold graph.
 *
 * Edges = view-logs (`viewed`) + group memberships (`memberof`).
 * Nodes = every entity referenced by at least one edge — so a user with no
 * views and no memberships (r.singh) and a product with no views (P-2210)
 * and an unbacked group (G-OPS) do not appear in Gold.
 *
 * With the seeded rows this yields exactly 5 nodes / 4 edges:
 *   nodes  = { j.harper, m.okafor, a.chen, P-1042, G-SR }
 *   edges  = viewed(j.harper→P-1042), viewed(m.okafor→P-1042),
 *            memberof(m.okafor→G-SR), memberof(a.chen→G-SR)
 */
export function conformToGold(seed: SeedDataset): GoldGraph {
  const edges: GoldEdge[] = [];

  for (const vl of seed.viewLogs) {
    edges.push({
      id: `e:viewed:${vl.user}:${vl.product}`,
      from: vl.user,
      to: vl.product,
      kind: 'viewed',
      status: null,
    });
  }
  for (const m of seed.groupMemberships) {
    edges.push({
      id: `e:memberof:${m.user}:${m.group}`,
      from: m.user,
      to: m.group,
      kind: 'memberof',
      status: null,
    });
  }

  const nodeIds = new Set<string>();
  for (const e of edges) {
    nodeIds.add(e.from);
    nodeIds.add(e.to);
  }
  const nodes = [...nodeIds].map((id) => goldNodeFor(id, seed));

  return { nodes, edges };
}

/** Map of user → set of groups they are a member of. */
function membershipMap(seed: SeedDataset): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const m of seed.groupMemberships) {
    if (!map.has(m.user)) map.set(m.user, new Set());
    map.get(m.user)!.add(m.group);
  }
  return map;
}

/**
 * Detect anomalous views — the finding logic (SPEC §4.7, step 17).
 *
 * A `viewed` edge is anomalous when the viewed product is `sensitive` AND the
 * viewer has no `memberof` edge to that product's `ownerGroup` — i.e. a
 * sensitive view with no backing group membership.
 */
export function detectAnomalies(gold: GoldGraph, seed: SeedDataset): GoldEdge[] {
  const membersOf = membershipMap(seed);
  const products = new Map(seed.products.map((p) => [p.id, p]));

  return gold.edges.filter((e) => {
    if (e.kind !== 'viewed') return false;
    const product = products.get(e.to);
    if (!product || !product.sensitive) return false;
    const groups = membersOf.get(e.from) ?? new Set<string>();
    return !groups.has(product.ownerGroup);
  });
}

/** The structured finding surfaced to Compass (SPEC §4.7, the finding step). */
export interface Finding {
  user: string;
  product: string;
  productName: string;
  sensitive: boolean;
  ownerGroup: string;
  /** True — the viewer has no memberof edge to the owner group. */
  missingMembership: boolean;
  /** The Gold edge that carries the anomaly. */
  edgeId: string;
}

/** Build the flagship finding from the seed (the first anomaly, by edge order). */
export function getFinding(seed: SeedDataset): Finding | null {
  const gold = seed.gold;
  const anomalous = detectAnomalies(gold, seed);
  if (anomalous.length === 0) return null;
  const edge = anomalous[0];
  const product = seed.products.find((p) => p.id === edge.to)!;
  return {
    user: edge.from,
    product: edge.to,
    productName: product.name,
    sensitive: product.sensitive,
    ownerGroup: product.ownerGroup,
    missingMembership: true,
    edgeId: edge.id,
  };
}

/** Build the full seeded dataset (the playground reset state). */
export function createSeed(): SeedDataset {
  const seed: SeedDataset = {
    products: PRODUCTS,
    users: USERS,
    groups: GROUPS,
    groupMemberships: GROUP_MEMBERSHIPS,
    viewLogs: VIEW_LOGS,
    schemaRegistry: SCHEMA_REGISTRY,
    bronze: { products: PRODUCTS, viewLogs: VIEW_LOGS },
    silver: { extProduct: PRODUCTS, extViewLog: VIEW_LOGS },
    gold: { nodes: [], edges: [] },
    auditLog: [],
    bridgedTables: ['ext_product'],
  };
  seed.gold = conformToGold(seed);
  return seed;
}

/** The default seeded scenario — the one source of truth both apps reset to. */
export const SEED: SeedDataset = createSeed();