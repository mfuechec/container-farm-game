/**
 * Theme Context for Side Hustle Simulator
 * 
 * Provides theme values throughout the app via React Context.
 * Supports light/dark mode with persistence to localStorage.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Theme, lightTheme, darkTheme } from './themes';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'shs-theme';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    }
    return defaultTheme;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // Update document background when theme changes
  useEffect(() => {
    const theme = mode === 'dark' ? darkTheme : lightTheme;
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme: mode === 'dark' ? darkTheme : lightTheme,
    isDark: mode === 'dark',
    toggleTheme: () => setMode(m => m === 'dark' ? 'light' : 'dark'),
    setTheme: setMode,
  }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme values
 * 
 * Usage:
 * ```tsx
 * const { theme, isDark, toggleTheme } = useTheme();
 * 
 * <div style={{ background: theme.surface, color: theme.text }}>
 *   Content
 * </div>
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to get just the theme object (slightly more convenient)
 */
export function useThemeColors(): Theme {
  const { theme } = useTheme();
  return theme;
}
