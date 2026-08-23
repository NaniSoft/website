import { expect, test, type Page } from '@playwright/test';

/**
 * Page-level horizontal-scroll law (responsiveness sweep): at every matrix
 * viewport, neither `document.scrollingElement` nor `document.documentElement`
 * may be wider than its own client width. The spine canvas pans inside its own
 * container (React Flow fitView) — internal panes are legal; widening the
 * DOCUMENT is not. Runs in the shared e2e setup (dev server on :3001).
 */

/** The plan's matrix: all breakpoint widths + landscape laptop (1366×768). */
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const PATHS = ['/', '/tokens'] as const;

interface Report {
  /** [scrollWidth, clientWidth] of scrollingElement and documentElement. */
  se: [number, number];
  de: [number, number];
  /** Diagnostic: unclipped elements poking past the viewport's right edge. */
  offenders: string[];
}

async function measure(page: Page): Promise<Report> {
  return page.evaluate(() => {
    const se = document.scrollingElement;
    const de = document.documentElement;
    const cw = de.clientWidth;

    // Diagnostics only — the assertions below carry the law. An element is
    // listed when it extends past the right edge and no ancestor clips it
    // back (overflow auto/scroll/hidden/clip), i.e. it can widen the document.
    const offenders: string[] = [];
    const isClipped = (el: Element): boolean => {
      for (let p: HTMLElement | null = el.parentElement; p; p = p.parentElement) {
        if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return true;
      }
      return false;
    };
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > cw + 0.5 && !isClipped(el)) {
        offenders.push(
          `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} right=${Math.round(r.right)}/${cw}`,
        );
      }
    }

    return {
      se: se ? [se.scrollWidth, se.clientWidth] : [-1, -1],
      de: [de.scrollWidth, de.clientWidth],
      offenders: offenders.slice(0, 8),
    };
  });
}

for (const vp of VIEWPORTS) {
  for (const path of PATHS) {
    test(`${path} @ ${vp.width}×${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const m = await measure(page);
      const where = `${path} @ ${vp.width}×${vp.height}`;
      const hint = m.offenders.length ? ` — offenders: ${m.offenders.join(' | ')}` : '';
      expect(m.de[0], `documentElement ${where}${hint}`).toBeLessThanOrEqual(m.de[1]);
      expect(m.se[0], `scrollingElement ${where}${hint}`).toBeLessThanOrEqual(m.se[1]);
    });
  }
}
