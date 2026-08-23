import { describe, expect, it } from 'vitest';
import {
  BRAND,
  HERO,
  CUSTOMER_LOGOS,
  PROBLEM_CARDS,
  PLATFORM_FLOW,
  PLATFORM_FEATURES,
  USE_CASES,
  INTEGRATIONS,
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
      PLATFORM_FEATURES, USE_CASES, INTEGRATIONS, FINAL_CTA, FOOTER_LINKS,
    ]);
    expect(dump.includes('Sentinel')).toBe(false);
    expect(dump.includes('TrueAccess')).toBe(false);
  });

  it('has 16 named integrations plus the "and 40 more" slot is rendered in the component', () => {
    expect(INTEGRATIONS).toHaveLength(16);
  });

  it('has 3 use cases', () => {
    expect(USE_CASES).toHaveLength(3);
  });

  it('hero has a primary CTA', () => {
    expect(HERO.primaryCta.label).toBeTruthy();
  });

  it('footer has 4 link columns', () => {
    expect(Object.keys(FOOTER_LINKS)).toHaveLength(4);
  });
});
