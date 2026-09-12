'use client';

import { FINAL_CTA } from '@/lib/data';
import { PillButton } from './PillButton';

export function FinalCTA() {
  return (
    <section id="final-cta" style={{ padding: '96px 24px', textAlign: 'center' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Section h2s use the headline stop — --text-display is hero-only (SPEC §Typography). */}
        <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', letterSpacing: 'var(--tracking-display)', fontWeight: 700, margin: '0 0 24px' }}>
          {FINAL_CTA.h2}
        </h2>
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
