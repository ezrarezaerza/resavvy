import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plus, MoreHorizontal, Edit2, Trash2, Play, ImageIcon, Share2, Flag } from "lucide-react";
import { PlaylistGroup } from "../types";
import { usePlaylist } from "../context/PlaylistContext";
import { usePlayer } from "../context/PlayerContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { ConfirmModal } from "./ConfirmModal";
import { EditCoverModal } from "./EditCoverModal";
import { EditPlaylistModal } from "./EditPlaylistModal";
import { OptimizedImage } from "./OptimizedImage";
import { Modal } from "./Modal";
import { getThumbnailUrl } from "../utils/youtube";

interface PlaylistHeroProps {
  activeGroup: PlaylistGroup;
  onAddSong: () => void;
  isReadOnly?: boolean;
}

export function PlaylistHero({ activeGroup, onAddSong, isReadOnly = false }: PlaylistHeroProps) {
  const { renameGroup, deleteGroup, updatePlaylistCover, updatePlaylistDetails } = usePlaylist();
  const { playSong } = usePlayer();
  const { addToast } = useToast();
  const { token, setShowLoginModal } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activeGroup.name);
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [isSubmittingFlag, setIsSubmittingFlag] = useState(false);
  const [displayImage, setDisplayImage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const handleFlagClick = () => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    setShowFlagModal(true);
  };

  const handleFlagSubmit = async () => {
    if (!flagReason.trim()) {
      addToast("Please provide a reason for flagging.", "error");
      return;
    }

    setIsSubmittingFlag(true);
    try {
      const res = await fetch(`/api/playlists?id=${activeGroup.id}&action=flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: flagReason }),
      });

      if (res.ok) {
        addToast("Playlist flagged successfully! Thank you for helping keep the community safe.", "success");
        setShowFlagModal(false);
        setFlagReason("");
      } else {
        const data = await res.json();
        addToast(data.error || "Failed to flag playlist", "error");
      }
    } catch (err) {
      addToast("Failed to flag playlist", "error");
    } finally {
      setIsSubmittingFlag(false);
    }
  };

  useEffect(() => {
    setEditName(activeGroup.name);
  }, [activeGroup.name]);

  useEffect(() => {
    if (activeGroup.coverType === 'custom' && activeGroup.customCoverUrl) {
      setDisplayImage(activeGroup.customCoverUrl);
    } else {
      if (activeGroup.songs.length > 0) {
        const coverSong = activeGroup.songs[0];
        let url = coverSong.thumbnailUrl;
        if (url) {
          url = getThumbnailUrl(url, 'mqdefault');
          setDisplayImage(url);
        } else {
          setDisplayImage('');
        }
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
    if (activeGroup.songs.length > 0) {
      playSong(activeGroup.songs[0], activeGroup.songs);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${activeGroup.id}`);
      addToast("Link Copied!", "success");
      if (activeGroup.visibility === "private" || !activeGroup.visibility) {
        addToast("This playlist is private. Change visibility to share.", "info");
      }
    } catch (e) {
      addToast("Failed to copy link", "error");
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
    for (let i = 0; i < activeGroup.id.length; i++) {
      hash = activeGroup.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }, [activeGroup.id]);

  return (
    <>
      <div className="relative w-full h-[50vh] md:h-[60vh] flex-shrink-0 flex flex-col justify-end group/hero mt-0 md:mt-2 md:mx-4 z-30">
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-b-2xl md:rounded-t-2xl bg-gray-100 dark:bg-gray-900">
          {/* Background */}
          {displayImage ? (
            <OptimizedImage 
              src={displayImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 opacity-60 dark:opacity-80 mix-blend-multiply dark:mix-blend-normal"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${dynamicGradient} opacity-60 dark:opacity-80 mix-blend-multiply dark:mix-blend-normal`} />
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-gray-900 dark:via-gray-900/60 to-transparent pointer-events-none" />
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
                    className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white bg-transparent border-b-2 border-indigo-500 dark:border-indigo-400 focus:outline-none w-full max-w-xl py-1"
                  />
                ) : (
                  <>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white break-words drop-shadow-sm py-1">
                      {activeGroup.name}
                    </h1>
                    <div className="relative" ref={optionsRef}>
                      <button
                        onClick={() => setShowOptions(!showOptions)}
                        className="p-2 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover/hero:opacity-100 focus:opacity-100 outline-none backdrop-blur-sm"
                      >
                        <MoreHorizontal className="w-6 h-6" />
                      </button>

                      {showOptions && (
                        <div className="absolute right-0 top-full mt-2 w-48 origin-top-right z-[90] bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={handleShare}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            Share Playlist
                          </button>
                          {!isReadOnly && (
                            <>
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
                            </>
                          )}
                          {isReadOnly && (
                            <button
                              onClick={() => {
                                handleFlagClick();
                                setShowOptions(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 font-medium"
                            >
                              <Flag className="w-4 h-4 text-rose-500" />
                              Flag Playlist
                            </button>
                          )}
                          {!isReadOnly && (
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(true);
                                setShowOptions(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 mt-1 pt-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Playlist
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-lg font-medium text-gray-700 dark:text-gray-200 drop-shadow-sm mt-2">
                <span>
                  {activeGroup.songs.length} {activeGroup.songs.length === 1 ? 'song' : 'songs'}
                </span>
                {activeGroup.user && activeGroup.user.name && (
                   <>
                     <span>•</span>
                     <span 
                       onClick={handleUserClick} 
                       className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-300 cursor-pointer transition-colors"
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
                className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 text-white rounded-full font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              >
                <Play className="w-5 h-5 fill-current" />
                Play Now
              </button>
            )}
            {!isReadOnly && (
            <button
              onClick={onAddSong}
              className="p-3 md:px-5 md:py-3 flex items-center gap-2 bg-gray-900/10 dark:bg-white/20 hover:bg-gray-900/20 dark:hover:bg-white/30 backdrop-blur-md text-gray-900 dark:text-white rounded-full font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/30 dark:focus:ring-white/50 border border-gray-900/10 dark:border-white/10 hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden leading-none md:inline">Add Song</span>
            </button>
            )}
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

      {showFlagModal && (
        <Modal
          isOpen={showFlagModal}
          onClose={() => {
            setShowFlagModal(false);
            setFlagReason("");
          }}
          title="Flag Playlist"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
              Please let administration know why this playlist should be moderated. Your report is anonymous.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Reason for reporting
              </label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="e.g., Inappropriate content, dead links, misleading description..."
                className="w-full min-h-[100px] p-3 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none placeholder-gray-400"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                disabled={isSubmittingFlag}
              >
                Cancel
              </button>
              <button
                onClick={handleFlagSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                disabled={isSubmittingFlag}
              >
                {isSubmittingFlag ? "Submitting..." : "Submit Flag"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
