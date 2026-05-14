import React from 'react';
import { PlaylistGroup } from '../types';
import { PlaylistCard } from './PlaylistCard';
import { Plus, Disc3, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HomeDashboardProps {
  groups: PlaylistGroup[];
  onSelectGroup: (id: string | null) => void;
  onCreatePlaylist: () => void;
}

export function HomeDashboard({ groups, onSelectGroup, onCreatePlaylist }: HomeDashboardProps) {
  const { user, signInWithGoogle, isLoading } = useAuth();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] text-center px-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-400 font-medium">Verifying session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 mb-8 backdrop-blur-sm">
          <AudioLinesIcon />
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
          Your Music Workspace
        </h2>
        <p className="text-lg text-gray-400 max-w-md mx-auto mb-10 font-medium">
          Sign in to create your personalized music universe, save playlists, and discover new tracks.
        </p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-xl shadow-lg hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-300 text-lg"
        >
          <LogIn className="w-6 h-6" />
          Login with Google
        </button>
      </div>
    );
  }

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
          className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-300 text-lg"
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

function AudioLinesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
      <path d="M2 10v3" />
      <path d="M6 6v11" />
      <path d="M10 3v18" />
      <path d="M14 8v7" />
      <path d="M18 5v14" />
      <path d="M22 10v3" />
    </svg>
  );
}
