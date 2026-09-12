'use client';

import { useEffect, useRef, useState } from 'react';
import { color, font, radius } from '@nanisoft/identity';
import { usePlayground, STEPS } from '../_store/usePlayground';

/** Drawn marks, not unicode: ⏸/▶ render at the mercy of the platform font, and
    the brand's drawn-marks practice wants one stroke weight with round caps.
    They are aria-hidden — the text label carries the accessible name. */
function PlayGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M3.75 2.6 9.4 6 3.75 9.4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M4.1 2.8v6.4M7.9 2.8v6.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Controls() {
  const running = usePlayground((s) => s.running);
  const cursor = usePlayground((s) => s.state.cursor);
  const step = usePlayground((s) => s.step);
  const run = usePlayground((s) => s.run);
  const pause = usePlayground((s) => s.pause);
  const reset = usePlayground((s) => s.reset);
  const exportJson = usePlayground((s) => s.exportJson);
  const importJson = usePlayground((s) => s.importJson);

  const [ioOpen, setIoOpen] = useState(false);
  const [ioText, setIoText] = useState('');
  const [ioMsg, setIoMsg] = useState('');

  // The io panel is a disclosure: when it opens, focus moves into the textarea
  // so a keyboard user continues from the revealed control instead of hunting
  // for it. (The panel has no close path, so there is nothing to restore.)
  const ioTextRef = useRef<HTMLTextAreaElement>(null);
  const ioWasOpen = useRef(false);
  useEffect(() => {
    if (ioOpen && !ioWasOpen.current) ioTextRef.current?.focus();
    ioWasOpen.current = ioOpen;
  }, [ioOpen]);

  const atEnd = cursor >= STEPS.length;

  const btn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-elev)',
    color: 'var(--color-text)',
    fontFamily: font.voice,
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: 9999,
  };
  // Full `border` shorthand (not `borderColor`) so the Run/Pause toggle never
  // mixes shorthand + longhand across rerenders — React errors on that diff
  // ("can lead to styling bugs"), caught by e2e spec A.
  const primary: React.CSSProperties = { ...btn, background: color.jade, color: 'var(--color-on-accent)', border: `1px solid ${color.jade}` };
  const disabled: React.CSSProperties = { ...btn, opacity: 0.4, cursor: 'not-allowed' };
  // Run complete (step 22): the tour is DONE, not live, so the control reads the
  // done state — teal wash + teal mark (the Airflow TaskBox grammar), never jade
  // (the One Pulse Rule: nothing is running). It stays actionable: replay
  // resets the lakehouse and runs the playbook again, instead of a 40%-opacity
  // dead button.
  const doneRun: React.CSSProperties = {
    ...btn,
    border: '1px solid var(--viz-secondary)',
    background: 'color-mix(in srgb, var(--viz-secondary) 12%, var(--color-bg-elev))',
    color: 'var(--color-text)',
  };
  const doneDot: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: 9999,
    background: 'var(--viz-secondary)',
    flexShrink: 0,
  };

  function onExport() {
    const json = exportJson();
    setIoText(json);
    setIoMsg('state exported — paste a new state and click Import, or copy this.');
    setIoOpen(true);
  }

  function onImport() {
    if (!ioOpen) {
      setIoText('');
      setIoMsg('paste exported JSON here, then click Import again.');
      setIoOpen(true);
      return;
    }
    const res = importJson(ioText);
    setIoMsg(res.ok ? 'imported ✓ — state replaced.' : `invalid: ${res.error}`);
  }

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {running ? (
          <button className="pg-btn" style={primary} onClick={pause}><PauseGlyph /> Pause</button>
        ) : atEnd ? (
          <button
            className="pg-btn"
            style={doneRun}
            onClick={() => { reset(); run(); }}
            aria-label="Run again — resets the lakehouse and replays the playbook"
          >
            <span aria-hidden="true" style={doneDot} />
            <PlayGlyph /> Run again
          </button>
        ) : (
          <button className="pg-btn" style={primary} onClick={run}><PlayGlyph /> Run playbook</button>
        )}
        <button className="pg-btn" style={atEnd ? disabled : btn} onClick={step} disabled={atEnd}>Step →</button>
        <button className="pg-btn" style={btn} onClick={reset}>Reset</button>
        <button className="pg-btn" style={btn} onClick={onExport}>Export state</button>
        <button className="pg-btn" style={btn} onClick={onImport}>Import state</button>
      </div>
      {ioOpen && (
        <>
          <textarea
            ref={ioTextRef}
            value={ioText}
            onChange={(e) => setIoText(e.target.value)}
            aria-label="Exported or imported state JSON"
            placeholder="paste exported JSON here"
            style={{
              width: '100%',
              height: 64,
              fontFamily: font.data,
              fontSize: 10,
              background: 'var(--color-bg-sunken)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: radius.inner,
              padding: 8,
            }}
          />
          {/* Export/import feedback, announced politely (WCAG 4.1.3). The region
              stays mounted and empty until a message lands — a region that
              appears WITH its text is not reliably announced. */}
          <div role="status" style={{ fontFamily: font.data, fontSize: 11, color: 'var(--color-text-muted)', minHeight: 14 }}>
            {ioMsg}
          </div>
        </>
      )}
    </div>
  );
}