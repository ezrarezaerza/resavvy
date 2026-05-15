import React, { useMemo } from 'react';
import { PlaylistGroup } from '../types';
import { Heart } from 'lucide-react';

interface PlaylistCardProps {
  playlist: PlaylistGroup;
  onClick: () => void;
  className?: string;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick, className = '' }) => {
  const displayImage = useMemo(() => {
    if (playlist.coverType === 'custom' && playlist.customCoverUrl) {
      return playlist.customCoverUrl;
    } else if (playlist.songs.length > 0) {
      let url = playlist.songs[0].thumbnailUrl;
      return url.replace('mqdefault.jpg', 'maxresdefault.jpg').replace('hqdefault.jpg', 'maxresdefault.jpg');
    }
    return null;
  }, [playlist.coverType, playlist.customCoverUrl, playlist.songs]);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.user?.username) {
      window.location.href = `/u/${playlist.user.username}`;
    }
  };

  return (
    <div 
      className={`relative w-full aspect-square rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-2xl transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      {displayImage ? (
        <img 
          src={displayImage} 
          alt={playlist.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black group-hover:scale-110 transition-transform duration-500" />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/60 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 p-4 w-full">
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
                by {playlist.user.name}
              </span>
            ) : (
              `${playlist.songs.length} ${playlist.songs.length === 1 ? 'song' : 'songs'}`
            )}
          </p>
          {typeof playlist.likesCount === 'number' && (
            <div className="flex items-center gap-1 text-gray-300 text-xs shrink-0 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm pointer-events-auto">
              <Heart className="w-3 h-3" />
              <span>{playlist.likesCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
