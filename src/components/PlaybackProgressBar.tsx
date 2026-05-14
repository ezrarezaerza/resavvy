import React, { useState, useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

export function PlaybackProgressBar() {
  const { playerRef, isPlaying, currentSong } = usePlayer();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  const [durationStr, setDurationStr] = useState("--:--");

  useEffect(() => {
    let interval: number;

    const updateProgress = () => {
      if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
        const ct = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || 0;
        
        if (dur > 0) {
          setProgress((ct / dur) * 100);
          setDuration(dur);
          
          const formatTime = (secs: number) => {
            if (!secs || isNaN(secs)) return "0:00";
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
          };
          setCurrentTimeStr(formatTime(ct));
          setDurationStr(formatTime(dur));
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
    if (!playerRef.current || typeof duration !== 'number') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    playerRef.current.seekTo(newTime, true);
    setProgress(percent * 100);
  };

  return (
    <div className="w-full flex items-center gap-3 text-xs font-medium text-gray-400 dark:text-gray-500">
      <span className="w-10 text-right font-mono tracking-tighter">{currentTimeStr}</span>
      <div 
        className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden cursor-pointer relative group"
        onClick={handleSeek}
      >
        <div 
          className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300 ease-linear absolute left-0 top-0 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="w-10 font-mono tracking-tighter">{durationStr}</span>
    </div>
  );
}
