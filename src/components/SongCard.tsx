import React from 'react';
import { Play } from 'lucide-react';
import { Song } from '../types';
import { OptimizedImage } from "./OptimizedImage";

interface SongCardProps {
  song: Song;
  type: 'heavy' | 'trending';
  onClick: (song: Song) => void;
}

export const SongCard = React.memo(function SongCard({ song, type, onClick }: SongCardProps) {
  const getHighResThumbnail = (url: string) => {
    if (!url) return '';
    if (url.includes('mqdefault.jpg')) {
      return url.replace('mqdefault.jpg', 'hqdefault.jpg');
    }
    return url;
  };

  return (
    <div 
      className="group relative flex-shrink-0 w-36 md:w-48 flex flex-col gap-3 cursor-pointer"
      onClick={() => onClick(song)}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden shadow-md shadow-gray-200 dark:shadow-black/50">
        <OptimizedImage 
          src={getHighResThumbnail(song.thumbnailUrl)} 
          alt={song.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <Play className="w-6 h-6 text-white ml-1 fill-white" />
          </div>
        </div>
        {type === 'trending' && song.globalRank && (
          <div className={`absolute top-0 left-0 w-10 h-10 flex items-center justify-center text-white font-bold rounded-br-xl rounded-tl-xl shadow-lg z-10 ${
            song.globalRank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
            song.globalRank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
            song.globalRank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
            'bg-black/70 backdrop-blur-md text-sm'
          }`}>
            #{song.globalRank}
          </div>
        )}
      </div>
      <div>
        <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm md:text-base">
          {song.title}
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 flex items-center justify-between">
          <span className="truncate pr-2">{song.artist || 'Unknown'}</span>
          {type === 'trending' && (
            <span className="shrink-0 flex items-center gap-1 font-mono font-medium text-indigo-600 dark:text-indigo-400">
              <Play className="w-3 h-3 inline" /> {song.playCount || 0}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
