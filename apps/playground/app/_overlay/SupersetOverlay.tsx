'use client';

import { useState, type CSSProperties } from 'react';
import { color, font, radius, surface } from '@nanisoft/identity';
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
 * bar + the active filter accent), teal for the viewed/source slice, petrolMid
 * for the memberof slice, petrolSoft for neutral marks. Accessible (roles,
 * aria-labels, legend with direct labels) and consistent in light mode (matching
 * the sibling overlays).
 */

const label: CSSProperties = {
  margin: 0,
  fontFamily: font.data,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: surface.light.textMuted,
};

const panel: CSSProperties = {
  background: surface.light.elevated,
  border: `1px solid ${surface.light.border}`,
  borderRadius: radius.inner,
  padding: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

// ── Bar color by state (jade reserved for the anomalous/live state) ──────────
function barColor(row: SupersetExposureRow): string {
  if (row.exposureCount > 0 && row.sensitive) return color.jade; // anomalous exposure (live)
  if (row.exposureCount > 0) return color.teal; // exposure on a non-sensitive product
  return color.petrolSoft; // no exposure (neutral)
}

// ── Donut slice colors (validated: teal vs petrolMid, ΔE 24.4 normal) ──────────
const SLICE_COLOR: Record<SupersetSourceRow['edgeKind'], string> = {
  viewed: color.teal, // SQL Server Fleet — the access logs
  memberof: color.petrolMid, // Active Directory — the group memberships
};

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
      <div style={{ ...panel, background: surface.light.sunken, gap: 4 }}>
        <span style={{ fontFamily: font.data, fontSize: 11, color: surface.light.text }}>
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
            border: `1px solid ${sensitiveOnly ? color.jade : surface.light.border}`,
            background: sensitiveOnly ? color.jade : 'transparent',
            color: sensitiveOnly ? surface.light.bg : surface.light.text,
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
              border: `1px solid ${color.teal}`,
              background: 'transparent',
              color: color.teal,
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
        {/* (1) Bar — products by exposure count */}
        <section style={panel} aria-label="Products by exposure count" role="img">
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
                    color: surface.light.text,
                  }}
                >
                  <span style={{ width: 92, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.productName}
                  </span>
                  <span
                    style={{
                      height: 14,
                      width: w,
                      borderRadius: 4,
                      background: barColor(row),
                      border: drilled ? `1px solid ${color.jade}` : 'none',
                      boxShadow: drilled ? `0 0 0 2px rgba(20,167,122,0.18)` : 'none',
                    }}
                  />
                  <span style={{ color: row.exposureCount > 0 && row.sensitive ? color.jade : surface.light.textMuted }}>
                    {row.exposureCount} exposed · {row.viewCount} view{row.viewCount === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })
          )}
        </section>

        {/* (2) Table — users with anomalous views (j.harper flagged) */}
        <section style={panel} aria-label="Users with anomalous views" role="table">
          <p style={label}>Table · users with anomalous views</p>
          {tableRows.length === 0 ? (
            <p style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }}>no anomalous views</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div
                role="row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '84px 1fr 64px 1fr',
                  gap: 6,
                  fontFamily: font.data,
                  fontSize: 10,
                  color: surface.light.textMuted,
                  padding: '2px 4px',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                <span role="columnheader">user</span>
                <span role="columnheader">product</span>
                <span role="columnheader">owner</span>
                <span role="columnheader">status</span>
              </div>
              {tableRows.map((u) => (
                <div
                  key={u.edgeId}
                  role="row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '84px 1fr 64px 1fr',
                    gap: 6,
                    fontFamily: font.data,
                    fontSize: 11,
                    color: surface.light.text,
                    padding: '3px 4px',
                    borderLeft: `2px solid ${color.jade}`,
                    background: 'rgba(20, 167, 122, 0.06)',
                    borderRadius: 4,
                  }}
                >
                  <span role="cell" style={{ fontWeight: 700 }}>{u.user}</span>
                  <span role="cell">{u.productName}</span>
                  <span role="cell" style={{ color: surface.light.textMuted }}>{u.ownerGroup}</span>
                  <span role="cell" style={{ color: color.jade }}>no backing membership</span>
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
                stroke={surface.light.border}
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
                    stroke={SLICE_COLOR[s.edgeKind]}
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
            fill={surface.light.text}
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
            fill={surface.light.textMuted}
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
                    borderRadius: 3,
                    background: SLICE_COLOR[s.edgeKind],
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
                <span style={{ color: surface.light.text }}>{s.sourceSystem}</span>
                <span style={{ marginLeft: 'auto', color: surface.light.textMuted }}>
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