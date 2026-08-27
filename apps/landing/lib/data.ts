import type { CustomComponent, NavItem, StackProduct, UseCase } from './types';

export const BRAND = {
  name: 'nanisoft',
  tagline: 'Digital twin of the IT estate.',
} as const;

// ---------------------------------------------------------------------------
// What it is (Problem)
// ---------------------------------------------------------------------------

export const PROBLEM_CARDS = [
  {
    icon: 'graph',
    title: 'Everything in one graph',
    body: 'Directories, HR systems, databases, and applications become nodes. Memberships, grants, and activity become edges. The estate finally agrees with itself.',
  },
  {
    icon: 'stack',
    title: 'Produced, not assembled',
    body: 'The twin comes off a real data platform — ingestion, transformation, quality gates, versioned layers — so it stays trustworthy as the estate changes.',
  },
  {
    icon: 'magnify',
    title: 'Built for questions',
    body: 'Who can reach this system? What did access look like last quarter? The twin answers by traversal, not stitched exports. Access is the first use-case; more are coming.',
  },
] as const;

// ---------------------------------------------------------------------------
// How we build it, part one (Platform) — the datalake path
// ---------------------------------------------------------------------------

export const PLATFORM_FLOW = [
  { step: '01', title: 'Land', body: 'Raw source data lands untouched in Bronze. Nothing is interpreted at the door.' },
  { step: '02', title: 'Conform', body: 'Records are cleaned, joined, and resolved until identities are stable. One person, one node — that’s Silver.' },
  { step: '03', title: 'Graph', body: 'Conformed facts resolve into Gold: nodes and edges. This graph is the twin.' },
  { step: '04', title: 'Serve', body: 'Atlas serves traversals, checks every question against policy, and writes an audit trail.' },
] as const;

export const PLATFORM_FEATURES = [
  { title: 'Orchestrated end to end', body: 'Trailhead sequences every move — ingestion, promotion, maintenance — as reviewable DAGs.' },
  { title: 'Versioned at every layer', body: 'The lakehouse catalog keeps history, so last quarter’s twin can be reproduced exactly.' },
  { title: 'Promoted only when clean', body: 'Quality gates decide what advances. Bad input stops at the boundary and never reaches the twin.' },
  { title: 'Watched continuously', body: 'Watchtower observes every component — pipelines, queries, engine — from one place.' },
  { title: 'Governed by default', body: 'Policy checks sit in front of the graph, and every answer is logged.' },
  { title: 'Declared as code', body: 'Anchor declares the infrastructure; Conveyor delivers it. No snowflake deployments.' },
] as const;

// ---------------------------------------------------------------------------
// What it unlocks (UseCases)
// ---------------------------------------------------------------------------

export const USE_CASES: readonly UseCase[] = [
  {
    title: 'Access traversal',
    status: 'available',
    illustration: 'graph',
    bullets: [
      'Trace every path between a person and a sensitive product: group memberships, direct grants, inherited rights.',
      'The audit surfaces views of sensitive products with no membership backing them. Each one is a finding.',
      'Read the same finding three ways — as graph edges, as a table row, as a dashboard chart.',
    ],
  },
  {
    title: 'Blast radius',
    status: 'planned',
    illustration: 'shield',
    bullets: [
      'Ask what an account, a key, or a host can actually reach from where it sits.',
      'Rehearse containment before you need it, against the graph you already have.',
      'Next on the roadmap — designed on the twin, no new connectors.',
    ],
  },
  {
    title: 'Stale and unused access',
    status: 'planned',
    illustration: 'clock',
    bullets: [
      'Find memberships nobody remembers granting and privileges nobody has exercised.',
      'Feed clean-up work with evidence instead of anecdotes.',
      'Planned alongside blast radius; both fall out of the same graph.',
    ],
  },
];

export const USE_CASES_MORE = {
  line: 'More use-cases are coming — small utilities, composed largely from open-source parts.',
  cta: { label: 'Open the playground', href: 'https://playground.nanisoft.com' },
} as const;

// ---------------------------------------------------------------------------
// Our approach (Integrations) — buy first, compose open source
// ---------------------------------------------------------------------------

export const STACK_PRODUCTS: readonly StackProduct[] = [
  // Codenamed entries — the real wrapped OSS product is in `realName`
  // (sourced verbatim from @nanisoft/architecture's component model).
  { name: 'Trailhead', role: 'Orchestration', realName: 'Airflow' },
  { name: 'Forge', role: 'Transform', realName: 'Spark + dbt' },
  { name: 'Bedrock', role: 'Lakehouse', realName: 'Nessie (Iceberg catalog, Postgres, S3)' },
  { name: 'Overlook', role: 'Query', realName: 'Trino' },
  { name: 'Blueprint', role: 'Schema', realName: 'DataGerry' },
  { name: 'Watchtower', role: 'Observability', realName: 'Prometheus + Grafana + Loki' },
  { name: 'Anchor', role: 'Infrastructure as code', realName: 'OpenTofu / Terraform' },
  { name: 'Conveyor', role: 'GitOps', realName: 'ArgoCD' },
  // Real OSS, already named by their product name.
  { name: 'Airbyte', role: 'Ingestion', realName: 'Airbyte' },
  { name: 'Zingg', role: 'Entity resolution', realName: 'Zingg' },
  { name: 'Great Expectations', role: 'Quality gates', realName: 'Great Expectations' },
  { name: 'Superset', role: 'Dashboards', realName: 'Apache Superset' },
  { name: 'OPA', role: 'Authorization', realName: 'Open Policy Agent' },
  { name: 'OpenBao', role: 'Secrets', realName: 'OpenBao' },
  { name: 'CloudNativePG', role: 'Databases', realName: 'CloudNativePG' },
  { name: 'Valkey', role: 'Cache', realName: 'Valkey' },
];

