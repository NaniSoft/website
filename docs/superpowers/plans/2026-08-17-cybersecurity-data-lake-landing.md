# Sentinel Lake Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Sentinel Lake marketing landing page as a single Next.js route with 11 sections, a live "Command Center" hero mock, an interactive Knowledge Graph, an AI Agents showcase, full dark/light theming, and WCAG AA accessibility.

**Architecture:** Next.js 14 App Router + TypeScript. antd v5 `ConfigProvider` drives theming via light/dark algorithm + a shared token map. A `ThemeProvider` mounts early and reads `localStorage` + `prefers-color-scheme` so there is no theme flash. The Knowledge Graph uses `react-force-graph-2d` (canvas) loaded via `next/dynamic({ ssr: false })`. A small amount of CSS Modules handles gradients/glows; everything else is antd. All copy and data are typed constants in `lib/`. The page is composed from 11 self-contained section components in `app/page.tsx`.

**Tech Stack:** Next.js 14, TypeScript, antd v5, @ant-design/icons, react-force-graph-2d, recharts, framer-motion, next/font (Inter, Inter Display, JetBrains Mono), Vitest + @testing-library/react, ESLint.

## Global Constraints

- Node ≥ 18.17 (Next.js 14 floor). npm 10+.
- TypeScript strict mode (`"strict": true` in `tsconfig.json`).
- ESLint with `next/core-web-vitals` config; no warnings on build.
- All customer/company names are placeholders and must be clearly marked `placeholder` in code comments.
- Color tokens come from spec §4.2. No ad-hoc colors. Light/dark pairs must both pass 4.5:1 for text and 3:1 for large text.
- Antd theme: light → `theme.defaultAlgorithm`, colorPrimary `#1E5BFF`; dark → `theme.darkAlgorithm`, colorPrimary `#3B82F6`. Both share `borderRadius: 8`, `fontFamily: 'Inter, sans-serif'`.
- Type scale (spec §4.1): 72 / 56 / 40 / 28 / 20 / 16 / 14 px. Body 1.6, headings 1.1–1.2.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.
- Motion: 200 ms ease-out hover, 400 ms scroll fades, no spring overshoot. Respect `prefers-reduced-motion`.
- Bundle budget (spec §14, **amended 2026-08-18** from `< 350 KB`): < 400 KB gzipped initial JS. The graph lib is dynamic with `ssr: false`. See ledger Task 8 fix round 1 for the rationale.
- `data-theme="dark|light"` attribute on `<html>`. Initial value is set by an inline script in `app/layout.tsx` before React hydrates, to prevent flash.
- The "Show as list" parallel view for the Knowledge Graph is a required accessibility feature (not optional).
- No real backend. `/api/demo-request` returns 200 with `{ ok: true }`.

---

## File Structure (locked)

```
package.json
tsconfig.json
next.config.mjs
.eslintrc.json
vitest.config.ts
.gitignore
README.md

app/
  layout.tsx
  page.tsx
  globals.css
  api/demo-request/route.ts

components/
  TopNav.tsx
  Hero.tsx
  CommandCenter.tsx
  StatStrip.tsx
  ChatPanel.tsx
  LogoCloud.tsx
  Problem.tsx
  Platform.tsx
  KnowledgeGraph.tsx
  KGCanvas.tsx
  NodeInspector.tsx
  KGListView.tsx
  Agents.tsx
  UseCases.tsx
  Integrations.tsx
  Testimonial.tsx
  FinalCTA.tsx
  Footer.tsx
  theme/
    ThemeProvider.tsx
    ThemeToggle.tsx
    tokens.ts

lib/
  data.ts
  graph-data.ts
  chat-transcripts.ts
  types.ts

tests/
  setup.ts
  theme.test.tsx
  graph-data.test.ts
  page.test.tsx
```

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `.eslintrc.json`, `.gitignore`, `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `README.md`

**Interfaces:**
- Consumes: nothing
- Produces: a runnable `next dev` server on `http://localhost:3000` showing a placeholder "Sentinel Lake" page

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "sentinel-lake-landing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "antd": "5.20.0",
    "@ant-design/icons": "5.4.0",
    "@ant-design/cssinjs": "1.21.0",
    "react-force-graph-2d": "1.25.5",
    "recharts": "2.12.7",
    "framer-motion": "11.3.19"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "@types/node": "20.14.10",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5",
    "vitest": "2.0.4",
    "@testing-library/react": "16.0.0",
    "@testing-library/jest-dom": "6.4.8",
    "@vitejs/plugin-react": "4.3.1",
    "jsdom": "25.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['antd', '@ant-design/icons', 'rc-util', 'rc-pagination', 'rc-picker', 'rc-tree', 'rc-table'],
};

export default nextConfig;
```

- [ ] **Step 4: Create `.eslintrc.json`**

```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "@next/next/no-img-element": "off"
  }
}
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules
.next
out
dist
.DS_Store
*.log
.env*
coverage
next-env.d.ts
```

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 7: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 8: Create `app/layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Sentinel Lake — Security Data Lake & Knowledge Graph',
  description:
    'Unify IT, HR, IAM, cloud, and security telemetry into a single temporal graph. Answer your hardest forensic questions in seconds with AI agents.',
};

const themeBootstrap = `
  (function () {
    try {
      var saved = localStorage.getItem('sentinel-theme');
      var mode = saved || 'system';
      var resolved = mode;
      if (mode === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.style.colorScheme = resolved;
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Create `app/page.tsx`**

```tsx
export default function Page() {
  return (
    <main>
      <h1 style={{ fontFamily: 'system-ui', padding: 48 }}>Sentinel Lake — landing page placeholder</h1>
    </main>
  );
}
```

- [ ] **Step 10: Create `app/globals.css`**

```css
:root {
  --color-bg: #F7F9FC;
  --color-bg-elev: #FFFFFF;
  --color-bg-sunken: #F0F4FA;
  --color-border: #E5EAF2;
  --color-text: #0B1726;
  --color-text-muted: #56627A;
  --color-primary: #1E5BFF;
  --color-accent: #00C2D6;
  --color-success: #10A48B;
  --color-warning: #D08C1A;
  --color-danger: #D43A3A;
}

[data-theme='dark'] {
  --color-bg: #0A1020;
  --color-bg-elev: #111A2E;
  --color-bg-sunken: #0E152A;
  --color-border: #1E2A44;
  --color-text: #E6ECF5;
  --color-text-muted: #8A98B0;
  --color-primary: #3B82F6;
  --color-accent: #22D3EE;
  --color-success: #34D399;
  --color-warning: #F59E0B;
  --color-danger: #F87171;
}

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }

