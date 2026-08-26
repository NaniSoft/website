'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PHASES, type PhaseId } from '@nanisoft/architecture';
import { easing, font, radius } from '@nanisoft/identity';
import { PillButton } from './PillButton';
import {
  buildSectionGraph,
  deriveSectionState,
  SECTION_GEOMETRY,
  VIEW_HEIGHT,
  VIEW_TOP,
  VIEW_WIDTH,
  type ElementStatus,
} from '@/lib/spine-graph';

/**
 * Ticket 20 — the "how we build it" section: the directed pipeline rendered
 * from the shared architecture model (same spine the playground renders),
 * scroll-animated through Schema → Ingestion → Transform → Investigation
 * (jade = active, teal = done, identical semantics), ending in the bridge CTA
 * to playground.nanisoft.com — the site's first link to the playground domain.
 *
 * Motion: traverse/settle on the brand easing while scrolling; under
 * prefers-reduced-motion no listeners are attached and the settled four-phase
 * end-state renders statically — content is never removed.
 */

const PLAYGROUND_URL = 'https://playground.nanisoft.com';

/** Landing-tone narration per phase (component-local copy; lib/data.ts untouched). */
const PHASE_CAPTIONS: Record<PhaseId, ReactNode> = {
  schema:
    'Schema first. Blueprint authors the types; the Bridge syncs them to Bedrock table definitions and refreshes Atlas’s schema cache — so “sensitive” is defined before any data flows.',
  ingestion:
    'Trailhead orchestrates the pull: connectors extract from Active Directory, Workday HR, and the SQL Server fleet and land raw rows in Bronze.',
  transform: (
    <>
      Forge conforms the raw rows into Silver tables and the Gold graph — the node and edge tables —
      scoring confidence along the way.
    </>
  ),
  investigation:
    'The twin is now queryable. Overlook surfaces the finding as a row, Compass draws it as edges, Superset charts it — governed by Atlas and OPA.',
};

const ACCENT = 'var(--color-accent)';
const SECONDARY = 'var(--color-secondary)';

// Strokes must pass 3:1 against --color-bg-elev in BOTH modes. The brand
// hues fail on one surface each (jade on light bg-elev 2.87:1, teal on dark
// bg-elev 2.81:1), so the stroke colors flip per theme via role tokens set
// on the section root (see the <style> block below): light uses the darker
// --color-accent-strong + brand teal; dark uses brand jade + the lighter
// --color-secondary-on-dark. Band/chip fills stay on the brand hues — they
// are low-opacity tints, not contrast-critical UI strokes.
const STROKE_ACTIVE = 'var(--arch-stroke-active)';
const STROKE_DONE = 'var(--arch-stroke-done)';

function strokeFor(s: ElementStatus): string {
  return s === 'active' ? STROKE_ACTIVE : s === 'done' ? STROKE_DONE : 'var(--color-border)';
}

function markerFor(s: ElementStatus): string {
  return `url(#arch-arrow-${s})`;
}

