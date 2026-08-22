'use client';

import { Button, Typography } from 'antd';
import { FINAL_CTA } from '@/lib/data';

export function FinalCTA() {
  return (
    <section id="final-cta" style={{ padding: '96px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Typography.Title level={2} style={{ fontSize: 48, fontWeight: 700, margin: '0 0 24px' }}>
          {FINAL_CTA.h2}
        </Typography.Title>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <Button type="primary" size="large" href={FINAL_CTA.primary.href}>{FINAL_CTA.primary.label}</Button>
          <Button size="large" href={FINAL_CTA.secondary.href}>{FINAL_CTA.secondary.label}</Button>
        </div>
        <div style={{ color: 'var(--color-text-muted)' }}>{FINAL_CTA.footnote}</div>
      </div>
    </section>
  );
}
