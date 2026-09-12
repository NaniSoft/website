import { ABOUT } from '@/lib/data';

export function OpenSourceSection() {
  return (
    <section id="open-source" style={{ padding: '96px 24px', maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 16px' }}>
        {ABOUT.openSource.heading}
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', lineHeight: 1.6, margin: '0 0 24px' }}>
        {ABOUT.openSource.body}
      </p>
      {/* Body-copy links: always underlined (globals.css `.inline-link`) so the
          destination is legible without color (WCAG 1.4.1). */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {ABOUT.openSource.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="inline-link"
            target={l.external ? '_blank' : undefined}
            rel={l.external ? 'noopener noreferrer' : undefined}
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}