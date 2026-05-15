import React, { useState, useEffect } from 'react';
import { PlaylistGroup, Song } from '../types';
import { PlaylistCard } from './PlaylistCard';
import { Plus, Disc3, Play, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';

interface HomeDashboardProps {
  groups: PlaylistGroup[];
  onSelectGroup: (id: string | null) => void;
  onCreatePlaylist: () => void;
}

export function HomeDashboard({ groups, onSelectGroup, onCreatePlaylist }: HomeDashboardProps) {
  const { token } = useAuth();
  const { playSong } = usePlayer();
  const [heavyRotation, setHeavyRotation] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);

  useEffect(() => {
    if (token) {
      fetch('/api/social?type=rotation', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setHeavyRotation(data); })
        .catch(console.error);

      fetch('/api/social?type=trending', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setTrending(data); })
        .catch(console.error);
    }
  }, [token]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getHighResThumbnail = (url: string) => {
    if (url && url.includes('mqdefault.jpg')) return url.replace('mqdefault.jpg', 'hqdefault.jpg');
    return url;
  };

  const renderSongCard = (song: Song, type: 'heavy' | 'trending', index: number) => (
    <div 
      key={song.id || song.youtubeId}
      className="group relative flex-shrink-0 w-36 md:w-48 flex flex-col gap-3 cursor-pointer"
      onClick={() => playSong(song)}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden shadow-md shadow-gray-200 dark:shadow-black/50">
        <img 
          src={getHighResThumbnail(song.thumbnailUrl)} 
          alt={song.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <Play className="w-6 h-6 text-white ml-1 fill-white" />
          </div>
        </div>
        {type === 'trending' && song.globalRank && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md">
            #{song.globalRank}
          </div>
        )}
      </div>
      <div>
        <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm md:text-base">
          {song.title}
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 flex items-center justify-between">
          <span className="truncate pr-2">{song.artist || 'Unknown'}</span>
          <span className="shrink-0 flex items-center gap-1 font-mono">
            <Play className="w-3 h-3 inline" /> {song.playCount || 0}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto pb-32 no-scrollbar">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-10">
        {getGreeting()}
      </h2>
      
      {/* Shelf 1: Your Curations */}
      <div className="mb-14">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            Your Curations
          </h3>
          {groups.length === 0 && (
             <button
               onClick={onCreatePlaylist}
               className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
             >
               + Create Playlist
             </button>
          )}
        </div>
        {groups.length === 0 ? (
          <div className="flex flex-col flex-start py-8 px-6 bg-gray-100/50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">You haven't created any playlists yet.</p>
            <button
               onClick={onCreatePlaylist}
               className="self-start flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-md transition-all duration-300 text-sm"
             >
               <Plus className="w-4 h-4" />
               Create
             </button>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
            {groups.map(group => (
              <div key={group.id} className="w-40 md:w-56 shrink-0">
                <PlaylistCard 
                  playlist={group} 
                  onClick={() => onSelectGroup(group.id)} 
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shelf 2: Heavy Rotation */}
      {heavyRotation.length > 0 && (
        <div className="mb-14">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            On Heavy Rotation
          </h3>
          <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
            {heavyRotation.map((song, i) => renderSongCard(song, 'heavy', i))}
          </div>
        </div>
      )}

      {/* Shelf 3: Trending Worldwide */}
      {trending.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Trending Worldwide
          </h3>
          <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
            {trending.map((song, i) => renderSongCard(song, 'trending', i))}
          </div>
        </div>
      )}
    </div>
  );
}
