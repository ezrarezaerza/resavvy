import { useState, useEffect } from "react";
import { PlaylistGroup, Song } from "../types";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const LOCAL_STORAGE_KEY = "resavvy_data";

export function usePlaylistData() {
  const { addToast } = useToast();
  const { token } = useAuth();
  
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

  // Clear cache and fetch original data based on logged in account
  useEffect(() => {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    if (token) {
      fetch('/api/playlists', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setGroups(data);
          addToast('Loaded original account data', 'success');
        }
      })
      .catch(err => {
        console.error('Failed to load user playlists', err);
      });
    } else {
      setGroups([]);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(groups));
      } catch (error) {
        console.error("Failed to save playlists to localStorage:", error);
      }
    }
  }, [groups, token]);

  const createGroup = async (name: string) => {
    if (token) {
      try {
        const res = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name })
        });
        if (res.ok) {
          const newGroup = await res.json();
          setGroups(prev => [...prev, newGroup]);
          addToast(`Created playlist "${name}"`, 'success');
        }
      } catch (err) {
        addToast('Failed to create playlist', 'error');
      }
    } else {
      const newGroup: PlaylistGroup = {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now(),
        songs: [],
      };
      setGroups((prevGroups) => [...prevGroups, newGroup]);
      addToast(`Created playlist "${name}"`, 'success');
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (token) {
      try {
        await fetch(`/api/playlists?id=${groupId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error(err);
      }
    }
    setGroups((prevGroups) => prevGroups.filter((g) => g.id !== groupId));
    addToast('Playlist deleted', 'info');
  };

  const addSong = async (groupId: string, song: Omit<Song, "addedAt">) => {
    if (token) {
      try {
        const res = await fetch('/api/songs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ playlistId: groupId, youtubeId: song.youtubeId || song.id, title: song.title, artist: song.artist, thumbnailUrl: song.thumbnailUrl, duration: song.duration })
        });
        if (res.ok) {
          const dbSong = await res.json();
          setGroups((prevGroups) => prevGroups.map((group) => {
            if (group.id === groupId) return { ...group, songs: [...group.songs, dbSong] };
            return group;
          }));
          addToast('Song added to playlist', 'success');
        }
      } catch (err) {
        addToast('Failed to add song', 'error');
      }
    } else {
      let wasAdded = false;
      let wasDuplicate = false;

      setGroups((prevGroups) =>
        prevGroups.map((group) => {
          if (group.id === groupId) {
            const isDuplicate = group.songs.some((s) => s.id === song.id);
            if (isDuplicate) {
              wasDuplicate = true;
              return group;
            }

            const newSong: Song = { ...song, addedAt: Date.now() };
            wasAdded = true;
            return { ...group, songs: [...group.songs, newSong] };
          }
          return group;
        })
      );

      if (wasDuplicate) {
        addToast('Song already exists in playlist', 'error');
      } else if (wasAdded) {
        addToast('Song added to playlist', 'success');
      }
    }
  };

  const removeSong = async (groupId: string, songId: string) => {
    if (token) {
      try {
        await fetch(`/api/songs?songId=${songId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error(err);
      }
    }
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

  const renameGroup = async (groupId: string, newName: string) => {
    if (token) {
      try {
        await fetch(`/api/playlists?id=${groupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name: newName })
        });
      } catch (err) {
        console.error(err);
      }
    }
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
    // Left local: requires batched update logic in the actual app usually,
    // assuming local state handles it temporarily.
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

  const updatePlaylistDetails = async (groupId: string, details: Partial<Pick<PlaylistGroup, 'name' | 'description' | 'tags' | 'visibility'>>) => {
    if (token) {
      try {
        await fetch(`/api/playlists?id=${groupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(details)
        });
      } catch (err) {
        console.error(err);
      }
    }
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

  const updatePlaylistCover = async (groupId: string, type: 'random' | 'custom', url?: string) => {
    if (token) {
      try {
        await fetch(`/api/playlists?id=${groupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ coverType: type, customCoverUrl: url })
        });
      } catch (err) {
        console.error(err);
      }
    }
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
