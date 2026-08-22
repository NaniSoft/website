'use client';

import { Layout } from 'antd';
import { BRAND, FOOTER_LINKS } from '@/lib/data';

export function Footer() {
  return (
    <Layout.Footer
      style={{
        background: 'var(--color-bg-elev)',
        borderTop: '1px solid var(--color-border)',
        padding: '64px 24px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.5fr repeat(4, 1fr)',
          gap: 48,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18, marginBottom: 12 }}>
            <span
              aria-hidden
              style={{
                width: 24, height: 24, borderRadius: 6,
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              }}
            />
            {BRAND.name}
          </div>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 280 }}>{BRAND.tagline}</p>
        </div>
        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>{heading}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {links.map((label) => (
                <li key={label}>
                  <a href="#" style={{ color: 'var(--color-text-muted)' }}>{label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div
        style={{
          maxWidth: 1200,
          margin: '48px auto 0',
          paddingTop: 24,
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--color-text-muted)',
          fontSize: 14,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span>© 2026 {BRAND.name}, Inc. All rights reserved.</span>
        <span style={{ display: 'flex', gap: 24 }}>
          <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a><a href="#">Status</a>
        </span>
      </div>
    </Layout.Footer>
  );
}
