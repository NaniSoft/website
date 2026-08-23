'use client';

import type { CSSProperties } from 'react';
import { color, font, radius } from '@nanisoft/identity';
import { trinoResults, type TrinoResultRow } from '@nanisoft/architecture';
import { usePlayground } from '../_store/usePlayground';

/**
 * Trino / Overlook mock — the "query" read surface (SPEC §4.8/§4.9). Structured
 * echo of Trino's info shape (a read-only SQL editor + Run button + a results
 * table) in nanisoft tokens. The finding surfaces as a table row: the anomalous
 * row (`j.harper / P-1042 / viewed / no-backing`) is highlighted jade — the
 * single locked accent for the live finding-as-a-row. The "Run query" button
 * calls store.step() — the same applyStep auto-run uses (one code path). Trino
 * writes nothing; `trinoResults(state, cursor)` is a pure read over Gold.
 */

const label: CSSProperties = {
  margin: 0,
  fontFamily: font.data,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
};

const COLUMNS = ['user', 'product', 'product_name', 'viewed', 'backing'] as const;

function Row({ row }: { row: TrinoResultRow }) {
  const cells: string[] = [row.user, row.product, row.productName, 'viewed', row.backing];
  return (
    <tr
      aria-label={row.anomalous ? `${row.user} anomalous view of ${row.product}` : `${row.user} view of ${row.product}`}
      style={{
        background: row.anomalous ? 'rgba(20, 167, 122, 0.10)' : 'transparent',
        color: 'var(--color-text)',
      }}
    >
      {cells.map((c, i) => (
        <td
          key={i}
          style={{
            padding: '6px 10px',
            borderBottom: `1px solid ${row.anomalous ? color.jade : 'var(--color-border)'}`,
            fontFamily: font.data,
            fontSize: 12,
            whiteSpace: 'nowrap',
          }}
        >
          {c}
        </td>
      ))}
      <td
        style={{
          padding: '6px 10px',
          borderBottom: `1px solid ${row.anomalous ? color.jade : 'var(--color-border)'}`,
          fontFamily: font.data,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {row.anomalous ? (
          <span
            style={{
              color: 'var(--color-on-accent)',
              background: color.jade,
              borderRadius: 9999,
              padding: '2px 8px',
            }}
          >
            anomalous
          </span>
        ) : (
          <span
            style={{
              color: color.teal,
              border: `1px solid ${color.teal}`,
              borderRadius: 9999,
              padding: '1px 7px',
            }}
          >
            ok
          </span>
        )}
      </td>
    </tr>
  );
}

export function TrinoOverlay() {
  const state = usePlayground((s) => s.state);
  const step = usePlayground((s) => s.step);
  const results = trinoResults(state, state.cursor);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14 }}>
      {/* Seeded-query provenance header + read-only editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={label}>Query seeded by Atlas: Sensitive Product View Audit</p>
        <pre
          role="textbox"
          aria-label="seeded SQL query"
          aria-readonly="true"
          style={{
            margin: 0,
            background: 'var(--color-bg-sunken)',
            borderRadius: radius.inner,
            padding: '10px 12px',
            fontFamily: font.data,
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--color-text)',
            overflow: 'auto',
            whiteSpace: 'pre',
            border: '1px solid var(--color-border)',
          }}
        >
          {results.sql}
        </pre>
      </div>

      {/* Run control — one code path: store.step() */}
      <button
        onClick={step}
        disabled={!results.canRun}
        aria-label="Run seeded SQL query"
        style={{
          alignSelf: 'flex-start',
          fontFamily: font.voice,
          fontSize: 13,
          fontWeight: 600,
          padding: '9px 18px',
          borderRadius: 9999,
          cursor: results.canRun ? 'pointer' : 'not-allowed',
          border: `1px solid ${results.canRun ? color.jade : 'var(--color-border)'}`,
          background: results.canRun ? color.jade : 'transparent',
          color: results.canRun ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
        }}
      >
        {results.queryRun ? 'Query already run' : 'Run query'}
      </button>

      {/* Results table — the finding as a table row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <p style={label}>Results</p>
          {results.queryRun && (
            <span style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }}>
              {results.rows.length} {results.rows.length === 1 ? 'row' : 'rows'}
            </span>
          )}
        </div>
        {results.queryRun ? (
          <div
            role="table"
            aria-label="query results"
            style={{
              background: 'var(--color-bg-elev)',
              borderRadius: radius.inner,
              border: '1px solid var(--color-border)',
              overflow: 'auto',
            }}
          >
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {COLUMNS.map((c) => (
                    <th
                      key={c}
                      scope="col"
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        fontFamily: font.data,
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-muted)',
                        borderBottom: '1px solid var(--color-border)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c}
                    </th>
                  ))}
                  <th
                    scope="col"
                    style={{
                      textAlign: 'left',
                      padding: '6px 10px',
                      fontFamily: font.data,
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-muted)',
                      borderBottom: '1px solid var(--color-border)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    status
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.rows.map((row) => (
                  <Row key={row.edgeId} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--color-bg-sunken)',
              borderRadius: radius.inner,
              padding: '10px 12px',
              fontFamily: font.data,
              fontSize: 11,
              color: 'var(--color-text-muted)',
            }}
          >
            run the seeded query to see results
          </div>
        )}
      </div>

      <p style={{ ...label, marginTop: 2 }}>
        mocked · query surface only · catalog/RBAC/federation/history/EXPLAIN hidden
      </p>
    </div>
  );
}