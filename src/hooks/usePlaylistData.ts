import { useState, useEffect } from "react";
import { PlaylistGroup, Song } from "../types";
import { useToast } from "../context/ToastContext";

const LOCAL_STORAGE_KEY = "resavvy_data";

export function usePlaylistData() {
  const { addToast } = useToast();
  const [groups, setGroups] = useState<PlaylistGroup[]>(() => {
    try {
      const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (item) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.error("Failed to parse playlists from localStorage:", error);
    }
    return [];
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(groups));
    } catch (error) {
      console.error("Failed to save playlists to localStorage:", error);
    }
  }, [groups]);

  const createGroup = (name: string) => {
    const newGroup: PlaylistGroup = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      songs: [],
    };
    setGroups((prevGroups) => [...prevGroups, newGroup]);
    addToast(`Created playlist "${name}"`, 'success');
  };

  const deleteGroup = (groupId: string) => {
    setGroups((prevGroups) => prevGroups.filter((g) => g.id !== groupId));
    addToast('Playlist deleted', 'info');
  };

  const addSong = (groupId: string, song: Omit<Song, "addedAt">) => {
    let wasAdded = false;
    let wasDuplicate = false;

    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          // Prevent duplicate YouTube IDs within the same group
          const isDuplicate = group.songs.some((s) => s.id === song.id);
          if (isDuplicate) {
            wasDuplicate = true;
            return group;
          }

          const newSong: Song = {
            ...song,
            addedAt: Date.now(),
          };
          wasAdded = true;
          return {
            ...group,
            songs: [...group.songs, newSong],
          };
        }
        return group;
      })
    );

    if (wasDuplicate) {
      addToast('Song already exists in playlist', 'error');
    } else if (wasAdded) {
      addToast('Song added to playlist', 'success');
    }
  };

  const removeSong = (groupId: string, songId: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            songs: group.songs.filter((song) => song.id !== songId),
          };
        }
        return group;
      })
    );
    addToast('Removed from playlist', 'info');
  };

  const renameGroup = (groupId: string, newName: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          return { ...group, name: newName };
        }
        return group;
      })
    );
    addToast(`Playlist renamed to "${newName}"`, 'success');
  };

  const reorderSongs = (groupId: string, newSongs: Song[]) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          return { ...group, songs: newSongs };
        }
        return group;
      })
    );
  };

  const editSong = (groupId: string, songId: string, updates: { title: string, artist: string }) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            songs: group.songs.map((song) => {
              if (song.id === songId) {
                return { ...song, title: updates.title, artist: updates.artist };
              }
              return song;
            }),
          };
        }
        return group;
      })
    );
    addToast('Song updated successfully', 'success');
  };

  const updateSongDuration = (songId: string, durationStr: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        return {
          ...group,
          songs: group.songs.map((song) => {
            if (song.id === songId) {
              return { ...song, duration: durationStr };
            }
            return song;
          }),
        };
      })
    );
  };

  const incrementPlayCount = (groupId: string | undefined, songId: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId || !groupId) {
          return {
            ...group,
            songs: group.songs.map((song) => {
              if (song.id === songId) {
                return { ...song, playCount: (song.playCount || 0) + 1 };
              }
              return song;
            }),
          };
        }
        return group;
      })
    );
  };

  const updatePlaylistDetails = (groupId: string, details: Partial<Pick<PlaylistGroup, 'name' | 'description' | 'tags' | 'visibility'>>) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          return { ...group, ...details };
        }
        return group;
      })
    );
    addToast(`Playlist details updated`, 'success');
  };

  const updatePlaylistCover = (groupId: string, type: 'random' | 'custom', url?: string) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          return { ...group, coverType: type, customCoverUrl: url };
        }
        return group;
      })
    );
    addToast('Playlist cover updated', 'success');
  };

  return {
    groups,
    createGroup,
    deleteGroup,
    renameGroup,
    addSong,
    removeSong,
    reorderSongs,
    updateSongDuration,
    editSong,
    incrementPlayCount,
    updatePlaylistDetails,
    updatePlaylistCover,
  };
}
