import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { theme } from './theme';
import blueTheme from './blueTheme';
import hyperliquidTheme from './hyperliquidTheme';
import binanceTheme from './binanceTheme';
import bybitTheme from './bybitTheme';
import deribitTheme from './deribitTheme';
import gateTheme from './gateTheme';
import asterTheme from './asterTheme';
import bip01Theme from './bip01Theme';
import ogTheme from './OgTheme';

// Central registry of available themes (kept DRY)
const THEMES = {
  dark: theme,
  blue: blueTheme,
  binance: binanceTheme,
  bybit: bybitTheme,
  hyperliquid: hyperliquidTheme,
  deribit: deribitTheme,
  gate: gateTheme,
  aster: asterTheme,
  bip01: bip01Theme,
  og: ogTheme,
};

const VALID_THEMES = Object.keys(THEMES);

const ThemeContext = createContext({
  currentTheme: 'dark',
  theme: null,
  toggleTheme: () => {},
  setTheme: () => {},
  isLoading: true,
});

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context || context.theme === null) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);

  // Get theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    const validThemes = VALID_THEMES;

    if (savedTheme && validThemes.includes(savedTheme)) {
      setCurrentTheme(savedTheme);
    }
    setIsLoading(false);
  }, []);

  // Save theme to localStorage and set data-theme attribute when it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('app-theme', currentTheme);
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
  }, [currentTheme, isLoading]);

  const toggleTheme = () => {
    // Light theme removed; keep or switch among dark variants only. Default to dark.
    setCurrentTheme('dark');
  };

  const setTheme = (themeName) => {
    const validThemes = VALID_THEMES;

    if (validThemes.includes(themeName)) {
      setCurrentTheme(themeName);
    }
  };

  const getCurrentTheme = () => THEMES[currentTheme] ?? theme;

  const value = useMemo(
    () => ({
      currentTheme,
      theme: getCurrentTheme(),
      toggleTheme,
      setTheme,
      isLoading,
    }),
    [currentTheme, isLoading]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export default ThemeContext;
