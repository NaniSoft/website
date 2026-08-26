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
      <div className="top-nav-ask" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
        /* Below lg the primary nav links stay visible (the three short
           in-page anchors fit at 320px once the tagline is hidden). The
           tagline moves up to the lg breakpoint because the nav now shares
           the row at 768–1023px and the tagline's ~180px would overflow.
           The header is allowed to wrap so brand+nav+ask never clip at
           640–703px, where the ask group's ~287px min-content otherwise
           overflows the ~577–655px content width. */
        @media (max-width: 1023px) {
          .top-nav-tagline, .top-nav-tagline-rule { display: none !important; }
          .site-header {
            flex-wrap: wrap !important;
            height: auto !important;
            min-height: 64px;
            row-gap: 8px !important;
            gap: 16px !important;
          }
          .top-nav-links { gap: 16px !important; margin-left: 4px !important; }
        }
        @media (max-width: 639px) {
          /* Below 640px each cluster gets its own line: the nav links take
             flex-basis 100% so brand and the ask group wrap beneath them.
             The ask group's gap tightens and the pill's horizontal padding
             is reduced so toggle + "Open the playground" fit at 320px
             without clipping the pill's right edge (task 5 [A] 6px
             overflow). !important beats the inline flex/height and antd
             Button's default 15px inline padding. */
          .site-header {
            padding: 8px 24px !important;
          }
          .top-nav-links {
            flex-basis: 100% !important;
            margin-left: 0 !important;
            gap: 16px !important;
          }
          .top-nav-ask { gap: 8px !important; }
          .top-nav-ask .ant-btn { padding-inline: 10px !important; }
        }
      `}</style>
    </header>
  );
}
