import React from 'react';
import { PlaylistGroup } from '../types';
import { PlaylistCard } from './PlaylistCard';
import { Plus, Disc3 } from 'lucide-react';

interface HomeDashboardProps {
  groups: PlaylistGroup[];
  onSelectGroup: (id: string | null) => void;
  onCreatePlaylist: () => void;
}

export function HomeDashboard({ groups, onSelectGroup, onCreatePlaylist }: HomeDashboardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] text-center px-4">
        <Disc3 className="w-32 h-32 text-gray-200 dark:text-gray-800 mb-6" strokeWidth={1} />
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white mb-3 tracking-tight">
          Your music universe is empty.
        </h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 font-medium">
          Create your first playlist to start building your personalized library.
        </p>
        <button
          onClick={onCreatePlaylist}
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-300 text-lg"
        >
          <Plus className="w-6 h-6" />
          Create First Playlist
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto pb-32">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        {getGreeting()}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {groups.map(group => (
          <PlaylistCard 
            key={group.id} 
            playlist={group} 
            onClick={() => onSelectGroup(group.id)} 
          />
        ))}
      </div>
    </div>
  );
}
