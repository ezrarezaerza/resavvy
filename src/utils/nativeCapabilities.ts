import { toast } from 'sonner';

export const triggerHaptic = () => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(50);
  }
};

export const nativeShare = async (title: string, url: string) => {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, url });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch (e) {
      toast.error('Failed to copy link');
    }
  }
};
