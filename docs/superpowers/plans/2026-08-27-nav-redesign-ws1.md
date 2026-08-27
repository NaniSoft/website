# Nav redesign + About-us page (WS1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the landing nav (remove the playground pill, add Product/Docs dropdowns + Blog/About/Contact links), add a `/about-us` page with story/capabilities/open-source sections and a contact form backed by a new Cloudflare D1 + Resend route on the existing landing worker.

**Architecture:** The nav becomes data-driven from a new `NAV` constant in `lib/data.ts`, rendered as two antd `Dropdown`s (Product, Docs) plus three plain links. The `/about-us` route composes three content sections and a contact section whose antd `Form` POSTs to a new App-Router route handler `app/api/contact/route.ts`; that handler validates with zod, stores the row in a Cloudflare D1 binding, and notifies via the Resend REST API using `fetch` (no SDK). All changes are in `apps/landing` only. Nextra docs/blog sites are a separate plan (WS2/WS3) and are not touched here — their nav links point at `docs.nanisoft.com` / `blog.nanisoft.com` (not yet live; the links are correct for when they ship).

**Tech Stack:** Next.js 16.3.1 (App Router), React 19, antd 6, `@nanisoft/identity` tokens, vitest + @testing-library/react (jsdom), Cloudflare Workers via `@opennextjs/cloudflare`, D1, Resend REST API, zod.

## Global Constraints

- **Do not** remove the "Open the playground" pill from FinalCTA, UseCases, the architecture bridge, or the Footer — only from the header `TopNav`. The site's only ask stays the playground; the header just stops carrying it.
- The repo has a grep gate that bans the literal phrase "request a demo" and `mailto:` links from `apps/landing`. The contact form must POST to `/api/contact`, never use a `mailto:` link. Do not introduce either literal anywhere.
- Brand tokens are CSS variables from `@nanisoft/identity` (e.g. `var(--color-bg)`, `var(--color-text-muted)`, `var(--color-primary)`, `var(--text-display)`, `var(--lh-heading)`). Jade (`--color-accent`) is live/active only — do not use it decoratively. Match the inline-style + `<style>` pattern used by existing sections.
- Path alias `@` → `apps/landing` root (see `vitest.config.mts` and `tsconfig.json`). Tests use vitest with `@testing-library/react`, jsdom, globals on, setup file `tests/setup.ts`. antd async updates require the `flushAntd()` macrotask flush before assertions (see `tests/page.test.tsx`).
- antd v6: the ThemeProvider wraps `ConfigProvider` but **not** antd `<App>`. For `message` feedback use `App.useApp()` and render the form inside an antd `<App>` wrapper so it is self-contained (no `App` ancestor assumed).
- Before writing Next.js code, read the relevant guide in `apps/landing/node_modules/next/dist/docs/` (per `apps/landing/AGENTS.md`) — this is Next 16 with breaking changes. Do not strip the AGENTS.md warning block from diffs.
- Each task ends with `pnpm -F @nanisoft/landing test` green and a commit. Keep commits scoped to one task.

---

## File Structure

- `apps/landing/lib/data.ts` — add `NAV` (nav structure) and `ABOUT` (about-us content) exports. Keep existing exports untouched.
- `apps/landing/lib/types.ts` — add `NavItem` / `NavGroup` / `NavLinks` types if a shared types file is used (it is — `data.ts` imports from `./types`).
- `apps/landing/components/TopNav.tsx` — rewrite `NAV_ITEMS` usage to render `NAV` (two dropdowns + plain links); remove the `PillButton` import and its use in the ask cluster.
- `apps/landing/components/AboutUs.tsx` — new; the `/about-us` page body composing the four sections.
- `apps/landing/components/about/StorySection.tsx`, `CapabilitiesSection.tsx`, `OpenSourceSection.tsx`, `ContactSection.tsx` — new; one section per file for focus.
- `apps/landing/app/about-us/page.tsx` — new route; renders `<AboutUs />`.
- `apps/landing/app/api/contact/route.ts` — new route handler (`POST`).
- `apps/landing/lib/contact.ts` — new; zod schema + `submitContact` helper (pure, testable without Next).
- `apps/landing/wrangler.jsonc` — add `d1_databases` + `vars`.
- `apps/landing/package.json` — add `zod` dependency.
- Tests: `tests/data.test.ts` (extend), `tests/topnav.test.tsx` (new), `tests/about-us.test.tsx` (new), `tests/contact-section.test.tsx` (new), `tests/contact-api.test.ts` (new). Update `tests/page.test.tsx` (playground CTA count 5→4).

---

### Task 1: Add `NAV` + `ABOUT` data and types

