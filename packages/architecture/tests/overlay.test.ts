import { describe, expect, it } from 'vitest';
import {
  airflowDagStatus,
  atlasOpaStatus,
  beckonToolId,
  compassTraversal,
  dataGerrySyncStatus,
  overlayReducer,
  trinoResults,
  TRINO_SEEDED_SQL,
  blankState,
  reduceToCursor,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
  SEED,
  supersetDashboard,
  type OverlayState,
} from '../src/index';

const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

describe('overlayReducer — SPEC §4.8 chrome state', () => {
  it('opens with the component id + cursor recorded', () => {
    const s = overlayReducer(null, { type: 'open', componentId: 'blueprint', cursor: 0 });
    expect(s).toEqual({ componentId: 'blueprint', openedAtCursor: 0 });
  });
  it('open replaces an existing overlay (no stacking)', () => {
    let s: OverlayState = null;
    s = overlayReducer(s, { type: 'open', componentId: 'blueprint', cursor: 0 });
    s = overlayReducer(s, { type: 'open', componentId: 'compass', cursor: 11 });
    expect(s).toEqual({ componentId: 'compass', openedAtCursor: 11 });
  });
  it('close → null', () => {
    let s: OverlayState = overlayReducer(null, { type: 'open', componentId: 'blueprint', cursor: 0 });
    s = overlayReducer(s, { type: 'close' });
    expect(s).toBeNull();
  });
  it('reset → null', () => {
    let s: OverlayState = overlayReducer(null, { type: 'open', componentId: 'blueprint', cursor: 0 });
    s = overlayReducer(s, { type: 'reset' });
    expect(s).toBeNull();
  });
});

describe('beckonToolId — SPEC §4.8 auto-run = beckon', () => {
  it('cursor 0 → null (no active step)', () => {
    expect(beckonToolId(STEPS, 0)).toBeNull();
  });
  it('cursor 1 → blueprint (step 1 openTool)', () => {
    expect(beckonToolId(STEPS, 1)).toBe('blueprint');
  });
  it('cursor 11 → compass (step 11 openTool)', () => {
    expect(beckonToolId(STEPS, 11)).toBe('compass');
  });
  it('cursor 22 → null (run complete)', () => {
    expect(beckonToolId(STEPS, 22)).toBeNull();
  });
});

describe('dataGerrySyncStatus — SPEC §4.8 Bridge → Bedrock → Atlas', () => {
  it('blank state → none done', () => {
    const s = dataGerrySyncStatus(blankState(), 0);
    expect(s).toEqual({ authored: false, bedrock: false, atlas: false });
  });
  it('after step 1 → authored only', () => {
    const s = dataGerrySyncStatus(reduceToCursor(STEPS, 1), 1);
    expect(s).toEqual({ authored: true, bedrock: false, atlas: false });
  });
  it('after step 3 → authored + bedrock', () => {
    const s = dataGerrySyncStatus(reduceToCursor(STEPS, 3), 3);
    expect(s).toEqual({ authored: true, bedrock: true, atlas: false });
  });
  it('at cursor 4 → all three (Atlas acks the cache refresh)', () => {
    const s = dataGerrySyncStatus(reduceToCursor(STEPS, 4), 4);
    expect(s).toEqual({ authored: true, bedrock: true, atlas: true });
  });
});

