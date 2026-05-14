import { useState, useEffect } from "react";
import { PlaylistGroup, Song } from "../types";
import { useToast } from "../context/ToastContext";
import { useAuth, supabase } from "../context/AuthContext";

/*
  =========================================
  SUPABASE SQL SCHEMA & RLS POLICIES
  =========================================
  -- Run this in the Supabase SQL Editor:
  
  -- Create profiles table
  create table profiles (
    id uuid references auth.users on delete cascade not null primary key,
    full_name text,
    avatar_url text
  );
  
  alter table profiles enable row level security;
  create policy "Public profiles are viewable by everyone." on profiles for select using (true);
  create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
  create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

  -- Create playlists table
  create table playlists (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    name text not null,
    cover_type text default 'random',
    custom_cover_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  alter table playlists enable row level security;
  create policy "Users can view their own playlists." on playlists for select using (auth.uid() = user_id);
  create policy "Users can insert their own playlists." on playlists for insert with check (auth.uid() = user_id);
  create policy "Users can update their own playlists." on playlists for update using (auth.uid() = user_id);
  create policy "Users can delete their own playlists." on playlists for delete using (auth.uid() = user_id);

  -- Create songs table
  create table songs (
    id uuid default gen_random_uuid() primary key,
    playlist_id uuid references playlists(id) on delete cascade not null,
    youtube_id text not null,
    title text not null,
    artist text,
    thumbnail_url text,
    duration text,
    play_count integer default 0,
    added_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  alter table songs enable row level security;
  create policy "Users can view songs in their playlists." on songs for select using (
    exists (select 1 from playlists where playlists.id = songs.playlist_id and playlists.user_id = auth.uid())
  );
  create policy "Users can insert songs to their playlists." on songs for insert with check (
    exists (select 1 from playlists where playlists.id = songs.playlist_id and playlists.user_id = auth.uid())
  );
  create policy "Users can update songs in their playlists." on songs for update using (
    exists (select 1 from playlists where playlists.id = songs.playlist_id and playlists.user_id = auth.uid())
  );
  create policy "Users can delete songs from their playlists." on songs for delete using (
    exists (select 1 from playlists where playlists.id = songs.playlist_id and playlists.user_id = auth.uid())
  );
  =========================================
*/

