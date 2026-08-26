import { HeroDag } from './hero/HeroDag';
import { Wordmark } from './Wordmark';

/**
 * The nanisoft hero — the "Living Map" panel: positioning copy on the left,
 * a breathing canvas DAG of the digital-twin pipeline on the right, on a
 * full-bleed dark petrol band in BOTH page modes. ONE story, no buttons, no
 * CTA (the playground ask lives in the nav pill and the closing section).
 *
 * Layout is a two-column grid (Text | DAG, the DAG column widest) that
 * collapses to a single stacked column on narrow screens (<=719px).
 *
 * The dark panel is achieved by scoping the semantic color tokens to the dark
 * surface values on `.hero` (see globals.css). HeroDag reads those tokens from
 * the computed style, so the canvas graph renders in its dark-mode appearance
 * with no raw hex in the component. The wordmark is forced to its dark form
 * (`mode="dark"`) so it reads bone-on-petrol regardless of the page theme.
 *
 * The wordmark wrapper is decorative here: TopNav carries the brand
 * announcement for assistive tech, so the page keeps exactly two labeled marks.
 *
 * Server Component; HeroDag is the client boundary ('use client' in its own
 * file). `.hero` is a flex row that stretches the grid to the full panel height
 * so the DAG fills the band; the text column centers its content vertically.
 */
export function Hero() {
  return (
    <section id="hero" className="hero" aria-labelledby="hero-positioning">
      <div className="hero-grain" aria-hidden />
      <div className="hero-inner">
        <div className="hero-text">
          <span className="hero-wordmark" aria-hidden>
            <Wordmark height={64} band="bg" mode="dark" />
          </span>
          <p className="hero-eyebrow mono">nanisoft · the living map</p>
          <h1 id="hero-positioning" className="hero-h1">
            Digital <em>twin</em> of the IT estate.
          </h1>
          <p className="hero-sub">
            See how your systems connect and actually work. Start with access
            traversal, then ask the twin anything.
          </p>
        </div>
        <div className="hero-canvas">
          <HeroDag />
        </div>
      </div>
      <style>{`
        .hero {
          position: relative;
          display: flex;
          align-items: stretch;
          min-height: min(88vh, 860px);
          padding: 96px 24px 40px;
          background: var(--color-bg);
          color: var(--color-text);
          overflow: hidden;
        }
        /* Bone-dot grain at 5% over petrol, like the identity style tile. */
        .hero-grain {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.05;
          background-image: radial-gradient(var(--color-text) .5px, transparent .5px);
          background-size: 3px 3px;
        }
        .hero-inner {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
          gap: clamp(32px, 5vw, 72px);
          align-items: stretch;
        }
        .hero-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }
        .hero-wordmark { display: inline-flex; height: 64px; }
        .hero-wordmark .wordmark { height: 64px; }
        .hero-eyebrow {
          margin: 18px 0 0;
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
        .hero-h1 {
          margin: 14px 0 0;
          font-size: clamp(34px, 5vw, 56px);
          line-height: 1.06;
          font-weight: 700;
          letter-spacing: -0.015em;
          max-width: 14ch;
        }
        /* Emphasis is italic of the same family (SPEC §2) — never jade, which
           is reserved for the live/active wavefront only. */
        .hero-h1 em { font-style: italic; }
        .hero-sub {
          margin: 22px 0 0;
          max-width: 52ch;
          font-size: clamp(15px, 1.6vw, 19px);
          color: var(--color-text-muted);
        }
        .hero-canvas {
          position: relative;
          z-index: 0;
          min-width: 0;
        }

        /* Narrow screens: stack text above the DAG. The wordmark !important
           beats Wordmark's inline height, as in the old layout. */
        @media (max-width: 719px) {
          .hero { padding-top: 72px; }
          .hero-inner {
            grid-template-columns: 1fr;
            gap: clamp(24px, 5vh, 44px);
          }
          .hero-text { justify-content: flex-start; }
          .hero-canvas { min-height: clamp(360px, 50vh, 520px); }
          .hero-wordmark { height: 44px !important; }
          .hero-wordmark .wordmark { height: 44px !important; }
        }
      `}</style>
    </section>
  );
}