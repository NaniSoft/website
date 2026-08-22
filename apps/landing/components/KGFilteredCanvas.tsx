'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from './theme/ThemeProvider';
import type { GraphNode } from '@/lib/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// react-force-graph's prop types use LinkObject<{}, {}>/NodeObject<{}> in contravariant position,
// which TypeScript cannot structurally accept a function typed against our shapes. The runtime
// behavior is identical to the brief. We cast the dynamic component to a permissive FC to keep
// the call-site readable.
const ForceGraph2DTyped = ForceGraph2D as unknown as React.FC<{
  graphData: unknown;
  width?: number;
  height?: number;
  backgroundColor?: string;
  linkColor?: (link: { hot?: boolean }) => string;
  linkWidth?: (link: { hot?: boolean }) => number;
  nodeRelSize?: number;
  nodeColor?: (node: GraphNode) => string;
  nodeLabel?: (node: GraphNode) => string;
  onNodeClick?: (node: GraphNode) => void;
  cooldownTicks?: number;
  nodeCanvasObjectMode?: () => 'after' | 'before' | 'replace';
  nodeCanvasObject?: (
    node: GraphNode & { x?: number; y?: number },
    ctx: CanvasRenderingContext2D,
    globalScale: number,
  ) => void;
}>;

interface Edge { source: string; target: string; relation: string; hot?: boolean }

const TYPE_COLOR: Record<GraphNode['type'], string> = {
  User: '#22D3EE', Service: '#3B82F6', DataAsset: '#8B5CF6', Policy: '#F59E0B', Event: '#8A98B0', Identity: '#EC4899',
};

// Canvas APIs don't resolve CSS custom properties. Use the resolved dark-mode
// accent value directly (matches `--color-accent` in `[data-theme='dark']`).
const LINK_HOT_COLOR = '#22D3EE';

export function KGFilteredCanvas({ nodes, edges, onNodeClick }: { nodes: GraphNode[]; edges: Edge[]; onNodeClick: (n: GraphNode) => void }) {
  const { resolved } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => { for (const e of entries) setWidth(e.contentRect.width); });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => ({
    nodes: nodes.map((n) => ({ ...n })),
    links: edges.map((e0) => ({ source: e0.source, target: e0.target, relation: e0.relation, hot: e0.hot })),
  }), [nodes, edges]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: 560, background: 'var(--color-bg-sunken)' }}>
      <ForceGraph2DTyped
        graphData={data}
        width={width}
        height={560}
        backgroundColor="transparent"
        linkColor={(l) => (l.hot ? LINK_HOT_COLOR : 'rgba(120,140,180,0.35)')}
        linkWidth={(l) => (l.hot ? 1.5 : 0.6)}
        nodeRelSize={5}
        nodeColor={(n) => TYPE_COLOR[n.type]}
        nodeLabel={(n) => `${n.label} (${n.type})`}
        onNodeClick={(n) => onNodeClick(n)}
        cooldownTicks={120}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(n, ctx, globalScale) => {
          if (n.x == null || n.y == null) return;
          if (n.hot) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = `${TYPE_COLOR[n.type]}33`;
            ctx.fill();
          }
          if (globalScale > 1.5) {
            ctx.font = `${10 / globalScale}px Inter, sans-serif`;
            ctx.fillStyle = resolved === 'dark' ? '#E6ECF5' : '#0B1726';
            ctx.fillText(n.label, n.x + 6, n.y + 3);
          }
        }}
      />
    </div>
  );
}
