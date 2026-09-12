'use client';

import { Card, Tag } from 'antd';
import { PLATFORM_FLOW, PLATFORM_FEATURES } from '@/lib/data';

export function Platform() {
  return (
    <section id="platform" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 16px', maxWidth: 720 }}>
        Built like a lakehouse — because it is one.
      </h2>
      <p className="lead" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', maxWidth: 640, marginBottom: 48 }}>
        Every fact lands raw, gets conformed, and is promoted layer by layer — raw in Bronze, clean in Silver, published as Gold — until it becomes part of the twin.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }} className="grid-4">
        {PLATFORM_FLOW.map((s) => (
          <Card key={s.step} variant="outlined" style={{ background: 'var(--color-bg-elev)' }}>
            {/* Step number in the twin's data face — a supporting mark, not the accent. */}
            <Tag
              className="mono"
              style={{
                background: 'var(--color-bg-sunken)',
                color: 'var(--color-text-muted)',
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              {s.step}
            </Tag>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: '12px 0 8px' }}>{s.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{s.body}</p>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-3">
        {PLATFORM_FEATURES.map((f) => (
          <Card key={f.title} variant="outlined" style={{ background: 'var(--color-bg-elev)' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, margin: '0 0 6px' }}>{f.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--text-base)' }}>{f.body}</p>
          </Card>
        ))}
      </div>
      {/* Hands the reader down into the architecture walkthrough, the section below this one. */}
      <p className="lead" style={{ color: 'var(--color-text-muted)', maxWidth: 640 }}>
        That’s the data path. The next section walks the full pipeline — every component, from source systems to Compass.
      </p>
      {/* The documented two-step law (SPEC §Layout): 4-col grids drop to 2 at
          900px and to 1 at 600px; 3-col grids fall 3→1 in a single step at 900.
          Every section repeats these same rules, so `.grid-3`/`.grid-4` behave
          identically page-wide. */}
      <style>{`
        @media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr !important; } .grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .grid-4 { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
