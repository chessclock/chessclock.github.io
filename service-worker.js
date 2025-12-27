const CACHE_NAME = 'chess-clock-v3';
const STATIC_CACHE = 'chess-clock-static-v3';
const DYNAMIC_CACHE = 'chess-clock-dynamic-v3';

// Static assets to cache immediately
const staticAssets = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/index.html'
];

// SPA routes that should be handled by the router
const spaRoutes = [
  '/select-timer',
  '/custom-timer',
  '/test-offline'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(staticAssets))
      .then(() => {
        console.log('Static assets cached successfully');
        // Pre-cache the SPA routes as well by caching index.html with their URLs
        return caches.open(DYNAMIC_CACHE);
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Message event - handle communication from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - cache-first for static, network-first for pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle pages (HTML) - network first, fallback to cache, then SPA fallback
  if (request.headers.get('accept').includes('text/html')) {
    const urlPath = url.pathname;

    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // Check if this is a known SPA route or if we have it cached
          if (spaRoutes.includes(urlPath) || spaRoutes.some(route => urlPath.startsWith(route))) {
            // For SPA routes, always serve index.html
            return caches.match('/index.html')
              .then((indexResponse) => {
                if (indexResponse) return indexResponse;
                return caches.match('/');
              })
              .catch(() => {
                // If all else fails, return a minimal offline page
                return new Response(
                  '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Offline Mode</h1><p>This content is available offline.</p></body></html>',
                  {
                    headers: { 'Content-Type': 'text/html' }
                  }
                );
              });
          }

          // For other HTML requests, try cache first
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              // Fallback to cached index.html for SPA routes
              return caches.match('/index.html')
                .then((indexResponse) => {
                  if (indexResponse) return indexResponse;
                  return caches.match('/');
                })
                .catch(() => {
                  // If all else fails, return a minimal offline page
                  return new Response(
                    '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Offline Mode</h1><p>This content is available offline.</p></body></html>',
                    {
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            });
        })
    );
    return;
  }

  // Handle static assets (JS, CSS, images) - cache first
  if (url.pathname.startsWith('/_app/') ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.ico') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.woff2')) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(request)
            .then((response) => {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE)
                .then((cache) => cache.put(request, responseClone));
              return response;
            });
        })
    );
    return;
  }

  // Default - try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request)
          .then((response) => {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
            return response;
          });
      })
  );
});
