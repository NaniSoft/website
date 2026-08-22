import { describe, expect, it } from 'vitest';
import { graphData } from '@/lib/graph-data';

describe('graph data', () => {
  it('has at least 100 nodes and 200 edges', () => {
    expect(graphData.nodes.length).toBeGreaterThanOrEqual(100);
    expect(graphData.edges.length).toBeGreaterThanOrEqual(200);
  });

  it('covers all six entity types', () => {
    const types = new Set(graphData.nodes.map((n) => n.type));
    for (const t of ['User', 'Service', 'DataAsset', 'Policy', 'Event', 'Identity'] as const) {
      expect(types.has(t)).toBe(true);
    }
  });

  it('has at least 3 hot-path nodes and 3 hot-path edges', () => {
    expect(graphData.nodes.filter((n) => n.hot).length).toBeGreaterThanOrEqual(3);
    expect(graphData.edges.filter((e0) => e0.hot).length).toBeGreaterThanOrEqual(3);
  });

  it('every edge references existing node ids', () => {
    const ids = new Set(graphData.nodes.map((n) => n.id));
    for (const e0 of graphData.edges) {
      expect(ids.has(e0.source)).toBe(true);
      expect(ids.has(e0.target)).toBe(true);
    }
  });
});
