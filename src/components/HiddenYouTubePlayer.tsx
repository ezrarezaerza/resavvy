import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { usePlaylist } from '../context/PlaylistContext';
import { useSettings } from '../hooks/useSettings';

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
      
      console.log('[Player Engine] Initializing YouTube Player for container...');

      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '200',
        width: '200',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          vq: dataSaver ? 'tiny' : 'auto'
        },
        events: {
          onReady: () => {
            console.log('[Player Engine] Player Ready.');
            isReadyRef.current = true;
            if (playerRef.current && playerRef.current.setVolume) {
              playerRef.current.setVolume(volume);
            }
            if (currentSongRef.current) {
              const videoId = currentSongRef.current.youtubeId || currentSongRef.current.id;
              console.log('[Player Engine] Loading video on ready:', videoId);
              playerRef.current.loadVideoById(videoId);
              if (isPlaying) {
                console.log('[Player Engine] Playing video (was marked as playing).');
                playerRef.current.playVideo();
              }
            }
          },
          onStateChange: (event: any) => {
            console.log('[Player Engine] State changed to:', event.data);
            if (event.data === window.YT.PlayerState.ENDED) {
              console.log('[Player Engine] Status: ENDED. Playing next...');
              playNextRef.current();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              console.log('[Player Engine] Status: PLAYING.');
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
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              console.log('[Player Engine] Status: PAUSED.');
            } else if (event.data === window.YT.PlayerState.BUFFERING) {
              console.log('[Player Engine] Status: BUFFERING.');
            } else if (event.data === window.YT.PlayerState.UNSTARTED) {
              console.log('[Player Engine] Status: UNSTARTED.');
            }
          },
          onError: (event: any) => {
            console.error('[Player Engine] Player ERROR:', event.data);
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
      const videoId = currentSong.youtubeId || currentSong.id;
      
      // Check if this video is already loaded
      const currentLoadedUrl = playerRef.current.getVideoUrl ? playerRef.current.getVideoUrl() : '';
      if (currentLoadedUrl && currentLoadedUrl.includes(videoId)) {
         console.log('[Player Engine] Video already loaded, skipping loadVideoById');
         if (isPlaying) playerRef.current.playVideo();
         return;
      }
      
      console.log('[Player Engine] currentSong changed, loading video by id:', videoId, currentSong.title);
      playerRef.current.loadVideoById(videoId);
      // Note: loadVideoById will typically autoplay.
      // We don't call playVideo immediately to avoid interrupting the load cycle.
    }
  }, [currentSong]); // Depends on currentSong reference

  // Handle play/pause state independently
  useEffect(() => {
    if (isReadyRef.current && playerRef.current && currentSong) {
      if (isPlaying) {
        console.log('[Player Engine] isPlaying changed to TRUE, calling playVideo');
        playerRef.current.playVideo();
      } else {
        console.log('[Player Engine] isPlaying changed to FALSE, calling pauseVideo');
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
