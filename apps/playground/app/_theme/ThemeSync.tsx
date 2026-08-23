'use client';

import { useEffect } from 'react';
import { applyDocumentTheme, useResolvedTheme } from './theme';

/**
 * App-wide theme reconciler — the playground's stand-in for the landing's
 * ThemeProvider reflection effect. Rendered once in app/layout.tsx; renders
 * nothing. Keeps `<html data-theme>` + color-scheme in sync with the resolved
 * mode whenever it changes (toggle, OS-preference drift while mode='system'),
 * and re-applies after React's dev StrictMode remount resets <html>
 * (see next/dist/docs "preventing flash before hydration" → re-applying
 * attributes in development). The inline script in layout.tsx handles the
 * flash-free first paint before this runs.
 */
export function ThemeSync() {
  const resolved = useResolvedTheme();
  useEffect(() => {
    applyDocumentTheme(resolved);
  }, [resolved]);
  return null;
}
