import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatCard } from './StatCard';
import { ProgressBar } from './ProgressBar';
import { BarChart2, PlayCircle, Clock, TrendingUp, Heart, Share2, Disc3, Award, Activity } from 'lucide-react';
import { PlaylistCard } from './PlaylistCard';
import { Song, PlaylistGroup } from '../types';

interface StatsData {
  listener: {
    topArtists: { name: string; playCount: number }[];
    topSong: Song | null;
    totalPlays: number;
    totalLikedSongs: number;
    totalListeningTimeSeconds: number;
  };
  curator: {
    totalLikes: number;
    totalForks: number;
    topPlaylist: PlaylistGroup | null;
    hasPublicPlaylists: boolean;
    publicPlaylistsCount: number;
    curatorScore: number;
    curatorLevel: string;
  };
  library: {
    totalPlaylists: number;
    totalSongsSaved: number;
    uniqueArtistsSaved: number;
  };
}

export function AnalyticsDashboard({ onSelectGroup }: { onSelectGroup: (id: string) => void }) {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/social?type=stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-transparent min-h-screen flex items-center justify-center">
        <div className="text-gray-500 font-medium">Loading your analytics...</div>
      </div>
    );
  }

  if (!stats) return null;

  const { listener, curator } = stats;
  const maxArtistPlays = listener.topArtists.length > 0 ? listener.topArtists[0].playCount : 0;

  const formatListeningTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const handleShare = async () => {
    const time = formatListeningTime(listener.totalListeningTimeSeconds);
    const topArtist = listener.topArtists[0]?.name || 'N/A';
    
    const text = `🎵 My Music Wrapped\n\n🎧 Listening Time: ${time}\n🔥 Curator Rank: ${curator.curatorLevel} (Score: ${curator.curatorScore})\n👑 Top Artist: ${topArtist}\n❤️ Songs Saved: ${stats.library.totalSongsSaved}\n\nBuilt on AI Studio 🚀`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Music Wrapped',
          text: text,
        });
        addToast('Shared successfully!', 'success');
      } else {
        await navigator.clipboard.writeText(text);
        addToast('Stats copied to clipboard!', 'success');
      }
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto pb-32 no-scrollbar">
      <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-2 flex items-center gap-3">
              <BarChart2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              Your Analytics
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
              Dive into your listening and curating impact.
            </p>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full font-semibold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
          >
            <Share2 className="w-5 h-5" />
            Share Wrapped
          </button>
        </div>

        {/* The Listener */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 flex items-center gap-2">
             <PlayCircle className="w-6 h-6 text-indigo-500" />
             The Listener
          </h2>

          {listener.totalPlays === 0 ? (
             <div className="bg-gray-100/50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center">
                 <Disc3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                 <p className="text-gray-900 dark:text-white font-bold text-xl mb-2">It's quiet here...</p>
                 <p className="text-gray-500 dark:text-gray-400">Play some songs to build up your listening profile.</p>
             </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Stats column */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <StatCard 
                     title="Listening Time" 
                     value={formatListeningTime(listener.totalListeningTimeSeconds)} 
                     icon={Clock} 
                   />
                   <StatCard 
                     title="Total Plays" 
                     value={listener.totalPlays} 
                     icon={TrendingUp} 
                   />
                   <StatCard 
                     title="Liked Songs" 
                     value={listener.totalLikedSongs} 
                     icon={Heart} 
                   />
                   <StatCard 
                     title="Top Track" 
                     value={listener.topSong?.title || '--'} 
                     icon={PlayCircle} 
                   />
                </div>
              </div>

              {/* Top Artists column */}
              <div className="flex-1 bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                 <h4 className="text-gray-500 dark:text-gray-400 font-semibold text-sm tracking-widest uppercase mb-6 flex items-center justify-between">
                    Top Artists
                    <Disc3 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                 </h4>
                 <div className="space-y-5">
                   {listener.topArtists.map((artist, idx) => (
                      <ProgressBar 
                        key={idx}
                        label={artist.name}
                        value={artist.playCount}
                        percentage={(artist.playCount / maxArtistPlays) * 100}
                      />
                   ))}
                 </div>
              </div>
            </div>
          )}
        </section>

        {/* The Curator */}
        {(curator.hasPublicPlaylists || curator.totalLikes > 0 || curator.topPlaylist) && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 flex items-center gap-2">
               <Share2 className="w-6 h-6 text-purple-500" />
               Creator Impact
            </h2>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <StatCard 
                     title="Curator Score" 
                     value={curator.curatorScore} 
                     icon={Activity} 
                   />
                   <StatCard 
                     title="Curator Rank" 
                     value={curator.curatorLevel} 
                     icon={Award} 
                   />
                   <StatCard 
                     title="Total Likes" 
                     value={curator.totalLikes} 
                     icon={Heart} 
                   />
                   <StatCard 
                     title="Playlists Cloned" 
                     value={curator.totalForks} 
                     icon={Share2} 
                   />
                </div>
              </div>

              <div className="flex-1 bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                 <h4 className="text-gray-500 dark:text-gray-400 font-semibold text-sm tracking-widest uppercase mb-6 flex items-center justify-between">
                    Most Popular Playlist
                 </h4>
                 
                 {curator.topPlaylist ? (
                    <div className="max-w-xs mx-auto">
                      <PlaylistCard 
                        playlist={curator.topPlaylist} 
                        onClick={() => onSelectGroup(curator.topPlaylist!.id)} 
                      />
                    </div>
                 ) : (
                    <div className="text-center text-gray-500 py-8">
                      No popular playlists yet. Keep curating!
                    </div>
                 )}
              </div>
            </div>
          </section>
        )}
        {/* Library & Collection */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 mt-16">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 flex items-center gap-2">
             <Disc3 className="w-6 h-6 text-pink-500" />
             Library & Collection
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
             <StatCard 
               title="Total Playlists" 
               value={stats.library.totalPlaylists} 
               icon={Disc3} 
             />
             <StatCard 
               title="Songs Saved" 
               value={stats.library.totalSongsSaved} 
               icon={Heart} 
             />
             <StatCard 
               title="Unique Artists" 
               value={stats.library.uniqueArtistsSaved} 
               icon={Activity} 
             />
          </div>
        </section>
      </div>
    </div>
  );
}
