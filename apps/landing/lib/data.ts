import type { Integration, UseCase } from './types';

export const BRAND = {
  name: 'nanisoft',
  tagline: 'Digital twin of the IT estate.',
} as const;

export const HERO = {
  eyebrow: 'Security Knowledge Graph · v2.4',
  h1: 'See every asset, identity, and event in one temporal model.',
  sub:
    'nanisoft unifies IT, HR, IAM, cloud, and security telemetry into a single queryable graph — and lets AI agents answer your hardest forensic questions in seconds.',
  primaryCta: { label: 'Request a demo', href: '#final-cta' },
  trustCaption: 'Trusted by security teams at',
  metrics: [
    { label: 'events/day', value: '12 B' },
    { label: 'entities', value: '47 M' },
    { label: 'p95 query', value: '<200 ms' },
  ],
} as const;

// Placeholder customer logos — render as text marks. Replace with real SVGs in production.
export const CUSTOMER_LOGOS: readonly string[] = [
  'Northwind', 'Helios', 'Aperture', 'Cascade', 'Meridian', 'Polaris', 'Vector', 'Lumen',
];

export const PROBLEM_CARDS = [
  {
    icon: 'fork',
    title: 'Fragmented sources',
    body: 'IT, HR, IAM, cloud, and security tools each hold a sliver of the truth. Nothing agrees on identities, time, or scope.',
  },
  {
    icon: 'clock',
    title: 'No temporal context',
    body: 'Most tools answer "what is true now." Almost none answer "what was true at 2 AM on a Tuesday three weeks ago."',
  },
  {
    icon: 'magnify',
    title: 'Slow forensic answers',
    body: 'Even basic questions — where is this data, who touched it, was it compliant — take days of stitching logs together.',
  },
] as const;

export const PLATFORM_FLOW = [
  { step: '01', title: 'Ingest', body: 'Pull metadata, logs, access records, and policies from every source.' },
  { step: '02', title: 'Normalize', body: 'Map everything to a common schema with stable identity resolution.' },
  { step: '03', title: 'Graph', body: 'Build a temporal knowledge graph: every entity, relation, and event timestamped.' },
  { step: '04', title: 'Query', body: 'Ask plain-English questions; get cited answers with the path through the graph.' },
] as const;

export const PLATFORM_FEATURES = [
  { icon: 'schema', title: 'Unified Schema', body: 'One model across IT, HR, IAM, cloud, apps, and security controls.' },
  { icon: 'graph', title: 'Temporal Knowledge Graph', body: 'Every fact and event carries a timestamp. Replay the past at any moment.' },
  { icon: 'spark', title: 'AI Agents', body: 'Cited answers to forensic and compliance questions, with the graph path shown.' },
  { icon: 'search', title: 'Forensic Querying', body: 'Trace sensitive data lineage, blast radius, and access history in one query.' },
  { icon: 'policy', title: 'Policy-as-Code', body: 'Express controls as code, evaluate them against the graph at any point in time.' },
  { icon: 'plug', title: 'Open Integrations', body: '50+ first-party connectors and a typed SDK for everything else.' },
] as const;

export const USE_CASES: readonly UseCase[] = [
  {
    title: 'M&A due diligence',
    illustration: 'graph',
    bullets: [
      'Unify target IT, HR, and identity data in days, not months.',
      'Surface hidden access paths and orphaned privileged accounts.',
      'Export evidence packs for auditors and legal.',
    ],
  },
  {
    title: 'Incident response',
    illustration: 'shield',
    bullets: [
      'Reconstruct the exact blast radius of any compromise.',
      'Replay access events across every affected system.',
      'Hand responders a single, citable timeline.',
    ],
  },
  {
    title: 'Continuous compliance',
    illustration: 'clock',
    bullets: [
      'Evaluate controls against the live graph on every change.',
      'Prove "was access compliant at time T" with evidence.',
      'Cut audit prep from weeks to hours.',
    ],
  },
];

export const INTEGRATIONS: readonly Integration[] = [
  { name: 'AWS', category: 'Cloud' },
  { name: 'Azure', category: 'Cloud' },
  { name: 'GCP', category: 'Cloud' },
  { name: 'Okta', category: 'Identity' },
  { name: 'Active Directory', category: 'Identity' },
  { name: 'ServiceNow', category: 'ITSM' },
  { name: 'Jira', category: 'ITSM' },
  { name: 'Splunk', category: 'SIEM' },
  { name: 'CrowdStrike', category: 'Endpoint' },
  { name: 'Snowflake', category: 'Data' },
  { name: 'Workday', category: 'Identity' },
  { name: 'GitHub', category: 'DevTools' },
  { name: 'Datadog', category: 'SIEM' },
  { name: 'Slack', category: 'Productivity' },
  { name: 'Salesforce', category: 'CRM' },
  { name: 'Zendesk', category: 'Support' },
];

export const FINAL_CTA = {
  h2: 'Bring every signal into one model.',
  primary: { label: 'Request a demo', href: '/api/demo-request' },
  secondary: { label: 'Talk to sales', href: 'mailto:hello@nanisoft.com' },
  footnote: 'or start a free 14-day pilot',
};

export const FOOTER_LINKS = {
  Product: ['Platform', 'Integrations', 'AI Agents', 'Changelog'],
  Solutions: ['M&A diligence', 'Incident response', 'Continuous compliance', 'Identity governance'],
  Resources: ['Docs', 'Customer stories', 'Security & trust', 'Status'],
  Company: ['About', 'Careers', 'Press', 'Contact'],
} as const;
