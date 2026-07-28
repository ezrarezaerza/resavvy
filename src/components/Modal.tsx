import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft } from 'lucide-react';
import gsap from 'gsap';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isMobile, setIsMobile] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = "hidden";
    } else if (shouldRender) {
      // Animate out
      const tl = gsap.timeline({ 
        onComplete: () => {
          setShouldRender(false);
          document.body.style.overflow = "";
        } 
      });

      if (isMobile) {
        tl.to(modalRef.current, { 
          yPercent: 100, 
          opacity: 0.9, 
          duration: 0.45, 
          ease: 'power3.inOut' 
        }, 0)
        .to(overlayRef.current, { 
          opacity: 0, 
          duration: 0.4 
        }, 0);
      } else {
        tl.to(modalRef.current, { 
          y: 20, 
          opacity: 0, 
          scale: 0.95, 
          duration: 0.25, 
          ease: 'power2.in' 
        }, 0)
        .to(overlayRef.current, { 
          opacity: 0, 
          duration: 0.2 
        }, 0);
      }
    }

    return () => {
      if (!isOpen && !shouldRender) {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, shouldRender, isMobile]);

  useEffect(() => {
    if (isOpen && shouldRender) {
      // Animate in
      if (isMobile) {
        gsap.fromTo(overlayRef.current, 
          { opacity: 0 }, 
          { opacity: 1, duration: 0.35, ease: 'power2.out' }
        );
        gsap.fromTo(modalRef.current, 
          { yPercent: 100, opacity: 0.9 }, 
          { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power4.out' }
        );
      } else {
        gsap.fromTo(overlayRef.current, 
          { opacity: 0 }, 
          { opacity: 1, duration: 0.2 }
        );
        gsap.fromTo(modalRef.current, 
          { y: 20, opacity: 0, scale: 0.95 }, 
          { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }
        );
      }
    }
  }, [isOpen, shouldRender, isMobile]);

  if (!shouldRender) return null;

  const modalContent = isMobile ? (
    // FULL-SCREEN MOBILE VIEW
    <div className="fixed inset-0 z-[100] flex flex-col pointer-events-auto bg-white dark:bg-gray-950 overflow-hidden">
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-white dark:bg-gray-950 z-0"
      />
      <div 
        ref={modalRef}
        className="relative z-10 w-full h-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden"
      >
        {/* Mobile Header */}
        <div className="flex items-center gap-4 px-6 pt-7 pb-4 shrink-0 border-b border-gray-100 dark:border-white/5">
          <button 
            onClick={onClose}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all cursor-pointer bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/5 flex items-center justify-center shadow-xs shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="font-heading font-black text-2xl tracking-tight text-gray-900 dark:text-white leading-tight truncate">
              {title}
            </h2>
          </div>
        </div>

        {/* Scrollable Children Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  ) : (
    // POLISHED DESKTOP DIALOG VIEW
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto p-4">
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        ref={modalRef}
        className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden z-[101] will-change-transform"
      >
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
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
