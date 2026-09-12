'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { APP_NAME, ARCHITECTURE_VERSION } from '@nanisoft/architecture';
import { font, IDENTITY_VERSION } from '@nanisoft/identity';
import { ThemeToggle } from './_theme/ThemeToggle';
import { Narrative } from './_spine/Narrative';
import { Controls } from './_controls/Controls';
import { Inspector } from './_inspector/Inspector';
import { ToolOverlay } from './_overlay/ToolOverlay';
import { STEPS, usePlayground } from './_store/usePlayground';

// ssr:false lives INSIDE this 'use client' wrapper (never in a Server Component).
const Spine = dynamic(() => import('./_spine/Spine'), {
  ssr: false,
  loading: () => <SpineSkeleton />,
});

/** The finding/climax step number (step 19, `final: true`) — the one auto-open. */
const FINDING_STEP_N = STEPS.find((s) => s.final)?.n ?? 19;

export default function PlaygroundClient() {
  const overlayOpen = usePlayground((s) => s.overlay !== null);
  const cursor = usePlayground((s) => s.state.cursor);
  const openTool = usePlayground((s) => s.openTool);

  // Leaving the playground route (e.g. /tokens) pauses auto-run — the user
  // must not return to a tour that ran without them. Module singleton: a
  // store-level cleanup would fire per-consumer; this unmount is the route one.
  useEffect(() => () => { usePlayground.getState().pause(); }, []);

  // Climax auto-open (SPEC §4.8 cross-cutting 3): Compass auto-opens at the
  // finding step — the ONE mid-run auto-open. Every other tool only beckons.
  // Fires in both auto-run and single-step (both advance `cursor` to the
  // finding step via applyStep). It opens with `auto: true`: the dialog does
  // NOT take focus (a programmatic focus steal mid-run/mid-typing) and instead
  // announces through the narrative live region. The ref guard prevents
  // re-opening after the user closes it; it resets when the cursor drops below
  // the finding step (reset / before-climax). Keyed on `cursor` (not `overlay`)
  // so closing the overlay at the finding step does not re-trigger it.
  const autoOpenedFinding = useRef(false);
  useEffect(() => {
    if (cursor === FINDING_STEP_N && !autoOpenedFinding.current) {
      if (!usePlayground.getState().overlay) openTool('compass', { auto: true });
      autoOpenedFinding.current = true;
    }
    if (cursor < FINDING_STEP_N) {
      autoOpenedFinding.current = false;
    }
  }, [cursor, openTool]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: font.voice,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          // Side gutter breathes on desktop, holds 16px on phones (clamp, not a
          // breakpoint — the gutter is fluid like the landing's sections).
          padding: '20px clamp(16px, 4vw, 32px) 12px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{APP_NAME} playground</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: 14, maxWidth: '70ch' }}>
            The digital-twin pipeline, stepped live. Run the Sensitive Product View Audit and watch the twin move through Schema → Ingestion → Transform → Investigation.
          </p>
        </div>
        {/* Wraps (not just the header): the toggle raises this cluster's
            min-content past phone widths, and an unwrappable flex row would
            widen the DOCUMENT (overflow law, e2e overflow.spec). */}
        <div style={{ display: 'flex', gap: 16, rowGap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', fontFamily: font.data, fontSize: 12, color: 'var(--color-text-muted)' }}>
          <span>arch v{ARCHITECTURE_VERSION}</span>
          <span>identity v{IDENTITY_VERSION}</span>
          {/* Nav chrome carries the 44px touch floor (blog-bar grammar):
              inline-flex + min-height, not a bare underlined word. */}
          <Link
            href="/tokens"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              padding: '0 8px',
              color: 'var(--color-text-muted)',
              textDecoration: 'underline',
            }}
          >
            tokens
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ flex: 1, padding: '0 clamp(16px, 4vw, 32px) 24px' }}>
        {/* grid + ≤980px re-flow live in globals.css (.pg-grid, .spine-card) —
            one media query owns them, no !important fights with inline styles. */}
        <div className="pg-grid">
          {/* left: spine + narrative + controls */}
          <div>
            <div className={`spine-card${overlayOpen ? ' spine-card--split' : ''}`}>
              <div className="spine-card-pane">
                <Spine />
              </div>
              {overlayOpen && (
                <div className="spine-card-overlay">
                  <ToolOverlay />
                </div>
              )}
            </div>
            <Narrative />
            <Controls />
          </div>
          {/* right: inspector */}
          <Inspector />
        </div>
      </main>

      <footer
        style={{
          padding: '12px clamp(16px, 4vw, 32px) 20px',
          fontFamily: font.data,
          fontSize: 11,
          color: 'var(--color-text-muted)',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span>Built with React Flow</span>
        <span>·</span>
        <span>19 components · 4 phases · jade = the live step, teal = done</span>
      </footer>
    </div>
  );
}

function SpineSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: font.data,
        fontSize: 13,
        color: 'var(--color-text-muted)',
        background: 'var(--color-bg)',
      }}
    >
      loading spine…
    </div>
  );
}