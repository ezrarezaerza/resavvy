import { Song, PlaylistGroup } from '../types';

const PLAY_COUNTS_KEY = 'resavvy_track_play_counts';
const OFFLINE_CACHED_IDS_KEY = 'resavvy_offline_cached_song_ids';

export interface SongPlayStat {
  song: Song;
  playCount: number;
  lastPlayedAt: number;
}

// 1. Record Song Play & Check Frequently Played Threshold
export function recordTrackPlay(song: Song): void {
  if (!song || !song.id) return;

  try {
    const raw = localStorage.getItem(PLAY_COUNTS_KEY);
    const statsMap: Record<string, SongPlayStat> = raw ? JSON.parse(raw) : {};

    const existing = statsMap[song.id] || { song, playCount: 0, lastPlayedAt: 0 };
    existing.playCount += 1;
    existing.lastPlayedAt = Date.now();
    existing.song = song; // update latest song details

    statsMap[song.id] = existing;
    localStorage.setItem(PLAY_COUNTS_KEY, JSON.stringify(statsMap));

    // Automatically trigger caching if track becomes frequently played (playCount >= 2)
    if (existing.playCount >= 2) {
      cacheTrackForOffline(song);
    }

    // Auto sync top 10 frequently played tracks
    const topTracks = getFrequentlyPlayedTracks(10);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_FREQUENTLY_PLAYED',
        payload: { songs: topTracks }
      });
    }
  } catch (err) {
    console.error('Error recording track play:', err);
  }
}

// 2. Get Frequently Played Tracks
export function getFrequentlyPlayedTracks(limit = 12): Song[] {
  try {
    const raw = localStorage.getItem(PLAY_COUNTS_KEY);
    if (!raw) return [];
    const statsMap: Record<string, SongPlayStat> = JSON.parse(raw);
    const sorted = Object.values(statsMap).sort((a, b) => b.playCount - a.playCount);
    return sorted.slice(0, limit).map((s) => s.song);
  } catch (err) {
    return [];
  }
}

// 3. Mark Single Track as Offline Cached
export function cacheTrackForOffline(song: Song): void {
  if (!song) return;
  try {
    const cachedIds = getCachedTrackIds();
    if (!cachedIds.includes(song.id)) {
      cachedIds.push(song.id);
      localStorage.setItem(OFFLINE_CACHED_IDS_KEY, JSON.stringify(cachedIds));
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_FREQUENTLY_PLAYED',
        payload: { songs: [song] }
      });
    }
  } catch (err) {
    console.error('Failed to cache track for offline:', err);
  }
}

// 4. Cache Entire Playlist Offline
export function cachePlaylistForOffline(playlist: PlaylistGroup): void {
  if (!playlist || !playlist.songs) return;

  try {
    const cachedIds = getCachedTrackIds();
    playlist.songs.forEach((song) => {
      if (!cachedIds.includes(song.id)) {
        cachedIds.push(song.id);
      }
    });
    localStorage.setItem(OFFLINE_CACHED_IDS_KEY, JSON.stringify(cachedIds));

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PLAYLIST',
        payload: { playlist, songs: playlist.songs }
      });
    }
  } catch (err) {
    console.error('Failed to cache playlist for offline:', err);
  }
}

// 5. Get List of Cached Track IDs
export function getCachedTrackIds(): string[] {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function isTrackCachedOffline(songId: string): boolean {
  return getCachedTrackIds().includes(songId);
}

// 6. Clear Offline Cache
export function clearAllOfflineCache(): Promise<void> {
  return new Promise((resolve) => {
    try {
      localStorage.removeItem(OFFLINE_CACHED_IDS_KEY);
    } catch (e) {}

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = () => resolve();
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_OFFLINE_CACHE' },
        [messageChannel.port2]
      );
      setTimeout(resolve, 1000);
    } else {
      resolve();
    }
  });
}

// 7. Get Offline Cache Statistics
export function fetchOfflineCacheStats(): Promise<{ metadataCount: number; frequentCount: number; mediaCount: number }> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data || { metadataCount: 0, frequentCount: 0, mediaCount: 0 });
      };
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_OFFLINE_STATS' },
        [messageChannel.port2]
      );
      setTimeout(() => resolve({ metadataCount: 0, frequentCount: 0, mediaCount: 0 }), 1000);
    } else {
      resolve({ metadataCount: 0, frequentCount: 0, mediaCount: 0 });
    }
  });
}

// 8. Register Service Worker
export function registerServiceWorker(onSuccess?: () => void, onUpdate?: () => void): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = '/sw.js';

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[PWA] New content is available; please refresh.');
                if (onUpdate) onUpdate();
              } else {
                console.log('[PWA] Content is cached for offline use.');
                if (onSuccess) onSuccess();
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('[PWA] Error during service worker registration:', error);
      });
  });
}
