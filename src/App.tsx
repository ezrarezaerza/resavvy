/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLayout } from "./components/AppLayout";
import { PlayerProvider } from "./context/PlayerContext";
import { SettingsProvider } from "./context/SettingsContext";
import { PlaylistProvider } from "./context/PlaylistContext";
import { HiddenYouTubePlayer } from "./components/HiddenYouTubePlayer";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { PublicPlaylistPage } from "./components/PublicPlaylistPage";
import { PublicProfilePage } from "./components/PublicProfilePage";
import { useEffect, useState } from "react";

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const isPublicPlaylist = currentPath.startsWith('/p/');
  const playlistId = isPublicPlaylist ? currentPath.split('/p/')[1] : null;

  const isPublicProfile = currentPath.startsWith('/u/');
  const profileUsername = isPublicProfile ? currentPath.split('/u/')[1] : null;

  if (isPublicPlaylist && playlistId) {
    return (
      <ToastProvider>
         <AuthProvider>
           <PlayerProvider>
             <HiddenYouTubePlayer />
             <PublicPlaylistPage playlistId={playlistId} />
           </PlayerProvider>
         </AuthProvider>
      </ToastProvider>
    );
  }

  if (isPublicProfile && profileUsername) {
    return (
      <ToastProvider>
         <AuthProvider>
           <PlayerProvider>
             <HiddenYouTubePlayer />
             <PublicProfilePage username={profileUsername} />
           </PlayerProvider>
         </AuthProvider>
      </ToastProvider>
    );
  }

  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <PlaylistProvider>
            <PlayerProvider>
              <AuthGuard>
                <HiddenYouTubePlayer />
                <AppLayout />
              </AuthGuard>
            </PlayerProvider>
          </PlaylistProvider>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
