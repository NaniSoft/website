import { describe, expect, it } from 'vitest';
import {
  applyStep,
  blankState,
  deriveStatus,
  exportState,
  importState,
  InvalidStateError,
  reduceToCursor,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  type PlaybookStep,
} from '../src/index';
import { SEED } from '../src/dataset';

// A tiny fake playbook to test the machinery independent of the real flagship.
const fake: PlaybookStep[] = [
  { n: 1, phase: 'schema', actor: 'blueprint', edge: ['blueprint', 'bridge'], title: 't1', desc: 'd1', apply: (s) => { s.schemaRegistry = { Product: { name: 'Product', fields: [] } }; } },
  { n: 2, phase: 'schema', actor: 'bridge', edge: ['bridge', 'bedrock'], title: 't2', desc: 'd2', apply: () => {} },
];

describe('blankState — SPEC §4.5/§4.6', () => {
  it('starts with empty lakehouse + registry + audit, sources present, cursor 0', () => {
    const s = blankState();
    expect(s.cursor).toBe(0);
    expect(s.finding).toBeNull();
    // SPEC §4.8: Product is drafted (id/name/owner_group) pre-pipeline; step 1
    // authors the Sensitive: bool field — the definitional hinge.
    expect(s.schemaRegistry).toEqual({
      Product: {
        name: 'Product',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'owner_group', type: 'string' },
        ],
      },
    });
    // SPEC §4.8: the Bridge writes the ext_product table schema (step 3); empty pre-pipeline.
    expect(s.bridgedTables).toEqual([]);
    expect(s.gold).toEqual({ nodes: [], edges: [] });
    expect(s.bronze).toEqual({ products: [], viewLogs: [] });
    expect(s.silver).toEqual({ extProduct: [], extViewLog: [] });
    expect(s.auditLog).toEqual([]);
    // sources present (the fixed rows ingestion reads)
    expect(s.products).toBe(SEED.products);
    expect(s.viewLogs).toBe(SEED.viewLogs);
  });
});

describe('applyStep / reduceToCursor — immutability + cursor', () => {
  it('applyStep returns a new state with cursor advanced, original untouched', () => {
    const before = blankState();
    const after = applyStep(before, fake[0]);
    expect(before.cursor).toBe(0); // unchanged
    expect(after.cursor).toBe(1);
    expect(after.schemaRegistry.Product).toBeDefined();
    expect(after).not.toBe(before);
  });

  it('reduceToCursor(0) equals blankState', () => {
    expect(reduceToCursor(fake, 0)).toEqual(blankState());
  });

  it('reduceToCursor(2) applies both steps', () => {
    const s = reduceToCursor(fake, 2);
    expect(s.cursor).toBe(2);
    expect(s.schemaRegistry.Product).toBeDefined();
  });

  it('reduceToCursor clamps past the end', () => {
    const s = reduceToCursor(fake, 99);
    expect(s.cursor).toBe(2);
  });
});

describe('deriveStatus — SPEC §4.3 reactivity', () => {
  it('cursor 0: no active, empty dones', () => {
    const st = deriveStatus(fake, 0);
    expect(st.activeNodeId).toBeNull();
    expect(st.activeEdge).toBeNull();
    expect(st.activePhase).toBeNull();
    expect([...st.doneNodeIds]).toEqual([]);
  });

  it('cursor 1: active = step 1 actor/edge/phase; that actor also in done (active overrides)', () => {
    const st = deriveStatus(fake, 1);
    expect(st.activeNodeId).toBe('blueprint');
    expect(st.activeEdge).toEqual({ from: 'blueprint', to: 'bridge' });
    expect(st.activePhase).toBe('schema');
    expect(st.doneNodeIds.has('blueprint')).toBe(true);
  });

  it('cursor at end: no active, all done', () => {
    const st = deriveStatus(fake, 2);
    expect(st.activeNodeId).toBeNull();
    expect(st.doneNodeIds.has('blueprint')).toBe(true);
    expect(st.doneNodeIds.has('bridge')).toBe(true);
    expect(st.doneEdgeIds.has('blueprint__bridge')).toBe(true);
    expect(st.doneEdgeIds.has('bridge__bedrock')).toBe(true);
  });
});

describe('export / import — SPEC §4.5 persistence', () => {
  it('roundtrips a played state preserving cursor', () => {
    const played = reduceToCursor(fake, 2);
    const json = exportState(played);
    const back = importState(json);
    expect(back).toEqual(played);
  });

  // Ticket 17 criterion 4: export → reset → import of a COMPLETE flagship run
  // must preserve the finding (the audit's whole point), the built Gold graph,
  // and the audit log — not just cursor mechanics (covered by the fake above).
  it('roundtrips a COMPLETE 22-step flagship run preserving the finding (ticket 17 criterion 4)', () => {
    let played = blankState();
    for (const step of SENSITIVE_PRODUCT_VIEW_AUDIT) played = applyStep(played, step);
    const back = importState(exportState(played));
    expect(back).toEqual(played);
    expect(back.cursor).toBe(22);
    expect(back.finding).toMatchObject({
      user: 'j.harper',
      product: 'P-1042',
      productName: 'Payroll-NG',
      sensitive: true,
      missingMembership: true,
    });
    expect(back.gold.nodes).toHaveLength(5);
    expect(back.gold.edges).toHaveLength(4);
    expect(back.auditLog).toHaveLength(3);
  });

  it('rejects non-JSON', () => {
    expect(() => importState('not json')).toThrow(InvalidStateError);
  });

  it('rejects an object missing required fields', () => {
    expect(() => importState('{}')).toThrow(InvalidStateError);
  });

  it('rejects a non-number cursor', () => {
    const played = reduceToCursor(fake, 1);
    const bad = JSON.parse(exportState(played));
    bad.cursor = 'x';
    expect(() => importState(JSON.stringify(bad))).toThrow(InvalidStateError);
  });
});

describe('bridgedTables — SPEC §4.8 (Bridge writes ext_product)', () => {
  it('blankState starts with no bridged tables', () => {
    expect(blankState().bridgedTables).toEqual([]);
  });

  it('importState rejects a state missing bridgedTables', () => {
    const played = reduceToCursor(fake, 1);
    const bad = JSON.parse(exportState(played));
    delete bad.bridgedTables;
    expect(() => importState(JSON.stringify(bad))).toThrow(InvalidStateError);
  });

  it('importState rejects a non-array bridgedTables', () => {
    const played = reduceToCursor(fake, 1);
    const bad = JSON.parse(exportState(played));
    bad.bridgedTables = 'nope';
    expect(() => importState(JSON.stringify(bad))).toThrow(InvalidStateError);
  });

  it('roundtrips bridgedTables unchanged', () => {
    const played = reduceToCursor(fake, 1);
    played.bridgedTables = ['ext_product'];
    const back = importState(exportState(played));
    expect(back.bridgedTables).toEqual(['ext_product']);
  });
});