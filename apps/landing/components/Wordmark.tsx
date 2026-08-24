'use client';

import { wordmarkSvg, surface, color } from '@nanisoft/identity';
import { useTheme } from './theme/ThemeProvider';

interface Props {
  /** Rendered height in px. Default 26 (nav/footer scale). */
  height?: number;
  /**
   * Which semantic surface the mark sits on — used as the mask color over the
   * native "i" dot so the ringed node blends into the background: page bg
   * (TopNav) or elevated bg (Footer).
   */
  band?: 'bg' | 'elevated';
  /**
   * Force a color mode for a surface that doesn't follow the page theme — e.g.
   * the hero is a dark petrol band in BOTH page modes, so it passes 'dark' to
   * render bone-on-petrol regardless of the resolved theme. Omit to track the
   * page theme (the default for TopNav/Footer).
   */
  mode?: 'light' | 'dark';
}

/**
 * The W1 "node + flow" wordmark, rendered inline from @nanisoft/identity.
 * Jade appears exactly once in the mark (the trailing live link); everything
 * else is petrol. A CSS rule in globals.css re-points the SVG <text> at
 * --font-satoshi so the mark renders in the loaded webfont.
 */
export function Wordmark({ height = 26, band = 'bg', mode }: Props) {
  const { resolved } = useTheme();
  // `mode` overrides the resolved page theme for forced-surface contexts (the
  // dark hero band); omitting it tracks the page theme as before.
  const effective = mode ?? resolved;
  const surf = effective === 'dark' ? surface.dark : surface.light;
  // SPEC §2 W1 is "the rest of the mark is petrol" — that presumes a bone
  // surface. On dark/petrol surfaces the mark inverts to bone (as the W3
  // monogram glyph does); jade stays the single accent either way.
  const ink = effective === 'dark' ? color.bone : color.petrol;
  return (
    <span
      className="wordmark"
      style={{ display: 'inline-flex', height }}
      dangerouslySetInnerHTML={{ __html: wordmarkSvg({ bg: surf[band], ink, height }) }}
    />
  );
}
