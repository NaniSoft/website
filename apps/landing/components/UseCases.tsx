'use client';

import type { CSSProperties } from 'react';
import { Card, Tag } from 'antd';
import { USE_CASES, USE_CASES_MORE } from '@/lib/data';

// Illustration covers are decorative — quiet teal/petrol washes over the
// sunken surface. Jade never appears here (live/active states only).
const ILLU_BG: Record<string, string> = {
  graph: 'linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 22%, transparent), color-mix(in srgb, var(--color-secondary) 6%, transparent)), var(--color-bg-sunken)',
  shield: 'linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 12%, transparent), color-mix(in srgb, var(--color-primary) 10%, transparent)), var(--color-bg-sunken)',
  clock: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 14%, transparent), color-mix(in srgb, var(--color-secondary) 8%, transparent)), var(--color-bg-sunken)',
};

// Status is honest, not decorative: the flagship is available today; the rest
// are roadmap. Teal/muted only — jade stays locked to live/active states.
const STATUS_TAG: Record<'available' | 'planned', { label: string; style: CSSProperties }> = {
  available: {
    label: 'Flagship · available today',
    style: {
      background: 'color-mix(in srgb, var(--color-secondary) 14%, transparent)',
      color: 'var(--color-text)',
      borderColor: 'transparent',
      borderRadius: 'var(--radius-pill)',
    },
  },
  planned: {
    label: 'Planned',
    style: {
      background: 'var(--color-bg-sunken)',
      color: 'var(--color-text-muted)',
      borderColor: 'transparent',
      borderRadius: 'var(--radius-pill)',
    },
  },
};

export function UseCases() {
  return (
    <section id="use-cases" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 12px' }}>What it unlocks.</h2>
      <p className="lead" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', maxWidth: 640, marginBottom: 48 }}>
        One twin, many questions. Today, the flagship is access.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="grid-3">
        {USE_CASES.map((u) => (
          <Card
            key={u.title}
            variant="outlined"
            style={{ background: 'var(--color-bg-elev)', overflow: 'hidden' }}
            styles={{ body: { padding: 0 } }}
            cover={
              <div aria-hidden style={{ height: 200, background: ILLU_BG[u.illustration] }} />
            }
          >
            <div style={{ padding: 24 }}>
              <Tag style={STATUS_TAG[u.status].style}>{STATUS_TAG[u.status].label}</Tag>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: '12px 0' }}>{u.title}</h3>
              <ul style={{ paddingLeft: 18, color: 'var(--color-text-muted)', margin: 0 }}>
                {u.bullets.map((b) => <li key={b} style={{ marginBottom: 6 }}>{b}</li>)}
              </ul>
            </div>
          </Card>
        ))}
      </div>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 40, maxWidth: 720 }}>
        {USE_CASES_MORE.line}{' '}
        <a
          href={USE_CASES_MORE.cta.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-primary)', fontWeight: 500 }}
        >
          {USE_CASES_MORE.cta.label}
        </a>
      </p>
      <style>{`@media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
