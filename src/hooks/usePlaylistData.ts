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
      fetch('/api/playlists?_t=' + Date.now(), {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'no-store'
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

  const reorderSongs = async (groupId: string, newSongs: Song[]) => {
    if (token) {
      try {
        await fetch(`/api/songs?action=reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ playlistId: groupId, songIds: newSongs.map(s => s.id) })
        });
      } catch (err) {
        console.error('Failed to reorder', err);
      }
    }
    
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          return { ...group, songs: newSongs };
        }
        return group;
      })
    );
  };

  const editSong = async (groupId: string, songId: string, updates: { title: string, artist: string }) => {
    if (token) {
      try {
        await fetch(`/api/songs?songId=${songId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
      } catch (err) {
        console.error('Failed to update song', err);
      }
    }
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

  const toggleSongLike = async (groupId: string, songId: string) => {
    if (token) {
      try {
        await fetch('/api/songs?action=like', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ songId })
        });
      } catch (err) {
        console.error('Failed to toggle song like', err);
      }
    }
    setGroups((prevGroups) =>
      prevGroups.map((group) => {
        if (group.id === groupId) {
          return {
            ...group,
            songs: group.songs.map((song) => {
              if (song.id === songId) {
                return { ...song, isLiked: !song.isLiked };
              }
              return song;
            }),
          };
        }
        return group;
      })
    );
  };

  const updateSongDuration = async (songId: string, durationStr: string) => {
    if (token) {
      try {
        await fetch(`/api/songs?songId=${songId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ duration: durationStr })
        });
      } catch (err) {
        console.error('Failed to update song duration', err);
      }
    }
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

  const incrementPlayCount = async (groupId: string | undefined, songId: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      await fetch('/api/songs?action=play', {
        method: 'POST',
        headers,
        body: JSON.stringify({ songId })
      });
    } catch (err) {
      console.error('Failed to increment play count', err);
    }
    
    window.dispatchEvent(new CustomEvent('resavvy_song_played', { detail: { songId } }));

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

  const clonePlaylist = async (playlistId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/playlists?id=${playlistId}&action=import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const newPlaylist = await res.json();
        setGroups(prev => [...prev, newPlaylist]);
        addToast('Playlist cloned to your library', 'success');
      } else {
        addToast('Failed to clone playlist', 'error');
      }
    } catch (err) {
      addToast('Failed to clone playlist', 'error');
    }
  };

  const savePlaylist = async (playlistId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/playlists?id=${playlistId}&action=save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Find it from API to get data
        const getRes = await fetch(`/api/playlists?id=${playlistId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (getRes.ok) {
          const playlist = await getRes.json();
          setGroups(prev => [...prev, playlist]);
          addToast('Playlist saved to library', 'success');
        }
      } else {
        addToast('Failed to save playlist', 'error');
      }
    } catch (err) {
      addToast('Failed to save playlist', 'error');
    }
  };

  const unsavePlaylist = async (playlistId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/playlists?id=${playlistId}&action=unsave`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== playlistId || !g.isSaved));
        addToast('Playlist removed from library', 'info');
      } else {
        addToast('Failed to unsave playlist', 'error');
      }
    } catch (err) {
      addToast('Failed to unsave playlist', 'error');
    }
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
    toggleSongLike,
    incrementPlayCount,
    updatePlaylistDetails,
    updatePlaylistCover,
    savePlaylist,
    unsavePlaylist,
    clonePlaylist,
  };
}
