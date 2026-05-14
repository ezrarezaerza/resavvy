import React, { createContext, useContext, ReactNode } from 'react';
import { usePlaylistData as usePlaylistDataHook } from '../hooks/usePlaylistData';
import { PlaylistGroup, Song } from '../types';

interface PlaylistContextType {
  groups: PlaylistGroup[];
  createGroup: (name: string) => void;
  deleteGroup: (groupId: string) => void;
  renameGroup: (groupId: string, newName: string) => void;
  addSong: (groupId: string, song: Omit<Song, 'addedAt'>) => void;
  removeSong: (groupId: string, songId: string) => void;
  reorderSongs: (groupId: string, newSongs: Song[]) => void;
  updateSongDuration: (songId: string, durationStr: string) => void;
  editSong: (groupId: string, songId: string, updates: { title: string, artist: string }) => void;
  incrementPlayCount: (groupId: string | undefined, songId: string) => void;
  updatePlaylistCover: (groupId: string, type: 'random' | 'custom', url?: string) => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const playlistData = usePlaylistDataHook();

  return (
    <PlaylistContext.Provider value={playlistData}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}
