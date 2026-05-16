import React from "react";
import { Menu, AudioLines } from "lucide-react";

interface MobileHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  onLogoClick: () => void;
}

export function MobileHeader({ onMenuClick, isSidebarOpen, onLogoClick }: MobileHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl border-b border-white/20 dark:border-gray-700/30 shrink-0 z-20 ${isSidebarOpen ? 'md:hidden' : ''}`}>
      <button 
        onClick={onMenuClick}
        className="p-3 -m-3 rounded-full active:bg-gray-200 dark:active:bg-gray-800 transition-colors focus:outline-none"
        aria-label="Open Menu"
      >
        <Menu className="w-6 h-6" />
      </button>
      
      <div 
        className="flex items-center gap-2 text-indigo-600 dark:text-gray-100 font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onLogoClick}
      >
        <div className="bg-indigo-500 p-1.5 rounded-lg shadow-md flex items-center justify-center">
          <AudioLines className="w-5 h-5 text-white" />
        </div>
        <span>Resavvy</span>
      </div>

      <div className="w-6 h-6" aria-hidden="true" />
    </div>
  );
}
