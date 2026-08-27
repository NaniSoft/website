import { ABOUT } from '@/lib/data';

export function CapabilitiesSection() {
  return (
    <section id="capabilities" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 32px' }}>
        {ABOUT.capabilities.heading}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="about-grid-3">
        {ABOUT.capabilities.items.map((c) => (
          <div key={c.title} style={{ background: 'var(--color-bg-elev)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, margin: '0 0 8px' }}>{c.title}</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', lineHeight: 1.6, margin: 0 }}>{c.body}</p>
          </div>
        ))}
      </div>
      <style>{`@media (max-width: 900px) { .about-grid-3 { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}