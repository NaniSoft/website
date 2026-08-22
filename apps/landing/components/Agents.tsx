'use client';

import { useState } from 'react';
import { Segmented, Card, Tag, Button, Avatar } from 'antd';
import { RobotOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { CHAT_TRANSCRIPTS } from '@/lib/chat-transcripts';
import { KGFilteredCanvas } from './KGFilteredCanvas';
import { graphData } from '@/lib/graph-data';
import type { GraphNode } from '@/lib/types';

const ARTIFACT_TITLES: Record<string, string> = {
  'graph-mini': 'Access path',
  'graph-blast': 'Blast radius',
  'timeline': 'Compliance timeline',
};

function nodesForQuestion(qid: string): GraphNode[] {
  if (qid === 'sensitive-data') {
    const want = ['Sarah Chen', 'etl-pipeline', 'finance-prod/q3-2026/model.xlsx', 'FIN-PII-007'];
    return graphData.nodes.filter((n) => want.includes(n.label));
  }
  if (qid === 'blast-radius') {
    const want = ['okta-prod', 'customer-pii/', 'finance-prod/', 'hr-salary/'];
    return graphData.nodes.filter((n) => want.includes(n.label));
  }
  if (qid === 'compliance-at-t') {
    const want = ['svc-etl', 'customer-pii/', 'FIN-PII-007'];
    return graphData.nodes.filter((n) => want.includes(n.label));
  }
  return graphData.nodes.slice(0, 4);
}

function edgesForQuestion(qid: string, ids: Set<string>) {
  return graphData.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
}

export function Agents() {
  const [qid, setQid] = useState(CHAT_TRANSCRIPTS[0].id);
  const current = CHAT_TRANSCRIPTS.find((t) => t.id === qid)!;
  const nodes = nodesForQuestion(qid);
  const ids = new Set(nodes.map((n) => n.id));
  const edges = edgesForQuestion(qid, ids);

  return (
    <section id="agents" style={{ padding: '96px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 40, fontWeight: 700, margin: '0 0 12px' }}>Ask in plain English. Get cited answers.</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 18, maxWidth: 640, marginBottom: 24 }}>
        Sentinel AI agents traverse the knowledge graph and return evidence, not just text.
      </p>

      <Segmented
        value={qid}
        onChange={(v) => setQid(v as string)}
        options={CHAT_TRANSCRIPTS.map((t) => ({ label: t.id === 'sensitive-data' ? 'Sensitive data' : t.id === 'blast-radius' ? 'Blast radius' : 'Compliance at T', value: t.id }))}
        style={{ marginBottom: 24 }}
        aria-label="Pick a sample question"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 }} className="agents-grid">
        <Card variant="outlined" style={{ background: 'var(--color-bg-elev)' }} styles={{ body: { padding: 16 } }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {current.exchange.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'agent' && <Avatar size={28} icon={<RobotOutlined />} style={{ background: 'var(--color-primary)' }} />}
                <div
                  style={{
                    background: m.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-sunken)',
                    color: m.role === 'user' ? '#fff' : 'var(--color-text)',
                    padding: '10px 14px',
                    borderRadius: 12,
                    maxWidth: '85%',
                    fontSize: 15,
                  }}
                >
                  {m.text}
                </div>
                {m.role === 'user' && <Avatar size={28} icon={<UserOutlined />} />}
              </div>
            ))}
          </div>
        </Card>

        <Card
          variant="outlined"
          style={{ background: 'var(--color-bg-elev)' }}
          title={
            <span>
              {ARTIFACT_TITLES[current.exchange[1].artifact ?? 'graph-mini']} <Tag color="cyan">preview</Tag>
            </span>
          }
          extra={<Button type="link" href="#graph">View in graph <ArrowRightOutlined /></Button>}
        >
          <div style={{ height: 320, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <KGFilteredCanvas nodes={nodes} edges={edges} onNodeClick={() => {}} />
          </div>
          <ul style={{ marginTop: 16, paddingLeft: 18, color: 'var(--color-text-muted)' }}>
            {current.id === 'sensitive-data' && (<>
              <li>1 confidential data asset located.</li>
              <li>4 unique identities accessed in the last 30 days.</li>
              <li>1 deprecated credential detected and flagged.</li>
            </>)}
            {current.id === 'blast-radius' && (<>
              <li>18 reachable DataAssets across 6 buckets.</li>
              <li>3 trust boundaries crossed.</li>
              <li>Remediation: rotate <code>okta-prod</code> and audit downstream grants.</li>
            </>)}
            {current.id === 'compliance-at-t' && (<>
              <li>Policy version at time T: FIN-PII-007 v4.</li>
              <li>Access event: <code>mfa=false</code> at 02:00:11 UTC.</li>
              <li>Verdict: non-compliant under v4; would have been compliant under v3.</li>
            </>)}
          </ul>
        </Card>
      </div>
      <style>{`@media (max-width: 900px) { .agents-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
