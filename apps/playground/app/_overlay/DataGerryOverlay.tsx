'use client';

import type { CSSProperties } from 'react';
import { color, font, radius } from '@nanisoft/identity';
import { dataGerrySyncStatus } from '@nanisoft/architecture';
import { usePlayground, STEPS } from '../_store/usePlayground';

/** The cursor at which DataGerry's canonical action is live (step 1 is next). */
const BECKON_CURSOR = STEPS.findIndex((s) => s.openTool === 'blueprint');

export function DataGerryOverlay() {
  const state = usePlayground((s) => s.state);
  const step = usePlayground((s) => s.step);

  const product = state.schemaRegistry.Product;
  const fields = product?.fields ?? [];
  const hasSensitive = fields.some((f) => f.name === 'Sensitive');
  const canAct = state.cursor === BECKON_CURSOR && !hasSensitive;

  const sync = dataGerrySyncStatus(state, state.cursor);

  const label: CSSProperties = {
    margin: 0,
    fontFamily: font.data,
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
  };
  const row: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 8px',
    borderRadius: radius.inner,
    fontFamily: font.data,
    fontSize: 12,
  };
  // Stage state: a teal dot mark (3.1–3.7:1, passes non-text) + weight on the
  // label — jade text sat at 2.4–2.9:1 here (WCAG 1.4.3 fail).
  const stage = (done: boolean, text: string) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: done ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontWeight: done ? 700 : 400,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 7,
          height: 7,
          borderRadius: 9999,
          flexShrink: 0,
          // Done = teal mark (≥3:1 on sunken); idle = the viz-neutral mark —
          // the old --color-border dot vanished (border IS boneSunken here,
          // the panel's own background).
          background: done ? color.teal : 'var(--viz-neutral)',
        }}
      />
      {text}
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, minHeight: 180 }}>
        {/* left: ObjectTypes */}
        <div style={{ background: 'var(--color-bg-sunken)', borderRadius: radius.inner, padding: 8 }}>
          <p style={label}>ObjectTypes</p>
          <div
            style={{
              ...row,
              background: 'var(--color-bg-elev)',
              border: `1px solid ${color.teal}`,
              marginTop: 6,
              fontWeight: 700,
              color: 'var(--color-text)',
            }}
          >
            Product
          </div>
        </div>
        {/* right: fields */}
        <div style={{ background: 'var(--color-bg-sunken)', borderRadius: radius.inner, padding: 8 }}>
          <p style={label}>Fields · Product</p>
          {fields.map((f) => (
            <div
              key={f.name}
              style={{
                ...row,
                // The sensitive field is THE finding-as-a-row (the Trino
                // anomalous-row pattern): quiet accent wash + weight — raw jade
                // TEXT sat at ~2.6:1 on the sunken panel (WCAG 1.4.3 fail).
                ...(f.name === 'Sensitive'
                  ? {
                      background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                      color: 'var(--color-text)',
                      fontWeight: 700,
                    }
                  : { color: 'var(--color-text)' }),
              }}
            >
              <span>{f.name}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{f.type}</span>
            </div>
          ))}
          {!hasSensitive && (
            <div style={{ ...row, opacity: 0.5, fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
              <span>＋ Sensitive</span>
              <span>bool</span>
            </div>
          )}
        </div>
      </div>

      {/* canonical action — one code path: store.step() */}
      <button
        onClick={step}
        disabled={!canAct}
        style={{
          alignSelf: 'flex-start',
          fontFamily: font.voice,
          fontSize: 13,
          fontWeight: 600,
          padding: '9px 18px',
          borderRadius: 9999,
          cursor: canAct ? 'pointer' : 'not-allowed',
          border: `1px solid ${canAct ? color.jade : 'var(--color-border)'}`,
          background: canAct ? color.jade : 'transparent',
          color: canAct ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
        }}
      >
        {hasSensitive ? 'Sensitive: bool — already authored' : 'Add Sensitive: bool'}
      </button>

      {/* sync-status line: Bridge → Bedrock (ext_product) → Atlas */}
      <div
        style={{
          background: 'var(--color-bg-sunken)',
          borderRadius: radius.inner,
          padding: '8px 10px',
          fontFamily: font.data,
          fontSize: 11,
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
        }}
        aria-label="datagerry-sync-status"
      >
        {stage(sync.authored, 'Blueprint authored')}
        <span style={{ color: 'var(--color-text-muted)' }}>→</span>
        {stage(sync.bedrock, 'Bedrock: ext_product created')}
        <span style={{ color: 'var(--color-text-muted)' }}>→</span>
        {stage(sync.atlas, 'Atlas: SchemaRegistry refreshed')}
      </div>

      <p style={{ ...label, marginTop: 2 }}>
        mocked · schema authoring surface only · DataGerry’s Section/Relation/Granularity richness is hidden
      </p>
    </div>
  );
}