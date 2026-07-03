import React, { useEffect, useState } from "react";
import { PlaylistGroup } from "../types";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";
import { usePlaylist } from "../context/PlaylistContext";
import { useToast } from "../context/ToastContext";
import { Play, Plus, Check, Copy, Heart } from "lucide-react";
import { AuthScreen } from "./AuthScreen";
import { Tracklist } from "./Tracklist";

interface PublicPlaylistPageProps {
  playlistId: string;
}

export function PublicPlaylistPage({ playlistId }: PublicPlaylistPageProps) {
  const [playlist, setPlaylist] = useState<
    (PlaylistGroup & { user?: { name: string; username: string } }) | null
  >(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const { token, user } = useAuth();
  const { playSong } = usePlayer();
  const { addToast } = useToast();
  const { groups, savePlaylist, unsavePlaylist, clonePlaylist } = usePlaylist();
  const [showAuth, setShowAuth] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/playlists?id=${playlistId}&_t=${Date.now()}`, { headers });
        if (!res.ok) {
          throw new Error("Failed to fetch playlist");
        }
        const data = await res.json();
        setPlaylist(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaylist();
  }, [playlistId, token]);

  const isSaved = groups.some((g) => g.id === playlistId && g.isSaved);
  const isOwned = Boolean(user && playlist?.user?.username === user.username);

  const handleToggleSave = async () => {
    if (!token) {
      setShowAuth(true);
      return;
    }

    // Prevent double clicking
    if (isImporting) return;

    if (isOwned) {
      window.location.href = `/?group=${playlistId}`;
      return;
    }

    setIsImporting(true);
    try {
      if (isSaved) {
        await unsavePlaylist(playlistId);
      } else {
        await savePlaylist(playlistId);
        setPlaylist(prev => prev ? { ...prev, likesCount: (prev.likesCount || 0) + 1 } : null);
      }
    } catch (e) {
      addToast(
        isSaved ? "Failed to remove playlist" : "Failed to save playlist",
        "error",
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleClonePlaylist = async () => {
    if (!token) {
      setShowAuth(true);
      return;
    }
    if (isCloning) return;
    setIsCloning(true);
    try {
      await clonePlaylist(playlistId);
    } catch (e) {
      addToast("Failed to clone playlist", "error");
    } finally {
      setIsCloning(false);
    }
  };

  const handlePlayAll = () => {
    if (playlist && playlist.songs.length > 0) {
      playSong(playlist.songs[0], playlist.songs);
    }
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Loading...
      </div>
    );
  if (error || !playlist)
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Error: {error || "Playlist not found"}
      </div>
    );

  let displayImage = "";
  if (playlist.coverType === "custom" && playlist.customCoverUrl) {
    displayImage = playlist.customCoverUrl;
  } else if (playlist.songs.length > 0 && playlist.songs[0].thumbnailUrl) {
    displayImage = playlist.songs[0].thumbnailUrl
      .replace("mqdefault.jpg", "maxresdefault.jpg")
      .replace("hqdefault.jpg", "maxresdefault.jpg");
  }

  return (
    <div className="flex flex-col w-full text-gray-900 dark:text-gray-100 font-sans">
      {showAuth && <AuthScreen onClose={() => setShowAuth(false)} />}

      {/* Hero Section */}
      <div className="relative w-full h-[50vh] md:h-[60vh] flex-shrink-0 flex flex-col justify-end group/hero mt-0 md:mt-2 md:mx-4 z-30">
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-b-2xl md:rounded-t-2xl bg-gray-100 dark:bg-gray-900">
          {displayImage ? (
            <img
              src={displayImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 opacity-60 dark:opacity-80 mix-blend-multiply dark:mix-blend-normal"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900 dark:to-gray-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-gray-900 dark:via-gray-900/60 to-transparent pointer-events-none" />
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col justify-end z-10">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 w-full">
            <div className="flex-1 min-w-0 flex flex-col justify-end items-start">
              {playlist.user && (
                <p className="text-gray-600 dark:text-gray-300 font-bold mb-2 uppercase tracking-widest text-xs z-10 relative">
                  Created by {playlist.user.name} (@{playlist.user.username})
                </p>
              )}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white break-words drop-shadow-sm py-1">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="text-gray-700 dark:text-gray-200 text-lg md:text-xl mt-4 max-w-2xl bg-white/40 dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 backdrop-blur-md shadow-sm">
                  {playlist.description}
                </p>
              )}
              {playlist.tags && playlist.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {playlist.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-indigo-50 dark:bg-white/10 px-4 py-1.5 text-sm font-semibold text-indigo-700 dark:text-white border border-indigo-100 dark:border-white/20 shadow-sm backdrop-blur-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-gray-600 dark:text-gray-300 mt-4 font-semibold flex items-center gap-4 drop-shadow-sm">
                <span>{playlist.songs.length} tracks</span>
                <span className={`flex items-center gap-1 ${(isSaved || isOwned) ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                  <Heart className={`w-4 h-4 ${(isSaved || isOwned) ? 'fill-current' : ''}`} /> {playlist.likesCount || 0}
                </span>
                {(playlist.forksCount || 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Copy className="w-4 h-4" /> {playlist.forksCount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 md:mt-0 shrink-0">
              {playlist.songs.length > 0 && (
                <button
                  onClick={handlePlayAll}
                  className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-400 text-white rounded-full font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Play Now
                </button>
              )}
              {!isOwned && (
                <button
                  onClick={handleClonePlaylist}
                  disabled={isCloning}
                  className="p-3 md:px-5 md:py-3 flex items-center gap-2 bg-gray-900/10 dark:bg-white/20 hover:bg-gray-900/20 dark:hover:bg-white/30 backdrop-blur-md text-gray-900 dark:text-white rounded-full font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/30 dark:focus:ring-white/50 border border-gray-900/10 dark:border-white/10 hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Copy className="w-5 h-5" />
                  <span className="hidden leading-none md:inline">
                    {isCloning ? "Cloning..." : "Clone"}
                  </span>
                </button>
              )}
              <button
                onClick={handleToggleSave}
                disabled={isImporting}
                className="p-3 md:px-5 md:py-3 flex items-center gap-2 bg-gray-900/10 dark:bg-white/20 hover:bg-gray-900/20 dark:hover:bg-white/30 backdrop-blur-md text-gray-900 dark:text-white rounded-full font-medium shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/30 dark:focus:ring-white/50 border border-gray-900/10 dark:border-white/10 hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isOwned ? (
                  <>
                    <Play className="w-5 h-5" />
                    <span className="hidden leading-none md:inline">
                      Go to Edit
                    </span>
                  </>
                ) : isSaved ? (
                  <>
                    <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden leading-none md:inline text-indigo-600 dark:text-indigo-400">
                      Following
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span className="hidden leading-none md:inline">
                      {isImporting ? "Saving..." : "Follow Playlist"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracklist */}
      <div className="max-w-5xl mx-auto w-full px-6 md:px-8 mt-6">
        <Tracklist
          activeGroup={playlist}
          removeSong={() => {}}
          isReadOnly={true}
        />
      </div>
    </div>
  );
}
