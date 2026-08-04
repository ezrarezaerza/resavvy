import React, { useState, useEffect, useMemo } from 'react';
import { PlaylistGroup, Song } from '../types';
import { PlaylistCard } from './PlaylistCard';
import { DiscoveryShelf } from './DiscoveryShelf';
import { SongCard } from './SongCard';
import { Plus, Disc3, Play, Clock, Sparkles, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useSettings } from '../context/SettingsContext';
import { OptimizedImage } from "./OptimizedImage";
import { getThumbnailUrl } from '../utils/youtube';
import { motion, AnimatePresence } from 'framer-motion';

interface HomeDashboardProps {
  groups: PlaylistGroup[];
  onSelectGroup: (id: string | null, searchPrefix?: string) => void;
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
  const [featuredCollection, setFeaturedCollection] = useState<{ title: string; playlist: PlaylistGroup } | null>(null);
  const [customCollection, setCustomCollection] = useState<any>(null);
  const [customCollectionLoading, setCustomCollectionLoading] = useState<boolean>(true);
  const [layout, setLayout] = useState<any[] | null>(null);

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
          if (data.featuredCollection) setFeaturedCollection(data.featuredCollection);
          if (data.customCollection) setCustomCollection(data.customCollection);
          if (data.homepageLayout) setLayout(data.homepageLayout);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setCustomCollectionLoading(false));

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

  const getOptimizedThumbnail = (url: string) => {
    return getThumbnailUrl(url, 'mqdefault');
  };

  const shuffledGroups = useMemo(() => {
    return [...groups].sort(() => 0.5 - Math.random());
  }, [groups.length]);

  const mergedLayout = useMemo(() => {
    const defaultLayout = [
      { id: "promoBanners", name: "Advertisement Banners", visible: true, title: "Special Offers", layoutStyle: "carousel" },
      { id: "yourCurations", name: "Your Curations", visible: true, title: "Your Curations", layoutStyle: "carousel" },
      { id: "heavyRotation", name: "On Heavy Rotation", visible: true, title: "On Heavy Rotation", layoutStyle: "carousel" },
      { id: "trending", name: "Trending Worldwide", visible: true, title: "Trending Worldwide", layoutStyle: "carousel" },
      { id: "recommended", name: "Recommended for You", visible: true, title: "Recommended for You", layoutStyle: "carousel" },
      { id: "quickPicks", name: "Quick Picks", visible: true, title: "Quick Picks", layoutStyle: "grid" },
      { id: "spotlight", name: "Spotlight Curation", visible: true, title: "Spotlight Curation", layoutStyle: "hero" },
      { id: "customCollection", name: "Customizable Collection Row", visible: true, title: "Customizable Collection Row", layoutStyle: "carousel" },
      { id: "communityFavorites", name: "Community Favorites", visible: true, title: "Community Favorites", layoutStyle: "carousel" },
      { id: "freshFinds", name: "Fresh Finds", visible: true, title: "Fresh Finds", layoutStyle: "carousel" },
      { id: "moodsGenres", name: "Moods & Genres", visible: true, title: "Moods & Genres", layoutStyle: "grid" }
    ];

    const result = layout ? [...layout] : [];
    defaultLayout.forEach(defSec => {
      if (!result.some(s => s.id === defSec.id)) {
        result.push(defSec);
      }
    });
    return result;
  }, [layout]);

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto pb-32 no-scrollbar">
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

      {mergedLayout.map((section) => {
        if (!section.visible) return null;

        switch (section.id) {
          case "promoBanners":
            return (
              promoBanners && promoBanners.length > 0 && (
                <div key={section.id} className="mb-8 w-full relative overflow-hidden h-48 sm:h-56 md:h-64 rounded-3xl bg-slate-900 border border-slate-200/5 dark:border-white/5 shadow-lg select-none group">
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

                          {/* Content Overlay */}
                          {!banner.hideContent && (
                            <div className="absolute inset-y-0 left-0 w-full md:w-3/4 flex flex-col justify-center px-6 sm:px-10 md:px-14 z-10 text-left">
                              {banner.type && (
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 w-fit">
                                  {banner.type}
                                </span>
                              )}
                              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-sm">
                                {banner.title}
                              </h2>
                              {banner.subtitle && (
                                <p className="text-xs sm:text-sm text-gray-300 font-medium mt-1 sm:mt-2 max-w-lg line-clamp-2 leading-relaxed">
                                  {banner.subtitle}
                                </p>
                              )}
                              {banner.linkUrl && (
                                <a
                                  href={banner.linkUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-4 sm:mt-6 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] text-white font-bold text-[11px] sm:text-xs px-5 py-2.5 rounded-full shadow-md hover:shadow-indigo-500/15 transition-all w-fit flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>{banner.buttonText || "Learn More"}</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );

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
              )
            );

          case "yourCurations":
            return (
              (isAuthLoading || isLoadingPlaylists || token || groups.length > 0) && (
                <div key={section.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
                      {section.title || "Your Curations"}
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
              )
            );

          case "heavyRotation":
            return (
              heavyRotation.length > 0 && (
                <div key={section.id} className="mb-8">
                  <p className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 mb-1">
                    Your Recent Favorites
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                    {section.title || "On Heavy Rotation"}
                  </h3>
                  {section.layoutStyle === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {heavyRotation.map((song, i) => <SongCard key={song.id || song.youtubeId || i} song={song} type="heavy" onClick={playSong} />)}
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
                      {heavyRotation.map((song, i) => <SongCard key={song.id || song.youtubeId || i} song={song} type="heavy" onClick={playSong} />)}
                    </div>
                  )}
                </div>
              )
            );

          case "trending":
            return (
              <div key={section.id} className="mb-8">
                <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  {section.title || "Trending Worldwide"}
                </h3>
                {trending.length > 0 ? (
                  section.layoutStyle === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {trending.map((song, i) => <SongCard key={song.id || song.youtubeId || i} song={song} type="trending" onClick={playSong} />)}
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
                      {trending.map((song, i) => <SongCard key={song.id || song.youtubeId || i} song={song} type="trending" onClick={playSong} />)}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col py-8 px-6 bg-gray-100/50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">The charts are quiet right now. Start playing songs to see them trend globally!</p>
                  </div>
                )}
              </div>
            );

          case "recommended":
            return (
              recommended && recommended.songs.length > 0 && (
                <div key={section.id} className="mb-8">
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                    {section.title || "Recommended for You"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Based on {recommended.basedOn.join(', ')}
                  </p>
                  {section.layoutStyle === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {recommended.songs.map((song, i) => <SongCard key={song.id || song.youtubeId || i} song={song} type="heavy" onClick={playSong} />)}
                    </div>
                  ) : (
                    <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
                      {recommended.songs.map((song, i) => <SongCard key={song.id || song.youtubeId || i} song={song} type="heavy" onClick={playSong} />)}
                    </div>
                  )}
                </div>
              )
            );

          case "quickPicks":
            return (
              quickPicks.length > 0 && (
                <div key={section.id} className="mb-8">
                  <p className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 mb-1">
                    Discover Something New
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                    {section.title || "Quick Picks"}
                  </h3>
                  {section.layoutStyle === "carousel" ? (
                    <div className="flex overflow-x-auto gap-4 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
                      {quickPicks.map((song, index) => (
                        <div 
                          key={song.id} 
                          onClick={() => onSelectGroup((song as any).playlist?.id)}
                          className="w-[80vw] md:w-80 shrink-0 p-3 bg-gradient-to-r from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-white/5 backdrop-blur-md border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center gap-4 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group"
                        >
                          <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-sm">
                            <OptimizedImage src={getOptimizedThumbnail(song.thumbnailUrl)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {quickPicks.map((song, index) => (
                          <div 
                             key={song.id} 
                             onClick={() => onSelectGroup((song as any).playlist?.id)}
                            className={`p-3 bg-gradient-to-r from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-white/5 backdrop-blur-md border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center gap-4 hover:border-indigo-400 dark:hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group ${index >= 6 ? 'hidden md:flex' : ''}`}
                          >
                             <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-sm">
                               <OptimizedImage src={getOptimizedThumbnail(song.thumbnailUrl)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                  )}
                </div>
              )
            );

          case "spotlight":
            return (
              featuredCollection && featuredCollection.playlist && (
                <div key={section.id} id="featured-homepage-spotlight" className="mb-10">
                  <p className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 mb-1">
                    Spotlight Curation
                  </p>
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                    {section.title || featuredCollection.title || "FEATURED SELECTION"}
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-br from-indigo-50/40 to-slate-50/50 dark:from-indigo-950/10 dark:to-slate-900/10 border border-indigo-100/65 dark:border-white/5 rounded-3xl p-6 shadow-sm">
                    {/* Left Column: Hero Playlist Banner (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col md:flex-row gap-6 items-center md:items-stretch">
                      <div 
                        className="w-full md:w-56 aspect-[16/9] md:aspect-square rounded-2xl overflow-hidden relative shadow-md group cursor-pointer shrink-0"
                        onClick={() => onSelectGroup(featuredCollection.playlist.id)}
                      >
                        {/* Playlist Cover Image */}
                        <OptimizedImage 
                          src={featuredCollection.playlist.customCoverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60"} 
                          alt={featuredCollection.playlist.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                        {/* Admin Badge */}
                        <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          CURATED
                        </div>
                      </div>

                      {/* Playlist Text Details */}
                      <div className="flex flex-col justify-between py-1 text-center md:text-left">
                        <div>
                          <h4 
                            className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
                            onClick={() => onSelectGroup(featuredCollection.playlist.id)}
                          >
                            {featuredCollection.playlist.name}
                          </h4>
                          <p className="text-xs text-indigo-600/90 dark:text-indigo-400 font-semibold mt-1">
                            by {featuredCollection.playlist.user?.name || featuredCollection.playlist.user?.username || "Admin Curation"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed max-w-md line-clamp-3">
                            {featuredCollection.description || featuredCollection.playlist.description || "A special curation hand-picked by our editors."}
                          </p>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2 justify-center md:justify-start">
                          <button 
                            onClick={() => onSelectGroup(featuredCollection.playlist.id)}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Disc3 className="w-4 h-4 animate-spin" />
                            View Curation
                          </button>
                          {featuredCollection.playlist.songs && featuredCollection.playlist.songs.length > 0 && (
                            <button 
                              onClick={() => playSong(featuredCollection.playlist.songs[0])}
                              className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 font-bold rounded-full text-xs transition-all cursor-pointer flex items-center gap-2 border border-gray-300 dark:border-white/10"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Quick Play
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Top 3 Songs from the playlist (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/10 pt-6 lg:pt-0 lg:pl-6">
                      <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-3">
                        Featured Tracks ({featuredCollection.playlist.songs?.length || 0})
                      </span>
                      
                      <div className="flex flex-col gap-2.5">
                        {featuredCollection.playlist.songs && featuredCollection.playlist.songs.length > 0 ? (
                          featuredCollection.playlist.songs.slice(0, 3).map((song: any) => (
                            <div 
                              key={song.id} 
                              onClick={() => playSong(song)}
                              className="p-2.5 bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-100 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 rounded-xl flex items-center gap-3 cursor-pointer transition-all group"
                            >
                              <div className="relative w-11 h-11 shrink-0 rounded-lg overflow-hidden shadow-sm">
                                <OptimizedImage 
                                  src={getOptimizedThumbnail(song.thumbnailUrl)} 
                                  alt="" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Play className="w-4 h-4 text-white fill-white" />
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-xs text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {song.title}
                                </h4>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                  {song.artist || "Unknown Artist"}
                                </p>
                              </div>

                              <div className="text-[10px] text-gray-400 pr-2 shrink-0">
                                {song.duration || "YouTube"}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-500 text-xs">
                            No songs in this curation yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            );

          case "customCollection":
            return (
              customCollectionLoading ? (
                <div key={section.id} className="mb-6 animate-pulse">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded mb-2"></div>
                  <div className="h-8 w-64 bg-gray-300 dark:bg-white/20 rounded mb-4"></div>
                  <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar">
                    {[1, 2, 3, 4].map(idx => (
                      <div key={idx} className="w-48 md:w-64 h-48 md:h-64 bg-gray-200 dark:bg-white/5 rounded-2xl shrink-0"></div>
                    ))}
                  </div>
                </div>
              ) : customCollection && customCollection.items && customCollection.items.length > 0 ? (
                <div key={section.id} id="custom-curated-homepage-row" className="mb-8">
                  {customCollection.subtitle && (
                    <p className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 mb-1">
                      {customCollection.subtitle}
                    </p>
                  )}
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                    {section.title || customCollection.title || "Curated Collection"}
                  </h3>
                  
                  {customCollection.type === "playlists" ? (
                    section.layoutStyle === "grid" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {customCollection.items.map((playlist: any) => (
                          <div key={playlist.id} className="w-full">
                            <PlaylistCard 
                              playlist={playlist} 
                              onClick={() => onSelectGroup(playlist.id)} 
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex overflow-x-auto gap-4 md:gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x">
                        {customCollection.items.map((playlist: any) => (
                          <div key={playlist.id} className="w-48 md:w-64 shrink-0 snap-start">
                            <PlaylistCard 
                              playlist={playlist} 
                              onClick={() => onSelectGroup(playlist.id)} 
                            />
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    section.layoutStyle === "grid" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {customCollection.items.map((song: any, i: number) => (
                          <SongCard 
                            key={song.id || song.youtubeId || i} 
                            song={song} 
                            type="trending" 
                            onClick={playSong} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0">
                        {customCollection.items.map((song: any, i: number) => (
                          <SongCard 
                            key={song.id || song.youtubeId || i} 
                            song={song} 
                            type="trending" 
                            onClick={playSong} 
                          />
                        ))}
                      </div>
                    )
                  )}
                </div>
              ) : null
            );

          case "communityFavorites":
            return (
              trendingCurations.length > 0 && (
                <div key={section.id}>
                  <DiscoveryShelf
                    title={section.title || "Community Favorites"}
                    description="TOP CURATIONS"
                    playlists={trendingCurations}
                    onSelectPlaylist={onSelectGroup}
                    mobileWide={true}
                    layoutStyle={section.layoutStyle}
                  />
                </div>
              )
            );

          case "freshFinds":
            return (
              freshCurations.length > 0 && (
                <div key={section.id}>
                  <DiscoveryShelf
                    title={section.title || "Fresh Finds"}
                    description="NEW ARRIVALS"
                    playlists={freshCurations}
                    onSelectPlaylist={onSelectGroup}
                    layoutStyle={section.layoutStyle}
                  />
                </div>
              )
            );

          case "moodsGenres":
            return (
              globalTags.length > 0 && (
                <div key={section.id} className="mb-8">
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                    {section.title || "Moods & Genres"}
                  </h3>
                  {section.layoutStyle === "carousel" ? (
                    <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
                       {globalTags.map(tag => (
                          <button 
                            key={tag}
                            onClick={() => onSelectGroup('discovery', '#' + tag)}
                            className="px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-gray-800 dark:text-gray-200 font-medium rounded-full transition-all border border-gray-200 dark:border-white/10 shadow-sm shrink-0 cursor-pointer active:scale-95 hover:scale-102"
                          >
                            #{tag}
                          </button>
                       ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                       {globalTags.map(tag => (
                          <button 
                            key={tag}
                            onClick={() => onSelectGroup('discovery', '#' + tag)}
                            className="px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-gray-800 dark:text-gray-200 font-medium rounded-full transition-all border border-gray-200 dark:border-white/10 shadow-sm cursor-pointer active:scale-95 hover:scale-102"
                          >
                            #{tag}
                          </button>
                       ))}
                    </div>
                  )}
                </div>
              )
            );

          default:
            return null;
        }
      })}
    </div>
  );
});