describe('airflowDagStatus — SPEC §4.8 Airflow DAG run-state', () => {
  it('cursor 0 → all tasks pending, no run log, cannot trigger, not triggered', () => {
    const d = airflowDagStatus(blankState(), 0);
    expect(d.ingestion.tasks.map((t) => t.state)).toEqual(['pending', 'pending', 'pending', 'pending']);
    expect(d.transform.tasks.map((t) => t.state)).toEqual(['pending', 'pending', 'pending']);
    expect(d.runLog).toEqual([]);
    expect(d.canTrigger).toBe(false);
    expect(d.triggered).toBe(false);
  });

  it('cursor 5 → extract_SQLFleet running, the rest pending; ingestion run running; not triggerable', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 5), 5);
    expect(d.ingestion.tasks.map((t) => t.state)).toEqual(['running', 'pending', 'pending', 'pending']);
    expect(d.runLog).toHaveLength(1);
    expect(d.runLog[0].status).toBe('running');
    expect(d.runLog[0].text).toContain('ingestion');
    expect(d.canTrigger).toBe(false);
    expect(d.triggered).toBe(false);
  });

  it('cursor 6 → extract_SQLFleet success; extract_AD + extract_Workday running (parallel); load_Bronze pending; canTrigger true', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 6), 6);
    expect(d.ingestion.tasks.map((t) => t.state)).toEqual(['success', 'running', 'running', 'pending']);
    expect(d.canTrigger).toBe(true);
    expect(d.triggered).toBe(false);
  });

  it('cursor 7 → all extracts success; load_Bronze running; triggered true (Bronze populated); not triggerable', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 7), 7);
    expect(d.ingestion.tasks.map((t) => t.state)).toEqual(['success', 'success', 'success', 'running']);
    expect(d.triggered).toBe(true);
    expect(d.canTrigger).toBe(false);
    expect(d.runLog[0].status).toBe('running');
  });

  it('cursor 8 → all 4 ingestion tasks success; ingestion run success line with counts; transform forge running; runLog has 2 lines', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 8), 8);
    expect(d.ingestion.tasks.map((t) => t.state)).toEqual(['success', 'success', 'success', 'success']);
    expect(d.transform.tasks.map((t) => t.state)).toEqual(['running', 'pending', 'pending']);
    expect(d.runLog).toHaveLength(2);
    expect(d.runLog[0].status).toBe('success');
    expect(d.runLog[0].text).toContain('loaded 2 products · 2 view-logs');
    expect(d.runLog[1].status).toBe('running');
    expect(d.runLog[1].text).toContain('transform');
  });

  it('cursor 10 → transform forge + silver success, gold running; transform run still running', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 10), 10);
    expect(d.transform.tasks.map((t) => t.state)).toEqual(['success', 'success', 'running']);
    expect(d.runLog[1].status).toBe('running');
  });

  it('cursor 11 → transform all success; transform run success line with Gold counts; 2 run-log lines both success', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 11), 11);
    expect(d.transform.tasks.map((t) => t.state)).toEqual(['success', 'success', 'success']);
    expect(d.runLog).toHaveLength(2);
    expect(d.runLog[1].status).toBe('success');
    expect(d.runLog[1].text).toContain('Gold 5 nodes / 4 edges');
  });

  it('cursor 22 → all 7 tasks success; 2 success run-log lines; not triggerable; triggered', () => {
    const d = airflowDagStatus(reduceToCursor(STEPS, 22), 22);
    expect(d.ingestion.tasks.every((t) => t.state === 'success')).toBe(true);
    expect(d.transform.tasks.every((t) => t.state === 'success')).toBe(true);
    expect(d.runLog).toHaveLength(2);
    expect(d.runLog.every((l) => l.status === 'success')).toBe(true);
    expect(d.canTrigger).toBe(false);
    expect(d.triggered).toBe(true);
  });

  it('ingestion DAG shape: 3 extracts → load_Bronze (fan-in edges)', () => {
    const d = airflowDagStatus(blankState(), 0);
    expect(d.ingestion.tasks.map((t) => t.label)).toEqual(['extract_SQLFleet', 'extract_AD', 'extract_Workday', 'load_Bronze']);
    expect(d.ingestion.edges).toEqual([
      ['extract_sqlfleet', 'load_bronze'],
      ['extract_ad', 'load_bronze'],
      ['extract_workday', 'load_bronze'],
    ]);
  });

  it('transform DAG shape: forge → silver → gold (linear edges)', () => {
    const d = airflowDagStatus(blankState(), 0);
    expect(d.transform.tasks.map((t) => t.label)).toEqual(['Forge', 'Silver', 'Gold']);
    expect(d.transform.edges).toEqual([['forge', 'silver'], ['silver', 'gold']]);
  });
});


