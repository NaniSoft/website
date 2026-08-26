'use client';

import type { ReactElement } from 'react';
import { Card } from 'antd';
import { ApartmentOutlined, DatabaseOutlined, SearchOutlined } from '@ant-design/icons';
import { PROBLEM_CARDS } from '@/lib/data';

const ICONS: Record<string, ReactElement> = {
  graph: <ApartmentOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />,
  stack: <DatabaseOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />,
  magnify: <SearchOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />,
};

export function Problem() {
  return (
    <section id="problem" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, lineHeight: 1.2, fontWeight: 700, margin: '0 0 16px', maxWidth: 720 }}>
        nanisoft builds a digital twin of your IT estate.
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 48 }}>
        Systems, people, and permissions modeled in one place, so you can see how your estate is connected — and how it behaves.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="grid-3">
        {PROBLEM_CARDS.map((c) => (
          <Card key={c.title} variant="outlined" style={{ background: 'var(--color-bg-elev)' }}>
            <div aria-hidden style={{ width: 40, height: 40, borderRadius: 'var(--radius-inner)', background: 'var(--color-bg-sunken)', display: 'grid', placeItems: 'center' }}>
              {ICONS[c.icon]}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '16px 0 8px' }}>{c.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{c.body}</p>
          </Card>
        ))}
      </div>
      <style>{`@media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
