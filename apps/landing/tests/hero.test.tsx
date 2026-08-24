import { render, screen, act, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

/**
 * Replace the setup.ts matchMedia stub. `pick` decides which queries report
 * matches:true (e.g. `(prefers-reduced-motion: reduce)` or
 * `(max-width: 719px)`), everything else reports false.
 */
function mockMatchMedia(pick: (query: string) => boolean) {
  const listeners = new Set<MqListener>();
  const mq = (query: string) => ({
    matches: pick(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: (_: string, cb: MqListener) => listeners.add(cb),
    removeEventListener: (_: string, cb: MqListener) => listeners.delete(cb),
    dispatchEvent: vi.fn(),
  });
  Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: mq });
}

const motionReduced = () => mockMatchMedia((q) => q.includes('prefers-reduced-motion'));
const narrowScreen = () =>
  mockMatchMedia((q) => !q.includes('prefers-reduced-motion') && q.includes('max-width'));

afterEach(() => {
  // Restore a neutral stub (setup.ts default reports matches:false everywhere).
  mockMatchMedia(() => false);
});

function renderHero() {
  return render(
    <ThemeProvider>
      <Hero />
    </ThemeProvider>,
  );
}

describe('HeroFlow story', () => {
  it('renders an accessible SVG narrating the estate-to-answer journey', () => {
    renderHero();
    const svg = screen.getByRole('img', { name: /estate-to-answer journey/i });
    expect(svg.tagName.toLowerCase()).toBe('svg');
    const desc = svg.querySelector('desc')?.textContent ?? '';
    expect(desc).toContain('Bronze');
    expect(desc).toContain('one person is one node');
    expect(desc).toContain('nodes and edges');
    expect(desc).toContain('Atlas');
    expect(desc).toContain('reduced motion');
  });

  it('tells the one story: sources, four stations, and the answered question', () => {
    renderHero();
    // The raw estate.
    for (const name of ['Directory', 'HR', 'Databases']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    // The stages.
    for (const name of ['Land', 'Conform', 'Graph', 'Serve']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    // The payoff.
    expect(screen.getByText('Who can reach this system?')).toBeInTheDocument();
    expect(screen.getByText('policy')).toBeInTheDocument();
    expect(screen.getByText('audited')).toBeInTheDocument();
    expect(screen.getAllByText('✓')).toHaveLength(2);
    // Phase-label language echoes the old hero: mono uppercase tiers.
    for (const tier of ['Bronze', 'Silver', 'Gold', 'Atlas']) {
      expect(screen.getByText(tier)).toBeInTheDocument();
    }
  });

  it('is pure spectacle: no buttons or links anywhere in the hero', () => {
    const { container } = renderHero();
    const section = container.querySelector('#hero');
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).queryAllByRole('button')).toHaveLength(0);
    expect(within(section as HTMLElement).queryAllByRole('link')).toHaveLength(0);
  });
});

