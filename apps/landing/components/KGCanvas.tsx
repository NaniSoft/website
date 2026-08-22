'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from './theme/ThemeProvider';
import { graphData } from '@/lib/graph-data';
import type { GraphNode } from '@/lib/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface Props {
  height?: number;
  highlightNodeId?: string;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
}

const TYPE_COLOR: Record<GraphNode['type'], string> = {
  User: '#22D3EE',
  Service: '#3B82F6',
  DataAsset: '#8B5CF6',
  Policy: '#F59E0B',
  Event: '#8A98B0',
  Identity: '#EC4899',
};

// Canvas APIs don't resolve CSS custom properties. Use the resolved dark-mode
// accent value directly (matches `--color-accent` in `[data-theme='dark']`).
const LINK_HOT_COLOR = '#22D3EE';

// react-force-graph's prop types use LinkObject<{}, {}>/NodeObject<{}> in contravariant position,
// which TypeScript cannot structurally accept a function typed against our GraphNode. The runtime
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
  onNodeHover?: (node: GraphNode | null) => void;
  cooldownTicks?: number;
  nodeCanvasObjectMode?: () => 'after' | 'before' | 'replace';
  nodeCanvasObject?: (
    node: GraphNode & { x?: number; y?: number },
    ctx: CanvasRenderingContext2D,
    globalScale: number,
  ) => void;
}>;

export function KGCanvas({ height = 380, highlightNodeId, onNodeClick, onNodeHover }: Props) {
  const { resolved } = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    // Convert to react-force-graph's expected shape (nodes need x/y, set by the lib on first run)
    return {
      nodes: graphData.nodes.map((n) => ({ ...n })),
      links: graphData.edges.map((e0) => ({ source: e0.source, target: e0.target, relation: e0.relation, hot: e0.hot })),
    };
  }, []);

  return (
    <div ref={wrapRef} style={{ width: '100%', height, position: 'relative', background: 'var(--color-bg-sunken)' }}>
      <ForceGraph2DTyped
        graphData={data}
        width={width}
        height={height}
        backgroundColor="transparent"
        linkColor={(link) => (link.hot ? LINK_HOT_COLOR : 'rgba(120,140,180,0.35)')}
        linkWidth={(link) => (link.hot ? 1.5 : 0.6)}
        nodeRelSize={5}
        nodeColor={(node) => TYPE_COLOR[node.type]}
        nodeLabel={(node) => `${node.label} (${node.type})`}
        onNodeClick={(node) => onNodeClick?.(node)}
        onNodeHover={(node) => onNodeHover?.(node ?? null)}
        cooldownTicks={120}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          if (node.x == null || node.y == null) return;
          if (node.hot || node.id === highlightNodeId) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = `${TYPE_COLOR[node.type]}33`;
            ctx.fill();
          }
          if (globalScale > 1.5) {
            ctx.font = `${10 / globalScale}px Inter, sans-serif`;
            ctx.fillStyle = resolved === 'dark' ? '#E6ECF5' : '#0B1726';
            ctx.fillText(node.label, node.x + 6, node.y + 3);
          }
        }}
      />
    </div>
  );
}
