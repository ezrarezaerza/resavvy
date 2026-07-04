import React, { useRef, memo, useCallback, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Clock, Play, MoreVertical, Edit2, Trash2, Heart } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import { Song, PlaylistGroup } from "../types";
import { useSettings } from "../hooks/useSettings";
import { usePlaylist } from "../context/PlaylistContext";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "./EmptyState";
import { ConfirmModal } from "./ConfirmModal";
import { EditSongModal } from "./EditSongModal";

gsap.registerPlugin(useGSAP);

import { useVirtualizer } from '@tanstack/react-virtual';
import { QuickAddMenu } from "./QuickAddMenu";

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
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (songId: string) => void;
  onToggleLike?: (songId: string) => void;
  variant?: "default" | "explore";
  isReadOnly?: boolean;
}

const SongRow = memo(function SongRow({
  song,
  index,
  isCurrentSong,
  isPlaying,
  onPlay,
  onRemove,
  onEdit,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  dragOverIndex,
  draggedIndex,
  isSelectable,
  isSelected,
  onToggleSelect,
  onToggleLike,
  variant = "default",
  isReadOnly = false,
}: SongRowProps) {
  const { lowDataMode } = useSettings();
  const { token, setShowLoginModal } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(song.isLiked || false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLiked(song.isLiked || false);
  }, [song.isLiked]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    if (!song.id) return;
    
    // optimism
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    if (onToggleLike) onToggleLike(song.id);

    try {
      const res = await fetch(`/api/songs?action=like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ songId: song.id }),
      });
      if (!res.ok) {
        setIsLiked(!newIsLiked); // revert
        if (onToggleLike) onToggleLike(song.id); // revert context
      }
    } catch (err) {
      setIsLiked(!newIsLiked); // revert
      if (onToggleLike) onToggleLike(song.id); // revert context
    }
  };

  const getThumbnailSrc = (url: string) => {
    if (!url) return "";
    if (!lowDataMode && url.includes("mqdefault.jpg")) {
      return variant === "explore"
        ? url.replace("mqdefault.jpg", "maxresdefault.jpg")
        : url.replace("mqdefault.jpg", "hqdefault.jpg");
    }
    return url;
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest(".song-menu-button") ||
      (e.target as HTMLElement).closest(".song-menu-dropdown")
    ) {
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
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (secondsVal: string | number | undefined) => {
    if (
      secondsVal === undefined ||
      secondsVal === null ||
      secondsVal === "--:--"
    )
      return "--:--";
    if (typeof secondsVal === "string" && secondsVal.includes(":"))
      return secondsVal;

    // Parse to ensure it's a number
    const seconds = Number(secondsVal);
    if (isNaN(seconds)) return "--:--";

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isDragOverTop =
    dragOverIndex === index && draggedIndex !== null && draggedIndex > index;
  const isDragOverBottom =
    dragOverIndex === index && draggedIndex !== null && draggedIndex < index;

  return (
    <div
      draggable={!isSelectable && !isReadOnly}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      onClick={handlePlayClick}
      className={`song-row will-change-transform grid ${isSelectable ? "grid-cols-[40px_40px_minmax(0,1fr)_auto_32px] sm:grid-cols-[40px_40px_minmax(0,1fr)_auto_32px] md:grid-cols-[40px_40px_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_80px_32px] gap-2 px-2" : "grid-cols-[40px_minmax(0,1fr)_auto_32px] sm:grid-cols-[40px_minmax(0,1fr)_auto_32px] md:grid-cols-[40px_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_80px_32px] gap-2 px-2 sm:gap-4 sm:px-4"} py-2.5 items-center rounded-lg group transition-colors cursor-pointer relative hover:z-40 focus-within:z-50 ${isMenuOpen ? "z-50" : "z-10"} ${
        isSelected
          ? "bg-indigo-50 dark:bg-indigo-900/20"
          : isCurrentSong
            ? "bg-white/40 dark:bg-white/10 shadow-sm backdrop-blur-sm"
            : "hover:bg-white/30 dark:hover:bg-white/5"
      } ${draggedIndex === index ? "opacity-50" : ""}`}
      style={{
        borderTop: isDragOverTop
          ? "2px solid #818cf8"
          : "2px solid transparent",
        borderBottom: isDragOverBottom
          ? "2px solid #818cf8"
          : "2px solid transparent",
      }}
    >
      {isSelectable && (
        <div className="flex items-center justify-center shrink-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleSelect) onToggleSelect(song.id);
            }}
            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${isSelected ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500" : "border-gray-400 dark:border-gray-500 hover:border-indigo-500 dark:hover:border-indigo-400"}`}
          >
            {isSelected && (
              <svg
                width="12"
                height="10"
                viewBox="0 0 12 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 5L4.5 8.5L11 1.5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
      )}
      <div
        className={`w-10 text-center font-medium flex items-center justify-center shrink-0 ${isCurrentSong ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"}`}
      >
        {isCurrentSong && isPlaying ? (
          <div className="flex justify-center items-end gap-[3px] h-4 w-4">
            <div
              className="w-[3px] h-[60%] bg-indigo-600 dark:bg-indigo-400 animate-equalizer rounded-t-sm will-change-transform"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-[3px] h-[100%] bg-indigo-600 dark:bg-indigo-400 animate-equalizer rounded-t-sm will-change-transform"
              style={{ animationDelay: "200ms" }}
            ></div>
            <div
              className="w-[3px] h-[80%] bg-indigo-600 dark:bg-indigo-400 animate-equalizer rounded-t-sm will-change-transform"
              style={{ animationDelay: "400ms" }}
            ></div>
          </div>
        ) : (
          <>
            <span className="group-hover:hidden">
              {variant === "explore" ? song.globalRank : index + 1}
            </span>
            <Play className="w-4 h-4 hidden group-hover:block fill-current" />
          </>
        )}
      </div>
      <div className="flex items-center gap-3 min-w-0 pr-2 pointer-events-none">
        <img
          src={getThumbnailSrc(song.thumbnailUrl)}
          alt={song.title}
          className="w-12 h-12 flex-shrink-0 aspect-square object-cover object-center rounded-md shadow-sm bg-gray-200 dark:bg-gray-800"
        />
        <div className="min-w-0 flex-1">
          <div
            className={`truncate font-medium text-sm md:text-base ${isCurrentSong ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-gray-100"}`}
          >
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
      <div className="flex items-center justify-end gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
        <button
          onClick={toggleLike}
          className={`focus:outline-none transition-colors ${isLiked ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-300"}`}
          title={isLiked ? "Unlike" : "Like"}
        >
          <Heart
            className={`w-5 h-5 sm:w-4 sm:h-4 ${isLiked ? "fill-current" : ""}`}
          />
        </button>
        <span className="hidden sm:inline-block pointer-events-none flex-shrink-0 text-right font-medium min-w-[3rem]">
          {variant === "explore"
            ? `In ${song.playlistCount || 1} Playlists`
            : formatTime(song.duration)}
        </span>
      </div>
      <div className="w-8 flex justify-end shrink-0 relative" ref={menuRef}>
        {variant === "explore" || isReadOnly ? (
          <QuickAddMenu song={song} onOpenChange={setIsMenuOpen} />
        ) : (
          !isReadOnly && (
            <>
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
                <div className="song-menu-dropdown absolute right-0 top-10 z-50 w-48 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 py-1 flex flex-col">
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
                    Remove
                  </button>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
});

import { TracklistHeader, SortConfig, SortKey } from "./TracklistHeader";

interface TracklistProps {
  activeGroup: PlaylistGroup;
  removeSong: (songId: string) => void;
  selectionMode?: boolean;
  selectedSongs?: string[];
  onToggleSongSelect?: (songId: string) => void;
  onToggleSelectAll?: () => void;
  sortConfig?: SortConfig;
  onSort?: (key: SortKey) => void;
  variant?: "default" | "explore";
  isReadOnly?: boolean;
}

export const Tracklist = React.memo(function Tracklist({
  activeGroup,
  removeSong,
  selectionMode,
  selectedSongs = [],
  onToggleSongSelect,
  onToggleSelectAll,
  sortConfig,
  onSort,
  variant = "default",
  isReadOnly = false,
}: TracklistProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<Element | null>(null);
  const [scrollElement, setScrollElement] = useState<Element | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      let el: HTMLElement | null = containerRef.current;
      while (el) {
        const style = window.getComputedStyle(el);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          scrollElementRef.current = el;
          setScrollElement(el);
          break;
        }
        el = el.parentElement;
      }
      if (!scrollElementRef.current) {
        scrollElementRef.current = window.document.body;
        setScrollElement(window.document.body);
      }
    }
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: activeGroup.songs.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => 64, // Approximate height of SongRow
    overscan: 10,
  });

  const { playSong, currentSong, isPlaying } = usePlayer();
  const { reorderSongs, editSong, toggleSongLike } = usePlaylist();
  
  const [songToRemove, setSongToRemove] = useState<Song | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useGSAP(
    () => {
      if (activeGroup.songs.length > 0) {
        gsap.fromTo(
          ".song-row",
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.05,
            ease: "power2.out",
            clearProps: "all"
          },
        );
      }
    },
    { scope: containerRef, dependencies: [activeGroup.id] },
  );

  const handlePlay = useCallback(
    (song: Song) => {
      playSong(song, activeGroup.songs, activeGroup.id);
    },
    [playSong, activeGroup.songs, activeGroup.id],
  );

  const handleRemoveClick = useCallback((song: Song) => {
    setSongToRemove(song);
  }, []);

  const handleEditClick = useCallback((song: Song) => {
    setEditingSong(song);
  }, []);

  const handleToggleLike = useCallback((songId: string) => {
    toggleSongLike(activeGroup.id, songId);
  }, [activeGroup.id, toggleSongLike]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Requires a short delay wrapper so the element doesn't disappear from the cursor right away
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 0);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (draggedIndex === null || draggedIndex === index) return;
      setDragOverIndex(index);
    },
    [draggedIndex],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, index: number) => {
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
    },
    [
      activeGroup.id,
      activeGroup.songs,
      draggedIndex,
      handleDragEnd,
      reorderSongs,
    ],
  );

  return (
    <div
      ref={containerRef}
      className="w-full text-sm relative z-20 -mt-16 pt-12"
    >
      {activeGroup.songs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col relative min-w-0">
          <TracklistHeader
            selectionMode={selectionMode}
            selectedCount={selectedSongs.length}
            totalCount={activeGroup.songs.length}
            onToggleSelectAll={onToggleSelectAll}
            sortConfig={sortConfig}
            onSort={onSort}
            variant={variant}
          />

          <div className="flex flex-col gap-1 relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const song = activeGroup.songs[virtualItem.index];
              return (
                <div
                  key={`${song.id}-${song.addedAt}`}
                  ref={virtualItem.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translate3d(0, ${virtualItem.start}px, 0)`,
                    willChange: 'transform'
                  }}
                >
                  <SongRow
                    song={song}
                    index={virtualItem.index}
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
                    isSelectable={selectionMode}
                    isSelected={selectedSongs.includes(song.id)}
                    onToggleSelect={onToggleSongSelect}
                    onToggleLike={handleToggleLike}
                    variant={variant}
                    isReadOnly={isReadOnly}
                  />
                </div>
              );
            })}
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
        title={activeGroup.id === "liked" ? "Unlike Song" : "Remove Song"}
        message={`Are you sure you want to remove "${songToRemove?.title}" from ${activeGroup.id === "liked" ? "Liked Songs" : "this playlist"}?`}
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
});
