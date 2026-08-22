'use client';
// FILE: src/context/theme/ThemeProvider.tsx
// Client theme context. In the Vite app this injected CSS vars at runtime; here the
// vars are static CSS (src/styles/theme-tokens.css) and this provider only toggles
// the `data-theme` attribute + persists the choice. The pre-hydration inline script
// in the root layout sets the initial attribute before paint (no FOUC — Risk 1).
// The storage key is unchanged ('jm-theme') so returning users keep their choice
// (D_impl_7).
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Mode = 'light' | 'dark';

interface ThemeCtx {
  mode: Mode;
  toggle: () => void;
  isDark: boolean;
}

export const THEME_STORAGE_KEY = 'jm-theme';

const Ctx = createContext<ThemeCtx>({ mode: 'light', toggle: () => {}, isDark: false });

function readInitialMode(): Mode {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('light');

  // Sync to whatever the pre-hydration script already resolved on <html>.
  useEffect(() => { setMode(readInitialMode()); }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    try { localStorage.setItem(THEME_STORAGE_KEY, mode); } catch { /* storage blocked */ }
  }, [mode]);

  const toggle = () => setMode((current) => (current === 'dark' ? 'light' : 'dark'));

  return (
    <Ctx.Provider value={{ mode, toggle, isDark: mode === 'dark' }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
