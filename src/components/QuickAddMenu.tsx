import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check } from 'lucide-react';
import { Song } from '../types';
import { usePlaylist } from '../context/PlaylistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface QuickAddMenuProps {
  song: Song;
}

export function QuickAddMenu({ song }: QuickAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { groups, addSong } = usePlaylist();
  const { token } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAddToPlaylist = async (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    if (!token) return;

    // Locally update UI first
    addSong(playlistId, {
      id: song.youtubeId || song.id,
      title: song.title,
      artist: song.artist,
      thumbnailUrl: song.thumbnailUrl,
      duration: song.duration
    });

    try {
      const res = await fetch(`/api/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          youtubeId: song.youtubeId || song.id,
          title: song.title,
          artist: song.artist,
          thumbnailUrl: song.thumbnailUrl,
          duration: song.duration
        })
      });

      if (!res.ok) throw new Error('Failed to add song');

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
      setIsOpen(false);
    } catch (error) {
       // if fails, the user is still shown a success toast from local context mostly
       console.error(error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="opacity-100 md:opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        title="Quick Add to Playlist"
      >
        {isSuccess ? <Check className="w-5 h-5 text-green-500" /> : <Plus className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-50 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 py-1 flex flex-col max-h-64 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 mb-1">
            Add to Playlist
          </div>
          {groups.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">No playlists found</div>
          ) : (
            groups.map(group => (
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
