/**
 * Motion — the four nanisoft principles (SPEC §2 / ticket 03):
 * breathe / traverse / ripple / settle.
 *
 * Every variant animates ONLY `transform` and `opacity` (never width/height/
 * top/left), uses the single brand easing `cubic-bezier(.32,.72,0,1)`, and
 * carries a one-line motivation (motion must mean something — never "it looked
 * cool").
 *
 * `prefers-reduced-motion` is honored by `withReducedMotion(variant)`, which
 * returns the variant's static `endState`: the element is shown visible at rest
 * (opacity 1, a neutral transform) with NO content removed. The fallback never
 * touches `display`, `visibility`, or `content`, so reduced-motion users see
 * every piece of content, just still.
 *
 * The objects are plain data — usable as CSS @keyframes source or as motion-
 * library variant definitions. The package renders nothing itself.
 */

import { easing } from './tokens';

/** A single keyframe. `offset` is the 0..1 position; only transform/opacity animate. */
export interface MotionKeyframe {
  offset: number;
  transform?: string;
  opacity?: number;
}

/** A bag of CSS-like style properties. Only transform/opacity are used by variants. */
export interface MotionStyle {
  transform?: string;
  opacity?: number;
}

/** A reusable motion variant. */
export interface MotionVariant {
  name: 'breathe' | 'traverse' | 'ripple' | 'settle';
  keyframes: MotionKeyframe[];
  transition: { duration: number; easing: string; iterations?: number };
  /** Static end-state for the reduced-motion fallback. Always visible. */
  endState: MotionStyle;
  /** One sentence: what this motion communicates. */
  motivation: string;
}

// ── breathe ───────────────────────────────────────────────────────────────────
/** A slow ambient scale pulse — a node at rest that is visibly alive. */
export const breathe: MotionVariant = {
  name: 'breathe',
  keyframes: [
    { offset: 0, transform: 'scale(1)', opacity: 1 },
    { offset: 0.5, transform: 'scale(1.04)', opacity: 1 },
    { offset: 1, transform: 'scale(1)', opacity: 1 },
  ],
  transition: { duration: 4200, easing, iterations: Infinity },
  endState: { transform: 'scale(1)', opacity: 1 },
  motivation: 'Signals the system is live while idle (state: alive, not loading).',
};

// ── traverse ──────────────────────────────────────────────────────────────────
/** A wavefront indicator traveling along an edge — the active step advancing. */
export const traverse: MotionVariant = {
  name: 'traverse',
  keyframes: [
    { offset: 0, transform: 'translateX(0)', opacity: 1 },
    { offset: 1, transform: 'translateX(100%)', opacity: 1 },
  ],
  transition: { duration: 900, easing, iterations: Infinity },
  endState: { transform: 'translateX(0)', opacity: 1 },
  motivation: 'Storytelling: the wavefront flowing through the pipeline as a step advances.',
};

// ── ripple ────────────────────────────────────────────────────────────────────
/** A radial outward pulse from a point — the beckon that invites a click. */
export const ripple: MotionVariant = {
  name: 'ripple',
  keyframes: [
    { offset: 0, transform: 'scale(0.8)', opacity: 0 },
    { offset: 0.5, transform: 'scale(1)', opacity: 1 },
    { offset: 1, transform: 'scale(1.5)', opacity: 0 },
  ],
  transition: { duration: 600, easing, iterations: Infinity },
  endState: { transform: 'scale(1)', opacity: 1 },
  motivation: 'Feedback/attention: the active tool node pulses to invite interaction.',
};

// ── settle ────────────────────────────────────────────────────────────────────
/** A decelerating drop into place — content arriving and landing. */
export const settle: MotionVariant = {
  name: 'settle',
  keyframes: [
    { offset: 0, transform: 'translateY(-12px)', opacity: 0 },
    { offset: 1, transform: 'translateY(0)', opacity: 1 },
  ],
  transition: { duration: 500, easing },
  endState: { transform: 'translateY(0)', opacity: 1 },
  motivation: 'State transition: an element arriving at its resting place.',
};

/** All four variants, keyed by name. */
export const motion = { breathe, traverse, ripple, settle } as const;

/** The four variants in definition order. */
export const MOTION_VARIANTS: readonly MotionVariant[] = [breathe, traverse, ripple, settle];

/** Names of the four principles, in order. */
export const MOTION_NAMES = ['breathe', 'traverse', 'ripple', 'settle'] as const;

/**
 * The reduced-motion fallback: returns the variant's static `endState`. The
 * element is shown visible at rest; no content is removed (the result never
 * sets `display`, `visibility`, or `content`, and opacity is always 1).
 */
export function withReducedMotion(variant: MotionVariant): MotionStyle {
  return { ...variant.endState };
}