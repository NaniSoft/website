# Ticket 21 — Landing Narrative Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the five kept landing sections (`Problem`, `Platform`, `UseCases`, `Integrations`, `FinalCTA`) into the digital-twin narrative — what it is / how we build it (part one) / what it unlocks / our approach / try it in the playground — in plain, confident tone.

**Architecture:** All collection copy lives in `apps/landing/lib/data.ts` (house pattern); headings/sublines stay inline in the section components. Types reshape in `lib/types.ts` (sole consumer: `data.ts`). Section `id`s never change (TopNav anchors depend on them). Tests updated test-first per task.

**Tech Stack:** Next.js 16.3.1 app router (client components), antd v6 (`Card`, `Tag`, `Typography`), vitest + @testing-library/react, pnpm workspace.

## Global Constraints

- Branch `feat/21-narrative-sections`; never merge to main, never push.
- Do NOT edit: `Hero.tsx`, TopNav/Footer/Wordmark/PillButton internals, theme system, `app/page.tsx`, ArchitectureSection, `apps/playground`, `packages/*`.
- Do NOT change `HERO`, `CUSTOMER_LOGOS`, `FOOTER_LINKS` in `data.ts` (Hero/Footer consume them; other tickets own those surfaces).
- Keep section ids: `problem`, `platform`, `use-cases`, `integrations`, `final-cta`.
- "TrueAccess" absent everywhere in owned copy. Codenames kept: Atlas, Compass, Trailhead, Forge, Bedrock, Overlook, Blueprint, Watchtower, Anchor, Conveyor (+ Bridge, Scout).
- Tone: plain, confident, never breathless. No invented metrics, no testimonials, no hype words.
- Jade is locked to live/active states ONLY — status tags use teal/muted, never jade. No purple/neon/pure-black-white. Cards radius 20 (antd theme), inner radius 12 (`--radius-inner`), buttons pill (`PillButton`). JetBrains Mono (`.mono`) for data-shaped marks. Italic = emphasis.
- No new motion (static narrative sections; four motion principles belong to hero/architecture). `prefers-reduced-motion` therefore unaffected.
- Verification commands (run from worktree root): `pnpm --filter @nanisoft/landing test`, `pnpm --filter @nanisoft/landing build`; regression check `pnpm --filter @nanisoft/architecture test` and `pnpm --filter @nanisoft/identity test`.

---

### Task 1: Data layer — types + all narrative constants

**Files:**
- Modify: `apps/landing/lib/types.ts`
- Modify: `apps/landing/lib/data.ts`
- Test: `apps/landing/tests/data.test.ts`
- Touch (icon-key coupling only): `apps/landing/components/Problem.tsx` (ICONS map keys)

**Interfaces:**
- Produces: `StackProduct { name: string; role: StackRole }`, `CustomComponent { name: string; blurb: string }`, `UseCase { title; illustration: 'graph'|'shield'|'clock'; bullets: [string,string,string]; status: 'available'|'planned' }` from `lib/types`.
- Produces from `lib/data`: `PROBLEM_CARDS` (icon keys now `'graph'|'stack'|'magnify'`), `PLATFORM_FLOW` (4 items, step/title/body), `PLATFORM_FEATURES` (6 items, title/body), `USE_CASES` (flagship first, `status` field), `USE_CASES_MORE { line, cta{label,href} }`, `STACK_PRODUCTS` (16), `BUILT_IN_HOUSE` (4), `INTEGRATIONS_NOTE` (string), `FINAL_CTA { h2, primary{label,href}, secondary{label,href}, footnote }`. Removes `Integration` type + `INTEGRATIONS` constant (renamed).
- Unchanged: `BRAND`, `HERO`, `CUSTOMER_LOGOS`, `FOOTER_LINKS`.

- [ ] **Step 1: Write failing tests — replace `tests/data.test.ts` with**

