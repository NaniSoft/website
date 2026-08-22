'use client';

import { Statistic, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface Stat {
  label: string;
  value: string;
  delta: number; // signed percentage
  series: number[];
}

interface Props {
  stats: Stat[];
}

function deltaTag(delta: number) {
  const positive = delta >= 0;
  return (
    <Tag color={positive ? 'success' : 'error'} style={{ marginInlineStart: 8 }}>
      {positive ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(delta)}%
    </Tag>
  );
}

export function StatStrip({ stats }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: 16,
        padding: 16,
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {stats.map((s) => (
        <div key={s.label}>
          <Statistic
            title={<span style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>}
            value={s.value}
            styles={{ content: { fontSize: 22, fontWeight: 600 } }}
          />
          <div style={{ display: 'flex', alignItems: 'center', marginTop: -4 }}>
            {deltaTag(s.delta)}
          </div>
        </div>
      ))}
    </div>
  );
}
