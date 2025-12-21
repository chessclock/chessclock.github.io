const CACHE_NAME = 'chess-clock-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/_app/immutable/entry/start.CYelfzmm.js',
  '/_app/immutable/entry/app.BU7XmNtv.js',
  // Add chunks dynamically or manually
  '/_app/immutable/chunks/BUAdWgoq.js',
  '/_app/immutable/chunks/BbZ0NC5Z.js',
  '/_app/immutable/chunks/BuT7AiQj.js',
  '/_app/immutable/chunks/C05r2OOC.js',
  '/_app/immutable/chunks/CP9F8S86.js',
  '/_app/immutable/chunks/DJMnb-ns.js',
  '/_app/immutable/chunks/DxpTYiqe.js',
  '/_app/immutable/chunks/f3mjG8Gw.js',
  '/_app/immutable/chunks/nsAxU84q.js',
  // Assets
  '/_app/immutable/assets/0.D4_o4iyJ.css',
  '/_app/immutable/assets/2.CxCDK-J_.css',
  '/_app/immutable/assets/3.KrfumMBl.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});