**Files:**
- Modify: `apps/landing/lib/types.ts`
- Modify: `apps/landing/lib/data.ts`
- Test: `apps/landing/tests/data.test.ts`

**Interfaces:**
- Produces: `NAV` (typed `{ groups: readonly NavGroup[]; links: readonly NavItem[] }`) and `ABOUT` (typed object with `hero`, `story`, `capabilities`, `openSource` sections). Consumed by Task 2 (TopNav) and Task 3+ (AboutUs).

**Types** (add to `apps/landing/lib/types.ts`):

```ts
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
```

- [ ] **Step 1: Write the failing test**

Append to `apps/landing/tests/data.test.ts` (inside `describe('data module', ...)`), and add `NAV, ABOUT` to the existing import list at the top:

```ts
  it('exposes a nav config with Product and Docs dropdowns plus three links', () => {
    expect(NAV.groups).toHaveLength(2);
    const [product, docs] = NAV.groups;
    expect(product.label).toBe('Product');
    expect(product.items.map((i) => i.label)).toEqual(['Platform', 'Use cases', 'Integrations']);
    for (const i of product.items) expect(i.href.startsWith('#')).toBe(true);
    expect(docs.label).toBe('Docs');
    expect(docs.items.map((i) => i.label)).toEqual(['Documentation', 'White papers']);
    expect(docs.items[0].href).toBe('https://docs.nanisoft.com');
    expect(docs.items[0].external).toBe(true);
    expect(docs.items[1].href).toBe('https://docs.nanisoft.com/white-papers');
    expect(docs.items[1].external).toBe(true);
    expect(NAV.links.map((l) => l.label)).toEqual(['Blog', 'About us', 'Contact us']);
    expect(NAV.links[0]).toMatchObject({ href: 'https://blog.nanisoft.com', external: true });
    expect(NAV.links[1]).toMatchObject({ href: '/about-us' });
    expect(NAV.links[2]).toMatchObject({ href: '/about-us#contact' });
  });

  it('keeps every nav href a real destination (no bare href="#")', () => {
    const all = [...NAV.groups.flatMap((g) => g.items), ...NAV.links];
    for (const i of all) expect(i.href).not.toBe('#');
    // In-page anchors are allowed (they resolve to kept homepage sections).
    for (const i of all) expect(i.href.length).toBeGreaterThan(1);
  });

  it('exposes about-us content with story, capabilities, and open-source sections', () => {
    expect(ABOUT.hero.title.length).toBeGreaterThan(0);
    expect(ABOUT.story.body.length).toBeGreaterThan(0);
    expect(ABOUT.capabilities.items.length).toBeGreaterThanOrEqual(3);
    for (const c of ABOUT.capabilities.items) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.body.length).toBeGreaterThan(0);
    }
    expect(ABOUT.openSource.body.length).toBeGreaterThan(0);
    expect(ABOUT.openSource.links.length).toBeGreaterThan(0);
  });

  it('carries no banned ask phrases in NAV or ABOUT copy', () => {
    const dump = JSON.stringify([NAV, ABOUT]).toLowerCase();
    expect(dump.includes('demo')).toBe(false);
    expect(dump.includes('mailto')).toBe(false);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @nanisoft/landing test`
Expected: FAIL — `NAV` / `ABOUT` are not exported from `@/lib/data`.

- [ ] **Step 3: Add the data exports**

In `apps/landing/lib/data.ts`, add (after `FOOTER_LINKS`):

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @nanisoft/landing test`
Expected: PASS (all existing + new data assertions).

- [ ] **Step 5: Commit**

```bash
git add apps/landing/lib/types.ts apps/landing/lib/data.ts apps/landing/tests/data.test.ts
git commit -m "feat(landing): add NAV + ABOUT data for nav redesign and about-us page"
```

---

### Task 2: Redesign TopNav — dropdowns + new links, drop the playground pill

**Files:**
- Modify: `apps/landing/components/TopNav.tsx`
- Modify: `apps/landing/tests/page.test.tsx` (playground CTA 5→4)
- Create: `apps/landing/tests/topnav.test.tsx`

**Interfaces:**
- Consumes: `NAV` from `@/lib/data` (Task 1).
- Produces: a `TopNav` that renders two antd `Dropdown` groups and three plain links, with no `PillButton` in the header. Keeps `ThemeToggle` and the brand lockup unchanged. Keeps the existing `.top-nav-links` / `.top-nav-ask` class names so the existing responsive `<style>` still applies.

- [ ] **Step 1: Write the failing test**

Create `apps/landing/tests/topnav.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TopNav } from '@/components/TopNav';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function renderNav() {
  return render(
    <ThemeProvider>
      <TopNav />
    </ThemeProvider>,
  );
}

