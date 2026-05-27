import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tracklist } from './Tracklist';
import { SortConfig, SortKey } from './TracklistHeader';
import { Song, PlaylistGroup } from '../types';
import { Heart, Music } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export function LikedDashboard() {
  const { token } = useAuth();
  const { playSong } = usePlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'addedAt', direction: 'desc' });

  useEffect(() => {
    fetchLikedSongs();
  }, [token]);

  const fetchLikedSongs = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/songs?action=liked', {
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
    
    result.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof Song] || '';
      let valB: any = b[sortConfig.key as keyof Song] || '';
      
      if (sortConfig.key === 'playCount') {
        const pA = a.playCount || 0;
        const pB = b.playCount || 0;
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
    id: 'liked',
    name: 'Liked Songs',
    createdAt: Date.now(),
    songs: processedSongs
  };

  return (
    <div className="flex-1 overflow-y-auto bg-transparent min-h-screen pb-32">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                Liked Songs
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                {isLoading ? 'Loading...' : `${songs.length} tracks you love`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
               onClick={() => {
                  if (processedSongs.length > 0) {
                     playSong(processedSongs[0]); // Starts from first song
                  }
               }}
               className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-full text-white font-bold transition-all shadow-md shadow-indigo-500/20 active:scale-95"
            >
               Play All
            </button>
          </div>
        </div>

        {!isLoading && songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <Heart className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-700" />
            <p className="text-xl font-medium text-gray-900 dark:text-white">No liked songs yet</p>
            <p className="mt-2 text-center max-w-sm">Tap the heart icon on any track to add it to your Liked Songs.</p>
          </div>
        ) : (
          !isLoading && (
            <Tracklist 
              activeGroup={activeGroup}
              removeSong={(songId) => {
                 setSongs(songs.filter(s => s.id !== songId));
              }}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          )
        )}
      </div>
    </div>
  );
}
