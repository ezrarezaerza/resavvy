import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface SettingsContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  autoplay: boolean;
  setAutoplay: (autoplay: boolean) => void;
  dataSaver: boolean;
  setDataSaver: (dataSaver: boolean) => void;
  lowDataMode: boolean; // Keep for backward compatibility until fully refactored
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'resavvy_settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theme) return parsed.theme as Theme;
      }
    } catch {}
    return 'dark'; // Default value: 'dark'
  });

  const [autoplay, setAutoplay] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.autoplay === 'boolean') return parsed.autoplay;
      }
    } catch {}
    return true; // Default to true
  });

  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.dataSaver === 'boolean') return parsed.dataSaver;
        if (typeof parsed.lowDataMode === 'boolean') return parsed.lowDataMode; // migration check
      }
    } catch {}
    return true; // default true
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ theme, autoplay, dataSaver }));
    } catch {}
  }, [theme, autoplay, dataSaver]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  // Handle system theme updates
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      if (e.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <SettingsContext.Provider value={{ 
      theme, setTheme, 
      autoplay, setAutoplay, 
      dataSaver, setDataSaver,
      lowDataMode: dataSaver 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

