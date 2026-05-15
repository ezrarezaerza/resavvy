import React, { useState, useEffect } from 'react';
import { PlaylistGroup } from '../types';
import { PlaylistCard } from './PlaylistCard';
import { Heart, Compass, ArrowLeft } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface PublicProfilePageProps {
  username: string;
}

export function PublicProfilePage({ username }: PublicProfilePageProps) {
  const [profile, setProfile] = useState<any>(null);
  const [playlists, setPlaylists] = useState<PlaylistGroup[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/social?type=profile&username=${username}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'User not found' : 'Failed to fetch profile');
      }
      const data = await res.json();
      setProfile(data.profile);
      setPlaylists(data.playlists);
      setTotalLikes(data.totalLikes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    window.location.href = `/p/${playlistId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-xl text-gray-500 font-semibold tracking-tight">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Oops!</div>
        <div className="text-lg text-gray-500 mb-8">{error || 'Something went wrong.'}</div>
        <button 
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition"
        >
          Go Home
        </button>
      </div>
    );
  }

  const avatarUrl = profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-12">
        <button 
          onClick={() => window.location.href = '/'} 
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors mb-12"
        >
          <ArrowLeft className="w-5 h-5" />
          Back Home
        </button>

        <div className="flex flex-col items-center text-center">
          <img 
            src={avatarUrl} 
            alt={profile.name} 
            className="w-32 h-32 rounded-full border-4 border-indigo-500/30 object-cover shadow-xl mb-6"
          />
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {profile.name}
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 mt-2 font-medium">
            @{profile.username}
          </p>

          {profile.bio && (
            <p className="text-gray-700 dark:text-gray-300 text-center max-w-lg mt-6 leading-relaxed">
              {profile.bio}
            </p>
          )}

          <div className="mt-8 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold text-sm shadow-sm hover:scale-105 transition-transform cursor-default">
             <Heart className="w-4 h-4 fill-current" />
             {totalLikes} Curator Score
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto my-16 border-t border-gray-200 dark:border-gray-800"></div>

        <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">
          Public Curations
        </h3>
        
        {playlists.length === 0 ? (
          <div className="text-center py-16 px-4 bg-gray-100 dark:bg-white/5 rounded-3xl border border-gray-200/50 dark:border-white/10">
            <Compass className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">This user hasn't published any playlists yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
             {playlists.map((playlist) => (
                <PlaylistCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  onClick={() => handlePlaylistClick(playlist.id)} 
                />
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
