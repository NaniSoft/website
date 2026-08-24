'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { ConfigProvider } from 'antd';
import { THEME_STORAGE_KEY } from '@nanisoft/identity';
import { lightTheme, darkTheme } from './tokens';

type ThemeMode = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  resolved: Resolved;
  setTheme: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The shared cross-app key lives in @nanisoft/identity (THEME_STORAGE_KEY) —
// the playground's theme store reads the same constant.
const STORAGE_KEY = THEME_STORAGE_KEY;

// Theme mode lives in localStorage; the OS preference lives in matchMedia. Both
// are external stores, so the React 19 idiom is useSyncExternalStore — this
// avoids the setState-in-effect anti-pattern (the previous version read
// localStorage in a mount effect). The inline script in layout.tsx still sets
// data-theme before hydration for a flash-free first paint; the effect below
// reconciles it with React state afterwards.

const themeListeners = new Set<() => void>();
function subscribeTheme(cb: () => void) {
  themeListeners.add(cb);
  return () => {
    themeListeners.delete(cb);
  };
}
function getThemeSnapshot(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system';
}
function getThemeServerSnapshot(): ThemeMode {
  return 'system';
}

function subscribeSystem(cb: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function getSystemSnapshot(): Resolved {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function getSystemServerSnapshot(): Resolved {
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const system = useSyncExternalStore(subscribeSystem, getSystemSnapshot, getSystemServerSnapshot);
  const resolved: Resolved = theme === 'system' ? system : theme;

  // Reflect the resolved theme onto <html>. This only writes to an external
  // system (the DOM) — no setState — so it's rule-safe.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);

  const setTheme = useCallback((t: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, t);
    themeListeners.forEach((l) => l());
  }, []);

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={resolved === 'dark' ? darkTheme : lightTheme}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}