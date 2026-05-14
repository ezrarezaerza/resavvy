import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  lowDataMode: boolean;
  toggleLowDataMode: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'resavvy_settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [lowDataMode, setLowDataMode] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.lowDataMode ?? true;
      }
    } catch {
      // ignore
    }
    return true; // default true
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ lowDataMode }));
    } catch {
      // ignore
    }
  }, [lowDataMode]);

  const toggleLowDataMode = () => setLowDataMode(prev => !prev);

  return (
    <SettingsContext.Provider value={{ lowDataMode, toggleLowDataMode }}>
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