describe('TopNav', () => {
  it('renders the Product and Docs dropdown triggers and the three plain links', async () => {
    renderNav();
    await flushAntd();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Docs')).toBeInTheDocument();
    for (const label of ['Blog', 'About us', 'Contact us']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('points About us at /about-us and Contact us at /about-us#contact', async () => {
    renderNav();
    await flushAntd();
    expect(screen.getByText('About us').closest('a')?.getAttribute('href')).toBe('/about-us');
    expect(screen.getByText('Contact us').closest('a')?.getAttribute('href')).toBe('/about-us#contact');
  });

  it('opens external nav links (Blog) in a new tab with noopener', async () => {
    renderNav();
    await flushAntd();
    const blog = screen.getByText('Blog').closest('a') as HTMLAnchorElement;
    expect(blog.getAttribute('href')).toBe('https://blog.nanisoft.com');
    expect(blog.getAttribute('target')).toBe('_blank');
    expect(blog.getAttribute('rel')).toContain('noopener');
  });

  it('no longer renders a playground pill in the header', async () => {
    renderNav();
    await flushAntd();
    expect(screen.queryByRole('link', { name: /open the playground/i })).toBeNull();
  });

  it('keeps the in-page Product anchors (no bare href="#")', async () => {
    const { container } = renderNav();
    await flushAntd();
    const nav = container.querySelector('.top-nav-links') as HTMLElement;
    expect(nav.querySelectorAll('a[href="#"]')).toHaveLength(0);
  });
});
```

Also update the existing homepage test at `apps/landing/tests/page.test.tsx:104-125`. Change the count and comment:

```tsx
  it('points every CTA at the playground — the only ask on the page', async () => {
    renderPage();
    await flushAntd();
    // Exactly four "Open the playground" links, all the same action: the
    // architecture bridge, the use-cases handoff, the closing section, and the
    // footer Product column. The nav no longer carries the pill. All point at
    // the playground with the same target/rel.
    const ctas = screen.getAllByRole('link', { name: /open the playground/i });
    expect(ctas).toHaveLength(4);
    for (const cta of ctas) {
      expect(cta.getAttribute('href')).toBe('https://playground.nanisoft.com');
      expect(cta.getAttribute('target')).toBe('_blank');
      expect(cta.getAttribute('rel')).toContain('noopener');
    }
    expect(screen.getByText(/see the twin think/i)).toBeInTheDocument();
    expect(screen.getByText(/in-browser, guided, and fully mocked/i)).toBeInTheDocument();
    expect(screen.queryAllByText(['request', 'a', 'demo'].join(' '))).toHaveLength(0);
    expect(document.querySelectorAll('a[href^="mailto:"]')).toHaveLength(0);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm -F @nanisoft/landing test`
Expected: FAIL — `topnav.test.tsx` (Product/Docs/Blog labels not rendered), and `page.test.tsx` (still 5 playground links because the pill is present).

- [ ] **Step 3: Rewrite TopNav**

Replace the body of `apps/landing/components/TopNav.tsx` with a data-driven render using antd `Dropdown` + `Button`. Keep the outer `<header className="site-header">`, the brand lockup (lines 44-51), the `scrolled` effect, and the existing `<style>` block (lines 76-114) **unchanged** — only change imports, remove `NAV_ITEMS`/`PillButton`, and rewrite the `<nav>` + ask cluster:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { ThemeToggle } from './theme/ThemeToggle';
import { Wordmark } from './Wordmark';
import { BRAND, NAV } from '@/lib/data';
import type { NavItem } from '@/lib/types';

function anchorStyle(): React.CSSProperties {
  return { color: 'var(--color-text-muted)', fontWeight: 500 };
}

// antd Menu items render <a> when given href. External items open in a new
// tab with noopener; in-page anchors scroll (handled by the browser). Keep
// keys stable for keyboard nav.
function toMenuItems(items: readonly NavItem[]): MenuProps['items'] {
  return items.map((i) => ({
    key: i.href,
    label: <a href={i.href} style={anchorStyle()}>{i.label}</a>,
  }));
}

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="site-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '0 24px',
        height: 64,
        background: scrolled ? 'color-mix(in srgb, var(--color-bg) 80%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(160%) blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        transition: 'Background 200ms ease-out, border-color 200ms ease-out',
      }}
    >
      <Link href="/" aria-label={BRAND.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Wordmark height={26} />
        <span aria-hidden className="top-nav-tagline-rule" style={{ width: 1, height: 16, background: 'var(--color-border)' }} />
        <span className="top-nav-tagline" style={{ color: 'var(--color-text-muted)', fontSize: 13, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
          {BRAND.tagline.replace(/\.$/, '')}
        </span>
      </Link>
      <nav aria-label="Primary" className="top-nav-links" style={{ flex: 1, display: 'flex', gap: 20, marginLeft: 8, alignItems: 'center' }}>
        {NAV.groups.map((group) => (
          <Dropdown
            key={group.label}
            menu={{ items: toMenuItems(group.items) }}
            trigger={['hover', 'click']}
          >
            <Button
              type="text"
              style={{ ...anchorStyle(), padding: '0 4px', height: 'auto' }}
            >
              {group.label}
            </Button>
          </Dropdown>
        ))}
        {NAV.links.map((item) => {
          const external = item.external;
          return (
            <a
              key={item.href}
              href={item.href}
              style={anchorStyle()}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="top-nav-ask" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ThemeToggle />
      </div>
      <style>{`
        @media (max-width: 1023px) {
          .top-nav-tagline, .top-nav-tagline-rule { display: none !important; }
          .site-header {
            flex-wrap: wrap !important;
            height: auto !important;
            min-height: 64px;
            row-gap: 8px !important;
            gap: 16px !important;
          }
          .top-nav-links { gap: 16px !important; margin-left: 4px !important; }
        }
        @media (max-width: 639px) {
          .site-header { padding: 8px 24px !important; }
          .top-nav-links { flex-basis: 100% !important; margin-left: 0 !important; gap: 16px !important; }
          .top-nav-ask { gap: 8px !important; }
        }
      `}</style>
    </header>
  );
}
```

Notes: the `padding-inline: 10px` override for `.ant-btn` at ≤639px is removed (there is no pill to fit). The brand lockup, `scrolled` blur, and responsive wrap behaviour are preserved.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm -F @nanisoft/landing test`
Expected: PASS — `topnav.test.tsx` green, `page.test.tsx` green (4 playground links), all others green.

- [ ] **Step 5: Commit**

```bash
git add apps/landing/components/TopNav.tsx apps/landing/tests/topnav.test.tsx apps/landing/tests/page.test.tsx
git commit -m "feat(landing): redesign TopNav with Product/Docs dropdowns, drop playground pill"
```

---

### Task 3: About-us page — story, capabilities, open-source sections

**Files:**
- Create: `apps/landing/components/about/StorySection.tsx`
- Create: `apps/landing/components/about/CapabilitiesSection.tsx`
- Create: `apps/landing/components/about/OpenSourceSection.tsx`
- Create: `apps/landing/components/AboutUs.tsx`
- Create: `apps/landing/app/about-us/page.tsx`
- Test: `apps/landing/tests/about-us.test.tsx`

**Interfaces:**
- Consumes: `ABOUT` from `@/lib/data` (Task 1).
- Produces: the `/about-us` route (server component page) rendering `<AboutUs />`, which composes the three sections. The contact section (Task 4) is added to `AboutUs` next.

- [ ] **Step 1: Write the failing test**

Create `apps/landing/tests/about-us.test.tsx`:

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AboutUs } from '@/components/AboutUs';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('About-us page', () => {
  it('renders the hero, story, capabilities, and open-source sections', async () => {
    render(
      <ThemeProvider>
        <AboutUs />
      </ThemeProvider>,
    );
    await flushAntd();
    expect(screen.getByRole('heading', { level: 1, name: /living map, made by people/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /our story/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what we do/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /open source/i })).toBeInTheDocument();
  });

  it('renders at least three capability items', async () => {
    render(
      <ThemeProvider>
        <AboutUs />
      </ThemeProvider>,
    );
    await flushAntd();
    // ABOUT.capabilities.items titles are h3s.
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThanOrEqual(3);
  });

  it('links the open-source playground and docs destinations', async () => {
    render(
      <ThemeProvider>
        <AboutUs />
      </ThemeProvider>,
    );
    await flushAntd();
    const pg = screen.getByRole('link', { name: /open the playground/i });
    expect(pg.getAttribute('href')).toBe('https://playground.nanisoft.com');
    expect(pg.getAttribute('target')).toBe('_blank');
    expect(pg.getAttribute('rel')).toContain('noopener');
  });

  it('uses no mailto links and no bare href="#" anchors', async () => {
    const { container } = render(
      <ThemeProvider>
        <AboutUs />
      </ThemeProvider>,
    );
    await flushAntd();
    expect(container.querySelectorAll('a[href^="mailto:"]')).toHaveLength(0);
    expect(container.querySelectorAll('a[href="#"]')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @nanisoft/landing test`
Expected: FAIL — `AboutUs` is not exported.

- [ ] **Step 3: Implement the sections + page**

Create `apps/landing/components/about/StorySection.tsx`:

```tsx
import { ABOUT } from '@/lib/data';

export function StorySection() {
  return (
    <section id="story" style={{ padding: '96px 24px', maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 24px' }}>
        {ABOUT.story.heading}
      </h2>
      {ABOUT.story.body.map((p, i) => (
        <p key={i} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', lineHeight: 1.6, margin: '0 0 16px' }}>
          {p}
        </p>
      ))}
    </section>
  );
}
```

Create `apps/landing/components/about/CapabilitiesSection.tsx`:

```tsx
import { ABOUT } from '@/lib/data';

export function CapabilitiesSection() {
  return (
    <section id="capabilities" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 32px' }}>
        {ABOUT.capabilities.heading}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="about-grid-3">
        {ABOUT.capabilities.items.map((c) => (
          <div key={c.title} style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: '0 0 8px' }}>{c.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', lineHeight: 1.6, margin: 0 }}>{c.body}</p>
          </div>
        ))}
      </div>
      <style>{`@media (max-width: 900px) { .about-grid-3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
```

Create `apps/landing/components/about/OpenSourceSection.tsx`:

```tsx
import { ABOUT } from '@/lib/data';

export function OpenSourceSection() {
  return (
    <section id="open-source" style={{ padding: '96px 24px', maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 16px' }}>
        {ABOUT.openSource.heading}
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', lineHeight: 1.6, margin: '0 0 24px' }}>
        {ABOUT.openSource.body}
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {ABOUT.openSource.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target={l.external ? '_blank' : undefined}
            rel={l.external ? 'noopener noreferrer' : undefined}
            style={{ color: 'var(--color-primary)', fontWeight: 500 }}
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}
```

Create `apps/landing/components/AboutUs.tsx` (the contact section is added in Task 4; for now it composes the three sections plus an empty `#contact` anchor target so the nav link resolves):

```tsx
import { ABOUT } from '@/lib/data';
import { StorySection } from './about/StorySection';
import { CapabilitiesSection } from './about/CapabilitiesSection';
import { OpenSourceSection } from './about/OpenSourceSection';

export function AboutUs() {
  return (
    <article>
      <header id="about-hero" style={{ padding: '96px 24px 32px', maxWidth: 960, margin: '0 auto' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 12px' }}>
          {ABOUT.hero.eyebrow}
        </p>
        <h1 style={{ fontSize: 'var(--text-display)', lineHeight: 'var(--lh-heading)', letterSpacing: 'var(--tracking-display)', fontWeight: 700, margin: '0 0 16px' }}>
          {ABOUT.hero.title}
        </h1>
        <p className="lead" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-lg)', maxWidth: 640, margin: 0 }}>
          {ABOUT.hero.lead}
        </p>
      </header>
      <StorySection />
      <CapabilitiesSection />
      <OpenSourceSection />
      {/* #contact target — ContactSection mounts here in the next task. */}
      <section id="contact" />
    </article>
  );
}
```

Create `apps/landing/app/about-us/page.tsx` (server component route):

```tsx
import type { Metadata } from 'next';
import { AboutUs } from '@/components/AboutUs';
import { Footer } from '@/components/Footer';
import { TopNav } from '@/components/TopNav';
import { BRAND } from '@/lib/data';

export const metadata: Metadata = {
  title: 'About nanisoft — digital twin of the IT estate',
  description: `${BRAND.tagline} The team, the approach, and how to get in touch.`,
};

export default function Page() {
  return (
    <>
      <a href="#main">Skip to main content</a>
      <TopNav />
      <main id="main">
        <AboutUs />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @nanisoft/landing test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/landing/components/AboutUs.tsx apps/landing/components/about apps/landing/app/about-us apps/landing/tests/about-us.test.tsx
git commit -m "feat(landing): add /about-us page with story, capabilities, open-source sections"
```

---

### Task 4: Contact form section (antd Form + validation + honeypot)

**Files:**
- Create: `apps/landing/components/about/ContactSection.tsx`
- Modify: `apps/landing/components/AboutUs.tsx` (mount the contact section in place of the empty anchor)
- Create: `apps/landing/lib/contact.ts` (zod schema + `submitContact` POST helper)
- Modify: `apps/landing/package.json` (add `zod`)
- Test: `apps/landing/tests/contact-section.test.tsx`

**Interfaces:**
- Produces: `ContactSection` (client component) exporting nothing public beyond its default mount; `submitContact(payload)` in `lib/contact.ts` which `POST`s JSON to `/api/contact` and returns `{ ok: true }` on 200 or `{ ok: false, error }` otherwise. Consumed by `ContactSection`. The zod schema `contactSchema` is exported and reused by the route handler (Task 5) so client and server share one validation rule.

- [ ] **Step 1: Add zod dependency**

```bash
pnpm -F @nanisoft/landing add zod
```

- [ ] **Step 2: Write the failing test**

Create `apps/landing/tests/contact-section.test.tsx`:

```tsx
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ContactSection } from '@/components/about/ContactSection';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe('ContactSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders name, email, message fields and a honeypot', async () => {
    render(
      <ThemeProvider>
        <ContactSection />
      </ThemeProvider>,
    );
    await flushAntd();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    // Honeypot is present but visually hidden + aria-hidden.
    const hp = document.querySelector('input[name="company"]') as HTMLInputElement;
    expect(hp).not.toBeNull();
    expect(hp.getAttribute('aria-hidden')).toBe('true');
    expect(hp.getAttribute('tabindex')).toBe('-1');
  });

  it('submits a valid form to /api/contact and shows a success message', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ContactSection />
      </ThemeProvider>,
    );
    await flushAntd();
    await user.type(screen.getByLabelText(/name/i), 'Priya Raman');
    await user.type(screen.getByLabelText(/email/i), 'priya@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Can the twin model multi-cloud access?');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/contact');
    expect(init?.method).toBe('POST');
    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({ name: 'Priya Raman', email: 'priya@example.com', message: 'Can the twin model multi-cloud access?' });
    expect(body.company).toBe('');
  });

  it('blocks submit when required fields are empty', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ContactSection />
      </ThemeProvider>,
    );
    await flushAntd();
    await user.click(screen.getByRole('button', { name: /send/i }));
    await flushAntd();
    // antd Form shows validation messages and does not call fetch.
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
```

> Note: `@testing-library/user-event` may not be installed. Check `apps/landing/package.json` devDependencies. If absent, install it: `pnpm -F @nanisoft/landing add -D @testing-library/user-event`. Prefer using it (fires real events) over manual `fireEvent.change`.

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm -F @nanisoft/landing test`
Expected: FAIL — `ContactSection` and `lib/contact.ts` do not exist.

- [ ] **Step 4: Implement `lib/contact.ts`**

Create `apps/landing/lib/contact.ts`:

```ts
import { z } from 'zod';

// Shared by the client form (pre-submit guard) and the server route handler
// (authoritative validation). The honeypot `company` must stay empty — a
// non-empty value means a bot filled the hidden field; the server pretends
// success and discards.
export const contactSchema = z.object({
  name: z.string().min(1, 'Required').max(120),
  email: z.string().email('Enter a valid email').max(320),
  message: z.string().min(1, 'Required').max(5000),
  company: z.string().max(0).optional().default(''),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function submitContact(payload: ContactInput): Promise<ContactResult> {
  const res = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.ok) return { ok: true };
  let error = 'Something went wrong. Please try again.';
  try {
    const data = (await res.json()) as { error?: string };
    if (data?.error) error = data.error;
  } catch {
    /* keep default */
  }
  return { ok: false, error };
}
```

- [ ] **Step 5: Implement `ContactSection.tsx`**

Create `apps/landing/components/about/ContactSection.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { App, Button, Form, Input } from 'antd';
import { contactSchema, submitContact, type ContactInput } from '@/lib/contact';

export function ContactSection() {
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const onFinish = async (values: ContactInput) => {
    setSubmitting(true);
    const result = await submitContact(values);
    setSubmitting(false);
    if (result.ok) {
      message.success('Thanks — we’ll be in touch shortly.');
    } else {
      message.error(result.error);
    }
  };

  return (
    <App>
      <section id="contact" style={{ padding: '96px 24px', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 8px' }}>
          Contact us
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', margin: '0 0 24px' }}>
          Want to work with nanisoft, validate an API strategy, or just ask a question about the twin? Send a note.
        </p>
        <Form<ContactInput>
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          {/* Honeypot — hidden from users and AT; a non-empty value trips the trap. */}
          <div aria-hidden style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
            <Form.Item name="company" style={{ margin: 0 }}>
              <Input name="company" tabIndex={-1} aria-hidden autoComplete="off" />
            </Form.Item>
          </div>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Required' }]}>
            <Input autoComplete="name" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Required' }, { type: 'email', message: 'Enter a valid email' }]}>
            <Input type="email" autoComplete="email" />
          </Form.Item>
          <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Required' }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>Send</Button>
        </Form>
      </section>
    </App>
  );
}
```

Then mount it in `apps/landing/components/AboutUs.tsx` — replace the empty `<section id="contact" />` with `<ContactSection />`, and add the import:

```tsx
import { ContactSection } from './about/ContactSection';
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm -F @nanisoft/landing test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/landing/package.json apps/landing/lib/contact.ts apps/landing/components/about/ContactSection.tsx apps/landing/components/AboutUs.tsx apps/landing/tests/contact-section.test.tsx pnpm-lock.yaml
git commit -m "feat(landing): contact form section with zod validation and honeypot"
```

---

### Task 5: Contact API route — zod + D1 + Resend

**Files:**
- Create: `apps/landing/app/api/contact/route.ts`
- Create: `apps/landing/tests/contact-api.test.ts`
- Modify: `apps/landing/wrangler.jsonc`

**Interfaces:**
- Consumes: `contactSchema` from `@/lib/contact` (Task 4); `getCloudflareContext` from `@opennextjs/cloudflare` (already a devDep). Expects `env.CONTACT_DB` (D1), `env.RESEND_API_KEY` (secret), `env.CONTACT_NOTIFY_FROM`, `env.CONTACT_NOTIFY_TO` (vars).
- Produces: `POST` handler returning `200 {ok:true}` (valid or honeypot-tripped), `422 {error:'Invalid'}` (validation fail), `400 {error:'Bad request'}` (unparseable JSON).

- [ ] **Step 1: Write the failing test**

Create `apps/landing/tests/contact-api.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the OpenNext Cloudflare context so the handler never loads the real
// adapter (which needs the Workers runtime). The mock is reset per test so
// inserted rows / fetch calls don't leak.
const insertMock = vi.fn();
const fetchMock = vi.fn();
const env = {
  CONTACT_DB: {
    prepare: (_sql: string) => ({
      bind: (...args: unknown[]) => ({ run: async () => { insertMock(...args); return {}; } }),
    }),
  },
  RESEND_API_KEY: 'test-key',
  CONTACT_NOTIFY_FROM: 'contact@nanisoft.com',
  CONTACT_NOTIFY_TO: 'hello@nanisoft.com',
};

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => ({ env }),
}));

// `globalThis.fetch` is the Resend call. Default to a success response.
beforeEach(() => {
  insertMock.mockClear();
  fetchMock.mockClear();
  fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});

async function post(body: unknown) {
  const { POST } = await import('@/app/api/contact/route');
  const request = new Request('https://nanisoft.com/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(request);
}

describe('POST /api/contact', () => {
  it('stores a valid submission in D1 and emails it via Resend', async () => {
    const res = await post({ name: 'Priya Raman', email: 'priya@example.com', message: 'Hello', company: '' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(insertMock).toHaveBeenCalledWith('Priya Raman', 'priya@example.com', 'Hello', expect.any(String));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    const payload = JSON.parse(init.body as string);
    expect(payload.from).toBe('contact@nanisoft.com');
    expect(payload.to).toEqual(['hello@nanisoft.com']);
    expect(payload.text).toContain('Priya Raman');
  });

  it('pretends success for a honeypot-tripped submission without storing or emailing', async () => {
    const res = await post({ name: 'Bot', email: 'bot@example.com', message: 'spam', company: 'SEO Co' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(insertMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid input with 422', async () => {
    const res = await post({ name: '', email: 'not-an-email', message: '', company: '' });
    expect(res.status).toBe(422);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('rejects unparseable JSON with 400', async () => {
    const request = new Request('https://nanisoft.com/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const { POST } = await import('@/app/api/contact/route');
    const res = await POST(request);
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -F @nanisoft/landing test`
Expected: FAIL — route module not found.

- [ ] **Step 3: Implement the route handler**

Create `apps/landing/app/api/contact/route.ts`:

```ts
import { contactSchema } from '@/lib/contact';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid' }, { status: 422 });
  }

  // Honeypot: a non-empty `company` means a bot filled the hidden field.
  // Pretend success and discard — do not reveal the trap.
  if (parsed.data.company) {
    return Response.json({ ok: true });
  }

  const { env } = getCloudflareContext();
  const { name, email, message } = parsed.data;
  const createdAt = new Date().toISOString();

  await env.CONTACT_DB.prepare(
    'INSERT INTO submissions (name, email, message, created_at) VALUES (?, ?, ?, ?)',
  )
    .bind(name, email, message, createdAt)
    .run();

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_NOTIFY_FROM,
      to: [env.CONTACT_NOTIFY_TO],
      subject: `New contact submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    }),
  });

  return Response.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -F @nanisoft/landing test`
Expected: PASS.

- [ ] **Step 5: Wire D1 + Resend into wrangler.jsonc**

Edit `apps/landing/wrangler.jsonc` to add the `d1_databases` binding and the non-secret `vars`. The D1 `database_id` is created in Step 6; leave a placeholder and fill it in there. `RESEND_API_KEY` is a **secret** (never committed) — set with `wrangler secret put`.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "nanisoft",
  "compatibility_date": "2026-08-01",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "CONTACT_DB",
      "database_name": "nanisoft-contact",
      "database_id": "REPLACE_WITH_D1_DATABASE_ID"
    }
  ],
  "vars": {
    "CONTACT_NOTIFY_FROM": "contact@nanisoft.com",
    "CONTACT_NOTIFY_TO": "hello@nanisoft.com"
  }
}
```

- [ ] **Step 6: Create the D1 database + schema (manual, one-time)**

Run from `apps/landing` (the user runs these — they touch the Cloudflare account):

```bash
wrangler d1 create nanisoft-contact
# paste the printed database_id into wrangler.jsonc (database_id field) and commit it
wrangler d1 execute nanisoft-contact --remote --command "CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL);"
wrangler d1 execute nanisoft-contact --local --command "CREATE TABLE IF NOT EXISTS submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL);"
wrangler secret put RESEND_API_KEY   # paste the Resend API key
```

Record in the commit message that `database_id` was filled and the secret set.

- [ ] **Step 7: Commit**

```bash
git add apps/landing/app/api/contact/route.ts apps/landing/tests/contact-api.test.ts apps/landing/wrangler.jsonc
git commit -m "feat(landing): contact API route (D1 store + Resend notify) with zod validation"
```

---

### Task 6: Verification, lint, build, and overflow e2e

**Files:** none (verification only)

- [ ] **Step 1: Run the full landing test suite**

Run: `pnpm -F @nanisoft/landing test`
Expected: PASS — all existing tests plus the five new test files. Confirm `page.test.tsx` now asserts 4 playground links.

- [ ] **Step 2: Lint**

Run: `pnpm -F @nanisoft/landing lint`
Expected: no errors. Fix any issues inline.

- [ ] **Step 3: Production build**

Run: `pnpm -F @nanisoft/landing build`
Expected: success. Confirm `/about-us` and `/api/contact` appear in the build output route list, and `/about-us` is statically rendered (it is a server component with no dynamic data).

- [ ] **Step 4: Cloudflare build**

Run: `pnpm -F @nanisoft/landing cloudflare-build`
Expected: OpenNext build succeeds (the D1 binding is only needed at runtime, not build; `getCloudflareContext` is not invoked at build for this static + on-demand route).

- [ ] **Step 5: Overflow e2e**

Run: `pnpm -F @nanisoft/landing test:overflow`
Expected: PASS. If a matrix fails because the nav now wraps differently at narrow widths, adjust the `.top-nav-links` responsive gap in `TopNav.tsx` (do not change the overflow law expectations — the header is allowed to wrap).

- [ ] **Step 6: Manual smoke (user)**

Ask the user to: run `pnpm -F @nanisoft/landing dev`, open `/about-us`, submit the form, and confirm a row lands in D1 (`wrangler d1 execute nanisoft-contact --local --command "SELECT * FROM submissions;"`) and a Resend email is sent. Then navigate the homepage nav: hover/click Product and Docs dropdowns, confirm About/Contact scroll/navigate correctly.

- [ ] **Step 7: Commit any verification fixes + final commit**

```bash
git add -A
git commit -m "chore(landing): verification fixes for nav redesign + about-us + contact"
```

---

## Self-Review (completed)

**Spec coverage (WS1 only):** nav redesign (Product/Docs dropdowns, Blog/About/Contact, playground pill removed from header) → Task 2; playground pill kept elsewhere → explicitly untouched (Task 2 only edits header + the CTA-count test). About-us sections (story, capabilities, open-source, contact) → Tasks 3 + 4. Contact form on existing landing worker (D1 + Resend) → Tasks 4 + 5. WS2/WS3 (Nextra docs/blog) are out of scope for this plan — they require Spike 1 first and get their own plan.

**Placeholder scan:** the only intentional placeholder is `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc`, filled by a concrete command in Task 5 Step 6. No `TODO`/`TBD`. All code blocks contain real code.

**Type consistency:** `NavItem` / `NavGroup` / `NavConfig` (Task 1) used unchanged in Task 2. `contactSchema` / `ContactInput` / `submitContact` / `ContactResult` (Task 4) used unchanged in Task 5. `getCloudflareContext().env.CONTACT_DB` + `env.RESEND_API_KEY` + `env.CONTACT_NOTIFY_FROM/TO` named consistently across Task 5's test, handler, and wrangler config.

**Open note:** `@testing-library/user-event` may need adding (flagged inline in Task 4 Step 2). `zod` is added in Task 4 Step 1. `@opennextjs/cloudflare` is already a devDep. Resend is called via `fetch` (no SDK dep).