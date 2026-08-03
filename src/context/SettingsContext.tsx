import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SystemConfig {
  key: string;
  value: string;
}

export interface PromoBanner {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  title?: string;
  subtitle?: string;
  type?: 'spotlight' | 'ad';
  buttonText?: string;
  enableGradient?: boolean;
  tags?: string[];
  hideContent?: boolean;
}

interface SettingsContextType {
  lowDataMode: boolean;
  toggleLowDataMode: () => void;
  systemConfigs: SystemConfig[];
  isLoadingConfigs: boolean;
  refreshConfigs: () => Promise<void>;
  isMaintenanceMode: boolean;
  systemAlertBanner: string;
  maxSongsPerPlaylist: number;
  enableCommunityPosts: boolean;
  promoBanners: PromoBanner[];
  slideshowInterval: number;
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

  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState<boolean>(true);

  const refreshConfigs = async (retries = 5, delay = 1000) => {
    try {
      const res = await fetch('/api/auth?action=system-config');
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSystemConfigs(data);
            setIsLoadingConfigs(false);
            return;
          }
        } else {
          throw new Error('Response content-type is not JSON. Expected application/json.');
        }
      }
      throw new Error(`Response status: ${res.status}`);
    } catch (err) {
      if (retries > 0) {
        console.warn(`System config fetch failed, retrying in ${delay}ms... (${retries} retries left)`, err);
        await new Promise(resolve => setTimeout(resolve, delay));
        return refreshConfigs(retries - 1, delay * 1.5);
      }
      console.error('Failed to load global system configurations', err);
      setIsLoadingConfigs(false);
    }
  };

  useEffect(() => {
    refreshConfigs();
    
    // Poll for system configuration updates every 30 seconds to sync banners and maintenance state dynamically
    const interval = setInterval(() => refreshConfigs(0), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ lowDataMode }));
    } catch {
      // ignore
    }
  }, [lowDataMode]);

  const toggleLowDataMode = () => setLowDataMode(prev => !prev);

  // Derived helper values for simple component consumption
  const isMaintenanceMode = systemConfigs.find(c => c.key === "MAINTENANCE_MODE")?.value === "true";
  const systemAlertBanner = systemConfigs.find(c => c.key === "SYSTEM_ALERT_BANNER")?.value || "";
  const maxSongsPerPlaylist = parseInt(
    systemConfigs.find(c => c.key === "MAX_SONGS_PER_PLAYLIST")?.value || "100", 
    10
  );
  const enableCommunityPosts = systemConfigs.find(c => c.key === "ENABLE_COMMUNITY_POSTS")?.value !== "false";

  const slideshowInterval = parseInt(
    systemConfigs.find(c => c.key === "SYSTEM_PROMO_INTERVAL")?.value || "6", 
    10
  ) || 6;

  const promoBanners = React.useMemo<PromoBanner[]>(() => {
    const rawValue = systemConfigs.find(c => c.key === "SYSTEM_PROMO_BANNERS")?.value;
    if (!rawValue) return [];
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed.filter(b => b && b.imageUrl);
      }
    } catch (e) {
      console.error("Failed to parse SYSTEM_PROMO_BANNERS configuration:", e);
    }
    return [];
  }, [systemConfigs]);

  return (
    <SettingsContext.Provider value={{ 
      lowDataMode, 
      toggleLowDataMode,
      systemConfigs,
      isLoadingConfigs,
      refreshConfigs,
      isMaintenanceMode,
      systemAlertBanner,
      maxSongsPerPlaylist,
      enableCommunityPosts,
      promoBanners,
      slideshowInterval
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

