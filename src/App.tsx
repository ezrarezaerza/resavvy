/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLayout } from "./components/AppLayout";
import { PlayerProvider } from "./context/PlayerContext";
import { SettingsProvider } from "./context/SettingsContext";
import { PlaylistProvider } from "./context/PlaylistContext";
import { HiddenYouTubePlayer } from "./components/HiddenYouTubePlayer";
import { AuthProvider } from "./context/AuthContext";
import { AuthGuard } from "./components/AuthGuard";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const toaster = (
    <Toaster 
      theme="dark" 
      position="bottom-right"
      toastOptions={{ 
        className: 'bg-[#1a1f2e] border border-white/10 text-white backdrop-blur-md' 
      }} 
    />
  );

  return (
    <>
      {toaster}
      <AuthProvider>
        <SettingsProvider>
          <PlaylistProvider>
            <PlayerProvider>
              <AuthGuard>
                <HiddenYouTubePlayer />
                <AppLayout currentPath={currentPath} />
              </AuthGuard>
            </PlayerProvider>
          </PlaylistProvider>
        </SettingsProvider>
      </AuthProvider>
    </>
  );
}
