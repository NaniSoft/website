import type { GraphData, GraphNode, GraphEdge, EntityType } from './types';

// PLACEHOLDER: all names below (users, services, data assets, policies, identities, events) are illustrative. Replace with real or further synthetic data in production.

const USERS = [
  'Sarah Chen', 'Mark Patel', 'Aiko Tanaka', 'Diego Alvarez', 'Priya Raman', 'Lena Müller', 'Jamal Wright', 'Ravi Iyer',
  'Noah Kim', 'Olivia Rossi', 'Hassan Ali', 'Mei Lin', 'Tomasz Kowalski', 'Elena Petrova', 'Lucas Silva', 'Amelia Wright',
];
const SERVICES = [
  'okta-prod', 'etl-pipeline', 'sso-dev', 'vault-prod', 'airflow-prod', 'jenkins-main', 'grafana-prod', 'kms-rotator',
  'datalake-prod', 'lambda-prod', 'snowflake-prod', 'spark-cluster', 'ml-train', 'feature-store', 'secrets-broker',
];
const DATA = [
  'customer-pii/', 'finance-prod/q3-2026/model.xlsx', 'hr-salary/', 'design-mockups/', 'analytics.events/', 'audit-logs/', 'pii-backup/',
  'marketing-leads/', 'bi-dashboards/', 'ml-models/v3/', 'vendor-contracts/', 'security-scans/',
];
const POLICIES = [
  'FIN-PII-007', 'IAM-MFA-REQ', 'DATA-CLASS-C', 'HR-PRIV-002', 'LOG-RET-1Y',
  'SEC-ENC-AT-REST', 'NET-ZT-001', 'DATA-DLP-002', 'VENDOR-RISK-3',
];
const EVENTS = ['read', 'write', 'assume-role', 'export', 'delete', 'login', 'token-issue', 'rotate-key', 'approve', 'deny'];
const IDENTITIES = ['svc-etl', 'svc-backup', 'svc-monitor', 'svc-rotator', 'svc-ml-train', 'svc-datalake'];

function n(id: string, label: string, type: EntityType, description: string, attrs: Array<[string, string]>, hot = false): GraphNode {
  return { id, label, type, description, attrs, hot };
}

function e(source: string, target: string, relation: string, hot = false): GraphEdge {
  return { source, target, relation, hot };
}

const nodes: GraphNode[] = [];
const edges: GraphEdge[] = [];

let counter = 0;
function uid(prefix: string) { counter += 1; return `${prefix}-${counter}`; }

// Users
USERS.forEach((name) => {
  const id = uid('u');
  nodes.push(n(id, name, 'User', 'Human identity in the workforce system.', [
    ['email', `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`],
    ['department', ['Finance', 'Engineering', 'Security', 'People'][counter % 4]],
    ['last seen', '2026-08-16 14:02 UTC'],
  ]));
});

// Services
SERVICES.forEach((name) => {
  const id = uid('s');
  nodes.push(n(id, name, 'Service', 'A workload identity in the cloud account.', [
    ['cloud', ['aws', 'gcp', 'azure'][counter % 3]],
    ['role', name],
    ['mfa', counter % 3 === 0 ? 'required' : 'optional'],
  ], counter < 3));
});

// Data assets
DATA.forEach((name) => {
  const id = uid('d');
  nodes.push(n(id, name, 'DataAsset', 'A file, bucket, or dataset.', [
    ['classification', ['Confidential', 'Restricted', 'Internal'][counter % 3]],
    ['owner', 'finance-prod'],
    ['size', ['12 GB', '4.2 GB', '880 MB'][counter % 3]],
  ]));
});

// Policies
POLICIES.forEach((name) => {
  const id = uid('p');
  nodes.push(n(id, name, 'Policy', 'A codified control evaluated against the graph.', [
    ['version', String((counter % 4) + 1)],
    ['owner', ['CISO', 'CTO', 'DPO'][counter % 3]],
    ['status', counter % 5 === 0 ? 'draft' : 'enforced'],
  ]));
});

// Service identities
IDENTITIES.forEach((name) => {
  const id = uid('i');
  nodes.push(n(id, name, 'Identity', 'A non-human identity used by automated workloads.', [
    ['type', 'service account'],
    ['created', '2024-11-03'],
    ['last rotated', '2026-07-14'],
  ]));
});

