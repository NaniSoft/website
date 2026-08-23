'use client';

import { Card } from 'antd';
import { STACK_PRODUCTS } from '@/lib/data';

export function Integrations() {
  return (
    <section id="integrations" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 12px' }}>Connects to every source your security team already runs.</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        50+ first-party connectors and a typed SDK for everything else.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-4">
        {STACK_PRODUCTS.map((p) => (
          <Card key={p.name} variant="outlined" style={{ background: 'var(--color-bg-elev)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div aria-hidden style={{ width: 40, height: 40, borderRadius: 'var(--radius-inner)', background: 'var(--color-bg-sunken)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                {p.name.slice(0, 1)}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.role}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <style>{`
        @media (max-width: 900px) { .grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .grid-4 { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
