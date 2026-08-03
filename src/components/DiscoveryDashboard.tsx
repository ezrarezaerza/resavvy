import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlaylistGroup } from '../types';
import { TagBar } from './TagBar';
import { DiscoveryShelf } from './DiscoveryShelf';
import { PlaylistCard } from './PlaylistCard';
import { SearchBar } from './SearchBar';
import { Music, User, Compass } from 'lucide-react';
import { OptimizedImage } from "./OptimizedImage";

interface DiscoveryDashboardProps {
  onSelectGroup: (id: string) => void;
  initialSearchQuery?: string;
}

export const DiscoveryDashboard = React.memo(function DiscoveryDashboard({ onSelectGroup, initialSearchQuery = '' }: DiscoveryDashboardProps) {
  const { token } = useAuth();
  const [trending, setTrending] = useState<PlaylistGroup[]>([]);
  const [fresh, setFresh] = useState<PlaylistGroup[]>([]);
  const [globalTags, setGlobalTags] = useState<string[]>([]);
  const [popularSongs, setPopularSongs] = useState<any[]>([]);
  const [popularUsers, setPopularUsers] = useState<any[]>([]);
  const [taggedPlaylists, setTaggedPlaylists] = useState<PlaylistGroup[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(() => {
    return initialSearchQuery && initialSearchQuery.startsWith('#') ? initialSearchQuery.slice(1) : null;
  });
  
  const [searchQuery, setSearchQuery] = useState(() => {
    return initialSearchQuery && initialSearchQuery.startsWith('#') ? '' : initialSearchQuery;
  });
  const [searchResults, setSearchResults] = useState<{ playlists: any[], songs: any[], users: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          
          const res = await fetch(`/api/search/global?q=${encodeURIComponent(searchQuery)}`, { 
            headers,
            signal: abortController.signal
          });
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
          }
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            console.error('Search failed', e);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsSearching(false);
            setIsLoading(false);
          }
        }
      } else {
        setSearchResults(null);
        setIsLoading(true);
        try {
          const url = new URL('/api/social', window.location.origin);
          url.searchParams.append('type', 'discovery');
          if (selectedTag) url.searchParams.append('tag', selectedTag);
          
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(url.toString(), { 
            headers,
            signal: abortController.signal
          });
          if (res.ok) {
            const data = await res.json();
            if (selectedTag) {
              setTaggedPlaylists(data.playlists || []);
            } else {
              setTrending(data.trending || []);
              setFresh(data.fresh || []);
              setGlobalTags(data.globalTags || []);
              setPopularSongs(data.popularSongs || []);
              setPopularUsers(data.popularUsers || []);
            }
          }
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoading(false);
          }
        }
      }
    };

    fetchData();

    return () => abortController.abort();
  }, [searchQuery, token, selectedTag]);

  // Synchronize external prop changes (from topnav)
  useEffect(() => {
    if (initialSearchQuery && initialSearchQuery.startsWith('#')) {
      setSelectedTag(initialSearchQuery.slice(1));
      setSearchQuery('');
    } else if (initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
      setSelectedTag(null);
    }
  }, [initialSearchQuery]);

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto pb-32 no-scrollbar">
      <div className="mt-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-2 flex items-center gap-3">
              <Compass className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              Discover
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Find songs, playlists, users or explore public curations
            </p>
          </div>
        </div>

        <div className="mb-8 max-w-3xl">
          <SearchBar onSearch={setSearchQuery} initialValue={initialSearchQuery} />
        </div>

        {!searchQuery && (
          <TagBar 
            tags={globalTags} 
            selectedTag={selectedTag} 
            onSelectTag={(tag) => setSelectedTag(tag)} 
          />
        )}

        {isSearching || isLoading ? (
          <div className="flex justify-center py-20 text-gray-500">
             Loading...
          </div>
        ) : searchQuery && searchResults ? (
          <div className="space-y-12 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
              Search Results for <span className="text-indigo-500">"{searchQuery}"</span>
            </h2>
            
            {searchResults.songs.length > 0 && (
               <div>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                     <Music className="w-5 h-5 text-indigo-500" />
                     Songs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {searchResults.songs.map((song) => (
                        <div 
                          key={song.id} 
                          onClick={() => onSelectGroup(song.playlist.id)}
                          className="p-4 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-xl flex items-center gap-4 hover:border-indigo-500/50 hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer transition-all shadow-sm"
                        >
                           <OptimizedImage src={song.thumbnailUrl} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                           <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{song.title}</h4>
                              <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {searchResults.playlists.length > 0 && (
               <div>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                     Playlists
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {searchResults.playlists.map((playlist) => (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        onClick={() => onSelectGroup(playlist.id)}
                      />
                    ))}
                  </div>
               </div>
            )}

            {searchResults.users.length > 0 && (
               <div>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                     <User className="w-5 h-5 text-indigo-500" />
                     Users
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                     {searchResults.users.map((u) => (
                        <div 
                          key={u.id}
                          onClick={() => {
                             window.history.pushState(null, '', `/u/${u.username}`);
                             window.dispatchEvent(new Event("popstate"));
                          }}
                          className="p-4 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-xl flex items-center gap-4 hover:bg-white/80 dark:hover:bg-white/10 transition-all shadow-sm cursor-pointer"
                        >
                           <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                              {u.avatarUrl ? (
                                 <OptimizedImage src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{u.name.charAt(0).toUpperCase()}</div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{u.name}</h4>
                              <p className="text-sm text-gray-500 truncate">@{u.username}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {searchResults.songs.length === 0 && searchResults.playlists.length === 0 && searchResults.users.length === 0 && (
               <div className="py-12 flex flex-col items-center justify-center text-gray-500 text-center">
                  <span className="text-4xl mb-4">🕵️</span>
                  <p className="text-xl font-medium">No results found for "{searchQuery}"</p>
                  <p className="mt-2 text-sm">Try searching for a different keyword or artist.</p>
               </div>
            )}
          </div>
        ) : selectedTag ? (
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              #{selectedTag}
            </h3>
            {taggedPlaylists.length === 0 ? (
              <p className="text-gray-500">No playlists found for this tag.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {taggedPlaylists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onClick={() => onSelectGroup(playlist.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in duration-500">
            {popularSongs.length > 0 && (
               <div>
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-4 flex items-center gap-2">
                     <Music className="w-6 h-6 text-indigo-500" />
                     Popular Songs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {popularSongs.map((song) => (
                        <div 
                          key={song.id} 
                          onClick={() => onSelectGroup(song.playlist.id)}
                          className="p-4 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-xl flex items-center gap-4 hover:border-indigo-500/50 hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer transition-all shadow-sm"
                        >
                           <OptimizedImage src={song.thumbnailUrl} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                           <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{song.title}</h4>
                              <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            <DiscoveryShelf
              title="Trending Curations"
              playlists={trending}
              onSelectPlaylist={onSelectGroup}
            />
            
            {popularUsers.length > 0 && (
               <div>
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-white/10 pb-4 flex items-center gap-2">
                     <User className="w-6 h-6 text-indigo-500" />
                     Popular Curators
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                     {popularUsers.map((u) => (
                        <div 
                          key={u.id}
                          onClick={() => {
                             window.history.pushState(null, '', `/u/${u.username}`);
                             window.dispatchEvent(new Event("popstate"));
                          }}
                          className="p-4 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-xl flex items-center gap-4 hover:bg-white/80 dark:hover:bg-white/10 transition-all shadow-sm cursor-pointer"
                        >
                           <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                              {u.avatarUrl ? (
                                 <OptimizedImage src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{u.name.charAt(0).toUpperCase()}</div>
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{u.name}</h4>
                              <p className="text-sm text-gray-500 truncate">@{u.username}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            <DiscoveryShelf
              title="Fresh Finds"
              playlists={fresh}
              onSelectPlaylist={onSelectGroup}
            />
          </div>
        )}
      </div>
    </div>
  );
});
