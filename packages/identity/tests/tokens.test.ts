/**
 * Token tests — pin the SPEC §2 invariants: palette hexes, the jade-only-accent
 * rule, the excluded values (no purple/neon/pure-black/pure-white), the shape
 * lock (radii 20/12/pill), and the brand easing.
 */
import { describe, expect, it } from 'vitest';
import { color, easing, easingTuple, EXCLUDED, font, radius, role, surface } from '../src/index';

/** Convert a #rrggbb hex to { h: 0..360, s: 0..1, l: 0..1 }. */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`bad hex: ${hex}`);
  const n = m[1];
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

describe('palette — SPEC §2 hexes', () => {
  it('base = petrol + bone', () => {
    expect(color.petrol).toBe('#0C2A33');
    expect(color.bone).toBe('#F4EFE6');
    expect(role.base.dark).toBe(color.petrol);
    expect(role.base.light).toBe(color.bone);
  });

  it('secondary = teal', () => {
    expect(color.teal).toBe('#2A8C97');
    expect(role.secondary).toBe(color.teal);
  });

  it('accent = jade (single locked accent)', () => {
    expect(color.jade).toBe('#14A77A');
    expect(role.accent).toBe(color.jade);
  });
});

describe('jade-only-accent guard — jade is live/active only, never decorative', () => {
  it('jade is exposed only through the accent role', () => {
    expect(role.accent).toBe(color.jade);
    // jade is not a base or secondary role
    expect(role.base.dark).not.toBe(color.jade);
    expect(role.base.light).not.toBe(color.jade);
    expect(role.secondary).not.toBe(color.jade);
  });

  it('jade never appears as a surface (background/border/text) in either mode', () => {
    for (const mode of ['light', 'dark'] as const) {
      const s = surface[mode];
      for (const value of Object.values(s)) {
        expect(value).not.toBe(color.jade);
      }
    }
  });
});

describe('excluded values — no purple, no neon, no pure black, no pure white', () => {
  const palette = Object.values(color);

  it('no pure black and no pure white (off-black ink, off-white bone instead)', () => {
    for (const c of palette) {
      expect(c.toLowerCase()).not.toBe(EXCLUDED.pureBlack.toLowerCase());
      expect(c.toLowerCase()).not.toBe(EXCLUDED.pureWhite.toLowerCase());
    }
    // ink is a near-black petrol, not #000000
    expect(color.ink).not.toBe('#000000');
    // the lightest surface is bone, not #FFFFFF
    expect(color.boneElev).not.toBe('#FFFFFF');
  });

  it('no purple hue (255°..345°) unless the color is near-neutral', () => {
    for (const c of palette) {
      const { h, s } = hexToHsl(c);
      if (s < 0.15) continue; // neutrals (bone) are exempt
      expect(h < 255 || h > 345).toBe(true);
    }
  });

  it('no neon (oversaturated + high-lightness) colors', () => {
    for (const c of palette) {
      const { s, l } = hexToHsl(c);
      expect(s <= 0.9 || l <= 0.75).toBe(true);
    }
  });
});

describe('shape lock — SPEC §2', () => {
  it('card radius 20, inner radius 12', () => {
    expect(radius.card).toBe(20);
    expect(radius.inner).toBe(12);
  });

  it('buttons are pills', () => {
    expect(radius.pill).toBe(9999);
  });
});

describe('motion easing — cubic-bezier(.32,.72,0,1)', () => {
  it('exposes the brand easing as a CSS string', () => {
    expect(easing).toBe('cubic-bezier(.32,.72,0,1)');
  });

  it('exposes the same easing as a numeric tuple', () => {
    expect(easingTuple).toEqual([0.32, 0.72, 0, 1]);
  });
});

describe('typography — Satoshi voice + JetBrains Mono data, no serif', () => {
  it('voice is Satoshi (UI/body/headings)', () => {
    expect(font.voice).toContain('Satoshi');
  });

  it('data is JetBrains Mono (tables/query/logs/node labels)', () => {
    expect(font.data).toContain('JetBrains Mono');
  });

  it('neither family is a serif (sans-serif is allowed)', () => {
    // A bare `serif` family is banned; `sans-serif` is fine, so match "serif"
    // only when it is not preceded by the "-" of "sans-serif".
    const bareSerif = /(^|[^-])serif/i;
    expect(font.voice).not.toMatch(bareSerif);
    expect(font.data).not.toMatch(bareSerif);
  });
});