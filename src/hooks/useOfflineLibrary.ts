import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';

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
    const cacheKey = `resavvy_cache_${url}`;
    try {
      if (isOffline) throw new Error('Offline mode');
      
      const res = await fetch(url, options);
      if (res.ok && (!options || options.method === 'GET' || !options.method)) {
        const data = await res.clone().json();
        await set(cacheKey, data);
      }
      return res;
    } catch (error) {
      const cached = await get(cacheKey);
      if (cached) {
        return {
          ok: true,
          json: async () => cached
        } as Response;
      }
      throw error;
    }
  };

  return { isOffline, fetchWithOfflineFallback };
}
