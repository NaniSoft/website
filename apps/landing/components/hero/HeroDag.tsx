'use client';

/**
 * The hero's "living map" — a breathing canvas DAG of the nanisoft digital-twin
 * pipeline, ported from the identity style tile
 * (.scratch/03-identity-style-tile.html). About 12 labeled nodes across 7
 * stages (sources -> schema/ingest -> lakehouse -> transform -> query ->
 * core+authz -> UI) plus a Watchtower observer, orthogonal routed edges with
 * arrowheads, a left->right jade wavefront that traverses the pipeline on a
 * staggered cycle, mouse-reactive nodes, and click ripples.
 *
 * One rAF loop; every per-frame write is imperative on the canvas (zero React
 * state per frame). Colors are read from the semantic tokens scoped on .hero
 * (see globals.css — the dark surface values in BOTH page modes), so the graph
 * renders in its dark-mode appearance with no raw hex here. prefers-reduced-
 * motion draws a single settled frame (no wavefront, no ripples); the loop
 * pauses while document.hidden. Jade stays reserved for the live wavefront /
 * active edges / live nodes — never the static graph, EXCEPT one static jade
 * "live" cue painted on the Compass hub in the settled frame so the live/active
 * state is conveyed without motion (the wavefront is otherwise the only live
 * signal). A `<noscript>` block fills the panel with a short text fallback when
 * scripting is disabled, so the right column is never an empty dark hole.
 *
 * The canvas is blank without JS; sighted no-JS visitors get the `<noscript>`
 * fallback plus the hero's HTML copy (eyebrow / h1 / sub), and screen readers
 * get the aria-label + the visually-hidden description below.
 */
import { useEffect, useRef, useState } from 'react';

const ARIA_LABEL =
  'nanisoft digital-twin pipeline: directory, HR, and database sources flow through schema and ingest into the Bedrock lakehouse, are transformed by Forge, queried by Overlook, governed by Atlas and OPA, and delivered to the Compass UI. Watchtower observes the lake and transform.';

const DESC =
  'A directed pipeline read left to right. Three estate sources — AD, Workday, SQL Fleet — feed Blueprint (schema) and Trailhead (ingest), which both land into the Bedrock lakehouse. Forge transforms, Overlook queries, Atlas governs with OPA policy, and Compass serves the investigation UI. Watchtower observes the lake and transform stages. A jade wavefront travels the pipeline on a staggered cycle; nodes drift and react to the pointer; a click sends a ripple. Under reduced motion the graph holds still.';

// Pipeline stages (columns left -> right); each entry is one column of labels.
const STAGES: string[][] = [
  ['AD', 'Workday', 'SQL Fleet'], // 0  sources
  ['Blueprint', 'Trailhead'], // 1  schema + ingest
  ['Bedrock'], // 2  lakehouse
  ['Forge'], // 3  transform
  ['Overlook'], // 4  query
  ['Atlas', 'OPA'], // 5  core + authz decision
  ['Compass'], // 6  investigation / UI
];

// Wavefront timing (seconds): a wavefront leaves the sources, crosses one edge
// in PULSE_TRAVEL, staggers COL_DELAY between columns, then the cycle retells.
const PULSE_GAP = 6.0;
const PULSE_TRAVEL = 1.5;
const COL_DELAY = 0.55;

const HUBS = new Set(['Atlas', 'Compass', 'Bedrock']);

interface DagNode {
  col: number;
  label: string;
  bx: number;
  by: number;
  x: number;
  y: number;
  r: number;
  ph: number;
  amp: number;
  hub: boolean;
  watch: boolean;
}
interface DagEdge {
  a: number;
  b: number;
  depth: number;
  dash: boolean;
}

