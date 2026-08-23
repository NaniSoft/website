'use client';

import { motion } from 'motion/react';
import { Tag } from 'antd';
import { HERO, CUSTOMER_LOGOS } from '@/lib/data';
import { PillButton } from './PillButton';

// Placeholder hero holding the top of the page until ticket 19 replaces it
// with the reactive digital-twin DAG (SPEC §3: pure spectacle, no buttons —
// this placeholder keeps only the primary demo-request CTA; the secondary
// CTA died with the retired #agents demo).
export function Hero() {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        padding: '96px 24px 64px',
        background:
          'radial-gradient(1200px 600px at 20% 0%, color-mix(in srgb, var(--color-secondary) 8%, transparent), transparent 60%)',
        overflow: 'hidden',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Status chip styled from tokens (antd preset colors are off-palette). */}
          <Tag
            style={{
              background: 'var(--color-bg-sunken)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
              borderRadius: 'var(--radius-pill)',
              padding: '2px 10px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {/* Live indicator — jade is reserved for live/active states. */}
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-accent)',
                  boxShadow: '0 0 0 0 var(--color-accent)',
                  animation: 'pulse 1.6s ease-out infinite',
                }}
              />
              {HERO.eyebrow}
            </span>
          </Tag>
          <h1 style={{ fontSize: 56, lineHeight: 1.1, fontWeight: 700, margin: '20px 0 16px' }}>
            {HERO.h1}
          </h1>
          <p style={{ fontSize: 20, color: 'var(--color-text-muted)', maxWidth: 640, margin: '0 0 24px' }}>
            {HERO.sub}
          </p>
          <div style={{ marginBottom: 32 }}>
            <PillButton type="primary" size="large" href={HERO.primaryCta.href}>
              {HERO.primaryCta.label}
            </PillButton>
          </div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {HERO.trustCaption}
            </div>
            <div style={{ display: 'flex', gap: 24, opacity: 0.7, flexWrap: 'wrap' }}>
              {CUSTOMER_LOGOS.slice(0, 4).map((name) => (
                <span key={name} className="mono" style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, color: 'var(--color-text-muted)', fontSize: 14, flexWrap: 'wrap' }}>
            {HERO.metrics.map((m, i) => (
              <span key={m.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <span aria-hidden style={{ width: 1, height: 16, background: 'var(--color-border)' }} />}
                <span className="mono" style={{ color: 'var(--color-text)', fontSize: 16, fontWeight: 600 }}>{m.value}</span>
                <span>{m.label}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
      <style>{`
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 60%, transparent); }
          70%  { box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-accent) 0%, transparent); }
          100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 0%, transparent); }
        }
      `}</style>
    </section>
  );
}
