import { ABOUT } from '@/lib/data';

export function StorySection() {
  return (
    <section id="story" style={{ padding: '96px 24px', maxWidth: 760, margin: '0 auto' }}>
      <h2 style={{ fontSize: 'var(--text-2xl)', lineHeight: 'var(--lh-heading)', fontWeight: 700, margin: '0 0 24px' }}>
        {ABOUT.story.heading}
      </h2>
      {ABOUT.story.body.map((p, i) => (
        <p key={i} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-md)', lineHeight: 1.6, margin: '0 0 16px' }}>
          {p}
        </p>
      ))}
    </section>
  );
}