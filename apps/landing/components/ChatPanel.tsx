'use client';

import { useState } from 'react';
import { Input, Button, Avatar, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { CHAT_TRANSCRIPTS } from '@/lib/chat-transcripts';

export function ChatPanel() {
  const [draft, setDraft] = useState('');
  const first = CHAT_TRANSCRIPTS[0];

  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg-elev)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 220,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
        <Avatar size={24} icon={<RobotOutlined />} style={{ background: 'var(--color-primary)' }} />
        <strong>Sentinel AI</strong>
        <Tag color="processing" style={{ marginLeft: 'auto' }}>Beta</Tag>
      </div>
      <div role="log" aria-live="polite" style={{ padding: 12, overflowY: 'auto', display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <div style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 12px', borderRadius: 12, maxWidth: '80%' }}>
            {first.exchange[0].text}
          </div>
          <Avatar size={24} icon={<UserOutlined />} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Avatar size={24} icon={<RobotOutlined />} style={{ background: 'var(--color-primary)' }} />
          <div style={{ background: 'var(--color-bg-sunken)', padding: '8px 12px', borderRadius: 12, maxWidth: '85%' }}>
            {first.exchange[1].text}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: 8, borderTop: '1px solid var(--color-border)' }}>
        <Input.TextArea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoSize={{ minRows: 1, maxRows: 3 }}
          placeholder="Ask a forensic question…"
        />
        <Button type="primary" icon={<SendOutlined />} aria-label="Send" />
      </div>
    </div>
  );
}
