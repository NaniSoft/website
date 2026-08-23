'use client';

import { useState } from 'react';
import { color, font } from '@nanisoft/identity';
import { usePlayground, STEPS } from '../_store/usePlayground';

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
          <button style={primary} onClick={pause}>⏸ Pause</button>
        ) : (
          <button style={atEnd ? disabled : primary} onClick={run} disabled={atEnd}>▶ Run playbook</button>
        )}
        <button style={atEnd ? disabled : btn} onClick={step} disabled={atEnd}>Step →</button>
        <button style={btn} onClick={reset}>Reset</button>
        <button style={btn} onClick={onExport}>Export state</button>
        <button style={btn} onClick={onImport}>Import state</button>
      </div>
      {ioOpen && (
        <>
          <textarea
            value={ioText}
            onChange={(e) => setIoText(e.target.value)}
            placeholder="paste exported JSON here"
            style={{
              width: '100%',
              height: 64,
              fontFamily: font.data,
              fontSize: 10,
              background: 'var(--color-bg-sunken)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: 8,
            }}
          />
          {ioMsg && <div style={{ fontFamily: font.data, fontSize: 11, color: 'var(--color-text-muted)' }}>{ioMsg}</div>}
        </>
      )}
    </div>
  );
}