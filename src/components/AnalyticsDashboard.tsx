import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatCard } from './StatCard';
import { ProgressBar } from './ProgressBar';
import { BarChart2, PlayCircle, Clock, TrendingUp, Heart, Share2, Disc3 } from 'lucide-react';
import { PlaylistCard } from './PlaylistCard';
import { Song, PlaylistGroup } from '../types';

interface StatsData {
  listener: {
    topArtists: { name: string; playCount: number }[];
    topSong: Song | null;
    totalPlays: number;
  };
  curator: {
    totalLikes: number;
    totalForks: number;
    topPlaylist: PlaylistGroup | null;
    hasPublicPlaylists: boolean;
  };
}

export function AnalyticsDashboard({ onSelectGroup }: { onSelectGroup: (id: string) => void }) {
  const { token, user } = useAuth();
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
      <div className="flex-1 bg-slate-50 dark:bg-[#0a0a0a] min-h-screen flex items-center justify-center">
        <div className="text-gray-500 font-medium">Loading your analytics...</div>
      </div>
    );
  }

  if (!stats) return null;

  const { listener, curator } = stats;
  const maxArtistPlays = listener.topArtists.length > 0 ? listener.topArtists[0].playCount : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0a0a0a] min-h-screen pb-32 no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex items-center gap-4 mb-10">
          <BarChart2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none mb-2">
              Your Analytics
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
              Dive into your listening and curating impact.
            </p>
          </div>
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
                     title="Total Plays" 
                     value={listener.totalPlays} 
                     icon={TrendingUp} 
                   />
                   <StatCard 
                     title="Top Track" 
                     value={listener.topSong?.title || '--'} 
                     icon={PlayCircle} 
                   />
                </div>
              </div>

              {/* Top Artists column */}
              <div className="flex-1 bg-white/5 dark:bg-[#1a1a1a] border border-gray-200/50 dark:border-white/10 rounded-2xl p-6 shadow-sm">
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

              <div className="flex-1 bg-white/5 dark:bg-[#1a1a1a] border border-gray-200/50 dark:border-white/10 rounded-2xl p-6 shadow-sm">
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
      </div>
    </div>
  );
}
