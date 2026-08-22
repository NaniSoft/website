/**
 * Unit tests for the seeded architecture model — assert the teaching state.
 *
 * The seed is the playground reset point; these tests pin the SPEC §4.6/§4.7
 * guarantees: Gold = 5 nodes / 4 edges, the planted anomaly is present, and the
 * SchemaRegistry carries `Product.Sensitive: bool`.
 */
import { describe, expect, it } from 'vitest';
import {
  ARCHITECTURE_VERSION,
  COMPONENTS,
  COMPONENT_BY_ID,
  EDGES,
  MOCK_TOOLS,
  OBSERVER_COMPONENTS,
  PHASES,
  PIPELINE_SPINE,
  SCHEMA_REGISTRY,
  SEED,
  STAGE_COMPONENTS,
  conformToGold,
  detectAnomalies,
  getFinding,
} from '../src/index';

describe('seeded dataset — SPEC §4.6 counts', () => {
  it('has 2 products, 4 users, 2 groups, 2 view-logs', () => {
    expect(SEED.products).toHaveLength(2);
    expect(SEED.users).toHaveLength(4);
    expect(SEED.groups).toHaveLength(2);
    expect(SEED.viewLogs).toHaveLength(2);
  });

  it('SEED carries ext_product as already bridged (the seed is the post-run teaching state)', () => {
    expect(SEED.bridgedTables).toEqual(['ext_product']);
  });

  it('plants the anomaly substrate: j.harper views P-1042; m.okafor + a.chen memberof G-SR; P-1042 = Payroll-NG sensitive', () => {
    const p1042 = SEED.products.find((p) => p.id === 'P-1042');
    expect(p1042).toMatchObject({ name: 'Payroll-NG', sensitive: true, ownerGroup: 'G-SR' });

    const harperViews = SEED.viewLogs.filter((v) => v.user === 'j.harper');
    expect(harperViews).toHaveLength(1);
    expect(harperViews[0].product).toBe('P-1042');

    // j.harper has NO group membership (the anomaly).
    expect(SEED.groupMemberships.filter((m) => m.user === 'j.harper')).toHaveLength(0);

    // m.okafor and a.chen both back P-1042 via G-SR.
    const memberGroups = (user: string) =>
      SEED.groupMemberships.filter((m) => m.user === user).map((m) => m.group);
    expect(memberGroups('m.okafor')).toEqual(['G-SR']);
    expect(memberGroups('a.chen')).toEqual(['G-SR']);
  });
});

describe('Gold teaching state — SPEC §4.7 (5 nodes / 4 edges)', () => {
  it('conforms to exactly 5 nodes / 4 edges', () => {
    expect(SEED.gold.nodes).toHaveLength(5);
    expect(SEED.gold.edges).toHaveLength(4);
  });

  it('re-conforming the seed is deterministic and matches the seed.gold', () => {
    const reconformed = conformToGold(SEED);
    expect(reconformed.nodes.map((n) => n.id).sort()).toEqual(
      [...SEED.gold.nodes.map((n) => n.id)].sort(),
    );
    expect(reconformed.edges.map((e) => e.id).sort()).toEqual(
      [...SEED.gold.edges.map((e) => e.id)].sort(),
    );
  });

  it('the 5 Gold nodes are j.harper, m.okafor, a.chen, P-1042, G-SR', () => {
    expect(SEED.gold.nodes.map((n) => n.id).sort()).toEqual(
      ['G-SR', 'P-1042', 'a.chen', 'j.harper', 'm.okafor'].sort(),
    );
  });

  it('the 4 Gold edges are 2 viewed + 2 memberof', () => {
    const kinds = SEED.gold.edges.map((e) => e.kind).sort();
    expect(kinds).toEqual(['memberof', 'memberof', 'viewed', 'viewed']);
  });
});

describe('anomaly detection — SPEC §4.6/§4.7 (the planted finding)', () => {
  it('flags exactly one anomalous view: j.harper → P-1042', () => {
    const anomalies = detectAnomalies(SEED.gold, SEED);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]).toMatchObject({ from: 'j.harper', to: 'P-1042', kind: 'viewed' });
  });

  it('does NOT flag the backed view (m.okafor → P-1042, memberof G-SR)', () => {
    const anomalies = detectAnomalies(SEED.gold, SEED);
    expect(anomalies.find((e) => e.from === 'm.okafor')).toBeUndefined();
  });

  it('getFinding surfaces the full finding', () => {
    const finding = getFinding(SEED);
    expect(finding).not.toBeNull();
    expect(finding).toMatchObject({
      user: 'j.harper',
      product: 'P-1042',
      productName: 'Payroll-NG',
      sensitive: true,
      ownerGroup: 'G-SR',
      missingMembership: true,
    });
  });
});

