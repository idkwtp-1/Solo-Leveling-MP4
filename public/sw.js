const CACHE_NAME = "slplayer-v3";
const STATIC_CACHE = "slplayer-static-v3";
const AUDIO_CACHE = "slplayer-audio-v3";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/fonts/orbitron-500.woff2",
  "/fonts/orbitron-700.woff2",
  "/fonts/orbitron-900.woff2",
  "/fonts/rajdhani-400.woff2",
  "/fonts/rajdhani-500.woff2",
  "/fonts/rajdhani-600.woff2",
  "/fonts/rajdhani-700.woff2",
  "/fonts/robotomono-400.woff2",
  "/fonts/robotomono-500.woff2",
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
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE && key !== AUDIO_CACHE) {
              return caches.delete(key);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Helper to serve range requests from cached full audio response
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

  // Handle API streaming routes differently (Audio streaming)
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
            return caches.match("/");
          }
        });
      }),
  );
});
