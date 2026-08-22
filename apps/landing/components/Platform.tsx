'use client';

import { Card, Tag } from 'antd';
import { PLATFORM_FLOW, PLATFORM_FEATURES } from '@/lib/data';

export function Platform() {
  return (
    <section id="platform" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 16px', maxWidth: 720 }}>
        One platform. Ingest, normalize, graph, and query.
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        Built for security teams who need answers they can cite — at any point in time.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 64 }} className="grid-4">
        {PLATFORM_FLOW.map((s) => (
          <Card key={s.step} variant="outlined" style={{ background: 'var(--color-bg-elev)' }}>
            <Tag color="blue">{s.step}</Tag>
            <h3 style={{ fontSize: 22, fontWeight: 600, margin: '12px 0 8px' }}>{s.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{s.body}</p>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-3">
        {PLATFORM_FEATURES.map((f) => (
          <Card key={f.title} variant="outlined" style={{ background: 'var(--color-bg-elev)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>{f.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 15 }}>{f.body}</p>
          </Card>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr !important; } .grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .grid-4 { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