describe('trinoResults — SPEC §4.8 Trino/Overlook query surface', () => {
  it('exposes the Atlas-seeded SQL with the provenance header', () => {
    expect(TRINO_SEEDED_SQL).toContain('Query seeded by Atlas: Sensitive Product View Audit');
    expect(TRINO_SEEDED_SQL).toContain('graph_edges');
    expect(TRINO_SEEDED_SQL).toContain('graph_nodes');
    expect(TRINO_SEEDED_SQL).toContain("v.kind = 'viewed'");
  });

  it('cursor 0 (blank state) → empty rows, queryRun false, canRun false, sql present', () => {
    const r = trinoResults(blankState(), 0);
    expect(r.rows).toEqual([]);
    expect(r.queryRun).toBe(false);
    expect(r.canRun).toBe(false);
    expect(r.sql).toBe(TRINO_SEEDED_SQL);
  });

  it('cursor 15 (step 16 next; Gold populated) → rows empty (not run), canRun true, queryRun false', () => {
    const r = trinoResults(reduceToCursor(STEPS, 15), 15);
    expect(r.queryRun).toBe(false);
    expect(r.canRun).toBe(true);
    expect(r.rows).toEqual([]);
  });

  it('cursor 16 (step 16 applied, step 17 not yet) → 2 rows; j.harper anomalous by derivation, m.okafor backed ok', () => {
    const r = trinoResults(reduceToCursor(STEPS, 16), 16);
    expect(r.queryRun).toBe(true);
    expect(r.canRun).toBe(false);
    expect(r.rows).toHaveLength(2);
    const harper = r.rows.find((row) => row.user === 'j.harper');
    const okafor = r.rows.find((row) => row.user === 'm.okafor');
    expect(harper).toBeDefined();
    expect(harper?.product).toBe('P-1042');
    expect(harper?.productName).toBe('Payroll-NG');
    expect(harper?.sensitive).toBe(true);
    expect(harper?.ownerGroup).toBe('G-SR');
    expect(harper?.backing).toBe('no-backing');
    expect(harper?.anomalous).toBe(true); // derived: sensitive && no backing (edge.status still null)
    expect(okafor).toBeDefined();
    expect(okafor?.product).toBe('P-1042');
    expect(okafor?.backing).toBe('memberof');
    expect(okafor?.anomalous).toBe(false); // derived: backed (edge.status still null)
  });

  it('cursor 17 (step 17 applied) → same 2 rows but anomalous read from explicit edge.status flags', () => {
    const r = trinoResults(reduceToCursor(STEPS, 17), 17);
    expect(r.rows).toHaveLength(2);
    const harper = r.rows.find((row) => row.user === 'j.harper')!;
    const okafor = r.rows.find((row) => row.user === 'm.okafor')!;
    expect(harper.anomalous).toBe(true); // edge.status === 'anomalous'
    expect(okafor.anomalous).toBe(false); // edge.status === 'ok'
    expect(harper.backing).toBe('no-backing');
    expect(okafor.backing).toBe('memberof');
  });

  it('cursor 22 → 2 rows consistent with the explicit flags; canRun false; queryRun true', () => {
    const r = trinoResults(reduceToCursor(STEPS, 22), 22);
    expect(r.queryRun).toBe(true);
    expect(r.canRun).toBe(false);
    expect(r.rows).toHaveLength(2);
    expect(r.rows.filter((row) => row.anomalous)).toHaveLength(1);
    expect(r.rows.find((row) => row.anomalous)?.user).toBe('j.harper');
  });

  it('reads only Gold (does not regress when gold is empty)', () => {
    const s = blankState(); // gold is empty at the blank state
    const r = trinoResults(s, 16); // force queryRun via cursor
    expect(r.rows).toEqual([]);
    expect(r.queryRun).toBe(true);
  });
});

