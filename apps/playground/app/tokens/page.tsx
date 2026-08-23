'use client';

/**
 * /tokens — the nanisoft "Living Map" identity preview (SPEC §2). Renders the
 * wordmark, palette, shape lock, typography, and the four motion variants.
 *
 * The palette swatches and hex readouts below are driven entirely by the raw
 * @nanisoft/identity values (that is their point); the surrounding page chrome
 * uses the app's semantic `--color-*` custom properties (app/globals.css,
 * copied 1:1 from identity) so it follows the shared light/dark mode like the
 * rest of the playground. The wordmark is re-inked per resolved mode —
 * wordmarkSvg bakes hexes into SVG attributes, so it needs the value in TS.
 *
 * NO-VISION: positions and balance are confirmed by a human against this
 * render. This page is a spec/preview surface (not a marketing page), so it may
 * carry labels, hex readouts, and a version stamp that a landing page would not.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import {
  IDENTITY_VERSION,
  MOTION_VARIANTS,
  color,
  easing,
  font,
  radius,
  role,
  withReducedMotion,
  wordmarkSvg,
  type MotionVariant,
} from '@nanisoft/identity';
import { useResolvedTheme } from '../_theme/theme';

// ── helpers ───────────────────────────────────────────────────────────────────
/** Turn a variant's keyframes into a CSS @keyframes rule. */
function keyframesToCss(v: MotionVariant): string {
  const frames = v.keyframes
    .map((kf) => {
      const sel = kf.offset === 0 ? 'from' : kf.offset === 1 ? 'to' : `${Math.round(kf.offset * 100)}%`;
      const props: string[] = [];
      if (kf.transform !== undefined) props.push(`transform: ${kf.transform}`);
      if (kf.opacity !== undefined) props.push(`opacity: ${kf.opacity}`);
      return `${sel} { ${props.join('; ')}; }`;
    })
    .join('\n  ');
  return `@keyframes ${v.name} {\n  ${frames}\n}`;
}

/** Build the CSS animation shorthand for a variant (loop, or one-shot forwards). */
function animationFor(v: MotionVariant): string {
  const iter = v.transition.iterations === Infinity ? 'infinite' : 'forwards';
  return `${v.name} ${v.transition.duration}ms ${easing} ${iter}`;
}

const SWATCHES: Array<{ name: string; hex: string; role: string; accent?: boolean }> = [
  { name: 'petrol', hex: color.petrol, role: 'base · dark' },
  { name: 'petrolMid', hex: color.petrolMid, role: 'surface · dark elevated' },
  { name: 'petrolSoft', hex: color.petrolSoft, role: 'border · muted (on bone)' },
  { name: 'bone', hex: color.bone, role: 'base · light' },
  { name: 'boneElev', hex: color.boneElev, role: 'surface · light elevated' },
  { name: 'boneSunken', hex: color.boneSunken, role: 'surface · sunken / border' },
  { name: 'teal', hex: color.teal, role: 'secondary · done edges' },
  { name: 'jade', hex: color.jade, role: 'accent · live/active only', accent: true },
  { name: 'ink', hex: color.ink, role: 'text (on bone) · not pure black' },
  { name: 'inkMuted', hex: color.inkMuted, role: 'muted text (on bone)' },
];

