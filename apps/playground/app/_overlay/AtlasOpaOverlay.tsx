'use client';

import type { CSSProperties } from 'react';
import { color, font, radius } from '@nanisoft/identity';
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
 * line only, never rendered here. Jade = ALLOW (live, onAccent pairing); log
 * lines are prose — writes carry by weight, never by hue.
 */

/** The cursor at which Atlas's canonical action is live (step 14 is next). */
const BECKON_CURSOR = STEPS.findIndex((s) => s.openTool === 'atlas');

const label: CSSProperties = {
  margin: 0,
  fontFamily: font.data,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
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
        border: `1px solid ${allow ? color.jade : 'var(--color-text-muted)'}`,
        // ALLOW is a live decision: jade fill + petrol text (role.onAccent,
        // ~4.9:1) — the old jade-on-boneTINT text sat at ~2.9:1.
        color: allow ? 'var(--color-on-accent)' : 'var(--color-text-muted)',
        background: allow ? color.jade : 'transparent',
      }}
    >
      {allow ? 'ALLOW' : 'pending'}
    </span>
  );
}

function LogLine({ line }: { line: AtlasLogLine }) {
  const success = line.status >= 200 && line.status < 300;
  // Log lines are prose on a sunken panel, where teal TEXT sat at ~2.9:1
  // (WCAG 1.4.3 fail) — same treatment as the Airflow run log: writes carry
  // by weight, successes stay muted, anything unusual goes bold ink.
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <span
        style={{
          fontFamily: font.data,
          fontSize: 11,
          fontWeight: line.method === 'POST' ? 700 : 400,
          color: 'var(--color-text)',
          minWidth: 38,
        }}
      >
        {line.method}
      </span>
      <span style={{ fontFamily: font.data, fontSize: 11, color: 'var(--color-text)', flex: 1 }}>
        {line.path}
      </span>
      <span style={{ fontFamily: font.data, fontSize: 11, color: success ? 'var(--color-text-muted)' : 'var(--color-text)', fontWeight: success ? 400 : 700 }}>
        → {line.status}
      </span>
      {line.body && (
        <span style={{ fontFamily: font.data, fontSize: 11, color: 'var(--color-text-muted)' }}>{line.body}</span>
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
          background: 'var(--color-bg-sunken)',
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
            <span style={{ fontFamily: font.data, fontSize: 12, color: 'var(--color-text)' }}>analyst</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...label, letterSpacing: '0.06em' }}>use-case</span>
            <span style={{ fontFamily: font.data, fontSize: 12, color: 'var(--color-text)' }}>
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
              background: 'var(--color-bg-elev)',
              borderRadius: radius.inner,
              border: '1px solid var(--color-border)',
              fontFamily: font.data,
              fontSize: 11,
              lineHeight: 1.5,
              color: 'var(--color-text)',
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
          background: 'var(--color-bg-sunken)',
          borderRadius: radius.inner,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <p style={label}>Atlas · request log</p>
        {status.log.length === 0 ? (
          <span style={{ fontFamily: font.data, fontSize: 11, color: 'var(--color-text-muted)' }}>no requests yet</span>
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