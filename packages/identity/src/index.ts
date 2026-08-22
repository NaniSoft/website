/**
 * @nanisoft/identity — the "Living Map" brand system shared by both apps.
 *
 * Palette, shape lock, typography, motion, wordmark, and favicon for nanisoft
 * (SPEC §2). Consumed by the landing and the playground via `workspace:*`. The
 * package is plain TypeScript with no React/Next.js boundary: it exports data
 * (tokens, motion variants, SVG strings); each app renders it.
 *
 * Extensionless relative imports are required here — Turbopack/Next 16 does not
 * resolve `.js`→`.ts` inside a workspace package's source.
 */

/** Identity system version. Bumped when tokens change. */
export const IDENTITY_VERSION = '0.1.0';

// ── Tokens ────────────────────────────────────────────────────────────────────
export { color, role, surface, radius, EXCLUDED, font, easing, easingTuple } from './tokens';
export type { Hex } from './tokens';

// ── Motion ─────────────────────────────────────────────────────────────────────
export { breathe, traverse, ripple, settle, motion, MOTION_VARIANTS, MOTION_NAMES, withReducedMotion } from './motion';
export type { MotionKeyframe, MotionStyle, MotionVariant } from './motion';

// ── Wordmark + monogram ───────────────────────────────────────────────────────
export { wordmarkSvg, monogramSvg } from './wordmark';
export type { WordmarkOptions } from './wordmark';