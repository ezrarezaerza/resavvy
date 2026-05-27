import { Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1, Volume2 } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { useSettings } from "../hooks/useSettings";
import { PlaybackProgressBar } from "./PlaybackProgressBar";

export function PlayerBar() {
  const { 
    currentSong, 
    isPlaying, 
    isShuffle, 
    repeatMode,
    volume,
    setVolume,
    setIsExpanded,
    togglePlayPause, 
    playNext, 
    playPrevious, 
    toggleShuffle, 
    toggleRepeat 
  } = usePlayer();
  const { lowDataMode } = useSettings();

  const getThumbnailSrc = (url: string) => {
    if (!url) return '';
    if (!lowDataMode && url.includes('mqdefault.jpg')) {
      return url.replace('mqdefault.jpg', 'hqdefault.jpg');
    }
    return url;
  };

  return (
    <footer 
      onClick={() => setIsExpanded(true)}
      className="fixed bottom-16 pb-[env(safe-area-inset-bottom)] md:bottom-0 md:pb-0 w-full z-40 h-20 md:h-24 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border-t border-white/20 dark:border-gray-700/30 flex items-center justify-between px-4 md:px-6 transition-colors cursor-pointer group"
    >
      {/* Now Playing - Mobile & Desktop */}
      <div className="flex flex-1 md:flex-none items-center gap-4 md:w-1/4 md:min-w-[180px]">
        {currentSong ? (
          <>
            <img 
              src={getThumbnailSrc(currentSong.thumbnailUrl)} 
              alt="Now Playing" 
              className="w-14 h-14 flex-shrink-0 aspect-square object-cover object-center rounded-md shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-200 dark:bg-gray-800" 
            />
            <div className="flex flex-col truncate w-full min-w-0 pr-2 md:pr-0">
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{currentSong.title}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{currentSong.artist || "Unknown Artist"}</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-md shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
            <div className="flex flex-col gap-2">
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              <div className="w-16 h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Play/Pause (Only visible on mobile) */}
      <div className="flex md:hidden items-center justify-end">
        <button 
          onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 active:scale-90 hover:scale-105"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
             <Pause className="w-4 h-4 fill-current" />
          ) : (
             <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
      </div>

      {/* Controls - Desktop Only */}
      <div className="hidden md:flex flex-col items-center justify-center w-2/4 max-w-2xl px-4">
        <div className="flex items-center gap-6 mb-2">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleShuffle(); }}
            className={`transition-colors ${isShuffle ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); playPrevious(); }}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-sm hover:scale-105 transition-transform"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
               <Pause className="w-4 h-4 fill-current" />
            ) : (
               <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); playNext(); }}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleRepeat(); }}
            className={`transition-colors ${repeatMode !== 'off' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>
        <div className="w-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
          <PlaybackProgressBar />
        </div>
      </div>

      {/* Volume - Desktop Only */}
      <div className="hidden md:flex items-center justify-end gap-3 w-1/4 min-w-[120px] text-gray-500 dark:text-gray-400">
        <Volume2 className="w-4 h-4 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300" onClick={(e) => { e.stopPropagation(); setVolume(volume === 0 ? 100 : 0); }} />
        <div 
          className="w-24 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full cursor-pointer overflow-hidden relative group/volume"
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setVolume(Math.round(percent * 100));
          }}
        >
          <div 
            className="h-full bg-gray-400 dark:bg-gray-500 rounded-full transition-all duration-150 absolute left-0 top-0 group-hover/volume:bg-indigo-500 dark:group-hover/volume:bg-indigo-400" 
            style={{ width: `${volume}%` }}
          ></div>
        </div>
      </div>
    </footer>
  );
}
