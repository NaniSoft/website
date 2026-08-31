'use client';

import { useState } from 'react';
import { font, radius } from '@nanisoft/identity';
import { usePlayground } from '../_store/usePlayground';

const TABS = ['Bronze', 'Silver', 'Gold', 'Schema', 'Audit'] as const;
type Tab = (typeof TABS)[number];

function esc(s: unknown): string {
  return String(s ?? '');
}

export function Inspector() {
  const state = usePlayground((s) => s.state);
  const [tab, setTab] = useState<Tab>('Gold');

  const bronzeRows = state.bronze.products.length + state.bronze.viewLogs.length;
  const silverRows = state.silver.extProduct.length + state.silver.extViewLog.length;

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-elev)',
    border: '1px solid var(--color-border)',
    borderRadius: radius.card,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 360,
  };
  const labelStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: font.data,
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
  };
  const bodyStyle: React.CSSProperties = {
    fontFamily: font.data,
    fontSize: 11.5,
    color: 'var(--color-text)',
    background: 'var(--color-bg-sunken)',
    borderRadius: radius.inner,
    padding: 10,
    flex: 1,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.7,
  };
  const rowBorder: React.CSSProperties = { borderBottom: '1px dashed var(--color-border)', padding: '3px 0' };
  const emptyStyle: React.CSSProperties = { opacity: 0.55, fontStyle: 'italic' };
  // Identifiers read as muted ink; status words (sensitive/anomalous/ok/decisions)
  // carry by WEIGHT, not by teal/jade text — those hues sit at 2.4–3.7:1 on the
  // data surfaces (WCAG 1.4.3 fail), and the Honest Status Rule says status never
  // borrows the accent's authority anyway.
  const k: React.CSSProperties = { color: 'var(--color-text-muted)' };
  const j: React.CSSProperties = { color: 'var(--color-text)', fontWeight: 700 };
  const ok: React.CSSProperties = { color: 'var(--color-text-muted)', fontWeight: 700 };

  let body: React.ReactNode;
  if (tab === 'Bronze') {
    body = bronzeRows === 0 ? <div style={emptyStyle}>Bronze empty — no tables yet.</div> : (
      <>
        <div style={rowBorder}><span style={k}>ext_product</span> · {state.bronze.products.length} rows</div>
        <div style={rowBorder}><span style={k}>view_logs</span> · {state.bronze.viewLogs.length} rows</div>
      </>
    );
  } else if (tab === 'Silver') {
    body = silverRows === 0 ? <div style={emptyStyle}>Silver empty — transform has not run.</div> : (
      <>
        <div style={rowBorder}><span style={k}>ext_product</span> · {state.silver.extProduct.length} rows · conformed + SCD2</div>
        <div style={rowBorder}><span style={k}>view_logs</span> · {state.silver.extViewLog.length} rows · conformed</div>
      </>
    );
  } else if (tab === 'Gold') {
    body = (
      <>
        <div style={rowBorder}><span style={k}>graph_nodes</span> · <span style={k}>{state.gold.nodes.length}</span></div>
        {state.gold.nodes.map((n) => (
          <div key={n.id} style={rowBorder}>&nbsp;&nbsp;{esc(n.id)} <span style={k}>{esc(n.kind)}</span>{n.sensitive ? <span style={j}> · sensitive</span> : null}</div>
        ))}
        <div style={{ ...rowBorder, marginTop: 6 }}><span style={k}>graph_edges</span> · <span style={j}>{state.gold.edges.length}</span></div>
        {state.gold.edges.map((e) => {
          const dec = e.status === 'anomalous' ? <span style={j}> · anomalous</span> : e.status === 'ok' ? <span style={ok}> · ok</span> : null;
          return <div key={e.id} style={rowBorder}>&nbsp;&nbsp;{esc(e.from)} <span style={k}>-{esc(e.kind)}-&gt;</span> {esc(e.to)}{dec}</div>;
        })}
      </>
    );
  } else if (tab === 'Schema') {
    const types = Object.keys(state.schemaRegistry);
    body = types.length === 0 ? <div style={emptyStyle}>SchemaRegistry empty — no types defined yet.</div> : types.map((t) => {
      const obj = state.schemaRegistry[t];
      return (
        <div key={t} style={rowBorder}>
          <span style={k}>{esc(t)}</span> · table ext_product<br />
          &nbsp;&nbsp;{obj.fields.map((f) => (
            <span key={f.name} style={{ marginRight: 12 }}>
              {f.name === 'Sensitive' ? <span style={j}>{f.name}</span> : <span style={k}>{f.name}</span>}:{f.type}
            </span>
          ))}
        </div>
      );
    });
  } else {
    body = state.auditLog.length === 0 ? <div style={emptyStyle}>audit_log empty — no runs yet.</div> : state.auditLog.map((a, i) => (
      <div key={i} style={rowBorder}><span style={k}>{esc(a.ts)}</span> · {esc(a.actor)} · {esc(a.useCase)} · <span style={j}>{esc(a.decision)}</span><br />&nbsp;&nbsp;{esc(a.detail)}</div>
    ));
  }

  // Static counts are data, not live state — full ink (jade here broke the One
  // Pulse Rule as well as contrast).
  const counts: { label: string; value: number }[] = [
    { label: 'Bronze', value: bronzeRows },
    { label: 'Silver', value: silverRows },
    { label: 'Gold nodes', value: state.gold.nodes.length },
    { label: 'Gold edges', value: state.gold.edges.length },
    { label: 'Audit', value: state.auditLog.length },
  ];

  return (
    <div style={cardStyle}>
      <p style={labelStyle}>shared in-browser state · live</p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {counts.map((c) => (
          <div key={c.label} style={{ fontFamily: font.data, fontSize: 10, color: 'var(--color-text-muted)' }}>
            {c.label}
            <br />
            <b style={{
              fontSize: 15,
              color: 'var(--color-text)',
            }}>{c.value}</b>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontFamily: font.data,
              fontSize: 10,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              background: t === tab ? 'var(--color-bg)' : 'transparent',
              border: '1px solid var(--color-border)',
              color: t === tab ? 'var(--color-text)' : 'var(--color-text-muted)',
              padding: '5px 10px',
              borderRadius: radius.inner,
              cursor: 'pointer',
            }}
          >{t}</button>
        ))}
      </div>
      {/* Announced politely: the state body is the tab panel's content, and a
          plain aria-label on a div is not a live region (old gap). */}
      <div style={bodyStyle} role="region" aria-label="inspector state" aria-live="polite">{body}</div>
    </div>
  );
}