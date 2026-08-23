import { describe, expect, it } from 'vitest';
import {
  BRAND,
  HERO,
  CUSTOMER_LOGOS,
  PROBLEM_CARDS,
  PLATFORM_FLOW,
  PLATFORM_FEATURES,
  USE_CASES,
  USE_CASES_MORE,
  STACK_PRODUCTS,
  BUILT_IN_HOUSE,
  INTEGRATIONS_NOTE,
  FINAL_CTA,
  FOOTER_LINKS,
} from '@/lib/data';

describe('data module', () => {
  it('brands as nanisoft with the positioning tagline', () => {
    expect(BRAND.name).toBe('nanisoft');
    expect(BRAND.tagline).toMatch(/digital twin of the IT estate/i);
  });

  it('carries no Sentinel/TrueAccess branding in any copy constant', () => {
    const dump = JSON.stringify([
      BRAND, HERO, CUSTOMER_LOGOS, PROBLEM_CARDS, PLATFORM_FLOW,
      PLATFORM_FEATURES, USE_CASES, USE_CASES_MORE, STACK_PRODUCTS,
      BUILT_IN_HOUSE, INTEGRATIONS_NOTE, FINAL_CTA, FOOTER_LINKS,
    ]);
    expect(dump.includes('Sentinel')).toBe(false);
    expect(dump.includes('TrueAccess')).toBe(false);
  });

  it('frames what-it-is around the digital twin and its datalake', () => {
    const dump = JSON.stringify(PROBLEM_CARDS);
    expect(dump).toMatch(/nodes/i);
    expect(dump).toMatch(/edges/i);
    expect(dump).toMatch(/first use-case/i);
  });

  it('walks the datalake path Bronze -> Silver -> Gold -> serve', () => {
    expect(PLATFORM_FLOW).toHaveLength(4);
    expect(PLATFORM_FLOW[0].body).toContain('Bronze');
    expect(PLATFORM_FLOW[1].body).toContain('Silver');
    expect(PLATFORM_FLOW[2].body).toContain('Gold');
    expect(PLATFORM_FLOW[3].body).toContain('Atlas');
  });

  it('introduces codenames naturally across the how-we-build features', () => {
    const dump = JSON.stringify(PLATFORM_FEATURES);
    for (const name of ['Trailhead', 'Watchtower', 'Anchor', 'Conveyor']) {
      expect(dump).toContain(name);
    }
  });

  it('leads what-it-unlocks with the access-traversal flagship', () => {
    expect(USE_CASES).toHaveLength(3);
    expect(USE_CASES[0].title).toContain('Sensitive Product View Audit');
    expect(USE_CASES[0].status).toBe('available');
    expect(USE_CASES.slice(1).every((u) => u.status === 'planned')).toBe(true);
  });

  it('points more-use-cases at the playground', () => {
    expect(USE_CASES_MORE.cta.href).toBe('https://playground.nanisoft.com');
  });

  it('composes sixteen off-the-shelf products, each with a role', () => {
    expect(STACK_PRODUCTS).toHaveLength(16);
    for (const p of STACK_PRODUCTS) expect(p.role.length).toBeGreaterThan(0);
  });

  it('builds exactly four components in-house', () => {
    expect(BUILT_IN_HOUSE.map((c) => c.name)).toEqual([
      'Atlas', 'Compass', 'DataGerry Bridge', 'Scout',
    ]);
  });

  it('states the unmodified-OSS stance', () => {
    expect(INTEGRATIONS_NOTE).toMatch(/unmodified/i);
  });

  it('points the primary CTA at the playground and keeps a demo request', () => {
    expect(FINAL_CTA.primary.href).toBe('https://playground.nanisoft.com');
    expect(FINAL_CTA.secondary.label.toLowerCase()).toContain('demo');
  });

  it('hero has a primary CTA', () => {
    expect(HERO.primaryCta.label).toBeTruthy();
  });

  it('footer has 4 link columns', () => {
    expect(Object.keys(FOOTER_LINKS)).toHaveLength(4);
  });
});
