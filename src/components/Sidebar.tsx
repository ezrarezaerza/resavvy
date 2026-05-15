import React, { useState } from "react";
import { Moon, Plus, Sun, AudioLines, MoreHorizontal, Trash2, Settings, LogOut } from "lucide-react";
import { PlaylistGroup } from "../types";
import { ConfirmModal } from "./ConfirmModal";
import { usePlaylist } from "../context/PlaylistContext";
import { useAuth } from "../context/AuthContext";
import { EditProfileModal } from "./EditProfileModal";

interface SidebarProps {
  groups: PlaylistGroup[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  createGroup: (name: string) => void;
  deleteGroup: (id: string) => void;
  isOpen: boolean;
  onMenuClick: () => void;
  onCreatePlaylist: () => void;
}

export function Sidebar({ 
  groups, 
  activeGroupId, 
  setActiveGroupId, 
  deleteGroup, 
  isOpen, 
  onMenuClick,
  onCreatePlaylist
}: SidebarProps) {
  const [playlistToDelete, setPlaylistToDelete] = useState<PlaylistGroup | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { renameGroup } = usePlaylist();
  const { user, logout } = useAuth();

  const goHome = () => {
    setActiveGroupId(null);
  };

  const handleRename = (playlist: PlaylistGroup) => {
    const newName = window.prompt("Rename playlist:", playlist.name);
    if (newName && newName.trim() && newName !== playlist.name) {
      renameGroup(playlist.id, newName.trim());
    }
    setOpenMenuId(null);
  };

  return (
    <aside className={`fixed md:relative inset-y-0 left-0 z-[70] w-64 h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl border-r border-white/20 dark:border-gray-700/30 flex flex-col transform transition-all duration-300 ease-in-out shrink-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-64'}`}>
      <div className="hidden md:flex p-4 items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50">
        <div 
          className="flex items-center gap-2 text-indigo-600 dark:text-gray-100 font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity"
          onClick={goHome}
        >
          <div className="bg-indigo-500 p-1.5 rounded-lg shadow-md flex items-center justify-center">
            <AudioLines className="w-5 h-5 text-white" />
          </div>
          <span>Resavvy</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Close Sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex flex-col gap-2">
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowProfileModal(true)}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-300 dark:border-gray-600" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 border border-indigo-400">
                  <span className="text-xs font-bold text-white shrink-0">{user.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user.username}</span>
              </div>
            </div>
            <div className="flex shrink-0">
              <button
                onClick={logout}
                className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-red-400 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto mt-2 md:mt-0">
        <div className="space-y-0.5 mb-6">
          <div 
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
              activeGroupId === null
                ? "bg-gray-200 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 font-bold"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 font-medium"
            }`}
            onClick={goHome}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>Home</span>
          </div>
          <div 
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
              activeGroupId === 'discovery'
                ? "bg-gray-200 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 font-bold"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 font-medium"
            }`}
            onClick={() => setActiveGroupId('discovery')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            <span>Discovery</span>
          </div>
          <div 
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
              activeGroupId === 'analytics'
                ? "bg-gray-200 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 font-bold"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 font-medium"
            }`}
            onClick={() => setActiveGroupId('analytics')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-2"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
            <span>Analytics</span>
          </div>
          <div 
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
              activeGroupId === 'library'
                ? "bg-gray-200 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 font-bold"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 font-medium"
            }`}
            onClick={() => setActiveGroupId('library')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/></svg>
            <span>My Library</span>
          </div>
          <div 
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
              activeGroupId === 'settings'
                ? "bg-gray-200 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 font-bold"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 font-medium"
            }`}
            onClick={() => setActiveGroupId('settings')}
          >
            <Settings className="w-[18px] h-[18px]" />
            <span>Settings</span>
          </div>
        </div>

        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
          Your Playlists
        </div>
        <div className="space-y-0.5">
          <div 
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
              activeGroupId === 'liked'
                ? "bg-gray-200 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 font-bold"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 font-medium"
            }`}
            onClick={() => setActiveGroupId('liked')}
          >
            <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>
            <span>Liked Songs</span>
          </div>

          {groups.map((playlist) => {
            const isActive = playlist.id === activeGroupId;
            const isMenuOpen = openMenuId === playlist.id;
            return (
              <div 
                key={playlist.id}
                className={`relative w-full group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                  isActive
                    ? "bg-gray-200 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 font-bold"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 font-medium"
                }`}
                onClick={() => setActiveGroupId(playlist.id)}
              >
                <span className="truncate">{playlist.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(isMenuOpen ? null : playlist.id);
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'} ${isMenuOpen ? 'opacity-100' : ''}`}
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-4 top-8 z-50 bg-gray-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden w-40 flex flex-col p-1 animate-in fade-in zoom-in-95 duration-150">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRename(playlist); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    >
                      Rename
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setPlaylistToDelete(playlist); setOpenMenuId(null); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-white/5 mt-auto">
        <button 
          onClick={onCreatePlaylist}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors mt-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Playlist</span>
        </button>
      </div>

      {openMenuId && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
        />
      )}

      <ConfirmModal
        isOpen={!!playlistToDelete}
        onClose={() => setPlaylistToDelete(null)}
        onConfirm={() => {
          if (playlistToDelete) {
            deleteGroup(playlistToDelete.id);
          }
        }}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${playlistToDelete?.name}"? All songs in this playlist will be removed.`}
        confirmText="Delete Playlist"
      />
      {user && (
        <EditProfileModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)}
          currentName={user.name}
          currentUsername={user.username}
        />
      )}
    </aside>
  );
}
