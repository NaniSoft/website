'use client';

import { Handle, Position } from '@xyflow/react';
import type { Component } from '@nanisoft/architecture';
import { color, font, radius } from '@nanisoft/identity';
import { SOURCE_HANDLE, TARGET_HANDLE, type HandleSide } from './spine-graph';

export const CHIP_W = 180;
export const CHIP_H = 64;

export type NodeStatus = 'idle' | 'active' | 'done';

const SIDES: HandleSide[] = ['top', 'right', 'bottom', 'left'];
const POS: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};
const HANDLE_STYLE = { opacity: 0, width: 1, height: 1 } as const;

function realNameLine(c: Component): string | null {
  if (c.kind === 'custom') return null;
  if (c.realName && c.realName !== c.codename) return c.realName;
  return null;
}

function surfaceFor(status: NodeStatus): { background: string; border: string; text: string; subText: string } {
  if (status === 'active') {
    // The live node: jade fill + petrol text (role.onAccent, ~4.9:1) — the
    // sanctioned accent pairing. A 1px jade BORDER was the old treatment, but
    // jade-on-elev sits at 2.87:1 (WCAG 1.4.11 fail) and was color-only.
    return {
      background: color.jade,
      border: `1px solid ${color.jade}`,
      text: 'var(--color-on-accent)',
      subText: 'var(--color-on-accent)',
    };
  }
  if (status === 'done') {
    // Teal border = non-text mark via --viz-secondary: the raw teal constant
    // sinks to 2.81:1 on petrolMid in dark mode (1.4.11 fail); the viz token
    // lifts it to tealBright there while staying the same teal in light.
    return { background: 'var(--color-bg-elev)', border: '1px solid var(--viz-secondary)', text: 'var(--color-text)', subText: 'var(--color-text-muted)' };
  }
  // Idle: a muted-ink hairline — the old --color-border (boneSunken on elev,
  // 1.2:1) made the nodes read as floating text instead of a map.
  return { background: 'var(--color-bg-elev)', border: '1px solid var(--color-text-muted)', text: 'var(--color-text)', subText: 'var(--color-text-muted)' };
}

export function NodeChip({
  data,
}: {
  data: {
    component: Component;
    status: NodeStatus;
    /** This node is the active step's beckoning tool (ripple). */
    beckon: boolean;
    /** This node's overlay is currently open (no ripple). */
    open: boolean;
    /** Open this node's overlay (set by Spine from the store). */
    onOpenTool: (id: string) => void;
  };
}) {
  const c = data.component;
  const sub = realNameLine(c);
  const status = data.status;
  const clickable = c.fullUi;
  const surface = surfaceFor(status);
  const className = data.open ? 'spine-node-open' : data.beckon ? 'spine-node-beckon' : undefined;
  return (
    <div
      className={className}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Open ${c.codename} mock` : undefined}
      // The live node announces itself, not just by the jade fill — assistive
      // tech traversing the graph gets the active state without color.
      aria-current={status === 'active' ? 'true' : undefined}
      onClick={clickable ? () => data.onOpenTool(c.id) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                data.onOpenTool(c.id);
              }
            }
          : undefined
      }
      style={{
        width: CHIP_W,
        minHeight: CHIP_H,
        borderRadius: radius.inner,
        background: surface.background,
        border: surface.border,
        padding: '8px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontFamily: font.data,
        color: surface.text,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{c.codename}</div>
      {sub && (
        <div style={{ fontSize: 11, color: surface.subText, marginTop: 2, lineHeight: 1.2 }}>
          {sub}
        </div>
      )}
      {SIDES.map((side) => (
        <Handle key={`s-${side}`} id={SOURCE_HANDLE[side]} type="source" position={POS[side]} style={HANDLE_STYLE} isConnectable={false} />
      ))}
      {SIDES.map((side) => (
        <Handle key={`t-${side}`} id={TARGET_HANDLE[side]} type="target" position={POS[side]} style={HANDLE_STYLE} isConnectable={false} />
      ))}
    </div>
  );
}