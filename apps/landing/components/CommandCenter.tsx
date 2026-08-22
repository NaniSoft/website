'use client';

import { useState } from 'react';
import { Card, Button, Tooltip } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ReloadOutlined, FilterOutlined, ExportOutlined } from '@ant-design/icons';
import { StatStrip } from './StatStrip';
import { KGCanvas } from './KGCanvas';
import { NodeInspector } from './NodeInspector';
import { ChatPanel } from './ChatPanel';
import { graphData } from '@/lib/graph-data';
import type { GraphNode } from '@/lib/types';

const HERO_STATS = [
  { label: 'Entities', value: '12.4M', delta: 1.2, series: [12.0, 12.1, 12.2, 12.3, 12.4] },
  { label: 'Events/sec', value: '2,140', delta: 3.8, series: [2050, 2080, 2090, 2110, 2140] },
  { label: 'Policies', value: '1,287', delta: 0.4, series: [1280, 1281, 1284, 1286, 1287] },
  { label: 'Active queries', value: '34', delta: -2.0, series: [38, 36, 35, 34, 34] },
];

// Pre-pick a node for the static right rail (spec §5)
const SAMPLE = graphData.nodes.find((n) => n.label === 'Sarah Chen') ?? graphData.nodes[0];

export function CommandCenter() {
  // Start with no click-selected node so the full inspector Drawer stays closed
  // until the user actually clicks a node. The right-rail preview still defaults
  // to SAMPLE below (spec §5: "no click required for hero").
  const [selected, setSelected] = useState<GraphNode | null>(null);
  // Right-rail hover preview (spec §5: "no click required for hero")
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const preview = hovered ?? SAMPLE;

  return (
    <Card
      variant="outlined"
      style={{
        background: 'var(--color-bg-elev)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 16px 48px rgba(10,16,32,0.18)',
        borderRadius: 16,
        overflow: 'hidden',
        padding: 0,
      }}
      styles={{ body: { padding: 0 } }}
    >
      <StatStrip stats={HERO_STATS} />
      <div className="command-center-canvas-row" style={{ display: 'flex', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <KGCanvas
            height={380}
            highlightNodeId={selected?.id ?? preview?.id}
            onNodeClick={setSelected}
            onNodeHover={setHovered}
          />
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4, background: 'var(--color-bg-elev)', padding: 4, borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <Tooltip title="Zoom in"><Button type="text" icon={<ZoomInOutlined />} size="small" /></Tooltip>
            <Tooltip title="Zoom out"><Button type="text" icon={<ZoomOutOutlined />} size="small" /></Tooltip>
            <Tooltip title="Reset"><Button type="text" icon={<ReloadOutlined />} size="small" /></Tooltip>
            <Tooltip title="Filter"><Button type="text" icon={<FilterOutlined />} size="small" /></Tooltip>
            <Tooltip title="Export"><Button type="text" icon={<ExportOutlined />} size="small" /></Tooltip>
          </div>
        </div>
        <NodeInspector node={preview} onClose={() => setHovered(null)} compact />
      </div>
      <ChatPanel />
      {/* Full Drawer path remains for the §6 interactive Knowledge Graph; here it shows the click-selected node. */}
      <NodeInspector node={selected} onClose={() => setSelected(null)} />
    </Card>
  );
}
