import { toast } from 'sonner';

export async function exportLibrary() {
  try {
    const token = localStorage.getItem('resavvy_token');
    const res = await fetch('/api/playlists', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch library');
    const libraryData = await res.json();
    
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

