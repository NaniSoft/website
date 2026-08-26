import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  buildSectionGraph,
  deriveSectionState,
  SECTION_GEOMETRY,
} from '@/lib/spine-graph';
import { ArchitectureSection } from '@/components/ArchitectureSection';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

// antd's Button (under PillButton) schedules async state updates after mount in
// jsdom; flush the macrotask queue so they land inside act().
async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function renderSection() {
  return render(
    <ThemeProvider>
      <ArchitectureSection />
    </ThemeProvider>
  );
}

// ── Pure layer: layout derivation ─────────────────────────────────────────────

describe('section graph (pure derivation from the model)', () => {
  const g = buildSectionGraph();

  it('renders every staged, observer, and platform component exactly once', () => {
    // 15 staged + Watchtower + Anchor/Conveyor/OpenBao = 19; personas excluded.
    expect(g.nodes).toHaveLength(19);
    expect(new Set(g.nodes.map((n) => n.id)).size).toBe(19);
  });

  it('derives five phase bands: Sources + the four phases in spine order', () => {
    expect(g.bands.map((b) => b.name)).toEqual([
      'Sources',
      'Schema',
      'Ingestion',
      'Transform',
      'Investigation',
    ]);
    expect(g.bands[0].subtle).toBe(true);
    for (let i = 1; i < g.bands.length; i++) expect(g.bands[i].subtle).toBe(false);
  });

  it('orders bands left to right without overlap', () => {
    for (let i = 1; i < g.bands.length; i++) {
      expect(g.bands[i].x0).toBeGreaterThanOrEqual(g.bands[i - 1].x1);
    }
  });

  it('drops the persona edges and keeps every rendered-endpoint edge', () => {
    const ids = g.edges.map((e) => e.id);
    // Persona endpoints are not rendered — their edges must be gone.
    expect(ids).not.toContain('schema-author__blueprint');
    expect(ids).not.toContain('analyst__compass');
    expect(ids).not.toContain('compliance__superset');
    expect(ids).not.toContain('platform-engineer__atlas');
    // 31 model edges − 4 persona edges.
    expect(g.edges).toHaveLength(27);
  });

  it('never routes an edge through an unrelated component chip', () => {
    // Every polyline segment must avoid rectangles of non-endpoint nodes —
    // the machine-checked version of the manual routing pass.
    const pad = 1; // tolerate boundary touching
    const clear: string[] = [];
    for (const e of g.edges) {
      const rects = g.nodes
        .filter((n) => n.id !== e.from && n.id !== e.to)
        .map((n) => ({
          id: n.id,
          x0: n.cx - SECTION_GEOMETRY.chipW / 2 - pad,
          x1: n.cx + SECTION_GEOMETRY.chipW / 2 + pad,
          y0: n.cy - SECTION_GEOMETRY.chipH / 2 - pad,
          y1: n.cy + SECTION_GEOMETRY.chipH / 2 + pad,
        }));
      for (let i = 0; i + 1 < e.points.length; i++) {
        const a = e.points[i];
        const b = e.points[i + 1];
        for (const r of rects) {
          const hit =
            Math.max(a.x, b.x) >= r.x0 &&
            Math.min(a.x, b.x) <= r.x1 &&
            Math.max(a.y, b.y) >= r.y0 &&
            Math.min(a.y, b.y) <= r.y1;
          if (hit) clear.push(`${e.id} seg${i} -> ${r.id}`);
        }
      }
    }
    expect(clear).toEqual([]);
  });

  it('routes every edge as a finite orthogonal path, bending only where needed', () => {
    for (const e of g.edges) {
      expect(e.d).toMatch(/^M\s/);
      expect(e.d).toContain('L');
      // Multi-segment routes get soft rounded 90° bends; two-point straights don't.
      if (e.points.length > 2) expect(e.d).toContain('Q');
      for (const p of e.points) {
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
      }
    }
  });

  it('separates mutually-opposed edges into distinct lanes', () => {
    const pairs = [
      ['atlas__overlook', 'overlook__atlas'],
      ['atlas__opa', 'opa__atlas'],
    ] as const;
    for (const [fwd, rev] of pairs) {
      const a = g.edges.find((e) => e.id === fwd)?.d;
      const b = g.edges.find((e) => e.id === rev)?.d;
      expect(a).toBeDefined();
      expect(b).toBeDefined();
      expect(a).not.toEqual(b);
    }
  });

  it('sends the long Bridge → Atlas haul through the bottom channel', () => {
    const e = g.edges.find((edge) => edge.id === 'bridge__atlas');
    expect(e).toBeDefined();
    // The bottom-most feature of this route is the shared channel below the spine.
    const ys = e!.points.map((p) => p.y);
    expect(Math.max(...ys)).toBe(SECTION_GEOMETRY.channelY);
    expect(e!.points.some((p) => p.y === SECTION_GEOMETRY.channelY)).toBe(true);
  });

  it('places the Watchtower observer above the spine and clear of the platform band', () => {
    const wt = g.nodes.find((n) => n.id === 'watchtower');
    const platform = g.nodes.filter((n) => ['anchor', 'conveyor', 'openbao'].includes(n.id));
    expect(wt).toBeDefined();
    for (const p of platform) {
      expect(wt!.cy).toBeLessThan(p.cy - SECTION_GEOMETRY.chipH);
    }
    // …and above every staged chip.
    const staged = g.nodes.filter((n) => !['watchtower', 'anchor', 'conveyor', 'openbao'].includes(n.id));
    for (const s of staged) expect(wt!.cy).toBeLessThan(s.cy - SECTION_GEOMETRY.chipH);
  });
});

