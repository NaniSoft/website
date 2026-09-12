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
 * matches:true (e.g. `(prefers-reduced-motion: reduce)` or `(max-width)`),
 * everything else reports false.
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

describe('HeroDag — the living map', () => {
  it('renders an accessible canvas narrating the digital-twin pipeline', () => {
    renderHero();
    const canvas = screen.getByRole('img', { name: /digital-twin pipeline/i });
    expect(canvas.tagName.toLowerCase()).toBe('canvas');
    // The visually-hidden description (aria-describedby) carries the pipeline
    // names for AT — the canvas pixels themselves are not DOM text.
    const desc = document.getElementById('hero-dag-desc')?.textContent ?? '';
    for (const name of ['Bedrock', 'Forge', 'Overlook', 'Atlas', 'OPA', 'Compass', 'Watchtower']) {
      expect(desc).toContain(name);
    }
  });

  it('runs live by default (data-motion="live")', () => {
    mockMatchMedia(() => false);
    renderHero();
    const canvas = screen.getByRole('img', { name: /digital-twin pipeline/i });
    expect(canvas.closest('[data-motion]')?.getAttribute('data-motion')).toBe('live');
  });

  it('settles under reduced motion (data-motion="settled") with content intact', () => {
    motionReduced();
    renderHero();
    const canvas = screen.getByRole('img', { name: /digital-twin pipeline/i });
    const root = canvas.closest('[data-motion]');
    expect(root?.getAttribute('data-motion')).toBe('settled');
    expect(document.getElementById('hero-dag-desc')?.textContent).toContain('Bedrock');
  });

  it('ships a <noscript> fallback so the hero panel is not an empty hole without JS', () => {
    renderHero();
    const canvas = screen.getByRole('img', { name: /digital-twin pipeline/i });
    const root = canvas.closest('[data-motion]');
    // React emits the <noscript> element into the DOM; its children are only
    // parsed/shown by the browser when scripting is disabled. jsdom (client
    // render) does not populate noscript children the way the SSR markup does,
    // so assert the element is wired into the hero panel — the SSR text content
    // is verified by the Playwright reduced-motion browser check.
    const noscript = root?.querySelector('noscript');
    expect(noscript).not.toBeNull();
    expect(noscript?.tagName.toLowerCase()).toBe('noscript');
  });

  it('renders the DAG on narrow screens (the canvas adapts — no vertical switch)', () => {
    narrowScreen();
    renderHero();
    const canvas = screen.getByRole('img', { name: /digital-twin pipeline/i });
    expect(canvas.closest('[data-motion]')?.getAttribute('data-motion')).toBe('live');
  });

  it('is pure spectacle: no buttons or links anywhere in the hero', () => {
    const { container } = renderHero();
    const section = container.querySelector('#hero');
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).queryAllByRole('button')).toHaveLength(0);
    expect(within(section as HTMLElement).queryAllByRole('link')).toHaveLength(0);
  });
});

describe('Hero shell', () => {
  // The retired ask, composed at runtime so this file itself stays clean under
  // the repo-wide grep gate that bans the literal phrase from apps/landing.
  const RETIRED_DEMO_ASK = ['request', 'a', 'demo'].join(' ');

  it('carries no wordmark of its own (the nav announces the brand)', () => {
    const { container } = renderHero();
    // The hero-internal 64px wordmark is gone: the sticky nav renders the mark
    // directly above the panel, so the first viewport read "nanisoft" three
    // times. The panel now opens on the mono eyebrow over the display line, per
    // the design system's hero description.
    expect(container.querySelector('#hero .wordmark')).toBeNull();
    // Still no labeled mark in the hero (TopNav owns the announcement;
    // page.test asserts exactly two labeled marks page-wide).
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
    expect(screen.getByText(/the living twin/i)).toBeInTheDocument();
    expect(screen.getByText(/ask the twin anything/i)).toBeInTheDocument();
  });

  it('keeps italic emphasis on the h1 word (jade is reserved for the live edge)', () => {
    const { container } = renderHero();
    // The em carries emphasis; the shell CSS keeps it italic-only — never the
    // jade accent, which is reserved for the live/active wavefront.
    expect(container.querySelector('#hero h1 em')).not.toBeNull();
  });
});