'use client';

import { useState } from 'react';
import { Card, Segmented, Tag } from 'antd';
import { PLATFORM_FLOW, PLATFORM_PILLARS } from '@/lib/data';

/**
 * The platform section: the four-step flow as cards (the numbered sequence IS
 * the argument), then the six capability blurbs as three pillar tabs. The
 * Segmented control is the same theme-pinned primitive as the nav's theme
 * toggle; its active thumb follows the Monochrome Inversion Rule (petrol fill
 * in light, bone fill in dark) — a selected tab is a choice, not a live edge,
 * so jade stays out (One Pulse Rule).
 */
export function Platform() {
  const [pillarKey, setPillarKey] = useState<string>(PLATFORM_PILLARS[0].key);
  const active = PLATFORM_PILLARS.find((p) => p.key === pillarKey) ?? PLATFORM_PILLARS[0];

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
      <div className="pillars">
        <Segmented
          className="pillar-tabs"
          value={pillarKey}
          onChange={(v) => setPillarKey(v as string)}
          options={PLATFORM_PILLARS.map((p) => ({ label: p.label, value: p.key }))}
          aria-label="Platform pillars"
        />
        {/* The active panel: two capability entries over a hairline, closed by
            the mono annotation naming the real components that carry them. */}
        <div className="pillar-panel" role="group" aria-label={active.label}>
          {active.features.map((f, i) => (
            <article key={f.title} className={i > 0 ? 'pillar-feature pillar-feature--ruled' : 'pillar-feature'}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, margin: '0 0 6px' }}>{f.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--text-base)' }}>{f.body}</p>
            </article>
          ))}
        </div>
        <p className="pillar-components mono">{active.components}</p>
      </div>
      {/* Hands the reader down into the architecture walkthrough, the section below this one. */}
      <p className="lead" style={{ color: 'var(--color-text-muted)', maxWidth: 640 }}>
        That’s the data path. The next section walks the full pipeline — every component, from source systems to Compass.
      </p>
      {/* The documented two-step law (SPEC §Layout): 4-col grids drop to 2 at
          900px and to 1 at 600px; 3-col grids fall 3→1 in a single step at 900.
          Every section repeats these same rules, so `.grid-3`/`.grid-4` behave
          identically page-wide. The pillar panel is a 2-col split: entries side
          by side over a vertical hairline, stacking under the vertical rule
          flips to a horizontal one at 700px. */}
      <style>{`
        .pillars { margin-top: 8px; }
        .pillar-panel {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 32px;
          margin-top: 24px;
        }
        .pillar-feature--ruled { border-left: 1px solid var(--color-border); padding-left: 32px; }
        .pillar-components {
          margin: 16px 0 0;
          font-size: 11px;
          letter-spacing: var(--tracking-upper);
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
        @media (max-width: 700px) {
          .pillar-panel { grid-template-columns: 1fr; gap: 24px; }
          .pillar-feature--ruled { border-left: none; padding-left: 0; border-top: 1px solid var(--color-border); padding-top: 24px; }
        }
        /* Narrow phones: three full-length labels overflow a 375px viewport, so
           the track tightens (smaller label padding + type stop) and, as the
           last resort, scrolls rather than pushing the page wide. */
        @media (max-width: 520px) {
          .pillar-tabs { max-width: 100%; overflow-x: auto; }
          .pillar-tabs .ant-segmented-item-label { padding-inline: 8px; font-size: var(--text-sm); }
        }
        @media (max-width: 900px) { .grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .grid-4 { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
