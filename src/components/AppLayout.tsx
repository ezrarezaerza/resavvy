import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Tracklist } from "./Tracklist";
import { PlayerBar } from "./PlayerBar";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { usePlaylist } from "../context/PlaylistContext";
import { Modal } from "./Modal";
import { AddSongInput } from "./AddSongInput";
import { PlaylistHero } from "./PlaylistHero";
import { MobileHeader } from "./MobileHeader";
import { FullscreenPlayer } from "./FullscreenPlayer";
import { HomeDashboard } from "./HomeDashboard";
import { LibraryDashboard } from "./LibraryDashboard";
import { DiscoveryDashboard } from "./DiscoveryDashboard";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { LikedDashboard } from "./LikedDashboard";
import { SettingsDashboard } from "./SettingsDashboard";
import { CommandPalette } from "./CommandPalette";
import { Toaster, toast } from 'sonner';

import { usePlayer } from "../context/PlayerContext";
import { useMediaSession } from "../hooks/useMediaSession";
import { useOfflineLibrary } from "../hooks/useOfflineLibrary";

export function AppLayout() {
  useKeyboardShortcuts();
  const { groups, createGroup, deleteGroup, addSong, removeSong } = usePlaylist();
  const { currentSong } = usePlayer();
  useMediaSession(currentSong);
  const { isOffline } = useOfflineLibrary();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  useEffect(() => {
    const handleCloseModals = () => {
      setIsAddSongModalOpen(false);
      setIsCreatingModalOpen(false);
    };
    window.addEventListener("close-modals", handleCloseModals);
    return () => window.removeEventListener("close-modals", handleCloseModals);
  }, []);

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    if (activeGroupId && activeGroupId !== 'settings' && activeGroupId !== 'library' && activeGroupId !== 'discovery' && activeGroupId !== 'liked' && activeGroupId !== 'analytics' && !groups.find(g => g.id === activeGroupId)) {
       setActiveGroupId(null);
    }
  }, [groups, activeGroupId]);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  const handleAddSong = (song: Omit<import("../types").Song, 'addedAt'>) => {
    if (activeGroup) {
      addSong(activeGroup.id, song);
      setIsAddSongModalOpen(false);
    }
  };

  const handleGroupSelect = (id: string | null) => {
    setActiveGroupId(id);
    setIsSidebarOpen(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createGroup(newPlaylistName.trim());
      setNewPlaylistName("");
      setIsCreatingModalOpen(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors font-sans antialiased relative">
      {/* Ambient Background */}
      {currentSong?.thumbnailUrl ? (
        <img 
          src={currentSong.thumbnailUrl.replace('mqdefault.jpg', 'hqdefault.jpg')} 
          alt="" 
          className="fixed inset-0 w-full h-full object-cover blur-[120px] opacity-30 dark:opacity-20 pointer-events-none transition-all duration-1000 z-0" 
        />
      ) : (
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-indigo-100/50 to-white dark:from-indigo-900/20 dark:to-gray-950 blur-[120px] opacity-30 pointer-events-none transition-all duration-1000 z-0" />
      )}
      
      <div className="relative z-10 flex flex-col w-full h-full">
        <MobileHeader 
          onMenuClick={toggleSidebar} 
          isSidebarOpen={isSidebarOpen}
          onLogoClick={() => handleGroupSelect(null)}
          activePlaylistId={activeGroup?.id}
        />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar 
            groups={groups}
            activeGroupId={activeGroupId}
            setActiveGroupId={handleGroupSelect}
            createGroup={createGroup}
            deleteGroup={deleteGroup}
            isOpen={isSidebarOpen}
            onMenuClick={toggleSidebar}
            onCreatePlaylist={() => setIsCreatingModalOpen(true)}
          />
          
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <FullscreenPlayer />

          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-transparent relative no-scrollbar">
            {isOffline && (
              <div className="absolute top-4 right-4 z-50">
                <div className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-medium shadow-sm border border-amber-500/10 backdrop-blur-md">Offline Mode</div>
              </div>
            )}
            {activeGroupId === 'discovery' ? (
              <DiscoveryDashboard onSelectGroup={setActiveGroupId} />
            ) : activeGroupId === 'analytics' ? (
              <AnalyticsDashboard onSelectGroup={setActiveGroupId} />
            ) : activeGroupId === 'liked' ? (
              <LikedDashboard />
            ) : activeGroupId === 'library' ? (
              <LibraryDashboard />
            ) : activeGroupId === 'settings' ? (
              <SettingsDashboard />
            ) : activeGroup ? (
              <div className="w-full flex-1 flex flex-col pb-32">
                <PlaylistHero 
                  activeGroup={activeGroup} 
                  onAddSong={() => setIsAddSongModalOpen(true)} 
                />
                <div className="max-w-5xl mx-auto w-full px-6 md:px-8 mt-6">
                  <Tracklist 
                    activeGroup={activeGroup}
                    removeSong={(songId) => removeSong(activeGroup.id, songId)}
                  />
                </div>
              </div>
            ) : (
              <HomeDashboard groups={groups} onSelectGroup={handleGroupSelect} onCreatePlaylist={() => setIsCreatingModalOpen(true)} />
            )}
          </main>
        </div>
        <PlayerBar />

        <Modal 
          isOpen={isAddSongModalOpen} 
          onClose={() => setIsAddSongModalOpen(false)} 
          title="Add New Song"
        >
          <AddSongInput onAdd={handleAddSong} />
        </Modal>

        <Modal 
          isOpen={isCreatingModalOpen} 
          onClose={() => { setIsCreatingModalOpen(false); setNewPlaylistName(""); }} 
          title="New Playlist"
        >
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4 mt-2">
            <input 
              autoFocus
              type="text" 
              placeholder="E.g., Workout Mix, Chill Vibes..." 
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                onClick={() => { setIsCreatingModalOpen(false); setNewPlaylistName(""); }}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newPlaylistName.trim()}
              >
                Create
              </button>
            </div>
          </form>
        </Modal>
        
        <CommandPalette onNavigate={handleGroupSelect} />
        <Toaster theme="dark" position="top-center" toastOptions={{ className: 'bg-[#1a1f2e] border border-white/10 text-white backdrop-blur-md' }} />
      </div>
    </div>
  );
}