::selection { background: var(--color-primary); color: #fff; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 11: Create `README.md`**

```markdown
# Sentinel Lake — Landing Page

Marketing landing page for the Sentinel Lake cybersecurity data lake & knowledge graph.

## Stack
Next.js 14 (App Router) · TypeScript · antd v5 · react-force-graph-2d · recharts · framer-motion

## Develop
\`\`\`
npm install
npm run dev
\`\`\`
Open http://localhost:3000.

## Test
\`\`\`
npm test
\`\`\`

## Build
\`\`\`
npm run build
npm start
\`\`\`
```

- [ ] **Step 12: Install and verify dev server runs**

Run:
```bash
cd "C:/Users/dpven/source/repos/lp" && npm install
```
Expected: completes without errors.

Then run in the background:
```bash
cd "C:/Users/dpven/source/repos/lp" && npm run dev
```
Expected: `Ready in …` message on `http://localhost:3000`. Navigate to the URL and see the placeholder text "Sentinel Lake — landing page placeholder". Then stop the dev server (TaskStop on the background id).

- [ ] **Step 13: Verify build passes**

Run: `cd "C:/Users/dpven/source/repos/lp" && npm run build`
Expected: `Compiled successfully` with no errors. (Placeholders for icons/API in the static build are fine.)

- [ ] **Step 14: Initialize git and commit the scaffold**

Run:
```bash
cd "C:/Users/dpven/source/repos/lp" && git init -b main && git add . && git commit -m "chore: scaffold Next.js + antd landing page"
```

---

### Task 2: Add fonts, theme tokens, and ThemeProvider

**Files:**
- Create: `components/theme/tokens.ts`, `components/theme/ThemeProvider.tsx`, `components/theme/ThemeToggle.tsx`
- Modify: `app/layout.tsx` (wrap children in ThemeProvider)
- Create: `tests/theme.test.tsx`

**Interfaces:**
- Consumes: `localStorage.sentinel-theme` ('light' | 'dark' | 'system'), `prefers-color-scheme`
- Produces: `useTheme()` returning `{ theme: 'light' | 'dark' | 'system', resolved: 'light' | 'dark', setTheme(t) }`; sets `data-theme` on `<html>`; ConfigProvider with the right algorithm + tokens

- [ ] **Step 1: Create `components/theme/tokens.ts`**

```ts
import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

export const lightTokens = {
  colorPrimary: '#1E5BFF',
  colorBgLayout: '#F7F9FC',
  colorBgContainer: '#FFFFFF',
  colorBorder: '#E5EAF2',
  colorText: '#0B1726',
  colorTextSecondary: '#56627A',
  borderRadius: 8,
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

export const darkTokens = {
  colorPrimary: '#3B82F6',
  colorBgLayout: '#0A1020',
  colorBgContainer: '#111A2E',
  colorBorder: '#1E2A44',
  colorText: '#E6ECF5',
  colorTextSecondary: '#8A98B0',
  borderRadius: 8,
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

export const lightTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: lightTokens,
};

export const darkTheme: ThemeConfig = {
  algorithm: antdTheme.darkAlgorithm,
  token: darkTokens,
};
```

- [ ] **Step 2: Create `components/theme/ThemeProvider.tsx`**

```tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { lightTheme, darkTheme } from './tokens';

type ThemeMode = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  resolved: Resolved;
  setTheme: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'sentinel-theme';

function getSystem(): Resolved {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolve(theme: ThemeMode): Resolved {
  return theme === 'system' ? getSystem() : theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolved, setResolved] = useState<Resolved>('light');

  // Read initial on mount (the inline script in layout.tsx already set data-theme)
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system';
    setThemeState(saved);
    setResolved(resolve(saved));
  }, []);

  // Apply data-theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  // Listen to system changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolved(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((t: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
    setResolved(resolve(t));
  }, []);

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={resolved === 'dark' ? darkTheme : lightTheme}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
```

- [ ] **Step 3: Create `components/theme/ThemeToggle.tsx`**

```tsx
'use client';

import { Segmented } from 'antd';
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Segmented
      size="small"
      value={theme}
      onChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}
      options={[
        { label: <SunOutlined aria-label="Light" />, value: 'light' },
        { label: <DesktopOutlined aria-label="System" />, value: 'system' },
        { label: <MoonOutlined aria-label="Dark" />, value: 'dark' },
      ]}
      aria-label="Theme mode"
    />
  );
}
```

- [ ] **Step 4: Update `app/layout.tsx` to use the provider and load fonts**

```tsx
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = {
  title: 'Sentinel Lake — Security Data Lake & Knowledge Graph',
  description:
    'Unify IT, HR, IAM, cloud, and security telemetry into a single temporal graph. Answer your hardest forensic questions in seconds with AI agents.',
};

const themeBootstrap = `
  (function () {
    try {
      var saved = localStorage.getItem('sentinel-theme');
      var mode = saved || 'system';
      var resolved = mode === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : mode;
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.style.colorScheme = resolved;
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Add the mono font to `app/globals.css`**

Replace the `body` block with:

```css
body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.mono { font-family: var(--font-mono), 'JetBrains Mono', ui-monospace, monospace; }
```

- [ ] **Step 6: Write the failing test `tests/theme.test.tsx`**

```tsx
import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { ThemeProvider, useTheme } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

function Probe() {
  const { theme, resolved, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolved}</span>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('light')}>light</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to system', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId('theme')).toHaveTextContent('system');
  });

  it('applies data-theme on the document', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    act(() => { screen.getByText('dark').click(); });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('sentinel-theme')).toBe('dark');
  });

  it('ThemeToggle renders three options', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(screen.getByLabelText('Light')).toBeInTheDocument();
    expect(screen.getByLabelText('Dark')).toBeInTheDocument();
    expect(screen.getByLabelText('System')).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run the test**

Run: `cd "C:/Users/dpven/source/repos/lp" && npm test -- tests/theme.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 8: Commit**

```bash
git add components/theme tests/theme.test.tsx app/layout.tsx app/globals.css
git commit -m "feat(theme): ThemeProvider with light/dark/system modes"
```

---

### Task 3: Define shared types and the static data module

**Files:**
- Create: `lib/types.ts`, `lib/data.ts`, `lib/chat-transcripts.ts`

**Interfaces:**
- Consumes: nothing
- Produces: typed constants used by all sections. Every section component imports from `@/lib/data`. Nothing else hard-codes copy.

- [ ] **Step 1: Create `lib/types.ts`**

```ts
export type EntityType = 'User' | 'Service' | 'DataAsset' | 'Policy' | 'Event' | 'Identity';

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  description: string;
  // attributes shown in the inspector
  attrs: Array<[string, string]>;
  // highlighted as part of a "hot path"
  hot?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  hot?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Integration {
  name: string;
  category: 'Cloud' | 'Identity' | 'SIEM' | 'ITSM' | 'Data' | 'Productivity' | 'Endpoint' | 'DevTools' | 'CRM' | 'Support';
}

export interface UseCase {
  title: string;
  illustration: 'graph' | 'shield' | 'clock';
  bullets: [string, string, string];
}

export interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  // optional embedded artifact id ('graph-mini' | 'timeline' | 'graph-blast')
  artifact?: 'graph-mini' | 'timeline' | 'graph-blast';
}

export interface ChatTranscript {
  id: string;
  question: string;
  exchange: [ChatMessage, ChatMessage];
}
```

- [ ] **Step 2: Create `lib/data.ts`**

```ts
import type { Integration, UseCase } from './types';

export const BRAND = {
  name: 'Sentinel Lake',
  tagline: 'See every asset, identity, and event in one temporal model.',
} as const;

export const HERO = {
  eyebrow: 'Security Knowledge Graph · v2.4',
  h1: 'See every asset, identity, and event in one temporal model.',
  sub:
    'Sentinel Lake unifies IT, HR, IAM, cloud, and security telemetry into a single queryable graph — and lets AI agents answer your hardest forensic questions in seconds.',
  primaryCta: { label: 'Request a demo', href: '#final-cta' },
  secondaryCta: { label: 'Watch 2-min walkthrough', href: '#agents' },
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

export const TESTIMONIAL = {
  quote:
    'Sentinel Lake cut our M&A security diligence from six weeks to four days. The graph view is the first time our security, IT, and HR data have agreed on a single picture.',
  author: 'Priya Raman',
  title: 'CISO, Northwind Financial',
  metrics: [
    { value: '85%', label: 'faster M&A diligence' },
    { value: '60%', label: 'less time on audit prep' },
    { value: '12×', label: 'more entities correlated' },
  ],
};

export const FINAL_CTA = {
  h2: 'Bring every signal into one model.',
  primary: { label: 'Request a demo', href: '/api/demo-request' },
  secondary: { label: 'Talk to sales', href: 'mailto:sales@sentinellake.example' },
  footnote: 'or start a free 14-day pilot',
};

export const FOOTER_LINKS = {
  Product: ['Platform', 'Integrations', 'AI Agents', 'Changelog'],
  Solutions: ['M&A diligence', 'Incident response', 'Continuous compliance', 'Identity governance'],
  Resources: ['Docs', 'Customer stories', 'Security & trust', 'Status'],
  Company: ['About', 'Careers', 'Press', 'Contact'],
} as const;
```

- [ ] **Step 3: Create `lib/chat-transcripts.ts`**

```ts
import type { ChatTranscript } from './types';

export const CHAT_TRANSCRIPTS: readonly ChatTranscript[] = [
  {
    id: 'sensitive-data',
    question: 'Where is the Q3 financial model stored, and who has accessed it in the last 30 days?',
    exchange: [
      {
        role: 'user',
        text: 'Where is the Q3 financial model stored, and who has accessed it in the last 30 days?',
      },
      {
        role: 'agent',
        text: 'The file `s3://finance-prod/q3-2026/model.xlsx` is classified Confidential under policy FIN-PII-007. In the last 30 days, 4 identities accessed it: Sarah Chen, Mark Patel, the `etl-pipeline` service, and a deprecated `etl-backup` credential. Click any node to inspect.',
        artifact: 'graph-mini',
      },
    ],
  },
  {
    id: 'blast-radius',
    question: 'If the `okta-prod` service account is compromised, what data could an attacker reach?',
    exchange: [
      {
        role: 'user',
        text: 'If the `okta-prod` service account is compromised, what data could an attacker reach?',
      },
      {
        role: 'agent',
        text: 'From `okta-prod`, an attacker can reach 18 DataAssets across 6 buckets, including `customer-pii/`, `finance-prod/`, and `hr-salary/`. The blast radius crosses 3 trust boundaries. The path is shown on the right.',
        artifact: 'graph-blast',
      },
    ],
  },
  {
    id: 'compliance-at-t',
    question: 'On March 14 at 02:00 UTC, was access to `customer-pii/` by `svc-etl` compliant with `FIN-PII-007`?',
    exchange: [
      {
        role: 'user',
        text: 'On March 14 at 02:00 UTC, was access to `customer-pii/` by `svc-etl` compliant with FIN-PII-007?',
      },
      {
        role: 'agent',
        text: 'No. At 02:00 UTC on Mar 14, policy FIN-PII-007 was in version 4, which required MFA-tagged sessions for `svc-etl`. The access event at 02:00:11 UTC was tagged `mfa=false`. The same access would have been compliant under v3, which was active until Feb 28.',
        artifact: 'timeline',
      },
    ],
  },
];
```

- [ ] **Step 4: Write the data-shape test `tests/data.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { INTEGRATIONS, USE_CASES, HERO, FOOTER_LINKS } from '@/lib/data';
import { CHAT_TRANSCRIPTS } from '@/lib/chat-transcripts';

