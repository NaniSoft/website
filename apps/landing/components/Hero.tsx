'use client';

import { motion } from 'motion/react';
import { Button, Tag } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { HERO, CUSTOMER_LOGOS } from '@/lib/data';
import { CommandCenter } from './CommandCenter';

export function Hero() {
  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        padding: '96px 24px 64px',
        background:
          'radial-gradient(1200px 600px at 20% 0%, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 60%), radial-gradient(800px 500px at 90% 10%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 60%)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)',
          gap: 48,
          alignItems: 'center',
        }}
        className="hero-grid"
      >
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Tag color="cyan" style={{ borderRadius: 999, padding: '2px 10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--color-accent)', boxShadow: '0 0 0 0 var(--color-accent)', animation: 'pulse 1.6s ease-out infinite' }} />
              {HERO.eyebrow}
            </span>
          </Tag>
          <h1 style={{ fontSize: 56, lineHeight: 1.1, fontWeight: 700, margin: '20px 0 16px' }}>
            {HERO.h1}
          </h1>
          <p style={{ fontSize: 20, color: 'var(--color-text-muted)', maxWidth: 540, margin: '0 0 24px' }}>
            {HERO.sub}
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            <Button type="primary" size="large" href={HERO.primaryCta.href}>{HERO.primaryCta.label}</Button>
            <Button size="large" href={HERO.secondaryCta.href} icon={<PlayCircleOutlined />}>
              {HERO.secondaryCta.label}
            </Button>
          </div>
          <div style={{ marginBottom: 24 }}>
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
                {i > 0 && <span style={{ width: 1, height: 16, background: 'var(--color-border)' }} />}
                <span className="mono" style={{ color: 'var(--color-text)', fontSize: 16, fontWeight: 600 }}>{m.value}</span>
                <span>{m.label}</span>
              </span>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ willChange: 'transform' }}
        >
          <CommandCenter />
        </motion.div>
      </div>
      <style>{`
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 60%, transparent); }
          70%  { box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-accent) 0%, transparent); }
          100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 0%, transparent); }
        }
        @media (max-width: 1023px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
