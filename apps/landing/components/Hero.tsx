import { HeroDag } from './hero/HeroDag';
import { Wordmark } from './Wordmark';
import { BRAND } from '@/lib/data';

/**
 * The nanisoft hero (ticket 19 / SPEC §3.1): a reactive digital-twin pipeline
 * graph as pure spectacle — no buttons, no CTA (FinalCTA owns demo requests) —
 * with the W1 wordmark and positioning line overlaid. The wordmark wrapper is
 * decorative here: TopNav carries the brand announcement for assistive tech,
 * so the page keeps exactly two labeled marks.
 *
 * Server Component; HeroDag is the client boundary ('use client' in its own
 * file — no dynamic({ssr:false}) needed or allowed).
 */
export function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-positioning">
      <div className="hero-canvas">
        <HeroDag />
      </div>
      <div className="hero-overlay">
        <span className="hero-wordmark" aria-hidden>
          <Wordmark height={64} band="bg" />
        </span>
        <h1 id="hero-positioning" className="hero-h1">
          Digital <em>twin</em> of the IT estate.
        </h1>
      </div>
      <style>{`
        .hero {
          position: relative;
          display: flex;
          align-items: center;
          min-height: min(88vh, 860px);
          padding: 96px 24px 40px;
          overflow: hidden;
        }
        .hero-canvas { position: absolute; inset: 0; }
        .hero-overlay {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          pointer-events: none;
        }
        /* Legibility scrim behind the statement, tuned from tokens. */
        .hero-overlay::before {
          content: '';
          position: absolute;
          inset: -48px -32px;
          background: radial-gradient(
            620px 420px at 22% 42%,
            color-mix(in srgb, var(--color-bg) 82%, transparent),
            transparent 72%
          );
          z-index: -1;
        }
        .hero-wordmark { display: inline-flex; height: 64px; }
        .hero-wordmark .wordmark { height: 64px; }
        .hero-h1 {
          margin: 14px 0 0;
          font-size: clamp(34px, 5vw, 56px);
          line-height: 1.06;
          font-weight: 700;
          letter-spacing: -0.015em;
          max-width: 12ch;
        }
        .hero-h1 em { font-style: italic; }

        @media (max-width: 719px) {
          .hero {
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            gap: 8px;
            padding-top: 72px;
          }
          .hero-canvas {
            position: relative;
            inset: auto;
            order: 2;
            height: 340px;
            overflow-x: auto;
            overflow-y: hidden;
          }
          .hero-canvas svg { min-width: 900px; }
          .hero-overlay { order: 1; }
          .hero-wordmark { height: 44px; }
          .hero-wordmark .wordmark { height: 44px; }
        }
      `}</style>
    </section>
  );
}
