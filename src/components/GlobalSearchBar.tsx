import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Music, ListMusic, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GlobalSearchBarProps {
  onNavigate?: (id: string, searchPrefix?: string) => void;
}

export function GlobalSearchBar({ onNavigate }: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ playlists: any[], songs: any[], users: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { token } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Failed to search', err);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, token]);

  const handlePlaylistClick = (playlistId: string) => {
    setIsOpen(false);
    setQuery('');
    if (onNavigate) {
       // Navigate to playlist details or public playlist page, but currently activeGroupId drives it.
       // We can just set activeGroupId to the playlist config (it expects an object or ID in appLayout, wait, AppLayout relies on id)
       // Let's pass the ID. We'll need to fetch it or check if it exists
       onNavigate(playlistId);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md mx-4" ref={searchRef}>
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-900 dark:text-white" strokeWidth={2.5} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length > 0) !isOpen && setIsOpen(true);
            else setIsOpen(false);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          placeholder="Search songs, playlists, or users..."
          className="block w-full bg-white/60 dark:bg-black/40 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-sm rounded-full py-2 pl-10 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500 transition-all font-medium"
        />
        {(query || isLoading) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
             {isLoading ? (
               <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
             ) : (
               <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                 <X className="h-4 w-4" />
               </button>
             )}
          </div>
        )}
      </div>

      {isOpen && results && (
        <div className="absolute top-full mt-2 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl border border-gray-200/50 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-96 overflow-y-auto pt-2 pb-2">
          
          {/* Songs */}
          {results.songs.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-1 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">Songs</div>
              {results.songs.map((song: any) => (
                <div 
                  key={song.id} 
                  className="px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors rounded-xl mx-2"
                  // we might play it directly, or navigate to playlist? 
                  // navigating to the playlist for now:
                  onClick={() => handlePlaylistClick(song.playlist.id)}
                >
                  <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{song.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{song.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Playlists */}
          {results.playlists.length > 0 && (
            <div className="mb-2">
              <div className="px-4 py-1 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">Playlists</div>
              {results.playlists.map((playlist: any) => (
                <div 
                  key={playlist.id} 
                  className="px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors rounded-xl mx-2"
                  onClick={() => handlePlaylistClick(playlist.id)}
                >
                  <div className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <ListMusic className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{playlist.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">by {playlist.user?.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div>
              <div className="px-4 py-1 text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase">Users</div>
              {results.users.map((u: any) => (
                <div 
                  key={u.id} 
                  className="px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors rounded-xl mx-2"
                  onClick={() => {
                     setIsOpen(false);
                     setQuery('');
                     window.history.pushState(null, '', `/u/${u.username}`);
                     window.dispatchEvent(new Event("popstate"));
                  }}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                     {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                           {u.name.charAt(0).toUpperCase()}
                        </div>
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.songs.length === 0 && results.playlists.length === 0 && results.users.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </div>
          )}
          
          {/* Link to Discovery */}
          <div className="p-2 mt-2 bg-black/5 dark:bg-black/20 border-t border-black/5 dark:border-white/5">
            <button 
              onClick={() => {
                 setIsOpen(false);
                 setQuery('');
                 if (onNavigate) onNavigate('discovery', query);
              }}
              className="w-full py-2 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
            >
               See all results in Discovery
            </button>
          </div>
          
        </div>
      )}
    </div>
  );
}
