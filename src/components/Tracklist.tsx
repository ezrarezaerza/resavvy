import React, { useRef, memo, useCallback, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Clock, Play, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { Song, PlaylistGroup } from "../types";
import { useSettings } from "../context/SettingsContext";
import { usePlaylist } from "../context/PlaylistContext";
import { EmptyState } from "./EmptyState";
import { ConfirmModal } from "./ConfirmModal";
import { EditSongModal } from "./EditSongModal";

gsap.registerPlugin(useGSAP);

interface SongRowProps {
  song: Song;
  index: number;
  isCurrentSong: boolean;
  isPlaying: boolean;
  onPlay: (song: Song) => void;
  onRemove: (song: Song) => void;
  onEdit: (song: Song) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  dragOverIndex: number | null;
  draggedIndex: number | null;
}

const SongRow = memo(function SongRow({ 
  song, index, isCurrentSong, isPlaying, onPlay, onRemove, onEdit,
  onDragStart, onDragOver, onDragEnd, onDrop, dragOverIndex, draggedIndex
}: SongRowProps) {
  const { lowDataMode } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const getThumbnailSrc = (url: string) => {
    if (!lowDataMode && url.includes('mqdefault.jpg')) {
      return url.replace('mqdefault.jpg', 'hqdefault.jpg');
    }
    return url;
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.song-menu-button') || (e.target as HTMLElement).closest('.song-menu-dropdown')) {
      return;
    }
    onPlay(song);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onRemove(song);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onEdit(song);
  };

  const formatDateString = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isDragOverTop = dragOverIndex === index && draggedIndex !== null && draggedIndex > index;
  const isDragOverBottom = dragOverIndex === index && draggedIndex !== null && draggedIndex < index;

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      onClick={handlePlayClick}
      className={`song-row grid grid-cols-[40px_minmax(0,1fr)_32px] sm:grid-cols-[40px_minmax(0,1fr)_48px_32px] md:grid-cols-[40px_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_64px_32px] gap-4 px-4 py-2.5 items-center rounded-lg group transition-colors cursor-pointer relative ${isMenuOpen ? 'z-50' : 'z-0'} ${
        isCurrentSong 
          ? 'bg-white/40 dark:bg-white/10 shadow-sm backdrop-blur-sm' 
          : 'hover:bg-white/30 dark:hover:bg-white/5'
      } ${draggedIndex === index ? 'opacity-50' : ''}`}
      style={{
        borderTop: isDragOverTop ? '2px solid #818cf8' : '2px solid transparent',
        borderBottom: isDragOverBottom ? '2px solid #818cf8' : '2px solid transparent',
      }}
    >
      <div className={`w-10 text-center font-medium flex items-center justify-center shrink-0 ${isCurrentSong ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
        {isCurrentSong && isPlaying ? (
          <div className="flex justify-center items-end gap-[3px] h-4 w-4">
            <div className="w-[3px] h-[60%] bg-indigo-600 dark:bg-indigo-400 animate-equalizer rounded-t-sm" style={{ animationDelay: '0ms' }}></div>
            <div className="w-[3px] h-[100%] bg-indigo-600 dark:bg-indigo-400 animate-equalizer rounded-t-sm" style={{ animationDelay: '200ms' }}></div>
            <div className="w-[3px] h-[80%] bg-indigo-600 dark:bg-indigo-400 animate-equalizer rounded-t-sm" style={{ animationDelay: '400ms' }}></div>
          </div>
        ) : (
          <>
            <span className="group-hover:hidden">{index + 1}</span>
            <Play className="w-4 h-4 hidden group-hover:block fill-current" />
          </>
        )}
      </div>
      <div className="flex items-center gap-3 min-w-0 pr-2 pointer-events-none">
        <img src={getThumbnailSrc(song.thumbnailUrl)} alt={song.title} className="w-12 h-12 flex-shrink-0 aspect-square object-cover object-center rounded-md shadow-sm bg-gray-200 dark:bg-gray-800" />
        <div className="min-w-0 flex-1">
          <div className={`truncate font-medium text-sm md:text-base ${isCurrentSong ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {song.title}
          </div>
          <div className="truncate text-xs text-gray-500 md:hidden mt-0.5">
            {song.artist || "Unknown Artist"}
          </div>
        </div>
      </div>
      <div className="hidden md:block truncate text-gray-500 dark:text-gray-400 pointer-events-none">
        {song.artist || "Unknown Artist"}
      </div>
      <div className="hidden md:block truncate text-gray-400 dark:text-gray-500 pointer-events-none text-right pr-4 font-mono text-xs">
        {song.playCount || 0}
      </div>
      <div className="hidden sm:block text-right font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap pointer-events-none">
        {song.duration || '--:--'}
      </div>
      <div className="w-8 flex justify-end shrink-0 relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="song-menu-button opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-gray-900 dark:hover:text-white text-gray-500 transition-all p-1 rounded-md focus:opacity-100"
          title="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        {isMenuOpen && (
          <div className="song-menu-dropdown absolute right-0 top-10 z-50 w-48 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 py-1 flex flex-col">
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left w-full"
            >
              <Edit2 className="w-4 h-4" />
              Edit Song Details
            </button>
            <button
              onClick={handleRemoveClick}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left w-full"
            >
              <Trash2 className="w-4 h-4" />
              Remove from Playlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

interface TracklistProps {
  activeGroup: PlaylistGroup;
  removeSong: (songId: string) => void;
}

export function Tracklist({ activeGroup, removeSong }: TracklistProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSong, currentSong, isPlaying } = usePlayer();
  const { reorderSongs, editSong } = usePlaylist();
  const [songToRemove, setSongToRemove] = useState<Song | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useGSAP(() => {
    if (activeGroup.songs.length > 0) {
      gsap.fromTo(".song-row", 
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, { scope: containerRef, dependencies: [activeGroup.id] });

  const handlePlay = useCallback((song: Song) => {
    playSong(song, activeGroup.songs, activeGroup.id);
  }, [playSong, activeGroup.songs, activeGroup.id]);

  const handleRemoveClick = useCallback((song: Song) => {
    setSongToRemove(song);
  }, []);

  const handleEditClick = useCallback((song: Song) => {
    setEditingSong(song);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Requires a short delay wrapper so the element doesn't disappear from the cursor right away
    setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
      }
    }, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  }, [draggedIndex]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      handleDragEnd();
      return;
    }

    const newSongs = [...activeGroup.songs];
    const draggedSong = newSongs[draggedIndex];
    
    // Remove from old position
    newSongs.splice(draggedIndex, 1);
    // Insert into new position
    newSongs.splice(index, 0, draggedSong);
    
    reorderSongs(activeGroup.id, newSongs);
    handleDragEnd();
  }, [activeGroup.id, activeGroup.songs, draggedIndex, handleDragEnd, reorderSongs]);

  return (
    <div ref={containerRef} className="w-full text-sm relative z-20 -mt-16 pt-12">
      {activeGroup.songs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col relative min-w-0">
          <div className="sticky top-0 z-20 hidden md:grid grid-cols-[40px_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_64px_32px] gap-4 px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl mb-2 shadow-sm dark:shadow-none">
            <div className="text-center font-bold">#</div>
            <div>Title</div>
            <div>Artist</div>
            <div className="text-right pr-4 tracking-wider flex items-center justify-end gap-1"><Play className="w-3 h-3"/> PLAYS</div>
            <div className="text-right flex items-center justify-end"><Clock className="w-4 h-4 inline-block" /></div>
            <div className="w-8"></div>
          </div>

          <div className="flex flex-col gap-1">
            {activeGroup.songs.map((song, index) => (
              <SongRow 
                key={`${song.id}-${song.addedAt}`}
                song={song}
                index={index}
                isCurrentSong={currentSong?.id === song.id}
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onRemove={handleRemoveClick}
                onEdit={handleEditClick}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                dragOverIndex={dragOverIndex}
                draggedIndex={draggedIndex}
              />
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!songToRemove}
        onClose={() => setSongToRemove(null)}
        onConfirm={() => {
          if (songToRemove) {
            removeSong(songToRemove.id);
          }
        }}
        title="Remove Song"
        message={`Are you sure you want to remove "${songToRemove?.title}" from this playlist?`}
        confirmText="Remove"
      />

      {editingSong && (
        <EditSongModal
          song={editingSong}
          onSave={(title, artist) => {
            editSong(activeGroup.id, editingSong.id, { title, artist });
          }}
          onClose={() => setEditingSong(null)}
        />
      )}
    </div>
  );
}
