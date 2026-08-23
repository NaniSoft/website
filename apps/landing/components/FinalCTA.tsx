'use client';

import { Typography } from 'antd';
import { FINAL_CTA } from '@/lib/data';
import { PillButton } from './PillButton';

export function FinalCTA() {
  return (
    <section id="final-cta" style={{ padding: '96px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Typography.Title level={2} style={{ fontSize: 48, fontWeight: 700, margin: '0 0 24px' }}>
          {FINAL_CTA.h2}
        </Typography.Title>
        <div>
          {/* External href → new tab, explicitly noopener (same convention as the UseCases link). */}
          <PillButton
            type="primary"
            size="large"
            href={FINAL_CTA.primary.href}
            target={FINAL_CTA.primary.href.startsWith('http') ? '_blank' : undefined}
            rel={FINAL_CTA.primary.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {FINAL_CTA.primary.label}
          </PillButton>
        </div>
        <div style={{ marginTop: 16, color: 'var(--color-text-muted)' }}>{FINAL_CTA.footnote}</div>
      </div>
    </section>
  );
}