export function usePlaylistData() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [groups, setGroups] = useState<PlaylistGroup[]>([]);

  const fetchPlaylists = async () => {
    if (!user) {
      setGroups([]);
      return;
    }
    
    try {
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .order('created_at', { ascending: true });

      if (playlistsError) throw playlistsError;

      if (!playlistsData) {
        setGroups([]);
        return;
      }

      const playlistIds = playlistsData.map(p => p.id);
      
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('*')
        .in('playlist_id', playlistIds)
        .order('added_at', { ascending: true });

      if (songsError) throw songsError;

      const formattedGroups: PlaylistGroup[] = playlistsData.map(p => ({
        id: p.id,
        name: p.name,
        coverType: p.cover_type,
        customCoverUrl: p.custom_cover_url,
        createdAt: new Date(p.created_at).getTime(),
        songs: (songsData || [])
          .filter(s => s.playlist_id === p.id)
          .map(s => ({
            id: s.youtube_id, // we map youtube_id back to application 'id' property
            title: s.title,
            artist: s.artist || '',
            thumbnailUrl: s.thumbnail_url || '',
            duration: s.duration || '',
            playCount: s.play_count || 0,
            addedAt: new Date(s.added_at).getTime()
          }))
      }));

      setGroups(formattedGroups);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      addToast("Failed to load playlists", "error");
    }
  };

  useEffect(() => {
    fetchPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createGroup = async (name: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert([{ user_id: user.id, name }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setGroups(prev => [...prev, {
          id: data.id,
          name: data.name,
          coverType: data.cover_type,
          customCoverUrl: data.custom_cover_url,
          createdAt: new Date(data.created_at).getTime(),
          songs: []
        }]);
        addToast(`Created playlist "${name}"`, 'success');
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
      addToast("Failed to create playlist", "error");
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!user) return;
    setGroups((prevGroups) => prevGroups.filter((g) => g.id !== groupId));
    try {
      const { error } = await supabase.from('playlists').delete().eq('id', groupId);
      if (error) throw error;
      addToast('Playlist deleted', 'info');
    } catch (error) {
      console.error("Error deleting playlist:", error);
      addToast("Failed to delete playlist", "error");
      fetchPlaylists(); // Revert local state on error
    }
  };

  const addSong = async (groupId: string, song: Omit<Song, "addedAt">) => {
    if (!user) return;
    
    // Optimistic UI check for duplicates
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    if (group.songs.some(s => s.id === song.id)) {
      addToast('Song already exists in playlist', 'error');
      return;
    }

    // Optimistic update
    const newSong: Song = { ...song, addedAt: Date.now() };
    setGroups(prevGroups => prevGroups.map(g => 
      g.id === groupId ? { ...g, songs: [...g.songs, newSong] } : g
    ));

    try {
      const { error } = await supabase
        .from('songs')
        .insert([{
          playlist_id: groupId,
          youtube_id: song.id,
          title: song.title,
          artist: song.artist,
          thumbnail_url: song.thumbnailUrl,
          duration: song.duration,
          play_count: song.playCount || 0
        }]);

      if (error) {
        if (error.code === '23505') { // unique violation error code
            addToast('Song already exists in playlist', 'error');
        } else {
            throw error;
        }
      } else {
        addToast('Song added to playlist', 'success');
      }
    } catch (error) {
      console.error("Error adding song:", error);
      addToast("Failed to add song", "error");
      fetchPlaylists(); // Revert
    }
  };

  const removeSong = async (groupId: string, songId: string) => {
    if (!user) return;

    // Optimistic update
    setGroups(prevGroups => prevGroups.map(g => 
      g.id === groupId ? { ...g, songs: g.songs.filter(s => s.id !== songId) } : g
    ));

    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .match({ playlist_id: groupId, youtube_id: songId });
        
      if (error) throw error;
      addToast('Removed from playlist', 'info');
    } catch (error) {
      console.error("Error removing song:", error);
      addToast("Failed to remove song", "error");
      fetchPlaylists(); // Revert
    }
  };

  const renameGroup = async (groupId: string, newName: string) => {
    if (!user) return;

    setGroups(prevGroups => prevGroups.map(g => g.id === groupId ? { ...g, name: newName } : g));
    
    try {
      const { error } = await supabase
        .from('playlists')
        .update({ name: newName })
        .eq('id', groupId);
        
      if (error) throw error;
      addToast(`Playlist renamed to "${newName}"`, 'success');
    } catch (error) {
      console.error("Error renaming playlist:", error);
      addToast("Failed to rename playlist", "error");
      fetchPlaylists(); // Revert
    }
  };

  const reorderSongs = async (groupId: string, newSongs: Song[]) => {
    if (!user) return;
    
    // We only update locally, full sync requires a more complex index logic
    setGroups(prevGroups => prevGroups.map(g => g.id === groupId ? { ...g, songs: newSongs } : g));
    addToast('Reordering is only persisted locally for now', 'info');
  };

  const editSong = async (groupId: string, songId: string, updates: { title: string, artist: string }) => {
    if (!user) return;

    setGroups(prevGroups => prevGroups.map(g => g.id === groupId ? {
      ...g, songs: g.songs.map(s => s.id === songId ? { ...s, ...updates } : s)
    } : g));

    try {
      const { error } = await supabase
        .from('songs')
        .update({ title: updates.title, artist: updates.artist })
        .match({ playlist_id: groupId, youtube_id: songId });
        
      if (error) throw error;
      addToast('Song updated successfully', 'success');
    } catch (error) {
      console.error("Error updating song:", error);
      addToast("Failed to update song", "error");
      fetchPlaylists(); // Revert
    }
  };

  const updateSongDuration = (songId: string, durationStr: string) => {
    setGroups(prevGroups => prevGroups.map(g => ({
      ...g, songs: g.songs.map(s => s.id === songId ? { ...s, duration: durationStr } : s)
    })));
  };

  const incrementPlayCount = async (groupId: string | undefined, songId: string) => {
    if (!user || !groupId) return;

    setGroups(prevGroups => prevGroups.map(g => g.id === groupId ? {
      ...g, songs: g.songs.map(s => s.id === songId ? { ...s, playCount: (s.playCount || 0) + 1 } : s)
    } : g));

    try {
      // For proper incrementing we should use an rpc call or just get/set, 
      // but simplistic approach for now:
      const group = groups.find(g => g.id === groupId);
      if (!group) return;
      const song = group.songs.find(s => s.id === songId);
      if (!song) return;

      const { error } = await supabase
        .from('songs')
        .update({ play_count: (song.playCount || 0) + 1 })
        .match({ playlist_id: groupId, youtube_id: songId });
        
      if (error) throw error;
    } catch (error) {
      console.error("Error updating play count:", error);
    }
  };

  const updatePlaylistCover = async (groupId: string, type: 'random' | 'custom', url?: string) => {
    if (!user) return;

    setGroups(prevGroups => prevGroups.map(g => g.id === groupId ? { ...g, coverType: type, customCoverUrl: url } : g));

    try {
      const { error } = await supabase
        .from('playlists')
        .update({ cover_type: type, custom_cover_url: url || null })
        .eq('id', groupId);
        
      if (error) throw error;
      addToast('Playlist cover updated', 'success');
    } catch (error) {
      console.error("Error updating playlist cover:", error);
      addToast("Failed to update playlist cover", "error");
      fetchPlaylists(); // Revert
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
    incrementPlayCount,
    updatePlaylistCover,
  };
}