describe('SchemaRegistry — SPEC §4.7 (Product/Sensitive:bool)', () => {
  it('Product ObjectType exists', () => {
    expect(SCHEMA_REGISTRY.Product).toBeDefined();
  });

  it('Product has a Sensitive: bool field', () => {
    const sensitive = SCHEMA_REGISTRY.Product.fields.find((f) => f.name === 'Sensitive');
    expect(sensitive).toBeDefined();
    expect(sensitive?.type).toBe('bool');
  });

  it('the seeded SchemaRegistry matches the one on SEED', () => {
    expect(SEED.schemaRegistry).toBe(SCHEMA_REGISTRY);
  });
});

describe('architecture graph — SPEC §1 (components / phases / spine)', () => {
  it('exports the named codenamed components', () => {
    const ids = COMPONENTS.map((c) => c.id);
    for (const id of [
      'atlas',
      'compass',
      'trailhead',
      'forge',
      'bedrock',
      'overlook',
      'watchtower',
      'blueprint',
      'anchor',
      'conveyor',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('classifies the four custom components as Atlas, Compass, Bridge, Scout', () => {
    const custom = COMPONENTS.filter((c) => c.kind === 'custom').map((c) => c.id).sort();
    expect(custom).toEqual(['atlas', 'bridge', 'compass', 'scout']);
  });

  it('Blueprint wraps the off-the-shelf DataGerry', () => {
    expect(COMPONENT_BY_ID['blueprint']).toMatchObject({
      realName: 'DataGerry',
      kind: 'offshelf',
    });
  });

  it('has exactly 4 phases in spine order', () => {
    expect(PHASES.map((p) => p.id)).toEqual([
      'schema',
      'ingestion',
      'transform',
      'investigation',
    ]);
  });

  it('the pipeline spine is Sources → Schema → Ingestion → Bedrock → Transform → Serving → Core → UI', () => {
    expect([...PIPELINE_SPINE]).toEqual([
      'sources',
      'schema',
      'ingestion',
      'bedrock',
      'transform',
      'serving',
      'core',
      'ui',
    ]);
  });

  it('Watchtower is the cross-cutting observer', () => {
    expect(OBSERVER_COMPONENTS).toEqual(['watchtower']);
    expect(COMPONENT_BY_ID['watchtower'].kind).toBe('platform');
    // Watchtower observes via dotted edges.
    const observes = EDGES.filter(
      (e) => e.from === 'watchtower' && e.style === 'dotted',
    );
    expect(observes.length).toBeGreaterThan(0);
  });

  it('every edge references known component ids', () => {
    for (const e of EDGES) {
      expect(COMPONENT_BY_ID[e.from], `edge from ${e.from}`).toBeDefined();
      expect(COMPONENT_BY_ID[e.to], `edge to ${e.to}`).toBeDefined();
    }
  });

  it('every spine-stage component exists', () => {
    for (const ids of Object.values(STAGE_COMPONENTS)) {
      for (const id of ids) expect(COMPONENT_BY_ID[id]).toBeDefined();
    }
  });
});

describe('mock-tool specs — SPEC §4.8 (six tools)', () => {
  it('exports exactly six full-UI tools', () => {
    expect(MOCK_TOOLS).toHaveLength(6);
  });

  it('the six tools are Blueprint, Trailhead, Overlook, Atlas, Compass, Superset', () => {
    expect(MOCK_TOOLS.map((t) => t.component).sort()).toEqual(
      ['atlas', 'blueprint', 'compass', 'overlook', 'superset', 'trailhead'].sort(),
    );
  });

  it('every tool has one canonical action and explicit reads/writes', () => {
    for (const t of MOCK_TOOLS) {
      expect(t.canonicalAction.length).toBeGreaterThan(0);
      expect(Array.isArray(t.reads)).toBe(true);
      expect(Array.isArray(t.writes)).toBe(true);
    }
  });

  it('Overlook reads Gold and writes nothing (pure read surface)', () => {
    const overlook = MOCK_TOOLS.find((t) => t.component === 'overlook')!;
    expect(overlook.reads.length).toBeGreaterThan(0);
    expect(overlook.writes).toEqual([]);
  });

  it('Atlas writes the audit log', () => {
    const atlas = MOCK_TOOLS.find((t) => t.component === 'atlas')!;
    expect(atlas.writes).toContain('audit_log');
  });
});

describe('package metadata', () => {
  it('bumped the architecture version for the seeded model', () => {
    expect(ARCHITECTURE_VERSION).not.toBe('0.0.0');
  });
});