import React, { useRef, useState, useEffect, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  ChevronDown, 
  Shuffle, 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward, 
  Repeat, 
  Repeat1,
  Sliders,
  Activity,
  ListMusic,
  Check,
  Disc3
} from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { PlaybackProgressBar } from "./PlaybackProgressBar";
import { OptimizedImage } from "./OptimizedImage";
import { getThumbnailUrl } from "../utils/youtube";

// Equalizer Presets definition
const PRESETS = {
  normal: { name: "Flat", levels: [50, 50, 50, 50, 50] },
  bass: { name: "Bass Boost", levels: [85, 75, 55, 45, 40] },
  vocal: { name: "Vocal Boost", levels: [35, 45, 75, 70, 55] },
  electronic: { name: "Electronic", levels: [75, 60, 45, 65, 80] },
  acoustic: { name: "Acoustic", levels: [60, 50, 65, 55, 65] },
  ambient: { name: "Ambient", levels: [55, 65, 50, 40, 30] }
} as const;

type PresetKey = keyof typeof PRESETS;

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
    toggleRepeat,
    queue,
    playSong
  } = usePlayer();

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Custom interactive sub-states for presentation layers
  const [activeTab, setActiveTab] = useState<"visualizer" | "equalizer" | "queue">("visualizer");
  const [currentPreset, setCurrentPreset] = useState<PresetKey>("normal");
  const [eqLevels, setEqLevels] = useState<number[]>([...PRESETS.normal.levels]);

  // Handle preset selection
  const handlePresetSelect = (key: PresetKey) => {
    setCurrentPreset(key);
    setEqLevels([...PRESETS[key].levels]);
  };

  // Adjust custom level
  const handleLevelChange = (index: number, val: number) => {
    const updated = [...eqLevels];
    updated[index] = val;
    setEqLevels(updated);
    
    // Check if customized matches any preset, else flag custom
    let matchedPreset: PresetKey | null = null;
    (Object.keys(PRESETS) as PresetKey[]).forEach((key) => {
      const presetLevels = PRESETS[key].levels;
      if (presetLevels.every((l, idx) => l === updated[idx])) {
        matchedPreset = key;
      }
    });
    if (!matchedPreset) {
      setCurrentPreset("normal"); // fallback or leave as normal
    } else {
      setCurrentPreset(matchedPreset);
    }
  };

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

  const thumbnailSrc = currentSong.thumbnailUrl 
    ? getThumbnailUrl(currentSong.thumbnailUrl, 'mqdefault')
    : '';

  return (
    <div 
      ref={containerRef}
      id="fullscreen-audio-player"
      className="fixed inset-0 z-[100] bg-transparent flex flex-col justify-between p-4 md:p-6 pb-10 h-[100dvh] overflow-hidden transform translate-y-full will-change-transform"
    >
      {/* Dynamic Immersive Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-[-2]">
         <OptimizedImage 
           src={thumbnailSrc} 
           alt="" 
           className="w-full h-full object-cover scale-150 blur-3xl opacity-80 dark:opacity-60 saturate-200 transition-all duration-1000" 
         />
      </div>
      <div className="absolute inset-0 w-full h-full pointer-events-none z-[-1] bg-white/40 dark:bg-gray-950/50 backdrop-blur-3xl" />

      {/* Top Header */}
      <div className="relative z-10 flex-none flex items-center justify-between w-full">
        <button 
          id="close-fullscreen-player-btn"
          onClick={() => setIsExpanded(false)}
          className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none"
        >
          <ChevronDown className="w-8 h-8" />
        </button>
        <span className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-300 uppercase">Now Playing</span>
        <div className="w-12" />
      </div>

      {/* Main Body Grid */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 max-w-5xl w-full mx-auto min-h-0 overflow-y-auto no-scrollbar py-4">
        
        {/* Left Side: Artwork & Metadata */}
        <div className="flex flex-col items-center justify-center w-full max-w-sm flex-none">
          <div className="relative w-64 h-64 md:w-80 md:h-80 aspect-square shrink-0 rounded-2xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-gray-800 border border-white/20 dark:border-white/5">
            <OptimizedImage 
              src={thumbnailSrc} 
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="w-full text-center mt-6">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight line-clamp-1 px-4">
              {currentSong.title}
            </h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium truncate mt-1">
              {currentSong.artist || "Unknown Artist"}
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Performance and Curation Panel */}
        <div className="flex-1 w-full max-w-md flex flex-col gap-4 bg-white/40 dark:bg-black/20 border border-white/20 dark:border-white/5 rounded-3xl p-4 md:p-6 backdrop-blur-md shadow-lg min-h-0">
          
          {/* Sub-Feature Tabs */}
          <div className="flex border-b border-gray-200 dark:border-white/10 pb-2 mb-2 justify-around gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            <button
              id="tab-btn-visualizer"
              onClick={() => setActiveTab("visualizer")}
              className={`flex items-center gap-2 pb-2 border-b-2 px-3 transition-colors ${
                activeTab === "visualizer"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4" />
              Visualizer
            </button>
            <button
              id="tab-btn-equalizer"
              onClick={() => setActiveTab("equalizer")}
              className={`flex items-center gap-2 pb-2 border-b-2 px-3 transition-colors ${
                activeTab === "equalizer"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4" />
              Equalizer
            </button>
            <button
              id="tab-btn-queue"
              onClick={() => setActiveTab("queue")}
              className={`flex items-center gap-2 pb-2 border-b-2 px-3 transition-colors ${
                activeTab === "queue"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <ListMusic className="w-4 h-4" />
              Up Next
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 min-h-[140px] flex flex-col justify-center overflow-hidden">
            
            {/* Visualizer */}
            {activeTab === "visualizer" && (
              <div className="flex flex-col items-center justify-center h-full w-full gap-4 py-2">
                <div className="flex items-end justify-center gap-1.5 h-24 w-full px-4">
                  {[...Array(16)].map((_, i) => {
                    const baseDelay = i * 0.08;
                    const animationStyle = isPlaying
                      ? {
                          animation: `bounceBar 1.2s ease-in-out infinite alternate`,
                          animationDelay: `${baseDelay}s`,
                        }
                      : { height: "8px" };

                    return (
                      <div
                        key={i}
                        className="w-2.5 rounded-full bg-gradient-to-t from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 transition-all duration-300"
                        style={{
                          height: isPlaying ? "auto" : "8px",
                          minHeight: "8px",
                          maxHeight: "88px",
                          ...animationStyle
                        }}
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50/50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                  {isPlaying ? "Reactive Spectrum Active" : "Spectrum Paused"}
                </span>
                
                {/* CSS Keyframes injected inline */}
                <style>{`
                  @keyframes bounceBar {
                    0% { height: 10px; }
                    50% { height: 75px; }
                    100% { height: 25px; }
                  }
                `}</style>
              </div>
            )}

            {/* Equalizer */}
            {activeTab === "equalizer" && (
              <div className="flex flex-col h-full justify-between gap-4 py-1">
                {/* Preset badges */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
                    <button
                      key={key}
                      id={`eq-preset-btn-${key}`}
                      onClick={() => handlePresetSelect(key)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                        currentPreset === key
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/5 hover:bg-gray-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {PRESETS[key].name}
                    </button>
                  ))}
                </div>

                {/* 5-band faders */}
                <div className="flex justify-around items-end h-28 w-full px-2 mt-2">
                  {eqLevels.map((level, idx) => {
                    const frequencyLabels = ["60Hz", "230Hz", "910Hz", "4kHz", "14kHz"];
                    return (
                      <div key={idx} className="flex flex-col items-center h-full gap-2 group">
                        <div className="relative flex-1 flex items-center justify-center w-6">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={level}
                            onChange={(e) => handleLevelChange(idx, parseInt(e.target.value))}
                            className="absolute appearance-none bg-gray-200 dark:bg-white/10 rounded-full h-1.5 w-24 -rotate-90 cursor-ns-resize origin-center outline-none focus:ring-0"
                            style={{
                              WebkitAppearance: "none",
                            }}
                          />
                          {/* Colored slider fill simulator background (optional styling fallback) */}
                        </div>
                        <span className="text-[9px] font-mono font-bold text-gray-500 dark:text-gray-400">
                          {frequencyLabels[idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Queue / Up Next */}
            {activeTab === "queue" && (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 max-h-[160px] pr-1">
                  {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 text-center">
                      <p className="text-xs text-gray-400">Queue is empty</p>
                    </div>
                  ) : (
                    queue.map((song, i) => {
                      const isCurrent = song.id === currentSong.id;
                      return (
                        <div
                          key={song.id || i}
                          onClick={() => {
                            if (!isCurrent) playSong(song, queue);
                          }}
                          className={`flex items-center gap-3 p-2 rounded-xl transition-all border text-left cursor-pointer ${
                            isCurrent
                              ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                              : "bg-gray-100/30 dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10 text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          <OptimizedImage
                            src={getThumbnailUrl(song.thumbnailUrl, 'mqdefault')}
                            alt=""
                            className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{song.title}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{song.artist}</p>
                          </div>
                          {isCurrent && (
                            <div className="flex items-center gap-1.5 shrink-0 px-2">
                              <span className="w-1 h-3.5 bg-indigo-500 animate-pulse rounded-full" />
                              <span className="w-1 h-5 bg-indigo-500 animate-pulse rounded-full" style={{ animationDelay: "0.2s" }} />
                              <span className="w-1 h-2 bg-indigo-500 animate-pulse rounded-full" style={{ animationDelay: "0.4s" }} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Timeline Progress Bar & Time */}
          <div className="w-full pt-2">
            <PlaybackProgressBar />
          </div>

          {/* Audio Controls */}
          <div className="flex items-center justify-between w-full mt-1.5 px-4">
            <button 
              id="shuffle-btn-fullscreen"
              onClick={toggleShuffle}
              className={`transition-all duration-200 active:scale-90 p-2 rounded-full focus:outline-none ${
                isShuffle 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-5 h-5" />
            </button>
            
            <button 
              id="prev-btn-fullscreen"
              onClick={playPrevious}
              className="text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 active:scale-90 p-2 focus:outline-none"
              title="Previous"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>
            
            <button 
              id="play-pause-btn-fullscreen"
              onClick={togglePlayPause}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl transition-all duration-200 active:scale-95 hover:scale-105 focus:outline-none shrink-0"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>
            
            <button 
              id="next-btn-fullscreen"
              onClick={playNext}
              className="text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 active:scale-90 p-2 focus:outline-none"
              title="Next"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>
            
            <button 
              id="repeat-btn-fullscreen"
              onClick={toggleRepeat}
              className={`transition-all duration-200 active:scale-90 p-2 rounded-full focus:outline-none ${
                repeatMode !== 'off' 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