/** hex (#RRGGBB) -> rgba(..,a) so canvas draws stay token-driven, no raw hex. */
function rgba(hex: string, a: number): string {
  const h = hex.trim().replace('#', '');
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

export function HeroDag() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Hydration-safe: server markup + first paint is the settled frame; the
  // effect flips to 'live' when motion is allowed (matches the retired HeroFlow
  // contract — no motion flash for reduced-motion visitors).
  const [motion, setMotion] = useState<'live' | 'settled'>('settled');

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const onChange = () => setMotion(mq.matches ? 'settled' : 'live');
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    const wrapEl = wrapRef.current;
    const canvasEl = canvasRef.current;
    if (!wrapEl || !canvasEl) return undefined;
    // Explicit non-null types so narrowing holds inside the nested closures.
    const wrap: HTMLDivElement = wrapEl;
    const canvas: HTMLCanvasElement = canvasEl;
    const ctxOrNull = canvas.getContext('2d');
    if (!ctxOrNull) return undefined;
    // Explicit non-null type so the narrowed type holds inside the nested
    // draw/frame/roundPoly closures (TS uses the declared type in closures).
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    const reduce = motion === 'settled';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0;
    let H = 0;
    const nodes: DagNode[] = [];
    const edges: DagEdge[] = [];
    const ripples: { x: number; y: number; t: number }[] = [];
    const mouse = { x: -9999, y: -9999 };

    // Tokens scoped on .hero (dark surface values in both page modes) + the
    // loaded mono family for canvas labels (next/font registers under a hashed
    // --font-mono; canvas can't resolve var(), so read it once per resize).
    type Tokens = { jade: string; teal: string; muted: string; bone: string; mono: string };
    const readTokens = (): Tokens => {
      const cs = getComputedStyle(canvas);
      return {
        jade: cs.getPropertyValue('--color-accent'),
        teal: cs.getPropertyValue('--color-secondary'),
        muted: cs.getPropertyValue('--color-text-muted'),
        bone: cs.getPropertyValue('--color-text'),
        mono: cs.getPropertyValue('--font-mono'),
      };
    };
    let T = readTokens();

    function build() {
      nodes.length = 0;
      edges.length = 0;
      const x0 = W * 0.06;
      const x1 = W * 0.94;
      const cy = H * 0.54;
      const spread = Math.min(H * 0.26, 150);
      const layout: number[][] = [];
      STAGES.forEach((col, c) => {
        const x = x0 + (x1 - x0) * (c / (STAGES.length - 1));
        const arr: number[] = [];
        col.forEach((lab, j) => {
          const n = col.length;
          const y = cy + (j - (n - 1) / 2) * spread;
          const hub = HUBS.has(lab);
          nodes.push({
            col: c,
            label: lab,
            bx: x,
            by: y,
            x,
            y,
            r: hub ? 8 : 5.5,
            ph: Math.random() * Math.PI * 2,
            amp: 2 + Math.random() * 1.6,
            hub,
            watch: false,
          });
          arr.push(nodes.length - 1);
        });
        layout.push(arr);
      });
      // Watchtower: cross-cutting observer, floats above the pipeline.
      const wtx = x0 + (x1 - x0) * (1.5 / (STAGES.length - 1));
      nodes.push({
        col: -1,
        label: 'Watchtower',
        bx: wtx,
        by: H * 0.14,
        x: wtx,
        y: H * 0.14,
        r: 5,
        ph: Math.random() * Math.PI * 2,
        amp: 1.4,
        hub: false,
        watch: true,
      });
      const wt = nodes.length - 1;

      const add = (a: number, b: number, dash = false) =>
        edges.push({ a, b, depth: Math.max(0, nodes[a].col), dash });
      layout[0].forEach((s) => {
        add(s, layout[1][0]);
        add(s, layout[1][1]);
      }); // sources -> schema/ingest
      add(layout[1][0], layout[2][0]); // Blueprint -> Bedrock
      add(layout[1][1], layout[2][0]); // Trailhead -> Bedrock
      add(layout[2][0], layout[3][0]); // Bedrock -> Forge
      add(layout[3][0], layout[4][0]); // Forge -> Overlook
      add(layout[4][0], layout[5][0]); // Overlook -> Atlas
      add(layout[5][0], layout[5][1]); // Atlas -> OPA (policy)
      add(layout[5][0], layout[6][0]); // Atlas -> Compass (UI)
      add(wt, layout[2][0], true); // Watchtower observes lake + transform
      add(wt, layout[3][0], true);
    }

    function resize() {
      const r = wrap.getBoundingClientRect();
      W = r.width;
      H = r.height;
      if (!W || !H) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      T = readTokens();
      build();
      // Setting canvas.width/height clears the bitmap. In live mode the rAF
      // loop repaints next frame; in reduced-motion mode there is no rAF, so a
      // ResizeObserver-triggered resize would leave the settled frame blank.
      // Repaint synchronously so the static graph (incl. the jade Compass cue)
      // is always present after a resize.
      draw();
    }

    // Orthogonal polyline with soft (rounded) 90deg corners.
    function roundPoly(pts: number[][], cr: number) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        const ax = x1 - x0;
        const ay = y1 - y0;
        const al = Math.hypot(ax, ay) || 1;
        const bx = x2 - x1;
        const by = y2 - y1;
        const bl = Math.hypot(bx, by) || 1;
        const r = Math.min(cr, al / 2, bl / 2);
        ctx.lineTo(x1 - (ax / al) * r, y1 - (ay / al) * r);
        ctx.quadraticCurveTo(x1, y1, x1 + (bx / bl) * r, y1 + (by / bl) * r);
      }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      ctx.stroke();
    }

    function waypoints(A: DagNode, B: DagNode): number[][] {
      if (A.watch) {
        // observer: down from top, then across into B from above
        const my = (A.y + B.y) / 2;
        return [
          [A.x, A.y + A.r + 3],
          [A.x, my],
          [B.x, my],
          [B.x, B.y - B.r - 3],
        ];
      }
      const mx = (A.x + B.x) / 2;
      return [
        [A.x + A.r + 3, A.y],
        [mx, A.y],
        [mx, B.y],
        [B.x - B.r - 3, B.y],
      ];
    }

    function pointAlong(pts: number[][], p: number): [number, number] {
      const seg: number[] = [];
      let total = 0;
      for (let i = 1; i < pts.length; i++) {
        const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        seg.push(d);
        total += d;
      }
      let dist = p * total;
      for (let i = 1; i < pts.length; i++) {
        if (dist <= seg[i - 1] + 1e-6) {
          const f = seg[i - 1] === 0 ? 0 : dist / seg[i - 1];
          return [
            pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f,
            pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f,
          ];
        }
        dist -= seg[i - 1];
      }
      return [pts[pts.length - 1][0], pts[pts.length - 1][1]];
    }

    function draw() {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);
      const t = performance.now() / 1000;

      // nodes drift (breathe) + mouse repel
      for (const n of nodes) {
        const dx = Math.sin(t * 0.5 + n.ph) * n.amp;
        const dy = Math.cos(t * 0.4 + n.ph * 1.3) * n.amp;
        let tx = n.bx + dx;
        let ty = n.by + dy;
        if (!reduce && mouse.x > -1000) {
          const mx = tx - mouse.x;
          const my = ty - mouse.y;
          const d2 = mx * mx + my * my;
          if (d2 < 110 * 110) {
            const d = Math.sqrt(d2) || 1;
            const f = ((110 - d) / 110) * 16;
            tx += (mx / d) * f;
            ty += (my / d) * f;
          }
        }
        n.x += (tx - n.x) * 0.08;
        n.y += (ty - n.y) * 0.08;
      }

      // edges: directed, orthogonal, soft 90deg bends; wavefront pulse L->R
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const liveNode = new Set<number>();
      for (const e of edges) {
        const A = nodes[e.a];
        const B = nodes[e.b];
        const pts = waypoints(A, B);
        let p = -1;
        if (!e.dash) {
          const local = ((t - e.depth * COL_DELAY) % PULSE_GAP + PULSE_GAP) % PULSE_GAP;
          if (local < PULSE_TRAVEL) p = local / PULSE_TRAVEL;
        }
        const active = !reduce && p >= 0 && p <= 1;
        if (active) liveNode.add(e.b);

        if (e.dash) {
          ctx.setLineDash([3, 5]);
          ctx.strokeStyle = rgba(T.muted, 0.24);
          ctx.lineWidth = 1;
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = active ? rgba(T.jade, 0.62) : rgba(T.muted, 0.16);
          ctx.lineWidth = active ? 1.8 : 1;
        }
        roundPoly(pts, 12);
        ctx.setLineDash([]);

        // arrowhead into B (directed)
        const last = pts[pts.length - 2];
        const end = pts[pts.length - 1];
        const ang = Math.atan2(end[1] - last[1], end[0] - last[0]);
        const ah = 5;
        ctx.beginPath();
        ctx.moveTo(end[0], end[1]);
        ctx.lineTo(end[0] - ah * Math.cos(ang - 0.5), end[1] - ah * Math.sin(ang - 0.5));
        ctx.moveTo(end[0], end[1]);
        ctx.lineTo(end[0] - ah * Math.cos(ang + 0.5), end[1] - ah * Math.sin(ang + 0.5));
        ctx.strokeStyle = active ? rgba(T.jade, 0.7) : rgba(T.muted, 0.32);
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // traversal dot riding the directed edge
        if (active) {
          const [px, py] = pointAlong(pts, p);
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fillStyle = rgba(T.jade, 0.22);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(px, py, 2.6, 0, Math.PI * 2);
          ctx.fillStyle = T.jade;
          ctx.fill();
        }
      }

      // nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulse = reduce ? 0 : Math.sin(t * 1.2 + n.ph) * 0.16;
        const rr = n.r * (1 + pulse);
        const live = liveNode.has(i) || (n.hub && n.label === 'Compass');
        ctx.beginPath();
        ctx.arc(n.x, n.y, rr + 3, 0, Math.PI * 2);
        ctx.fillStyle = live ? rgba(T.jade, 0.18) : rgba(T.teal, 0.08);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
        ctx.fillStyle = live ? T.jade : n.watch ? T.teal : T.muted;
        ctx.fill();
        if (n.hub) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, rr + 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = live ? rgba(T.jade, 0.55) : rgba(T.bone, 0.4);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      // labels (skip on narrow canvases to avoid clutter)
      if (W >= 380) {
        ctx.font = `10px ${T.mono}, "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillStyle = rgba(T.muted, 0.62);
        ctx.textAlign = 'center';
        for (const n of nodes) ctx.fillText(n.label, n.x, n.y - n.r - 7);
      }

      // Static "live" cue for reduced motion: the wavefront is the only live
      // signal in the live branch, and jade is the brand's live/active color.
      // Under reduced motion there is no wavefront, so without this the settled
      // frame carries "live" by motion alone with nothing static left behind.
      // Paint a small jade "live" tag under the Compass hub (the terminal UI
      // node) so a jade pixel + the word "live" persist without any animation.
      // No rAF, no motion — one extra paint in the settled frame only.
      if (reduce && W >= 380) {
        const compass = nodes.find((n) => n.hub && n.label === 'Compass');
        if (compass) {
          ctx.font = `9px ${T.mono}, "JetBrains Mono", ui-monospace, monospace`;
          ctx.textAlign = 'center';
          // small jade dot + "live" label, seated just below the node label
          const lx = compass.x;
          const ly = compass.y + compass.r + 14;
          ctx.beginPath();
          ctx.arc(lx - 18, ly - 3, 2.4, 0, Math.PI * 2);
          ctx.fillStyle = T.jade;
          ctx.fill();
          ctx.fillStyle = rgba(T.jade, 0.92);
          ctx.fillText('live', lx + 2, ly);
        }
      }

      // click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.t += 0.016;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.t * 180, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(T.jade, 0.5 * (1 - rp.t));
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (rp.t > 1) ripples.splice(i, 1);
      }
    }

    function frame() {
      draw();
      if (!reduce) raf = requestAnimationFrame(frame);
    }

    // pointer
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onClick = (e: MouseEvent) => {
      if (reduce) return;
      const r = canvas.getBoundingClientRect();
      ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: 0 });
    };
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('click', onClick);

    // pause while hidden
    let paused = typeof document !== 'undefined' && document.hidden;
    let raf = 0;
    const onVisibility = () => {
      if (document.hidden && !paused) {
        paused = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!document.hidden && paused) {
        paused = false;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    draw(); // first frame immediately (no blank flash)
    if (!paused && !reduce) raf = requestAnimationFrame(frame);

    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [motion]);

  return (
    <div className="hero-dag" ref={wrapRef} data-motion={motion}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ARIA_LABEL}
        aria-describedby="hero-dag-desc"
      />
      <span id="hero-dag-desc" className="hero-dag-desc">
        {DESC}
      </span>
      {/* No-JS fallback: the canvas is blank without JavaScript, so without
          this the hero's right column is an empty dark hole. <noscript> is
          rendered by the browser only when scripting is disabled, so it stays
          out of the DOM (and out of the way) whenever JS is on. Styled in the
          hero token colors scoped on .hero so it reads as part of the panel. */}
      <noscript>
        <p className="hero-dag-noscript">
          A live pipeline diagram runs here with JavaScript enabled.
        </p>
      </noscript>
      <style>{`
        .hero-dag { position: relative; width: 100%; height: 100%; }
        .hero-dag canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        /* Visually hidden, available to AT via aria-describedby. */
        .hero-dag-desc {
          position: absolute;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }
        /* No-JS fallback fills the panel in hero token colors (scoped on .hero). */
        .hero-dag-noscript {
          position: absolute;
          inset: 0;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          text-align: center;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.8125rem;
          line-height: 1.5;
          color: var(--color-text-muted);
          background: var(--color-surface);
          border: 1px solid var(--color-border, transparent);
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  );
}