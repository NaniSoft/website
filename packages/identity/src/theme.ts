/**
 * Cross-app theme contract — the pieces both apps must agree on byte for byte.
 *
 * The landing and the playground persist the user's mode under one localStorage
 * key and apply it pre-paint with the same inline script. Before this module
 * that key and script were duplicated as string literals in four places (each
 * app's `app/layout.tsx` + each app's theme store/provider); the contract lived
 * only in comments ("change both or neither"). Living here, the two can no
 * longer drift: every consumer interpolates or imports the same constant.
 *
 * Still framework-agnostic: this is plain data (a string key + a script
 * string), no React/Next.js boundary. The script shape follows Next 16's
 * "preventing flash before hydration" guide — synchronous inline `<script>` in
 * `<head>`, try/catch around storage access, `suppressHydrationWarning` on the
 * `<html>` element (the apps own that attribute).
 */

/**
 * The localStorage key holding the user's mode: 'light' | 'dark' | 'system'
 * (unset reads as 'system'). Shared across both apps so a mode picked in one
 * is honored by the other. NOTE: persistence is per-origin (localStorage is
 * not shared across origins) — subdomain deployments each start consistent,
 * but a change in one does not live-sync to the other.
 */
export const THEME_STORAGE_KEY = 'nanisoft-theme';

/**
 * The no-FOUC theme bootstrap, byte-identical in both apps by construction
 * (both layouts render this exact string; the key is interpolated from
 * THEME_STORAGE_KEY so the pair cannot drift). Runs synchronously during HTML
 * parsing: resolves the stored mode ('system' falls back to the OS preference
 * via matchMedia) and writes `<html data-theme>` + inline color-scheme before
 * first paint. Each app's theme store/provider keeps it reconciled after
 * hydration.
 */
export const themeBootstrapScript = `
  (function () {
    try {
      var saved = localStorage.getItem('${THEME_STORAGE_KEY}');
      var mode = saved || 'system';
      var resolved = mode === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : mode;
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.style.colorScheme = resolved;
    } catch (e) {}
  })();
`;
