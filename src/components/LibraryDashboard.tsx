import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tracklist } from './Tracklist';
import { BulkActionBar } from './BulkActionBar';
import { SearchBar } from './SearchBar';
import { SortConfig, SortKey } from './TracklistHeader';
import { DedupeModal } from './DedupeModal';
import { Song, PlaylistGroup } from '../types';
import { Library, Wand2 } from 'lucide-react';

export function LibraryDashboard() {
  const { token } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [showDedupeModal, setShowDedupeModal] = useState(false);

  useEffect(() => {
    fetchLibrarySongs();
  }, [token]);

  const fetchLibrarySongs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/songs', {
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

  const processedSongs = useMemo(() => {
    let result = [...songs];
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(song => 
        song.title.toLowerCase().includes(lowerQuery) || 
        song.artist?.toLowerCase().includes(lowerQuery)
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof Song] || '';
      let valB: any = b[sortConfig.key as keyof Song] || '';
      
      if (sortConfig.key === 'createdAt') {
        const timeA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
        const timeB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
        return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
      }
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [songs, searchQuery, sortConfig]);

  const handleToggleSongSelect = (songId: string) => {
    setSelectedSongIds(prev => 
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedSongIds.length === processedSongs.length) {
      setSelectedSongIds([]);
    } else {
      setSelectedSongIds(processedSongs.map(s => s.id));
    }
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const activeGroup: PlaylistGroup = {
    id: 'library',
    name: 'My Library',
    createdAt: Date.now(),
    songs: processedSongs
  };

  const selectedSongs = songs.filter(s => selectedSongIds.includes(s.id));

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0a0a0a] min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Library className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                My Library
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                {isLoading ? 'Loading...' : `${songs.length} unique tracks in your collection`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <SearchBar onSearch={setSearchQuery} placeholder="Filter your library..." />
            <button 
              onClick={() => setShowDedupeModal(true)}
              className="shrink-0 flex items-center justify-center bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white transition-colors w-10 h-10 rounded-full focus:outline-none"
              title="Clean Library"
            >
              <Wand2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isLoading && (
          <Tracklist 
            activeGroup={activeGroup}
            removeSong={() => {}} // No removal direct from library view for now
            selectionMode={true}
            selectedSongs={selectedSongIds}
            onToggleSongSelect={handleToggleSongSelect}
            onToggleSelectAll={handleToggleSelectAll}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        )}
      </div>

      <BulkActionBar 
        selectedSongs={selectedSongs}
        onClear={() => setSelectedSongIds([])}
        onComplete={() => {
          setSelectedSongIds([]);
        }}
      />

      <DedupeModal 
        isOpen={showDedupeModal} 
        onClose={() => setShowDedupeModal(false)} 
        onRefresh={fetchLibrarySongs}
      />
    </div>
  );
}