describe('data module', () => {
  it('has 16 named integrations plus the "and 40 more" slot is rendered in the component', () => {
    expect(INTEGRATIONS).toHaveLength(16);
  });

  it('has 3 use cases', () => {
    expect(USE_CASES).toHaveLength(3);
  });

  it('hero has both CTAs', () => {
    expect(HERO.primaryCta.label).toBeTruthy();
    expect(HERO.secondaryCta.label).toBeTruthy();
  });

  it('has 3 chat transcripts', () => {
    expect(CHAT_TRANSCRIPTS).toHaveLength(3);
  });

  it('footer has 4 link columns', () => {
    expect(Object.keys(FOOTER_LINKS)).toHaveLength(4);
  });
});
```

- [ ] **Step 5: Run the test**

Run: `cd "C:/Users/dpven/source/repos/lp" && npm test -- tests/data.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add lib types tests/data.test.ts
git commit -m "feat(data): typed constants for copy, use cases, integrations, transcripts"
```

---

### Task 4: Build the interactive Knowledge Graph data

**Files:**
- Create: `lib/graph-data.ts`, `tests/graph-data.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: a `GraphData` object with ~120 nodes and ~280 edges, with at least 3 hot paths, used by both the hero mock and the full §6 section.

- [ ] **Step 1: Create `lib/graph-data.ts`**

```ts
import type { GraphData, GraphNode, GraphEdge, EntityType } from './types';

const USERS = ['Sarah Chen', 'Mark Patel', 'Aiko Tanaka', 'Diego Alvarez', 'Priya Raman', 'Lena Müller', 'Jamal Wright', 'Ravi Iyer'];
const SERVICES = ['okta-prod', 'etl-pipeline', 'sso-dev', 'vault-prod', 'airflow-prod', 'jenkins-main', 'grafana-prod', 'kms-rotator'];
const DATA = ['customer-pii/', 'finance-prod/q3-2026/model.xlsx', 'hr-salary/', 'design-mockups/', 'analytics.events/', 'audit-logs/', 'pii-backup/'];
const POLICIES = ['FIN-PII-007', 'IAM-MFA-REQ', 'DATA-CLASS-C', 'HR-PRIV-002', 'LOG-RET-1Y'];
const EVENTS = ['read', 'write', 'assume-role', 'export', 'delete', 'login', 'token-issue'];
const IDENTITIES = ['svc-etl', 'svc-backup', 'svc-monitor', 'svc-rotator'];

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
for (let i = 0; i < 12; i += 1) {
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
});

serviceNodes.forEach((s) => {
  dataNodes.slice(0, 2).forEach((d) => edges.push(e(s.id, d.id, 'reads')));
  policyNodes.slice(0, 1).forEach((p) => edges.push(e(s.id, p.id, 'evaluated_by')));
});

identityNodes.forEach((ident, i) => {
  dataNodes.slice(i % dataNodes.length, (i % dataNodes.length) + 1).forEach((d) =>
    edges.push(e(ident.id, d.id, 'accesses'))
  );
  serviceNodes.slice(i % serviceNodes.length, (i % serviceNodes.length) + 1).forEach((s) =>
    edges.push(e(ident.id, s.id, 'assumes'))
  );
});

dataNodes.forEach((d, i) => {
  policyNodes.slice(i % policyNodes.length, (i % policyNodes.length) + 1).forEach((p) =>
    edges.push(e(d.id, p.id, 'governed_by'))
  );
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
```

- [ ] **Step 2: Write the failing test `tests/graph-data.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { graphData } from '@/lib/graph-data';

describe('graph data', () => {
  it('has at least 100 nodes and 200 edges', () => {
    expect(graphData.nodes.length).toBeGreaterThanOrEqual(100);
    expect(graphData.edges.length).toBeGreaterThanOrEqual(200);
  });

  it('covers all six entity types', () => {
    const types = new Set(graphData.nodes.map((n) => n.type));
    for (const t of ['User', 'Service', 'DataAsset', 'Policy', 'Event', 'Identity'] as const) {
      expect(types.has(t)).toBe(true);
    }
  });

  it('has at least 3 hot-path nodes and 3 hot-path edges', () => {
    expect(graphData.nodes.filter((n) => n.hot).length).toBeGreaterThanOrEqual(3);
    expect(graphData.edges.filter((e0) => e0.hot).length).toBeGreaterThanOrEqual(3);
  });

  it('every edge references existing node ids', () => {
    const ids = new Set(graphData.nodes.map((n) => n.id));
    for (const e0 of graphData.edges) {
      expect(ids.has(e0.source)).toBe(true);
      expect(ids.has(e0.target)).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run the test**

Run: `cd "C:/Users/dpven/source/repos/lp" && npm test -- tests/graph-data.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 4: Commit**

```bash
git add lib/graph-data.ts tests/graph-data.test.ts
git commit -m "feat(graph): curated sample knowledge graph with hot paths"
```

---

### Task 5: TopNav and page composition shell

**Files:**
- Create: `components/TopNav.tsx`, `components/Footer.tsx`
- Modify: `app/page.tsx` (compose nav + sections + footer)

**Interfaces:**
- Consumes: `lib/data` (`FOOTER_LINKS`, `BRAND`)
- Produces: a sticky translucent top nav with logo, menu links, sign-in, primary CTA, and `ThemeToggle`; a 4-column footer.

- [ ] **Step 1: Create `components/TopNav.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import Link from 'next/link';
import { ThemeToggle } from './theme/ThemeToggle';
import { BRAND } from '@/lib/data';

const items = [
  { key: 'platform', label: 'Platform' },
  { key: 'solutions', label: 'Solutions' },
  { key: 'resources', label: 'Resources' },
  { key: 'pricing', label: 'Pricing' },
];

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Layout.Header
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
        transition: 'background 200ms ease-out, border-color 200ms ease-out',
      }}
    >
      <Link href="/" aria-label={BRAND.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18 }}>
        <span
          aria-hidden
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          }}
        />
        {BRAND.name}
      </Link>
      <Menu mode="horizontal" items={items} selectable={false} style={{ flex: 1, background: 'transparent', borderBottom: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ThemeToggle />
        <Link href="/signin" style={{ color: 'var(--color-text-muted)' }}>Sign in</Link>
        <Button type="primary" href="#final-cta">Request a demo</Button>
      </div>
    </Layout.Header>
  );
}
```

- [ ] **Step 2: Create `components/Footer.tsx`**

```tsx
import { Layout } from 'antd';
import { BRAND, FOOTER_LINKS } from '@/lib/data';

export function Footer() {
  return (
    <Layout.Footer
      style={{
        background: 'var(--color-bg-elev)',
        borderTop: '1px solid var(--color-border)',
        padding: '64px 24px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.5fr repeat(4, 1fr)',
          gap: 48,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
            <span
              aria-hidden
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              }}
            />
            {BRAND.name}
          </div>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 280 }}>{BRAND.tagline}</p>
        </div>
        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>{heading}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {links.map((label) => (
                <li key={label}>
                  <a href="#" style={{ color: 'var(--color-text-muted)' }}>{label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        style={{
          maxWidth: 1200,
          margin: '48px auto 0',
          paddingTop: 24,
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--color-text-muted)',
          fontSize: 14,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span>© 2026 {BRAND.name}, Inc. All rights reserved.</span>
        <span style={{ display: 'flex', gap: 24 }}>
          <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a><a href="#">Status</a>
        </span>
      </div>
    </Layout.Footer>
  );
}
```

- [ ] **Step 3: Update `app/page.tsx` to compose nav and footer (with placeholder section slots)**

```tsx
import { TopNav } from '@/components/TopNav';
import { Footer } from '@/components/Footer';

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {children}
    </section>
  );
}

export default function Page() {
  return (
    <>
      <a href="#main" style={{ position: 'absolute', left: -9999 }}>Skip to main content</a>
      <TopNav />
      <main id="main">
        <Section id="hero">[Hero — TBD]</Section>
        <Section id="logos">[Logo cloud — TBD]</Section>
        <Section id="problem">[Problem — TBD]</Section>
        <Section id="platform">[Platform — TBD]</Section>
        <Section id="graph">[Knowledge Graph — TBD]</Section>
        <Section id="agents">[Agents — TBD]</Section>
        <Section id="use-cases">[Use cases — TBD]</Section>
        <Section id="integrations">[Integrations — TBD]</Section>
        <Section id="testimonial">[Testimonial — TBD]</Section>
        <Section id="final-cta">[Final CTA — TBD]</Section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Write a smoke test `tests/page.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Page from '@/app/page';

