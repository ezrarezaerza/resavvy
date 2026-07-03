import React, { useState, useEffect } from 'react';
import { PlaylistGroup, Song } from '../types';
import { PlaylistCard } from './PlaylistCard';
import { DiscoveryShelf } from './DiscoveryShelf';
import { Plus, Disc3, Play, Clock, Sparkles } from 'lucide-react';
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
  
  // New Discovery State
  const [recommended, setRecommended] = useState<{ songs: Song[], basedOn: string[] } | null>(null);
  const [trendingCurations, setTrendingCurations] = useState<PlaylistGroup[]>([]);
  const [freshCurations, setFreshCurations] = useState<PlaylistGroup[]>([]);
  const [quickPicks, setQuickPicks] = useState<Song[]>([]);
  const [globalTags, setGlobalTags] = useState<string[]>([]);

  useEffect(() => {
    // Fetch global trending unconditionally
    fetch('/api/social?type=trending')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTrending(data); })
      .catch(console.error);

    // Fetch discovery shelves unconditionally
    fetch('/api/social?type=discovery')
      .then(res => res.json())
      .then(data => {
          if (data.trending) setTrendingCurations(data.trending);
          if (data.fresh) setFreshCurations(data.fresh);
          if (data.quickPicks) setQuickPicks(data.quickPicks);
          if (data.globalTags) setGlobalTags(data.globalTags);
      })
      .catch(console.error);

    if (token) {
      fetch('/api/social?type=rotation', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setHeavyRotation(data); })
        .catch(console.error);
        
      fetch('/api/social?type=recommended', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (data.songs) setRecommended(data); })
        .catch(console.error);
    }
  }, [token]);

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
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <Play className="w-6 h-6 text-white ml-1 fill-white" />
          </div>
        </div>
        {type === 'trending' && song.globalRank && (
          <div className={`absolute top-0 left-0 w-10 h-10 flex items-center justify-center text-white font-bold rounded-br-xl rounded-tl-xl shadow-lg z-10 ${
            song.globalRank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
            song.globalRank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
            song.globalRank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
            'bg-black/70 backdrop-blur-md text-sm'
          }`}>
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
          {type === 'trending' && (
            <span className="shrink-0 flex items-center gap-1 font-mono font-medium text-indigo-600 dark:text-indigo-400">
              <Play className="w-3 h-3 inline" /> {song.playCount || 0}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto pb-32 no-scrollbar">
      {/* Guest Welcome Banner */}
      {!token && (
        <div className="mb-8 mt-4 bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-600/20 dark:border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
            Welcome to <span className="text-indigo-600 dark:text-indigo-500">Resavvy</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl font-medium max-w-2xl leading-relaxed mb-6">
            Discover trending music, curations, and build your own library. 
            Sign in to start organizing your ultimate collection.
          </p>
        </div>
      )}

      {/* Shelf 1: Your Curations (Hidden for Guests if empty) */}
      {(token || groups.length > 0) && (
        <div className="mb-8 mt-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            Your Curations
          </h2>
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
      )}

      {/* Shelf 2: Heavy Rotation */}
      {heavyRotation.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            On Heavy Rotation
          </h3>
          <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
            {heavyRotation.map((song, i) => renderSongCard(song, 'heavy', i))}
          </div>
        </div>
      )}

      {/* Shelf 3: Trending Worldwide */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          Trending Worldwide
        </h3>
        {trending.length > 0 ? (
          <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
            {trending.map((song, i) => renderSongCard(song, 'trending', i))}
          </div>
        ) : (
          <div className="flex flex-col py-8 px-6 bg-gray-100/50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
            <p className="text-gray-500 dark:text-gray-400 font-medium">The charts are quiet right now. Start playing songs to see them trend globally!</p>
          </div>
        )}
      </div>

      {/* Recommended for You */}
      {recommended && recommended.songs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Recommended for You
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Based on {recommended.basedOn.join(', ')}
          </p>
          <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
            {recommended.songs.map((song, i) => renderSongCard(song, 'heavy', i))}
          </div>
        </div>
      )}

      {/* Quick Picks (Random Songs) */}
      {quickPicks.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Quick Picks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {quickPicks.map((song) => (
                <div 
                   key={song.id} 
                   onClick={() => onSelectGroup((song as any).playlist?.id)}
                  className="p-4 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-xl flex items-center gap-4 hover:border-indigo-500/50 hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer transition-all shadow-sm group"
                >
                   <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden">
                     <img src={getHighResThumbnail(song.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <Play className="w-6 h-6 text-white fill-white" />
                     </div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">{song.title}</h4>
                      <p className="text-sm text-gray-500 truncate">{song.artist}</p>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Community Favorites */}
      {trendingCurations.length > 0 && (
          <div className="mb-8">
            <DiscoveryShelf
              title="Community Favorites"
              playlists={trendingCurations}
              onSelectPlaylist={onSelectGroup}
            />
          </div>
      )}

      {/* Fresh Finds */}
      {freshCurations.length > 0 && (
          <div className="mb-8">
            <DiscoveryShelf
              title="Fresh Finds"
              playlists={freshCurations}
              onSelectPlaylist={onSelectGroup}
            />
          </div>
      )}
      
      {/* Moods & Genres */}
      {globalTags.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Moods & Genres
          </h3>
          <div className="flex flex-wrap gap-3">
             {globalTags.map(tag => (
                <button 
                  key={tag}
                  className="px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-gray-800 dark:text-gray-200 font-medium rounded-full transition-colors border border-gray-200 dark:border-white/10 shadow-sm"
                  onClick={() => {
                     // Since HomeDashboard doesn't have a direct way to search tags, 
                     // we might just let it be a display for now or trigger a search if possible.
                     // The user requested the section, but not necessarily strict routing.
                     // We can route to Discover with the tag, but we don't have navigate.
                     // It's just a visual shelf for now.
                  }}
                >
                  #{tag}
                </button>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}
