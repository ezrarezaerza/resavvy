import React, { useState, useRef, useEffect } from "react";
import { Plus, MoreHorizontal, Edit2, Trash2, Play, ImageIcon, Share2 } from "lucide-react";
import { PlaylistGroup } from "../types";
import { usePlaylist } from "../context/PlaylistContext";
import { usePlayer } from "../context/PlayerContext";
import { toast } from 'sonner';
import { ConfirmModal } from "./ConfirmModal";
import { EditCoverModal } from "./EditCoverModal";
import { EditPlaylistModal } from "./EditPlaylistModal";
import { nativeShare } from "../utils/nativeCapabilities";

interface PlaylistHeroProps {
  activeGroup: PlaylistGroup;
  onAddSong: () => void;
}

export function PlaylistHero({ activeGroup, onAddSong }: PlaylistHeroProps) {
  const { renameGroup, deleteGroup, updatePlaylistCover, updatePlaylistDetails } = usePlaylist();
  const { playSong } = usePlayer();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activeGroup.name);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [displayImage, setDisplayImage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditName(activeGroup.name);
  }, [activeGroup.name]);

  useEffect(() => {
    if (activeGroup.coverType === 'custom' && activeGroup.customCoverUrl) {
      setDisplayImage(activeGroup.customCoverUrl);
    } else {
      if (activeGroup.songs.length > 0) {
        const randomSong = activeGroup.songs[Math.floor(Math.random() * activeGroup.songs.length)];
        let url = randomSong.thumbnailUrl;
        url = url.replace('mqdefault.jpg', 'maxresdefault.jpg').replace('hqdefault.jpg', 'maxresdefault.jpg');
        setDisplayImage(url);
      } else {
        setDisplayImage('');
      }
    }
  }, [activeGroup.id, activeGroup.coverType, activeGroup.customCoverUrl, activeGroup.songs]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRenameSubmit = () => {
    if (editName.trim() && editName !== activeGroup.name) {
      renameGroup(activeGroup.id, editName.trim());
    } else {
      setEditName(activeGroup.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setEditName(activeGroup.name);
      setIsEditing(false);
    }
  };

  const handleDeleteConfirm = () => {
    deleteGroup(activeGroup.id);
    setShowDeleteConfirm(false);
  };

  const handlePlayAll = () => {
    triggerHaptic();
    if (activeGroup.songs.length > 0) {
      playSong(activeGroup.songs[0], activeGroup.songs);
    }
  };

  const handleShare = async () => {
    try {
      if (activeGroup.visibility === "private" || !activeGroup.visibility) {
        toast.info("This playlist is private. Change visibility to share.");
      }
      await nativeShare(`Playlist: ${activeGroup.name}`, `${window.location.origin}/p/${activeGroup.id}`);
    } catch (e) {
      toast.error("Failed to copy link");
    }
    setShowOptions(false);
  };

// Handle user click for public profiles
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeGroup.user?.username) {
      window.location.href = `/u/${activeGroup.user.username}`;
    }
  };

  return (
    <>
      <div className="relative w-full h-[50vh] md:h-[60vh] flex-shrink-0 flex flex-col justify-end group/hero bg-gray-900">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Background */}
          {displayImage ? (
            <img 
              src={displayImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-gray-900" />
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col justify-end z-10">
          <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex-1 min-w-0 flex flex-col justify-end items-start">
            <div className="inline-block max-w-full">
              <div className="flex items-center gap-3 mb-2 relative">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleKeyDown}
                    className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white bg-transparent border-b-2 border-indigo-400 focus:outline-none w-full max-w-xl py-1"
                  />
                ) : (
                  <>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white break-words drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] py-1">
                      {activeGroup.name}
                    </h1>
                    <div className="relative" ref={optionsRef}>
                      <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover/hero:opacity-100 focus:opacity-100 outline-none backdrop-blur-sm"
                      >
                        <MoreHorizontal className="w-6 h-6" />
                      </button>

                      {showOptions && (
                        <div className="absolute right-0 top-full mt-2 w-48 origin-top-right z-[90] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={handleShare}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            Share Playlist
                          </button>
                          <button
                            onClick={() => {
                              setShowEditDetailsModal(true);
                              setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Details
                          </button>
                          <button
                            onClick={() => {
                              setShowCoverModal(true);
                              setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                          >
                            <ImageIcon className="w-4 h-4" />
                            Customize Cover
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(true);
                              setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Playlist
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-lg font-medium text-gray-200 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mt-2">
                <span>
                  {activeGroup.songs.length} {activeGroup.songs.length === 1 ? 'song' : 'songs'}
                </span>
                {activeGroup.user && activeGroup.user.name && (
                   <>
                     <span>•</span>
                     <span 
                       onClick={handleUserClick} 
                       className="hover:underline hover:text-indigo-300 cursor-pointer transition-colors"
                     >
                       by {activeGroup.user.name}
                     </span>
                   </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0 shrink-0">
            {activeGroup.songs.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <Play className="w-5 h-5 fill-current" />
                Play All
              </button>
            )}
            <button
              onClick={(e) => { triggerHaptic(); onAddSong(); }}
              className="p-3 md:px-5 md:py-3 flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/10 hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden leading-none md:inline">Add Song</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Playlist"
        message={`Are you sure you want to delete "${activeGroup.name}"? This action cannot be undone.`}
      />

      {showCoverModal && (
        <EditCoverModal
          group={activeGroup}
          onSave={(type, url) => {
            updatePlaylistCover(activeGroup.id, type, url);
          }}
          onClose={() => setShowCoverModal(false)}
        />
      )}

      {showEditDetailsModal && (
        <EditPlaylistModal
          isOpen={showEditDetailsModal}
          onClose={() => setShowEditDetailsModal(false)}
          playlist={activeGroup}
          onSave={(details) => updatePlaylistDetails(activeGroup.id, details)}
        />
      )}
    </>
  );
}
