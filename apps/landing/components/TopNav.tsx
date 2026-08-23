'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './theme/ThemeToggle';
import { Wordmark } from './Wordmark';
import { PillButton } from './PillButton';
import { BRAND, FINAL_CTA } from '@/lib/data';

// Anchors into the kept narrative sections (ticket 21 rewrites the copy).
const NAV_ITEMS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Use cases', href: '#use-cases' },
  { label: 'Integrations', href: '#integrations' },
];

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="site-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '0 24px',
        height: 64,
        background: scrolled ? 'color-mix(in srgb, var(--color-bg) 80%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(160%) blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        transition: 'background 200ms ease-out, border-color 200ms ease-out',
      }}
    >
      <Link href="/" aria-label={BRAND.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Wordmark height={26} />
        <span aria-hidden className="top-nav-tagline-rule" style={{ width: 1, height: 16, background: 'var(--color-border)' }} />
        {/* Positioning line — the sentence-case tagline minus its period. */}
        <span className="top-nav-tagline" style={{ color: 'var(--color-text-muted)', fontSize: 13, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
          {BRAND.tagline.replace(/\.$/, '')}
        </span>
      </Link>
      <nav aria-label="Primary" className="top-nav-links" style={{ flex: 1, display: 'flex', gap: 20, marginLeft: 8 }}>
        {NAV_ITEMS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ThemeToggle />
        {/* The only ask on the site: explore the playground (external href →
            new tab, explicitly noopener — same convention as FinalCTA). */}
        <PillButton
          type="primary"
          href={FINAL_CTA.primary.href}
          target={FINAL_CTA.primary.href.startsWith('http') ? '_blank' : undefined}
          rel={FINAL_CTA.primary.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {FINAL_CTA.primary.label}
        </PillButton>
      </div>
      <style>{`
        @media (max-width: 1023px) {
          .top-nav-links { display: none !important; }
        }
        /* Tagline hides below md: with it shown, the row's min-content is
           ~643px, which clipped 640–659px viewports (task 5 [A] sweep). */
        @media (max-width: 767px) {
          .top-nav-tagline, .top-nav-tagline-rule { display: none !important; }
        }
        @media (max-width: 639px) {
          /* Below 640px even brand + toggle + "Open the playground" pill
             (~500px min-content) exceed the viewport, so the ask group wraps
             to its own line instead of clipping the pill (task 5 [A]).
             !important beats the inline flex/height. */
          .site-header {
            flex-wrap: wrap !important;
            height: auto !important;
            min-height: 64px;
            row-gap: 4px !important;
          }
        }
      `}</style>
    </header>
  );
}
