import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import gsap from 'gsap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else if (shouldRender) {
      // Animate out
      const tl = gsap.timeline({ onComplete: () => setShouldRender(false) });
      tl.to(modalRef.current, { y: 20, opacity: 0, scale: 0.95, duration: 0.2, ease: 'power2.in' }, 0)
        .to(overlayRef.current, { opacity: 0, duration: 0.2 }, 0);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (isOpen && shouldRender) {
      // Animate in
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo(
        modalRef.current, 
        { y: 20, opacity: 0, scale: 0.95 }, 
        { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto p-4">
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        ref={modalRef}
        className="relative bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden z-[101]"
      >
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
