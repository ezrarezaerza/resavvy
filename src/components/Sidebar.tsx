import React, { useState } from "react";
import {
  Moon,
  Plus,
  Sun,
  AudioLines,
  MoreHorizontal,
  Trash2,
  Settings,
  LogOut,
  Compass,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import { PlaylistGroup } from "../types";
import { ConfirmModal } from "./ConfirmModal";
import { usePlaylist } from "../context/PlaylistContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../hooks/useSettings";

interface SidebarProps {
  groups: PlaylistGroup[];
  activeGroupId: string | null;
  setActiveGroupId: (id: string | null) => void;
  createGroup: (name: string) => void;
  deleteGroup: (id: string) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  onMenuClick: () => void;
  onCreatePlaylist: () => void;
}

export function Sidebar({
  groups,
  activeGroupId,
  setActiveGroupId,
  deleteGroup,
  isOpen,
  isCollapsed,
  onMenuClick,
  onCreatePlaylist,
}: SidebarProps) {
  const [playlistToDelete, setPlaylistToDelete] =
    useState<PlaylistGroup | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { renameGroup, unsavePlaylist } = usePlaylist();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useSettings();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const goHome = () => {
    setActiveGroupId(null);
  };

  const handleRename = (playlist: PlaylistGroup) => {
    const newName = window.prompt("Rename playlist:", playlist.name);
    if (newName && newName.trim() && newName !== playlist.name) {
      renameGroup(playlist.id, newName.trim());
    }
    setOpenMenuId(null);
  };

  return (
    <aside
      className={`flex flex-col fixed inset-y-0 left-0 z-[60] md:z-30 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-r border-gray-200 dark:border-white/5 transition-all duration-300 ease-in-out md:relative md:translate-x-0 shrink-0 h-full md:pb-24 ${isCollapsed ? "md:w-20" : "md:w-64"} w-64 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4 p-4 pt-20 md:p-4">
        <div className="hidden md:flex flex-col gap-1">
          <div
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
              activeGroupId === null
                ? "bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white font-bold"
                : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-medium"
            } ${isCollapsed ? "justify-center border-transparent" : "justify-start"}`}
            onClick={goHome}
            title={isCollapsed ? "Home" : undefined}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span
              className={`text-sm font-medium ${isCollapsed ? "hidden" : "block"}`}
            >
              Home
            </span>
          </div>
          <div
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
              activeGroupId === "discovery"
                ? "bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white font-bold"
                : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-medium"
            } ${isCollapsed ? "justify-center border-transparent" : "justify-start"}`}
            onClick={() => setActiveGroupId("discovery")}
            title={isCollapsed ? "Discover" : undefined}
          >
            <Compass className="shrink-0 w-[18px] h-[18px]" />
            <span
              className={`text-sm font-medium ${isCollapsed ? "hidden" : "block"}`}
            >
              Discover
            </span>
          </div>
          {user && (
            <>
              <div
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                  activeGroupId === "analytics"
                    ? "bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white font-bold"
                    : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                } ${isCollapsed ? "justify-center border-transparent" : "justify-start"}`}
                onClick={() => setActiveGroupId("analytics")}
                title={isCollapsed ? "Analytics" : undefined}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-bar-chart-2 shrink-0"
                >
                  <line x1="18" x2="18" y1="20" y2="10" />
                  <line x1="12" x2="12" y1="20" y2="4" />
                  <line x1="6" x2="6" y1="20" y2="14" />
                </svg>
                <span
                  className={`text-sm font-medium ${isCollapsed ? "hidden" : "block"}`}
                >
                  Analytics
                </span>
              </div>
              <div
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                  activeGroupId === "library"
                    ? "bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white font-bold"
                    : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                } ${isCollapsed ? "justify-center border-transparent" : "justify-start"}`}
                onClick={() => setActiveGroupId("library")}
                title={isCollapsed ? "My Library" : undefined}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <path d="m16 6 4 14" />
                  <path d="M12 6v14" />
                  <path d="M8 8v12" />
                  <path d="M4 4v16" />
                </svg>
                <span
                  className={`text-sm font-medium ${isCollapsed ? "hidden" : "block"}`}
                >
                  My Library
                </span>
              </div>
            </>
          )}
        </div>

        {user && (
          <h3
            className={`text-xs text-gray-500 font-semibold mb-3 ${isCollapsed ? "hidden" : "block"}`}
          >
            YOUR PLAYLISTS
          </h3>
        )}

        <div className="space-y-0.5">
          {user && (
            <div
              className={`w-full group flex items-center p-2 rounded-lg transition-colors cursor-pointer ${
                activeGroupId === "liked"
                  ? "bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white font-bold"
                  : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-medium"
              } ${isCollapsed ? "justify-center border-transparent" : "justify-between gap-3"}`}
              onClick={() => setActiveGroupId("liked")}
              title={isCollapsed ? "Liked Songs" : undefined}
            >
              <div
                className={`flex items-center gap-3 min-w-0 overflow-hidden ${isCollapsed ? "justify-center w-full" : ""}`}
              >
                <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 flex items-center justify-center overflow-hidden">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="white"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-heart"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <span
                  className={`text-sm truncate ${isCollapsed ? "hidden" : "block"}`}
                >
                  Liked Songs
                </span>
              </div>
            </div>
          )}

          {groups
            .filter((g) => !g.isSaved)
            .map((playlist) => {
              const isActive = playlist.id === activeGroupId;
              const isMenuOpen = openMenuId === playlist.id;
              return (
                <div
                  key={playlist.id}
                  className={`relative w-full group flex items-center p-2 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white font-bold"
                      : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                  } ${isCollapsed ? "justify-center border-transparent" : "justify-between gap-3"}`}
                  onClick={() => setActiveGroupId(playlist.id)}
                  title={isCollapsed ? playlist.name : undefined}
                >
                  <div
                    className={`flex items-center gap-3 min-w-0 overflow-hidden ${isCollapsed ? "justify-center w-full" : ""}`}
                  >
                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-800 shrink-0 flex items-center justify-center overflow-hidden">
                      {playlist.coverType === "custom" &&
                      playlist.customCoverUrl ? (
                        <img
                          src={playlist.customCoverUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : playlist.songs && playlist.songs.length > 0 ? (
                        <img
                          src={playlist.songs[0].thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <AudioLines className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                    <span
                      className={`text-sm truncate ${isCollapsed ? "hidden" : "block"}`}
                    >
                      {playlist.name}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : playlist.id);
                    }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500 hover:bg-black/10 dark:hover:bg-white/10"} ${isMenuOpen ? "opacity-100" : ""} ${isCollapsed ? "hidden" : "block"}`}
                    title="More options"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {isMenuOpen && !isCollapsed && (
                    <div className="absolute right-4 top-8 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden w-40 flex flex-col p-1 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(playlist);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaylistToDelete(playlist);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {groups.some((g) => g.isSaved) && (
          <>
            <h3
              className={`text-xs text-gray-500 font-semibold mb-3 mt-6 ${isCollapsed ? "hidden" : "block"}`}
            >
              SAVED PLAYLISTS
            </h3>
            <div className="space-y-0.5">
              {groups
                .filter((g) => g.isSaved)
                .map((playlist) => {
                  const isActive = playlist.id === activeGroupId;
                  const isMenuOpen = openMenuId === playlist.id;
                  return (
                    <div
                      key={playlist.id}
                      className={`relative w-full group flex items-center p-2 rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? "bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white font-bold"
                          : "text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                      } ${isCollapsed ? "justify-center border-transparent" : "justify-between gap-3"}`}
                      onClick={() => setActiveGroupId(playlist.id)}
                      title={isCollapsed ? playlist.name : undefined}
                    >
                      <div
                        className={`flex items-center gap-3 min-w-0 overflow-hidden ${isCollapsed ? "justify-center w-full" : ""}`}
                      >
                        <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-800 shrink-0 flex items-center justify-center overflow-hidden">
                          {playlist.coverType === "custom" &&
                          playlist.customCoverUrl ? (
                            <img
                              src={playlist.customCoverUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : playlist.songs && playlist.songs.length > 0 ? (
                            <img
                              src={playlist.songs[0].thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <AudioLines className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                        <span
                          className={`text-sm truncate ${isCollapsed ? "hidden" : "block"}`}
                        >
                          {playlist.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(isMenuOpen ? null : playlist.id);
                        }}
                        className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:text-gray-900 dark:hover:text-white transition-all ${isActive ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500 hover:bg-black/10 dark:hover:bg-white/10"} ${isMenuOpen ? "opacity-100" : ""} ${isCollapsed ? "hidden" : "block"}`}
                        title="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {isMenuOpen && !isCollapsed && (
                        <div className="absolute right-4 top-8 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden w-40 flex flex-col p-1 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlaylistToDelete(playlist);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                          >
                            Remove from Library
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>

      <div
        className={`p-4 border-t border-gray-200 dark:border-white/5 mt-auto hidden md:flex ${isCollapsed ? "justify-center" : ""}`}
      >
        <button
          onClick={onCreatePlaylist}
          className={`w-full flex items-center justify-center p-3 rounded-xl border border-gray-300 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium text-gray-800 dark:text-gray-300 transition-colors ${
            isCollapsed ? "" : "gap-2"
          }`}
          title={isCollapsed ? "New Playlist" : undefined}
        >
          {isCollapsed ? (
            <Plus size={20} className="shrink-0" />
          ) : (
            <>
              <Plus size={18} className="shrink-0" /> New Playlist
            </>
          )}
        </button>
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
        title={
          playlistToDelete?.isSaved ? "Remove Playlist" : "Delete Playlist"
        }
        message={
          playlistToDelete?.isSaved
            ? `Are you sure you want to remove "${playlistToDelete?.name}" from your library?`
            : `Are you sure you want to delete "${playlistToDelete?.name}"? All songs in this playlist will be removed.`
        }
        confirmText={playlistToDelete?.isSaved ? "Remove" : "Delete Playlist"}
      />
    </aside>
  );
}
