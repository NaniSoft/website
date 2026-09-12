import { ABOUT } from '@/lib/data';
import { StorySection } from './about/StorySection';
import { CapabilitiesSection } from './about/CapabilitiesSection';
import { OpenSourceSection } from './about/OpenSourceSection';
import { ContactSection } from './about/ContactSection';

export function AboutUs() {
  return (
    <article>
      <header id="about-hero" style={{ padding: '96px 24px 32px', maxWidth: 960, margin: '0 auto' }}>
        {/* Eyebrow in the twin's data face (SPEC §Label): mono, --text-xs,
            --tracking-upper — the same annotation the hero uses. */}
        <p className="mono" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-upper)', textTransform: 'uppercase', margin: '0 0 12px' }}>
          {ABOUT.hero.eyebrow}
        </p>
        <h1 style={{ fontSize: 'var(--text-display)', lineHeight: 'var(--lh-heading)', letterSpacing: 'var(--tracking-display)', fontWeight: 700, margin: '0 0 16px' }}>
          {ABOUT.hero.title}
        </h1>
        <p className="lead" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-lg)', maxWidth: 640, margin: 0 }}>
          {ABOUT.hero.lead}
        </p>
      </header>
      <StorySection />
      <CapabilitiesSection />
      <OpenSourceSection />
      <ContactSection />
    </article>
  );
}