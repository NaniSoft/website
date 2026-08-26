'use client';

import { Card } from 'antd';
import { BUILT_IN_HOUSE, INTEGRATIONS_NOTE, STACK_PRODUCTS } from '@/lib/data';

export function Integrations() {
  return (
    <section id="integrations" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 12px' }}>Buy first. Build only what’s ours.</h2>
      <p className="lead" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', maxWidth: 720, marginBottom: 48 }}>
        Sixteen proven open-source products carry the platform. Eight run under their real names; eight we wrap under nanisoft codenames — the real product is shown beneath each codename. We build four things ourselves — the parts where nanisoft differs.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-4">
        {STACK_PRODUCTS.map((p) => {
          const codenamed = p.realName && p.realName !== p.name;
          return (
            <Card key={p.name} variant="outlined" style={{ background: 'var(--color-bg-elev)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div aria-hidden style={{ width: 40, height: 40, borderRadius: 'var(--radius-inner)', background: 'var(--color-bg-sunken)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                  {p.name.slice(0, 1)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  {codenamed && (
                    <div className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                      {p.realName}
                    </div>
                  )}
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{p.role}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 24, maxWidth: 720 }}>{INTEGRATIONS_NOTE}</p>
      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: '56px 0 16px' }}>Built in-house</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="grid-4">
        {BUILT_IN_HOUSE.map((c) => (
          <Card key={c.name} variant="outlined" style={{ background: 'var(--color-bg-elev)' }}>
            {/* Data-shaped mark in the twin's mono face — a label, not the accent. */}
            <div className="mono" style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-upper)', color: 'var(--color-text-muted)', marginBottom: 8 }}>CUSTOM</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{c.name}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-base)' }}>{c.blurb}</div>
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
