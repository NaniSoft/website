'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { ThemeToggle } from './theme/ThemeToggle';
import { Wordmark } from './Wordmark';
import { BRAND, NAV } from '@/lib/data';
import type { NavItem } from '@/lib/types';

// Nav chrome shares one affordance (globals.css `.nav-link`): muted ink at
// rest, shifting to full ink on hover — the same shift for flat links,
// dropdown items, and the group triggers.
const NAV_LINK_CLASS = 'nav-link';

// antd Menu items render <a> when given href. External items (external: true)
// open in a new tab with rel="noopener noreferrer"; in-page anchors (e.g.
// #platform) scroll — handled by the browser. Keep keys stable for keyboard nav.
function toMenuItems(items: readonly NavItem[]): MenuProps['items'] {
  return items.map((i) => ({
    key: i.href,
    label: (
      <a
        href={i.href}
        className={NAV_LINK_CLASS}
        target={i.external ? '_blank' : undefined}
        rel={i.external ? 'noopener noreferrer' : undefined}
      >
        {i.label}
      </a>
    ),
  }));
}

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
        <span className="top-nav-tagline" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
          {BRAND.tagline.replace(/\.$/, '')}
        </span>
      </Link>
      <nav aria-label="Primary" className="top-nav-links" style={{ flex: 1, display: 'flex', gap: 20, marginLeft: 8, alignItems: 'center' }}>
        {NAV.groups.map((group) => (
          <Dropdown
            key={group.label}
            menu={{ items: toMenuItems(group.items) }}
            trigger={['hover', 'click']}
          >
            {/* Borderless text trigger (SPEC §Navigation). antd v6 requires the
                color/variant PAIR: `variant="text"` alone falls through the
                Button's prop resolution to the default outlined chip, which is
                exactly the boxed drift this replaces. */}
            <Button
              color="default"
              variant="text"
              className={NAV_LINK_CLASS}
              style={{ padding: '0 4px', height: 'auto' }}
            >
              {group.label}
            </Button>
          </Dropdown>
        ))}
        {NAV.links.map((item) => {
          const external = item.external;
          return (
            <a
              key={item.href}
              href={item.href}
              className={NAV_LINK_CLASS}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="top-nav-ask" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ThemeToggle />
      </div>
      <style>{`
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
          .site-header { padding: 8px 24px !important; }
          .top-nav-links { flex-basis: 100% !important; margin-left: 0 !important; gap: 12px !important; }
          .top-nav-ask { gap: 8px !important; }
        }
      `}</style>
    </header>
  );
}
