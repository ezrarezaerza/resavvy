import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, Library } from 'lucide-react';
import { Song } from '../types';
import { usePlaylist } from '../context/PlaylistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface QuickAddMenuProps {
  song: Song;
  onOpenChange?: (isOpen: boolean) => void;
}

export function QuickAddMenu({ song, onOpenChange }: QuickAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { groups, addSong } = usePlaylist();
  const { token, user, setShowLoginModal } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOpenChange]);

  const handleAddToPlaylist = async (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    if (!token) {
      setShowLoginModal(true);
      return;
    }

    addSong(playlistId, {
      id: song.youtubeId || song.id,
      title: song.title,
      artist: song.artist,
      thumbnailUrl: song.thumbnailUrl,
      duration: song.duration
    });

    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleAddToLibrary = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      setShowLoginModal(true);
      return;
    }

    let targetPlaylist = ownedGroups.find(g => g.name === 'My Library' || g.name === 'Library');
    
    if (!targetPlaylist && ownedGroups.length > 0) {
       targetPlaylist = ownedGroups[0];
    }

    if (!targetPlaylist) {
      try {
        const res = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: 'My Library' })
        });
        if (!res.ok) throw new Error('Failed to create library');
        targetPlaylist = await res.json();
        // Since we bypassed context creation, trigger a reload to sync state if we had 0 playlists
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        addToast('Failed to add to library', 'error');
        return;
      }
    }

    addSong(targetPlaylist.id, {
      id: song.youtubeId || song.id,
      title: song.title,
      artist: song.artist,
      thumbnailUrl: song.thumbnailUrl,
      duration: song.duration
    });

    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    onOpenChange?.(newIsOpen);
  };

  const ownedGroups = groups.filter(g => !g.isSaved);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleOpenClick}
        className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        title="Quick Add to Playlist"
      >
        {isSuccess ? <Check className="w-5 h-5 text-green-500" /> : <Plus className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-[100] w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 py-1 flex flex-col max-h-64 overflow-y-auto">
          <button
            onClick={handleAddToLibrary}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors text-left w-full"
          >
            <Library className="w-4 h-4 shrink-0" />
            Add to My Library
          </button>
          
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-widest border-y border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 my-1">
            Add to Playlist
          </div>
          {ownedGroups.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">No playlists found</div>
          ) : (
            ownedGroups.map(group => (
              <button
                key={group.id}
                onClick={(e) => handleAddToPlaylist(e, group.id)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors text-left w-full truncate"
              >
                {group.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
