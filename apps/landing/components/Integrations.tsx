'use client';

import { Card } from 'antd';
import { BUILT_IN_HOUSE, INTEGRATIONS_NOTE, PLATFORM_SPECS, STACK_PRODUCTS } from '@/lib/data';

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
      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: '48px 0 16px' }}>Built in-house</h3>
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
      {/*
       * The survey plate — the section's closing factual beat before the
       * page's ask. Four readings on one strip: top and bottom hairlines do
       * the separating (Flat Estate — no cards, no shadow), figures sit in
       * the twin's mono data face with tabular numerals like any instrument
       * output. Every number is derivable from lib/data (16 stack products,
       * 8 codenames, 4 built in-house, 0 forks); nothing is trended because
       * the system publishes no history (Honest Status Rule).
       */}
      <div className="specs-band" role="group" aria-label="Platform specifications">
        {PLATFORM_SPECS.map((s) => (
          <div key={s.label} className="spec">
            <span className="spec-value mono" aria-hidden>
              {s.value}
            </span>
            <span className="spec-label mono">
              {/* The value is aria-hidden so the reading announces once, whole. */}
              <span className="visually-hidden">{s.value} </span>
              {s.label}
            </span>
          </div>
        ))}
      </div>
      {/* Same two-step law as every other section (SPEC §Layout): 4→2 at 900px,
          2→1 at 600px — the old 480px single step mixed card widths with the
          other 4-col grids between 600–900px. The specs band reads 4-up on
          desktop, 2×2 from 700px. */}
      <style>{`
        .specs-band {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 48px;
          padding: 24px 0;
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
        }
        .spec { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .spec-value {
          font-size: var(--text-2xl);
          line-height: 1.1;
          font-variant-numeric: tabular-nums;
        }
        .spec-label {
          font-size: 11px;
          letter-spacing: var(--tracking-upper);
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
          border: 0;
        }
        @media (max-width: 700px) { .specs-band { grid-template-columns: repeat(2, 1fr); row-gap: 24px; } }
        @media (max-width: 900px) { .grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .grid-4 { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
