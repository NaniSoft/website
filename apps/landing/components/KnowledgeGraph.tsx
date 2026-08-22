'use client';

import { useMemo, useState } from 'react';
import { Segmented, Input, Tag, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { KGListView } from './KGListView';
import { KGFilteredCanvas } from './KGFilteredCanvas';
import { NodeInspector } from './NodeInspector';
import { graphData } from '@/lib/graph-data';
import type { EntityType, GraphNode } from '@/lib/types';

const FILTERS: Array<{ key: 'All' | EntityType; label: string }> = [
  { key: 'All', label: 'All' },
  { key: 'User', label: 'Users' },
  { key: 'Service', label: 'Services' },
  { key: 'DataAsset', label: 'Data' },
  { key: 'Policy', label: 'Policies' },
  { key: 'Event', label: 'Events' },
  { key: 'Identity', label: 'Identity' },
];

export function KnowledgeGraph() {
  const [filter, setFilter] = useState<'All' | EntityType>('All');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'graph' | 'list'>('graph');
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const filteredData = useMemo(() => {
    const nodes = graphData.nodes
      .filter((n) => filter === 'All' || n.type === filter)
      .filter((n) => !search || n.label.toLowerCase().includes(search.toLowerCase()));
    const ids = new Set(nodes.map((n) => n.id));
    const edges = graphData.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    return { nodes, edges };
  }, [filter, search]);

  return (
    <section id="graph" style={{ padding: '96px 24px', background: 'var(--color-bg-elev)', borderBlock: '1px solid var(--color-border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 12px' }}>Explore the live graph.</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 24 }}>
          Pan, zoom, filter, and inspect any entity. A text list view is available for screen readers and keyboard users.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search entities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
            aria-label="Search entities"
          />
          <Space wrap>
            {FILTERS.map((f) => (
              <Tag.CheckableTag
                key={f.key}
                checked={filter === f.key}
                onChange={() => setFilter(f.key)}
              >
                {f.label}
              </Tag.CheckableTag>
            ))}
          </Space>
          <div style={{ marginLeft: 'auto' }}>
            <Segmented
              value={view}
              onChange={(v) => setView(v as 'graph' | 'list')}
              options={[{ label: 'Graph', value: 'graph' }, { label: 'List', value: 'list' }]}
              aria-label="View mode"
            />
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'var(--color-bg)',
            minHeight: 480,
          }}
        >
          {view === 'graph' ? (
            <KGFilteredCanvas
              nodes={filteredData.nodes}
              edges={filteredData.edges}
              onNodeClick={setSelected}
            />
          ) : (
            <div style={{ padding: 16 }}>
              <KGListView onSelect={setSelected} />
            </div>
          )}
        </div>
      </div>
      <NodeInspector node={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
