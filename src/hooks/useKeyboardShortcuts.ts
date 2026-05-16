import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

export function useKeyboardShortcuts() {
  const { togglePlayPause, playNext, playPrevious } = usePlayer();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayPause();
      } else if (event.shiftKey && event.code === 'ArrowRight') {
        event.preventDefault();
        playNext();
      } else if (event.shiftKey && event.code === 'ArrowLeft') {
        event.preventDefault();
        playPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayPause, playNext, playPrevious]);
}
