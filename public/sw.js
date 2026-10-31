// TelePakt.pl Service Worker
const CACHE_NAME = 'telepakt-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through to network, fallback gracefully
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