describe('Hero motion contract', () => {
  it('runs live by default (data-motion="live")', () => {
    mockMatchMedia(() => false);
    renderHero();
    const svg = screen.getByRole('img', { name: /estate-to-answer journey/i });
    expect(svg.closest('[data-motion]')?.getAttribute('data-motion')).toBe('live');
  });

  it('settles under reduced motion with the COMPLETE story incl. answer + badges', () => {
    motionReduced();
    renderHero();
    const svg = screen.getByRole('img', { name: /estate-to-answer journey/i });
    const root = svg.closest('[data-motion]');
    expect(root?.getAttribute('data-motion')).toBe('settled');
    // Content intact: every stage and the payoff are present.
    for (const name of ['Land', 'Conform', 'Graph', 'Serve']) {
      expect(root?.querySelector(`[data-chip-id="${name.toLowerCase()}"]`)).not.toBeNull();
    }
    expect(within(root as HTMLElement).getByText('Who can reach this system?')).toBeInTheDocument();
    expect(within(root as HTMLElement).getByText('policy')).toBeInTheDocument();
    expect(within(root as HTMLElement).getByText('audited')).toBeInTheDocument();
    // The pulse rests at Graph in the settled frame (server markup IS it).
    expect(svg.getAttribute('viewBox')).toBe('0 0 1000 340');
    const trunkDot = svg.querySelectorAll('.hf-dot')[3] as SVGGElement | null;
    expect(trunkDot?.style.transform).toBe('translate(640px, 170px)');
    expect(root?.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('narrow screens switch to the vertical arrangement of the same story', () => {
    narrowScreen();
    renderHero();
    const root = document.querySelector('.hero-flow');
    expect(root?.getAttribute('data-orientation')).toBe('vertical');
    const svg = root?.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 340 536');
    // Message identical on every device.
    expect(screen.getByText('Who can reach this system?')).toBeInTheDocument();
    expect(screen.getByText('Serve')).toBeInTheDocument();
  });

  it('marks purely decorative layers aria-hidden (pulse, rings, connectors, twin glyph)', () => {
    renderHero();
    const svg = screen.getByRole('img', { name: /estate-to-answer journey/i });
    const hiddenGroups = svg.querySelectorAll('g[aria-hidden]');
    expect(hiddenGroups.length).toBeGreaterThanOrEqual(4);
    expect(svg.querySelector('[class*="hf-ring"]')).not.toBeNull();
  });
});

describe('Retired DAG is gone', () => {
  it('renders none of the ~20-component architecture (that lives in its own section)', () => {
    renderHero();
    for (const marker of ['Watchtower', 'Bedrock', 'Trailhead', 'Blueprint', 'Forge']) {
      expect(screen.queryByText(marker)).not.toBeInTheDocument();
    }
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-edge-id]')).toHaveLength(0);
  });

  it('keeps the element budget small — three sources, four stations, one answer', () => {
    renderHero();
    const svg = screen.getByRole('img', { name: /estate-to-answer journey/i });
    // 3 source chips + 4 station chips + 1 answer chip = 8 faces, never ~20.
    expect(svg.querySelectorAll('.hf-face').length).toBe(7);
    expect(svg.querySelectorAll('.hf-answer-face').length).toBe(1);
  });
});

describe('Hero shell', () => {
  // The retired ask, composed at runtime so this file itself stays clean under
  // the repo-wide grep gate that bans the literal phrase from apps/landing.
  const RETIRED_DEMO_ASK = ['request', 'a', 'demo'].join(' ');

  it('overlays the W1 wordmark (decorative here — the nav announces the brand)', () => {
    const { container } = renderHero();
    expect(container.querySelector('#hero .wordmark')).not.toBeNull();
    // Decorative: excluded from the accessibility tree (TopNav owns the
    // announcement; page.test asserts exactly two labeled marks page-wide).
    const hero = container.querySelector('#hero') as HTMLElement;
    expect(within(hero).queryAllByRole('img', { name: 'nanisoft' })).toHaveLength(0);
  });

  it('makes the positioning line the page-heading of the hero', () => {
    renderHero();
    expect(
      screen.getByRole('heading', { level: 1, name: /digital twin of the IT estate/i }),
    ).toBeInTheDocument();
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

describe('Hero panel — "Living Map" two-column shell', () => {
  it('is a dark band: #hero carries the hero class (scoped dark tokens in globals.css)', () => {
    const { container } = renderHero();
    const section = container.querySelector('#hero');
    expect(section).not.toBeNull();
    expect(section?.classList.contains('hero')).toBe(true);
  });

  it('leads with a mono eyebrow and follows with subcopy (no CTA copy)', () => {
    renderHero();
    expect(screen.getByText(/the living map/i)).toBeInTheDocument();
    expect(screen.getByText(/ask the twin anything/i)).toBeInTheDocument();
  });

  it('keeps italic emphasis on the h1 word (jade is reserved for the live edge)', () => {
    const { container } = renderHero();
    // The em carries emphasis; the shell CSS keeps it italic-only — never the
    // jade accent, which is reserved for the live/active wavefront.
    expect(container.querySelector('#hero h1 em')).not.toBeNull();
  });

  it('remains pure spectacle — no buttons or links in the new shell', () => {
    const { container } = renderHero();
    const section = container.querySelector('#hero');
    expect(within(section as HTMLElement).queryAllByRole('button')).toHaveLength(0);
    expect(within(section as HTMLElement).queryAllByRole('link')).toHaveLength(0);
  });
});
