'use client';

import Link from 'next/link';
import { Card } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { USE_CASES } from '@/lib/data';

// Illustration covers are decorative — quiet teal/petrol washes over the
// sunken surface. Jade never appears here (live/active states only).
const ILLU_BG: Record<string, string> = {
  graph: 'linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 22%, transparent), color-mix(in srgb, var(--color-secondary) 6%, transparent)), var(--color-bg-sunken)',
  shield: 'linear-gradient(135deg, color-mix(in srgb, var(--color-secondary) 12%, transparent), color-mix(in srgb, var(--color-primary) 10%, transparent)), var(--color-bg-sunken)',
  clock: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 14%, transparent), color-mix(in srgb, var(--color-secondary) 8%, transparent)), var(--color-bg-sunken)',
};

export function UseCases() {
  return (
    <section id="use-cases" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 12px' }}>Where teams use nanisoft.</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        From high-stakes transactions to everyday audits, the same graph powers every answer.
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
              <h3 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 12px' }}>{u.title}</h3>
              <ul style={{ paddingLeft: 18, color: 'var(--color-text-muted)', margin: '0 0 16px' }}>
                {u.bullets.map((b) => <li key={b} style={{ marginBottom: 6 }}>{b}</li>)}
              </ul>
              <Link href="#" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
                Read the full story <ArrowRightOutlined />
              </Link>
            </div>
          </Card>
        ))}
      </div>
      <style>{`@media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
