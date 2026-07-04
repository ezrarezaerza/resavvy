import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Tracklist } from "./Tracklist";
import { PlayerBar } from "./PlayerBar";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { usePlaylist } from "../context/PlaylistContext";
import { Modal } from "./Modal";
import { AddSongInput } from "./AddSongInput";
import { PlaylistHero } from "./PlaylistHero";
import { TopNav } from "./TopNav";
import { FullscreenPlayer } from "./FullscreenPlayer";
import { HomeDashboard } from "./HomeDashboard";
import { LibraryDashboard } from "./LibraryDashboard";
import { DiscoveryDashboard } from "./DiscoveryDashboard";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { LikedDashboard } from "./LikedDashboard";
import { MobileBottomNav } from "./MobileBottomNav";
import { PublicPlaylistPage } from "./PublicPlaylistPage";
import { PublicProfilePage } from "./PublicProfilePage";

import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";

export function AppLayout({
  currentPath = typeof window !== "undefined" ? window.location.pathname : "/",
}: {
  currentPath?: string;
}) {
  useKeyboardShortcuts();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("group")) {
        const newUrl = window.location.pathname;
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, []);
  const { groups, createGroup, deleteGroup, addSong, removeSong } =
    usePlaylist();
  const { currentSong } = usePlayer();
  const { user, setShowLoginModal } = useAuth();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const groupParam = urlParams.get("group");
      if (groupParam) return groupParam;
    }
    return null;
  });
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [isAddSongModalOpen, setIsAddSongModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreatingModalOpen, setIsCreatingModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  useEffect(() => {
    if (
      activeGroupId &&
      activeGroupId !== "library" &&
      activeGroupId !== "discovery" &&
      activeGroupId !== "liked" &&
      activeGroupId !== "analytics" &&
      !groups.find((g) => g.id === activeGroupId)
    ) {
      setActiveGroupId(null);
    }
  }, [groups, activeGroupId]);

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  const handleAddSong = (song: Omit<import("../types").Song, "addedAt">) => {
    if (activeGroup) {
      addSong(activeGroup.id, song);
      setIsAddSongModalOpen(false);
    }
  };

  const handleGroupSelect = (id: string | null, searchPrefix?: string) => {
    if (!user && (id === "library" || id === "analytics" || id === "liked")) {
      setShowLoginModal(true);
      return;
    }

    if (
      id &&
      id !== "library" &&
      id !== "discovery" &&
      id !== "liked" &&
      id !== "analytics"
    ) {
      if (!groups.find((g) => g.id === id)) {
        // It's a public playlist not in our local library
        window.history.pushState(null, "", `/p/${id}`);
        window.dispatchEvent(new Event("popstate"));
        return;
      }
    }

    // Reset route to home if we are currently on a public route, to allow local view rendering
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new Event("popstate"));
    }

    setActiveGroupId(id);
    if (searchPrefix) {
      setGlobalSearchQuery(searchPrefix);
    } else if (id !== "discovery") {
      setGlobalSearchQuery(""); // Clear if navigating away without one
    }
    setIsSidebarOpen(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createGroup(newPlaylistName.trim());
      setNewPlaylistName("");
      setIsCreatingModalOpen(false);
    }
  };

  const openCreatePlaylistModal = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setIsCreatingModalOpen(true);
  };

  const isPublicPlaylist = currentPath?.startsWith("/p/");
  const playlistIdPath = isPublicPlaylist ? currentPath.split("/p/")[1] : null;

  const isPublicProfile = currentPath?.startsWith("/u/");
  const profileUsernamePath = isPublicProfile
    ? currentPath.split("/u/")[1]
    : null;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors font-sans antialiased relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-white dark:bg-gray-950">
        {/* Soft indigo-blue radial gradient flash of light */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[150vw] h-[100vw] md:w-[80vw] md:h-[60vw] rounded-[100%] bg-indigo-500/20 dark:bg-indigo-600/20 blur-[100px] md:blur-[140px]" />
      </div>

      {currentSong?.thumbnailUrl && (
        <img
          src={currentSong.thumbnailUrl.replace(
            "mqdefault.jpg",
            "hqdefault.jpg",
          )}
          alt=""
          className="fixed inset-0 w-full h-full object-cover blur-[120px] opacity-30 dark:opacity-20 pointer-events-none transition-all duration-1000 z-0"
        />
      )}

      <div className="relative z-10 flex flex-col w-full h-full">
        <TopNav
          onMenuClick={toggleSidebar}
          onLogoClick={() => {
            handleGroupSelect(null);
            window.history.pushState(null, "", "/");
            window.dispatchEvent(new Event("popstate"));
          }}
          onNavigate={handleGroupSelect}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <div className="flex flex-1 w-full overflow-hidden relative">
          <Sidebar
            groups={groups}
            activeGroupId={activeGroupId}
            setActiveGroupId={handleGroupSelect}
            createGroup={createGroup}
            deleteGroup={deleteGroup}
            isOpen={isSidebarOpen}
            isCollapsed={isSidebarCollapsed}
            onMenuClick={toggleSidebar}
            onCreatePlaylist={openCreatePlaylistModal}
          />

          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <FullscreenPlayer />

          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-transparent relative no-scrollbar pb-[150px] md:pb-[100px]">
            {isPublicPlaylist && playlistIdPath ? (
              <PublicPlaylistPage playlistId={playlistIdPath} />
            ) : isPublicProfile && profileUsernamePath ? (
              <PublicProfilePage username={profileUsernamePath} />
            ) : activeGroupId === "discovery" ? (
              <DiscoveryDashboard
                onSelectGroup={handleGroupSelect}
                initialSearchQuery={globalSearchQuery}
              />
            ) : activeGroupId === "analytics" ? (
              <AnalyticsDashboard onSelectGroup={setActiveGroupId} />
            ) : activeGroupId === "liked" ? (
              <LikedDashboard />
            ) : activeGroupId === "library" ? (
              <LibraryDashboard />
            ) : activeGroup ? (
              <div className="w-full flex-1 flex flex-col">
                <PlaylistHero
                  activeGroup={activeGroup}
                  onAddSong={() => setIsAddSongModalOpen(true)}
                  isReadOnly={activeGroup.isSaved}
                />
                <div className="max-w-5xl mx-auto w-full px-6 md:px-8 mt-6">
                  <Tracklist
                    activeGroup={activeGroup}
                    removeSong={(songId) => removeSong(activeGroup.id, songId)}
                    isReadOnly={activeGroup.isSaved}
                  />
                </div>
              </div>
            ) : (
              <HomeDashboard
                groups={groups}
                onSelectGroup={handleGroupSelect}
                onCreatePlaylist={openCreatePlaylistModal}
              />
            )}
          </main>
        </div>
        <PlayerBar />
        <MobileBottomNav
          activeGroupId={activeGroupId}
          onSelect={handleGroupSelect}
          onCreatePlaylist={openCreatePlaylistModal}
        />

        <Modal
          isOpen={isAddSongModalOpen}
          onClose={() => setIsAddSongModalOpen(false)}
          title="Add New Song"
        >
          <AddSongInput onAdd={handleAddSong} />
        </Modal>

        <Modal
          isOpen={isCreatingModalOpen}
          onClose={() => {
            setIsCreatingModalOpen(false);
            setNewPlaylistName("");
          }}
          title="New Playlist"
        >
          <form
            onSubmit={handleCreateSubmit}
            className="flex flex-col gap-4 mt-2"
          >
            <input
              autoFocus
              type="text"
              placeholder="E.g., Workout Mix, Chill Vibes..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingModalOpen(false);
                  setNewPlaylistName("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newPlaylistName.trim()}
              >
                Create
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