export const INTEGRATIONS_NOTE =
  'Every off-the-shelf product runs unmodified — integrated through its APIs, configured, never forked. Codenamed entries are the real product shown beneath the codename, not a fork.';

export const BUILT_IN_HOUSE: readonly CustomComponent[] = [
  { name: 'Atlas', blurb: 'The core engine: traversal API, policy enforcement, audit log.' },
  { name: 'Compass', blurb: 'The traversal UI: explore the twin as a graph.' },
  { name: 'DataGerry Bridge', blurb: 'Glue that syncs authored schema into the lakehouse and the engine.' },
  { name: 'Scout', blurb: 'Connectors for internal systems no catalog covers.' },
];

// ---------------------------------------------------------------------------
// See the system think (FinalCTA) — the page's only ask
// ---------------------------------------------------------------------------

export const FINAL_CTA = {
  h2: 'See the twin think.',
  primary: { label: 'Open the playground', href: 'https://playground.nanisoft.com' },
  footnote:
    'In-browser, guided, and fully mocked — nothing to install. Watch a query traverse the twin end to end.',
};

// Only destinations the site actually substantiates: the three in-page
// section anchors and the external playground. Labels that promised pages
// the site never had ("AI Agents", "Docs", "Careers", …) were removed so the
// footer never points at dead href="#". `external` flags the playground link
// so the Footer opens it in a new tab with rel="noopener noreferrer".
export const FOOTER_LINKS: Record<string, readonly NavItem[]> = {
  Product: [
    { label: 'Platform', href: '#platform' },
    { label: 'Use cases', href: '#use-cases' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Open the playground', href: 'https://playground.nanisoft.com', external: true },
  ],
} as const;

// ---------------------------------------------------------------------------
// Primary navigation — data-driven so TopNav stays a thin render.
// Product groups the in-page anchors; Docs groups the (forthcoming) external
// docs/white-papers destinations. `external` flags new-tab + noopener in the
// renderer. The playground pill is intentionally NOT in the nav — it stays as
// the site's single ask in FinalCTA / UseCases / architecture bridge / footer.
// ---------------------------------------------------------------------------

export const NAV: import('./types').NavConfig = {
  groups: [
    {
      label: 'Product',
      items: [
        { label: 'Platform', href: '#platform' },
        { label: 'Use cases', href: '#use-cases' },
        { label: 'Integrations', href: '#integrations' },
      ],
    },
    {
      label: 'Docs',
      items: [
        { label: 'Documentation', href: 'https://docs.nanisoft.com', external: true },
        { label: 'White papers', href: 'https://docs.nanisoft.com/white-papers', external: true },
      ],
    },
  ],
  links: [
    { label: 'Blog', href: 'https://blog.nanisoft.com', external: true },
    { label: 'About us', href: '/about-us' },
    { label: 'Contact us', href: '/about-us#contact' },
  ],
} as const;

// ---------------------------------------------------------------------------
// About-us page content (edit freely — copy is not load-bearing for tests
// beyond presence + the banned-phrase gate above).
// ---------------------------------------------------------------------------

export const ABOUT = {
  hero: {
    eyebrow: 'About',
    title: 'The living map, made by people who run estates.',
    lead:
      'nanisoft turns an organization’s IT estate into a queryable graph — directories, databases, and applications as nodes; access and activity as edges. This is the team behind it.',
  },
  story: {
    heading: 'Our story',
    body: [
      'We built estates before we mapped them. Every team we worked with could answer a question about one system, and almost none could answer a question that crossed three.',
      'So we stopped assembling exports and started producing a twin: a graph off a real data platform, with quality gates and versioned layers, that stays trustworthy as the estate changes.',
      'Access traversal is the first use-case. Blast radius and stale-access cleanup follow, off the same graph.',
    ],
  },
  capabilities: {
    heading: 'What we do',
    items: [
      { title: 'Produce the twin', body: 'Ingest, conform, and resolve source data into a versioned graph — Bronze to Gold — with quality gates at every boundary.' },
      { title: 'Serve traversals', body: 'Atlas answers questions by traversal, checks each one against policy, and writes an audit trail. Compass exposes the twin as an explorable graph.' },
      { title: 'Compose open source', body: 'Sixteen off-the-shelf products run unmodified behind codenames; four components are built in-house. No forks, no snowflake deployments.' },
    ],
  },
  openSource: {
    heading: 'Open source',
    body:
      'The platform composes proven open-source projects and contributes back where it can. The playground is a fully-mocked, in-browser tour of the twin.',
    links: [
      { label: 'Open the playground', href: 'https://playground.nanisoft.com', external: true },
      { label: 'Read the docs', href: 'https://docs.nanisoft.com', external: true },
    ],
  },
} as const;
