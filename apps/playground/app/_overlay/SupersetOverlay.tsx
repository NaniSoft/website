'use client';

import { useState, type CSSProperties } from 'react';
import { color, font, radius } from '@nanisoft/identity';
import { supersetDashboard, type SupersetExposureRow, type SupersetSourceRow } from '@nanisoft/architecture';
import { usePlayground } from '../_store/usePlayground';

/**
 * Superset mock — the sandbox-only read-lens dashboard over live Gold (SPEC
 * §4.8/§4.9). Off the flagship path: reached by clicking the Superset node (no
 * guided step, no `openTool` on any step — `superset` is `fullUi: true`, so the
 * node is always clickable). Reads Gold client-side via `supersetDashboard`
 * (deriving exposure = a `viewed` edge with no `memberof` backing); writes
 * nothing. The canonical action — filter / drill-down — is LOCAL UI state here
 * (not a lakehouse mutate, not `store.step()`): the deliberate exception to the
 * one-code-path pattern, because Superset is a read lens.
 *
 * Dashboard grid + filter bar: (1) bar — products by exposure count, (2) table —
 * users with anomalous views (j.harper flagged), (3) donut — views by source
 * system. A "query path: Superset → Trino → Gold" label notes the real routing;
 * the mock reads in-browser Gold directly (no query engine wired).
 *
 * Charts read as one system (dataviz): nanisoft tokens, jade reserved for the
 * live/anomalous state only (the j.harper row + the sensitive product's exposure
 * bar + the active filter accent), all chart marks through the mode-aware
 * --viz-* roles: teal/bright for the viewed/source slice, inkMuted/petrolTint
 * for the memberof slice, petrolSoft (light) / a petrolTint-petrolMid mix
 * (dark) for neutral marks. No raw petrolMid anywhere — it was invisible on
 * its own panel. Accessible (roles, aria-labels, legend with direct labels)
 * and consistent across modes (matching the sibling overlays). SVG
 * fills/strokes use the style prop — presentation attributes cannot resolve
 * var().
 */

const label: CSSProperties = {
  margin: 0,
  fontFamily: font.data,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
};

