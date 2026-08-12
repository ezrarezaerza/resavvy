import React, { useState, useEffect } from "react";
import { PlaylistGroup, Song } from "../types";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";

const LOCAL_STORAGE_KEY = "resavvy_data";

export function usePlaylistData() {
  const { addToast } = useToast();
  const { token } = useAuth();
  const { isMaintenanceMode, maxSongsPerPlaylist } = useSettings();
  
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

  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState<boolean>(!!token);

  // Fetch user playlists and save for offline accessibility
  useEffect(() => {
    if (token) {
      setIsLoadingPlaylists(true);
      const abortController = new AbortController();
      fetch('/api/playlists', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortController.signal
      })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setGroups(data);
          try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          } catch (e) {}
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Failed to load user playlists from network, attempting offline backup', err);
          try {
            const cached = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            if (cached) {
              setGroups(JSON.parse(cached));
            }
          } catch (e) {}
        }
      })
      .finally(() => {
        setIsLoadingPlaylists(false);
      });
      return () => abortController.abort();
    } else {
      try {
        const cached = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          setGroups(JSON.parse(cached));
        }
      } catch (e) {}
      setIsLoadingPlaylists(false);
    }
  }, [token]);

  useEffect(() => {
    if (groups.length > 0) {
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(groups));
      } catch (error) {
        console.error("Failed to save playlists to localStorage:", error);
      }
    }
  }, [groups]);

  const createGroup = async (
    name: string,
    description?: string,
    tags?: string[],
    visibility?: 'private' | 'public' | 'unlisted',
    initialSongs?: Omit<Song, 'addedAt'>[]
  ): Promise<PlaylistGroup | null> => {
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Playlist creation is temporarily disabled.", "error");
      return null;
    }
    if (token) {
      try {
        const res = await fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name, description, tags, visibility })
        });
        if (res.ok) {
          const newGroup: PlaylistGroup = await res.json();
          let addedSongs: Song[] = [];
          if (initialSongs && initialSongs.length > 0) {
            for (const song of initialSongs) {
              try {
                const songRes = await fetch('/api/songs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({
                    playlistId: newGroup.id,
                    youtubeId: song.youtubeId || song.id,
                    title: song.title,
                    artist: song.artist,
                    thumbnailUrl: song.thumbnailUrl,
                    duration: song.duration
                  })
                });
                if (songRes.ok) {
                  const dbSong = await songRes.json();
                  addedSongs.push(dbSong);
                }
              } catch (e) {
                console.error(e);
              }
            }
          }
          const groupWithSongs = { ...newGroup, songs: addedSongs };
          setGroups(prev => [...prev, groupWithSongs]);
          const songMsg = addedSongs.length > 0 ? ` with ${addedSongs.length} tracks` : '';
          addToast(`Created playlist "${name}"${songMsg}`, 'success');
          return groupWithSongs;
        }
      } catch (err) {
        addToast('Failed to create playlist', 'error');
      }
      return null;
    } else {
      const formattedSongs: Song[] = (initialSongs || []).map((s) => ({
        ...s,
        addedAt: Date.now()
      }));
      const newGroup: PlaylistGroup = {
        id: crypto.randomUUID(),
        name,
        description,
        tags,
        visibility,
        createdAt: Date.now(),
        songs: formattedSongs,
      };
      setGroups((prevGroups) => [...prevGroups, newGroup]);
      const songMsg = formattedSongs.length > 0 ? ` with ${formattedSongs.length} tracks` : '';
      addToast(`Created playlist "${name}"${songMsg}`, 'success');
      return newGroup;
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Playlist deletion is temporarily disabled.", "error");
      return;
    }
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
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Modifying playlists is temporarily disabled.", "error");
      return;
    }
    const targetGroup = groups.find((g) => g.id === groupId);
    if (targetGroup && targetGroup.songs.length >= maxSongsPerPlaylist) {
      addToast(`Playlist limit reached. Max allowed tracks is ${maxSongsPerPlaylist}.`, "error");
      return;
    }
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

  const addSongsBulk = async (groupId: string, songsToAdd: Omit<Song, "addedAt">[]) => {
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Modifying playlists is temporarily disabled.", "error");
      return;
    }
    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) return;

    if (targetGroup.songs.length + songsToAdd.length > maxSongsPerPlaylist) {
      addToast(`Adding these songs exceeds the playlist limit (${maxSongsPerPlaylist} tracks max).`, "error");
      return;
    }

    if (token) {
      try {
        let addedCount = 0;
        const newDbSongs: Song[] = [];
        for (const song of songsToAdd) {
          const res = await fetch('/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              playlistId: groupId,
              youtubeId: song.youtubeId || song.id,
              title: song.title,
              artist: song.artist,
              thumbnailUrl: song.thumbnailUrl,
              duration: song.duration
            })
          });
          if (res.ok) {
            const dbSong = await res.json();
            newDbSongs.push(dbSong);
            addedCount++;
          }
        }
        if (addedCount > 0) {
          setGroups((prevGroups) => prevGroups.map((group) => {
            if (group.id === groupId) return { ...group, songs: [...group.songs, ...newDbSongs] };
            return group;
          }));
          addToast(`Added ${addedCount} tracks to playlist`, 'success');
        }
      } catch (err) {
        addToast('Failed to add bulk songs', 'error');
      }
    } else {
      let addedCount = 0;
      setGroups((prevGroups) =>
        prevGroups.map((group) => {
          if (group.id === groupId) {
            const existingIds = new Set(group.songs.map((s) => s.id));
            const freshSongs: Song[] = [];
            for (const song of songsToAdd) {
              if (!existingIds.has(song.id)) {
                existingIds.add(song.id);
                freshSongs.push({ ...song, addedAt: Date.now() });
                addedCount++;
              }
            }
            return { ...group, songs: [...group.songs, ...freshSongs] };
          }
          return group;
        })
      );
      if (addedCount > 0) {
        addToast(`Added ${addedCount} tracks to playlist`, 'success');
      } else {
        addToast('All selected songs are already in this playlist', 'info');
      }
    }
  };

  const removeSong = async (groupId: string, songId: string) => {
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Modifying playlists is temporarily disabled.", "error");
      return;
    }
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
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Playlist renaming is temporarily disabled.", "error");
      return;
    }
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
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Playlist reordering is temporarily disabled.", "error");
      return;
    }
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
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Modifying tracks is temporarily disabled.", "error");
      return;
    }
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
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Modifying playlist settings is temporarily disabled.", "error");
      return;
    }
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
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Modifying playlist cover is temporarily disabled.", "error");
      return;
    }
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
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Cloning playlists is temporarily disabled.", "error");
      return;
    }
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
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Saving playlists is temporarily disabled.", "error");
      return;
    }
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
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Modifying library state is temporarily disabled.", "error");
      return;
    }
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

  const importPlaylists = async (importedGroups: PlaylistGroup[]): Promise<number> => {
    if (isMaintenanceMode) {
      addToast("System is under maintenance. Importing playlists is temporarily disabled.", "error");
      return 0;
    }

    let addedCount = 0;
    const existingIds = new Set(groups.map(g => g.id));
    const newGroupsToAppend: PlaylistGroup[] = [];

    for (const group of importedGroups) {
      if (!group || !group.name) continue;
      
      const newId = existingIds.has(group.id) ? crypto.randomUUID() : (group.id || crypto.randomUUID());
      const cleanedGroup: PlaylistGroup = {
        ...group,
        id: newId,
        createdAt: group.createdAt || Date.now(),
        songs: Array.isArray(group.songs) ? group.songs : []
      };

      if (token) {
        try {
          const res = await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              name: cleanedGroup.name,
              description: cleanedGroup.description,
              tags: cleanedGroup.tags,
              visibility: cleanedGroup.visibility,
              customCoverUrl: cleanedGroup.customCoverUrl,
              coverType: cleanedGroup.coverType,
              songs: cleanedGroup.songs
            })
          });
          if (res.ok) {
            const savedServerGroup = await res.json();
            newGroupsToAppend.push(savedServerGroup);
            addedCount++;
          }
        } catch (err) {
          console.error('Error syncing imported playlist to server:', err);
        }
      } else {
        newGroupsToAppend.push(cleanedGroup);
        addedCount++;
      }
    }

    if (newGroupsToAppend.length > 0) {
      setGroups(prev => [...prev, ...newGroupsToAppend]);
    }

    return addedCount;
  };

  const playlistDataValue = React.useMemo(() => ({
    groups,
    isLoadingPlaylists,
    createGroup,
    deleteGroup,
    renameGroup,
    addSong,
    addSongsBulk,
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
    importPlaylists,
  }), [groups, token, isLoadingPlaylists]);

  return playlistDataValue;
}