// ── Pure layer: scroll-state reducer ──────────────────────────────────────────

describe('section state reducer (jade = active, teal = done)', () => {
  it('starts with Schema active and nothing done', () => {
    const s = deriveSectionState(0);
    expect(s.bands['band-schema']).toBe('active');
    expect(s.bands['band-ingestion']).toBe('idle');
    expect(s.bands['band-sources']).toBe('idle');
    expect(Object.values(s.nodes)).not.toContain('done');
    expect(s.nodes['blueprint']).toBe('active');
    expect(s.edges['blueprint__bridge']).toBe('active');
    // Data lands downstream later — not yet flowing.
    expect(s.edges['bridge__bedrock']).toBe('idle');
  });

  it('ends with Investigation active and the first three phases done', () => {
    const s = deriveSectionState(3);
    for (const id of ['band-schema', 'band-ingestion', 'band-transform']) {
      expect(s.bands[id]).toBe('done');
    }
    expect(s.bands['band-investigation']).toBe('active');
    expect(s.nodes['atlas']).toBe('active');
    expect(s.nodes['compass']).toBe('active');
    expect(s.edges['blueprint__bridge']).toBe('done');
    expect(s.edges['forge__bedrock']).toBe('done');
    expect(s.edges['atlas__opa']).toBe('active');
  });

  it('marks source systems done once ingestion has run', () => {
    expect(deriveSectionState(0).nodes['active-directory']).toBe('idle');
    expect(deriveSectionState(1).nodes['active-directory']).toBe('done');
  });

  it('keeps the cross-cutting platform/observer edges neutral', () => {
    for (let k = 0; k < 4; k++) {
      const s = deriveSectionState(k);
      expect(s.edges['watchtower__atlas']).toBe('idle');
      expect(s.edges['anchor__atlas']).toBe('idle');
      expect(s.nodes['watchtower']).toBe('idle');
    }
  });

  it('always lights exactly one phase band', () => {
    for (let k = 0; k < 4; k++) {
      const s = deriveSectionState(k);
      const active = Object.entries(s.bands).filter(([, v]) => v === 'active');
      expect(active).toHaveLength(1);
    }
  });

  it('clamps out-of-range indices to the ends', () => {
    expect(deriveSectionState(9)).toEqual(deriveSectionState(3));
    expect(deriveSectionState(-2)).toEqual(deriveSectionState(0));
  });
});

// ── Component ─────────────────────────────────────────────────────────────────

describe('ArchitectureSection', () => {
  it('renders the how-we-build-it heading and intro', async () => {
    renderSection();
    await flush();
    expect(screen.getByRole('heading', { name: /how we build it/i })).toBeInTheDocument();
  });

  it('shows all four phase labels and key codenames', async () => {
    renderSection();
    await flush();
    for (const label of ['Schema', 'Ingestion', 'Transform', 'Investigation']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('Watchtower')).toBeInTheDocument();
    expect(screen.getByText('Atlas')).toBeInTheDocument();
    expect(screen.getByText('Compass')).toBeInTheDocument();
    expect(screen.getByText('Bedrock')).toBeInTheDocument();
  });

  it('bridges to the playground domain with a plain-label pill link', async () => {
    renderSection();
    await flush();
    const cta = screen.getByRole('link', { name: 'Open the playground' });
    expect(cta).toHaveAttribute('href', 'https://playground.nanisoft.com');
    expect(cta).toHaveAttribute('target', '_blank');
    expect(cta).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('starts scroll-driven at the Schema phase before any scrolling', async () => {
    renderSection();
    await flush();
    expect(document.querySelector('[data-band="band-schema"]')).toHaveAttribute(
      'data-status',
      'active'
    );
    expect(document.querySelector('[data-band="band-investigation"]')).toHaveAttribute(
      'data-status',
      'idle'
    );
  });

  it('renders the settled four-phase state statically under prefers-reduced-motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    try {
      renderSection();
      await flush();
      expect(document.querySelector('[data-band="band-investigation"]')).toHaveAttribute(
        'data-status',
        'active'
      );
      expect(document.querySelector('[data-band="band-schema"]')).toHaveAttribute(
        'data-status',
        'done'
      );
      expect(document.querySelector('[data-band="band-transform"]')).toHaveAttribute(
        'data-status',
        'done'
      );
    } finally {
      window.matchMedia = original;
    }
  });

  it('collapses the scroll track to auto height and drops sticky under prefers-reduced-motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    try {
      renderSection();
      await flush();
      const track = document.querySelector('[data-arch-track]') as HTMLElement;
      expect(track).not.toBeNull();
      expect(track.style.height).toBe('auto');
      // The inner panel must not be position: sticky under reduced motion —
      // it renders in normal flow so the tall 320vh sticky track is gone.
      const inner = track.firstElementChild as HTMLElement;
      expect(inner.style.position).not.toBe('sticky');
    } finally {
      window.matchMedia = original;
    }
  });

  it('keeps the full 320vh sticky track under default (no reduced-motion) preferences', async () => {
    renderSection();
    await flush();
    const track = document.querySelector('[data-arch-track]') as HTMLElement;
    expect(track).not.toBeNull();
    expect(track.style.height).toBe('320vh');
    const inner = track.firstElementChild as HTMLElement;
    expect(inner.style.position).toBe('sticky');
  });

  it('announces phase captions through a stable polite live region (no per-phase remount)', async () => {
    renderSection();
    await flush();
    const live = screen.getByRole('status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    // The caption text lives inside the live region; the phase index prefix
    // is present and updates in place (no key-driven remount of the wrapper).
    expect(live.textContent).toContain('01 / 04');
    expect(live.textContent).toContain('Schema');
  });
});