describe('atlasOpaStatus — SPEC §4.8 Atlas + OPA authz-and-audit', () => {
  it('rego is the constant 3-line snippet', () => {
    const s = atlasOpaStatus(blankState(), 0);
    expect(s.rego).toBe(
      'package nanisoft.authz\n' +
        'allow if {\n' +
        '  input.user == "analyst"\n' +
        '  input.use_case == "sensitive-product-view-audit"\n' +
        '}',
    );
  });

  it('cursor 0 → allow false, empty log', () => {
    const s = atlasOpaStatus(blankState(), 0);
    expect(s.allow).toBe(false);
    expect(s.log).toEqual([]);
  });

  it('cursor 10 → still empty log (Compass has not asked Atlas yet)', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 10), 10);
    expect(s.allow).toBe(false);
    expect(s.log).toEqual([]);
  });

  it('cursor 11 → GET use-cases/steps → 200 only; allow false', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 11), 11);
    expect(s.allow).toBe(false);
    expect(s.log).toEqual([
      { method: 'GET', path: '/use-cases/sensitive-product-view-audit/steps', status: 200 },
    ]);
  });

  it('cursor 12 → same as 11 (authz check not yet complete); allow false', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 12), 12);
    expect(s.allow).toBe(false);
    expect(s.log).toHaveLength(1);
  });

  it('cursor 13 → adds POST /authz/check → 200 {allow:true}; allow true', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 13), 13);
    expect(s.allow).toBe(true);
    expect(s.log).toEqual([
      { method: 'GET', path: '/use-cases/sensitive-product-view-audit/steps', status: 200 },
      { method: 'POST', path: '/authz/check', status: 200, body: '{allow:true}' },
    ]);
  });

  it('cursor 14 → adds POST /audit/log → 201 (the canonical action result)', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 14), 14);
    expect(s.allow).toBe(true);
    expect(s.log).toHaveLength(3);
    expect(s.log[2]).toEqual({ method: 'POST', path: '/audit/log', status: 201 });
  });

  it('cursor 17 → still 3 lines (traversal not yet served)', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 17), 17);
    expect(s.log).toHaveLength(3);
  });

  it('cursor 18 → adds GET /traversal/query → 200 [finding] (log line only)', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 18), 18);
    expect(s.allow).toBe(true);
    expect(s.log).toHaveLength(4);
    expect(s.log[3]).toEqual({ method: 'GET', path: '/traversal/query', status: 200, body: '[finding]' });
  });

  it('cursor 22 → 4 lines, allow true', () => {
    const s = atlasOpaStatus(reduceToCursor(STEPS, 22), 22);
    expect(s.allow).toBe(true);
    expect(s.log).toHaveLength(4);
  });
});
describe('compassTraversal — SPEC §4.8 Compass climax (finding as edges)', () => {
  it('blank state (cursor 0) → not ready, querying status, empty graph, no finding', () => {
    const t = compassTraversal(blankState(), 0);
    expect(t.ready).toBe(false);
    expect(t.status).toMatch(/Querying Atlas/i);
    expect(t.nodes).toEqual([]);
    expect(t.edges).toEqual([]);
    expect(t.narrative).toEqual([]);
    expect(t.details).toEqual({});
    expect(t.finding).toBeNull();
  });

  it('cursor 10 (Gold conformed, no finding) → 5 nodes / 4 edges, no missing gap, viewed pending, memberof backed; not ready', () => {
    const t = compassTraversal(reduceToCursor(STEPS, 10), 10);
    expect(t.nodes.map((n) => n.id).sort()).toEqual(['G-SR', 'P-1042', 'a.chen', 'j.harper', 'm.okafor']);
    expect(t.edges).toHaveLength(4);
    expect(t.edges.find((e) => e.id === 'e:viewed:j.harper:P-1042')?.status).toBe('pending');
    expect(t.edges.find((e) => e.id === 'e:viewed:m.okafor:P-1042')?.status).toBe('pending');
    expect(t.edges.find((e) => e.id === 'e:memberof:m.okafor:G-SR')?.status).toBe('backed');
    expect(t.edges.find((e) => e.id === 'e:memberof:a.chen:G-SR')?.status).toBe('backed');
    expect(t.edges.every((e) => e.missing === false)).toBe(true);
    expect(t.ready).toBe(false);
    expect(t.finding).toBeNull();
    expect(t.status).toMatch(/Querying Atlas/i);
  });

  it('cursor 17 (finding set, edges flagged) → 5 nodes / 5 edges (missing gap synthesized), anomalous/ok/backed/gap; not ready; finding non-null', () => {
    const t = compassTraversal(reduceToCursor(STEPS, 17), 17);
    expect(t.nodes).toHaveLength(5);
    expect(t.edges).toHaveLength(5);
    expect(t.edges.find((e) => e.id === 'e:viewed:j.harper:P-1042')?.status).toBe('anomalous');
    expect(t.edges.find((e) => e.id === 'e:viewed:m.okafor:P-1042')?.status).toBe('ok');
    expect(t.edges.find((e) => e.id === 'e:memberof:m.okafor:G-SR')?.status).toBe('backed');
    expect(t.edges.find((e) => e.id === 'e:memberof:a.chen:G-SR')?.status).toBe('backed');
    const gap = t.edges.find((e) => e.missing);
    expect(gap).toEqual({
      id: 'e:missing:j.harper:G-SR',
      from: 'j.harper',
      to: 'G-SR',
      kind: 'memberof',
      status: 'gap',
      missing: true,
    });
    expect(t.ready).toBe(false);
    expect(t.finding).not.toBeNull();
    expect(t.status).toMatch(/Atlas returned/i);
  });

  it('cursor 19 (the climax) → ready, status empty, 3 narrative lines, 5 detail entries', () => {
    const t = compassTraversal(reduceToCursor(STEPS, 19), 19);
    expect(t.ready).toBe(true);
    expect(t.status).toBe('');
    expect(t.narrative).toHaveLength(3);
    expect(t.narrative.map((s) => s.text).join('\n')).toMatch(/j\.harper viewed/i);
    expect(Object.keys(t.details).sort()).toEqual(['G-SR', 'P-1042', 'a.chen', 'j.harper', 'm.okafor']);
    expect(t.details['j.harper']).toMatch(/no backing group membership/i);
    expect(t.details['P-1042']).toMatch(/sensitive: true/i);
    expect(t.details['G-SR']).toMatch(/owner group/i);
    // Backed viewer vs backed member-with-no-view distinction.
    expect(t.details['m.okafor']).toMatch(/viewed P-1042.*ok/i);
    expect(t.details['a.chen']).toMatch(/memberof G-SR — backed access/i);
  });

  it('cursor 22 (run complete) → still ready, 5 nodes / 5 edges, narrative + details populated', () => {
    const t = compassTraversal(reduceToCursor(STEPS, 22), 22);
    expect(t.ready).toBe(true);
    expect(t.nodes).toHaveLength(5);
    expect(t.edges).toHaveLength(5);
    expect(t.narrative).toHaveLength(3);
    expect(Object.keys(t.details)).toHaveLength(5);
    expect(t.edges.find((e) => e.missing)?.status).toBe('gap');
  });

  it('P-1042 node carries sensitive + ownerGroup; G-SR is a group; users are users', () => {
    const t = compassTraversal(reduceToCursor(STEPS, 10), 10);
    const p = t.nodes.find((n) => n.id === 'P-1042')!;
    expect(p.kind).toBe('product');
    expect(p.sensitive).toBe(true);
    expect(p.ownerGroup).toBe('G-SR');
    expect(t.nodes.find((n) => n.id === 'G-SR')?.kind).toBe('group');
    expect(t.nodes.find((n) => n.id === 'j.harper')?.kind).toBe('user');
  });
});
describe('supersetDashboard — SPEC §4.8 Superset read lens (sandbox)', () => {
  // A PlaygroundState built from the SEED (populated Gold) at cursor 0 — the
  // "from the seed before the flagship runs" case.
  const seedState = () => ({ ...SEED, finding: null, cursor: 0 });

  it('from seed → products by exposure count (P-1042 exposed once, P-2210 zero)', () => {
    const d = supersetDashboard(seedState(), 0);
    expect(d.products).toHaveLength(2);
    const p1042 = d.products.find((p) => p.productId === 'P-1042')!;
    expect(p1042).toMatchObject({ productName: 'Payroll-NG', sensitive: true, exposureCount: 1, viewCount: 2 });
    const p2210 = d.products.find((p) => p.productId === 'P-2210')!;
    expect(p2210).toMatchObject({ productName: 'Inventory-NG', sensitive: false, exposureCount: 0, viewCount: 0 });
  });

  it('from seed → anomalous users table flags j.harper on P-1042', () => {
    const d = supersetDashboard(seedState(), 0);
    expect(d.anomalousUsers).toHaveLength(1);
    expect(d.anomalousUsers[0]).toMatchObject({
      user: 'j.harper',
      userLabel: 'Jordan Harper',
      productId: 'P-1042',
      productName: 'Payroll-NG',
      ownerGroup: 'G-SR',
      edgeId: 'e:viewed:j.harper:P-1042',
    });
  });

  it('from seed → views by source system: SQL Server Fleet (viewed) + Active Directory (memberof)', () => {
    const d = supersetDashboard(seedState(), 0);
    expect(d.sources).toEqual([
      { sourceSystem: 'SQL Server Fleet', edgeKind: 'viewed', count: 2 },
      { sourceSystem: 'Active Directory', edgeKind: 'memberof', count: 2 },
    ]);
  });

  it('blank state (cursor 0, empty Gold) → well-formed empty datasets, no crash', () => {
    const d = supersetDashboard(blankState(), 0);
    expect(d.products).toHaveLength(2);
    expect(d.products.every((p) => p.exposureCount === 0 && p.viewCount === 0)).toBe(true);
    expect(d.anomalousUsers).toEqual([]);
    expect(d.sources).toEqual([
      { sourceSystem: 'SQL Server Fleet', edgeKind: 'viewed', count: 0 },
      { sourceSystem: 'Active Directory', edgeKind: 'memberof', count: 0 },
    ]);
  });

  it('before the flagship finding (cursor 10, Gold populated, finding null) → full dashboard', () => {
    const s = reduceToCursor(SENSITIVE_PRODUCT_VIEW_AUDIT, 10);
    const d = supersetDashboard(s, 10);
    expect(d.products.find((p) => p.productId === 'P-1042')!.exposureCount).toBe(1);
    expect(d.anomalousUsers).toHaveLength(1);
    expect(d.anomalousUsers[0].user).toBe('j.harper');
    expect(d.sources.map((r) => r.count)).toEqual([2, 2]);
  });

  it('after the flagship finding (cursor 17, statuses set) → same dashboard (derives independently of edge.status)', () => {
    const before = supersetDashboard(reduceToCursor(SENSITIVE_PRODUCT_VIEW_AUDIT, 10), 10);
    const after = supersetDashboard(reduceToCursor(SENSITIVE_PRODUCT_VIEW_AUDIT, 17), 17);
    expect(after).toEqual(before);
  });

  it('cursor 22 → same dashboard (Superset reads the same Gold)', () => {
    const d = supersetDashboard(reduceToCursor(SENSITIVE_PRODUCT_VIEW_AUDIT, 22), 22);
    expect(d.anomalousUsers).toHaveLength(1);
    expect(d.sources.map((r) => r.count)).toEqual([2, 2]);
  });

  it('cursor parameter is unused — same state at different cursors yields the same dashboard', () => {
    const state = seedState();
    expect(supersetDashboard(state, 0)).toEqual(supersetDashboard(state, 17));
  });
});