export function ArchitectureSection() {
  const graph = useMemo(() => buildSectionGraph(), []);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Reduced motion: settle into the full four-phase end-state as soon as
  // hydration allows (the global reduced-motion CSS makes the swap instant —
  // no visible flip) and never attach the scroll driver. The check lives in an
  // effect, not lazy state, so server and first client render agree.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Scroll driver: progress of the tall wrapper through the viewport maps to
  // the active phase. rAF-throttled passive listeners; native scrolling is
  // never hijacked. Server HTML renders phase 0 — no hydration mismatch.
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const compute = () => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      setIdx(Math.min(PHASES.length - 1, Math.floor(p * PHASES.length)));
    };
    const onScroll = () => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          compute();
        });
      }
    };
    // Compute once on entry so anchor links / scroll restoration land on the
    // right phase without waiting for a scroll tick.
    const initial = requestAnimationFrame(compute);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(initial);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Horizontal-scroll cue (finding 7): the 900px-min-width SVG pans inside an
  // overflowX:auto box that is narrower than the diagram on small viewports;
  // the right-side chips (Compass/Atlas/OPA) are reachable only past a scroll
  // edge with no visible cue. Show a right-edge gradient + "→" affordance that
  // hides once the box is scrolled to (within 1px of) its end. rAF-throttled
  // passive scroll listener — same pattern as the phase driver above.
  const [cue, setCue] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const recompute = () => {
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      const overflow = el.scrollWidth - el.clientWidth > 1;
      setCue(overflow && !atEnd);
    };
    let raf = 0;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; recompute(); });
    };
    recompute();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const activeIdx = reduced ? PHASES.length - 1 : idx;
  const state = useMemo(() => deriveSectionState(activeIdx), [activeIdx]);
  const G = SECTION_GEOMETRY;
  const HW = G.chipW / 2;
  const HH = G.chipH / 2;

  return (
    <section id="architecture" className="arch-section" aria-labelledby="architecture-heading" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 id="architecture-heading" style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 16px', maxWidth: 720 }}>
        How we build it.
      </h2>
      <p className="lead" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', maxWidth: 680, margin: '0 0 8px' }}>
        One directed pipeline, composed from proven open-source parts around the four things we
        build ourselves: Atlas, Compass, the DataGerry Bridge, and Scout. Scroll to follow data
        from schema to finding.
      </p>

      <div ref={trackRef} data-arch-track style={{ position: 'relative', height: reduced ? 'auto' : '320vh' }}>
        <div style={reduced ? { background: 'var(--color-bg)', padding: '24px 0' } : { position: 'sticky', top: '10vh', background: 'var(--color-bg)', padding: '24px 0' }}>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: radius.card, background: 'var(--color-bg-elev)', overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <div ref={scrollRef} style={{ overflowX: 'auto' }}>
                <svg
                  viewBox={`0 ${VIEW_TOP} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
                  role="img"
                  aria-labelledby="arch-svg-title arch-svg-desc"
                  style={{ display: 'block', width: '100%', minWidth: 900, height: 'auto' }}
                >
                <title id="arch-svg-title">nanisoft architecture pipeline</title>
                <desc id="arch-svg-desc">
                  Directed pipeline left to right: source systems feed Airbyte; Trailhead
                  orchestrates; Blueprint and the Bridge define the schema; Bedrock stores Bronze,
                  Silver, and Gold; Forge transforms; Overlook, Superset, Atlas, OPA, and Compass
                  query, govern, and visualize. Watchtower observes from above.
                </desc>

                <defs>
                  {(['idle', 'active', 'done'] as const).map((s) => (
                    <marker
                      key={s}
                      id={`arch-arrow-${s}`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="9"
                      markerHeight="9"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <path
                        d="M0,1 L9,5 L0,9 z"
                        style={{
                          fill:
                            s === 'idle'
                              ? 'color-mix(in srgb, var(--color-text-muted) 55%, transparent)'
                              : strokeFor(s),
                        }}
                      />
                    </marker>
                  ))}
                </defs>

                {/* Phase bands below the spine (drawn first — background). */}
                {graph.bands.map((b) => {
                  const st = state.bands[b.id] ?? 'idle';
                  const isSources = b.subtle;
                  return (
                    <g key={b.id} data-band={b.id} data-status={st}>
                      <rect
                        x={b.x0}
                        y={G.bandY}
                        width={b.x1 - b.x0}
                        height={G.bandH}
                        rx={radius.inner}
                        style={{
                          fill: isSources
                            ? 'transparent'
                            : st === 'active'
                              ? `color-mix(in srgb, ${ACCENT} 14%, transparent)`
                              : st === 'done'
                                ? `color-mix(in srgb, ${SECONDARY} 8%, transparent)`
                                : 'color-mix(in srgb, var(--color-bg-sunken) 55%, transparent)',
                          stroke: isSources ? 'transparent' : st === 'active' ? STROKE_ACTIVE : st === 'done' ? STROKE_DONE : 'var(--color-border)',
                          strokeWidth: st === 'active' ? 1.6 : 1,
                          strokeDasharray: isSources ? '4 4' : undefined,
                          transition: `fill .35s ${easing}, stroke .35s ${easing}`,
                        }}
                      />
                      <text
                        x={(b.x0 + b.x1) / 2}
                        y={G.bandY + G.bandH / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{
                          fontFamily: font.data,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 'var(--tracking-upper)',
                          textTransform: 'uppercase',
                          fill: isSources ? 'var(--color-text-muted)' : 'var(--color-text)',
                          transition: `fill .35s ${easing}`,
                        }}
                      >
                        {b.name}
                      </text>
                    </g>
                  );
                })}

                {/* Edges above bands, under chips. */}
                {graph.edges.map((e) => {
                  const st = state.edges[e.id] ?? 'idle';
                  const idleStroke =
                    e.dotted
                      ? 'color-mix(in srgb, var(--color-text-muted) 30%, transparent)'
                      : 'color-mix(in srgb, var(--color-text-muted) 48%, transparent)';
                  return (
                    <path
                      key={e.id}
                      data-edge={e.id}
                      data-status={st}
                      d={e.d}
                      fill="none"
                      markerEnd={markerFor(st)}
                      className={st === 'active' ? 'arch-edge arch-edge-flow' : 'arch-edge'}
                      style={{
                        stroke: st === 'idle' ? idleStroke : strokeFor(st),
                        strokeWidth: st === 'active' ? 2.2 : st === 'done' ? 1.8 : e.dotted ? 1.2 : 1.5,
                        strokeDasharray: st === 'active' ? '6 6' : e.dotted ? '2 5' : undefined,
                        transition: `stroke .35s ${easing}, stroke-width .35s ${easing}`,
                      }}
                    />
                  );
                })}

                {/* Component chips. */}
                {graph.nodes.map((n) => {
                  const st = state.nodes[n.id] ?? 'idle';
                  return (
                    <g key={n.id} data-node={n.id} data-status={st}>
                      <rect
                        x={n.cx - HW}
                        y={n.cy - HH}
                        width={G.chipW}
                        height={G.chipH}
                        rx={radius.inner}
                        style={{
                          fill:
                            st === 'active'
                              ? `color-mix(in srgb, ${ACCENT} 12%, var(--color-bg-elev))`
                              : 'var(--color-bg-elev)',
                          stroke: strokeFor(st),
                          strokeWidth: st === 'active' ? 2 : st === 'done' ? 1.5 : 1,
                          transition: `stroke .35s ${easing}, fill .35s ${easing}`,
                        }}
                      />
                      <text
                        x={n.cx}
                        y={n.cy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontFamily: font.voice, fontSize: 13, fontWeight: 600, fill: 'var(--color-text)' }}
                      >
                        {n.component.codename}
                      </text>
                    </g>
                  );
                })}
              </svg>
              </div>

              {/* Right-edge scroll cue (finding 7): gradient fade to --color-bg-elev
                  plus a "→" glyph, pinned to the visible right edge of the pan box.
                  Hides once scrollLeft + clientWidth >= scrollWidth - 1. Decorative —
                  the SVG itself is a role="img" with title/desc. */}
              {cue && (
                <div
                  aria-hidden="true"
                  data-arch-scroll-cue
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 56,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: 10,
                    fontSize: 20,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: 'var(--color-text-muted)',
                    background: 'linear-gradient(to right, transparent, var(--color-bg-elev))',
                  }}
                >
                  &rarr;
                </div>
              )}
            </div>

            {/* Active-phase caption — narrates what the reader is looking at.
                Stable polite live region (finding 13): the wrapper stays mounted
                and text updates in place, so scroll-driven narration reaches AT.
                No per-phase key remount — the arch-caption-in fade plays once. */}
            <div role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '4px 20px 18px', flexWrap: 'wrap' }}>
              <span
                className="mono arch-caption"
                style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: 'var(--tracking-upper)', color: 'var(--color-text)' }}
              >
                {`0${activeIdx + 1} / 04 · ${PHASES[activeIdx].name.toUpperCase()}`}
              </span>
              <p className="arch-caption" style={{ margin: 0, fontSize: 'var(--text-base)', maxWidth: 760, color: 'var(--color-text-muted)' }}>
                {PHASE_CAPTIONS[PHASES[activeIdx].id]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bridge CTA — always visible, never gated behind scroll depth. */}
      <div style={{ textAlign: 'center', padding: '40px 0 8px' }}>
        <PillButton type="primary" size="large" href={PLAYGROUND_URL} target="_blank" rel="noopener noreferrer">
          Open the playground
        </PillButton>
        <p style={{ marginTop: 14, marginBottom: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
          The same architecture runs interactively — seeded with a worked audit you can step through.
        </p>
      </div>

      <style>{`
        @keyframes arch-dash { to { stroke-dashoffset: -24; } }
        .arch-edge-flow { animation: arch-dash 900ms ${easing} infinite; }
        @keyframes arch-caption-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .arch-caption { animation: arch-caption-in 450ms ${easing} both; }
        @media (prefers-reduced-motion: reduce) {
          .arch-edge-flow, .arch-caption { animation: none !important; }
        }
        /* Per-theme stroke roles: light needs the darker jade (accent-strong)
           for active + brand teal for done; dark uses brand jade + the lighter
           secondary-on-dark. Specificity (0,1,1) beats the light (0,1,0) rule. */
        .arch-section {
          --arch-stroke-active: var(--color-accent-strong);
          --arch-stroke-done: var(--color-secondary);
        }
        [data-theme='dark'] .arch-section {
          --arch-stroke-active: var(--color-accent);
          --arch-stroke-done: var(--color-secondary-on-dark);
        }
      `}</style>
    </section>
  );
}
