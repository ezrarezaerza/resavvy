import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylist } from '../context/PlaylistContext';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export function HiddenYouTubePlayer() {
  const { currentSong, isPlaying, playNext, playerRef, volume } = usePlayer();
  const { updateSongDuration } = usePlaylist();
  const isReadyRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const playNextRef = useRef(playNext);
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const currentSongRef = useRef(currentSong);
  useEffect(() => {
    currentSongRef.current = currentSong;
  }, [currentSong]);

  const updateSongDurationRef = useRef(updateSongDuration);
  useEffect(() => {
    updateSongDurationRef.current = updateSongDuration;
  }, [updateSongDuration]);

  useEffect(() => {
    // Load YouTube IFrame API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else if (window.YT && window.YT.Player && !playerRef.current) {
      initPlayer();
    }

    function initPlayer() {
      if (!containerRef.current) return;
      
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1
        },
        events: {
          onReady: () => {
            isReadyRef.current = true;
            if (playerRef.current && playerRef.current.setVolume) {
              playerRef.current.setVolume(volume);
            }
            if (currentSongRef.current) {
              playerRef.current.loadVideoById(currentSongRef.current.id);
              if (isPlaying) {
                playerRef.current.playVideo();
              }
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              playNextRef.current();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              const song = currentSongRef.current;
              if (song && (!song.duration || song.duration === '--:--')) {
                const durationSeconds = playerRef.current?.getDuration();
                if (durationSeconds && typeof durationSeconds === 'number') {
                  const m = Math.floor(durationSeconds / 60);
                  const s = Math.floor(durationSeconds % 60);
                  const formattedDuration = `${m}:${s < 10 ? '0' : ''}${s}`;
                  updateSongDurationRef.current(song.id, formattedDuration);
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      isReadyRef.current = false;
    };
  }, []); // Empty dependency array to only initialize once

  // Separate effect to handle playing the current song
  // We specify queue in context, so currentSong changes when we go next/prev
  useEffect(() => {
    if (isReadyRef.current && playerRef.current && currentSong) {
      playerRef.current.loadVideoById(currentSong.id);
      if (isPlaying) {
        playerRef.current.playVideo();
      }
    }
  }, [currentSong]); // Depends on currentSong reference

  // Handle play/pause state independently
  useEffect(() => {
    if (isReadyRef.current && playerRef.current && currentSong) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]); // Depends on isPlaying

  return (
    <div className="absolute -left-[9999px] w-[1px] h-[1px] overflow-hidden opacity-0 pointer-events-none">
      <div ref={containerRef}></div>
    </div>
  );
}
