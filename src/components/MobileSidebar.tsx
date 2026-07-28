import React, { useRef, useEffect, useState } from "react";
import { 
  X, 
  Plus, 
  Heart, 
  AudioLines, 
  MoreHorizontal,
  FolderHeart,
  Music,
  Trash2,
  Edit2,
  ListMusic
} from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../context/AuthContext";
import { usePlaylist } from "../context/PlaylistContext";
import { PlaylistGroup } from "../types";
import { ConfirmModal } from "./ConfirmModal";

interface MobileSidebarProps {
  groups: PlaylistGroup[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: () => void;
}

export function MobileSidebar({
  groups,
  activeGroupId,
  setActiveGroupId,
  isOpen,
  onClose,
  onCreatePlaylist
}: MobileSidebarProps) {
  const { user } = useAuth();
  const { renameGroup, deleteGroup, unsavePlaylist } = usePlaylist();
  
  const [playlistToDelete, setPlaylistToDelete] = useState<PlaylistGroup | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const menuListRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const tl = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    if (!isOpen) return;

    tl.current = gsap.timeline({
      paused: true,
      onReverseComplete: () => {
        onClose();
      }
    });

    // Reset layout before animation
    gsap.set(containerRef.current, { display: "block" });
    gsap.set(overlayRef.current, { opacity: 0 });
    gsap.set(contentRef.current, { xPercent: -100 });

    const listItems = menuListRef.current?.querySelectorAll(".animate-item");
    if (listItems && listItems.length > 0) {
      gsap.set(listItems, { opacity: 0, x: -30 });
    }

    if (titleRef.current) {
      gsap.set(titleRef.current, { opacity: 0, y: -10 });
    }
    if (closeBtnRef.current) {
      gsap.set(closeBtnRef.current, { rotate: 90, scale: 0.7, opacity: 0 });
    }
    if (footerRef.current) {
      gsap.set(footerRef.current, { opacity: 0, y: 20 });
    }

    // Play smooth sequential transition
    tl.current
      .to(overlayRef.current, {
        opacity: 1,
        duration: 0.35,
        ease: "power2.out"
      })
      .to(contentRef.current, {
        xPercent: 0,
        duration: 0.45,
        ease: "power4.out"
      }, "-=0.25")
      .to(closeBtnRef.current, {
        rotate: 0,
        scale: 1,
        opacity: 1,
        duration: 0.35,
        ease: "back.out(1.7)"
      }, "-=0.3")
      .to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power3.out"
      }, "-=0.25");

    if (listItems && listItems.length > 0) {
      tl.current.to(listItems, {
        opacity: 1,
        x: 0,
        stagger: 0.04,
        duration: 0.4,
        ease: "power3.out"
      }, "-=0.25");
    }

    tl.current.to(footerRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.35,
      ease: "power2.out"
    }, "-=0.2");

    tl.current.play();

    return () => {
      if (tl.current) {
        tl.current.kill();
      }
    };
  }, { dependencies: [isOpen], scope: containerRef });

  const handleClose = () => {
    if (tl.current) {
      tl.current.timeScale(1.25).reverse();
    } else {
      onClose();
    }
  };

  const handleNavigation = (id: string | null) => {
    if (tl.current) {
      tl.current.timeScale(1.5).reverse();
      setTimeout(() => {
        setActiveGroupId(id);
      }, 350);
    } else {
      setActiveGroupId(id);
      onClose();
    }
  };

  const handleRename = (playlist: PlaylistGroup) => {
    const newName = window.prompt("Rename playlist:", playlist.name);
    if (newName && newName.trim() && newName !== playlist.name) {
      renameGroup(playlist.id, newName.trim());
    }
    setOpenMenuId(null);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const normalPlaylists = groups.filter((g) => !g.isSaved);
  const savedPlaylists = groups.filter((g) => g.isSaved);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] overflow-hidden md:hidden"
      style={{ display: "none" }}
    >
      {/* Backdrop overlay */}
      <div 
        ref={overlayRef}
        onClick={handleClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
      />

      {/* Main Drawer Content */}
      <div 
        ref={contentRef}
        className="absolute inset-y-0 left-0 w-full max-w-md bg-white dark:bg-gray-950 shadow-2xl flex flex-col justify-between border-r border-gray-100 dark:border-white/5"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between px-6 pt-7 pb-4 shrink-0">
          <div ref={titleRef} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
              <ListMusic className="w-5.5 h-5.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-black text-2xl tracking-tight text-gray-900 dark:text-white leading-none">
                Playlists
              </span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-gray-500 mt-1">
                Your Personal Audio Library
              </span>
            </div>
          </div>
          <button 
            ref={closeBtnRef}
            onClick={handleClose}
            className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all cursor-pointer border border-gray-200 dark:border-white/5 flex items-center justify-center bg-white dark:bg-gray-900 shadow-xs shrink-0"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Navigation Area */}
        <div ref={menuListRef} className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar flex flex-col gap-6">
          
          {/* Your Playlists Section */}
          <div className="flex flex-col gap-2.5 animate-item">
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-black tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                Your Playlists
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {normalPlaylists.length + 1} record{normalPlaylists.length + 1 !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Liked Songs */}
            <button
              onClick={() => handleNavigation("liked")}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-sm font-bold transition-all text-left border cursor-pointer ${
                activeGroupId === "liked"
                  ? "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-500/20 shadow-xs"
                  : "bg-gray-50/55 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center overflow-hidden shadow-sm shadow-indigo-500/20">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-base truncate">Liked Songs</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">Curated Favorites</span>
                </div>
              </div>
              <div className="p-1.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 text-xs font-black px-2.5">
                Best
              </div>
            </button>

            {/* Normal Playlists */}
            {normalPlaylists.length === 0 ? (
              <div className="p-8 border border-dashed border-gray-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                <Music className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">No custom playlists yet</span>
              </div>
            ) : (
              normalPlaylists.map((playlist) => {
                const isActive = playlist.id === activeGroupId;
                const isMenuOpen = openMenuId === playlist.id;
                const songCount = playlist.songs?.length || 0;
                
                return (
                  <div
                    key={playlist.id}
                    className={`relative w-full flex items-center justify-between p-3.5 rounded-2xl text-sm font-bold transition-all text-left border ${
                      isActive
                        ? "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-500/20 shadow-xs"
                        : "bg-gray-50/55 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10"
                    }`}
                  >
                    <button 
                      onClick={() => handleNavigation(playlist.id)}
                      className="flex-1 flex items-center gap-4 min-w-0 text-left cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0 flex items-center justify-center overflow-hidden shadow-xs border border-black/5 dark:border-white/5">
                        {playlist.coverType === "custom" && playlist.customCoverUrl ? (
                          <img src={playlist.customCoverUrl} alt="" className="w-full h-full object-cover" />
                        ) : playlist.songs && playlist.songs.length > 0 ? (
                          <img src={playlist.songs[0].thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <AudioLines className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-base text-gray-900 dark:text-white truncate">{playlist.name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
                          {songCount} track{songCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : playlist.id);
                      }}
                      className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-all shrink-0 cursor-pointer"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-4 top-14 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden w-40 flex flex-col p-1.5 gap-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRename(playlist);
                          }}
                          className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaylistToDelete(playlist);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Saved Playlists Section */}
          {user && (
            <div className="flex flex-col gap-2.5 animate-item">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-black tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                  Saved Playlists
                </span>
                {savedPlaylists.length > 0 && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {savedPlaylists.length} record{savedPlaylists.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {savedPlaylists.length === 0 ? (
                <div className="p-8 border border-dashed border-gray-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
                  <FolderHeart className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500">No saved community playlists</span>
                </div>
              ) : (
                savedPlaylists.map((playlist) => {
                  const isActive = playlist.id === activeGroupId;
                  const isMenuOpen = openMenuId === playlist.id;
                  const songCount = playlist.songs?.length || 0;

                  return (
                    <div
                      key={playlist.id}
                      className={`relative w-full flex items-center justify-between p-3.5 rounded-2xl text-sm font-bold transition-all text-left border ${
                        isActive
                          ? "bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-500/20 shadow-xs"
                          : "bg-gray-50/55 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10"
                      }`}
                    >
                      <button 
                        onClick={() => handleNavigation(playlist.id)}
                        className="flex-1 flex items-center gap-4 min-w-0 text-left cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0 flex items-center justify-center overflow-hidden shadow-xs border border-black/5 dark:border-white/5">
                          {playlist.coverType === "custom" && playlist.customCoverUrl ? (
                            <img src={playlist.customCoverUrl} alt="" className="w-full h-full object-cover" />
                          ) : playlist.songs && playlist.songs.length > 0 ? (
                            <img src={playlist.songs[0].thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <AudioLines className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-base text-gray-900 dark:text-white truncate">{playlist.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
                            {songCount} track{songCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : playlist.id);
                        }}
                        className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white transition-all shrink-0 cursor-pointer"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-4 top-14 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden w-44 flex flex-col p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaylistToDelete(playlist);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>Remove Playlist</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer Area with Create New Playlist */}
        <div ref={footerRef} className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/10 shrink-0">
          <button
            onClick={() => {
              onCreatePlaylist();
              handleClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-lg border border-indigo-500"
          >
            <Plus className="w-5 h-5 animate-pulse" />
            <span>Create New Playlist</span>
          </button>
        </div>
      </div>

      {openMenuId && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenuId(null);
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!playlistToDelete}
        onClose={() => setPlaylistToDelete(null)}
        onConfirm={() => {
          if (playlistToDelete) {
            if (playlistToDelete.isSaved) {
              unsavePlaylist(playlistToDelete.id);
            } else {
              deleteGroup(playlistToDelete.id);
            }
          }
        }}
        title={playlistToDelete?.isSaved ? "Remove Playlist" : "Delete Playlist"}
        message={
          playlistToDelete?.isSaved
            ? `Are you sure you want to remove "${playlistToDelete?.name}" from your library?`
            : `Are you sure you want to delete "${playlistToDelete?.name}"? All songs in this playlist will be removed.`
        }
        confirmText={playlistToDelete?.isSaved ? "Remove" : "Delete Playlist"}
      />
    </div>
  );
}
