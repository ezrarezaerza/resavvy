import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'system';

export function useSettings() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = window.localStorage.getItem('resavvy_theme');
      return (saved as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('resavvy_dataSaver');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true; // default true
  });

  const [autoplay, setAutoplay] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem('resavvy_autoplay');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return false; // default false
  });

  // Keep in sync with native settings
  const [lowDataMode, setLowDataMode] = useState(false); // always false for images

  // Sync to localStorage and events to let other usages re-render
  const setTheme = (t: Theme) => {
    setThemeState(t);
    window.localStorage.setItem('resavvy_theme', t);
    window.dispatchEvent(new Event('resavvy_settings_update'));
  };

  const setDataSaverState = (val: boolean) => {
    setDataSaver(val);
    window.localStorage.setItem('resavvy_dataSaver', JSON.stringify(val));
    window.dispatchEvent(new Event('resavvy_settings_update'));
  };

  const setAutoplayState = (val: boolean) => {
    setAutoplay(val);
    window.localStorage.setItem('resavvy_autoplay', JSON.stringify(val));
    window.dispatchEvent(new Event('resavvy_settings_update'));
  };

  useEffect(() => {
    const handleUpdate = () => {
      setThemeState((window.localStorage.getItem('resavvy_theme') as Theme) || 'dark');
      try {
        const ds = window.localStorage.getItem('resavvy_dataSaver');
        if (ds !== null) {
            setDataSaver(JSON.parse(ds));
        }
      } catch {}
      try {
        const ap = window.localStorage.getItem('resavvy_autoplay');
        if (ap !== null) setAutoplay(JSON.parse(ap));
      } catch {}
    };

    window.addEventListener('resavvy_settings_update', handleUpdate);
    return () => window.removeEventListener('resavvy_settings_update', handleUpdate);
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      let activeTheme = theme;
      if (theme === 'system') {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        activeTheme = systemDark ? 'dark' : 'light';
      }

      if (activeTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  return {
    theme,
    setTheme,
    dataSaver,
    setDataSaver: setDataSaverState,
    autoplay,
    setAutoplay: setAutoplayState,
    lowDataMode, // backward compat
  };
}
