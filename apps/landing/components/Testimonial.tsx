'use client';

import { Card, Statistic } from 'antd';
import { TESTIMONIAL } from '@/lib/data';

export function Testimonial() {
  return (
    <section id="testimonial" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <Card variant="outlined" style={{ background: 'var(--color-bg-elev)', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 48, padding: 24 }} className="testimonial-grid">
          <div>
            <div style={{ fontSize: 48, lineHeight: 1, color: 'var(--color-primary)', marginBottom: 8 }}>&ldquo;</div>
            <blockquote style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.3, margin: '0 0 24px' }}>
              {TESTIMONIAL.quote}
            </blockquote>
            <div style={{ color: 'var(--color-text-muted)' }}>
              <strong style={{ color: 'var(--color-text)' }}>{TESTIMONIAL.author}</strong> &mdash; {TESTIMONIAL.title}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 24, alignContent: 'center' }}>
            {TESTIMONIAL.metrics.map((m) => (
              <div key={m.label}>
                <Statistic value={m.value} styles={{ content: { fontSize: 36, fontWeight: 700 } }} />
                <div style={{ color: 'var(--color-text-muted)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <style>{`@media (max-width: 900px) { .testimonial-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
