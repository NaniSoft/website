import { render, screen, act, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { COMPONENTS, OBSERVER_COMPONENTS, STAGE_COMPONENTS } from '@nanisoft/architecture';
import Page from '@/app/page';
import { Hero } from '@/components/Hero';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

// antd components used by kept sections schedule async state updates after
// mount that land outside RTL's initial act() wrapper in jsdom. Flushing the
// macrotask queue settles those updates before assertions.
async function flushAntd() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

type MqListener = (event: { matches: boolean }) => void;

/** Replace the setup.ts matchMedia stub with one reporting a fixed preference. */
function mockMatchMedia(matches: boolean) {
  const listeners = new Set<MqListener>();
  const mq = (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: (_: string, cb: MqListener) => listeners.add(cb),
    removeEventListener: (_: string, cb: MqListener) => listeners.delete(cb),
    dispatchEvent: vi.fn(),
  });
  Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: mq });
  return listeners;
}

afterEach(() => {
  // Restore a neutral stub (setup.ts default reports matches:false).
  mockMatchMedia(false);
});

// Recompute the model-derived rendered set exactly as hero-graph.ts does.
const expectedIds = [
  ...Object.values(STAGE_COMPONENTS).flat(),
  ...OBSERVER_COMPONENTS,
  ...COMPONENTS.filter((c) => c.kind === 'platform' && c.id !== 'watchtower').map((c) => c.id),
];

describe('Hero DAG diagram', () => {
  it('renders an accessible SVG diagram of the pipeline', () => {
    render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
    const svg = screen.getByRole('img', { name: /pipeline/i });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  it('renders every model-derived component as a labeled node', () => {
    render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
    for (const id of expectedIds) {
      expect(document.querySelector(`[data-node-id="${id}"]`), `node ${id}`).not.toBeNull();
    }
    // Codenames are real text (JetBrains Mono data face).
    for (const name of ['Atlas', 'Compass', 'Watchtower', 'Bedrock', 'Trailhead']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('routes more than ten directed edges with arrowhead markers', () => {
    render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
    expect(document.querySelectorAll('[data-edge-id]').length).toBeGreaterThan(10);
    expect(document.querySelectorAll('marker').length).toBeGreaterThanOrEqual(2);
  });

  it('keeps the four phase names readable', () => {
    render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
    for (const phase of ['Schema', 'Ingestion', 'Transform', 'Investigation']) {
      expect(screen.getByText(phase)).toBeInTheDocument();
    }
  });

  it('is pure spectacle: no buttons or links anywhere in the hero', () => {
    const { container } = render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
    const section = container.querySelector('#hero');
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).queryAllByRole('button')).toHaveLength(0);
    expect(within(section as HTMLElement).queryAllByRole('link')).toHaveLength(0);
  });
});

describe('Hero motion contract', () => {
  it('runs live by default (data-motion="live")', () => {
    mockMatchMedia(false);
    render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
    const svg = screen.getByRole('img', { name: /pipeline/i });
    expect(svg.closest('[data-motion]')?.getAttribute('data-motion')).toBe('live');
  });

  it('reduced motion settles the wavefront with content intact', () => {
    mockMatchMedia(true);
    render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
    const svg = screen.getByRole('img', { name: /pipeline/i });
    const root = svg.closest('[data-motion]');
    expect(root?.getAttribute('data-motion')).toBe('settled');
    // Content intact: identical node set in the settled state.
    for (const id of expectedIds) {
      expect(root?.querySelector(`[data-node-id="${id}"]`)).not.toBeNull();
    }
  });
});

describe('Hero shell', () => {
  // The retired ask, composed at runtime so this file itself stays clean under
  // the repo-wide grep gate that bans the literal phrase from apps/landing.
  const RETIRED_DEMO_ASK = ['request', 'a', 'demo'].join(' ');

  it('overlays the W1 wordmark (decorative here — the nav announces the brand)', () => {
    const { container } = render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
    expect(container.querySelector('#hero .wordmark')).not.toBeNull();
    // Decorative: excluded from the accessibility tree (TopNav owns the
    // announcement; page.test asserts exactly two labeled marks page-wide).
    const hero = container.querySelector('#hero') as HTMLElement;
    expect(within(hero).queryAllByRole('img', { name: 'nanisoft' })).toHaveLength(0);
  });

  it('makes the positioning line the page-heading of the hero', () => {
    render(
      <ThemeProvider>
        <Hero />
      </ThemeProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: /digital twin of the IT estate/i })).toBeInTheDocument();
  });

  it('keeps the retired demo chrome off the page', async () => {
    const { container } = render(
      <ThemeProvider>
        <Page />
      </ThemeProvider>,
    );
    await flushAntd();
    // The sales asks are gone everywhere: no demo copy, no mailto link.
    expect(screen.queryByText(RETIRED_DEMO_ASK)).not.toBeInTheDocument();
    expect(screen.queryAllByRole('link', { name: /demo/i })).toHaveLength(0);
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    const hero = document.querySelector('#hero');
    expect(hero).not.toBeNull();
    expect(within(hero as HTMLElement).queryAllByRole('link')).toHaveLength(0);
    expect(within(hero as HTMLElement).queryByText(/Trusted by security teams/i)).not.toBeInTheDocument();
    expect(within(hero as HTMLElement).queryByText(/events\/day/i)).not.toBeInTheDocument();
  });
});
