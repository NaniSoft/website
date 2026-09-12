'use client';

import { font } from '@nanisoft/identity';
import { setThemeMode, useThemeMode, type ThemeMode } from './theme';

/**
 * The playground's theme toggle — a compact plain-button segmented control in
 * the chrome (the playground has no antd), mirroring the landing's ThemeToggle
 * accessible-labeling approach: one group named "Theme mode" with per-option
 * accessible names Light / System / Dark. Persists to the SAME storage key as
 * the landing ('nanisoft-theme'), so the two apps share the stored mode.
 * Colors are semantic vars from app/globals.css — correct in both modes.
 */

const OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeToggle() {
  const mode = useThemeMode();
  return (
    <div
      role="group"
      aria-label="Theme mode"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--color-border)',
        borderRadius: 9999,
        overflow: 'hidden',
      }}
    >
      {OPTIONS.map((o) => {
        const active = o.value === mode;
        return (
          <button
            key={o.value}
            type="button"
            aria-label={o.label}
            aria-pressed={active}
            onClick={() => setThemeMode(o.value)}
            style={{
              fontFamily: font.data,
              fontSize: 11,
              lineHeight: 1,
              // Header chrome carries the 44px touch floor unconditionally —
              // same treatment the blog bar gives its theme toggle.
              minWidth: 44,
              minHeight: 44,
              padding: '0 10px',
              cursor: 'pointer',
              border: 'none',
              background: active ? 'var(--color-primary)' : 'transparent',
              color: active ? 'var(--color-on-primary)' : 'var(--color-text-muted)',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
