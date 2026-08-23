'use client';

import { color, font, radius } from '@nanisoft/identity';
import { SENSITIVE_PRODUCT_VIEW_AUDIT } from '@nanisoft/architecture';
import { usePlayground, STEPS } from '../_store/usePlayground';

export function Narrative() {
  const cursor = usePlayground((s) => s.state.cursor);
  const total = STEPS.length;
  const step = cursor > 0 ? SENSITIVE_PRODUCT_VIEW_AUDIT[cursor - 1] : null;

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-bg-sunken)',
    borderRadius: radius.inner,
    padding: '12px 14px',
    marginTop: 12,
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontFamily: font.data, fontSize: 11, letterSpacing: '0.04em', color: color.teal }}>
        step {cursor} / {total}{step ? ` · phase: ${step.phase}` : ''}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', margin: '2px 0 6px', color: 'var(--color-text)' }}>
        {step ? step.title : 'Press Run to step the twin.'}
      </div>
      <div style={{ color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
        {step ? step.desc : 'The playbook engine will animate the Sensitive Product View Audit through every phase. Each step mutates the shared lakehouse state and writes the audit log where the real system would.'}
      </div>

      {/* progress bar */}
      <div style={{ height: 6, borderRadius: 9999, background: 'var(--color-border)', overflow: 'hidden', marginTop: 12 }}>
        <div style={{ height: '100%', width: `${(cursor / total) * 100}%`, background: color.jade, transition: 'width 0.4s cubic-bezier(.32,.72,0,1)' }} />
      </div>

      {/* step list */}
      <div style={{ maxHeight: 170, overflow: 'auto', borderTop: '1px solid var(--color-border)', marginTop: 10, paddingTop: 8 }}>
        {SENSITIVE_PRODUCT_VIEW_AUDIT.map((s, i) => {
          const cls = i + 1 < cursor ? 'done' : i + 1 === cursor ? 'now' : '';
          const colorFor = cls === 'done' ? color.teal : cls === 'now' ? color.jade : 'var(--color-text-muted)';
          return (
            <div key={s.n} style={{ display: 'flex', gap: 8, padding: '3px 0', fontFamily: font.data, fontSize: 10.5, color: colorFor }}>
              <span style={{ width: 22 }}>{String(s.n).padStart(2, '0')}</span>
              <span>{s.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}