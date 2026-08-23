'use client';

/**
 * The "estate to answer" hero traversal (task 4) — the site's ONE story:
 * raw estate systems flow through the platform and come out as an answered,
 * governed question.
 *
 * Five stations: Directory / HR / Databases → Land (Bronze) → Conform
 * (Silver) → Graph (Gold) → Serve (Atlas answers, policy-checked). One jade
 * pulse travels the whole route over a ~7s cycle: the three estate pulses
 * converge into a single governed flow, an arrival ring fires at every
 * station, the Gold stage forms a tiny records-become-nodes glyph, and Serve
 * reveals the payoff — "Who can reach this system?" with `policy ✓` and
 * `audited ✓` micro-badges — which dwells briefly before the cycle retells.
 *
 * Architecture (inherited from the retired HeroDag): one requestAnimationFrame
 * loop; every per-frame write is imperative on refs (zero React state per
 * frame); brand easing cubic-bezier(.32,.72,0,1) per segment; pointer
 * proximity life guarded by `(hover: none)` and eased back to rest; the loop
 * pauses while `document.hidden`.
 *
 * Narrow screens (<720px, matched like Hero's old breakpoint) switch to the
 * VERTICAL arrangement from ./hero-flow-layout — a second coordinate system,
 * not a CSS transform of the horizontal SVG.
 *
 * prefers-reduced-motion (or any environment without rAF) never starts the
 * loop: the rendered frame IS the settled end-state — the complete story
 * including the answer and both badges, the pulse parked at Graph — and the
 * server-rendered markup is exactly that frame (hydration-safe flip).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { easingTuple } from '@nanisoft/identity';
import {
  ANSWER_BADGES,
  ANSWER_QUESTION,
  buildFlowLayout,
  cubicBezier,
  pointAtFraction,
  type FlowPoint,
} from './hero-flow-layout';

const EASE = cubicBezier(easingTuple[0], easingTuple[1], easingTuple[2], easingTuple[3]);

// ── Timeline (one ~7s cycle: converge → three hops → dwell on the payoff → reset) ──
const SRC_MS = 1000; // estate pulses converge into Land
const HOP_MS = 1150; // Land → Conform → Graph → Serve, brand-eased per hop
const DWELL_MS = 1600; // hold the answered state so the payoff reads
const RESET_MS = 750; // answer + twin fade out; the cycle retells
const CYCLE_MS = SRC_MS + 3 * HOP_MS + DWELL_MS + RESET_MS; // 6800ms

/** Cycle time at which the pulse arrives at each station center. */
const ARRIVALS = [SRC_MS, SRC_MS + HOP_MS, SRC_MS + 2 * HOP_MS, SRC_MS + 3 * HOP_MS];
const SERVE_ARRIVAL = ARRIVALS[3];

const FADE_IN_MS = 260; // estate pulses fade in at the sources
const PULSE_FADE_MS = 350; // the pulse delivers and dissolves into Serve
const RING_MS = 640; // arrival-ring lifetime
const DRAW_MS = 650; // twin glyph draw-in after the Gold arrival
const REVEAL_MS = 450; // answer chip reveal after the Serve arrival
const BADGE_DELAY_MS = 400; // policy ✓, then audited ✓ ~400ms apart
const BADGE_MS = 260;

const POINTER_RADIUS = 150; // proximity-life radius (brief: ~150px)

const ARIA_LABEL =
  'The estate-to-answer journey: directory, HR, and database systems flow through Land, Conform, Graph, and Serve into an answered, policy-checked question.';

