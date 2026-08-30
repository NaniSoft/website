/**
 * Identity tokens — the nanisoft "Living Map" palette, shape lock, typography,
 * and motion easing.
 *
 * This module is the single source of truth for the brand values. Both apps
 * consume it verbatim (no app redefines a hex). The package stays
 * framework-agnostic: it exports plain data, the apps render it.
 *
 * Invariants encoded here and asserted in `tests/tokens.test.ts`:
 *  - Base = petrol + bone. Secondary = teal. Accent = jade, and jade is the
 *    ONLY accent — it is reserved for the live/active wavefront (active edge,
 *    active link) and never used decoratively.
 *  - Content ON a jade fill pairs it with petrol (role.onAccent, ~4.9:1 in
 *    both modes) — never bone, which fails light mode at ~2.7:1.
 *  - Excluded: no purple, no neon, no pure black (#000000), no pure white
 *    (#FFFFFF). Ink is a near-black petrol; the lightest surface is bone, not
 *    white.
 *  - Shape lock: card radius 20, inner radius 12, buttons are pills.
 *  - Motion easing: cubic-bezier(.32,.72,0,1).
 */

/** A CSS hex color string. */
export type Hex = `#${string}`;

// ── Color primitives ──────────────────────────────────────────────────────────
/**
 * The raw palette. Petrol is the dark base (backgrounds in dark mode, text on
 * bone in light mode); bone is the warm off-white light base. Teal is the
 * blue-green secondary (done edges). Jade is the single green accent — live /
 * active only.
 */
export const color = {
  // Petrol family — the dark base.
  petrol: '#0C2A33', // deep petrol: dark backgrounds, text on bone
  petrolMid: '#15414A', // elevated surface on petrol
  petrolDeep: '#08222A', // sunken / darkest petrol
  petrolSoft: '#3C6770', // muted petrol: borders + secondary marks on bone
  petrolTint: '#8FB0B6', // muted text on petrol (dark surfaces)
  // Bone family — the light base (never pure white).
  bone: '#F4EFE6', // warm off-white: light backgrounds
  boneElev: '#FBF7EF', // elevated light surface (near-white, not #FFFFFF)
  boneSunken: '#EAE2D3', // sunken light surface / hairline borders
  // Secondary + accent.
  teal: '#2A8C97', // secondary: blue-teal (done edges, supporting marks)
  jade: '#14A77A', // accent: jade — live/active wavefront ONLY, never decorative
  // Ink — near-black petrol for body text on bone (NOT pure black).
  ink: '#102A30',
  inkMuted: '#4A5E64', // muted body text on bone
} as const satisfies Record<string, Hex>;

/**
 * Semantic color roles. Jade is exposed ONLY through `accent` — there is no
 * base/secondary/border/text role that resolves to jade, which is what makes
 * the "jade is reserved for the live/active edge" rule enforceable.
 */
export const role = {
  base: { dark: color.petrol, light: color.bone },
  secondary: color.teal,
  accent: color.jade,
  /**
   * Foreground for content sitting ON an accent (jade) fill — Run buttons,
   * active chips, status pills. Jade is mid-luminance, so bone fails on it
   * in light mode (~2.7:1); the deep petrol base reads on jade at ~4.9:1 in
   * BOTH modes (WCAG AA normal text), so this pairing is mode-invariant by
   * design. Pinned by a computed WCAG ratio test in tests/tokens.test.ts
   * (identity decision 2026-08-24).
   */
  onAccent: color.petrol,
} as const;

/**
 * Surface tokens for light and dark modes, derived from petrol/bone/teal/jade.
 * Jade is intentionally absent from every surface — the accent never becomes a
 * background, border, or text color.
 */
export const surface = {
  light: {
    bg: color.bone,
    elevated: color.boneElev,
    sunken: color.boneSunken,
    border: color.boneSunken,
    text: color.ink,
    textMuted: color.inkMuted,
  },
  dark: {
    bg: color.petrol,
    elevated: color.petrolMid,
    sunken: color.petrolDeep,
    border: color.petrolSoft,
    text: color.bone,
    textMuted: color.petrolTint,
  },
} as const;

// ── Shape lock ────────────────────────────────────────────────────────────────
/**
 * One corner-radius system for the whole brand. Cards use 20, inner elements
 * 12, and buttons are full pills. Mixed systems are banned (SPEC §2 shape lock).
 */
export const radius = {
  card: 20,
  inner: 12,
  pill: 9999, // buttons are pills
} as const;

// ── Excluded values ────────────────────────────────────────────────────────────
/**
 * Forbidden raw values. Pure black and pure white are never used (off-black ink,
 * off-white bone instead). Purple and neon are guarded by hue/saturation checks
 * in the tests rather than a fixed list.
 */
export const EXCLUDED = {
  pureBlack: '#000000',
  pureWhite: '#FFFFFF',
} as const;

// ── Typography ────────────────────────────────────────────────────────────────
/**
 * Two families, no serif. Satoshi is the voice (UI / body / headings); JetBrains
 * Mono is the twin's data (tables / query / logs / node labels). Emphasis is
 * italic of the same family — never a swapped-in serif. The `var(--font-*)`
 * hooks are populated by each app's font loader (next/font); the literal
 * fallbacks keep tokens meaningful without a loader present.
 */
export const font = {
  /** Satoshi — the voice: UI, body copy, headings. */
  voice: "var(--font-satoshi), 'Satoshi', system-ui, -apple-system, sans-serif",
  /** JetBrains Mono — the twin's data: tables, query, logs, node labels. */
  data: "var(--font-mono), 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace",
} as const;

// ── Motion easing ─────────────────────────────────────────────────────────────
/** The single brand easing curve, shared by all four motion variants. */
export const easing = 'cubic-bezier(.32,.72,0,1)' as const;

/** The same easing as a numeric tuple for motion libraries that take arrays. */
export const easingTuple = [0.32, 0.72, 0, 1] as const;

// ── Version ───────────────────────────────────────────────────────────────────
/** Identity system version. Bumped when tokens change. */
export const IDENTITY_VERSION = '0.2.0';