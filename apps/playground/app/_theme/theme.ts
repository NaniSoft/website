'use client';

import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from '@nanisoft/identity';

/**
 * Theme-mode store for the playground — a plain-module mirror of the landing's
 * `apps/landing/components/theme/ThemeProvider.tsx` contract (the playground
 * has no antd, so there is no context/provider, just the same external store):
 *
 *  - SAME storage key: `nanisoft-theme`, imported from @nanisoft/identity
 *    (a mode set in one app is honored by the other — per-origin, so subdomain
 *    deployments each start consistent but don't live-sync);
 *  - same values: 'light' | 'dark' | 'system', unset reads as 'system';
 *  - same fallback: the OS preference via matchMedia when mode is 'system';
 *  - same reflection: resolved mode onto `<html data-theme>` + inline
 *    color-scheme (ThemeSync keeps it reconciled; app/layout.tsx sets it
 *     pre-paint so there is no flash).
 *
 * Both stores are external to React (localStorage + matchMedia), so the React
 * 19 idiom is useSyncExternalStore — same reasoning as the landing provider.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

// THEME_STORAGE_KEY comes from @nanisoft/identity — the same constant the
// landing's ThemeProvider reads and both layouts' bootstrap scripts render.

// ── Stored mode ('light' | 'dark' | 'system') ────────────────────────────────

const themeListeners = new Set<() => void>();
function subscribeTheme(cb: () => void) {
  themeListeners.add(cb);
  return () => {
    themeListeners.delete(cb);
  };
}
function getThemeSnapshot(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null) ?? 'system';
}
function getThemeServerSnapshot(): ThemeMode {
  return 'system';
}

/** Persist the mode and notify every subscriber (all apps' components). */
export function setThemeMode(t: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, t);
  themeListeners.forEach((l) => l());
}

/** The stored mode ('system' until the user picks an explicit side). */
export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
}

// ── OS preference ────────────────────────────────────────────────────────────

function subscribeSystem(cb: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function getSystemSnapshot(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function getSystemServerSnapshot(): ResolvedTheme {
  return 'light';
}

// ── Resolution + reflection ─────────────────────────────────────────────────

/** Stored mode wins unless it is 'system'; then the OS preference decides. */
export function useResolvedTheme(): ResolvedTheme {
  const mode = useThemeMode();
  const system = useSyncExternalStore(subscribeSystem, getSystemSnapshot, getSystemServerSnapshot);
  return mode === 'system' ? system : mode;
}

/** Reflect a resolved mode onto <html> (same writes as the landing provider). */
export function applyDocumentTheme(resolved: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.style.colorScheme = resolved;
}
