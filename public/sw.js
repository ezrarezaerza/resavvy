const CACHE_NAME = 'resavvy-shell-v1';
const METADATA_CACHE = 'resavvy-playlist-metadata-v1';
const MEDIA_CACHE = 'resavvy-track-media-v1';
const FREQUENT_CACHE = 'resavvy-frequently-played-v1';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install Event - Pre-cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching App Shell');
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, METADATA_CACHE, MEDIA_CACHE, FREQUENT_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting stale cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Process Range Request for Partial Content (206)
async function handleRangeRequest(request, response) {
  const rangeHeader = request.headers.get('Range');
  if (!rangeHeader) return response;

  const arrayBuffer = await response.arrayBuffer();
  const bytes = rangeHeader.replace(/bytes=/, '').split('-');
  const start = parseInt(bytes[0], 10);
  const end = bytes[1] ? parseInt(bytes[1], 10) : arrayBuffer.byteLength - 1;

  if (start >= arrayBuffer.byteLength || end >= arrayBuffer.byteLength) {
    return new Response('', {
      status: 416,
      statusText: 'Range Not Satisfiable',
      headers: { 'Content-Range': `bytes */${arrayBuffer.byteLength}` }
    });
  }

  const slicedBuffer = arrayBuffer.slice(start, end + 1);
  return new Response(slicedBuffer, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Range': `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
      'Content-Length': `${slicedBuffer.byteLength}`,
      'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
      'Accept-Ranges': 'bytes'
    }
  });
}

// Fetch Event Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // 1. Navigation requests (HTML document)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/index.html') || await cache.match('/');
        return cachedResponse || new Response('Offline - App Shell Not Found', { status: 503 });
      })
    );
    return;
  }

  // 2. Playlist & Track Metadata API Requests (/api/playlists, /api/songs, etc.)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse.ok) {
            const cache = await caches.open(METADATA_CACHE);
            // Clone and store successful GET responses
            cache.put(request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[SW] Serving API response from offline cache:', request.url);
          const cache = await caches.open(METADATA_CACHE);
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // If query param url variations match, try matchWithoutQuery
          const allKeys = await cache.keys();
          const matchedKey = allKeys.find(k => new URL(k.url).pathname === url.pathname);
          if (matchedKey) {
            return cache.match(matchedKey);
          }
          return new Response(JSON.stringify({ offline: true, error: 'Offline network error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 3. YouTube Thumbnails & Cover Images (i.ytimg.com, unsplash, etc.)
  if (url.hostname.includes('ytimg.com') || url.hostname.includes('unsplash.com') || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(async (cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = await caches.open(MEDIA_CACHE);
            cache.put(request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch (err) {
          // Serve fallback image or empty if completely offline
          return cachedResponse || new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // 4. Audio Streams & Media Requests
  if (request.destination === 'audio' || url.pathname.endsWith('.mp3') || url.hostname.includes('googlevideo.com')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FREQUENT_CACHE);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          if (request.headers.has('Range')) {
            return handleRangeRequest(request, cachedResponse);
          }
          return cachedResponse;
        }
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        } catch (error) {
          if (cachedResponse) return cachedResponse;
          return new Response('Audio unavailable offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // 5. Default Static Assets Strategy (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok && request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Client PostMessage Commands
self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'CACHE_PLAYLIST') {
    const { playlist, songs } = data.payload || {};
    console.log('[SW] Explicitly caching playlist & songs:', playlist?.name, songs?.length);
    
    // Save metadata response in METADATA_CACHE
    const metaCache = await caches.open(METADATA_CACHE);
    if (playlist) {
      const playlistUrl = `/api/playlists?id=${playlist.id}`;
      const fakeResponse = new Response(JSON.stringify(playlist), {
        headers: { 'Content-Type': 'application/json' }
      });
      await metaCache.put(playlistUrl, fakeResponse);
    }

    // Cache thumbnails and media images
    if (Array.isArray(songs)) {
      const mediaCache = await caches.open(MEDIA_CACHE);
      for (const song of songs) {
        if (song.thumbnailUrl) {
          try {
            const imgReq = new Request(song.thumbnailUrl, { mode: 'no-cors' });
            const res = await fetch(imgReq);
            await mediaCache.put(imgReq, res);
          } catch (e) {}
        }
      }
    }

    // Notify clients that caching completed
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.postMessage({ type: 'PLAYLIST_CACHED', playlistId: playlist?.id }));
  }

  if (data.type === 'CACHE_FREQUENTLY_PLAYED') {
    const { songs } = data.payload || {};
    if (!Array.isArray(songs)) return;

    console.log('[SW] Caching top frequently played tracks:', songs.length);
    const frequentCache = await caches.open(FREQUENT_CACHE);
    const mediaCache = await caches.open(MEDIA_CACHE);

    for (const song of songs) {
      if (song.thumbnailUrl) {
        try {
          const imgReq = new Request(song.thumbnailUrl, { mode: 'no-cors' });
          const res = await fetch(imgReq);
          await mediaCache.put(imgReq, res);
        } catch (e) {}
      }
      // Cache song metadata key
      const songMetaUrl = `/api/songs?id=${song.id}`;
      await frequentCache.put(
        songMetaUrl,
        new Response(JSON.stringify(song), { headers: { 'Content-Type': 'application/json' } })
      );
    }

    const clients = await self.clients.matchAll();
    clients.forEach(c => c.postMessage({ type: 'FREQUENT_TRACKS_CACHED', count: songs.length }));
  }

  if (data.type === 'CLEAR_OFFLINE_CACHE') {
    const keys = await caches.keys();
    for (const key of keys) {
      if (key !== CACHE_NAME) {
        await caches.delete(key);
      }
    }
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.postMessage({ type: 'CACHE_CLEARED' }));
  }

  if (data.type === 'GET_OFFLINE_STATS') {
    const metaCache = await caches.open(METADATA_CACHE);
    const frequentCache = await caches.open(FREQUENT_CACHE);
    const mediaCache = await caches.open(MEDIA_CACHE);

    const metaKeys = await metaCache.keys();
    const freqKeys = await frequentCache.keys();
    const mediaKeys = await mediaCache.keys();

    event.ports[0]?.postMessage({
      metadataCount: metaKeys.length,
      frequentCount: freqKeys.length,
      mediaCount: mediaKeys.length
    });
  }
});
