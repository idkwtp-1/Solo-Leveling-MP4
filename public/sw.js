const CACHE_NAME = "slplayer-v3";
const STATIC_CACHE = "slplayer-static-v3";
const AUDIO_CACHE = "slplayer-audio-v3";

// Derive base path from SW location so it works on both localhost (/) and GitHub Pages (/Solo-Leveling-MP4/)
const BASE_PATH = new URL("./", self.location).pathname;

const STATIC_ASSETS = [
  BASE_PATH,
  BASE_PATH + "manifest.json",
  BASE_PATH + "icon-192.png",
  BASE_PATH + "icon-512.png",
  BASE_PATH + "fonts/orbitron-500.woff2",
  BASE_PATH + "fonts/orbitron-700.woff2",
  BASE_PATH + "fonts/orbitron-900.woff2",
  BASE_PATH + "fonts/rajdhani-400.woff2",
  BASE_PATH + "fonts/rajdhani-500.woff2",
  BASE_PATH + "fonts/rajdhani-600.woff2",
  BASE_PATH + "fonts/rajdhani-700.woff2",
  BASE_PATH + "fonts/robotomono-400.woff2",
  BASE_PATH + "fonts/robotomono-500.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE && key !== AUDIO_CACHE) {
              return caches.delete(key);
            }
          }),
        );
      }),
      // Claim clients
      self.clients.claim(),
    ]).then(() => {
      // Pre-cache all media files in the background (non-blocking)
      precacheAllMedia();
    }),
  );
});

// ─── Pre-cache all media files for offline use ───
async function precacheAllMedia() {
  try {
    const inventoryUrl = BASE_PATH + "media/tracks_inventory.json";
    const res = await fetch(inventoryUrl);
    if (!res.ok) {
      console.warn("[SW] Could not fetch tracks inventory for pre-caching");
      return;
    }
    const tracks = await res.json();
    const cache = await caches.open(AUDIO_CACHE);

    let cached = 0;
    let skipped = 0;

    for (const track of tracks) {
      if (!track.filename) continue;
      const url = BASE_PATH + "media/" + track.filename;

      // Skip if already cached
      const existing = await cache.match(url);
      if (existing) {
        skipped++;
        continue;
      }

      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          cached++;
        }
      } catch (err) {
        console.warn(`[SW] Failed to pre-cache: ${track.filename}`, err);
      }
    }

    console.log(
      `[SW] Pre-cache complete: ${cached} new, ${skipped} already cached`,
    );

    // Notify all clients that pre-caching is done
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: "PRECACHE_COMPLETE", cached, skipped });
    });
  } catch (e) {
    console.warn("[SW] Pre-cache media failed:", e);
  }
}

// Listen for pre-cache requests from the frontend
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "PRECACHE_MEDIA") {
    precacheAllMedia();
  }
});

// ─── Handle range requests from cached audio ───
async function handleRangeRequest(request, cache) {
  // Strip search params to match cache key
  const cacheKey = request.url.split("?")[0];
  const cachedResponse = await cache.match(cacheKey);

  if (!cachedResponse) {
    // If not in cache and we are offline, we fail. Otherwise, fetch.
    return fetch(request);
  }

  const blob = await cachedResponse.blob();
  const rangeHeader = request.headers.get("range");

  // Set up headers, copying CORS headers from the cached response
  const headers = new Headers();
  headers.set(
    "Content-Type",
    cachedResponse.headers.get("Content-Type") || "audio/mpeg",
  );
  headers.set("Accept-Ranges", "bytes");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Range");
  headers.set(
    "Access-Control-Expose-Headers",
    "Content-Range, Content-Length, Accept-Ranges, Content-Type",
  );

  // Copy any original CORS headers from the cached response just in case
  for (const [key, value] of cachedResponse.headers.entries()) {
    if (
      key.toLowerCase().startsWith("access-control-") ||
      key.toLowerCase() === "vary"
    ) {
      headers.set(key, value);
    }
  }

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : blob.size - 1;
    const chunk = blob.slice(start, end + 1);

    headers.set("Content-Range", `bytes ${start}-${end}/${blob.size}`);
    headers.set("Content-Length", String(chunk.size));

    return new Response(chunk, {
      status: 206,
      statusText: "Partial Content",
      headers,
    });
  }

  return new Response(blob, {
    status: 200,
    headers,
  });
}

// Background fetch of the full track to cache it for offline play
async function fetchAndCacheAudio(request) {
  const cacheKey = request.url.split("?")[0];
  const cache = await caches.open(AUDIO_CACHE);

  // Check if already fully cached
  const existing = await cache.match(cacheKey);
  if (existing) return;

  try {
    // Fetch full file by appending ?full=true to ignore Range header on server
    const fetchUrl = cacheKey + "?full=true";
    const response = await fetch(fetchUrl);
    if (response.ok && response.status === 200) {
      await cache.put(cacheKey, response.clone());
      console.log(`[SW] Cached full audio: ${cacheKey}`);
    } else {
      console.warn(
        `[SW] Unexpected response status caching full audio: ${response.status}`,
      );
    }
  } catch (err) {
    console.error("[SW] Failed to cache audio for offline:", err);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API streaming routes differently (Audio streaming — dev mode)
  if (url.pathname.includes("/api/stream/")) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) => {
        return handleRangeRequest(request, cache).then((response) => {
          // If we successfully fetched from network, trigger caching of full audio in background
          if (navigator.onLine) {
            event.waitUntil(fetchAndCacheAudio(request));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Handle static media file requests — serve from audio cache first (pre-cached)
  if (
    url.pathname.includes("/media/") &&
    (url.pathname.endsWith(".m4a") || url.pathname.endsWith(".mp3"))
  ) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (audioCache) => {
        const cacheKey = request.url.split("?")[0];
        const cachedResponse = await audioCache.match(cacheKey);

        if (cachedResponse) {
          // Serve from audio cache (pre-cached), handling range requests
          return handleRangeRequest(request, audioCache);
        }

        // Not in audio cache — try network, then cache the response
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok && request.method === "GET") {
            const clone = networkResponse.clone();
            audioCache.put(cacheKey, clone);
          }
          return networkResponse;
        } catch {
          // Last resort: check static cache
          const staticCached = await caches.match(request);
          if (staticCached) return staticCached;
          return new Response("Audio not available offline", { status: 503 });
        }
      }),
    );
    return;
  }

  // Network-First, Cache-Fallback strategy for other files
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for standard files
        if (
          response.ok &&
          request.method === "GET" &&
          !url.pathname.includes("/api/")
        ) {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: fallback to static cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // If HTML page request, return root page
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match(BASE_PATH);
          }
        });
      }),
  );
});
