import { useState, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';
import { toast } from 'sonner';

export async function clearOfflineCache() {
  await del('resavvy_library');
}

export function useOfflineLibrary() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Back online');
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast.error('You are offline. Showing cached library.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchWithOfflineFallback = async (url: string, options?: RequestInit) => {
    // We prioritize network. If network fails, we fall back to cache.
    // Specially handle /api/songs or general cache key 'resavvy_library'
    const cacheKey = url.includes('/api/songs') || url.includes('/api/playlists') ? 'resavvy_library' : `resavvy_cache_${url}`;
    
    try {
      if (isOffline) throw new Error('Offline mode');
      
      const res = await fetch(url, options);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (!options || options.method === 'GET' || !options.method) {
        const data = await res.clone().json();
        await set(cacheKey, data);
      }
      return res;
    } catch (error) {
      if (!options || options.method === 'GET' || !options.method) {
        const cached = await get(cacheKey);
        if (cached) {
          return {
            ok: true,
            json: async () => cached
          } as Response;
        }
      }
      throw error;
    }
  };

  return { isOffline, fetchWithOfflineFallback };
}