const panel: CSSProperties = {
  background: 'var(--color-bg-elev)',
  border: '1px solid var(--color-border)',
  borderRadius: radius.inner,
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

// Donut SVG mode-aware fills/strokes (presentation attributes can't take var()).
const svgText: CSSProperties = { fill: 'var(--color-text)' };
const svgTextMuted: CSSProperties = { fill: 'var(--color-text-muted)' };
const svgTrackStroke: CSSProperties = { stroke: 'var(--color-border)' };

// ── Bar/slice colors: mode-aware CSS vars (see globals.css --viz-*) ──────────
// The old literals (jade/teal/petrolMid) failed WCAG 1.4.11 on their panels —
// petrolMid-on-petrolMid was literally invisible in dark mode — and SVG
// attributes can't take var(), so these reach the SVGs via style props.
const barColor = (row: SupersetExposureRow): React.CSSProperties => {
  if (row.exposureCount > 0 && row.sensitive) return { background: 'var(--viz-anomalous)' }; // anomalous exposure
  if (row.exposureCount > 0) return { background: 'var(--viz-secondary)' }; // exposure, non-sensitive
  return { background: 'var(--viz-neutral)' }; // no exposure
};

const SLICE_STYLE: Record<SupersetSourceRow['edgeKind'], React.CSSProperties> = {
  viewed: { stroke: 'var(--viz-secondary)' }, // SQL Server Fleet — the access logs
  memberof: { stroke: 'var(--viz-memberof)' }, // Active Directory — the group memberships
};

/** Legend swatch — same marks as the slices, as fills. */
const sliceSwatch = (kind: SupersetSourceRow['edgeKind']): React.CSSProperties => ({
  background: kind === 'viewed' ? 'var(--viz-secondary)' : 'var(--viz-memberof)',
});

export function SupersetOverlay() {
  const state = usePlayground((s) => s.state);
  const [sensitiveOnly, setSensitiveOnly] = useState(false);
  const [drillProductId, setDrillProductId] = useState<string | null>(null);

  // Pure derivation from Gold (re-derived every render via Zustand reactivity).
  const d = supersetDashboard(state, state.cursor);

  // Local filter (UI state, not a lakehouse mutate).
  const barRows = d.products.filter(
    (p) => (!sensitiveOnly || p.sensitive) && (!drillProductId || p.productId === drillProductId),
  );
  const tableRows = d.anomalousUsers.filter(
    (u) => !drillProductId || u.productId === drillProductId,
  );
  const maxExposure = Math.max(1, ...d.products.map((p) => p.exposureCount));

  const toggleDrill = (id: string) =>
    setDrillProductId((cur) => (cur === id ? null : id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      {/* Query-path label — the real routing (mock reads Gold in-browser) */}
      <div style={{ ...panel, background: 'var(--color-bg-sunken)', gap: 4 }}>
        <span style={{ fontFamily: font.data, fontSize: 11, color: 'var(--color-text)' }}>
          query path: Superset → Trino → Gold
        </span>
        <span style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }}>
          mocked · reads in-browser Gold directly (no query engine wired)
        </span>
      </div>

      {/* Filter bar — the canonical action (local UI state, no store.step) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setSensitiveOnly((v) => !v)}
          aria-pressed={sensitiveOnly}
          aria-label="Toggle sensitive only"
          style={{
            fontFamily: font.voice,
            fontSize: 12,
            fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 9999,
            cursor: 'pointer',
            border: `1px solid ${sensitiveOnly ? color.jade : 'var(--color-border)'}`,
            background: sensitiveOnly ? color.jade : 'transparent',
            color: sensitiveOnly ? 'var(--color-on-accent)' : 'var(--color-text)',
          }}
        >
          Sensitive only
        </button>
        {drillProductId && (
          <button
            onClick={() => setDrillProductId(null)}
            aria-label="Clear drill-down"
            style={{
              fontFamily: font.voice,
              fontSize: 12,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 9999,
              cursor: 'pointer',
              // Active-filter mark: the mode-aware viz teal, not the raw
              // constant (2.81:1 on the elevated panel in dark mode).
              border: '1px solid var(--viz-secondary)',
              background: 'transparent',
              color: 'var(--color-text)',
            }}
          >
            ✕ clear drill
          </button>
        )}
        <span style={{ ...label, marginLeft: 'auto' }}>
          {drillProductId ? `drill: ${drillProductId}` : 'no filter'}
        </span>
      </div>

      {/* Dashboard grid — 3 panels (stacked for the narrow split-pane) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* (1) Bar — products by exposure count. No role="img" here: the rows
            are real drill <button>s, and img descendants are presentational. */}
        <section style={panel} aria-label="Products by exposure count">
          <p style={label}>Bar · products by exposure count</p>
          {barRows.length === 0 ? (
            <p style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }}>no products match the filter</p>
          ) : (
            barRows.map((row) => {
              const drilled = drillProductId === row.productId;
              const w = row.exposureCount === 0 ? 4 : Math.max(8, (row.exposureCount / maxExposure) * 140);
              return (
                <button
                  key={row.productId}
                  onClick={() => toggleDrill(row.productId)}
                  aria-label={`Drill into ${row.productName} (exposure ${row.exposureCount})`}
                  aria-pressed={drilled}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: font.data,
                    fontSize: 11,
                    color: 'var(--color-text)',
                  }}
                >
                  <span style={{ width: 92, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.productName}
                  </span>
                  <span
                    style={{
                      height: 14,
                      width: w,
                      borderRadius: 9999,
                      ...barColor(row),
                      outline: drilled ? '2px solid var(--color-accent)' : 'none',
                      outlineOffset: 1,
                    }}
                  />
                  <span style={row.exposureCount > 0 && row.sensitive ? { color: 'var(--color-text)', fontWeight: 700 } : { color: 'var(--color-text-muted)' }}>
                    {row.exposureCount} exposed · {row.viewCount} view{row.viewCount === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })
          )}
        </section>

        {/* (2) Table — users with anomalous views (j.harper flagged). The old
            role="table" was invalid (a <p> child among the rows); the panel
            label + plain grid read correctly without fake table semantics. */}
        <section style={panel} aria-label="Users with anomalous views">
          <p style={label}>Table · users with anomalous views</p>
          {tableRows.length === 0 ? (
            <p style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }}>no anomalous views</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '84px 1fr 64px 1fr',
                  gap: 6,
                  fontFamily: font.data,
                  fontSize: 10,
                  color: 'var(--color-text-muted)',
                  padding: '2px 4px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                <span>user</span>
                <span>product</span>
                <span>owner</span>
                <span>status</span>
              </div>
              {tableRows.map((u) => (
                <div
                  key={u.edgeId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '84px 1fr 64px 1fr',
                    gap: 6,
                    fontFamily: font.data,
                    fontSize: 11,
                    color: 'var(--color-text)',
                    padding: '3px 4px',
                    // The finding reads as a quiet accent WASH (the Honest Status
                    // Rule's teal-wash pattern, tuned to jade's role) — not a
                    // colored border + raw rgba tint + jade text, which failed
                    // contrast and the shape/shadow rules.
                    background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                    borderRadius: radius.inner,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{u.user}</span>
                  <span>{u.productName}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{u.ownerGroup}</span>
                  <span style={{ fontWeight: 700 }}>no backing membership</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* (3) Donut — views by source system (Gold edges by contributing source) */}
        <DonutPanel sources={d.sources} />
      </div>

      <p style={{ ...label, marginTop: 2 }}>
        mocked · dashboard surface only · SQL Lab/dataset editor/row-level security/alerting/cache hidden
      </p>
    </div>
  );
}

/** Donut panel — 2 slices (viewed → SQL Server Fleet, memberof → Active Directory). */
function DonutPanel({ sources }: { sources: SupersetSourceRow[] }) {
  const total = sources.reduce((sum, s) => sum + s.count, 0);
  const r = 40;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <section style={panel} aria-label="Views by source system" role="img">
      <p style={label}>Donut · views by source system</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <svg width={104} height={104} viewBox="0 0 100 100" style={{ flexShrink: 0 }} aria-hidden="true">
          <g transform="rotate(-90 50 50)">
            {total === 0 ? (
              <circle
                cx={50}
                cy={50}
                r={r}
                fill="none"
                strokeWidth={14}
                style={svgTrackStroke}
              />
            ) : (
              sources.map((s) => {
                const frac = s.count / total;
                const dash = frac * c;
                const offset = -acc * c;
                acc += frac;
                return (
                  <circle
                    key={s.edgeKind}
                    cx={50}
                    cy={50}
                    r={r}
                    fill="none"
                    strokeWidth={14}
                    style={SLICE_STYLE[s.edgeKind]}
                    strokeDasharray={`${dash} ${c - dash}`}
                    strokeDashoffset={offset}
                  />
                );
              })
            )}
          </g>
          <text
            x={50}
            y={48}
            textAnchor="middle"
            fontFamily="var(--font-mono), 'JetBrains Mono', monospace"
            fontSize={13}
            fontWeight={700}
            style={svgText}
          >
            {total}
          </text>
          <text
            x={50}
            y={62}
            textAnchor="middle"
            fontFamily="var(--font-mono), 'JetBrains Mono', monospace"
            fontSize={7}
            letterSpacing="0.1em"
            style={svgTextMuted}
          >
            GOLD EDGES
          </text>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 120 }}>
          {sources.map((s) => {
            const pct = total === 0 ? 0 : Math.round((s.count / total) * 100);
            return (
              <div key={s.edgeKind} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: font.data, fontSize: 11 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 9999,
                    ...sliceSwatch(s.edgeKind),
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
                <span style={{ color: 'var(--color-text)' }}>{s.sourceSystem}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}>
                  {s.count} · {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <p style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }}>
        Gold edges by contributing source system
      </p>
    </section>
  );
}