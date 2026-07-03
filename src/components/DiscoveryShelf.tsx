import React from 'react';
import { PlaylistGroup } from '../types';
import { PlaylistCard } from './PlaylistCard';

interface DiscoveryShelfProps {
  title: string;
  playlists: PlaylistGroup[];
  onSelectPlaylist: (id: string) => void;
}

export function DiscoveryShelf({ title, playlists, onSelectPlaylist }: DiscoveryShelfProps) {
  if (!playlists || playlists.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
        {title}
      </h3>
      <div className="flex overflow-x-auto gap-4 md:gap-6 no-scrollbar pb-4 -mx-6 px-6 md:mx-0 md:px-0 snap-x">
        {playlists.map(playlist => (
          <div key={playlist.id} className="w-48 md:w-64 shrink-0 snap-start">
            <PlaylistCard 
              playlist={playlist} 
              onClick={() => onSelectPlaylist(playlist.id)} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
