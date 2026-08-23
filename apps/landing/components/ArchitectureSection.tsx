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
    'Schema first. Blueprint authors the types; the Bridge syncs them to Bedrock DDL and refreshes Atlas’s SchemaRegistry cache — so “sensitive” is defined before any data flows.',
  ingestion:
    'Trailhead orchestrates the pull: connectors extract from Active Directory, Workday HR, and the SQL Server fleet and land raw rows in Bronze.',
  transform: (
    <>
      Forge conforms the raw rows into Silver tables and the Gold graph —{' '}
      <span className="mono">graph_nodes</span> and <span className="mono">graph_edges</span> —
      scoring confidence along the way.
    </>
  ),
  investigation:
    'The twin is now queryable. Overlook surfaces the finding as a row, Compass draws it as edges, Superset charts it — governed by Atlas and OPA.',
};

const ACCENT = 'var(--color-accent)';
const SECONDARY = 'var(--color-secondary)';

function strokeFor(s: ElementStatus): string {
  return s === 'active' ? ACCENT : s === 'done' ? SECONDARY : 'var(--color-border)';
}

function markerFor(s: ElementStatus): string {
  return `url(#arch-arrow-${s})`;
}

export function ArchitectureSection() {
  const graph = useMemo(() => buildSectionGraph(), []);
  const trackRef = useRef<HTMLDivElement | null>(null);

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

  const activeIdx = reduced ? PHASES.length - 1 : idx;
  const state = useMemo(() => deriveSectionState(activeIdx), [activeIdx]);
  const G = SECTION_GEOMETRY;
  const HW = G.chipW / 2;
  const HH = G.chipH / 2;

  return (
    <section id="architecture" aria-labelledby="architecture-heading" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 id="architecture-heading" style={{ fontSize: 40, lineHeight: 1.2, fontWeight: 700, margin: '0 0 16px', maxWidth: 720 }}>
        How we build it
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 680, margin: '0 0 8px' }}>
        One directed pipeline, composed from proven open-source parts around the four things we
        build ourselves: Atlas, Compass, the DataGerry Bridge, and Scout. Scroll to follow data
        from schema to finding.
      </p>

      <div ref={trackRef} style={{ position: 'relative', height: '320vh' }}>
        <div style={{ position: 'sticky', top: '10vh', background: 'var(--color-bg)', padding: '24px 0' }}>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: radius.card, background: 'var(--color-bg-elev)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
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
                          stroke: isSources ? 'transparent' : st === 'active' ? ACCENT : st === 'done' ? SECONDARY : 'var(--color-border)',
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
                          letterSpacing: '0.16em',
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
                        y={n.cy - (n.component.realName ? 6 : 0)}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontFamily: font.voice, fontSize: 12.5, fontWeight: 600, fill: 'var(--color-text)' }}
                      >
                        {n.component.codename}
                      </text>
                      {n.component.realName && (
                        <text
                          x={n.cx}
                          y={n.cy + 12}
                          textAnchor="middle"
                          dominantBaseline="central"
                          {...(n.component.realName.length * 4.8 > G.chipW - 12
                            ? { textLength: G.chipW - 12, lengthAdjust: 'spacingAndGlyphs' as const }
                            : {})}
                          style={{ fontFamily: font.data, fontSize: 8, fill: 'var(--color-text-muted)' }}
                        >
                          {n.component.realName}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Active-phase caption — narrates what the reader is looking at. */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '4px 20px 18px', flexWrap: 'wrap' }}>
              <span
                key={`i${activeIdx}`}
                className="mono arch-caption"
                style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--color-text)' }}
              >
                {`0${activeIdx + 1} / 04 · ${PHASES[activeIdx].name.toUpperCase()}`}
              </span>
              <p key={`c${activeIdx}`} className="arch-caption" style={{ margin: 0, fontSize: 15, maxWidth: 760, color: 'var(--color-text-muted)' }}>
                {PHASE_CAPTIONS[PHASES[activeIdx].id]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bridge CTA — always visible, never gated behind scroll depth. */}
      <div style={{ textAlign: 'center', padding: '40px 0 8px' }}>
        <PillButton type="primary" size="large" href={PLAYGROUND_URL} target="_blank" rel="noopener noreferrer">
          Try it in the playground
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
      `}</style>
    </section>
  );
}
