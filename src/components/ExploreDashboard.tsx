import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tracklist } from './Tracklist';
import { SearchBar } from './SearchBar';
import { SortConfig, SortKey } from './TracklistHeader';
import { Song, PlaylistGroup } from '../types';
import { Globe, Music } from 'lucide-react';

export function ExploreDashboard() {
  const { token } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'playCount', direction: 'desc' });

  useEffect(() => {
    fetchExploreSongs();
  }, [token, searchQuery]); // re-fetch when search changes mostly for server-side search, but we handle it

  const fetchExploreSongs = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const url = new URL('/api/social', window.location.origin);
      url.searchParams.append('type', 'explore');
      if (searchQuery) url.searchParams.append('query', searchQuery);
      
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSongs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleSongPlayed = (e: any) => {
      const songId = e.detail?.songId;
      if (songId) {
        setSongs(prev => prev.map(s => s.id === songId ? { ...s, playCount: (s.playCount || 0) + 1 } : s));
      }
    };
    window.addEventListener('resavvy_song_played', handleSongPlayed);
    return () => window.removeEventListener('resavvy_song_played', handleSongPlayed);
  }, []);

  const processedSongs = useMemo(() => {
    let result = [...songs];
    
    // Sort logic is client side for the other columns that aren't global default playCount
    result.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof Song] || '';
      let valB: any = b[sortConfig.key as keyof Song] || '';
      
      if (sortConfig.key === 'playCount') {
        const pA = a.playCount || 0;
        const pB = b.playCount || 0;
        return sortConfig.direction === 'asc' ? pA - pB : pB - pA;
      }

      if (sortConfig.key === 'duration') {
        const pA = a.playlistCount || 0;
        const pB = b.playlistCount || 0;
        return sortConfig.direction === 'asc' ? pA - pB : pB - pA;
      }
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [songs, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const activeGroup: PlaylistGroup = {
    id: 'explore',
    name: 'Global Catalog',
    createdAt: Date.now(),
    songs: processedSongs
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Globe className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                Explore Global Catalog
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                {isLoading ? 'Loading...' : `Discover popular tracks across the platform`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <SearchBar onSearch={setSearchQuery} placeholder="Search global catalog..." />
          </div>
        </div>

        {!isLoading && songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Music className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-xl font-medium text-gray-900 dark:text-white">No tracks found</p>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : (
          !isLoading && (
            <Tracklist 
              activeGroup={activeGroup}
              removeSong={() => {}}
              sortConfig={sortConfig}
              onSort={handleSort}
              variant="explore"
            />
          )
        )}
      </div>
    </div>
  );
}
