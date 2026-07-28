import React, { useState, useEffect, useMemo } from 'react';
import { PlaylistGroup, Song } from '../types';
import { PlaylistCard } from './PlaylistCard';
import { DiscoveryShelf } from './DiscoveryShelf';
import { SongCard } from './SongCard';
import { Plus, Disc3, Play, Clock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useSettings } from '../context/SettingsContext';
import { OptimizedImage } from "./OptimizedImage";
import { motion, AnimatePresence } from 'framer-motion';

interface HomeDashboardProps {
  groups: PlaylistGroup[];
  onSelectGroup: (id: string | null) => void;
  onCreatePlaylist: () => void;
}

export const HomeDashboard = React.memo(function HomeDashboard({ groups, onSelectGroup, onCreatePlaylist }: HomeDashboardProps) {
  const { token, isLoading: isAuthLoading } = useAuth();
  const { isLoadingPlaylists } = usePlaylist();
  const { playSong } = usePlayer();
  const { promoBanners, slideshowInterval } = useSettings();
  const [heavyRotation, setHeavyRotation] = useState<Song[]>([]);
  const [trending, setTrending] = useState<Song[]>([]);
  
  // New Discovery State
  const [recommended, setRecommended] = useState<{ songs: Song[], basedOn: string[] } | null>(null);
  const [trendingCurations, setTrendingCurations] = useState<PlaylistGroup[]>([]);
  const [freshCurations, setFreshCurations] = useState<PlaylistGroup[]>([]);
  const [quickPicks, setQuickPicks] = useState<Song[]>([]);
  const [globalTags, setGlobalTags] = useState<string[]>([]);

  // Slideshow States
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (!promoBanners || promoBanners.length <= 1) return;
    const speedMs = (slideshowInterval && slideshowInterval > 0 ? slideshowInterval : 6) * 1000;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % promoBanners.length);
    }, speedMs);
    return () => clearInterval(interval);
  }, [promoBanners, slideshowInterval]);

  // Adjust index if out of bounds (e.g. if banners got deleted in admin)
  useEffect(() => {
    if (promoBanners && currentBannerIndex >= promoBanners.length) {
      setCurrentBannerIndex(0);
    }
  }, [promoBanners, currentBannerIndex]);

  const handlePrevBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!promoBanners || promoBanners.length === 0) return;
    setCurrentBannerIndex(prev => (prev - 1 + promoBanners.length) % promoBanners.length);
  };

  const handleNextBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!promoBanners || promoBanners.length === 0) return;
    setCurrentBannerIndex(prev => (prev + 1) % promoBanners.length);
  };

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    // Fetch global trending unconditionally
    fetch('/api/social?type=trending', { signal })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setTrending(data); })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });

    // Fetch discovery shelves unconditionally
    fetch('/api/social?type=discovery', { signal })
      .then(res => res.json())
      .then(data => {
          if (data.trending) setTrendingCurations(data.trending);
          if (data.fresh) setFreshCurations(data.fresh);
          if (data.quickPicks) setQuickPicks(data.quickPicks);
          if (data.globalTags) setGlobalTags(data.globalTags);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); });

    if (token) {
      fetch('/api/social?type=rotation', { headers: { 'Authorization': `Bearer ${token}` }, signal })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setHeavyRotation(data); })
        .catch(err => { if (err.name !== 'AbortError') console.error(err); });
        
      fetch('/api/social?type=recommended', { headers: { 'Authorization': `Bearer ${token}` }, signal })
        .then(res => res.json())
        .then(data => { if (data.songs) setRecommended(data); })
        .catch(err => { if (err.name !== 'AbortError') console.error(err); });
    }
    return () => abortController.abort();
  }, [token]);

  useEffect(() => {
    const handleSongPlayed = (e: any) => {
      const songId = e.detail?.songId;
      if (songId) {
        setTrending(prev => prev.map(s => s.id === songId ? { ...s, playCount: (s.playCount || 0) + 1 } : s));
        setHeavyRotation(prev => prev.map(s => s.id === songId ? { ...s, playCount: (s.playCount || 0) + 1 } : s));
        setQuickPicks(prev => prev.map(s => s.id === songId ? { ...s, playCount: (s.playCount || 0) + 1 } : s));
        setRecommended(prev => prev ? { ...prev, songs: prev.songs.map(s => s.id === songId ? { ...s, playCount: (s.playCount || 0) + 1 } : s) } : prev);
      }
    };
    window.addEventListener('resavvy_song_played', handleSongPlayed);
    return () => window.removeEventListener('resavvy_song_played', handleSongPlayed);
  }, []);

  const getHighResThumbnail = (url: string) => {
    if (url && url.includes('mqdefault.jpg')) return url.replace('mqdefault.jpg', 'hqdefault.jpg');
    return url;
  };

  const shuffledGroups = useMemo(() => {
    return [...groups].sort(() => 0.5 - Math.random());
  }, [groups.length]);

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto pb-32 no-scrollbar">
      {/* Promotional Slideshow Banner */}
      {promoBanners && promoBanners.length > 0 && (
        <div className="mb-8 w-full relative overflow-hidden h-48 sm:h-56 md:h-64 rounded-3xl bg-slate-900 border border-slate-200/5 dark:border-white/5 shadow-lg select-none group">
          <AnimatePresence mode="wait">
            {promoBanners[currentBannerIndex] && (() => {
              const banner = promoBanners[currentBannerIndex];
              const content = (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, scale: 1.01 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.99 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {/* Background Image - Responsive (Desktop & Mobile versions) */}
                  <div className="absolute inset-0 w-full h-full">
                    {/* Desktop Version */}
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || ""}
                      className="hidden sm:block w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Mobile Version - Falls back to desktop if not configured */}
                    <img
                      src={banner.mobileImageUrl || banner.imageUrl}
                      alt={banner.title || ""}
                      className="block sm:hidden w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Optional gradient overlay toggle */}
                    {banner.enableGradient !== false && (
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
                    )}
                  </div>

                  {/* Banner Content */}
                  {!banner.hideContent && (
                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 z-10">
                      <span className={`text-[10px] md:text-xs font-bold tracking-widest uppercase mb-1 ${
                        banner.type === "ad" ? "text-amber-400" : "text-indigo-400"
                      }`}>
                        {banner.type === "ad" ? "Advertisement" : "Promoted Spotlight"}
                      </span>
                      {banner.title && (
                        <h2 className="text-xl md:text-3xl font-black text-white max-w-xl tracking-tight leading-tight line-clamp-2">
                          {banner.title}
                        </h2>
                      )}
                      {banner.subtitle && (
                        <p className="text-xs md:text-sm text-slate-300 font-medium max-w-lg mt-1.5 line-clamp-1 md:line-clamp-2">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.linkUrl && banner.buttonText !== "" && (
                        <div className="mt-4">
                          <span className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-full shadow-md transition-colors">
                            {banner.buttonText || "Explore Now"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );

              if (banner.linkUrl) {
                return (
                  <a
                    key={banner.id}
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 w-full h-full z-10"
                  >
                    {content}
                  </a>
                );
              }

              return content;
            })()}
          </AnimatePresence>

          {/* Navigation Controls (Only if multiple banners) */}
          {promoBanners.length > 1 && (
            <>
              {/* Left Arrow */}
              <button
                onClick={handlePrevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-20"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={handleNextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-20"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Slide Indicator Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-xs">
                {promoBanners.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setCurrentBannerIndex(dotIndex);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      dotIndex === currentBannerIndex
                        ? "bg-indigo-400 w-3"
                        : "bg-white/40 hover:bg-white/75"
                    }`}
                    aria-label={`Go to slide ${dotIndex + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Guest Welcome Banner */}
      {!token && !isAuthLoading && (
        <div className="mb-6 mt-4 bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-600/20 dark:border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4">
            Welcome to <span className="text-indigo-600 dark:text-indigo-500">Resavvy</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl font-medium max-w-2xl leading-relaxed mb-6">
            Discover trending music, curations, and build your own library. 
            Sign in to start organizing your ultimate collection.
          </p>
        </div>
      )}

      {/* Shelf 1: Your Curations */}
      {(isAuthLoading || isLoadingPlaylists || token || groups.length > 0) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              Your Curations
            </h2>
            {!isAuthLoading && !isLoadingPlaylists && groups.length === 0 && (
               <button
                 onClick={onCreatePlaylist}
                 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
               >
                 + Create Playlist
               </button>
            )}
          </div>
          
          {isAuthLoading || isLoadingPlaylists ? (
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-[85vw] md:w-56 shrink-0 animate-pulse bg-gray-200 dark:bg-white/5 rounded-2xl aspect-[16/9] md:aspect-square flex items-center justify-center">
                  <Disc3 className="w-8 h-8 text-indigo-500 animate-spin opacity-40" />
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
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
            <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x snap-mandatory">
              {shuffledGroups.map(group => (
                <div key={group.id} className="w-[85vw] md:w-56 shrink-0 snap-center md:snap-align-none">
                  <PlaylistCard 
                    playlist={group} 
                    onClick={() => onSelectGroup(group.id)} 
                    className="aspect-[16/9] md:aspect-square"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shelf 2: Heavy Rotation */}
      {heavyRotation.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 mb-1">
            Your Recent Favorites
          </p>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            On Heavy Rotation
          </h3>
          <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
            {heavyRotation.map((song, i) => <SongCard key={song.id || song.youtubeId || i} song={song} type="heavy" onClick={playSong} />)}
          </div>
        </div>
      )}

      {/* Shelf 3: Trending Worldwide */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          Trending Worldwide
        </h3>
        {trending.length > 0 ? (
          <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
            {trending.map((song, i) => <SongCard key={song.id || song.youtubeId || i} song={song} type="trending" onClick={playSong} />)}
          </div>
        ) : (
          <div className="flex flex-col py-8 px-6 bg-gray-100/50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
            <p className="text-gray-500 dark:text-gray-400 font-medium">The charts are quiet right now. Start playing songs to see them trend globally!</p>
          </div>
        )}
      </div>

      {/* Recommended for You */}
      {recommended && recommended.songs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
            Recommended for You
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Based on {recommended.basedOn.join(', ')}
          </p>
          <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
            {recommended.songs.map((song, i) => <SongCard key={song.id || song.youtubeId || i} song={song} type="heavy" onClick={playSong} />)}
          </div>
        </div>
      )}

      {/* Quick Picks (Random Songs) */}
      {quickPicks.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 mb-1">
            Discover Something New
          </p>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Quick Picks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {quickPicks.map((song, index) => (
                <div 
                   key={song.id} 
                   onClick={() => onSelectGroup((song as any).playlist?.id)}
                  className={`p-3 bg-gradient-to-r from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-white/5 backdrop-blur-md border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center gap-4 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group ${index >= 6 ? 'hidden md:flex' : ''}`}
                >
                   <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-sm">
                     <OptimizedImage src={getHighResThumbnail(song.thumbnailUrl)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                     <div className="absolute inset-0 bg-indigo-900/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                       <Play className="w-6 h-6 text-white fill-white shadow-sm" />
                     </div>
                   </div>
                   <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-bold text-gray-900 dark:text-white truncate">{song.title}</h4>
                      <p className="text-sm text-indigo-600/80 dark:text-indigo-300/80 font-medium truncate mt-0.5">{song.artist}</p>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Community Favorites */}
      {trendingCurations.length > 0 && (
          <DiscoveryShelf
            title="Community Favorites"
            description="TOP CURATIONS"
            playlists={trendingCurations}
            onSelectPlaylist={onSelectGroup}
            mobileWide={true}
          />
      )}

      {/* Fresh Finds */}
      {freshCurations.length > 0 && (
          <DiscoveryShelf
            title="Fresh Finds"
            description="NEW ARRIVALS"
            playlists={freshCurations}
            onSelectPlaylist={onSelectGroup}
          />
      )}
         
      {/* Moods & Genres */}
      {globalTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
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
});
