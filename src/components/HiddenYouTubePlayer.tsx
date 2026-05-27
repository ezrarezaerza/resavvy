import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../context/ToastContext';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export function HiddenYouTubePlayer() {
  const { currentSong, isPlaying, playNext, playerRef, volume } = usePlayer();
  const { updateSongDuration } = usePlaylist();
  const { dataSaver, autoplay } = useSettings();
  const { addToast } = useToast();
  const isReadyRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const playNextRef = useRef(playNext);
  const currentSongRef = useRef(currentSong);
  const updateSongDurationRef = useRef(updateSongDuration);
  const addToastRef = useRef(addToast);
  const lastErrorTimeRef = useRef<number>(0);

  useEffect(() => {
    playNextRef.current = playNext;
    currentSongRef.current = currentSong;
    updateSongDurationRef.current = updateSongDuration;
    addToastRef.current = addToast;
  }, [playNext, currentSong, updateSongDuration, addToast]);

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
          playsinline: 1,
          vq: dataSaver ? 'tiny' : 'auto'
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
          },
          onError: (event: any) => {
            console.error("YouTube Player Error:", event.data);
            // 2: invalid parameter, 5: HTML5 error, 100: not found/private, 101/150: embedded playback disabled
            // Skip to the next track if there's a playback error mapping to the current video
            const now = Date.now();
            if (now - lastErrorTimeRef.current > 3000) {
              let errorMessage = "Unable to play this track (Video unavailable or blocked).";
              if (event.data === 101 || event.data === 150) {
                 errorMessage = "The owner of this video restricted playback on external sites.";
              } else if (event.data === 100) {
                 errorMessage = "This video was deleted or made private.";
              }
              
              addToastRef.current(errorMessage, 'error');
            }
            lastErrorTimeRef.current = now;
            playNextRef.current();
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

  // Update playback quality dynamically when dataSaver changes
  useEffect(() => {
    if (isReadyRef.current && playerRef.current && playerRef.current.setPlaybackQuality) {
      if (dataSaver) {
        playerRef.current.setPlaybackQuality('small'); // 'tiny' or 'small' for 144p/240p
      } else {
        playerRef.current.setPlaybackQuality('auto'); // or 'hd720'
      }
    }
  }, [dataSaver]);

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