```ts
import { describe, expect, it } from 'vitest';
import {
  BRAND,
  HERO,
  CUSTOMER_LOGOS,
  PROBLEM_CARDS,
  PLATFORM_FLOW,
  PLATFORM_FEATURES,
  USE_CASES,
  USE_CASES_MORE,
  STACK_PRODUCTS,
  BUILT_IN_HOUSE,
  INTEGRATIONS_NOTE,
  FINAL_CTA,
  FOOTER_LINKS,
} from '@/lib/data';

describe('data module', () => {
  it('brands as nanisoft with the positioning tagline', () => {
    expect(BRAND.name).toBe('nanisoft');
    expect(BRAND.tagline).toMatch(/digital twin of the IT estate/i);
  });

  it('carries no Sentinel/TrueAccess branding in any copy constant', () => {
    const dump = JSON.stringify([
      BRAND, HERO, CUSTOMER_LOGOS, PROBLEM_CARDS, PLATFORM_FLOW,
      PLATFORM_FEATURES, USE_CASES, USE_CASES_MORE, STACK_PRODUCTS,
      BUILT_IN_HOUSE, INTEGRATIONS_NOTE, FINAL_CTA, FOOTER_LINKS,
    ]);
    expect(dump.includes('Sentinel')).toBe(false);
    expect(dump.includes('TrueAccess')).toBe(false);
  });

  it('frames what-it-is around the digital twin and its datalake', () => {
    const dump = JSON.stringify(PROBLEM_CARDS);
    expect(dump).toMatch(/nodes/i);
    expect(dump).toMatch(/edges/i);
    expect(dump).toMatch(/first use-case/i);
  });

  it('walks the datalake path Bronze -> Silver -> Gold -> serve', () => {
    expect(PLATFORM_FLOW).toHaveLength(4);
    expect(PLATFORM_FLOW[0].body).toContain('Bronze');
    expect(PLATFORM_FLOW[1].body).toContain('Silver');
    expect(PLATFORM_FLOW[2].body).toContain('Gold');
    expect(PLATFORM_FLOW[3].body).toContain('Atlas');
  });

  it('introduces codenames naturally across the how-we-build features', () => {
    const dump = JSON.stringify(PLATFORM_FEATURES);
    for (const name of ['Trailhead', 'Watchtower', 'Anchor', 'Conveyor']) {
      expect(dump).toContain(name);
    }
  });

  it('leads what-it-unlocks with the access-traversal flagship', () => {
    expect(USE_CASES).toHaveLength(3);
    expect(USE_CASES[0].title).toContain('Sensitive Product View Audit');
    expect(USE_CASES[0].status).toBe('available');
    expect(USE_CASES.slice(1).every((u) => u.status === 'planned')).toBe(true);
  });

  it('points more-use-cases at the playground', () => {
    expect(USE_CASES_MORE.cta.href).toBe('https://playground.nanisoft.com');
  });

  it('composes sixteen off-the-shelf products, each with a role', () => {
    expect(STACK_PRODUCTS).toHaveLength(16);
    for (const p of STACK_PRODUCTS) expect(p.role.length).toBeGreaterThan(0);
  });

  it('builds exactly four components in-house', () => {
    expect(BUILT_IN_HOUSE.map((c) => c.name)).toEqual([
      'Atlas', 'Compass', 'DataGerry Bridge', 'Scout',
    ]);
  });

  it('states the unmodified-OSS stance', () => {
    expect(INTEGRATIONS_NOTE).toMatch(/unmodified/i);
  });

  it('points the primary CTA at the playground and keeps a demo request', () => {
    expect(FINAL_CTA.primary.href).toBe('https://playground.nanisoft.com');
    expect(FINAL_CTA.secondary.label.toLowerCase()).toContain('demo');
  });

  it('hero has a primary CTA', () => {
    expect(HERO.primaryCta.label).toBeTruthy();
  });

  it('footer has 4 link columns', () => {
    expect(Object.keys(FOOTER_LINKS)).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm --filter @nanisoft/landing test -- data.test`
Expected: FAIL — `USE_CASES_MORE`/`STACK_PRODUCTS`/`BUILT_IN_HOUSE`/`INTEGRATIONS_NOTE` not exported; flagship/status assertions fail.

- [ ] **Step 3: Replace `lib/types.ts` with**

```ts
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
```

- [ ] **Step 4: In `lib/data.ts` replace everything below `CUSTOMER_LOGOS` with** (keep `BRAND`, `HERO`, `CUSTOMER_LOGOS` byte-identical)

