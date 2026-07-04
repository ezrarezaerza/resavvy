import React, { useMemo } from 'react';
import { PlaylistGroup } from '../types';
import { Heart, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { OptimizedImage } from "./OptimizedImage";

interface PlaylistCardProps {
  playlist: PlaylistGroup;
  onClick: () => void;
  className?: string;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = React.memo(({ playlist, onClick, className = 'aspect-square' }) => {
  const { token, user } = useAuth();
  const isOwner = user && playlist.user?.username === user.username;
  const { playSong } = usePlayer();
  const isSaved = playlist.isSaved || false;
  const likesCount = playlist.likesCount || 0;

  const displayImage = useMemo(() => {
    if (playlist.coverType === 'custom' && playlist.customCoverUrl) {
      return playlist.customCoverUrl;
    } else if (playlist.songs.length > 0) {
      let url = playlist.songs[0].thumbnailUrl;
      if (url) {
        return url.replace('mqdefault.jpg', 'maxresdefault.jpg').replace('hqdefault.jpg', 'maxresdefault.jpg');
      }
    }
    return null;
  }, [playlist.coverType, playlist.customCoverUrl, playlist.songs]);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.user?.username) {
      window.location.href = `/u/${playlist.user.username}`;
    }
  };

  
  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.songs && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs, playlist.id);
    }
  };

  const dynamicGradient = useMemo(() => {
    const gradients = [
      'from-purple-600 to-blue-600',
      'from-pink-500 to-orange-400',
      'from-green-400 to-cyan-500',
      'from-indigo-500 to-purple-500',
      'from-red-500 to-pink-500',
      'from-yellow-400 to-orange-500',
      'from-teal-400 to-emerald-500',
    ];
    let hash = 0;
    for (let i = 0; i < playlist.id.length; i++) {
      hash = playlist.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }, [playlist.id]);

  return (
    <div 
      className={`relative w-full rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-2xl transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      {displayImage ? (
        <OptimizedImage 
          src={displayImage} 
          alt={playlist.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${dynamicGradient} group-hover:scale-110 transition-transform duration-500`} />
      )}
      
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none pb-8">
        <button 
          onClick={handlePlayClick}
          className="pointer-events-auto w-14 h-14 bg-indigo-600/90 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
        >
          <Play className="w-7 h-7 text-white ml-1 fill-white" />
        </button>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/60 to-transparent pointer-events-none z-0" />
      
      <div className="absolute bottom-0 left-0 p-4 w-full z-20">
        <h3 className="text-white font-bold text-lg truncate drop-shadow-md">
          {playlist.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-gray-300 text-sm drop-shadow-md truncate pr-2 pointer-events-auto">
            {playlist.user?.name ? (
              <span 
                onClick={handleUserClick}
                className="hover:underline hover:text-indigo-400 cursor-pointer z-10 relative"
              >
                by {playlist.user.name} &bull; {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
              </span>
            ) : (
              `${playlist.songs.length} ${playlist.songs.length === 1 ? 'song' : 'songs'}`
            )}
          </p>
          <div 
            className={`flex items-center gap-1 text-xs shrink-0 px-2 py-1 rounded-full backdrop-blur-sm transition-colors ${
              (isSaved || isOwner) ? 'bg-indigo-600/80 text-white' : 'bg-black/40 text-gray-300'
            }`}
          >
            <Heart className={`w-3 h-3 ${(isSaved || isOwner) ? 'fill-white' : ''}`} />
            <span>{likesCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
