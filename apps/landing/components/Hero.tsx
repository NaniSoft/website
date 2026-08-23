import { HeroFlow } from './hero/HeroFlow';
import { Wordmark } from './Wordmark';

/**
 * The nanisoft hero (task 4): ONE story — the estate flowing through the
 * platform and coming out as an answered, governed question — self-running
 * beneath the W1 wordmark and positioning line. No buttons, no CTA (the
 * playground ask lives in the nav pill and the closing section).
 *
 * The wordmark wrapper is decorative here: TopNav carries the brand
 * announcement for assistive tech, so the page keeps exactly two labeled
 * marks.
 *
 * Server Component; HeroFlow is the client boundary ('use client' in its own
 * file). The canvas always fits its container now — statement above, story
 * below, on every device; no overflow/pan scaffolding anywhere.
 */
export function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-positioning">
      <div className="hero-overlay">
        <span className="hero-wordmark" aria-hidden>
          <Wordmark height={64} band="bg" />
        </span>
        <h1 id="hero-positioning" className="hero-h1">
          Digital <em>twin</em> of the IT estate.
        </h1>
      </div>
      <div className="hero-canvas">
        <HeroFlow />
      </div>
      <style>{`
        .hero {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: clamp(24px, 5vh, 44px);
          min-height: min(88vh, 860px);
          padding: 96px 24px 40px;
        }
        .hero-overlay {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          pointer-events: none;
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
        .hero-canvas {
          position: relative;
          z-index: 0;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
        }

        /* Only sizing survives from the old mobile block — the canvas itself
           always fits now (HeroFlow switches to its vertical arrangement).
           !important is required to beat Wordmark's inline height (the old
           layout hid the mismatch with overflow:hidden instead). */
        @media (max-width: 719px) {
          .hero { padding-top: 72px; }
          .hero-wordmark { height: 44px !important; }
          .hero-wordmark .wordmark { height: 44px !important; }
        }
      `}</style>
    </section>
  );
}
