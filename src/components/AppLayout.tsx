import React, { useState, useEffect, Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { Tracklist } from "./Tracklist";
import { PlayerBar } from "./PlayerBar";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { usePlaylist } from "../context/PlaylistContext";
import { Modal } from "./Modal";
import { AddSongInput } from "./AddSongInput";
import { CreatePlaylistModal } from "./CreatePlaylistModal";
import { PlaylistHero } from "./PlaylistHero";
import { TopNav } from "./TopNav";
import { FullscreenPlayer } from "./FullscreenPlayer";
const HomeDashboard = React.lazy(() => import("./HomeDashboard").then(m => ({ default: m.HomeDashboard })));
const LibraryDashboard = React.lazy(() => import("./LibraryDashboard").then(m => ({ default: m.LibraryDashboard })));
const DiscoveryDashboard = React.lazy(() => import("./DiscoveryDashboard").then(m => ({ default: m.DiscoveryDashboard })));
const AnalyticsDashboard = React.lazy(() => import("./AnalyticsDashboard").then(m => ({ default: m.AnalyticsDashboard })));
const LikedDashboard = React.lazy(() => import("./LikedDashboard").then(m => ({ default: m.LikedDashboard })));
const AdminDashboard = React.lazy(() => import("./AdminDashboard").then(m => ({ default: m.AdminDashboard })));
import { MobileBottomNav } from "./MobileBottomNav";
import { getThumbnailUrl } from "../utils/youtube";
const PublicPlaylistPage = React.lazy(() => import("./PublicPlaylistPage").then(m => ({ default: m.PublicPlaylistPage })));
const PublicProfilePage = React.lazy(() => import("./PublicProfilePage").then(m => ({ default: m.PublicProfilePage })));
const SettingsScreen = React.lazy(() => import("./SettingsScreen").then(m => ({ default: m.SettingsScreen })));
const AuthScreen = React.lazy(() => import("./AuthScreen").then(m => ({ default: m.AuthScreen })));
import { motion, AnimatePresence } from "framer-motion";

import { usePlayer } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Megaphone, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";

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
  const { groups, createGroup, deleteGroup, addSong, addSongsBulk, removeSong } =
    usePlaylist();
  const { currentSong } = usePlayer();
  const { user, setShowLoginModal, acknowledgeWarning } = useAuth();
  const { isMaintenanceMode, systemAlertBanner } = useSettings();
  
  const [dismissedBanner, setDismissedBanner] = useState<string | null>(() => {
    return typeof window !== "undefined" ? window.sessionStorage.getItem("dismissed_system_banner") : null;
  });

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
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [newPlaylistTagsStr, setNewPlaylistTagsStr] = useState("");
  const [newPlaylistVisibility, setNewPlaylistVisibility] = useState<'private' | 'public' | 'unlisted'>("public");

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user) {
      if (
        activeGroupId === "admin" ||
        activeGroupId === "analytics" ||
        activeGroupId === "liked" ||
        activeGroupId === "library"
      ) {
        setActiveGroupId(null);
      }
    } else if (activeGroupId === "admin" && user.role !== "ADMIN") {
      setActiveGroupId(null);
    }
  }, [user, activeGroupId]);

  useEffect(() => {
    if (isSidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
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
      activeGroupId !== "admin" &&
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

  const handleAddBulkSongs = (songs: Omit<import("../types").Song, "addedAt">[]) => {
    if (activeGroup) {
      addSongsBulk(activeGroup.id, songs);
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
      id !== "analytics" &&
      id !== "admin"
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

  const [prefilledYoutubeUrlForCreate, setPrefilledYoutubeUrlForCreate] = useState<string>('');
  const [prefilledUrlForAddSong, setPrefilledUrlForAddSong] = useState<string>('');

  const handleImportPlaylistUrl = (url: string) => {
    if (isMaintenanceMode) {
      toast.error("System is under maintenance. Playlist creation is temporarily disabled.");
      return;
    }
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setPrefilledYoutubeUrlForCreate(url);
    setIsCreatingModalOpen(true);
  };

  const handleAddSongUrl = (url: string) => {
    if (isMaintenanceMode) {
      toast.error("System is under maintenance.");
      return;
    }
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    setPrefilledUrlForAddSong(url);
    setIsAddSongModalOpen(true);
  };

  const handleCreatePlaylist = async (
    name: string,
    description?: string,
    tags?: string[],
    visibility?: 'private' | 'public' | 'unlisted',
    initialSongs?: Omit<import("../types").Song, "addedAt">[]
  ) => {
    if (isMaintenanceMode) {
      toast.error("System is under maintenance. Playlist creation is temporarily disabled.");
      return;
    }
    const newGroup = await createGroup(name, description, tags, visibility, initialSongs);
    setIsCreatingModalOpen(false);
    setPrefilledYoutubeUrlForCreate('');
    if (newGroup) {
      handleGroupSelect(newGroup.id);
    }
  };

  const openCreatePlaylistModal = () => {
    if (isMaintenanceMode) {
      toast.error("System is under maintenance. Playlist creation is temporarily disabled.");
      return;
    }
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

  const isAuthPage = currentPath === "/auth";
  const isSettingsPage = currentPath === "/settings";

  const activeRouteKey = isAuthPage 
    ? "auth" 
    : isSettingsPage 
    ? "settings" 
    : isPublicPlaylist && playlistIdPath 
    ? `public-playlist-${playlistIdPath}` 
    : isPublicProfile && profileUsernamePath 
    ? `public-profile-${profileUsernamePath}` 
    : activeGroupId || "home";

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors font-sans antialiased relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-white dark:bg-gray-950">
        {/* Soft indigo-blue radial gradient flash of light */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[150vw] h-[100vw] md:w-[80vw] md:h-[60vw] rounded-[100%] bg-indigo-500/20 dark:bg-indigo-600/20 blur-[100px] md:blur-[140px]" />
      </div>

      {currentSong?.thumbnailUrl && (
        <img
          src={getThumbnailUrl(currentSong.thumbnailUrl, 'mqdefault')}
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
          onImportPlaylistUrl={handleImportPlaylistUrl}
          onAddSongUrl={handleAddSongUrl}
        />
        
        {/* Global Broadcast Announcement Banner */}
        {systemAlertBanner && systemAlertBanner !== dismissedBanner && (
          <div id="user-broadcast-banner" className="bg-gradient-to-r from-indigo-600 to-violet-700 border-b border-indigo-500/20 text-white px-4 py-3 text-xs flex items-center justify-between gap-4 z-[51] animate-fadeIn shrink-0 relative shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 text-white shrink-0">
                <Megaphone className="w-3.5 h-3.5 animate-pulse" />
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-extrabold tracking-wider bg-white/20 px-1.5 py-0.5 rounded text-[8px] uppercase self-start sm:self-auto">SYSTEM ANNOUNCEMENT</span>
                <span className="font-semibold text-white/95 leading-snug">{systemAlertBanner}</span>
              </div>
            </div>
            <button 
              id="dismiss-broadcast-banner-btn"
              onClick={() => {
                window.sessionStorage.setItem("dismissed_system_banner", systemAlertBanner);
                setDismissedBanner(systemAlertBanner);
              }}
              className="text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all shrink-0"
              title="Dismiss Announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Maintenance Mode Banner */}
        {isMaintenanceMode && (
          <div id="user-maintenance-banner" className="bg-gradient-to-r from-amber-500 to-orange-600 border-b border-orange-500/20 text-white px-4 py-2.5 text-xs flex items-center justify-between gap-4 z-[51] animate-fadeIn shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 text-white shrink-0">
                <ShieldAlert className="w-3.5 h-3.5" />
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="font-extrabold tracking-wider bg-white/20 px-1.5 py-0.5 rounded text-[8px] uppercase self-start sm:self-auto">MAINTENANCE ACTIVE</span>
                <span className="font-semibold text-white/95">The database is in read-only maintenance mode. Playlist creation, modifications, and community social actions are temporarily restricted. Playback and browsing remain fully available.</span>
              </div>
            </div>
          </div>
        )}

        {user && user.moderationWarning && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-500 px-4 py-2.5 text-xs flex items-center justify-between gap-4 z-50 animate-fadeIn shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider bg-amber-500/20 px-1.5 py-0.5 rounded text-[9px]">Account Warning</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">"{user.moderationWarning}"</span>
            </div>
            <button 
              onClick={() => acknowledgeWarning()}
              className="hover:text-amber-400 font-bold underline cursor-pointer hover:no-underline text-[11px] whitespace-nowrap"
            >
              Acknowledge & Clear
            </button>
          </div>
        )}
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

          <MobileSidebar
            groups={groups}
            activeGroupId={activeGroupId}
            setActiveGroupId={handleGroupSelect}
            isOpen={isSidebarOpen && isMobile}
            onClose={() => setIsSidebarOpen(false)}
            onCreatePlaylist={openCreatePlaylistModal}
          />

          <FullscreenPlayer />

          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-transparent relative no-scrollbar pb-[150px] md:pb-[100px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeRouteKey}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 w-full flex flex-col"
              >
                <Suspense fallback={<div className="flex-1 flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
                  {isAuthPage ? (
                    <AuthScreen />
                  ) : isSettingsPage ? (
                    <SettingsScreen />
                  ) : isPublicPlaylist && playlistIdPath ? (
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
                  ) : activeGroupId === "admin" ? (
                    <AdminDashboard />
                  ) : activeGroup ? (
                    <div className="w-full flex-1 flex flex-col">
                      <PlaylistHero
                        activeGroup={activeGroup}
                        onAddSong={() => {
                          if (isMaintenanceMode) {
                            toast.error("System is under maintenance. Adding tracks is temporarily disabled.");
                            return;
                          }
                          setIsAddSongModalOpen(true);
                        }}
                        isReadOnly={activeGroup.isSaved || isMaintenanceMode}
                      />
                      <div className="max-w-5xl mx-auto w-full px-6 md:px-8 mt-6">
                        <Tracklist
                          activeGroup={activeGroup}
                          removeSong={(songId) => removeSong(activeGroup.id, songId)}
                          isReadOnly={activeGroup.isSaved || isMaintenanceMode}
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
                </Suspense>
              </motion.div>
            </AnimatePresence>
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
          onClose={() => {
            setIsAddSongModalOpen(false);
            setPrefilledUrlForAddSong('');
          }}
          title="Add New Song"
        >
          <AddSongInput 
            onAdd={handleAddSong} 
            onAddBulk={handleAddBulkSongs} 
            initialUrl={prefilledUrlForAddSong}
          />
        </Modal>

        <CreatePlaylistModal
          isOpen={isCreatingModalOpen}
          onClose={() => {
            setIsCreatingModalOpen(false);
            setPrefilledYoutubeUrlForCreate('');
          }}
          onCreate={handleCreatePlaylist}
          initialYoutubeUrl={prefilledYoutubeUrlForCreate}
        />
      </div>
    </div>
  );
}
