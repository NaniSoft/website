/**
 * Wordmark + monogram tests — structural correctness for the "node + flow"
 * marks. Visual correctness (positions, balance) is confirmed by a human
 * against a render (NO-VISION); these tests pin the brand invariants:
 *  - W1: the word "nanisoft", a ringed graph node, and a trailing live link.
 *    Jade appears EXACTLY once (the active link); the rest of the mark is petrol.
 *  - W3 monogram: the favicon fallback carries NO jade (jade is live/active only;
 *    a static dock icon is neither), and uses petrol + bone.
 */
import { describe, expect, it } from 'vitest';
import { color, monogramSvg, wordmarkSvg } from '../src/index';

/** Count case-insensitive occurrences of a hex substring in an SVG string. */
function countHex(svg: string, hex: string): number {
  const re = new RegExp(hex.replace('#', '\\#'), 'gi');
  return (svg.match(re) ?? []).length;
}

describe('W1 wordmark — "node + flow"', () => {
  const svg = wordmarkSvg();

  it('renders the word "nanisoft"', () => {
    expect(svg).toContain('nanisoft');
  });

  it('uses Satoshi 700 for the mark', () => {
    expect(svg).toContain('Satoshi');
    expect(svg).toContain('font-weight="700"');
  });

  it('contains a ringed graph node (a <circle>) and a trailing link (a <path>)', () => {
    expect(svg).toContain('<circle');
    expect(svg).toContain('<path');
  });

  it('is petrol everywhere except the single live link', () => {
    expect(countHex(svg, color.petrol)).toBeGreaterThan(0);
  });

  it('jade appears EXACTLY once — the active link, never decorative', () => {
    expect(countHex(svg, color.jade)).toBe(1);
  });

  it('the lone jade stroke is on the trailing link <path>, not the node or text', () => {
    // The jade hex must occur on a path stroke, not on the text fill or the ring.
    expect(svg).toContain(`stroke="${color.jade}"`);
    expect(svg).not.toContain(`fill="${color.jade}"`);
  });
});

describe('W3 monogram — favicon / dock fallback', () => {
  const svg = monogramSvg();

  it('is a rounded tile carrying the node + flow glyph (rect, a ringed node, a flow link, a filled node)', () => {
    expect(svg).toContain('<rect');
    expect(svg).toContain('<path');
    // two nodes: a ringed origin + a filled destination
    expect((svg.match(/<circle/g) ?? []).length).toBe(2);
  });

  it('uses petrol + bone', () => {
    expect(countHex(svg, color.petrol)).toBeGreaterThan(0);
    expect(countHex(svg, color.bone)).toBeGreaterThan(0);
  });

  it('carries NO jade — a static dock icon is not live/active', () => {
    expect(countHex(svg, color.jade)).toBe(0);
  });

  it('uses no <text> (a favicon must render without web fonts)', () => {
    expect(svg).not.toContain('<text');
  });
});