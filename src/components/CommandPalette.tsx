import React, { useState, useEffect, useRef } from "react";
import { Search, Home, Library, Compass } from "lucide-react";
import { usePlaylist } from "../context/PlaylistContext";

interface CommandPaletteProps {
  onNavigate: (groupId: string | null) => void;
}

export function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 10);
    };
    const handleClose = () => setIsOpen(false);

    window.addEventListener("open-command-palette", handleOpen);
    window.addEventListener("close-modals", handleClose);
    return () => {
      window.removeEventListener("open-command-palette", handleOpen);
      window.removeEventListener("close-modals", handleClose);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 font-sans">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative w-full max-w-2xl bg-[#1a1f2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        <div className="flex items-center px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Resavvy or type a command..."
            className="flex-1 bg-transparent border-none outline-none text-base placeholder-gray-500 text-white"
          />
          <div className="text-xs text-gray-500 font-mono px-2 py-1 rounded bg-white/5 ml-2">ESC</div>
        </div>
        
        <div className="p-2 overflow-y-auto max-h-[60vh] flex flex-col">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Quick Actions
          </div>
          <button 
            onClick={() => { onNavigate(null); setIsOpen(false); }}
            className="flex items-center gap-3 px-3 py-3 w-full text-left rounded-xl hover:bg-white/5 transition-colors focus:bg-white/5 outline-none"
          >
            <Home className="w-5 h-5 text-indigo-400" />
            <span className="font-medium text-sm">Go to Home</span>
          </button>
          
          <button 
            onClick={() => { onNavigate('library'); setIsOpen(false); }}
            className="flex items-center gap-3 px-3 py-3 w-full text-left rounded-xl hover:bg-white/5 transition-colors focus:bg-white/5 outline-none"
          >
            <Library className="w-5 h-5 text-indigo-400" />
            <span className="font-medium text-sm">Go to My Library</span>
          </button>
          
          <button 
            onClick={() => { onNavigate('discovery'); setIsOpen(false); }}
            className="flex items-center gap-3 px-3 py-3 w-full text-left rounded-xl hover:bg-white/5 transition-colors focus:bg-white/5 outline-none"
          >
            <Compass className="w-5 h-5 text-indigo-400" />
            <span className="font-medium text-sm">Explore Global Catalog</span>
          </button>
        </div>
      </div>
    </div>
  );
}
