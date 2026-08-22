/**
 * Motion tests — the four principles exist, use the brand easing, animate only
 * transform/opacity, and the reduced-motion fallback returns a visible static
 * end-state with NO content removed.
 */
import { describe, expect, it } from 'vitest';
import {
  MOTION_NAMES,
  MOTION_VARIANTS,
  easing,
  motion,
  withReducedMotion,
  type MotionVariant,
} from '../src/index';

describe('four principles — breathe / traverse / ripple / settle', () => {
  it('are all present, keyed by name', () => {
    expect(Object.keys(motion).sort()).toEqual(['breathe', 'ripple', 'settle', 'traverse']);
  });

  it('MOTION_VARIANTS has exactly the four, in order', () => {
    expect(MOTION_VARIANTS).toHaveLength(4);
    expect(MOTION_NAMES).toEqual(['breathe', 'traverse', 'ripple', 'settle']);
    expect(MOTION_VARIANTS.map((v) => v.name)).toEqual(['breathe', 'traverse', 'ripple', 'settle']);
  });
});

describe('brand easing — every variant uses cubic-bezier(.32,.72,0,1)', () => {
  it('each variant transition references the brand easing', () => {
    for (const v of MOTION_VARIANTS) {
      expect(v.transition.easing).toBe(easing);
    }
  });
});

describe('animate only transform / opacity', () => {
  it('no keyframe touches layout or content properties', () => {
    for (const v of MOTION_VARIANTS) {
      for (const kf of v.keyframes) {
        const keys = Object.keys(kf).filter((k) => k !== 'offset');
        for (const k of keys) {
          expect(['transform', 'opacity']).toContain(k);
        }
      }
    }
  });
});

describe('reduced-motion fallback — static end-state, content never removed', () => {
  it('withReducedMotion returns a defined style for every variant', () => {
    for (const v of MOTION_VARIANTS) {
      const fallback = withReducedMotion(v);
      expect(fallback).toBeDefined();
      expect(typeof fallback).toBe('object');
    }
  });

  it('the fallback leaves content visible (opacity is 1, never 0)', () => {
    for (const v of MOTION_VARIANTS) {
      const fallback = withReducedMotion(v);
      expect(fallback.opacity).not.toBe(0);
      expect(fallback.opacity).toBe(1);
    }
  });

  it('the fallback never removes content (no display/visibility/content hiding)', () => {
    for (const v of MOTION_VARIANTS) {
      const fallback = withReducedMotion(v as MotionVariant);
      const keys = Object.keys(fallback);
      for (const k of keys) {
        expect(['transform', 'opacity']).toContain(k);
      }
      // explicitly: none of the content-removing properties are present
      expect(fallback).not.toHaveProperty('display');
      expect(fallback).not.toHaveProperty('visibility');
      expect(fallback).not.toHaveProperty('content');
    }
  });

  it('the fallback matches the variant declared endState', () => {
    for (const v of MOTION_VARIANTS) {
      expect(withReducedMotion(v)).toEqual(v.endState);
    }
  });
});