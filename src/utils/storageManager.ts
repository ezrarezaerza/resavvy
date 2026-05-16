import { get, clear } from 'idb-keyval';
import { toast } from 'sonner';

export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = (estimate.usage || 0) / (1024 * 1024);
    const quota = (estimate.quota || 0) / (1024 * 1024);
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;
    return { usage, quota, percentage };
  }
  return { usage: 0, quota: 0, percentage: 0 };
}

export async function exportLibrary() {
  try {
    const libraryData = await get('resavvy_library');
    if (!libraryData) {
      toast.error('No library data found to export');
      return;
    }
    const jsonStr = JSON.stringify(libraryData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resavvy_export.json';
    a.click();
    
    URL.revokeObjectURL(url);
    toast.success('Library exported successfully');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export library');
  }
}

export async function clearAppCache() {
  try {
    await clear();
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    toast.success('Cache cleared, reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('Clear cache error:', error);
    toast.error('Failed to clear cache');
  }
}