const DESC =
  'Raw copies from the estate’s directories, people systems, and databases land untouched in Bronze. Conforming shapes them so one person is one node. Records then become nodes and edges — the digital twin. Questions are served through Atlas, policy-checked and audited: here “Who can reach this system?” resolves with policy and audited checks. A jade pulse travels the flow; visitors who prefer reduced motion see this settled frame with the pulse resting at Graph.';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function HeroFlow() {
  // Hydration-safe defaults: server markup IS the settled frame; effects flip
  // to the real preference after mount (no SSR/client mismatch either way).
  const [settled, setSettled] = useState(true);
  const [vertical, setVertical] = useState(false);

  const L = useMemo(() => buildFlowLayout(vertical ? 'vertical' : 'horizontal'), [vertical]);

  const svgRef = useRef<SVGSVGElement>(null);
  const chipEls = useRef(new Map<string, SVGGElement>());
  const edgeEls = useRef(new Map<string, SVGPathElement>());
  const ringEls = useRef<Array<SVGCircleElement | null>>([null, null, null, null]);
  const srcDotEls = useRef<Array<SVGGElement | null>>([null, null, null]);
  const trunkDotEl = useRef<SVGGElement>(null);
  const twinGroupEl = useRef<SVGGElement>(null);
  const twinLineEl = useRef<SVGLineElement>(null);
  const twinNodeEls = useRef<Array<SVGCircleElement | null>>([null, null]);
  const answerEl = useRef<SVGGElement>(null);
  const badgeEls = useRef<Array<SVGGElement | null>>([null, null]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const onChange = () => setSettled(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Vertical arrangement below 720px — Hero's old breakpoint convention.
  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 719px)');
    if (!mq) return undefined;
    const onChange = () => setVertical(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // The single animation loop. Every animated property is rewritten each
  // frame from the cycle clock, so the settled server markup is cleanly
  // overridden on the first live frame.
  useEffect(() => {
    if (settled || typeof requestAnimationFrame !== 'function') return undefined;
    const svg = svgRef.current;
    if (!svg) return undefined;

    const W = L.width;
    const H = L.height;
    const anchors = L.trunkAnchors;
    const feeds = L.feedWaypoints;
    const serve = anchors[3];

    const chips = [...chipEls.current.values()].map((el) => ({
      el,
      glow: el.querySelector<SVGRectElement>('.hf-glow'),
      cx: Number(el.dataset.cx),
      cy: Number(el.dataset.cy),
    }));
    const connectors = [...edgeEls.current.values()].map((el) => ({
      el,
      mx: Number(el.dataset.mx),
      my: Number(el.dataset.my),
    }));

    const setDot = (el: SVGGElement | null, p: FlowPoint, opacity: number) => {
      if (!el) return;
      el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      el.style.opacity = opacity.toFixed(3);
    };

    // Pointer in viewBox coordinates (meet letterboxing accounted for).
    const pointer = { tx: W / 2, ty: H / 2, x: W / 2, y: H / 2 };
    let gain = 0; // eases pointer effects back to rest on leave
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

    // Cycle clock that pauses while the document is hidden.
    let base = 0;
    let mark = 0;
    let paused = typeof document !== 'undefined' && document.hidden;
    const elapsed = () => (paused ? base : base + (performance.now() - mark));

    let raf = 0;
    const tick = () => {
      const tau = elapsed() % CYCLE_MS;

      // Reset fade: the payoff dwells, then the transient layers dissolve.
      const resetFade =
        tau < SERVE_ARRIVAL + DWELL_MS
          ? 1
          : clamp01(1 - (tau - SERVE_ARRIVAL - DWELL_MS) / RESET_MS);

      // ── The traveling pulse ────────────────────────────────────────────
      let px = anchors[0].x;
      let py = anchors[0].y;
      let popacity = 0;
      if (tau <= SRC_MS) {
        // Estate pulses converge; their shared final leg merges them into one.
        const f = EASE(clamp01(tau / SRC_MS));
        const o = Math.min(1, tau / FADE_IN_MS);
        feeds.forEach((pts, i) => setDot(srcDotEls.current[i], pointAtFraction(pts, f), o));
        setDot(trunkDotEl.current, anchors[0], 0);
        const tip = pointAtFraction(feeds[1], f);
        px = tip.x;
        py = tip.y;
        popacity = o;
      } else {
        for (let i = 0; i < 3; i++) setDot(srcDotEls.current[i], { x: -40, y: -40 }, 0);
        if (tau <= SERVE_ARRIVAL) {
          let k = 0;
          while (k < 2 && tau >= ARRIVALS[k + 1]) k++;
          const f = EASE(clamp01((tau - ARRIVALS[k]) / HOP_MS));
          const p = pointAtFraction([anchors[k], anchors[k + 1]], f);
          setDot(trunkDotEl.current, p, 1);
          px = p.x;
          py = p.y;
          popacity = 1;
        } else {
          const o = Math.max(0, 1 - (tau - SERVE_ARRIVAL) / PULSE_FADE_MS);
          setDot(trunkDotEl.current, serve, o);
          px = serve.x;
          py = serve.y;
          popacity = o;
        }
      }

      // ── Arrival rings ──────────────────────────────────────────────────
      for (let i = 0; i < 4; i++) {
        const ring = ringEls.current[i];
        if (!ring) continue;
        const p = clamp01((tau - ARRIVALS[i]) / RING_MS);
        if (p > 0 && p < 1) {
          ring.style.opacity = ((1 - p) * 0.8).toFixed(3);
          ring.style.transform = `scale(${(0.55 + 0.95 * p).toFixed(3)})`;
        } else {
          ring.style.opacity = '0';
          ring.style.transform = 'scale(0.55)';
        }
      }

      // ── Records-become-nodes glyph at Gold ─────────────────────────────
      if (twinGroupEl.current) twinGroupEl.current.style.opacity = resetFade.toFixed(3);
      const draw = EASE(clamp01((tau - ARRIVALS[2]) / DRAW_MS)) * resetFade;
      if (twinLineEl.current) {
        twinLineEl.current.style.strokeDashoffset = String(100 * (1 - draw));
      }
      for (let j = 0; j < 2; j++) {
        const node = twinNodeEls.current[j];
        if (!node) continue;
        const np = EASE(clamp01((tau - ARRIVALS[2] - 120 * (j + 1)) / 300)) * resetFade;
        node.style.opacity = np.toFixed(3);
        node.style.transform = `scale(${(0.3 + 0.7 * np).toFixed(3)})`;
      }

      // ── The answer reveals at Serve, then dwells ───────────────────────
      if (answerEl.current) {
        const reveal = EASE(clamp01((tau - SERVE_ARRIVAL) / REVEAL_MS));
        answerEl.current.style.opacity = (reveal * resetFade).toFixed(3);
        answerEl.current.style.transform = `translateY(${((1 - reveal) * 8).toFixed(2)}px)`;
      }
      for (let j = 0; j < 2; j++) {
        const badge = badgeEls.current[j];
        if (!badge) continue;
        const bp = EASE(
          clamp01((tau - SERVE_ARRIVAL - BADGE_DELAY_MS * (j + 1)) / BADGE_MS),
        );
        badge.style.opacity = bp.toFixed(3);
        badge.style.transform = `translateY(${((1 - bp) * 4).toFixed(2)}px)`;
      }

      // ── Pointer life + edge brightening ────────────────────────────────
      pointer.x += (pointer.tx - pointer.x) * 0.14;
      pointer.y += (pointer.ty - pointer.y) * 0.14;
      gain += ((hoverNone ? 0 : 1) - gain) * 0.06;

      for (const c of chips) {
        const dx = pointer.x - c.cx;
        const dy = pointer.y - c.cy;
        const w = gain * Math.max(0, 1 - Math.hypot(dx, dy) / POINTER_RADIUS);
        c.el.style.transform = `translate(${(dx * w * 0.05).toFixed(2)}px, ${(dy * w * 0.05).toFixed(2)}px) scale(${(1 + w * 0.03).toFixed(3)})`;
        if (c.glow) c.glow.style.strokeOpacity = (w * 0.55).toFixed(3);
      }
      for (const e of connectors) {
        const nearPulse = popacity * Math.max(0, 1 - Math.hypot(px - e.mx, py - e.my) / 140);
        const nearPtr = gain * Math.max(0, 1 - Math.hypot(pointer.x - e.mx, pointer.y - e.my) / POINTER_RADIUS);
        e.el.style.strokeOpacity = (0.45 + 0.4 * Math.max(nearPulse, nearPtr)).toFixed(3);
      }

      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.hidden && !paused) {
        base = elapsed();
        paused = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!document.hidden && paused) {
        paused = false;
        mark = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    mark = performance.now();
    if (!paused) raf = requestAnimationFrame(tick);
    svg.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      svg.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [settled, L]);

  // ── Render (static geometry from the layout; settled values as markup) ──

  const graphStation = L.stations[2];

  /** Caption lines for a station, per orientation. */
  const caption = (s: (typeof L.stations)[number]) => {
    if (L.kind === 'horizontal') {
      return (
        <>
          <text className="mono hf-tier" x={s.cx} y={s.cy + s.h / 2 + 19} textAnchor="middle">
            {s.tier}
          </text>
          <text className="mono hf-gloss" x={s.cx} y={s.cy + s.h / 2 + 34} textAnchor="middle">
            {s.gloss}
          </text>
        </>
      );
    }
    return (
      <text className="mono hf-gloss" x={s.cx} y={s.cy + s.h / 2 + 18} textAnchor="middle">
        {`${s.tier} · ${s.gloss}`}
      </text>
    );
  };

  const renderChip = (
    id: string,
    cx: number,
    cy: number,
    w: number,
    h: number,
    house: boolean,
    label: string,
    delayMs: number,
    fontSize: number,
  ) => (
    <g
      key={id}
      data-chip-id={id}
      data-cx={cx}
      data-cy={cy}
      className={`hf-chip${house ? ' is-house' : ''}`}
      ref={(el) => {
        if (el) chipEls.current.set(id, el);
        else chipEls.current.delete(id);
      }}
    >
      <g className="hf-settle" style={{ '--settle-delay': `${delayMs}ms` } as React.CSSProperties}>
        <rect className="hf-face" x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={12} />
        <rect className="hf-glow" x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={12} />
        <text className="mono hf-name" x={cx} y={cy + 4.5} textAnchor="middle" fontSize={fontSize}>
          {label}
        </text>
      </g>
    </g>
  );

  // Badge geometry: label + teal check inside a small pill, pair centered.
  const GAP = 10;
  const PAD_X = 12;
  const CHECK_W = 8;
  const badges = ANSWER_BADGES.map((full) => {
    const word = full.replace(/\s*✓$/, '');
    return { word, w: PAD_X * 2 + word.length * 6 + 3 + CHECK_W };
  });
  const badgesTotal = badges.reduce((a, b) => a + b.w, 0) + GAP;
  const badgeXs = badges.map((_, j) =>
    L.answer.cx - badgesTotal / 2 + badges.slice(0, j).reduce((a, b) => a + b.w + GAP, 0),
  );
  const badgeCy = L.answer.cy + (L.kind === 'vertical' ? 16 : 14);
  const questionY = L.answer.cy + (L.kind === 'vertical' ? -7 : -6);

  return (
    <div
      className="hero-flow"
      data-motion={settled ? 'settled' : 'live'}
      data-orientation={L.kind}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${L.width} ${L.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={ARIA_LABEL}
      >
        <desc>{DESC}</desc>
        <defs>
          <marker id="hf-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 1 L 9 5 L 0 9 z" className="hf-arrow-body" />
          </marker>
        </defs>

        {/* Connectors: estate feeds fan-in, then short arrowed links. */}
        <g aria-hidden>
          {L.feeds.map((f) => (
            <path
              key={f.id}
              className="hf-edge"
              data-mx={f.mx.toFixed(1)}
              data-my={f.my.toFixed(1)}
              d={f.d}
              markerEnd="url(#hf-arrow)"
              ref={(el) => {
                if (el) edgeEls.current.set(f.id, el);
                else edgeEls.current.delete(f.id);
              }}
            />
          ))}
          {L.links.map((c) => (
            <path
              key={c.id}
              className="hf-edge"
              data-mx={c.mx.toFixed(1)}
              data-my={c.my.toFixed(1)}
              d={c.d}
              markerEnd="url(#hf-arrow)"
              ref={(el) => {
                if (el) edgeEls.current.set(c.id, el);
                else edgeEls.current.delete(c.id);
              }}
            />
          ))}
        </g>

        {/* Records-become-nodes glyph at Gold (decorative; the loop draws it). */}
        <g ref={twinGroupEl} className="hf-twin" aria-hidden>
          <line
            ref={twinLineEl}
            className="hf-twin-line"
            x1={L.twin.line[0].x}
            y1={L.twin.line[0].y}
            x2={L.twin.line[1].x}
            y2={L.twin.line[1].y}
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={0}
          />
          {[0, 1].map((j) => (
            <circle
              key={j}
              ref={(el) => {
                twinNodeEls.current[j] = el;
              }}
              className={`hf-twin-node${j === 1 ? ' is-end' : ''}`}
              cx={L.twin.nodes[j].x}
              cy={L.twin.nodes[j].y}
              r={6.5}
            />
          ))}
        </g>

        {/* Sources (neutral) + the four in-house stages (teal strokes). */}
        <g data-story="estate">
          {L.sources.map((s, i) =>
            renderChip(s.id, s.cx, s.cy, s.w, s.h, false, s.name, i * 70, 11),
          )}
          <text
            className="mono hf-gloss"
            x={L.kind === 'vertical' ? L.width / 2 : 92}
            y={L.kind === 'vertical' ? 20 : 266}
            textAnchor="middle"
          >
            Raw estate
          </text>
        </g>
        <g data-story="platform">
          {L.stations.map((s, i) => (
            <g key={s.id}>
              {renderChip(s.id, s.cx, s.cy, s.w, s.h, true, s.name, 210 + i * 70, 13)}
              {caption(s)}
            </g>
          ))}
        </g>

        {/* Arrival rings (decorative). */}
        <g aria-hidden>
          {L.stations.map((s, i) => (
            <circle
              key={s.id}
              ref={(el) => {
                ringEls.current[i] = el;
              }}
              className="hf-ring"
              cx={s.cx}
              cy={s.cy}
              r={L.ringR}
            />
          ))}
        </g>

        {/* The payoff: the answered, policy-checked question at Serve. */}
        <g
          ref={answerEl}
          data-answer=""
          style={{ opacity: 1, transform: 'translateY(0px)' }}
        >
          <rect
            className="hf-answer-face"
            x={L.answer.cx - L.answer.w / 2}
            y={L.answer.cy - L.answer.h / 2}
            width={L.answer.w}
            height={L.answer.h}
            rx={12}
          />
          <text className="mono hf-question" x={L.answer.cx} y={questionY} textAnchor="middle">
            {ANSWER_QUESTION}
          </text>
          {badges.map((b, j) => {
            const x = badgeXs[j];
            return (
              <g
                key={b.word}
                ref={(el) => {
                  badgeEls.current[j] = el;
                }}
              >
                <rect className="hf-badge-face" x={x} y={badgeCy - 9} width={b.w} height={18} rx={9} />
                <text className="mono hf-badge-text" x={x + PAD_X} y={badgeCy + 3.5}>
                  {b.word}
                </text>
                <text className="mono hf-check" x={x + PAD_X + b.word.length * 6 + 3} y={badgeCy + 3.5}>
                  ✓
                </text>
              </g>
            );
          })}
        </g>

        {/* Arrival rings sit under the pulse; the pulse rides on top. */}
        <g aria-hidden>
          {[0, 1, 2].map((i) => (
            <g
              key={i}
              ref={(el) => {
                srcDotEls.current[i] = el;
              }}
              className="hf-dot"
              style={{ opacity: 0, transform: 'translate(-40px, -40px)' }}
            >
              <circle className="hf-halo" r={7} />
              <circle className="hf-dot-body" r={3.5} />
            </g>
          ))}
          <g
            ref={trunkDotEl}
            className="hf-dot"
            style={{
              opacity: 0.85,
              transform: `translate(${graphStation.cx}px, ${graphStation.cy}px)`,
            }}
          >
            <circle className="hf-halo" r={9} />
            <circle className="hf-dot-body" r={4.5} />
          </g>
        </g>
      </svg>

      <style>{`
        .hero-flow { width: 100%; }
        .hero-flow svg { display: block; width: 100%; height: auto; }
        .hero-flow .mono { font-family: var(--font-mono), 'JetBrains Mono', ui-monospace, monospace; }

        .hf-edge { fill: none; stroke: var(--color-text-muted); stroke-width: 1.25; }
        .hf-arrow-body { fill: var(--color-text-muted); }

        .hf-face {
          fill: var(--color-bg-elev);
          stroke: var(--color-border);
          stroke-width: 1;
        }
        .hf-chip.is-house .hf-face { stroke: var(--color-secondary); stroke-width: 1.25; }
        /* Pointer-proximity glow: teal, the supporting-mark color. */
        .hf-glow { fill: none; stroke: var(--color-secondary); stroke-width: 1.5; stroke-opacity: 0; }
        .hf-chip, .hf-dot, .hf-ring, .hf-twin-node { transform-box: fill-box; transform-origin: center; }
        /* Chip label size comes from the fontSize attribute (11px sources,
           13px stations) — a CSS rule here would override those attributes. */
        .hf-name { fill: var(--color-text); }

        /* Phase-label language inherited from the retired DAG: mono,
           uppercase, letter-spaced, muted. */
        .hf-tier {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          fill: var(--color-text-muted);
        }
        .hf-gloss {
          font-size: 9.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          fill: var(--color-text-muted);
        }

        .hf-answer-face { fill: var(--color-bg-elev); stroke: var(--color-secondary); stroke-width: 1.25; }
        .hf-question { font-size: 13px; fill: var(--color-text); }
        .hf-badge-face { fill: var(--color-bg-elev); stroke: var(--color-border); }
        .hf-badge-text { font-size: 10px; letter-spacing: 0.04em; fill: var(--color-text-muted); }
        .hf-check { font-size: 10px; fill: var(--color-secondary); }

        .hf-ring { fill: none; stroke: var(--color-accent); stroke-width: 2; opacity: 0; }
        .hf-halo { fill: var(--color-accent); opacity: 0.22; }
        .hf-dot-body { fill: var(--color-accent); }

        .hf-twin-line { stroke: var(--color-secondary); stroke-width: 1.5; stroke-linecap: round; fill: none; }
        .hf-twin-node { fill: var(--color-bg-elev); stroke: var(--color-secondary); stroke-width: 1.5; }
        .hf-twin-node.is-end { fill: var(--color-secondary); }

        /* Live-only entrance: chips rise into place, staggered (transform +
           opacity only, brand easing). The settled frame skips it entirely. */
        @keyframes hfSettle {
          0%   { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hero-flow[data-motion='live'] .hf-settle {
          animation: hfSettle 520ms cubic-bezier(.32,.72,0,1) both;
          animation-delay: var(--settle-delay, 0ms);
        }
        .hero-flow[data-motion='settled'] .hf-settle { animation: none; }
      `}</style>
    </div>
  );
}
