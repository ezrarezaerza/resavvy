import React, { useEffect, useState } from "react";
import { Menu, AudioLines, Share2 } from "lucide-react";
import { nativeShare } from "../utils/nativeCapabilities";

interface MobileHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  onLogoClick: () => void;
  activePlaylistId?: string;
}

export function MobileHeader({ onMenuClick, isSidebarOpen, onLogoClick, activePlaylistId }: MobileHeaderProps) {
  const [urlPlaylistId, setUrlPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    // Check if the current URL path includes /playlist/ or /p/
    const path = window.location.pathname;
    let extractedId = null;
    if (path.includes('/p/')) {
        extractedId = path.split('/p/')[1]?.split('/')[0];
    } else if (path.includes('/playlist/')) {
        extractedId = path.split('/playlist/')[1]?.split('/')[0];
    }
    setUrlPlaylistId(extractedId);
  }, []);

  const shareId = urlPlaylistId || activePlaylistId;

  const handleShare = () => {
    if (shareId) {
      nativeShare('Check out this playlist!', window.location.origin + '/p/' + shareId);
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl border-b border-white/20 dark:border-gray-700/30 shrink-0 z-20 ${isSidebarOpen ? 'md:hidden' : ''}`}>
      <button 
        onClick={onMenuClick}
        className="p-3 -m-3 rounded-full active:bg-gray-200 dark:active:bg-gray-800 transition-colors focus:outline-none"
        aria-label="Open Menu"
      >
        <Menu className="w-6 h-6 z-10" />
      </button>
      
      <div 
        className="flex items-center gap-2 text-indigo-600 dark:text-gray-100 font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity absolute left-1/2 -translate-x-1/2"
        onClick={onLogoClick}
      >
        <div className="bg-indigo-500 p-1.5 rounded-lg shadow-md flex items-center justify-center">
          <AudioLines className="w-5 h-5 text-white" />
        </div>
        <span>Resavvy</span>
      </div>

      <div className="flex items-center">
        {shareId ? (
          <button
            onClick={handleShare}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            title="Share Playlist"
          >
            <Share2 className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9 h-9" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}
