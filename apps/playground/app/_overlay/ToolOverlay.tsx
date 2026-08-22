'use client';

import { useEffect, useRef } from 'react';
import { font, radius, surface } from '@nanisoft/identity';
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

  useEffect(() => {
    if (!overlay) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTool();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
        background: surface.light.elevated,
        color: surface.light.text,
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
          borderBottom: `1px solid ${surface.light.border}`,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{component.codename}</span>
          {component.realName && (
            <span style={{ fontFamily: font.data, fontSize: 11, color: surface.light.textMuted }}>
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
            color: surface.light.textMuted,
            border: `1px solid ${surface.light.border}`,
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
            border: `1px solid ${surface.light.border}`,
            background: 'transparent',
            color: surface.light.text,
            borderRadius: 8,
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