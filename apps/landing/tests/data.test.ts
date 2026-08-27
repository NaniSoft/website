import { describe, expect, it } from 'vitest';
import {
  BRAND,
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
  NAV,
  ABOUT,
} from '@/lib/data';

describe('data module', () => {
  it('brands as nanisoft with the positioning tagline', () => {
    expect(BRAND.name).toBe('nanisoft');
    expect(BRAND.tagline).toMatch(/digital twin of the IT estate/i);
  });

  it('carries no Sentinel/TrueAccess branding in any copy constant', () => {
    const dump = JSON.stringify([
      BRAND, PROBLEM_CARDS, PLATFORM_FLOW,
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
    expect(USE_CASES[0].title).toBe('Access traversal');
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

  it('labels every codename entry with the real wrapped product', () => {
    // The eight nanisoft codenames must carry the real OSS product they wrap
    // (sourced from @nanisoft/architecture); real-OSS entries may repeat name.
    const codenames = ['Trailhead', 'Forge', 'Bedrock', 'Overlook', 'Blueprint', 'Watchtower', 'Anchor', 'Conveyor'];
    for (const cn of codenames) {
      const p = STACK_PRODUCTS.find((s) => s.name === cn);
      expect(p, `missing ${cn}`).toBeDefined();
      expect(p?.realName, `${cn} missing realName`).toBeTruthy();
      expect(p?.realName).not.toBe(cn);
    }
    // Every entry has a realName (codename → real product; real-OSS → itself).
    for (const p of STACK_PRODUCTS) expect(typeof p.realName).toBe('string');
  });

  it('builds exactly four components in-house', () => {
    expect(BUILT_IN_HOUSE.map((c) => c.name)).toEqual([
      'Atlas', 'Compass', 'DataGerry Bridge', 'Scout',
    ]);
  });

  it('states the unmodified-OSS stance', () => {
    expect(INTEGRATIONS_NOTE).toMatch(/unmodified/i);
  });

  it('offers exactly one ask: open the playground', () => {
    expect(FINAL_CTA.h2).toBe('See the twin think.');
    expect(FINAL_CTA.primary).toEqual({
      label: 'Open the playground',
      href: 'https://playground.nanisoft.com',
    });
    // No secondary/demo field survives the reshape.
    expect(Object.keys(FINAL_CTA)).toEqual(['h2', 'primary', 'footnote']);
  });

  it('carries no demo or mailto ask anywhere in the copy constants', () => {
    const dump = JSON.stringify([
      BRAND, PROBLEM_CARDS, PLATFORM_FLOW,
      PLATFORM_FEATURES, USE_CASES, USE_CASES_MORE, STACK_PRODUCTS,
      BUILT_IN_HOUSE, INTEGRATIONS_NOTE, FINAL_CTA, FOOTER_LINKS,
    ]).toLowerCase();
    expect(dump.includes('demo')).toBe(false);
    expect(dump.includes('mailto')).toBe(false);
  });

  it('footer has only real destinations (no dead href="#")', () => {
    // Restructured to a single "Product" column: the three in-page section
    // anchors plus the external playground link. Labels that promised pages
    // the site never substantiates were removed.
    expect(Object.keys(FOOTER_LINKS)).toEqual(['Product']);
    for (const link of FOOTER_LINKS.Product) {
      expect(typeof link.href).toBe('string');
      expect(link.href.length).toBeGreaterThan(1);
      expect(link.href).not.toBe('#');
    }
    // The playground link is flagged external so the Footer opens it in a
    // new tab with rel="noopener noreferrer".
    const playground = FOOTER_LINKS.Product.find((l) => l.href.startsWith('http'));
    expect(playground?.external).toBe(true);
    expect(playground?.href).toBe('https://playground.nanisoft.com');
  });

  it('exposes a nav config with Product and Docs dropdowns plus three links', () => {
    expect(NAV.groups).toHaveLength(2);
    const [product, docs] = NAV.groups;
    expect(product.label).toBe('Product');
    expect(product.items.map((i) => i.label)).toEqual(['Platform', 'Use cases', 'Integrations']);
    for (const i of product.items) expect(i.href.startsWith('#')).toBe(true);
    expect(docs.label).toBe('Docs');
    expect(docs.items.map((i) => i.label)).toEqual(['Documentation', 'White papers']);
    expect(docs.items[0].href).toBe('https://docs.nanisoft.com');
    expect(docs.items[0].external).toBe(true);
    expect(docs.items[1].href).toBe('https://docs.nanisoft.com/white-papers');
    expect(docs.items[1].external).toBe(true);
    expect(NAV.links.map((l) => l.label)).toEqual(['Blog', 'About us', 'Contact us']);
    expect(NAV.links[0]).toMatchObject({ href: 'https://blog.nanisoft.com', external: true });
    expect(NAV.links[1]).toMatchObject({ href: '/about-us' });
    expect(NAV.links[2]).toMatchObject({ href: '/about-us#contact' });
  });

  it('keeps every nav href a real destination (no bare href="#")', () => {
    const all = [...NAV.groups.flatMap((g) => g.items), ...NAV.links];
    for (const i of all) expect(i.href).not.toBe('#');
    // In-page anchors are allowed (they resolve to kept homepage sections).
    for (const i of all) expect(i.href.length).toBeGreaterThan(1);
  });

  it('exposes about-us content with story, capabilities, and open-source sections', () => {
    expect(ABOUT.hero.title.length).toBeGreaterThan(0);
    expect(ABOUT.story.body.length).toBeGreaterThan(0);
    expect(ABOUT.capabilities.items.length).toBeGreaterThanOrEqual(3);
    for (const c of ABOUT.capabilities.items) {
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.body.length).toBeGreaterThan(0);
    }
    expect(ABOUT.openSource.body.length).toBeGreaterThan(0);
    expect(ABOUT.openSource.links.length).toBeGreaterThan(0);
  });

  it('carries no banned ask phrases in NAV or ABOUT copy', () => {
    const dump = JSON.stringify([NAV, ABOUT]).toLowerCase();
    expect(dump.includes('demo')).toBe(false);
    expect(dump.includes('mailto')).toBe(false);
  });
});
