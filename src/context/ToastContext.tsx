import React from 'react';
import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info';

export function useToast() {
  const addToast = (message: string, type: ToastType = 'info') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast.info(message);
    }
  };
  return { addToast };
}

// Dummy provider to not break existing imports from App.tsx
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
