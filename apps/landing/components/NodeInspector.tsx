'use client';

import { useSyncExternalStore } from 'react';
import { Drawer, Descriptions, Tag, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { GraphNode } from '@/lib/types';

interface Props {
  node: GraphNode | null;
  onClose: () => void;
  /** Render a compact, inline panel for the Hero right rail (no Drawer). */
  compact?: boolean;
}

const TYPE_COLOR: Record<GraphNode['type'], string> = {
  User: 'cyan',
  Service: 'blue',
  DataAsset: 'purple',
  Policy: 'gold',
  Event: 'default',
  Identity: 'magenta',
};

// Drawer renders into a portal, which has no DOM target during SSR. Use
// useSyncExternalStore to get an SSR-safe "are we on the client" flag: it
// returns false during SSR and the first hydration render (so the portal-based
// Drawer never mounts on the server — avoiding antd's "Drawer with open in
// SSR" warning) and true thereafter. The compact inline panel uses no portal
// and is safe to server-render regardless.
const subscribeNoop = () => () => {};
const getMounted = () => true;
const getMountedServer = () => false;

export function NodeInspector({ node, onClose, compact = false }: Props) {
  const mounted = useSyncExternalStore(subscribeNoop, getMounted, getMountedServer);

  if (compact) {
    return (
      <aside
        aria-label="Node inspector preview"
        data-testid="node-inspector-preview"
        data-node-id={node?.id ?? ''}
        className="node-inspector-preview-rail"
        style={{
          width: 160,
          flexShrink: 0,
          padding: 12,
          borderLeft: '1px solid var(--color-border)',
          background: 'var(--color-bg-elev)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          fontSize: 12,
        }}
      >
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-muted)' }}>
          Inspector
        </div>
        {node ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span data-testid="preview-name" style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                {node.label}
              </span>
            </div>
            <Tag data-testid="preview-type" color={TYPE_COLOR[node.type]} style={{ alignSelf: 'flex-start', margin: 0 }}>
              {node.type}
            </Tag>
            <p data-testid="preview-description" style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 11, lineHeight: 1.4 }}>
              {node.description}
            </p>
            <div style={{ display: 'grid', gap: 4, marginTop: 4 }}>
              {node.attrs.slice(0, 3).map(([k, v]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 6, alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</span>
                  <span className="mono" style={{ color: 'var(--color-text)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Hover a node to preview</div>
        )}
        <Button size="small" block onClick={onClose} style={{ marginTop: 'auto' }}>Clear</Button>
      </aside>
    );
  }

  if (!mounted) return null;

  return (
    <Drawer
      title={node ? `${node.label} (${node.type})` : 'Inspector'}
      open={!!node}
      onClose={onClose}
      size={360}
      closeIcon={<CloseOutlined />}
      extra={node ? <Tag color={TYPE_COLOR[node.type]}>{node.type}</Tag> : null}
    >
      {node && (
        <>
          <p style={{ color: 'var(--color-text-muted)' }}>{node.description}</p>
          <Descriptions size="small" column={1} bordered>
            {node.attrs.map(([k, v]) => (
              <Descriptions.Item key={k} label={k}><span className="mono">{v}</span></Descriptions.Item>
            ))}
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" block>Open full record</Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