```ts
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
    title: 'Access traversal — Sensitive Product View Audit',
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
  cta: { label: 'See the flagship run today in the playground.', href: 'https://playground.nanisoft.com' },
} as const;

// ---------------------------------------------------------------------------
// Our approach (Integrations) — buy first, compose open source
// ---------------------------------------------------------------------------

export const STACK_PRODUCTS: readonly StackProduct[] = [
  { name: 'Trailhead', role: 'Orchestration' },
  { name: 'Forge', role: 'Transform' },
  { name: 'Bedrock', role: 'Lakehouse' },
  { name: 'Overlook', role: 'Query' },
  { name: 'Blueprint', role: 'Schema' },
  { name: 'Watchtower', role: 'Observability' },
  { name: 'Anchor', role: 'Infrastructure as code' },
  { name: 'Conveyor', role: 'GitOps' },
  { name: 'Airbyte', role: 'Ingestion' },
  { name: 'Zingg', role: 'Entity resolution' },
  { name: 'Great Expectations', role: 'Quality gates' },
  { name: 'Superset', role: 'Dashboards' },
  { name: 'OPA', role: 'Authorization' },
  { name: 'OpenBao', role: 'Secrets' },
  { name: 'CloudNativePG', role: 'Databases' },
  { name: 'Valkey', role: 'Cache' },
];

export const INTEGRATIONS_NOTE =
  'Every off-the-shelf product runs unmodified — integrated through its APIs, configured, never forked.';

export const BUILT_IN_HOUSE: readonly CustomComponent[] = [
  { name: 'Atlas', blurb: 'The core engine: traversal API, policy enforcement, audit log.' },
  { name: 'Compass', blurb: 'The traversal UI: explore the twin as a graph.' },
  { name: 'DataGerry Bridge', blurb: 'Glue that syncs authored schema into the lakehouse and the engine.' },
  { name: 'Scout', blurb: 'Connectors for internal systems no catalog covers.' },
];

// ---------------------------------------------------------------------------
// Try it in the playground (FinalCTA)
// ---------------------------------------------------------------------------

export const FINAL_CTA = {
  h2: 'Try it in the playground.',
  primary: { label: 'Open the playground', href: 'https://playground.nanisoft.com' },
  secondary: { label: 'Request a demo', href: 'mailto:hello@nanisoft.com' },
  footnote: 'In-browser, guided, and fully mocked — nothing to install.',
};
```

Update the import at the top to `import type { CustomComponent, StackProduct, UseCase } from './types';` and delete the old `PROBLEM_CARDS`/`PLATFORM_FLOW`/`PLATFORM_FEATURES`/`USE_CASES`/`INTEGRATIONS`/`FINAL_CTA` blocks being replaced.

- [ ] **Step 5: Fix `Problem.tsx` ICONS keys (coupling only — prose lands in Task 2)**

Replace the ICONS map and its icon imports:

```tsx
import { ApartmentOutlined, DatabaseOutlined, SearchOutlined } from '@ant-design/icons';

const ICONS: Record<string, ReactElement> = {
  graph: <ApartmentOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />,
  stack: <DatabaseOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />,
  magnify: <SearchOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />,
};
```

- [ ] **Step 6: Run the suite**

Run: `pnpm --filter @nanisoft/landing test`
Expected: PASS (data.test new assertions green; page/a11y/theme suites untouched-green — old page tests assert nothing about replaced copy).

- [ ] **Step 7: Commit**

```bash
git add apps/landing/lib/types.ts apps/landing/lib/data.ts apps/landing/tests/data.test.ts apps/landing/components/Problem.tsx
git commit -m "feat(landing): ticket 21 data layer — digital-twin narrative constants (16+4 stack, flagship use-case, playground CTA)"
```

---

### Task 2: Problem + Platform prose ("What it is" / "How we build it" part one)

**Files:**
- Modify: `apps/landing/components/Problem.tsx`
- Modify: `apps/landing/components/Platform.tsx`
- Test: `apps/landing/tests/page.test.tsx`

