'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { font, radius } from '@nanisoft/identity';
import { compassTraversal, type CompassEdge, type CompassNode } from '@nanisoft/architecture';
import { usePlayground } from '../_store/usePlayground';

/**
 * Compass mock — the most-faithful mock (the product's own differentiated value)
 * and the climax (SPEC §4.8/§4.9). Shows the finding **as edges** in a small
 * traversal graph: the anomalous `viewed` edge (jade), the dashed missing
 * `memberof` gap, the backed access (teal), + a narrative. The canonical action
 * is **drill-into-node** — clicking a node selects it (local `useState`, never
 * the store) and the detail panel shows its "why". Compass reads Gold + the
 * Atlas response (path + narrative); writes nothing. `compassTraversal` is the
 * pure derivation; this shell only renders it.
 *
 * The traversal graph is a custom CSS/SVG layout (NOT a second React Flow canvas)
 * — a 3-column users | product | group layout with an SVG edge layer behind
 * absolutely-positioned node chips, mirroring Airflow's mini-DAG approach.
 */

// SVG coordinate space (the container keeps this aspect ratio so the SVG and
// the percentage-positioned node chips stay aligned).
const VB_W = 360;
const VB_H = 260;

/** Lay out nodes into 3 columns by kind: users (left) | product (mid) | group (right). */
function layout(nodes: CompassNode[]): Record<string, { x: number; y: number }> {
  const users = nodes.filter((n) => n.kind === 'user');
  const products = nodes.filter((n) => n.kind === 'product');
  const groups = nodes.filter((n) => n.kind === 'group');
  const pos: Record<string, { x: number; y: number }> = {};
  const colX = { left: 64, mid: 190, right: 312 };
  // Spread each column's nodes vertically across the canvas.
  const spread = (ids: string[], x: number) => {
    const n = ids.length;
    ids.forEach((id, i) => {
      const y = n === 1 ? VB_H / 2 : 48 + (i * (VB_H - 96)) / Math.max(n - 1, 1);
      pos[id] = { x, y };
    });
  };
  spread(users.map((u) => u.id), colX.left);
  spread(products.map((p) => p.id), colX.mid);
  spread(groups.map((g) => g.id), colX.right);
  return pos;
}

function edgeColor(status: CompassEdge['status']): string {
  if (status === 'anomalous') return 'var(--viz-anomalous)';
  if (status === 'ok' || status === 'backed') return 'var(--viz-secondary)';
  if (status === 'gap') return 'var(--viz-memberof)';
  return 'var(--color-text-muted)'; // pending — visible, but clearly not yet
}

const label: CSSProperties = {
  margin: 0,
  fontFamily: font.data,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
};

// SVG presentation ATTRIBUTES cannot resolve var(); mode-aware fills/strokes on
// SVG elements go through the style prop instead.
// Edge-kind labels sit ON their lines. Without a halo the stroke strikes
// through the glyphs and fuses label, line, and node chips into one mass; a
// paint-order stroke in the panel's own surface color cuts the line out
// around the text (the SVG analogue of the tonal trio's separation).
const svgEdgeLabel: CSSProperties = {
  fill: 'var(--color-text-muted)',
  stroke: 'var(--color-bg-sunken)',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  paintOrder: 'stroke',
};

function nodeRingClass(node: CompassNode, ready: boolean, selected: boolean): string {
  if (selected) return 'var(--color-accent)';
  if (ready && node.kind === 'product' && node.sensitive) return 'var(--viz-anomalous)';
  if (node.kind === 'group') return 'var(--viz-secondary)';
  return 'var(--color-text-muted)';
}

