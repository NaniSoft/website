/**
 * Theme-contract tests — pin the cross-app pieces: ONE storage key for both
 * apps, and a bootstrap script that is self-contained (try/catch IIFE), reads
 * exactly that key, resolves 'system' against the OS preference, and reflects
 * the resolved mode onto <html> before first paint.
 */
import { describe, expect, it } from 'vitest';
import { THEME_STORAGE_KEY, themeBootstrapScript } from '../src/index';

describe('theme storage key — shared across both apps', () => {
  it('is the nanisoft-theme key', () => {
    expect(THEME_STORAGE_KEY).toBe('nanisoft-theme');
  });

  it('is the exact key the bootstrap script reads (cannot drift)', () => {
    expect(themeBootstrapScript).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`);
  });
});

describe('no-FOUC bootstrap script', () => {
  it('fails soft when storage/matchMedia are unavailable (guarded IIFE)', () => {
    expect(themeBootstrapScript.trim().startsWith('(function () {')).toBe(true);
    expect(themeBootstrapScript).toContain('try {');
    expect(themeBootstrapScript).toContain('} catch (e) {}');
  });

  it("treats unset as 'system' and falls back to the OS preference", () => {
    expect(themeBootstrapScript).toContain("saved || 'system'");
    expect(themeBootstrapScript).toContain("'(prefers-color-scheme: dark)'");
  });

  it('reflects the resolved mode onto <html> pre-paint (data-theme + color-scheme)', () => {
    expect(themeBootstrapScript).toContain("setAttribute('data-theme', resolved)");
    expect(themeBootstrapScript).toContain('style.colorScheme = resolved');
  });
});
