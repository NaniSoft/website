'use client';

import type { CSSProperties } from 'react';
import { color, font, radius, surface } from '@nanisoft/identity';
import { atlasOpaStatus, type AtlasLogLine } from '@nanisoft/architecture';
import { usePlayground, STEPS } from '../_store/usePlayground';

/**
 * Atlas + OPA mock — the "govern" write surface (SPEC §4.8/§4.9). One overlay,
 * two zones: an OPA decision card (focal interactive — input → ALLOW + a
 * read-only ~3-line Rego snippet) and an Atlas request/response log (context,
 * non-interactive). The "Evaluate authz" button calls store.step() — the same
 * applyStep auto-run uses (one code path) — and applies step 14 (the audit-log
 * write, the only mutate). OPA is stateless (static Rego, writes nothing); the
 * audit write is Atlas's. The traversal result is a hand-off to Compass — a log
 * line only, never rendered here. Jade = ALLOW (live); teal = success statuses;
 * petrol = pending.
 */

/** The cursor at which Atlas's canonical action is live (step 14 is next). */
const BECKON_CURSOR = STEPS.findIndex((s) => s.openTool === 'atlas');

const label: CSSProperties = {
  margin: 0,
  fontFamily: font.data,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: surface.light.textMuted,
};

function DecisionPill({ allow }: { allow: boolean }) {
  return (
    <span
      style={{
        fontFamily: font.data,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '3px 10px',
        borderRadius: 9999,
        border: `1px solid ${allow ? color.jade : color.petrolSoft}`,
        color: allow ? color.jade : surface.light.textMuted,
        background: allow ? 'rgba(20, 167, 122, 0.10)' : 'transparent',
      }}
    >
      {allow ? 'ALLOW' : 'pending'}
    </span>
  );
}

function LogLine({ line }: { line: AtlasLogLine }) {
  const success = line.status >= 200 && line.status < 300;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <span
        style={{
          fontFamily: font.data,
          fontSize: 11,
          fontWeight: 700,
          color: line.method === 'POST' ? color.teal : surface.light.text,
          minWidth: 38,
        }}
      >
        {line.method}
      </span>
      <span style={{ fontFamily: font.data, fontSize: 11, color: surface.light.text, flex: 1 }}>
        {line.path}
      </span>
      <span style={{ fontFamily: font.data, fontSize: 11, color: success ? color.teal : surface.light.textMuted }}>
        → {line.status}
      </span>
      {line.body && (
        <span style={{ fontFamily: font.data, fontSize: 11, color: surface.light.textMuted }}>{line.body}</span>
      )}
    </div>
  );
}

export function AtlasOpaOverlay() {
  const state = usePlayground((s) => s.state);
  const step = usePlayground((s) => s.step);

  const status = atlasOpaStatus(state, state.cursor);
  const auditWritten = state.auditLog.length > 0;
  const canAct = state.cursor === BECKON_CURSOR && !auditWritten;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14 }}>
      {/* Zone 1 — OPA decision card (focal interactive) */}
      <div
        role="group"
        aria-label="OPA decision"
        style={{
          background: surface.light.sunken,
          borderRadius: radius.inner,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={label}>OPA · authz decision</p>
          <DecisionPill allow={status.allow} />
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...label, letterSpacing: '0.06em' }}>user</span>
            <span style={{ fontFamily: font.data, fontSize: 12, color: surface.light.text }}>analyst</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...label, letterSpacing: '0.06em' }}>use-case</span>
            <span style={{ fontFamily: font.data, fontSize: 12, color: surface.light.text }}>
              Sensitive Product View Audit
            </span>
          </div>
        </div>

        <div>
          <p style={{ ...label, marginBottom: 4 }}>Rego · static policy</p>
          <pre
            style={{
              margin: 0,
              padding: '8px 10px',
              background: surface.light.elevated,
              borderRadius: radius.inner,
              border: `1px solid ${surface.light.border}`,
              fontFamily: font.data,
              fontSize: 11,
              lineHeight: 1.5,
              color: surface.light.text,
              whiteSpace: 'pre',
              overflow: 'auto',
            }}
          >
            {status.rego}
          </pre>
        </div>

        <button
          onClick={step}
          disabled={!canAct}
          aria-label="Evaluate authz decision"
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
          {auditWritten ? 'Audit entry written' : 'Evaluate authz'}
        </button>

        <p style={{ ...label, textTransform: 'none', letterSpacing: '0.04em' }}>
          OPA is stateless · reads a static Rego policy · writes nothing
        </p>
      </div>

      {/* Zone 2 — Atlas request/response log (context, non-interactive) */}
      <div
        role="log"
        aria-label="Atlas request log"
        style={{
          background: surface.light.sunken,
          borderRadius: radius.inner,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <p style={label}>Atlas · request log</p>
        {status.log.length === 0 ? (
          <span style={{ fontFamily: font.data, fontSize: 11, color: surface.light.textMuted }}>no requests yet</span>
        ) : (
          status.log.map((line) => <LogLine key={line.path} line={line} />)
        )}
      </div>

      <p style={{ ...label, marginTop: 2 }}>
        mocked · authz + audit surface only · confidence/trust state machine, temporal-ledger, Celery, full FastAPI
        surface, OPA bundle management hidden
      </p>
    </div>
  );
}