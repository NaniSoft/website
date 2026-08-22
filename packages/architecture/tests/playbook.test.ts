import { describe, expect, it } from 'vitest';
import {
  COMPONENT_BY_ID,
  EDGES,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  beckonToolId,
  reduceToCursor,
} from '../src/index';

const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

describe('flagship structure — SPEC §4.7 (22 steps)', () => {
  it('has exactly 22 steps numbered 1..22', () => {
    expect(STEPS).toHaveLength(22);
    expect(STEPS.map((s) => s.n)).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
  });

  it('every actor is a real component id', () => {
    for (const s of STEPS) {
      expect(COMPONENT_BY_ID[s.actor], `step ${s.n} actor ${s.actor}`).toBeDefined();
    }
  });

  it('every step edge is a real EDGES pair', () => {
    const edgeSet = new Set(EDGES.map((e) => `${e.from}__${e.to}`));
    for (const s of STEPS) {
      if (s.edge) {
        const key = `${s.edge[0]}__${s.edge[1]}`;
        expect(edgeSet.has(key), `step ${s.n} edge ${key}`).toBe(true);
      }
    }
  });

  it('phases progress Schema → Ingestion → Transform → Investigation', () => {
    const phases = STEPS.map((s) => s.phase);
    expect(phases.slice(0, 4)).toEqual(['schema', 'schema', 'schema', 'schema']);
    expect(phases.slice(4, 7)).toEqual(['ingestion', 'ingestion', 'ingestion']);
    expect(phases.slice(7, 10)).toEqual(['transform', 'transform', 'transform']);
    for (const p of phases.slice(10)) expect(p).toBe('investigation');
  });
});

describe('flagship replay — SPEC §4.7 teaching state', () => {
  it('cursor 10 produces Gold 5 nodes / 4 edges (the teaching state)', () => {
    const s = reduceToCursor(STEPS, 10);
    expect(s.cursor).toBe(10);
    expect(s.gold.nodes).toHaveLength(5);
    expect(s.gold.edges).toHaveLength(4);
  });

  it('cursor 7 lands Bronze = 2 products + 2 view-logs (seed-authoritative, not 10)', () => {
    const s = reduceToCursor(STEPS, 7);
    expect(s.bronze.products).toHaveLength(2);
    expect(s.bronze.viewLogs).toHaveLength(2);
  });

  it('cursor 1 authors the SchemaRegistry hinge (Product.Sensitive: bool)', () => {
    const s = reduceToCursor(STEPS, 1);
    const sensitive = s.schemaRegistry.Product?.fields.find((f) => f.name === 'Sensitive');
    expect(sensitive).toBeDefined();
    expect(sensitive?.type).toBe('bool');
  });

  it('step 1 carries openTool: blueprint (the DataGerry beckon)', () => {
    expect(STEPS[0].openTool).toBe('blueprint');
  });

  it('step 7 carries openTool: trailhead (the Airflow beckon)', () => {
    expect(STEPS[6].openTool).toBe('trailhead');
  });

  it('step 16 carries openTool: overlook (the Trino beckon — the read surface)', () => {
    expect(STEPS[15].openTool).toBe('overlook');
  });

  it('cursor 7 lands Bronze via loadBronze (the shared canonical action)', () => {
    const s = reduceToCursor(STEPS, 7);
    expect(s.bronze.products).toHaveLength(2);
    expect(s.bronze.viewLogs).toHaveLength(2);
  });

  it('cursor 3 bridges the ext_product table schema', () => {
    const s = reduceToCursor(STEPS, 3);
    expect(s.bridgedTables).toContain('ext_product');
  });

  it('cursor 1 authors Sensitive via the shared canonical action (no duplicate on replay)', () => {
    const s = reduceToCursor(STEPS, 1);
    const sens = s.schemaRegistry.Product.fields.filter((f) => f.name === 'Sensitive');
    expect(sens).toHaveLength(1);
    expect(sens[0].type).toBe('bool');
  });

  it('cursor 17 sets the finding + marks the anomaly (j.harper→P-1042) and the backed view (m.okafor→P-1042)', () => {
    const s = reduceToCursor(STEPS, 17);
    expect(s.finding).not.toBeNull();
    expect(s.finding?.user).toBe('j.harper');
    expect(s.finding?.product).toBe('P-1042');
    const harper = s.gold.edges.find((e) => e.from === 'j.harper' && e.to === 'P-1042' && e.kind === 'viewed');
    const okafor = s.gold.edges.find((e) => e.from === 'm.okafor' && e.to === 'P-1042' && e.kind === 'viewed');
    expect(harper?.status).toBe('anomalous');
    expect(okafor?.status).toBe('ok');
  });

  it('cursor 22 completes with 3 audit entries', () => {
    const s = reduceToCursor(STEPS, 22);
    expect(s.cursor).toBe(22);
    expect(s.auditLog).toHaveLength(3);
    expect(s.auditLog[0].decision).toBe('allow');
  });

  it('cursor 22 has no finding-edge left unmarked among viewed edges', () => {
    const s = reduceToCursor(STEPS, 22);
    for (const e of s.gold.edges) {
      if (e.kind === 'viewed') expect(e.status).toMatch(/anomalous|ok/);
    }
  });
});

describe('Atlas + OPA — step 14 openTool (ticket 14)', () => {
  it('step 14 carries openTool: atlas (the audit-write mutate beckons)', () => {
    const step14 = STEPS.find((s) => s.n === 14);
    expect(step14).toBeDefined();
    expect(step14?.openTool).toBe('atlas');
  });

  it('step 14 apply still pushes exactly one audit-log entry (existing mutate unchanged)', () => {
    const state = reduceToCursor(STEPS, 14);
    expect(state.auditLog).toHaveLength(1);
    expect(state.auditLog[0].actor).toBe('analyst');
    expect(state.auditLog[0].decision).toBe('allow');
    expect(state.auditLog[0].detail).toContain('OPA allowed');
  });

  it('beckonToolId at cursor 14 returns atlas (post-write observe invite)', () => {
    expect(beckonToolId(STEPS, 14)).toBe('atlas');
  });

  it('steps 12 and 13 remain narrate-only (no openTool, no audit write)', () => {
    const step12 = STEPS.find((s) => s.n === 12);
    const step13 = STEPS.find((s) => s.n === 13);
    expect(step12?.openTool).toBeUndefined();
    expect(step13?.openTool).toBeUndefined();
    const state13 = reduceToCursor(STEPS, 13);
    expect(state13.auditLog).toHaveLength(0);
  });
});