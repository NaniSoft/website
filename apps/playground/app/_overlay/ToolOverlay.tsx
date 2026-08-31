'use client';

import { useEffect, useRef } from 'react';
import { font, radius } from '@nanisoft/identity';
import { COMPONENT_BY_ID, MOCK_TOOL_BY_COMPONENT } from '@nanisoft/architecture';
import { usePlayground } from '../_store/usePlayground';
import { TOOL_CONTENT } from './tool-content';

/**
 * The uniform mocked-tool overlay chrome (SPEC §4.8): title bar = codename +
 * real-name subline + a "mocked" badge + close; body = the tool's content from
 * the TOOL_CONTENT registry. Structured-echo fidelity — the real tool's info
 * shape in nanisoft tokens, not its colors/fonts/icons. Split-pane (not modal),
 * so the dialog focuses itself + closes on Esc but does not trap Tab.
 */
export function ToolOverlay() {
  const overlay = usePlayground((s) => s.overlay);
  const closeTool = usePlayground((s) => s.closeTool);
  const ref = useRef<HTMLDivElement>(null);
  // Where focus came from when the overlay opened — restored on close so a
  // keyboard user isn't dropped at <body> among 19 chips (they keep their place).
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!overlay) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTool();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      // The chip that opened the overlay survives close (the graph never
      // unmounts) — put the focus back where the journey started.
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [overlay, closeTool]);

  if (!overlay) return null;
  const component = COMPONENT_BY_ID[overlay.componentId];
  const tool = MOCK_TOOL_BY_COMPONENT[overlay.componentId];
  const Content = TOOL_CONTENT[overlay.componentId];
  if (!component || !tool || !Content) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={component.codename}
      tabIndex={-1}
      style={{
        height: '100%',
        boxSizing: 'border-box',
        background: 'var(--color-bg-elev)',
        color: 'var(--color-text)',
        fontFamily: font.voice,
        display: 'flex',
        flexDirection: 'column',
        outline: 'none',
      }}
    >
      {/* title bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{component.codename}</span>
          {component.realName && (
            <span style={{ fontFamily: font.data, fontSize: 11, color: 'var(--color-text-muted)' }}>
              {component.realName}
            </span>
          )}
        </div>
        <span
          style={{
            fontFamily: font.data,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            borderRadius: 9999,
            padding: '2px 8px',
          }}
        >
          mocked
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={closeTool}
          aria-label="Close overlay"
          style={{
            fontFamily: font.data,
            fontSize: 14,
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text)',
            borderRadius: radius.inner,
            padding: '2px 9px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Content />
      </div>
    </div>
  );
}