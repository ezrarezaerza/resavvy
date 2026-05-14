import React, { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div 
        ref={containerRef}
        className="fixed bottom-24 right-4 z-[70] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <ToastMessage key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastMessageProps {
  toast: Toast;
  onRemove: () => void;
}

const ToastMessage: React.FC<ToastMessageProps> = ({ toast, onRemove }) => {
  const elRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!elRef.current) return;
    
    // Entrance
    gsap.fromTo(elRef.current, 
      { x: 100, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
    );

    // Give it time to display then exit animation is handled by unmounting but we can add a slight pre-unmount animation if we wanted.
    // However, the unmount happens from setTimeout in Provider. A better approach is to animate out right before remove limit, but simple is fine based on prompt.
  }, []);

  const bgStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-indigo-600 text-white'
  };

  return (
    <div 
      ref={elRef}
      className={`px-4 py-3 rounded-lg shadow-lg font-medium text-sm flex items-center justify-between min-w-[250px] pointer-events-auto ${bgStyles[toast.type]}`}
    >
      <span>{toast.message}</span>
      <button onClick={onRemove} className="ml-4 opacity-70 hover:opacity-100 transition-opacity">
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
