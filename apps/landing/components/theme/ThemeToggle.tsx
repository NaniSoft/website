'use client';

import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { Segmented } from 'antd';
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';
import { easing } from '@nanisoft/identity';
import { useTheme } from './ThemeProvider';

/** View Transitions API, feature-detected — the typed shape is minimal. */
type DocumentWithVT = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

/**
 * The theme toggle. Switching mode runs the resurvey wipe: the new chart is
 * revealed in a circle expanding from the pointer — the map is redrawn, not
 * swapped. Plumbing:
 *  - startViewTransition snapshots the old state, flushSync commits the theme
 *    state (and its data-theme effect) inside the transition's update, and the
 *    clip-path animation expands the new snapshot from the click point.
 *  - The brand easing drives the wipe, per the single-curve motion law.
 *  - Guarded: no View Transitions support, or prefers-reduced-motion, falls
 *    back to the plain instant swap. (globals.css strips the default
 *    cross-fade so the circle is the entire effect.)
 *  - Segmented's onChange carries no event, so the pointer origin is captured
 *    on pointerdown at the control and read by the handler that follows.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const origin = useRef<{ x: number; y: number } | null>(null);

  const applyMode = (next: 'light' | 'dark' | 'system') => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const doc = document as DocumentWithVT;
    const point = origin.current;
    if (!doc.startViewTransition || reduce || !point) {
      setTheme(next);
      return;
    }
    const { x, y } = point;
    // Reach the farthest corner so the circle always covers the viewport.
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 480, easing, pseudoElement: '::view-transition-new(root)' },
        );
      })
      .catch(() => {
        /* The transition was skipped (tab hidden, another started) — nothing to animate. */
      });
  };

  return (
    <div
      onPointerDown={(e) => {
        origin.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <Segmented
        size="small"
        value={theme}
        onChange={(v) => applyMode(v as 'light' | 'dark' | 'system')}
        options={[
          { label: <SunOutlined aria-label="Light" />, value: 'light' },
          { label: <DesktopOutlined aria-label="System" />, value: 'system' },
          { label: <MoonOutlined aria-label="Dark" />, value: 'dark' },
        ]}
        aria-label="Theme mode"
      />
    </div>
  );
}
