import { useRef } from 'react';
import { Music } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function EmptyState() {
  const iconRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(iconRef.current, 
      { y: -10 },
      { y: 10, yoyo: true, repeat: -1, ease: "sine.inOut", duration: 1.5 }
    );
  });

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div ref={iconRef} className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-400 dark:text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700">
        <Music className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">This group is empty</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        Paste a YouTube link above to add your first track.
      </p>
    </div>
  );
}
