import React from 'react';
import { Home, Compass, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  activeGroupId: string | null;
  onSelect: (id: string | null) => void;
  onCreatePlaylist: () => void;
}

export function MobileBottomNav({ activeGroupId, onSelect, onCreatePlaylist }: MobileBottomNavProps) {
  const { user } = useAuth();
  
  return (
    <nav className="fixed bottom-0 w-full z-50 md:hidden bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-t border-gray-200 dark:border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-2">
        <button
          onClick={() => onSelect(null)}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] uppercase font-medium tracking-wide transition-colors ${
            activeGroupId === null ? 'text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>
        <button
          onClick={onCreatePlaylist}
          className="flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] uppercase font-medium tracking-wide transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Plus className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <span>New Playlist</span>
        </button>
        <button
          onClick={() => onSelect('discovery')}
          className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] uppercase font-medium tracking-wide transition-colors ${
            activeGroupId === 'discovery' ? 'text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Discover</span>
        </button>
      </div>
    </nav>
  );
}
