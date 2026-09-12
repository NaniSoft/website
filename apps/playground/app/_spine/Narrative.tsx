'use client';

import { useEffect, useRef } from 'react';
import { color, font, radius } from '@nanisoft/identity';
import { COMPONENT_BY_ID, SENSITIVE_PRODUCT_VIEW_AUDIT } from '@nanisoft/architecture';
import { usePlayground, STEPS } from '../_store/usePlayground';

export function Narrative() {
  const cursor = usePlayground((s) => s.state.cursor);
  const overlay = usePlayground((s) => s.overlay);
  const overlayAuto = usePlayground((s) => s.overlayAuto);
  const total = STEPS.length;
  const step = cursor > 0 ? SENSITIVE_PRODUCT_VIEW_AUDIT[cursor - 1] : null;

  // The auto-opened overlay (Compass at the finding step) deliberately takes no
  // focus, so this region carries the announcement instead — the same channel
  // the step narration already uses.
  const autoOpenedCodename =
    overlayAuto && overlay ? (COMPONENT_BY_ID[overlay.componentId]?.codename ?? overlay.componentId) : null;

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-sunken)',
    borderRadius: radius.inner,
    padding: '12px 14px',
    marginTop: 12,
  };
  // System annotations appended to the live region (auto-open, completion):
  // mono, muted, hairline-ruled — the twin's own output, never the accent (the
  // Honest Status Rule keeps status out of jade).
  const sysLine: React.CSSProperties = {
    margin: '8px 0 0',
    paddingTop: 6,
    borderTop: '1px solid var(--color-border)',
    fontFamily: font.data,
    fontSize: 11,
    color: 'var(--color-text-muted)',
  };

  // Keep the current step visible in the list as the tour advances.
  // `block: 'nearest'` scrolls the list's own viewport the minimum distance and
  // no-ops when the row is already on screen, so a reader's own scroll of the
  // list is never fought.
  const nowRowRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    nowRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  return (
    <div style={cardStyle}>
      <div style={{ fontFamily: font.data, fontSize: 11, letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
        step {cursor} / {total}{step ? ` · phase: ${step.phase}` : ''}
      </div>
      {/* The primary narration of the tour — announced politely as steps change
          (the step LIST below stays silent; announcing all 22 rows would spam).
          Tour-driven state changes that never take focus are appended here too. */}
      <div aria-live="polite">
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', margin: '2px 0 6px', color: 'var(--color-text)' }}>
          {step ? step.title : 'Press Run to step the twin.'}
        </div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
          {step ? step.desc : 'The playbook engine will animate the Sensitive Product View Audit through every phase. Each step mutates the shared lakehouse state and writes the audit log where the real system would.'}
        </div>
        {autoOpenedCodename && (
          <div style={sysLine}>
            {autoOpenedCodename.toLowerCase()} auto-opened at the finding step · esc dismisses
          </div>
        )}
        {cursor >= total && (
          <div style={sysLine}>playbook complete · {total}/{total} steps</div>
        )}
      </div>

      {/* progress bar — scaleX (transform-only) instead of animating width,
          which thrashes layout (detector finding, now fixed). */}
      <div style={{ height: 6, borderRadius: 9999, background: 'var(--color-border)', overflow: 'hidden', marginTop: 12 }}>
        <div
          style={{
            height: '100%',
            width: '100%',
            background: color.jade,
            transform: `scaleX(${cursor / total})`,
            transformOrigin: '0 50%',
            transition: 'transform 0.4s cubic-bezier(.32,.72,0,1)',
          }}
        />
      </div>

      {/* step list — the current step carries by weight plus a jade pill on its
          number (petrol-on-jade = role.onAccent, 4.9:1); done/upcoming steps are
          muted ink. Teal/jade TEXT sat at 2.4–3.7:1 here (WCAG 1.4.3 fail). */}
      <div style={{ maxHeight: 170, overflow: 'auto', borderTop: '1px solid var(--color-border)', marginTop: 10, paddingTop: 8 }}>
        {SENSITIVE_PRODUCT_VIEW_AUDIT.map((s, i) => {
          const cls = i + 1 < cursor ? 'done' : i + 1 === cursor ? 'now' : '';
          return (
            <div
              key={s.n}
              ref={cls === 'now' ? nowRowRef : undefined}
              aria-current={cls === 'now' ? 'step' : undefined}
              style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0', fontFamily: font.data, fontSize: 10.5, color: 'var(--color-text-muted)' }}
            >
              <span
                style={cls === 'now' ? {
                  width: 22,
                  background: color.jade,
                  color: 'var(--color-on-accent)',
                  fontWeight: 700,
                  borderRadius: 9999,
                  textAlign: 'center',
                } : { width: 22 }}
              >
                {String(s.n).padStart(2, '0')}
              </span>
              <span style={cls === 'now' ? { color: 'var(--color-text)', fontWeight: 700 } : undefined}>{s.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}