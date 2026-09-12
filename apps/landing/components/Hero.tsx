import { HeroDag } from './hero/HeroDag';

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
 * with no raw hex in the component.
 *
 * The hero carries no wordmark of its own: the sticky nav already renders the
 * brand mark directly above the panel, and DESIGN.md documents this panel as
 * opening on the mono eyebrow ("nanisoft · the living twin") over the display
 * statement — repeating "nanisoft" a third time in the first viewport read as
 * a stamped label, not a composition.
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
          <p className="hero-eyebrow mono">nanisoft · the living twin</p>
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
          padding: 96px 24px 48px;
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
        .hero-eyebrow {
          margin: 16px 0 0;
          font-size: 11px;
          letter-spacing: var(--tracking-upper);
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
        .hero-h1 {
          margin: 16px 0 0;
          font-size: clamp(34px, 5vw, 56px);
          line-height: var(--lh-tight);
          font-weight: 700;
          letter-spacing: var(--tracking-display);
          max-width: 14ch;
        }
        /* Emphasis is italic of the same family (SPEC §2) — never jade, which
           is reserved for the live/active wavefront only. */
        .hero-h1 em { font-style: italic; }
        .hero-sub {
          margin: 24px 0 0;
          max-width: 52ch;
          /* Named stops only: the lead ramps --text-base → --text-md. */
          font-size: clamp(var(--text-base), 1.6vw, var(--text-md));
          color: var(--color-text-muted);
        }
        .hero-canvas {
          position: relative;
          z-index: 0;
          min-width: 0;
        }

        /* Narrow screens: stack text above the DAG. */
        @media (max-width: 719px) {
          .hero { padding-top: 72px; }
          .hero-inner {
            grid-template-columns: 1fr;
            gap: clamp(24px, 5vh, 44px);
          }
          .hero-text { justify-content: flex-start; }
          .hero-canvas { min-height: clamp(360px, 50vh, 520px); }
        }
      `}</style>
    </section>
  );
}
