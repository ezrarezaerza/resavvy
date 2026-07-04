import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ChevronDown, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1 } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { PlaybackProgressBar } from "./PlaybackProgressBar";
import { OptimizedImage } from "./OptimizedImage";

export function FullscreenPlayer() {
  const { 
    currentSong, 
    isPlaying, 
    isShuffle, 
    repeatMode,
    isExpanded,
    setIsExpanded,
    togglePlayPause, 
    playNext, 
    playPrevious, 
    toggleShuffle, 
    toggleRepeat 
  } = usePlayer();

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isExpanded) {
      gsap.to(containerRef.current, {
        y: "0%",
        duration: 0.5,
        ease: "power3.out",
      });
    } else {
      gsap.to(containerRef.current, {
        y: "100%",
        duration: 0.5,
        ease: "power3.in",
      });
    }
  }, [isExpanded]);

  if (!currentSong) return null;

  const hqThumbnail = currentSong.thumbnailUrl 
    ? currentSong.thumbnailUrl.replace('mqdefault.jpg', 'maxresdefault.jpg')
    : '';

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-transparent flex flex-col justify-between p-6 pb-12 h-[100dvh] overflow-hidden transform translate-y-full will-change-transform"
    >
      {/* Dynamic Immersive Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-[-2]">
         <OptimizedImage 
           src={hqThumbnail} 
           alt="" 
           className="w-full h-full object-cover scale-150 blur-3xl opacity-80 dark:opacity-60 saturate-200 transition-all duration-1000" 
         />
      </div>
      <div className="absolute inset-0 w-full h-full pointer-events-none z-[-1] bg-white/30 dark:bg-gray-950/40 backdrop-blur-3xl" />

      <div className="relative z-10 flex-none flex items-center justify-between w-full">
        <button 
          onClick={() => setIsExpanded(false)}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
        <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Now Playing</span>
        <div className="w-12" /> {/* Placeholder width of chevron */}
      </div>

      <div className="flex-1 flex items-center justify-center min-h-0 w-full my-4">
        <OptimizedImage 
          src={hqThumbnail} 
          alt={currentSong.title}
          className="w-auto h-full max-w-full max-h-[350px] aspect-square object-cover rounded-2xl shadow-2xl bg-gray-200 dark:bg-gray-800 mx-auto"
        />
      </div>

      <div className="flex-none flex flex-col gap-6 w-full max-w-md mx-auto">
        <div className="w-full text-center">
          <h2 className="text-2xl font-extrabold truncate text-center text-gray-900 dark:text-white">{currentSong.title}</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 truncate text-center">{currentSong.artist || "Unknown Artist"}</p>
        </div>

        <div className="w-full">
          <PlaybackProgressBar />
        </div>

        <div className="flex items-center justify-between w-full">
          <button 
            onClick={toggleShuffle}
            className={`transition-colors p-2 rounded-full focus:outline-none ${isShuffle ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            <Shuffle className="w-6 h-6" />
          </button>
          
          <button 
            onClick={playPrevious}
            className="text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 active:scale-90 hover:scale-105 p-2 focus:outline-none"
          >
            <SkipBack className="w-8 h-8 fill-current" />
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="w-20 h-20 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl transition-all duration-200 active:scale-90 hover:scale-105 focus:outline-none"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>
          
          <button 
            onClick={playNext}
            className="text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 active:scale-90 hover:scale-105 p-2 focus:outline-none"
          >
            <SkipForward className="w-8 h-8 fill-current" />
          </button>
          
          <button 
            onClick={toggleRepeat}
            className={`transition-colors p-2 rounded-full focus:outline-none ${repeatMode !== 'off' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}
