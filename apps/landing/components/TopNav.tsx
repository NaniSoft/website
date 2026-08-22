'use client';

import { useEffect, useState } from 'react';
import { Layout, Menu, Button } from 'antd';
import Link from 'next/link';
import { ThemeToggle } from './theme/ThemeToggle';
import { BRAND } from '@/lib/data';

const items = [
  { key: 'platform', label: 'Platform' },
  { key: 'solutions', label: 'Solutions' },
  { key: 'resources', label: 'Resources' },
  { key: 'pricing', label: 'Pricing' },
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
    <Layout.Header
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
      <Link href="/" aria-label={BRAND.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18 }}>
        <span
          aria-hidden
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          }}
        />
        {BRAND.name}
      </Link>
      <Menu mode="horizontal" items={items} selectable={false} style={{ flex: 1, background: 'transparent', borderBottom: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ThemeToggle />
        <Link href="/signin" style={{ color: 'var(--color-text-muted)' }}>Sign in</Link>
        <Button type="primary" href="#final-cta">Request a demo</Button>
      </div>
    </Layout.Header>
  );
}
