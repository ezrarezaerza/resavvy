import React from 'react';
import { PlaylistGroup } from '../types';
import { PlaylistCard } from './PlaylistCard';

interface DiscoveryShelfProps {
  title: string;
  description?: string;
  playlists: PlaylistGroup[];
  onSelectPlaylist: (id: string) => void;
  mobileWide?: boolean;
  layoutStyle?: string;
}

export const DiscoveryShelf = React.memo(function DiscoveryShelf({ title, description, playlists, onSelectPlaylist, mobileWide = false, layoutStyle = "carousel" }: DiscoveryShelfProps) {
  if (!playlists || playlists.length === 0) return null;

  const isGrid = layoutStyle === "grid";

  return (
    <div className="mb-6">
      {description && (
        <p className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 mb-1">
          {description}
        </p>
      )}
      <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      {isGrid ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {playlists.map(playlist => (
            <div key={playlist.id} className="w-full">
              <PlaylistCard 
                playlist={playlist} 
                onClick={() => onSelectPlaylist(playlist.id)} 
                className={mobileWide ? "aspect-[16/9] md:aspect-square" : undefined}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={mobileWide 
          ? "flex overflow-x-auto gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x snap-mandatory"
          : "flex overflow-x-auto gap-4 md:gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x"
        }>
          {playlists.map(playlist => (
            <div key={playlist.id} className={mobileWide 
              ? "w-[85vw] md:w-56 shrink-0 snap-center md:snap-align-none"
              : "w-48 md:w-64 shrink-0 snap-start"
            }>
              <PlaylistCard 
                playlist={playlist} 
                onClick={() => onSelectPlaylist(playlist.id)} 
                className={mobileWide ? "aspect-[16/9] md:aspect-square" : undefined}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