export function CompassOverlay() {
  const state = usePlayground((s) => s.state);
  const [selected, setSelected] = useState<string | null>(null);

  const t = useMemo(() => compassTraversal(state, state.cursor), [state]);
  const pos = useMemo(() => layout(t.nodes), [t.nodes]);
  const detail = selected ? t.details[selected] : null;
  const selectedNode = selected ? t.nodes.find((n) => n.id === selected) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      {/* Pre-climax status line (hidden once ready) */}
      {!t.ready && (
        <p style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }} role="status" aria-label="compass status">
          {t.status}
        </p>
      )}

      {/* Traversal graph */}
      <div
        role="group"
        aria-label="compass traversal"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${VB_W} / ${VB_H}`,
          background: 'var(--color-bg-sunken)',
          borderRadius: radius.inner,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ position: 'absolute', inset: 0 }}
        >
          {t.edges.map((e) => {
            const a = pos[e.from];
            const b = pos[e.to];
            if (!a || !b) return null;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const stroke = edgeColor(e.status);
            return (
              <g key={e.id}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  style={{ stroke }}
                  strokeWidth={e.missing ? 1.5 : 2}
                  strokeDasharray={e.missing ? '4 4' : undefined}
                  opacity={e.status === 'pending' ? 0.7 : 0.95}
                />
                <text
                  x={mx}
                  y={my - 4}
                  textAnchor="middle"
                  fontFamily="var(--font-mono), 'JetBrains Mono', monospace"
                  fontSize="8"
                  style={svgEdgeLabel}
                >
                  {e.kind}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Node chips */}
        {t.nodes.map((n) => {
          const p = pos[n.id];
          if (!p) return null;
          const isSel = selected === n.id;
          const ring = nodeRingClass(n, t.ready, isSel);
          return (
            <button
              key={n.id}
              onClick={() => setSelected(n.id)}
              aria-label={`inspect ${n.id}`}
              aria-pressed={isSel}
              style={{
                position: 'absolute',
                left: `${(p.x / VB_W) * 100}%`,
                top: `${(p.y / VB_H) * 100}%`,
                transform: 'translate(-50%, -50%)',
                border: `1px solid ${ring}`,
                background: 'var(--color-bg-elev)',
                borderRadius: radius.inner,
                padding: '4px 8px',
                fontFamily: font.data,
                fontSize: 10,
                color: 'var(--color-text)',
                cursor: 'pointer',
                // selection ring as an outline (tonal depth, no shadow)
                outline: isSel ? '2px solid var(--color-accent)' : 'none',
                outlineOffset: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {n.id}
            </button>
          );
        })}
      </div>

      {/* Legend — swatch marks carry the color (≥3:1 non-text); labels are
          muted ink. The old colored 10px TEXT sat at 1.78–2.87:1. */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: font.data, fontSize: 10, color: 'var(--color-text-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden="true" style={{ width: 14, height: 0, borderTop: '2px solid var(--viz-anomalous)' }} />
          anomalous viewed
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden="true" style={{ width: 14, height: 0, borderTop: '2px solid var(--viz-secondary)' }} />
          backed / ok
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden="true" style={{ width: 14, height: 0, borderTop: '2px dashed var(--viz-memberof)' }} />
          missing memberof
        </span>
      </div>

      {/* Narrative (climax) */}
      {t.ready && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={label}>Narrative · the finding</p>
          <ol role="list" style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {t.narrative.map((s) => (
              <li key={s.n} style={{ fontFamily: font.data, fontSize: 11, color: 'var(--color-text)' }}>
                {s.text}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Drill-into detail panel (the canonical action — local UI state) */}
      <div
        role="status"
        aria-label="compass node detail"
        style={{
          background: 'var(--color-bg-sunken)',
          borderRadius: radius.inner,
          padding: '8px 10px',
          minHeight: 44,
          fontFamily: font.data,
          fontSize: 11,
          color: 'var(--color-text)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {selectedNode && detail ? (
          <>
            <span style={{ fontWeight: 700 }}>{selectedNode.id}</span>
            <span>{detail}</span>
          </>
        ) : (
          <span style={{ color: 'var(--color-text-muted)' }}>Select a node to inspect the finding.</span>
        )}
      </div>

      <p style={{ ...label, marginTop: 2 }}>
        most faithful of the six · Compass is the product&apos;s own value · node-within-node containment deferred
      </p>
    </div>
  );
}