export default function TokensPage() {
  const [reduced, setReduced] = useState(false);
  const resolved = useResolvedTheme();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // wordmarkSvg interpolates hexes into SVG attributes (it can't take var()),
  // so the mark is re-inked per resolved mode — petrol-on-bone in light,
  // bone-on-petrol in dark. The jade live link is unaffected.
  const markBg = resolved === 'dark' ? color.petrol : color.bone;
  const markInk = resolved === 'dark' ? color.bone : color.petrol;

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: font.voice,
        padding: '48px 24px 80px',
      }}
    >
      <style>{`
        ${MOTION_VARIANTS.map(keyframesToCss).join('\n')}
        /* Wordmark preview: fluid down from its 300px design width (never a
           fixed 300 — that forced document-level horizontal scroll on phones). */
        .tokens-wordmark { max-width: 300px; }
        .tokens-wordmark svg { display: block; width: 100%; height: auto; }
      `}</style>

      <main style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 64, gridTemplateColumns: 'minmax(0, 1fr)' }}>
        {/* ── Wordmark ─────────────────────────────────────────────────── */}
        <section aria-label="Wordmark">
          <SectionLabel>W1 wordmark · node + flow</SectionLabel>
          <div
            style={{
              marginTop: 16,
              padding: 32,
              borderRadius: radius.card,
              background: 'var(--color-bg-elev)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              className="tokens-wordmark"
              // wordmarkSvg returns the full <svg>; the jade "i" link is the only jade.
              dangerouslySetInnerHTML={{ __html: wordmarkSvg({ bg: markBg, ink: markInk }) }}
            />
            <p style={{ marginTop: 16, color: 'var(--color-text-muted)', fontSize: 14 }}>
              Satoshi 700. The “i” dot is a ringed graph node with a trailing live
              link. Jade is reserved for that single active link; the rest follows
              the mode’s base/ink pair.
            </p>
          </div>
        </section>

        {/* ── Palette ─────────────────────────────────────────────────── */}
        <section aria-label="Palette">
          <SectionLabel>palette · base petrol + bone, teal secondary, jade accent</SectionLabel>
          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            {SWATCHES.map((s) => (
              <div
                key={s.name}
                style={{
                  borderRadius: radius.card,
                  background: 'var(--color-bg-elev)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: 72,
                    background: s.hex,
                    // a thin inset border so bone/petrol edges read against the card
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
                  }}
                />
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</span>
                    {s.accent && (
                      <span
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: color.jade,
                          fontFamily: font.data,
                        }}
                      >
                        live
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: font.data, fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {s.hex}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{s.role}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 16, color: 'var(--color-text-muted)', fontSize: 14, maxWidth: '65ch' }}>
            Excluded: no purple, no neon, no pure black, no pure white. Ink is a
            near-black petrol; the lightest surface is bone, never #FFFFFF. The
            swatches are the raw identity primitives; the page chrome around them
            follows this app’s shared light/dark mode.
          </p>
        </section>

        {/* ── Shape lock ──────────────────────────────────────────────── */}
        <section aria-label="Shape lock">
          <SectionLabel>shape lock · card 20 / inner 12 / buttons pill</SectionLabel>
          <div
            style={{
              marginTop: 16,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'center',
            }}
          >
            {/* Shape is the point here; the fills are the mode's semantic pair so
                the samples stay visible in both modes. */}
            <ShapeSample radius={radius.card} label={`card · ${radius.card}px`} bg="var(--color-bg-elev)" border="var(--color-border)" />
            <ShapeSample radius={radius.inner} label={`inner · ${radius.inner}px`} bg="var(--color-bg-elev)" border="var(--color-border)" />
            <span
              style={{
                borderRadius: radius.pill,
                background: 'var(--color-primary)',
                color: 'var(--color-on-primary)',
                padding: '10px 20px',
                fontFamily: font.voice,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              button · pill
            </span>
          </div>
        </section>

        {/* ── Typography ──────────────────────────────────────────────── */}
        <section aria-label="Typography">
          <SectionLabel>typography · Satoshi voice + JetBrains Mono data, italic emphasis, no serif</SectionLabel>
          <div
            style={{
              marginTop: 16,
              padding: 32,
              borderRadius: radius.card,
              background: 'var(--color-bg-elev)',
              border: '1px solid var(--color-border)',
              // Flex column, not grid: a grid track floors at the items'
              // min-content — the pre block's long lines then force the card
              // (and the document) wider than any phone viewport.
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div>
              <div style={{ fontFamily: font.data, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Satoshi · voice
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: 40, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                The digital twin of an IT estate
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: 16, lineHeight: 1.6, maxWidth: '60ch', color: 'var(--color-text)' }}>
                Body copy in Satoshi. Emphasis is <em style={{ fontStyle: 'italic' }}>italic of the same family</em>, never a swapped-in serif.
              </p>
            </div>
            <div>
              <div style={{ fontFamily: font.data, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                JetBrains Mono · data
              </div>
              <pre
                style={{
                  margin: '4px 0 0',
                  fontFamily: font.data,
                  fontSize: 14,
                  lineHeight: 1.6,
                  background: 'var(--color-bg-sunken)',
                  borderRadius: radius.inner,
                  padding: 16,
                  overflow: 'auto',
                }}
              >
{`-- nodes / edges / logs / query --
graph_nodes  5   graph_edges  4
SELECT u.user, p.name FROM gold ...
[audit] j.harper viewed P-1042`}
              </pre>
            </div>
          </div>
        </section>

        {/* ── Motion ─────────────────────────────────────────────────── */}
        <section aria-label="Motion">
          <SectionLabel>
            motion · breathe / traverse / ripple / settle · easing {easing}
          </SectionLabel>
          <p style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 14, maxWidth: '65ch' }}>
            {reduced
              ? 'prefers-reduced-motion is ON — every variant is shown at its static end-state; no content is removed.'
              : 'prefers-reduced-motion is off — variants animate. Toggle the OS setting to see the static fallback.'}
          </p>
          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {MOTION_VARIANTS.map((v) => (
              <MotionCell key={v.name} variant={v} reduced={reduced} />
            ))}
          </div>
        </section>

        <footer style={{ fontFamily: font.data, fontSize: 12, color: 'var(--color-text-muted)' }}>
          nanisoft identity v{IDENTITY_VERSION} · {Object.keys(role).length} roles · {MOTION_VARIANTS.length} motion variants
        </footer>
      </main>
    </div>
  );
}

// ── presentational bits ───────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: 0,
        fontFamily: font.data,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
      }}
    >
      {children}
    </h2>
  );
}

function ShapeSample({ radius: r, label, bg, border }: { radius: number; label: string; bg: string; border: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 64, height: 64, borderRadius: r, background: bg, border: `1px solid ${border}` }} />
      <span style={{ fontFamily: font.data, fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</span>
    </div>
  );
}

function MotionCell({ variant, reduced }: { variant: MotionVariant; reduced: boolean }) {
  const fallback = withReducedMotion(variant);
  // Under reduced motion: render the element at its static end-state (visible,
  // content intact). Otherwise: animate with the brand easing.
  const animatedStyle: CSSProperties = reduced
    ? { transform: fallback.transform, opacity: fallback.opacity }
    : { animation: animationFor(variant) };

  // The traverse wavefront is the one place jade is "live/active" — the flowing
  // wavefront. Every other demo dot uses the mode's text color (a neutral mark).
  const isWavefront = variant.name === 'traverse';
  const dotColor = isWavefront ? color.jade : 'var(--color-text)';

  return (
    <div
      style={{
        borderRadius: radius.card,
        background: 'var(--color-bg-elev)',
        border: '1px solid var(--color-border)',
        padding: 20,
        display: 'grid',
        gap: 12,
      }}
    >
      <div
        style={{
          height: 56,
          borderRadius: radius.inner,
          background: 'var(--color-bg-sunken)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: dotColor,
            display: 'inline-block',
            ...animatedStyle,
          }}
          aria-label={`${variant.name} ${reduced ? '(static)' : 'animation'}`}
        />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{variant.name}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.45 }}>
          {variant.motivation}
        </div>
        <div style={{ fontFamily: font.data, fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
          {reduced ? 'static end-state' : `${variant.transition.duration}ms`}
        </div>
      </div>
    </div>
  );
}