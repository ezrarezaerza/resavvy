import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import { Song } from '../types';
import { usePlaylist } from './PlaylistContext';

interface PlayerContextType {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  volume: number;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  playSong: (song: Song, groupQueue?: Song[], groupId?: string) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (volume: number) => void;
  playerRef: React.MutableRefObject<any>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { incrementPlayCount, groups } = usePlaylist();
  const [currentSong, setCurrentSong] = useState<Song | null>(() => {
    try {
      const stored = window.localStorage.getItem('resavvy_player_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.currentSong || null;
      }
    } catch {}
    return null;
  });
  const [queue, setQueue] = useState<Song[]>(() => {
    try {
      const stored = window.localStorage.getItem('resavvy_player_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.queue || [];
      }
    } catch {}
    return [];
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(() => {
    try {
      const stored = window.localStorage.getItem('resavvy_player_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.isShuffle || false;
      }
    } catch {}
    return false;
  });
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>(() => {
    try {
      const stored = window.localStorage.getItem('resavvy_player_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.repeatMode || 'off';
      }
    } catch {}
    return 'off';
  });
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(() => {
    try {
      const stored = window.localStorage.getItem('resavvy_player_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.currentGroupId || null;
      }
    } catch {}
    return null;
  });
  const [volume, setVolumeState] = useState(() => {
    try {
      const stored = window.localStorage.getItem('resavvy_player_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.volume === 'number') {
          return parsed.volume;
        }
      }
    } catch {}
    return 100;
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem('resavvy_player_state', JSON.stringify({
        currentSong,
        queue,
        isShuffle,
        repeatMode,
        currentGroupId,
        volume
      }));
    } catch {}
  }, [currentSong, queue, isShuffle, repeatMode, currentGroupId, volume]);

  const setVolume = useCallback((val: number) => {
    setVolumeState(val);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(val);
    }
  }, []);

  const playSong = useCallback((song: Song, groupQueue?: Song[], groupId?: string) => {
    const queueToUse = groupQueue || [song];
    console.log('[Player Engine] playSong called with:', { songTitle: song.title, queueLength: queueToUse.length, groupId });
    setCurrentSong(song);
    setQueue(queueToUse);
    setIsPlaying(true);
    if (groupId) {
      setCurrentGroupId(groupId);
      incrementPlayCount(groupId, song.id);
    } else {
      incrementPlayCount(currentGroupId || undefined, song.id);
    }
  }, [currentGroupId, incrementPlayCount]);

  const togglePlayPause = useCallback(() => {
    if (currentSong) {
      setIsPlaying((prev) => !prev);
    }
  }, [currentSong]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const playNext = useCallback(() => {
    if (!currentSong || queue.length === 0) return;

    if (repeatMode === 'one') {
      setCurrentSong({ ...currentSong });
      setIsPlaying(true);
      incrementPlayCount(currentGroupId || undefined, currentSong.id);
      return;
    }

    if (isShuffle) {
      const remainingSongs = queue.filter(s => s.id !== currentSong.id);
      if (remainingSongs.length === 0) return;
      const randomIndex = Math.floor(Math.random() * remainingSongs.length);
      const nextSong = remainingSongs[randomIndex];
      setCurrentSong(nextSong);
      setIsPlaying(true);
      incrementPlayCount(currentGroupId || undefined, nextSong.id);
      return;
    }

    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    if (currentIndex === -1) return;

    if (currentIndex < queue.length - 1) {
      const nextSong = queue[currentIndex + 1];
      setCurrentSong(nextSong);
      setIsPlaying(true);
      incrementPlayCount(currentGroupId || undefined, nextSong.id);
    } else {
      let isAutoplayEnabled = false;
      try {
        const stored = window.localStorage.getItem('resavvy_autoplay');
        if (stored !== null) isAutoplayEnabled = JSON.parse(stored);
      } catch {}

      if (repeatMode === 'all') {
        const nextSong = queue[0];
        setCurrentSong(nextSong);
        setIsPlaying(true);
        incrementPlayCount(currentGroupId || undefined, nextSong.id);
      } else if (isAutoplayEnabled && currentGroupId && groups.length > 0) {
        // Find next playlist
        const currentGroupIndex = groups.findIndex(g => g.id === currentGroupId);
        if (currentGroupIndex !== -1) {
          const nextGroupIndex = (currentGroupIndex + 1) % groups.length;
          const nextGroup = groups[nextGroupIndex];
          if (nextGroup && nextGroup.songs.length > 0) {
            setQueue(nextGroup.songs);
            setCurrentGroupId(nextGroup.id);
            const nextSong = nextGroup.songs[0];
            setCurrentSong(nextSong);
            setIsPlaying(true);
            incrementPlayCount(nextGroup.id, nextSong.id);
          } else {
            setIsPlaying(false);
          }
        } else {
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(false);
      }
    }
  }, [currentSong, queue, isShuffle, repeatMode, currentGroupId, incrementPlayCount, groups]);

  const playPrevious = useCallback(() => {
    if (!currentSong || queue.length === 0) return;

    if (repeatMode === 'one') {
      setCurrentSong({ ...currentSong });
      setIsPlaying(true);
      incrementPlayCount(currentGroupId || undefined, currentSong.id);
      return;
    }

    if (isShuffle) {
      const remainingSongs = queue.filter(s => s.id !== currentSong.id);
      if (remainingSongs.length === 0) return;
      const randomIndex = Math.floor(Math.random() * remainingSongs.length);
      const prevSong = remainingSongs[randomIndex];
      setCurrentSong(prevSong);
      setIsPlaying(true);
      incrementPlayCount(currentGroupId || undefined, prevSong.id);
      return;
    }

    const currentIndex = queue.findIndex(s => s.id === currentSong.id);
    if (currentIndex === -1) return;

    if (currentIndex > 0) {
      const prevSong = queue[currentIndex - 1];
      setCurrentSong(prevSong);
      setIsPlaying(true);
      incrementPlayCount(currentGroupId || undefined, prevSong.id);
    } else {
      if (repeatMode === 'all') {
        const prevSong = queue[queue.length - 1];
        setCurrentSong(prevSong);
        setIsPlaying(true);
        incrementPlayCount(currentGroupId || undefined, prevSong.id);
      } else {
        // If it's the first song and no repeat all, just restart the song
        setCurrentSong({ ...currentSong });
        setIsPlaying(true);
        incrementPlayCount(currentGroupId || undefined, currentSong.id);
      }
    }
  }, [currentSong, queue, isShuffle, repeatMode, currentGroupId, incrementPlayCount]);

  const contextValue = React.useMemo(() => ({
    currentSong,
    queue,
    isPlaying,
    isShuffle,
    repeatMode,
    volume,
    isExpanded,
    setIsExpanded,
    playSong,
    togglePlayPause,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    playerRef,
  }), [currentSong, queue, isPlaying, isShuffle, repeatMode, volume, isExpanded, playSong, togglePlayPause, playNext, playPrevious, toggleShuffle, toggleRepeat]);

  return (
    <PlayerContext.Provider
      value={contextValue}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
