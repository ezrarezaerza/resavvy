import React, { createContext, useContext, ReactNode } from 'react';
import { usePlaylistData as usePlaylistDataHook } from '../hooks/usePlaylistData';
import { PlaylistGroup, Song } from '../types';

interface PlaylistContextType {
  groups: PlaylistGroup[];
  isLoadingPlaylists: boolean;
  createGroup: (name: string, description?: string, tags?: string[], visibility?: 'private' | 'public' | 'unlisted', initialSongs?: Omit<Song, 'addedAt'>[]) => Promise<PlaylistGroup | null | void>;
  deleteGroup: (groupId: string) => void;
  renameGroup: (groupId: string, newName: string) => void;
  addSong: (groupId: string, song: Omit<Song, 'addedAt'>) => void;
  addSongsBulk: (groupId: string, songs: Omit<Song, 'addedAt'>[]) => Promise<void>;
  removeSong: (groupId: string, songId: string) => void;
  reorderSongs: (groupId: string, newSongs: Song[]) => void;
  updateSongDuration: (songId: string, durationStr: string) => void;
  editSong: (groupId: string, songId: string, updates: { title: string, artist: string }) => void;
  toggleSongLike: (groupId: string, songId: string) => void;
  incrementPlayCount: (groupId: string | undefined, songId: string) => void;
  updatePlaylistDetails: (groupId: string, details: Partial<Pick<PlaylistGroup, 'name' | 'description' | 'tags' | 'visibility'>>) => void;
  updatePlaylistCover: (groupId: string, type: 'random' | 'custom', url?: string) => void;
  savePlaylist: (playlistId: string) => Promise<void>;
  unsavePlaylist: (playlistId: string) => Promise<void>;
  clonePlaylist: (playlistId: string) => Promise<void>;
  importPlaylists: (importedGroups: PlaylistGroup[]) => Promise<number>;
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
