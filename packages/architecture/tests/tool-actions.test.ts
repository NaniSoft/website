import { describe, expect, it } from 'vitest';
import {
  authorSensitiveProductField,
  blankState,
  loadBronze,
  reduceToCursor,
  SENSITIVE_PRODUCT_VIEW_AUDIT,
} from '../src/index';

const STEPS = SENSITIVE_PRODUCT_VIEW_AUDIT;

describe('authorSensitiveProductField — SPEC §4.8 DataGerry canonical action', () => {
  it('adds Sensitive: bool to a drafted Product (3 fields → 4)', () => {
    const s = blankState();
    expect(s.schemaRegistry.Product.fields.map((f) => f.name)).toEqual(['id', 'name', 'owner_group']);
    authorSensitiveProductField(s);
    const sensitive = s.schemaRegistry.Product.fields.find((f) => f.name === 'Sensitive');
    expect(sensitive).toEqual({ name: 'Sensitive', type: 'bool' });
    expect(s.schemaRegistry.Product.fields).toHaveLength(4);
  });

  it('is idempotent (a second call adds no duplicate)', () => {
    const s = blankState();
    authorSensitiveProductField(s);
    authorSensitiveProductField(s);
    const sens = s.schemaRegistry.Product.fields.filter((f) => f.name === 'Sensitive');
    expect(sens).toHaveLength(1);
    expect(s.schemaRegistry.Product.fields).toHaveLength(4);
  });

  it('creates Product defensively if absent', () => {
    const s = blankState();
    s.schemaRegistry = {};
    authorSensitiveProductField(s);
    expect(s.schemaRegistry.Product.fields).toEqual([{ name: 'Sensitive', type: 'bool' }]);
  });

  it('is the same mutate step 1 applies (one code path)', () => {
    const s = reduceToCursor(STEPS, 1);
    const sens = s.schemaRegistry.Product.fields.find((f) => f.name === 'Sensitive');
    expect(sens).toEqual({ name: 'Sensitive', type: 'bool' });
  });
});

describe('loadBronze — SPEC §4.8 Airflow canonical action (ingest)', () => {
  it('loads Bronze from the in-browser source rows (2 products + 2 view-logs)', () => {
    const s = blankState();
    expect(s.bronze.products).toHaveLength(0);
    expect(s.bronze.viewLogs).toHaveLength(0);
    loadBronze(s);
    expect(s.bronze.products).toHaveLength(2);
    expect(s.bronze.viewLogs).toHaveLength(2);
    expect(s.bronze.products.map((p) => p.id)).toEqual(['P-1042', 'P-2210']);
  });

  it('is idempotent (a second call does not duplicate or grow Bronze)', () => {
    const s = blankState();
    loadBronze(s);
    loadBronze(s);
    expect(s.bronze.products).toHaveLength(2);
    expect(s.bronze.viewLogs).toHaveLength(2);
  });
});