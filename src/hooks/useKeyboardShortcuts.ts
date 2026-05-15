import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';

export function useKeyboardShortcuts() {
  const { togglePlayPause, playNext, playPrevious } = usePlayer();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayPause();
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        playNext();
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        playPrevious();
      } else if (event.code === 'Escape' || event.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('close-modals'));
      } else if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('open-command-palette'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlayPause, playNext, playPrevious]);
}