**Interfaces:**
- Consumes: `PROBLEM_CARDS`, `PLATFORM_FLOW`, `PLATFORM_FEATURES` from Task 1.
- Produces: rendered headings "nanisoft builds a digital twin of your IT estate." / "Built like a lakehouse — because it is one." + handoff paragraph asserted by tests.

- [ ] **Step 1: Add failing test to `tests/page.test.tsx` (inside the `describe`)**

```tsx
  it('hands off from the datalake path into the architecture walkthrough', async () => {
    renderPage();
    await flushAntd();
    expect(screen.getByText(/the next section walks the full pipeline/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /built like a lakehouse/i })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter @nanisoft/landing test -- page.test`
Expected: FAIL (handoff paragraph and lakehouse heading don't exist yet).

- [ ] **Step 3: In `Problem.tsx` replace the h2 + subline**

```tsx
      <h2 style={{ fontSize: 40, lineHeight: 1.2, fontWeight: 700, margin: '0 0 16px', maxWidth: 720 }}>
        nanisoft builds a digital twin of your IT estate.
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        Systems, people, and permissions modeled in one place, so you can see how your estate is connected — and how it actually works.
      </p>
```

- [ ] **Step 4: In `Platform.tsx` replace the h2 + subline and append the handoff paragraph after the features grid (before `<style>`)**

```tsx
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 16px', maxWidth: 720 }}>
        Built like a lakehouse — because it is one.
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        Every fact lands raw, gets conformed, and is promoted layer by layer until it becomes part of the twin.
      </p>
```

```tsx
      {/* Hands the reader down into the architecture walkthrough (Agent 2's section below this one). */}
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 640 }}>
        That’s the data path. The next section walks the full pipeline — every component, from source systems to Compass.
      </p>
```

- [ ] **Step 5: Run the suite** — `pnpm --filter @nanisoft/landing test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/landing/components/Problem.tsx apps/landing/components/Platform.tsx apps/landing/tests/page.test.tsx
git commit -m "feat(landing): what-it-is + datalake-path prose for Problem/Platform (ticket 21)"
```

---

### Task 3: UseCases — flagship unlocks + honest statuses

**Files:**
- Modify: `apps/landing/components/UseCases.tsx`
- Test: `apps/landing/tests/page.test.tsx`

**Interfaces:**
- Consumes: `USE_CASES` (with `status`), `USE_CASES_MORE` from Task 1.
- Produces: status Tags (`Flagship · available today` teal / `Planned` muted), no `href="#"` links in the section, footer playground link.

- [ ] **Step 1: Add failing test to `tests/page.test.tsx`**

```tsx
  it('names the flagship unlock and keeps the section free of dead links', async () => {
    renderPage();
    await flushAntd();
    expect(screen.getByText(/Sensitive Product View Audit/)).toBeInTheDocument();
    expect(screen.getByText('Flagship · available today')).toBeInTheDocument();
    const section = document.getElementById('use-cases');
    expect(section?.querySelectorAll('a[href="#"]')).toHaveLength(0);
    const more = screen.getByRole('link', { name: /see the flagship run today in the playground/i });
    expect(more.getAttribute('href')).toBe('https://playground.nanisoft.com');
  });
```

- [ ] **Step 2: Run to verify failure** — expected FAIL (dead "#" links still present, no status tags).

- [ ] **Step 3: Rewrite `UseCases.tsx`**

```tsx
'use client';

import type { CSSProperties } from 'react';
import { Card, Tag } from 'antd';
import { USE_CASES, USE_CASES_MORE } from '@/lib/data';

// Illustration covers are decorative — quiet teal/petrol washes over the
// sunken surface. Jade never appears here (live/active states only).
const ILLU_BG: Record<string, string> = {
  graph: 'linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 22%, transparent), color-mix(in srgb, var(--color-secondary) 6%, transparent)), var(--color-bg-sunken)',
  shield: 'linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 12%, transparent), color-mix(in srgb, var(--color-primary) 10%, transparent)), var(--color-bg-sunken)',
  clock: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 14%, transparent), color-mix(in srgb, var(--color-secondary) 8%, transparent)), var(--color-bg-sunken)',
};

const STATUS_TAG: Record<'available' | 'planned', { label: string; style: CSSProperties }> = {
  available: {
    label: 'Flagship · available today',
    style: {
      background: 'color-mix(in srgb, var(--color-secondary) 14%, transparent)',
      color: 'var(--color-secondary)',
      borderColor: 'transparent',
      borderRadius: 'var(--radius-pill)',
    },
  },
  planned: {
    label: 'Planned',
    style: {
      background: 'var(--color-bg-sunken)',
      color: 'var(--color-text-muted)',
      borderColor: 'transparent',
      borderRadius: 'var(--radius-pill)',
    },
  },
};

export function UseCases() {
  return (
    <section id="use-cases" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 12px' }}>What it unlocks.</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        One twin, many questions. Today, the flagship is access.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="grid-3">
        {USE_CASES.map((u) => (
          <Card
            key={u.title}
            variant="outlined"
            style={{ background: 'var(--color-bg-elev)', overflow: 'hidden' }}
            styles={{ body: { padding: 0 } }}
            cover={
              <div aria-hidden style={{ height: 200, background: ILLU_BG[u.illustration] }} />
            }
          >
            <div style={{ padding: 24 }}>
              <Tag style={STATUS_TAG[u.status].style}>{STATUS_TAG[u.status].label}</Tag>
              <h3 style={{ fontSize: 22, fontWeight: 600, margin: '12px 0' }}>{u.title}</h3>
              <ul style={{ paddingLeft: 18, color: 'var(--color-text-muted)', margin: 0 }}>
                {u.bullets.map((b) => <li key={b} style={{ marginBottom: 6 }}>{b}</li>)}
              </ul>
            </div>
          </Card>
        ))}
      </div>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 40, maxWidth: 720 }}>
        {USE_CASES_MORE.line}{' '}
        <a
          href={USE_CASES_MORE.cta.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-primary)', fontWeight: 500 }}
        >
          {USE_CASES_MORE.cta.label}
        </a>
      </p>
      <style>{`@media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
```

(The `next/link` import dies with the dead `href="#"` links; an external URL doesn't need it.)

- [ ] **Step 4: Run the suite** — expected PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/landing/components/UseCases.tsx apps/landing/tests/page.test.tsx
git commit -m "feat(landing): what-it-unlocks — flagship access-traversal card, honest statuses (ticket 21)"
```

---

### Task 4: Integrations — our approach (16 composed + 4 built)

**Files:**
- Modify: `apps/landing/components/Integrations.tsx`
- Test: `apps/landing/tests/page.test.tsx`

**Interfaces:**
- Consumes: `STACK_PRODUCTS`, `BUILT_IN_HOUSE`, `INTEGRATIONS_NOTE` from Task 1.
- Produces: 16-card grid (name + role), "Built in-house" strip of 4, note line; "+40 more" tile gone.

- [ ] **Step 1: Add failing test to `tests/page.test.tsx`**

```tsx
  it('states the approach: sixteen off-the-shelf products, four built in-house', async () => {
    renderPage();
    await flushAntd();
    expect(screen.getByText(/Sixteen proven open-source products carry the platform/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Built in-house' })).toBeInTheDocument();
    for (const name of ['Atlas', 'Compass', 'DataGerry Bridge', 'Scout']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.queryByText('+40')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run to verify failure** — expected FAIL.

- [ ] **Step 3: Rewrite `Integrations.tsx`**

```tsx
'use client';

import { Card } from 'antd';
import { BUILT_IN_HOUSE, INTEGRATIONS_NOTE, STACK_PRODUCTS } from '@/lib/data';

export function Integrations() {
  return (
    <section id="integrations" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 12px' }}>Buy first. Build only what’s ours.</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        Sixteen proven open-source products carry the platform. We build four things ourselves — the parts where nanisoft differs.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-4">
        {STACK_PRODUCTS.map((p) => (
          <Card key={p.name} variant="outlined" style={{ background: 'var(--color-bg-elev)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div aria-hidden style={{ width: 40, height: 40, borderRadius: 'var(--radius-inner)', background: 'var(--color-bg-sunken)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                {p.name.slice(0, 1)}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.role}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 24, maxWidth: 720 }}>{INTEGRATIONS_NOTE}</p>
      <h3 style={{ fontSize: 22, fontWeight: 600, margin: '56px 0 16px' }}>Built in-house</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-4">
        {BUILT_IN_HOUSE.map((c) => (
          <Card key={c.name} variant="outlined" style={{ background: 'var(--color-bg-elev)' }}>
            {/* Data-shaped mark in the twin's mono face — a label, not the accent. */}
            <div className="mono" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>CUSTOM</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{c.name}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>{c.blurb}</div>
          </Card>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) { .grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .grid-4 { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
```

Note: `screen.getByText(name)` for 'Atlas'/'Compass'/'Scout' is unique — the words appear nowhere else on the page (Platform bodies mention Atlas… wait: Platform flow step 04 body contains "Atlas serves traversals…" — `getByText('Atlas')` does EXACT match on element text; the Platform body is a longer string inside a `<p>`, so exact-match `getByText('Atlas')` will NOT match it. 'Compass' likewise appears only as the card name (handoff paragraph says "to Compass" — again substring of longer text node, exact match safe).

- [ ] **Step 4: Run the suite** — expected PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/landing/components/Integrations.tsx apps/landing/tests/page.test.tsx
git commit -m "feat(landing): our-approach — buy-first/compose-OSS 16+4 grid (ticket 21)"
```

---

### Task 5: FinalCTA — try it in the playground

**Files:**
- Modify: `apps/landing/components/FinalCTA.tsx`
- Test: `apps/landing/tests/page.test.tsx`

**Interfaces:**
- Consumes: `FINAL_CTA` from Task 1.
- Produces: primary pill linking externally to `https://playground.nanisoft.com` (target `_blank`; modern browsers imply noopener), secondary mailto demo request.

- [ ] **Step 1: Add failing test to `tests/page.test.tsx`**

```tsx
  it('points the closing CTA at the playground', async () => {
    renderPage();
    await flushAntd();
    const cta = screen.getByRole('link', { name: /open the playground/i });
    expect(cta.getAttribute('href')).toBe('https://playground.nanisoft.com');
    expect(cta.getAttribute('target')).toBe('_blank');
    expect(screen.getByText(/in-browser, guided, and fully mocked/i)).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run to verify failure** — expected FAIL (current primary is "Request a demo" → `/api/demo-request`).

- [ ] **Step 3: Update `FinalCTA.tsx` — pass `target` through for the external href**

Replace the button row with:

```tsx
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <PillButton type="primary" size="large" href={FINAL_CTA.primary.href} target={FINAL_CTA.primary.href.startsWith('http') ? '_blank' : undefined}>
            {FINAL_CTA.primary.label}
          </PillButton>
          <PillButton size="large" href={FINAL_CTA.secondary.href}>{FINAL_CTA.secondary.label}</PillButton>
        </div>
```

(antd `ButtonProps` types `target`; `rel` is implied noopener-by-default for `target="_blank"` in all current browsers. `PillButton` spreads rest props through.)

- [ ] **Step 4: Run the suite** — expected PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/landing/components/FinalCTA.tsx apps/landing/tests/page.test.tsx
git commit -m "feat(landing): try-it-in-the-playground CTA to playground.nanisoft.com (ticket 21)"
```

---

### Task 6: Full verification bar

**Files:** none (verification only; fixes if red).

- [ ] **Step 1:** `pnpm --filter @nanisoft/landing test` — all suites green (expect 5 suites: data, page, a11y, theme + setup).
- [ ] **Step 2:** `pnpm --filter @nanisoft/landing build` — exit 0, `/api/demo-request` still dynamic.
- [ ] **Step 3:** Regressions: `pnpm --filter @nanisoft/architecture test` → 124/124; `pnpm --filter @nanisoft/identity test` → 34/34.
- [ ] **Step 4:** De-brand/tone greps over owned files (`apps/landing/lib/data.ts`, `apps/landing/components/{Problem,Platform,UseCases,Integrations,FinalCTA}.tsx`): no `TrueAccess`; no `p95|weeks to hours|50\+`; no `jade` token introduced outside existing usage; ids `problem|platform|use-cases|integrations|final-cta` intact.
- [ ] **Step 5:** `mattpocock-skills:code-review` pass over the branch diff; fix findings; commit fixes.
