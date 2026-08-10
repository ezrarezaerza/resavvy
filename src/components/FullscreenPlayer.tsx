import React, { useRef, useState } from "react";
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
  ListMusic,
  PanelRightClose,
  PanelRight
} from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { PlaybackProgressBar } from "./PlaybackProgressBar";
import { OptimizedImage } from "./OptimizedImage";
import { getThumbnailUrl } from "../utils/youtube";
import { AudioEqualizerSuite } from "./AudioEqualizerSuite";

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
  
  // Custom interactive sub-states
  const [activeTab, setActiveTab] = useState<"queue" | "equalizer">("queue");
  const [currentPreset, setCurrentPreset] = useState<PresetKey>("normal");
  const [eqLevels, setEqLevels] = useState<number[]>([...PRESETS.normal.levels]);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);

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
    
    let matchedPreset: PresetKey | null = null;
    (Object.keys(PRESETS) as PresetKey[]).forEach((key) => {
      const presetLevels = PRESETS[key].levels;
      if (presetLevels.every((l, idx) => l === updated[idx])) {
        matchedPreset = key;
      }
    });
    if (!matchedPreset) {
      setCurrentPreset("normal");
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
      className="fixed inset-0 z-[100] bg-transparent flex flex-col justify-between p-4 md:p-6 h-[100dvh] overflow-hidden transform translate-y-full will-change-transform"
    >
      {/* Dynamic Immersive Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-[-2]">
         <OptimizedImage 
           src={thumbnailSrc} 
           alt="" 
           className="w-full h-full object-cover scale-150 blur-3xl opacity-80 dark:opacity-60 saturate-200 transition-all duration-1000" 
         />
      </div>
      <div className="absolute inset-0 w-full h-full pointer-events-none z-[-1] bg-white/50 dark:bg-gray-950/60 backdrop-blur-3xl" />

      {/* Top Header */}
      <div className="relative z-10 flex-none flex items-center justify-between w-full max-w-4xl lg:max-w-6xl mx-auto pt-2">
        <button 
          id="close-fullscreen-player-btn"
          onClick={() => setIsExpanded(false)}
          className="p-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none"
          title="Minimize Player"
        >
          <ChevronDown className="w-7 h-7" />
        </button>
        
        <span className="text-xs font-bold tracking-widest text-gray-600 dark:text-gray-300 uppercase">Now Playing</span>
        
        {/* Desktop Side Panel Toggle Button */}
        <div className="flex items-center">
          <button
            id="toggle-desktop-panel-btn"
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-2 text-gray-700 dark:text-gray-200 opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
            title={isSidePanelOpen ? "Hide Panel" : "Show Panel"}
          >
            {isSidePanelOpen ? (
              <PanelRightClose className="w-6 h-6" />
            ) : (
              <PanelRight className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Main Area (Glassmorphism Stage + Expandable Side Panel) */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden no-scrollbar py-4 w-full max-w-md lg:max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-start lg:justify-center gap-8 lg:gap-12 xl:gap-16 min-h-0 transition-all duration-500">
        
        {/* Main Stage: Cover Art, Metadata, Progress Bar, Audio Controls */}
        <div className={`flex flex-col items-center justify-center w-full shrink-0 my-auto transition-all duration-500 ${
          isSidePanelOpen 
            ? "lg:max-w-md xl:max-w-lg" 
            : "lg:max-w-xl mx-auto"
        }`}>
          {/* Cover Art */}
          <div className={`relative aspect-square shrink-0 rounded-2xl overflow-hidden shadow-2xl bg-gray-200 dark:bg-gray-800 border border-white/20 dark:border-white/10 transition-all duration-500 ${
            isSidePanelOpen 
              ? "w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 xl:w-88 xl:h-88" 
              : "w-64 h-64 sm:w-72 sm:h-72 lg:w-96 lg:h-96 xl:w-[420px] xl:h-[420px]"
          }`}>
            <OptimizedImage 
              src={thumbnailSrc} 
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="w-full text-center mt-5">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight line-clamp-1 px-2">
              {currentSong.title}
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400 font-medium truncate mt-1">
              {currentSong.artist || "Unknown Artist"}
            </p>
          </div>

          {/* Timeline Progress Bar & Time */}
          <div className="w-full mt-5 px-1">
            <PlaybackProgressBar />
          </div>

          {/* Audio Controls */}
          <div className="flex items-center justify-between w-full mt-4 lg:mt-6 px-2">
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
              <Shuffle className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
            
            <button 
              id="prev-btn-fullscreen"
              onClick={playPrevious}
              className="text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 active:scale-90 p-2 focus:outline-none"
              title="Previous"
            >
              <SkipBack className="w-7 h-7 lg:w-8 lg:h-8 fill-current" />
            </button>
            
            <button 
              id="play-pause-btn-fullscreen"
              onClick={togglePlayPause}
              className="w-16 h-16 lg:w-18 lg:h-18 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl transition-all duration-200 active:scale-95 hover:scale-105 focus:outline-none shrink-0"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 lg:w-7 lg:h-7 fill-current" />
              ) : (
                <Play className="w-6 h-6 lg:w-7 lg:h-7 fill-current ml-1" />
              )}
            </button>
            
            <button 
              id="next-btn-fullscreen"
              onClick={playNext}
              className="text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 active:scale-90 p-2 focus:outline-none"
              title="Next"
            >
              <SkipForward className="w-7 h-7 lg:w-8 lg:h-8 fill-current" />
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
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5 lg:w-6 lg:h-6" /> : <Repeat className="w-5 h-5 lg:w-6 lg:h-6" />}
            </button>
          </div>
        </div>

        {/* Expandable Glassmorphism Side Panel (Right Column on Desktop, Scrollable below on Mobile) */}
        <div className={`w-full max-w-md ${
          activeTab === "equalizer" ? "lg:max-w-xl xl:max-w-2xl" : "lg:max-w-lg"
        } flex flex-col gap-4 bg-white/60 dark:bg-black/30 border border-white/30 dark:border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl shadow-2xl h-fit lg:max-h-[82vh] lg:overflow-y-auto no-scrollbar my-auto transition-all duration-500 ${
          isSidePanelOpen
            ? "flex lg:flex opacity-100 scale-100 pointer-events-auto"
            : "flex lg:hidden opacity-100 lg:opacity-0 scale-100 lg:scale-95 pointer-events-auto lg:pointer-events-none"
        }`}>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-white/10 pb-2.5 justify-around gap-2 text-xs lg:text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <button
              id="tab-btn-queue"
              onClick={() => setActiveTab("queue")}
              className={`flex items-center gap-2 pb-2.5 border-b-2 px-4 transition-colors ${
                activeTab === "queue"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-extrabold"
                  : "border-transparent hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <ListMusic className="w-4 h-4" />
              Up Next
            </button>

            <button
              id="tab-btn-equalizer"
              onClick={() => setActiveTab("equalizer")}
              className={`flex items-center gap-2 pb-2.5 border-b-2 px-4 transition-colors ${
                activeTab === "equalizer"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-extrabold"
                  : "border-transparent hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4" />
              Equalizer
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col justify-start overflow-hidden pt-1">
            
            {/* 1. Queue / Up Next */}
            {activeTab === "queue" && (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-xs lg:text-sm font-semibold text-gray-500 dark:text-gray-400">
                    Queue ({queue.length} tracks)
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 max-h-[220px] lg:max-h-[420px] pr-1">
                  {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-28 lg:h-64 text-center">
                      <p className="text-xs lg:text-sm text-gray-400">Queue is empty</p>
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
                          className={`flex items-center gap-3 p-2.5 lg:p-3 rounded-xl transition-all border text-left cursor-pointer ${
                            isCurrent
                              ? "bg-indigo-600/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-xs"
                              : "bg-gray-100/50 dark:bg-white/5 border-transparent hover:border-gray-200 dark:hover:border-white/10 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          <OptimizedImage
                            src={getThumbnailUrl(song.thumbnailUrl, 'mqdefault')}
                            alt=""
                            className="w-10 h-10 lg:w-11 lg:h-11 object-cover rounded-lg shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs lg:text-sm font-bold truncate">{song.title}</p>
                            <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{song.artist}</p>
                          </div>
                          {isCurrent && (
                            <div className="flex items-center gap-1 shrink-0 px-1">
                              <span className="w-1 h-3.5 bg-indigo-500 animate-pulse rounded-full" />
                              <span className="w-1 h-5 bg-indigo-500 animate-pulse rounded-full" style={{ animationDelay: "0.2s" }} />
                              <span className="w-1 h-2.5 bg-indigo-500 animate-pulse rounded-full" style={{ animationDelay: "0.4s" }} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 2. Equalizer Suite */}
            {activeTab === "equalizer" && (
              <AudioEqualizerSuite isPlaying={isPlaying} />
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

