'use client';

import { Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { graphData } from '@/lib/graph-data';
import type { GraphNode } from '@/lib/types';

const TYPE_COLORS: Record<GraphNode['type'], string> = {
  User: 'cyan',
  Service: 'blue',
  DataAsset: 'purple',
  Policy: 'gold',
  Event: 'default',
  Identity: 'magenta',
};

export function KGListView({ onSelect }: { onSelect: (n: GraphNode) => void }) {
  const columns: TableProps<GraphNode>['columns'] = [
    { title: 'Label', dataIndex: 'label', key: 'label', sorter: (a, b) => a.label.localeCompare(b.label) },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: (Object.keys(TYPE_COLORS) as GraphNode['type'][]).map((t) => ({ text: t, value: t })),
      onFilter: (val, rec) => rec.type === val,
      render: (t: GraphNode['type']) => <Tag color={TYPE_COLORS[t]}>{t}</Tag>,
    },
    { title: 'Description', dataIndex: 'description', key: 'description' },
  ];
  return (
    <Table<GraphNode>
      rowKey="id"
      columns={columns}
      dataSource={graphData.nodes}
      pagination={{ pageSize: 12 }}
      onRow={(rec) => ({ onClick: () => onSelect(rec), style: { cursor: 'pointer' } })}
      size="medium"
    />
  );
}