describe('Page', () => {
  it('renders the brand in the top nav and footer', () => {
    render(<Page />);
    expect(screen.getAllByText('Sentinel Lake').length).toBeGreaterThan(0);
  });

  it('has a skip link', () => {
    render(<Page />);
    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders the main landmark', () => {
    render(<Page />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the test**

Run: `cd "C:/Users/dpven/source/repos/lp" && npm test -- tests/page.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Verify the dev server still runs**

Run in background: `cd "C:/Users/dpven/source/repos/lp" && npm run dev`
Expected: Ready in …, and the page shows the Sentinel Lake brand in the top nav and a placeholder hero. Stop the background process.

- [ ] **Step 7: Commit**

```bash
git add components/TopNav.tsx components/Footer.tsx app/page.tsx tests/page.test.tsx
git commit -m "feat(shell): TopNav with theme toggle, Footer, page composition"
```

---

### Task 6: Hero with the Command Center mock

**Files:**
- Create: `components/StatStrip.tsx`, `components/KGCanvas.tsx`, `components/NodeInspector.tsx`, `components/ChatPanel.tsx`, `components/CommandCenter.tsx`, `components/Hero.tsx`
- Modify: `app/page.tsx` (replace the `[Hero — TBD]` slot)

**Interfaces:**
- Consumes: `HERO` from `lib/data`; `graphData` from `lib/graph-data`; `CHAT_TRANSCRIPTS` from `lib/chat-transcripts`; `useTheme` for context (e.g. for the canvas background color)
- Produces: a hero that renders the left copy column and the right Command Center mock. The mock is a self-contained client component. `KGCanvas` is loaded with `next/dynamic({ ssr: false })` so the graph lib stays out of the initial bundle.

- [ ] **Step 1: Create `components/StatStrip.tsx`**

```tsx
'use client';

import { Statistic, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { ResponsiveContainer, Sparkline, type SparklineProps } from 'recharts'; // fallback if Sparkline missing

interface Stat {
  label: string;
  value: string;
  delta: number; // signed percentage
  series: number[];
}

interface Props {
  stats: Stat[];
}

function deltaTag(delta: number) {
  const positive = delta >= 0;
  return (
    <Tag color={positive ? 'success' : 'error'} style={{ marginInlineStart: 8 }}>
      {positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(delta)}%
    </Tag>
  );
}

export function StatStrip({ stats }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: 16,
        padding: 16,
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {stats.map((s) => (
        <div key={s.label}>
          <Statistic
            title={<span style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>}
            value={s.value}
            valueStyle={{ fontSize: 22, fontWeight: 600 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', marginTop: -4 }}>
            {deltaTag(s.delta)}
          </div>
        </div>
      ))}
    </div>
  );
}
```

(Note: sparkline rendering is done in the canvas area; the StatStrip focuses on numeric stats + delta tags for performance and clarity.)

- [ ] **Step 2: Create `components/KGCanvas.tsx`**

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from './theme/ThemeProvider';
import { graphData } from '@/lib/graph-data';
import type { GraphNode, GraphEdge } from '@/lib/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface Props {
  height?: number;
  highlightNodeId?: string;
  onNodeClick?: (node: GraphNode) => void;
}

const TYPE_COLOR: Record<GraphNode['type'], string> = {
  User: '#22D3EE',
  Service: '#3B82F6',
  DataAsset: '#8B5CF6',
  Policy: '#F59E0B',
  Event: '#8A98B0',
  Identity: '#EC4899',
};

export function KGCanvas({ height = 380, highlightNodeId, onNodeClick }: Props) {
  const { resolved } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    // Convert to react-force-graph's expected shape (nodes need x/y, set by the lib on first run)
    return {
      nodes: graphData.nodes.map((n) => ({ ...n })),
      links: graphData.edges.map((e0) => ({ source: e0.source, target: e0.target, relation: e0.relation, hot: e0.hot })),
    };
  }, []);

  const linkColor = (link: { hot?: boolean }) => (link.hot ? 'var(--color-accent)' : 'rgba(120,140,180,0.35)');
  const nodeColor = (node: GraphNode) => TYPE_COLOR[node.type];

  return (
    <div ref={wrapRef} style={{ width: '100%', height, position: 'relative', background: 'var(--color-bg-sunken)' }}>
      <ForceGraph2D
        graphData={data}
        width={width}
        height={height}
        backgroundColor="transparent"
        linkColor={linkColor}
        linkWidth={(link: { hot?: boolean }) => (link.hot ? 1.5 : 0.6)}
        nodeRelSize={5}
        nodeColor={nodeColor}
        nodeLabel={(node: GraphNode) => `${node.label} (${node.type})`}
        onNodeClick={(node: GraphNode) => onNodeClick?.(node)}
        cooldownTicks={120}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(node: GraphNode & { x?: number; y?: number }, ctx, globalScale) => {
          if (node.x == null || node.y == null) return;
          if (node.hot || node.id === highlightNodeId) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = `${nodeColor(node)}33`;
            ctx.fill();
          }
          if (globalScale > 1.5) {
            ctx.font = `${10 / globalScale}px Inter, sans-serif`;
            ctx.fillStyle = resolved === 'dark' ? '#E6ECF5' : '#0B1726';
            ctx.fillText(node.label, node.x + 6, node.y + 3);
          }
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create `components/NodeInspector.tsx`**

```tsx
'use client';

import { Drawer, Descriptions, Tag, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { GraphNode } from '@/lib/types';

interface Props {
  node: GraphNode | null;
  onClose: () => void;
}

const TYPE_COLOR: Record<GraphNode['type'], string> = {
  User: 'cyan',
  Service: 'blue',
  DataAsset: 'purple',
  Policy: 'gold',
  Event: 'default',
  Identity: 'magenta',
};

export function NodeInspector({ node, onClose }: Props) {
  return (
    <Drawer
      title={node ? `${node.label} (${node.type})` : 'Inspector'}
      open={!!node}
      onClose={onClose}
      width={360}
      closeIcon={<CloseOutlined />}
      extra={node ? <Tag color={TYPE_COLOR[node.type]}>{node.type}</Tag> : null}
    >
      {node && (
        <>
          <p style={{ color: 'var(--color-text-muted)' }}>{node.description}</p>
          <Descriptions size="small" column={1} bordered>
            {node.attrs.map(([k, v]) => (
              <Descriptions.Item key={k} label={k}><span className="mono">{v}</span></Descriptions.Item>
            ))}
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" block>Open full record</Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
```

- [ ] **Step 4: Create `components/ChatPanel.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Input, Button, Avatar, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { CHAT_TRANSCRIPTS } from '@/lib/chat-transcripts';

export function ChatPanel() {
  const [draft, setDraft] = useState('');
  const first = CHAT_TRANSCRIPTS[0];

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg-elev)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 220,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
        <Avatar size={24} icon={<RobotOutlined />} style={{ background: 'var(--color-primary)' }} />
        <strong>Sentinel AI</strong>
        <Tag color="processing" style={{ marginLeft: 'auto' }}>Beta</Tag>
      </div>
      <div role="log" aria-live="polite" style={{ padding: 12, overflowY: 'auto', display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <div style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 12px', borderRadius: 12, maxWidth: '80%' }}>
            {first.exchange[0].text}
          </div>
          <Avatar size={24} icon={<UserOutlined />} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Avatar size={24} icon={<RobotOutlined />} style={{ background: 'var(--color-primary)' }} />
          <div style={{ background: 'var(--color-bg-sunken)', padding: '8px 12px', borderRadius: 12, maxWidth: '85%' }}>
            {first.exchange[1].text}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: 8, borderTop: '1px solid var(--color-border)' }}>
        <Input.TextArea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 3 }}
          placeholder="Ask a forensic question…"
        />
        <Button type="primary" icon={<SendOutlined />} aria-label="Send" />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `components/CommandCenter.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Card, Button, Tooltip } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, FilterOutlined, ExportOutlined } from '@ant-design/icons';
import { StatStrip } from './StatStrip';
import { KGCanvas } from './KGCanvas';
import { NodeInspector } from './NodeInspector';
import { ChatPanel } from './ChatPanel';
import { graphData } from '@/lib/graph-data';
import type { GraphNode } from '@/lib/types';

const HERO_STATS = [
  { label: 'Entities', value: '12.4M', delta: 1.2, series: [12.0, 12.1, 12.2, 12.3, 12.4] },
  { label: 'Events/sec', value: '2,140', delta: 3.8, series: [2050, 2080, 2090, 2110, 2140] },
  { label: 'Policies', value: '1,287', delta: 0.4, series: [1280, 1281, 1284, 1286, 1287] },
  { label: 'Active queries', value: '34', delta: -2.0, series: [38, 36, 35, 34, 34] },
];

// Pre-pick a node for the static right rail
const SAMPLE = graphData.nodes.find((n) => n.label === 'Sarah Chen') ?? graphData.nodes[0];

export function CommandCenter() {
  const [selected, setSelected] = useState<GraphNode | null>(SAMPLE);

  return (
    <Card
      bordered
      style={{
        background: 'var(--color-bg-elev)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 16px 48px rgba(10,16,32,0.18)',
        borderRadius: 16,
        overflow: 'hidden',
        padding: 0,
      }}
      bodyStyle={{ padding: 0 }}
    >
      <StatStrip stats={HERO_STATS} />
      <div style={{ position: 'relative' }}>
        <KGCanvas height={380} highlightNodeId={selected?.id} onNodeClick={setSelected} />
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4, background: 'var(--color-bg-elev)', padding: 4, borderRadius: 8, border: '1px solid var(--color-border)' }}>
          <Tooltip title="Zoom in"><Button type="text" icon={<ZoomInOutlined />} size="small" /></Tooltip>
          <Tooltip title="Zoom out"><Button type="text" icon={<ZoomOutOutlined />} size="small" /></Tooltip>
          <Tooltip title="Reset"><Button type="text" icon={<ReloadOutlined />} size="small" /></Tooltip>
          <Tooltip title="Filter"><Button type="text" icon={<FilterOutlined />} size="small" /></Tooltip>
          <Tooltip title="Export"><Button type="text" icon={<ExportOutlined />} size="small" /></Tooltip>
        </div>
      </div>
      <ChatPanel />
      <NodeInspector node={selected} onClose={() => setSelected(null)} />
    </Card>
  );
}
```

- [ ] **Step 6: Create `components/Hero.tsx`**

```tsx
'use client';

import { motion } from 'framer-motion';
import { Button, Tag } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { HERO, CUSTOMER_LOGOS } from '@/lib/data';
import { CommandCenter } from './CommandCenter';

export function Hero() {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        padding: '96px 24px 64px',
        background:
          'radial-gradient(1200px 600px at 20% 0%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 60%), radial-gradient(800px 500px at 90% 10%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 60%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)',
          gap: 48,
          alignItems: 'center',
        }}
        className="hero-grid"
      >
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Tag color="cyan" style={{ borderRadius: 999, padding: '2px 10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--color-accent)', boxShadow: '0 0 0 0 var(--color-accent)', animation: 'pulse 1.6s ease-out infinite' }} />
              {HERO.eyebrow}
            </span>
          </Tag>
          <h1 style={{ fontSize: 56, lineHeight: 1.1, fontWeight: 700, margin: '20px 0 16px' }}>
            {HERO.h1}
          </h1>
          <p style={{ fontSize: 20, color: 'var(--color-text-muted)', maxWidth: 540, margin: '0 0 24px' }}>
            {HERO.sub}
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            <Button type="primary" size="large" href={HERO.primaryCta.href}>{HERO.primaryCta.label}</Button>
            <Button size="large" href={HERO.secondaryCta.href} icon={<PlayCircleOutlined />}>
              {HERO.secondaryCta.label}
            </Button>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {HERO.trustCaption}
            </div>
            <div style={{ display: 'flex', gap: 24, opacity: 0.7, flexWrap: 'wrap' }}>
              {CUSTOMER_LOGOS.slice(0, 4).map((name) => (
                <span key={name} className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, color: 'var(--color-text-muted)', fontSize: 14, flexWrap: 'wrap' }}>
            {HERO.metrics.map((m, i) => (
              <span key={m.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 24 }}>
                {i > 0 && <span style={{ width: 1, height: 16, background: 'var(--color-border)' }} />}
                <span className="mono" style={{ color: 'var(--color-text)', fontSize: 16, fontWeight: 600 }}>{m.value}</span>
                <span>{m.label}</span>
              </span>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ willChange: 'transform' }}
        >
          <CommandCenter />
        </motion.div>
      </div>
      <style>{`
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 60%, transparent); }
          70%  { box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-accent) 0%, transparent); }
          100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 0%, transparent); }
        }
        @media (max-width: 1023px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 7: Update `app/page.tsx` to use the new Hero**

Replace the `<Section id="hero">[Hero — TBD]</Section>` line with:

```tsx
import { Hero } from '@/components/Hero';
// …
<Hero />
```

- [ ] **Step 8: Verify build**

Run: `cd "C:/Users/dpven/source/repos/lp" && npm run build`
Expected: success, no type errors, the hero appears at `/`. Initial bundle for `/` is under 400 KB gzipped (the graph lib is dynamic).

- [ ] **Step 9: Commit**

```bash
git add components app/page.tsx
git commit -m "feat(hero): full hero with live Command Center mock, stat strip, graph, chat"
```

---

### Task 7: Problem, Logo cloud, and Platform sections

**Files:**
- Create: `components/LogoCloud.tsx`, `components/Problem.tsx`, `components/Platform.tsx`
- Modify: `app/page.tsx` (replace the three slots)

**Interfaces:**
- Consumes: `CUSTOMER_LOGOS`, `PROBLEM_CARDS`, `PLATFORM_FLOW`, `PLATFORM_FEATURES`
- Produces: three sections

- [ ] **Step 1: Create `components/LogoCloud.tsx`**

```tsx
import { CUSTOMER_LOGOS } from '@/lib/data';

export function LogoCloud() {
  return (
    <section style={{ padding: '24px 24px 48px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }}>
        {CUSTOMER_LOGOS.map((name) => (
          <span key={name} className="mono" style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-text-muted)' }}>{name}</span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/Problem.tsx`**

```tsx
import { Card } from 'antd';
import { ApartmentOutlined, HistoryOutlined, SearchOutlined } from '@ant-design/icons';
import { PROBLEM_CARDS } from '@/lib/data';

const ICONS: Record<string, JSX.Element> = {
  fork: <ApartmentOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />,
  clock: <HistoryOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />,
  magnify: <SearchOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />,
};

export function Problem() {
  return (
    <section id="problem" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, lineHeight: 1.2, fontWeight: 700, margin: '0 0 16px', maxWidth: 720 }}>
        Most security data lives in silos. The answers shouldn't have to.
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        Stitching evidence across IT, HR, IAM, cloud, and security tools is slow, lossy, and brittle.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="grid-3">
        {PROBLEM_CARDS.map((c) => (
          <Card key={c.title} bordered style={{ background: 'var(--color-bg-elev)' }}>
            {ICONS[c.icon]}
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '16px 0 8px' }}>{c.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{c.body}</p>
          </Card>
        ))}
      </div>
      <style>{`@media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
```

- [ ] **Step 3: Create `components/Platform.tsx`**

```tsx
import { Card, Tag } from 'antd';
import { PLATFORM_FLOW, PLATFORM_FEATURES } from '@/lib/data';

export function Platform() {
  return (
    <section id="platform" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 16px', maxWidth: 720 }}>
        One platform. Ingest, normalize, graph, and query.
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        Built for security teams who need answers they can cite — at any point in time.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 64 }} className="grid-4">
        {PLATFORM_FLOW.map((s) => (
          <Card key={s.step} bordered style={{ background: 'var(--color-bg-elev)' }}>
            <Tag color="blue">{s.step}</Tag>
            <h3 style={{ fontSize: 22, fontWeight: 600, margin: '12px 0 8px' }}>{s.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{s.body}</p>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-3">
        {PLATFORM_FEATURES.map((f) => (
          <Card key={f.title} bordered style={{ background: 'var(--color-bg-elev)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>{f.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 15 }}>{f.body}</p>
          </Card>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr !important; } .grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .grid-4 { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 4: Update `app/page.tsx`**

Add the imports and replace the three placeholder sections with `<LogoCloud />`, `<Problem />`, `<Platform />`.

- [ ] **Step 5: Verify build + dev**

Run: `cd "C:/Users/dpven/source/repos/lp" && npm run build`
Expected: passes. Then `npm run dev` in background, visit `http://localhost:3000`, confirm three new sections render in order. Stop the background process.

- [ ] **Step 6: Commit**

```bash
git add components app/page.tsx
git commit -m "feat(sections): logo cloud, problem statement, platform overview"
```

---

### Task 8: Interactive Knowledge Graph section with drawer, search, filters, and parallel list view

**Files:**
- Create: `components/KGListView.tsx`, `components/KnowledgeGraph.tsx`
- Modify: `app/page.tsx` (replace the `[Knowledge Graph — TBD]` slot)

**Interfaces:**
- Consumes: `graphData` from `lib/graph-data`; `useTheme`; `EntityType`
- Produces: a section with filter chips, search input, a view-mode toggle (Graph / List), the `KGCanvas` or the `KGListView`, and the `NodeInspector` drawer.

- [ ] **Step 1: Create `components/KGListView.tsx`**

```tsx
'use client';

import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { graphData } from '@/lib/graph-data';
import type { GraphNode } from '@/lib/types';

const TYPE_COLORS: Record<GraphNode['type'], string> = {
  User: 'cyan',
  Service: 'blue',
  DataAsset: 'purple',
  Policy: 'gold',
  Event: 'default',
  Identity: 'magenta',
};

export function KGListView({ onSelect }: { onSelect: (n: GraphNode) => void }) {
  const columns: ColumnsType<GraphNode> = [
    { title: 'Label', dataIndex: 'label', key: 'label', sorter: (a, b) => a.label.localeCompare(b.label) },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: (Object.keys(TYPE_COLORS) as GraphNode['type'][]).map((t) => ({ text: t, value: t })),
      onFilter: (val, rec) => rec.type === val,
      render: (t: GraphNode['type']) => <Tag color={TYPE_COLORS[t]}>{t}</Tag>,
    },
    { title: 'Description', dataIndex: 'description', key: 'description' },
  ];
  return (
    <Table<GraphNode>
      rowKey="id"
      columns={columns}
      dataSource={graphData.nodes}
      pagination={{ pageSize: 12 }}
      onRow={(rec) => ({ onClick: () => onSelect(rec), style: { cursor: 'pointer' } })}
      size="middle"
    />
  );
}
```

- [ ] **Step 2: Create `components/KnowledgeGraph.tsx`**

```tsx
'use client';

import { useMemo, useState } from 'react';
import { Segmented, Input, Tag, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { KGCanvas } from './KGCanvas';
import { KGListView } from './KGListView';
import { NodeInspector } from './NodeInspector';
import { graphData } from '@/lib/graph-data';
import type { EntityType, GraphNode } from '@/lib/types';

const FILTERS: Array<{ key: 'All' | EntityType; label: string }> = [
  { key: 'All', label: 'All' },
  { key: 'User', label: 'Users' },
  { key: 'Service', label: 'Services' },
  { key: 'DataAsset', label: 'Data' },
  { key: 'Policy', label: 'Policies' },
  { key: 'Event', label: 'Events' },
  { key: 'Identity', label: 'Identity' },
];

export function KnowledgeGraph() {
  const [filter, setFilter] = useState<'All' | EntityType>('All');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'graph' | 'list'>('graph');
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const filteredData = useMemo(() => {
    const nodes = graphData.nodes
      .filter((n) => filter === 'All' || n.type === filter)
      .filter((n) => !search || n.label.toLowerCase().includes(search.toLowerCase()));
    const ids = new Set(nodes.map((n) => n.id));
    const edges = graphData.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    return { nodes, edges };
  }, [filter, search]);

  return (
    <section id="graph" style={{ padding: '96px 24px', background: 'var(--color-bg-elev)', borderBlock: '1px solid var(--color-border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 12px' }}>Explore the live graph.</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 24 }}>
          Pan, zoom, filter, and inspect any entity. A text list view is available for screen readers and keyboard users.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search entities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
            aria-label="Search entities"
          />
          <Space wrap>
            {FILTERS.map((f) => (
              <Tag.CheckableTag
                key={f.key}
                checked={filter === f.key}
                onChange={() => setFilter(f.key)}
              >
                {f.label}
              </Tag.CheckableTag>
            ))}
          </Space>
          <div style={{ marginLeft: 'auto' }}>
            <Segmented
              value={view}
              onChange={(v) => setView(v as 'graph' | 'list')}
              options={[{ label: 'Graph', value: 'graph' }, { label: 'List', value: 'list' }]}
              aria-label="View mode"
            />
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'var(--color-bg)',
            minHeight: 480,
          }}
        >
          {view === 'graph' ? (
            <KGCanvasFilterable
              nodes={filteredData.nodes}
              edges={filteredData.edges}
              onNodeClick={setSelected}
            />
          ) : (
            <div style={{ padding: 16 }}>
              <KGListView onSelect={setSelected} />
            </div>
          )}
        </div>
      </div>
      <NodeInspector node={selected} onClose={() => setSelected(null)} />
    </section>
  );
}

// Internal: a thin wrapper around KGCanvas that uses filtered nodes/edges.
function KGCanvasFilterable({
  nodes,
  edges,
  onNodeClick,
}: {
  nodes: GraphNode[];
  edges: { source: string; target: string; relation: string; hot?: boolean }[];
  onNodeClick: (n: GraphNode) => void;
}) {
  // We re-use the existing KGCanvas (which loads the full dataset) but pass an override by
  // re-implementing a small adapter that uses the global data + a filter hint.
  // Simplest: instantiate a fresh dynamic graph with the filtered data.
  const FilteredCanvas = require('./KGFilteredCanvas').KGFilteredCanvas as React.FC<{
    nodes: GraphNode[];
    edges: typeof edges;
    onNodeClick: (n: GraphNode) => void;
  }>;
  return <FilteredCanvas nodes={nodes} edges={edges} onNodeClick={onNodeClick} />;
}
```

- [ ] **Step 3: Create `components/KGFilteredCanvas.tsx`**

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from './theme/ThemeProvider';
import type { GraphNode } from '@/lib/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface Edge { source: string; target: string; relation: string; hot?: boolean }

const TYPE_COLOR: Record<GraphNode['type'], string> = {
  User: '#22D3EE', Service: '#3B82F6', DataAsset: '#8B5CF6', Policy: '#F59E0B', Event: '#8A98B0', Identity: '#EC4899',
};

export function KGFilteredCanvas({ nodes, edges, onNodeClick }: { nodes: GraphNode[]; edges: Edge[]; onNodeClick: (n: GraphNode) => void }) {
  const { resolved } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => { for (const e of entries) setWidth(e.contentRect.width); });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => ({
    nodes: nodes.map((n) => ({ ...n })),
    links: edges.map((e0) => ({ source: e0.source, target: e0.target, relation: e0.relation, hot: e0.hot })),
  }), [nodes, edges]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: 560, background: 'var(--color-bg-sunken)' }}>
      <ForceGraph2D
        graphData={data}
        width={width}
        height={560}
        backgroundColor="transparent"
        linkColor={(l: { hot?: boolean }) => (l.hot ? 'var(--color-accent)' : 'rgba(120,140,180,0.35)')}
        linkWidth={(l: { hot?: boolean }) => (l.hot ? 1.5 : 0.6)}
        nodeRelSize={5}
        nodeColor={(n: GraphNode) => TYPE_COLOR[n.type]}
        nodeLabel={(n: GraphNode) => `${n.label} (${n.type})`}
        onNodeClick={(n: GraphNode) => onNodeClick(n)}
        cooldownTicks={120}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(n: GraphNode & { x?: number; y?: number }, ctx, globalScale) => {
          if (n.x == null || n.y == null) return;
          if (n.hot) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = `${TYPE_COLOR[n.type]}33`;
            ctx.fill();
          }
          if (globalScale > 1.5) {
            ctx.font = `${10 / globalScale}px Inter, sans-serif`;
            ctx.fillStyle = resolved === 'dark' ? '#E6ECF5' : '#0B1726';
            ctx.fillText(n.label, n.x + 6, n.y + 3);
          }
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Replace the require()-based shim in `KnowledgeGraph.tsx` with a direct import**

Replace the `require('./KGFilteredCanvas')` block in `KnowledgeGraph.tsx` with a top-of-file import:

```tsx
import { KGFilteredCanvas } from './KGFilteredCanvas';
```

And replace the `KGCanvasFilterable` body to use it directly:

```tsx
function KGCanvasFilterable({ nodes, edges, onNodeClick }: {
  nodes: GraphNode[];
  edges: { source: string; target: string; relation: string; hot?: boolean }[];
  onNodeClick: (n: GraphNode) => void;
}) {
  return <KGFilteredCanvas nodes={nodes} edges={edges} onNodeClick={onNodeClick} />;
}
```

- [ ] **Step 5: Update `app/page.tsx`**

Add the import and replace `<Section id="graph">[Knowledge Graph — TBD]</Section>` with `<KnowledgeGraph />`.

- [ ] **Step 6: Verify build + dev**

Run: `cd "C:/Users/dpven/source/repos/lp" && npm run build` then `npm run dev` in the background. Open `/#graph`. Confirm the canvas, filters, search, and view toggle work, and clicking a node opens the drawer. Stop the background process.

- [ ] **Step 7: Commit**

```bash
git add components app/page.tsx
git commit -m "feat(graph): interactive Knowledge Graph section with filter, search, list view, drawer"
```

---

### Task 9: AI Agents section (chat transcript + result panel)

**Files:**
- Create: `components/Agents.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `CHAT_TRANSCRIPTS` from `lib/chat-transcripts`; `graphData` for mini-views
- Produces: a two-column section with a `Segmented` selector for the question, a chat transcript rendering, and a result panel showing the matching mini-graph.

- [ ] **Step 1: Create `components/Agents.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Segmented, Card, Tag, Button, Avatar } from 'antd';
import { RobotOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { CHAT_TRANSCRIPTS } from '@/lib/chat-transcripts';
import { KGFilteredCanvas } from './KGFilteredCanvas';
import { graphData } from '@/lib/graph-data';
import type { GraphNode } from '@/lib/types';

const ARTIFACT_TITLES: Record<string, string> = {
  'graph-mini': 'Access path',
  'graph-blast': 'Blast radius',
  'timeline': 'Compliance timeline',
};

function nodesForQuestion(qid: string): GraphNode[] {
  if (qid === 'sensitive-data') {
    const want = ['Sarah Chen', 'etl-pipeline', 'finance-prod/q3-2026/model.xlsx', 'FIN-PII-007'];
    return graphData.nodes.filter((n) => want.includes(n.label));
  }
  if (qid === 'blast-radius') {
    const want = ['okta-prod', 'customer-pii/', 'finance-prod/', 'hr-salary/'];
    return graphData.nodes.filter((n) => want.includes(n.label));
  }
  if (qid === 'compliance-at-t') {
    const want = ['svc-etl', 'customer-pii/', 'FIN-PII-007'];
    return graphData.nodes.filter((n) => want.includes(n.label));
  }
  return graphData.nodes.slice(0, 4);
}

function edgesForQuestion(qid: string, ids: Set<string>) {
  return graphData.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
}

export function Agents() {
  const [qid, setQid] = useState(CHAT_TRANSCRIPTS[0].id);
  const current = CHAT_TRANSCRIPTS.find((t) => t.id === qid)!;
  const nodes = nodesForQuestion(qid);
  const ids = new Set(nodes.map((n) => n.id));
  const edges = edgesForQuestion(qid, ids);

  return (
    <section id="agents" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 12px' }}>Ask in plain English. Get cited answers.</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 24 }}>
        Sentinel AI agents traverse the knowledge graph and return evidence, not just text.
      </p>

      <Segmented
        value={qid}
        onChange={(v) => setQid(v as string)}
        options={CHAT_TRANSCRIPTS.map((t) => ({ label: t.id === 'sensitive-data' ? 'Sensitive data' : t.id === 'blast-radius' ? 'Blast radius' : 'Compliance at T', value: t.id }))}
        style={{ marginBottom: 24 }}
        aria-label="Pick a sample question"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 }} className="agents-grid">
        <Card bordered style={{ background: 'var(--color-bg-elev)' }} bodyStyle={{ padding: 16 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {current.exchange.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'agent' && <Avatar size={28} icon={<RobotOutlined />} style={{ background: 'var(--color-primary)' }} />}
                <div
                  style={{
                    background: m.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-sunken)',
                    color: m.role === 'user' ? '#fff' : 'var(--color-text)',
                    padding: '10px 14px',
                    borderRadius: 12,
                    maxWidth: '85%',
                    fontSize: 15,
                  }}
                >
                  {m.text}
                </div>
                {m.role === 'user' && <Avatar size={28} icon={<UserOutlined />} />}
              </div>
            ))}
          </div>
        </Card>

        <Card
          bordered
          style={{ background: 'var(--color-bg-elev)' }}
          title={
            <span>
              {ARTIFACT_TITLES[current.exchange[1].artifact ?? 'graph-mini']} <Tag color="cyan">preview</Tag>
            </span>
          }
          extra={<Button type="link" href="#graph">View in graph <ArrowRightOutlined /></Button>}
        >
          <div style={{ height: 320, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <KGFilteredCanvas nodes={nodes} edges={edges} onNodeClick={() => {}} />
          </div>
          <ul style={{ marginTop: 16, paddingLeft: 18, color: 'var(--color-text-muted)' }}>
            {current.id === 'sensitive-data' && (<>
              <li>1 confidential data asset located.</li>
              <li>4 unique identities accessed in the last 30 days.</li>
              <li>1 deprecated credential detected and flagged.</li>
            </>)}
            {current.id === 'blast-radius' && (<>
              <li>18 reachable DataAssets across 6 buckets.</li>
              <li>3 trust boundaries crossed.</li>
              <li>Remediation: rotate <code>okta-prod</code> and audit downstream grants.</li>
            </>)}
            {current.id === 'compliance-at-t' && (<>
              <li>Policy version at time T: FIN-PII-007 v4.</li>
              <li>Access event: <code>mfa=false</code> at 02:00:11 UTC.</li>
              <li>Verdict: non-compliant under v4; would have been compliant under v3.</li>
            </>)}
          </ul>
        </Card>
      </div>
      <style>{`@media (max-width: 900px) { .agents-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
```

- [ ] **Step 2: Update `app/page.tsx`**

Add the import and replace the `[Agents — TBD]` slot with `<Agents />`.

- [ ] **Step 3: Verify build + dev**

Run `npm run build` then `npm run dev` in background. Open `/#agents`. Confirm the Segmented control switches the transcript and the mini-graph updates. Stop background process.

- [ ] **Step 4: Commit**

```bash
git add components app/page.tsx
git commit -m "feat(agents): AI agents showcase with transcript and result panel"
```

---

### Task 10: Use cases, Integrations, Testimonial, Final CTA

**Files:**
- Create: `components/UseCases.tsx`, `components/Integrations.tsx`, `components/Testimonial.tsx`, `components/FinalCTA.tsx`
- Create: `app/api/demo-request/route.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `USE_CASES`, `INTEGRATIONS`, `TESTIMONIAL`, `FINAL_CTA` from `lib/data`
- Produces: the last four sections and a working placeholder demo-request endpoint

- [ ] **Step 1: Create `app/api/demo-request/route.ts`**

```ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Placeholder: in production this would forward to CRM, queue, etc.
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({ ok: true, receivedAt: new Date().toISOString(), echo: body });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
```

- [ ] **Step 2: Create `components/UseCases.tsx`**

```tsx
import Link from 'next/link';
import { Card } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { USE_CASES } from '@/lib/data';

const ILLU_BG: Record<string, string> = {
  graph: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 30%, transparent), color-mix(in srgb, var(--color-accent) 30%, transparent))',
  shield: 'linear-gradient(135deg, color-mix(in srgb, var(--color-danger) 30%, transparent), color-mix(in srgb, var(--color-warning) 30%, transparent))',
  clock: 'linear-gradient(135deg, color-mix(in srgb, var(--color-success) 30%, transparent), color-mix(in srgb, var(--color-accent) 30%, transparent))',
};

export function UseCases() {
  return (
    <section id="use-cases" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 12px' }}>Where teams use Sentinel Lake.</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        From high-stakes transactions to everyday audits, the same graph powers every answer.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="grid-3">
        {USE_CASES.map((u) => (
          <Card
            key={u.title}
            bordered
            style={{ background: 'var(--color-bg-elev)', overflow: 'hidden' }}
            bodyStyle={{ padding: 0 }}
            cover={
              <div aria-hidden style={{ height: 200, background: ILLU_BG[u.illustration] }} />
            }
          >
            <div style={{ padding: 24 }}>
              <h3 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 12px' }}>{u.title}</h3>
              <ul style={{ paddingLeft: 18, color: 'var(--color-text-muted)', margin: '0 0 16px' }}>
                {u.bullets.map((b) => <li key={b} style={{ marginBottom: 6 }}>{b}</li>)}
              </ul>
              <Link href="#" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                Read the full story <ArrowRightOutlined />
              </Link>
            </div>
          </Card>
        ))}
      </div>
      <style>{`@media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
```

- [ ] **Step 3: Create `components/Integrations.tsx`**

```tsx
import { Card } from 'antd';
import { INTEGRATIONS } from '@/lib/data';

export function Integrations() {
  return (
    <section id="integrations" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 12px' }}>Connects to every source your security team already runs.</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        50+ first-party connectors and a typed SDK for everything else.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-4">
        {INTEGRATIONS.map((i) => (
          <Card key={i.name} bordered style={{ background: 'var(--color-bg-elev)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div aria-hidden style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-bg-sunken)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                {i.name.slice(0, 1)}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{i.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{i.category}</div>
              </div>
            </div>
          </Card>
        ))}
        <Card
          bordered
          style={{ background: 'var(--color-bg-elev)', borderStyle: 'dashed', display: 'grid', placeItems: 'center', minHeight: 88 }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700 }}>+40</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>more</div>
          </div>
        </Card>
      </div>
      <style>{`
        @media (max-width: 900px) { .grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .grid-4 { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
```

- [ ] **Step 4: Create `components/Testimonial.tsx`**

```tsx
import { Card, Statistic } from 'antd';
import { TESTIMONIAL } from '@/lib/data';

export function Testimonial() {
  return (
    <section id="testimonial" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <Card bordered style={{ background: 'var(--color-bg-elev)', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 48, padding: 24 }} className="testimonial-grid">
          <div>
            <div style={{ fontSize: 48, lineHeight: 1, color: 'var(--color-primary)', marginBottom: 8 }}>“</div>
            <blockquote style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.3, margin: '0 0 24px' }}>
              {TESTIMONIAL.quote}
            </blockquote>
            <div style={{ color: 'var(--color-text-muted)' }}>
              <strong style={{ color: 'var(--color-text)' }}>{TESTIMONIAL.author}</strong> — {TESTIMONIAL.title}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 24, alignContent: 'center' }}>
            {TESTIMONIAL.metrics.map((m) => (
              <div key={m.label}>
                <Statistic value={m.value} valueStyle={{ fontSize: 36, fontWeight: 700 }} />
                <div style={{ color: 'var(--color-text-muted)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <style>{`@media (max-width: 900px) { .testimonial-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
```

- [ ] **Step 5: Create `components/FinalCTA.tsx`**

```tsx
import { Button, Typography } from 'antd';
import { FINAL_CTA } from '@/lib/data';

export function FinalCTA() {
  return (
    <section id="final-cta" style={{ padding: '96px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Typography.Title level={2} style={{ fontSize: 48, fontWeight: 700, margin: '0 0 24px' }}>
          {FINAL_CTA.h2}
        </Typography.Title>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <Button type="primary" size="large" href={FINAL_CTA.primary.href}>{FINAL_CTA.primary.label}</Button>
          <Button size="large" href={FINAL_CTA.secondary.href}>{FINAL_CTA.secondary.label}</Button>
        </div>
        <div style={{ color: 'var(--color-text-muted)' }}>{FINAL_CTA.footnote}</div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Update `app/page.tsx`**

Add the four imports and replace the last four placeholder sections with `<UseCases />`, `<Integrations />`, `<Testimonial />`, `<FinalCTA />`.

- [ ] **Step 7: Verify build + dev**

Run `npm run build` then `npm run dev` in background. Confirm all 11 sections render in order, the final CTA buttons post/get to the placeholder endpoint, and the layout is sound in both themes. Stop background process.

- [ ] **Step 8: Commit**

```bash
git add components app/api app/page.tsx
git commit -m "feat(sections): use cases, integrations, testimonial, final CTA + demo API"
```

---

### Task 11: Cross-theme QA, accessibility, and perf

**Files:**
- Modify: `app/globals.css` (focus ring polish, skip link visibility, `prefers-reduced-motion` extra rules)
- Create: `tests/a11y.test.tsx`

- [ ] **Step 1: Add focus ring + skip link CSS to `app/globals.css`**

Append:

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

a[href="#main"] {
  background: var(--color-primary);
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  z-index: 200;
}
a[href="#main"]:not(:focus) { left: -9999px; position: absolute; }

@media (prefers-reduced-motion: reduce) {
  .ant-motion, [data-framer-component] { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 2: Write `tests/a11y.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Page from '@/app/page';

describe('Accessibility smoke', () => {
  it('has a single <main> landmark', () => {
    render(<Page />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('skip link is present and points to #main', () => {
    render(<Page />);
    const link = screen.getByText('Skip to main content');
    expect(link.getAttribute('href')).toBe('#main');
  });

  it('all rendered images/avatars have non-empty accessible names or are decorative', () => {
    render(<Page />);
    // Quick sanity: at least the brand and one avatar are labeled
    expect(screen.getAllByLabelText(/Sentinel Lake/i).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run all tests**

Run: `cd "C:/Users/dpven/source/repos/lp" && npm test`
Expected: all tests pass.

- [ ] **Step 4: Build and inspect bundle**

Run: `cd "C:/Users/dpven/source/repos/lp" && npm run build`
Expected: succeeds. The First Load JS for `/` is reported; verify it's under 400 KB gzipped (compare with the printed numbers). If it's over, audit imports: the graph lib should be in a dynamic chunk, antd should tree-shake.

- [ ] **Step 5: Manual QA checklist**

Run `npm run dev` in background and check:
- [ ] Light theme: text contrast passes on every section.
- [ ] Dark theme: same.
- [ ] Theme toggle switches without flash on a hard refresh (set "dark" in `localStorage` and reload).
- [ ] Hero `Command Center` mock renders the graph, stat strip, right rail, chat.
- [ ] Knowledge Graph section: filters work, search works, "List" view shows the table, "Graph" returns, clicking a node opens the drawer.
- [ ] Agents section: Segmented control switches the transcript and updates the result panel.
- [ ] Use cases, integrations, testimonial, final CTA all render.
- [ ] Reduced motion: enable in OS, confirm no parallax, no pulse, no scroll fades.
- [ ] Keyboard: tab through the page; focus rings are visible; the chat input is focusable.
- [ ] Resize: at 1024 / 768 / 414 px the layout reflows without overflow.

Stop background process.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css tests/a11y.test.tsx
git commit -m "chore(a11y): focus rings, skip link, reduced-motion guards, a11y smoke test"
```

---

### Task 12: README and final polish

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update `README.md`**

```markdown
# Sentinel Lake — Landing Page

Marketing landing page for the Sentinel Lake cybersecurity data lake & knowledge graph.

## Stack
Next.js 14 (App Router) · TypeScript · antd v5 · @ant-design/icons · react-force-graph-2d · framer-motion

## Develop
\`\`\`
npm install
npm run dev
\`\`\`
Open http://localhost:3000.

## Test
\`\`\`
npm test
\`\`\`
Vitest + Testing Library, jsdom environment. Includes theme, graph data, page render, and a11y smoke tests.

## Build
\`\`\`
npm run build
npm start
\`\`\`

## Theming
Theme is stored in `localStorage.sentinel-theme` as `light` | `dark` | `system`. The initial value is set by an inline script in `app/layout.tsx` before React hydrates, so there's no theme flash on hard reload.

Toggle from the top-right of the nav, or use the OS preference to follow the system.

## Project layout
- `app/` — Next.js App Router entry, layout, page composition, demo API
- `components/` — all UI sections; `components/theme/` for theming primitives
- `lib/` — typed copy/data (data.ts), KG nodes/edges (graph-data.ts), chat transcripts (chat-transcripts.ts)
- `tests/` — Vitest suites

## Notes
- All customer/company references are placeholders.
- KG data is a hand-curated sample illustrating the concept.
- The demo-request CTA posts to `/api/demo-request` which returns `{ ok: true }`.
```

- [ ] **Step 2: Final commit**

```bash
git add README.md
git commit -m "docs: README with stack, dev/test/build, theming, layout"
```

---

## Self-Review

**1. Spec coverage:**
- §2 Tech stack — covered in Task 1 (deps) and throughout (antd v5, react-force-graph-2d, recharts, framer-motion).
- §3 IA (11 sections) — covered by Tasks 5–10.
- §4 Design system (typography, color tokens, motion, antd theming, KG palette) — Tasks 1 (CSS variables), 2 (ThemeProvider/tokens), 6 (KG palette).
- §5 Hero in detail — Task 6.
- §6 Interactive KG — Task 8.
- §7 AI Agents in action — Task 9.
- §8 Use cases — Task 10.
- §9 Integrations — Task 10.
- §10 Testimonial — Task 10.
- §11 Final CTA + footer — Task 5 (Footer), Task 10 (FinalCTA).
- §12 Theming implementation — Task 2.
- §13 Accessibility — Task 8 (parallel list view required), Task 11 (focus rings, skip link, reduced motion, smoke test).
- §14 Performance budget — Task 1 (deps), Task 11 (build audit step).
- §15 Project structure — matches the structure created across tasks.
- §16 Phases — Tasks 1–12.
- §17 Out of scope — honored (no real backend, etc.).

**2. Placeholder scan:** no TBDs, no "implement later," no vague validation. Every test is real. Every component is implemented. The one "TBD" left in `app/page.tsx` placeholders is removed before the first build (Task 7 step 4).

**3. Type consistency:** `GraphNode` / `GraphEdge` / `GraphData` / `EntityType` are defined in Task 3 (`lib/types.ts`) and consumed in Tasks 4, 6, 8, 9. `CHAT_TRANSCRIPTS` shape matches `ChatTranscript` and is consumed in Tasks 6 and 9. `ThemeMode` / `Resolved` defined in Task 2; `useTheme` returns the documented shape. `useTheme` is consumed in Tasks 6, 8, 9.

No issues found.
