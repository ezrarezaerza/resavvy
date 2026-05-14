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

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <PlaylistProvider>
            <PlayerProvider>
              <HiddenYouTubePlayer />
              <AppLayout />
            </PlayerProvider>
          </PlaylistProvider>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
