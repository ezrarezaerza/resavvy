import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

const formatTime = (secs: number) => {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export function PlaybackProgressBar() {
  const { playerRef, isPlaying, currentSong } = usePlayer();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  const [durationStr, setDurationStr] = useState("--:--");
  
  const [isHovering, setIsHovering] = useState(false);
  const [hoverX, setHoverX] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: number;

    const updateProgress = () => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        const ct = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        
        if (dur > 0) {
          setProgress((ct / dur) * 100);
          setDuration(dur);
          
          setCurrentTimeStr(formatTime(ct));
          setDurationStr(formatTime(dur));

          try {
            if (currentSong) {
              window.localStorage.setItem('resavvy_player_time', JSON.stringify({
                songId: currentSong.id,
                time: ct
              }));
            }
          } catch {}
        }
      }
    };

    if (isPlaying) {
      interval = window.setInterval(updateProgress, 500);
    } else {
      updateProgress();
    }

    return () => clearInterval(interval);
  }, [isPlaying, currentSong, playerRef]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || typeof duration !== 'number' || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    playerRef.current.seekTo(newTime, true);
    setProgress(percent * 100);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0 || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverX(e.clientX - rect.left);
    setHoverTime(percent * duration);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <div className="w-full flex items-center gap-3 text-xs font-medium text-gray-400 dark:text-gray-500 relative">
      <span className="w-10 text-right font-mono tracking-tighter">{currentTimeStr}</span>
      <div 
        ref={progressBarRef}
        className="flex-1 h-3 flex items-center cursor-pointer relative group"
        onClick={handleSeek}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden relative" style={{ transform: 'translateZ(0)' }}>
          <div 
            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-transform duration-300 ease-linear absolute left-0 top-0 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400 w-full will-change-transform" 
            style={{ transform: `scaleX(${progress / 100})`, transformOrigin: 'left' }}
          ></div>
        </div>
        {isHovering && duration > 0 && (
          <div 
            className="absolute -top-7 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-200 text-[10px] py-1 px-2 rounded font-mono shadow-lg pointer-events-none z-50 transition-opacity whitespace-nowrap"
            style={{ left: `${hoverX}px` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}
      </div>
      <span className="w-10 font-mono tracking-tighter">{durationStr}</span>
    </div>
  );
}
