import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, HardDrive, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { fetchOfflineCacheStats } from '../utils/offlineManager';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [cacheCount, setCacheCount] = useState<number>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  useEffect(() => {
    fetchOfflineCacheStats().then((stats) => {
      setCacheCount((stats.frequentCount || 0) + (stats.metadataCount || 0));
    });
  }, [isOnline]);

  if (isOnline) {
    return (
      <div className="relative inline-flex items-center">
        <div 
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">PWA Offline Sync Active</span>
        </div>
        {showTooltip && (
          <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl border border-white/10 z-50 pointer-events-none">
            Service worker caching active. Frequently played tracks & metadata available offline.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-fade-in shadow-xs">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode ({cacheCount} cached)</span>
    </div>
  );
}
