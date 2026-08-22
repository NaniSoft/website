'use client';

import { Handle, Position } from '@xyflow/react';
import type { Component } from '@nanisoft/architecture';
import { color, font, radius, surface } from '@nanisoft/identity';
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

function borderFor(status: NodeStatus): string {
  if (status === 'active') return `1px solid ${color.jade}`;
  if (status === 'done') return `1px solid ${color.teal}`;
  return `1px solid ${surface.light.border}`;
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
  const className = data.open ? 'spine-node-open' : data.beckon ? 'spine-node-beckon' : undefined;
  return (
    <div
      className={className}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Open ${c.codename} mock` : undefined}
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
        background: surface.light.elevated,
        border: borderFor(status),
        padding: '8px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontFamily: font.data,
        color: surface.light.text,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{c.codename}</div>
      {sub && (
        <div style={{ fontSize: 11, color: surface.light.textMuted, marginTop: 2, lineHeight: 1.2 }}>
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