// Events (a handful — full list is in the inspector per-node)
for (let i = 0; i < 44; i += 1) {
  const id = uid('e');
  nodes.push(n(id, `evt-${id.slice(2)}`, 'Event', 'A recorded action in the underlying systems.', [
    ['action', EVENTS[i % EVENTS.length]],
    ['at', `2026-08-${(10 + (i % 7)).toString().padStart(2, '0')} ${String(i % 24).padStart(2, '0')}:00 UTC`],
  ]));
}

// Edges: every user → first 3 services, every service → 2 data assets, every data asset → 1 policy
const userNodes = nodes.filter((x) => x.type === 'User');
const serviceNodes = nodes.filter((x) => x.type === 'Service');
const dataNodes = nodes.filter((x) => x.type === 'DataAsset');
const policyNodes = nodes.filter((x) => x.type === 'Policy');
const identityNodes = nodes.filter((x) => x.type === 'Identity');

userNodes.forEach((u, i) => {
  serviceNodes.slice(0, 3).forEach((s) => edges.push(e(u.id, s.id, 'uses')));
  identityNodes.slice(i % identityNodes.length, (i % identityNodes.length) + 1).forEach((ident) =>
    edges.push(e(u.id, ident.id, 'manages'))
  );
  dataNodes.slice(0, 2).forEach((d) => edges.push(e(u.id, d.id, 'owns')));
});

serviceNodes.forEach((s) => {
  dataNodes.slice(0, 2).forEach((d) => edges.push(e(s.id, d.id, 'reads')));
  policyNodes.slice(0, 1).forEach((p) => edges.push(e(s.id, p.id, 'evaluated_by')));
  dataNodes.slice(2, 4).forEach((d) => edges.push(e(s.id, d.id, 'writes')));
});

identityNodes.forEach((ident, i) => {
  dataNodes.slice(i % dataNodes.length, (i % dataNodes.length) + 1).forEach((d) =>
    edges.push(e(ident.id, d.id, 'accesses'))
  );
  serviceNodes.slice(i % serviceNodes.length, (i % serviceNodes.length) + 1).forEach((s) =>
    edges.push(e(ident.id, s.id, 'assumes'))
  );
  dataNodes.slice((i + 1) % dataNodes.length, ((i + 1) % dataNodes.length) + 1).forEach((d) =>
    edges.push(e(ident.id, d.id, 'exports'))
  );
});

dataNodes.forEach((d, i) => {
  policyNodes.slice(i % policyNodes.length, (i % policyNodes.length) + 1).forEach((p) =>
    edges.push(e(d.id, p.id, 'governed_by'))
  );
  policyNodes.slice((i + 1) % policyNodes.length, ((i + 1) % policyNodes.length) + 1).forEach((p) =>
    edges.push(e(d.id, p.id, 'classified_under'))
  );
});

// Events: link each event to a user, service, and data asset to model telemetry traffic.
const eventNodes = nodes.filter((x) => x.type === 'Event');
eventNodes.forEach((ev, i) => {
  const u = userNodes[i % userNodes.length];
  const s = serviceNodes[i % serviceNodes.length];
  const d = dataNodes[i % dataNodes.length];
  edges.push(e(u.id, ev.id, 'performed'));
  edges.push(e(ev.id, s.id, 'targets'));
  edges.push(e(ev.id, d.id, 'affects'));
});

// Mark a "hot path" of 3 high-priority edges connecting a user → identity → service → data
const hotUser = userNodes[0];
const hotIdentity = identityNodes[0];
const hotService = serviceNodes.find((s) => s.label === 'etl-pipeline')!;
const hotData = dataNodes.find((d) => d.label === 'finance-prod/q3-2026/model.xlsx')!;
[hotUser, hotIdentity, hotService, hotData].forEach((n0) => { n0.hot = true; });
edges.push(e(hotUser.id, hotIdentity.id, 'manages', true));
edges.push(e(hotIdentity.id, hotService.id, 'assumes', true));
edges.push(e(hotService.id, hotData.id, 'reads', true));

export const graphData: GraphData = { nodes, edges };
