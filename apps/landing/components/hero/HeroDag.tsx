'use client';

/**
 * The hero DAG renderer — pure spectacle, no controls (SPEC §3.1 / ticket 19).
 *
 * Renders the laid-out graph from ./hero-graph as inline SVG and drives three
 * motion systems off one requestAnimationFrame loop (all four identity motion
 * principles on cubic-bezier(.32,.72,0,1)):
 *
 *  - traverse: the jade wavefront — a soft gradient front hopping column to
 *    column every ~1.05s (the prototype cadence), brand-eased per hop;
 *  - breathe/ripple: the active column's chips brighten (jade stroke, per the
 *    playground's active-node language) and each chip plays one arrival ring;
 *  - settle: chips rise into place once on mount, staggered by column;
 *  - haptic depth: pointer proximity attracts chips slightly, brightens nearby
 *    edges, and shifts the background layers on parallax — all imperative
 *    writes on refs, zero React state per frame.
 *
 * prefers-reduced-motion (or any environment without rAF) renders the settled
 * end-state: identical content, wavefront parked at Core, no loop.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { easingTuple } from '@nanisoft/identity';
import { buildHeroGraph, cubicBezier, roundedPath } from './hero-graph';

const EASE = cubicBezier(easingTuple[0], easingTuple[1], easingTuple[2], easingTuple[3]);
const HOP_MS = 1050; // prototype step cadence (~1.1s, tuned)
const MOVE_MS = 880; // moving portion of each hop; the rest dwells
const FADE_IN_MS = 260;
const FADE_OUT_MS = 520;

/** Resting place of the settled wavefront: the Core column (Atlas's home). */
const SETTLED_COL = 6;

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function HeroDag() {
  const g = useMemo(() => buildHeroGraph(), []);
  const [reduced, setReduced] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const beamRef = useRef<SVGGElement>(null);
  const layerRefs = useRef<Record<string, SVGGElement | null>>({
    phases: null,
    platform: null,
    observer: null,
    spine: null,
  });
  const nodeEls = useRef(new Map<string, SVGGElement>());
  const edgeEls = useRef(new Map<string, SVGPathElement>());

  // Hydration-safe reduced-motion flip (the global CSS clamp covers frame one).
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // The single animation loop: wavefront traverse + pointer haptics.
  useEffect(() => {
    if (reduced || typeof requestAnimationFrame !== 'function') return undefined;
    const svg = svgRef.current;
    if (!svg) return undefined;

    const W = g.width;
    const H = g.height;
    const stops = g.columnXs;
    const cycle = stops.length * HOP_MS;

    const nodes = [...nodeEls.current.values()].map((el) => ({
      el,
      cx: Number(el.dataset.cx),
      cy: Number(el.dataset.cy),
      active: false,
    }));
    const edges = [...edgeEls.current.values()].map((el) => ({
      el,
      mx: Number(el.dataset.mx),
      base: Number(el.dataset.base),
    }));

    // Pointer in viewBox coordinates (meet letterboxing accounted for).
    const pointer = { tx: W / 2, ty: H / 2, x: W / 2, y: H / 2 };
    let gain = 0; // eases pointer effects to rest on leave
    const hoverNone = (() => {
      try {
        return window.matchMedia('(hover: none)').matches;
      } catch {
        return false;
      }
    })();

    const toViewBox = (clientX: number, clientY: number) => {
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return { x: W / 2, y: H / 2 };
      const s = Math.min(r.width / W, r.height / H);
      const ox = (r.width - W * s) / 2;
      const oy = (r.height - H * s) / 2;
      return { x: (clientX - r.left - ox) / s, y: (clientY - r.top - oy) / s };
    };
    const onMove = (ev: PointerEvent) => {
      const p = toViewBox(ev.clientX, ev.clientY);
      pointer.tx = p.x;
      pointer.ty = p.y;
    };

    let raf = 0;
    let prevCol = -1;
    const t0 = performance.now();

    const tick = (now: number) => {
      const tau = (now - t0) % cycle;
      const idx = Math.min(stops.length - 1, Math.floor(tau / HOP_MS));
      const hopFrac = Math.min(1, (tau - idx * HOP_MS) / MOVE_MS);
      const eased = EASE(hopFrac);
      const from = stops[idx];
      const to = stops[Math.min(idx + 1, stops.length - 1)];
      const bx = idx === stops.length - 1 ? from : from + (to - from) * eased;

      // Wavefront fades in at Sources and out past Compass, then wraps.
      const fade =
        Math.min(1, tau / FADE_IN_MS) * Math.min(1, (cycle - tau) / FADE_OUT_MS);
      const beamOn = fade > 0.05;
      if (beamRef.current) {
        beamRef.current.style.transform = `translateX(${bx}px)`;
        beamRef.current.style.opacity = String(0.28 + 0.62 * fade);
      }

      // Column activation (traverse arrival → breathe + ripple).
      if (idx !== prevCol) {
        for (const [, el] of nodeEls.current) {
          const colEl = el.closest('[data-col]');
          if (colEl) colEl.classList.toggle('is-active', Number(colEl.getAttribute('data-col')) === idx);
        }
        prevCol = idx;
      }

      // Pointer smoothing + global gain.
      pointer.x += (pointer.tx - pointer.x) * 0.14;
      pointer.y += (pointer.ty - pointer.y) * 0.14;
      const targetGain = hoverNone ? 0 : 1;
      gain += (targetGain - gain) * 0.06;
      const pdx = pointer.x - W / 2;
      const pdy = pointer.y - H / 2;

      // Layer parallax (haptic depth: far bands drift against the pointer).
      for (const [name, el] of Object.entries(layerRefs.current)) {
        if (!el) continue;
        const depth = name === 'phases' ? 9 : name === 'platform' ? 7 : name === 'observer' ? 5 : 2.5;
        el.style.transform = `translate(${-pdx * gain * (depth / 10)}px, ${-pdy * gain * (depth / 10)}px)`;
      }

      // Nodes: proximity attraction + brightness; wavefront lights its column.
      const R = 175;
      for (const n of nodes) {
        const dx = pointer.x - n.cx;
        const dy = pointer.y - n.cy;
        const d = Math.hypot(dx, dy);
        const w = gain * Math.max(0, 1 - d / R);
        const lift = 1 + w * 0.05;
        n.el.style.transform = `translate(${dx * w * 0.09}px, ${dy * w * 0.09}px) scale(${lift})`;
        const nearBeam = Math.abs(n.cx - bx) < 82 && beamOn;
        if (nearBeam !== n.active) {
          n.active = nearBeam;
          n.el.classList.toggle('is-active', nearBeam);
        }
      }

      // Edges: brighten toward the pointer and around the wavefront.
      for (const e of edges) {
        const pw = gain * Math.max(0, 1 - Math.hypot(pointer.x - e.mx, pointer.y - 330) / 150);
        const bw = Math.max(0, 1 - Math.abs(e.mx - bx) / 130) * (beamOn ? 1 : 0);
        const o = Math.min(1, e.base + 0.45 * Math.max(pw, bw));
        e.el.setAttribute('stroke-opacity', o.toFixed(3));
      }

      raf = requestAnimationFrame(tick);
    };

    svg.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      svg.removeEventListener('pointermove', onMove);
    };
  }, [reduced, g]);

  const settledX = g.columnXs[SETTLED_COL];

  const renderNode = (id: string) => {
    const n = g.nodeById[id];
    const custom = n.component.kind === 'custom';
    const sub =
      n.component.realName && n.component.realName !== n.component.codename
        ? n.component.realName
        : null;
    return (
      <g
        key={id}
        data-node-id={id}
        data-cx={n.cx}
        data-cy={n.cy}
        className={`hero-node${custom ? ' is-custom' : ''}`}
        ref={(el) => {
          if (el) nodeEls.current.set(id, el);
          else nodeEls.current.delete(id);
        }}
      >
        <g className="hero-settle" style={{ animationDelay: `${Math.max(0, n.col) * 70}ms` }}>
          <circle className="hero-ring" cx={n.cx} cy={n.cy} r={30} />
          <rect
            x={n.cx - n.w / 2}
            y={n.cy - n.h / 2}
            width={n.w}
            height={n.h}
            rx={12}
            className="hero-chip"
          />
          <text
            className="mono hero-label"
            x={n.cx}
            y={sub ? n.cy - 2 : n.cy + 4}
            textAnchor="middle"
          >
            {n.component.codename}
          </text>
          {sub && (
            <text className="mono hero-sublabel" x={n.cx} y={n.cy + 13} textAnchor="middle">
              {sub}
            </text>
          )}
          <title>{`${n.component.codename}${sub ? ` (${sub})` : ''} — ${n.component.description}`}</title>
        </g>
      </g>
    );
  };

  const spineByCol: string[][] = Array.from({ length: g.columnXs.length }, () => []);
  for (const n of g.nodes) {
    if (n.band === 'spine') spineByCol[n.col].push(n.id);
  }

  return (
    <div ref={rootRef} className="hero-dag" data-motion={reduced ? 'settled' : 'live'}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${g.width} ${g.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="nanisoft digital-twin pipeline: source systems flow left to right through Schema, Ingestion, Transform, and Investigation phases to Compass, while Watchtower observes from above"
      >
        <desc>
          A directed acyclic pipeline of the real architecture. Source systems (Active Directory,
          Workday HR, SQL Server Fleet) feed ingestion (Airbyte, Scout, Trailhead); schema tools
          (Blueprint, Bridge) define and sync types; Forge transforms into the Bedrock lakehouse;
          Overlook queries it for Atlas, which serves Compass and Superset. Anchor, Conveyor, and
          OpenBao provision the platform; Watchtower observes from above. A jade wavefront flows
          through the stages.
        </desc>
        <defs>
          <linearGradient id="hero-beam-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0" />
            <stop offset="0.5" stopColor="var(--color-accent)" stopOpacity="0.34" />
            <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
          <marker id="hero-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" className="hero-arrow-body" />
          </marker>
          <marker id="hero-arrow-dim" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" className="hero-arrow-body" />
          </marker>
        </defs>

        {/* Phase context: Schema → Ingestion → Transform → Investigation */}
        <g
          className="hero-phases"
          ref={(el) => {
            layerRefs.current.phases = el;
          }}
        >
          {g.phases.map((p) => (
            <g key={p.id} opacity={p.subtle ? 0.55 : 0.85}>
              <line
                x1={p.x0}
                y1={492}
                x2={p.x1}
                y2={492}
                strokeDasharray={p.subtle ? '2 5' : undefined}
                className="hero-phase-rule"
              />
              <text className="mono hero-phase-label" x={(p.x0 + p.x1) / 2} y={512} textAnchor="middle">
                {p.name}
              </text>
            </g>
          ))}
        </g>

        {/* Directed edges (solid = data flow, dotted = platform cross-cut). */}
        <g className="hero-edges">
          {g.edges.map((e) => {
            const first = e.waypoints[0];
            const last = e.waypoints[e.waypoints.length - 1];
            const mx = (first.x + last.x) / 2;
            const base = e.dotted ? 0.32 : 0.48;
            return (
              <path
                key={e.id}
                data-edge-id={e.id}
                data-mx={mx.toFixed(1)}
                data-base={base}
                className={`hero-edge${e.dotted ? ' is-dotted' : ''}`}
                d={roundedPath(e.waypoints)}
                markerEnd={`url(#${e.dotted ? 'hero-arrow-dim' : 'hero-arrow'})`}
                fill="none"
                strokeOpacity={base}
              />
            );
          })}
        </g>

        {/* Platform band (provisioning / secrets) behind the spine. */}
        <g
          ref={(el) => {
            layerRefs.current.platform = el;
          }}
        >
          {g.nodes.filter((n) => n.band === 'platform').map((n) => renderNode(n.id))}
        </g>

        {/* Watchtower, the cross-cutting observer, above everything. */}
        <g
          ref={(el) => {
            layerRefs.current.observer = el;
          }}
        >
          {g.nodes.filter((n) => n.band === 'observer').map((n) => renderNode(n.id))}
        </g>

        {/* Spine columns (grouped so the wavefront can light a whole column). */}
        <g
          ref={(el) => {
            layerRefs.current.spine = el;
          }}
        >
          {spineByCol.map((ids, col) => (
            <g key={col} className="hero-col" data-col={col}>
              {ids.map(renderNode)}
            </g>
          ))}
        </g>

        {/* The jade wavefront (live) — parked at Core in the settled state. */}
        <g
          ref={beamRef}
          className="hero-beam"
          aria-hidden
          style={
            reduced
              ? { transform: `translateX(${settledX}px)`, opacity: 0.55 }
              : { transform: `translateX(${g.columnXs[0]}px)`, opacity: 0 }
          }
        >
          <rect x={-78} y={36} width={156} height={430} fill="url(#hero-beam-grad)" />
        </g>
      </svg>

      <style>{`
        .hero-dag { width: 100%; height: 100%; }
        .hero-dag svg { display: block; width: 100%; height: 100%; }
        .hero-dag .mono { font-family: var(--font-mono), 'JetBrains Mono', ui-monospace, monospace; }

        .hero-chip {
          fill: var(--color-bg-elev);
          stroke: var(--color-border);
          stroke-width: 1;
          transition: stroke 300ms var(--ease-brand, cubic-bezier(.32,.72,0,1)), filter 300ms linear;
        }
        .hero-node.is-custom .hero-chip { stroke: var(--color-secondary); stroke-width: 1.25; }
        .hero-node { transform-box: fill-box; transform-origin: center; }
        .hero-node.is-active .hero-chip {
          stroke: var(--color-accent);
          stroke-width: 1.5;
          filter: drop-shadow(0 0 6px color-mix(in srgb, var(--color-accent) 35%, transparent));
        }
        .hero-label { font-size: 11.5px; fill: var(--color-text); transition: fill 200ms linear; }
        .hero-node.is-active .hero-label { fill: var(--color-text); }
        .hero-sublabel { font-size: 8.5px; letter-spacing: 0.03em; fill: var(--color-text-muted); }

        .hero-edge { stroke: var(--color-text-muted); stroke-width: 1.25; }
        .hero-edge.is-dotted { stroke-width: 1; stroke-dasharray: 2 5; }
        .hero-arrow-body { fill: var(--color-text-muted); }

        .hero-phase-rule { stroke: var(--color-border); stroke-width: 1; }
        .hero-phase-label { font-size: 11px; letter-spacing: 0.22em; fill: var(--color-text-muted); text-transform: uppercase; }

        .hero-ring {
          fill: none;
          stroke: var(--color-accent);
          opacity: 0;
        }
        .hero-col.is-active .hero-ring {
          animation: heroRing 640ms cubic-bezier(.32,.72,0,1) 1 both;
        }
        @keyframes heroRing {
          0%   { opacity: 0.75; transform: scale(0.55); }
          100% { opacity: 0;    transform: scale(1.5); }
        }
        .hero-ring { transform-box: fill-box; transform-origin: center; }

        .hero-settle { animation: heroSettle 520ms cubic-bezier(.32,.72,0,1) both; }
        @keyframes heroSettle {
          0%   { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Settled end-state: content intact, motion removed. */
        .hero-dag[data-motion='settled'] .hero-settle { animation: none; }
        .hero-dag[data-motion='settled'] .hero-col.is-active .hero-ring { animation: none; opacity: 0; }
      `}</style>
    </div>
  );
}
