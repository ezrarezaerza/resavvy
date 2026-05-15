import React, { useEffect, useState } from 'react';
import { PlaylistGroup } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { useToast } from '../context/ToastContext';
import { Play } from 'lucide-react';
import { AuthScreen } from './AuthScreen';

interface PublicPlaylistPageProps {
  playlistId: string;
}

export function PublicPlaylistPage({ playlistId }: PublicPlaylistPageProps) {
  const [playlist, setPlaylist] = useState<PlaylistGroup & { user?: { name: string, username: string } } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const { token, user } = useAuth();
  const { playSong } = usePlayer();
  const { addToast } = useToast();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/playlists?id=${playlistId}`, { headers });
        if (!res.ok) {
          throw new Error('Failed to fetch playlist');
        }
        const data = await res.json();
        setPlaylist(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaylist();
  }, [playlistId, token]);

  const handleImport = async () => {
    if (!token) {
      setShowAuth(true);
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch(`/api/playlists?action=import&id=${playlistId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to import');
      addToast('Playlist imported successfully!', 'success');
      window.location.href = '/'; // redirect home
    } catch (e) {
      addToast('Error importing playlist', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handlePlayAll = () => {
    if (playlist && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  if (showAuth) {
    return <AuthScreen onLogin={() => setShowAuth(false)} />;
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
  if (error || !playlist) return <div className="flex h-screen items-center justify-center text-red-500">Error: {error || 'Playlist not found'}</div>;

  let displayImage = '';
  if (playlist.coverType === 'custom' && playlist.customCoverUrl) {
    displayImage = playlist.customCoverUrl;
  } else if (playlist.songs.length > 0) {
    displayImage = playlist.songs[0].thumbnailUrl.replace('mqdefault.jpg', 'maxresdefault.jpg').replace('hqdefault.jpg', 'maxresdefault.jpg');
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0a0a0a] overflow-auto text-gray-900 dark:text-gray-100 font-sans">
      {/* Hero Section */}
      <div className="relative w-full h-[50vh] md:h-[60vh] shrink-0 flex flex-col justify-end bg-slate-200 dark:bg-gray-900 group">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {displayImage ? (
            <img src={displayImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 dark:opacity-80 mix-blend-multiply dark:mix-blend-normal" />
          ) : (
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900 dark:to-gray-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#0a0a0a] dark:via-[#0a0a0a]/60 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              {playlist.user && (
                <p className="text-gray-500 dark:text-gray-300 font-bold mb-2 uppercase tracking-widest text-xs">
                  Created by {playlist.user.name} (@{playlist.user.username})
                </p>
              )}
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white drop-shadow-sm dark:drop-shadow-xl mb-4">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl mb-4 max-w-2xl bg-white/60 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 backdrop-blur-md shadow-sm dark:drop-shadow-md">
                  {playlist.description}
                </p>
              )}
              {playlist.tags && playlist.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {playlist.tags.map(tag => (
                    <span key={tag} className="rounded-full bg-indigo-50 dark:bg-white/10 px-4 py-1.5 text-sm font-semibold text-indigo-700 dark:text-white border border-indigo-100 dark:border-white/20 shadow-sm dark:backdrop-blur-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-gray-500 dark:text-gray-400 mt-4 font-semibold flex items-center gap-2">
                 <span>{playlist.songs.length} tracks</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0">
               {playlist.songs.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  className="px-8 py-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 text-white rounded-full font-bold shadow-xl shadow-indigo-600/20 dark:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Listen Now
                </button>
              )}
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-8 py-4 bg-white text-indigo-700 dark:text-black border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-100 rounded-full font-bold shadow-md dark:shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Save to My Library'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist Read-Only */}
      <div className="max-w-5xl mx-auto w-full p-6 md:p-12 pb-32">
        <div className="space-y-2">
          {playlist.songs.map((song, idx) => (
             <div key={song.id} className="flex items-center p-3 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all hover:shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-transparent group bg-transparent">
               <span className="w-8 text-center text-gray-400 dark:text-gray-500 font-bold">{idx + 1}</span>
               <img src={song.thumbnailUrl} alt={song.title} className="w-12 h-12 rounded object-cover mx-4 shadow-sm" />
               <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 dark:text-white font-bold truncate">{song.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium truncate">{song.artist || 'Unknown Artist'}</p>
               </div>
               <div className="text-gray-400 dark:text-gray-500 font-medium text-sm">{song.duration}</div>
               <button 
                  onClick={() => playSong(song, playlist.songs)}
                  className="ml-4 p-2 text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-transparent rounded-full"
                >
                   <Play className="w-5 h-5 fill-current" />
               </button>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
