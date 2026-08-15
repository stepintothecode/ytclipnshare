// Caches the app so it opens instantly and works offline. YouTube is never
// cached. core/ sits outside this worker's folder, which is fine: the scope
// decides which pages it controls, and it sees every request those pages make.

const CACHE = 'ytclipnshare-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './src/ui.js',
  './src/iframe-player.js',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  '../core/index.js',
  '../core/time.js',
  '../core/clip-range.js',
  '../core/video-reference.js',
  '../core/youtube-embed.js',
  '../core/player-port.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin) return; // let YouTube requests through

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((hit) => hit ?? caches.match('./index.html')),
      ),
  );
});
