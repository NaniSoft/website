/**
 * Wordmark + monogram — the nanisoft "node + flow" identity marks (SPEC §2).
 *
 *  - W1 "node + flow": the wordmark in Satoshi 700. The "i" dot is replaced by a
 *    ringed graph node (petrol) with a trailing live link. Jade is reserved for
 *    that single live link only — the rest of the mark is petrol. So jade
 *    appears EXACTLY once in W1 (the active link) and never in the monogram.
 *  - W3 monogram: the favicon / dock fallback. Static mark — jade is the
 *    live/active accent and a dock icon is neither, so the monogram carries no
 *    jade (petrol tile + bone node-and-flow motif).
 *
 * Both builders return raw SVG strings (framework-agnostic); the apps render
 * them inline (wordmark) or write them to `app/icon.svg` (favicon).
 *
 * NO-VISION note: the node/link positions are tuned by eye against a render and
 * confirmed by a human. `iX` is exposed so a one-number nudge re-positions the
 * "i" node without touching the rest of the mark.
 */

import { color, type Hex } from './tokens';

export interface WordmarkOptions {
  /** Background hex the mark sits on; used to mask the font's native "i" dot. */
  bg?: Hex;
  /** Render height in px (viewBox height ≈ height * 1.25). Default 56. */
  height?: number;
  /** X center of the "i" node, tuned against a render. Default 118. */
  iX?: number;
}

/**
 * The W1 wordmark SVG. Petrol "nanisoft" in Satoshi 700; the "i" dot becomes a
 * ringed graph node with a trailing live (jade) link. Jade appears once.
 */
export function wordmarkSvg(options: WordmarkOptions = {}): string {
  const bg = options.bg ?? color.bone;
  const height = options.height ?? 56;
  const iX = options.iX ?? 118;
  const baseline = Math.round(height * 1.04);
  const width = Math.round(height * 5.0);

  // Mask the font's native "i" dot with the background, then draw the ringed
  // node (petrol) and the single trailing live link (jade).
  const nodeR = Math.round(height * 0.14);
  const nodeY = Math.round(height * 0.27);
  const linkEndX = iX + Math.round(height * 0.5);

  return `<svg viewBox="0 0 ${width} ${baseline}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="nanisoft">
  <text x="0" y="${baseline - Math.round(height * 0.06)}" font-family="'Satoshi', system-ui, sans-serif" font-weight="700" font-size="${height}" fill="${color.petrol}" letter-spacing="-0.01em">nanisoft</text>
  <circle cx="${iX}" cy="${nodeY}" r="${nodeR + 2}" fill="${bg}"/>
  <circle cx="${iX}" cy="${nodeY}" r="${nodeR}" fill="none" stroke="${color.petrol}" stroke-width="${Math.max(2, Math.round(height * 0.045))}"/>
  <path d="M ${iX + nodeR} ${nodeY - 2} Q ${(iX + linkEndX) / 2} ${nodeY - Math.round(height * 0.12)} ${linkEndX} ${nodeY - Math.round(height * 0.04)}" fill="none" stroke="${color.jade}" stroke-width="${Math.max(2, Math.round(height * 0.04))}" stroke-linecap="round"/>
</svg>`;
}

/**
 * The W3 monogram SVG (favicon / dock fallback). A petrol rounded tile carrying
 * the "node + flow" glyph: a ringed graph node, a flow link, and a filled
 * destination node. Pure geometry (no `<text>`) so it renders crisply as a
 * favicon at 16px where web fonts are unavailable. Static — no jade (jade is
 * the live/active accent only; a dock icon is neither).
 */
export function monogramSvg(size: number = 32): string {
  const r = Math.round(size * 0.22); // proportionate to the shape lock (rounded tile)
  const stroke = Math.max(1.5, Math.round(size * 0.07));
  const aX = Math.round(size * 0.32); // ringed origin node
  const aY = Math.round(size * 0.4);
  const aR = Math.round(size * 0.15);
  const bX = Math.round(size * 0.72); // filled destination node
  const bY = Math.round(size * 0.26);
  const bR = Math.round(size * 0.085);
  const qX = Math.round(size * 0.5); // flow-link control point
  const qY = Math.round(size * 0.18);
  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="nanisoft monogram">
  <rect width="${size}" height="${size}" rx="${r}" fill="${color.petrol}"/>
  <path d="M ${aX + aR} ${aY - 1} Q ${qX} ${qY} ${bX - bR} ${bY}" fill="none" stroke="${color.bone}" stroke-width="${stroke}" stroke-linecap="round"/>
  <circle cx="${aX}" cy="${aY}" r="${aR}" fill="none" stroke="${color.bone}" stroke-width="${stroke}"/>
  <circle cx="${bX}" cy="${bY}" r="${bR}" fill="${color.bone}"/>
</svg>`;
}