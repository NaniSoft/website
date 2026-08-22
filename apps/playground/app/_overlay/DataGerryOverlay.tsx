'use client';

import type { CSSProperties } from 'react';
import { color, font, radius, surface } from '@nanisoft/identity';
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
    color: surface.light.textMuted,
  };
  const row: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 8px',
    borderRadius: radius.inner,
    fontFamily: font.data,
    fontSize: 12,
  };
  const stage = (done: boolean, text: string) => (
    <span style={{ color: done ? color.jade : surface.light.textMuted }}>
      {done ? '✓ ' : '○ '}
      {text}
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, minHeight: 180 }}>
        {/* left: ObjectTypes */}
        <div style={{ background: surface.light.sunken, borderRadius: radius.inner, padding: 8 }}>
          <p style={label}>ObjectTypes</p>
          <div
            style={{
              ...row,
              background: surface.light.elevated,
              border: `1px solid ${color.teal}`,
              marginTop: 6,
              fontWeight: 700,
              color: surface.light.text,
            }}
          >
            Product
          </div>
        </div>
        {/* right: fields */}
        <div style={{ background: surface.light.sunken, borderRadius: radius.inner, padding: 8 }}>
          <p style={label}>Fields · Product</p>
          {fields.map((f) => (
            <div
              key={f.name}
              style={{
                ...row,
                color: f.name === 'Sensitive' ? color.jade : surface.light.text,
                fontWeight: f.name === 'Sensitive' ? 700 : 400,
              }}
            >
              <span>{f.name}</span>
              <span style={{ color: surface.light.textMuted }}>{f.type}</span>
            </div>
          ))}
          {!hasSensitive && (
            <div style={{ ...row, opacity: 0.5, fontStyle: 'italic', color: surface.light.textMuted }}>
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
          border: `1px solid ${canAct ? color.jade : surface.light.border}`,
          background: canAct ? color.jade : 'transparent',
          color: canAct ? surface.light.bg : surface.light.textMuted,
        }}
      >
        {hasSensitive ? 'Sensitive: bool — already authored' : 'Add Sensitive: bool'}
      </button>

      {/* sync-status line: Bridge → Bedrock (ext_product) → Atlas */}
      <div
        style={{
          background: surface.light.sunken,
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
        <span style={{ color: surface.light.textMuted }}>→</span>
        {stage(sync.bedrock, 'Bedrock: ext_product created')}
        <span style={{ color: surface.light.textMuted }}>→</span>
        {stage(sync.atlas, 'Atlas: SchemaRegistry refreshed')}
      </div>

      <p style={{ ...label, marginTop: 2 }}>
        mocked · schema authoring surface only · DataGerry’s Section/Relation/Granularity richness is hidden
      </p>
    </div>
  );
}