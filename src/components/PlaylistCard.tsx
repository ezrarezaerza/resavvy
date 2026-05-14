import React, { useMemo } from 'react';
import { PlaylistGroup } from '../types';

interface PlaylistCardProps {
  playlist: PlaylistGroup;
  onClick: () => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onClick }) => {
  const displayImage = useMemo(() => {
    if (playlist.coverType === 'custom' && playlist.customCoverUrl) {
      return playlist.customCoverUrl;
    } else if (playlist.songs.length > 0) {
      let url = playlist.songs[0].thumbnailUrl;
      return url.replace('mqdefault.jpg', 'maxresdefault.jpg').replace('hqdefault.jpg', 'maxresdefault.jpg');
    }
    return null;
  }, [playlist.coverType, playlist.customCoverUrl, playlist.songs]);

  return (
    <div 
      className="relative w-full aspect-square rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-2xl transition-all duration-300"
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
        <p className="text-gray-300 text-sm drop-shadow-md">
          {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
        </p>
      </div>
    </div>
  );
}
