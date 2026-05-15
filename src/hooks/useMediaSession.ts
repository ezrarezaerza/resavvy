import { useEffect } from 'react';
import { Song } from '../types';
import { usePlayer } from '../context/PlayerContext';

export function useMediaSession(currentSong: Song | null) {
  const { togglePlayPause, playNext, playPrevious } = usePlayer();

  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist || 'Unknown Artist',
        artwork: currentSong.thumbnailUrl
          ? [{ src: currentSong.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' }]
          : []
      });

      navigator.mediaSession.setActionHandler('play', togglePlayPause);
      navigator.mediaSession.setActionHandler('pause', togglePlayPause);
      navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);

      return () => {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      };
    }
  }, [currentSong, togglePlayPause, playNext, playPrevious]);
}
