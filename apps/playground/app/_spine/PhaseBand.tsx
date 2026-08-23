'use client';

import { color, font, radius } from '@nanisoft/identity';

export type PhaseStatus = 'idle' | 'active' | 'done';

/**
 * A phase band — a labeled rectangle spanning its phase's columns, rendered as
 * a non-interactive React Flow node below the spine. `status` reflects the
 * playbook cursor: active phase = jade, done phases = teal, idle = sunken.
 * The neutral Sources band is always idle (it is not one of the 4 phases).
 * Surfaces are semantic vars (mode-aware); jade/teal stay identity constants.
 */
export function PhaseBand({ data }: { data: { name: string; width: number; subtle?: boolean; status: PhaseStatus } }) {
  const { subtle, status } = data;
  const isSources = subtle;
  const bg =
    !isSources && status === 'active' ? color.jade
    : isSources ? 'transparent'
    : 'var(--color-bg-sunken)';
  const fg =
    !isSources && status === 'active' ? 'var(--color-on-accent)'
    : !isSources && status === 'done' ? color.teal
    : 'var(--color-text-muted)';
  const border =
    !isSources && status === 'active' ? `1px solid ${color.jade}`
    : !isSources && status === 'done' ? `1px solid ${color.teal}`
    : `1px ${isSources ? 'dashed' : 'solid'} var(--color-border)`;
  return (
    <div
      style={{
        width: data.width,
        height: 40,
        borderRadius: radius.inner,
        background: bg,
        border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: font.data,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: fg,
      }}
    >
      {data.name}
    </div>
  );
}