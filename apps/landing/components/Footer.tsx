import { BRAND, FOOTER_LINKS } from '@/lib/data';
import { Wordmark } from './Wordmark';

export function Footer() {
  return (
    <footer
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
        className="footer-grid"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <Wordmark band="elevated" height={26} />
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
      <style>{`@media (max-width: 899px) { .footer-grid { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
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
        <span>© 2026 {BRAND.name}. All rights reserved.</span>
        <span style={{ display: 'flex', gap: 24 }}>
          <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a><a href="#">Status</a>
        </span>
      </div>
    </footer>
  );
}
