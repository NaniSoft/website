import { CUSTOMER_LOGOS } from '@/lib/data';

export function LogoCloud() {
  return (
    <section style={{ padding: '24px 24px 48px', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }}>
        {CUSTOMER_LOGOS.map((name) => (
          <span key={name} className="mono" style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-text-muted)' }}>{name}</span>
        ))}
      </div>
    </section>
  );
}
